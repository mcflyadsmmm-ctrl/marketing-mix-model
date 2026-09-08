import prisma from "../db.server";
import { normalizeWebhookTopic } from "./order-webhook";

/**
 * Idempotency guard for inbound Shopify webhooks.
 *
 * Shopify retries a delivery on any non-2xx or slow response and may also deliver
 * the same event twice on success, always reusing `X-Shopify-Webhook-Id`. Handlers
 * claim the delivery BEFORE doing work: the first caller wins the unique index,
 * every later caller learns it is a replay and just ACKs.
 *
 * If work fails after a successful claim, the handler MUST call
 * `releaseWebhookDelivery` and return 5xx so Shopify's retry can re-claim.
 * Leaving the row in place after a failed ACK poisons the delivery forever.
 */

export interface WebhookDeliveryClaim {
  /** False when this exact delivery was already recorded — do no work, ACK 200. */
  firstDelivery: boolean;
  deliveryKey: string;
  topic: string;
}

export interface RecordWebhookDeliveryInput {
  shopDomain: string;
  topic: unknown;
  /** `X-Shopify-Webhook-Id` from `authenticate.webhook` — the documented idempotency key. */
  webhookId?: string | null;
  /** Opaque Shopify resource id (order id). Never a customer identifier. */
  resourceId?: string | null;
  /** Used only to synthesize a key when webhookId is absent (manual replays, tests). */
  triggeredAt?: string | null;
}

/** Prisma unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Stable idempotency key for a delivery. Prefers Shopify's webhook id; falls back
 * to shop + topic + resource + trigger time so a replay without the header still
 * collapses instead of double-processing.
 */
export function buildDeliveryKey(input: RecordWebhookDeliveryInput): string {
  const topic = normalizeWebhookTopic(input.topic);
  const webhookId = input.webhookId?.trim();
  if (webhookId) return webhookId;
  return [
    input.shopDomain,
    topic,
    input.resourceId ?? "no-resource",
    input.triggeredAt ?? "no-timestamp",
  ].join(":");
}

/**
 * Claim a webhook delivery. Insert-then-catch (not read-then-insert) so two
 * concurrent retries of the same event cannot both see "unseen" and both process.
 *
 * On work failure after this returns `firstDelivery: true`, call
 * {@link releaseWebhookDelivery} before returning 5xx.
 */
export async function recordWebhookDelivery(
  input: RecordWebhookDeliveryInput,
): Promise<WebhookDeliveryClaim> {
  const topic = normalizeWebhookTopic(input.topic);
  const deliveryKey = buildDeliveryKey(input);

  try {
    await prisma.webhookDelivery.create({
      data: {
        deliveryKey,
        shopDomain: input.shopDomain,
        topic,
        resourceId: input.resourceId ?? null,
      },
    });
    return { firstDelivery: true, deliveryKey, topic };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { firstDelivery: false, deliveryKey, topic };
    }
    throw error;
  }
}

/**
 * Release a delivery claim so Shopify can retry after a post-claim failure
 * (e.g. enqueue threw). Without this, the ledger row makes every retry a
 * firstDelivery=false no-op and the dirty day never reconciles.
 */
export async function releaseWebhookDelivery(
  deliveryKey: string,
): Promise<boolean> {
  const result = await prisma.webhookDelivery.deleteMany({
    where: { deliveryKey },
  });
  return result.count > 0;
}

/**
 * Erase the delivery ledger for a shop domain. WebhookDelivery has no Shop FK
 * (deliveries can predate the Shop row), so uninstall/shop-redact must purge it
 * explicitly rather than relying on cascade.
 */
export async function purgeWebhookDeliveriesForShop(
  shopDomain: string,
): Promise<number> {
  const result = await prisma.webhookDelivery.deleteMany({
    where: { shopDomain },
  });
  return result.count;
}

/**
 * How long a delivery key must be remembered. Shopify gives up retrying an event
 * well inside 48h, so a week is generous; beyond that the row only costs storage.
 */
export const WEBHOOK_DELIVERY_RETENTION_DAYS = 7;

/**
 * Drop delivery keys older than the retention window. Without this the ledger grows
 * by one row per order event forever — the dominant table on a high-volume store.
 */
export async function purgeExpiredWebhookDeliveries(
  now: Date = new Date(),
): Promise<number> {
  const cutoff = new Date(
    now.getTime() - WEBHOOK_DELIVERY_RETENTION_DAYS * 86_400_000,
  );
  const result = await prisma.webhookDelivery.deleteMany({
    where: { receivedAt: { lt: cutoff } },
  });
  return result.count;
}
