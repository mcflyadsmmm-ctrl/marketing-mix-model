import { shopLocalDayKey } from "./shop-local-day";

/**
 * Pure extraction helpers for `orders/create|updated|cancelled` webhooks.
 *
 * Level 1 only: we read the order's id and its timestamp. We deliberately never
 * touch `customer`, `email`, `phone`, `billing_address`, `shipping_address`, or
 * `line_items` — the cash desk needs a dirty-day signal, not a CRM.
 */

/** Job type for "this shop-local day's SalesDayFact is stale, recompute it." */
export const RECONCILE_SALES_DAY_JOB = "reconcile_sales_day";

/** After customers/redact deletes OrderFacts — rebuild till LTV cohorts off the ACK path. */
export const RECOMPUTE_COHORT_FACTS_JOB = "recompute_cohort_facts";

/** Order topics this app subscribes to, in the normalized `ORDERS_CREATE` shape. */
export const ORDER_WEBHOOK_TOPICS = [
  "ORDERS_CREATE",
  "ORDERS_UPDATED",
  "ORDERS_CANCELLED",
] as const;

export type OrderWebhookTopic = (typeof ORDER_WEBHOOK_TOPICS)[number];

/**
 * Normalize a webhook topic to the `ORDERS_CREATE` shape. Shopify and the app
 * library have both used `orders/create` and `ORDERS_CREATE` over time, so callers
 * must not switch on the raw value.
 */
export function normalizeWebhookTopic(topic: unknown): string {
  return String(topic ?? "")
    .toUpperCase()
    .replace(/\//g, "_")
    .trim();
}

export function isOrderWebhookTopic(topic: unknown): topic is OrderWebhookTopic {
  return (ORDER_WEBHOOK_TOPICS as readonly string[]).includes(
    normalizeWebhookTopic(topic),
  );
}

/**
 * Opaque Shopify order id for the delivery ledger — numeric id preferred, GID
 * accepted. Returns null rather than inventing a value.
 */
export function extractOrderId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const numeric = record.id;
  if (typeof numeric === "number" && Number.isFinite(numeric)) {
    return String(numeric);
  }
  if (typeof numeric === "string" && numeric.trim()) return numeric.trim();
  const gid = record.admin_graphql_api_id;
  if (typeof gid === "string" && gid.trim()) return gid.trim();
  return null;
}

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;

function timestampCandidates(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  // created_at is the day the sale lands on. A cancel or refund arriving today
  // dirties the ORIGINAL order day, not today.
  return ["created_at", "processed_at"]
    .map((key) => record[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

/**
 * Shop-local calendar day (YYYY-MM-DD) whose SalesDayFact this order affects.
 *
 * When the shop's IANA timezone is known we derive the key the same way the ingest
 * lane does, so webhook-dirtied days match backfilled days exactly. When it is not
 * known we fall back to the date prefix of Shopify's timestamp, which already
 * carries the shop's UTC offset (e.g. `2026-07-27T23:40:00-05:00` → `2026-07-27`).
 *
 * Returns null when no usable timestamp is present — the caller should ACK and log
 * rather than enqueue a job against a guessed day.
 */
export function extractOrderDirtyDayKey(
  payload: unknown,
  timeZone: string | null | undefined,
): string | null {
  for (const raw of timestampCandidates(payload)) {
    if (timeZone) {
      const instant = new Date(raw);
      if (!Number.isNaN(instant.getTime())) {
        return shopLocalDayKey(instant, timeZone);
      }
    }
    const prefix = DATE_PREFIX.exec(raw);
    if (prefix) return prefix[1];
  }
  return null;
}
