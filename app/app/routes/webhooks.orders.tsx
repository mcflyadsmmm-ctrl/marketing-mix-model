import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { enqueueJob } from "../lib/job-queue.server";
import { clearOrderFactDayCompleteSeal } from "../lib/order-facts.server";
import {
  extractOrderDirtyDayKey,
  extractOrderId,
  isOrderWebhookTopic,
  normalizeWebhookTopic,
  RECONCILE_SALES_DAY_JOB,
} from "../lib/order-webhook";
import {
  recordWebhookDelivery,
  releaseWebhookDelivery,
} from "../lib/webhook-delivery.server";

/**
 * Order webhooks: `orders/create`, `orders/updated`, `orders/cancelled`.
 *
 * This handler does NOT compute sales. It marks the affected shop-local day dirty
 * and ACKs, so Shopify's 5s budget is never spent on GraphQL pagination. The queue
 * worker recomputes the day's SalesDayFact. When shop IANA is known it also clears
 * the OrderFact `__day_complete__` seal so the next LTV backfill re-crawls nets
 * (refunds/cancels) — no second queue type.
 *
 * Level 1 only: order id and timestamp. `customer`, `email`, `phone`, addresses,
 * and line items are never read, logged, or persisted — the desk needs a dirty-day
 * signal, not a customer record. No pixels, no attribution.
 *
 * @see docs/ops/JOB_QUEUE.md
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // HMAC verification — throws 401 on a bad signature before any DB work.
  const { shop, topic, payload, webhookId, session } =
    await authenticate.webhook(request);
  const normalizedTopic = normalizeWebhookTopic(topic);

  if (!isOrderWebhookTopic(normalizedTopic)) {
    console.log(`Order webhook ignored unexpected topic=${normalizedTopic} shop=${shop}`);
    return new Response();
  }

  // Order events can still arrive after uninstall/redact. Without this the Shop
  // upsert below would resurrect a row we were just required to erase.
  if (!session) {
    console.log(
      `Order webhook topic=${normalizedTopic} shop=${shop} has no session (uninstalled) — acked without enqueue`,
    );
    return new Response();
  }

  const orderId = extractOrderId(payload);

  // Claim the delivery first: Shopify retries on any non-2xx and can deliver the
  // same event twice, so replays must be dropped before they enqueue work.
  const delivery = await recordWebhookDelivery({
    shopDomain: shop,
    topic: normalizedTopic,
    webhookId,
    resourceId: orderId,
  });

  if (!delivery.firstDelivery) {
    console.log(
      `Order webhook replay ignored topic=${normalizedTopic} shop=${shop} deliveryKey=${delivery.deliveryKey}`,
    );
    return new Response();
  }

  try {
    const shopRow = await prisma.shop.upsert({
      where: { domain: shop },
      create: { domain: shop },
      update: {},
      select: { id: true, ianaTimezone: true },
    });

    const dayKey = extractOrderDirtyDayKey(payload, shopRow.ianaTimezone);
    if (!dayKey) {
      // Never guess a day from server-local time — that would dirty the wrong fact.
      console.log(
        `Order webhook topic=${normalizedTopic} shop=${shop} has no usable timestamp — acked without enqueue`,
      );
      return new Response();
    }

    // OrderFact seals require IANA shop-local days (same keys as backfill).
    // Without timezone, fail closed: still reconcile SalesDayFact, but do not
    // clear a seal against a date-prefix guess that may not match the marker.
    if (shopRow.ianaTimezone) {
      const cleared = await clearOrderFactDayCompleteSeal(shopRow.id, dayKey);
      if (cleared > 0) {
        console.log(
          `Order webhook topic=${normalizedTopic} shop=${shop} clearedOrderFactDaySeal=${dayKey}`,
        );
      }
    }

    const job = await enqueueJob({
      shopId: shopRow.id,
      type: RECONCILE_SALES_DAY_JOB,
      dedupeKey: dayKey,
      payload: { day: dayKey, reason: normalizedTopic },
    });

    console.log(
      `Order webhook topic=${normalizedTopic} shop=${shop} dirtyDay=${dayKey} jobId=${job.jobId}`,
    );

    return new Response();
  } catch (error) {
    // Claim-then-poison: if work fails after a successful claim, release so
    // Shopify's retry is not dropped as a replay with no work queued.
    await releaseWebhookDelivery(delivery.deliveryKey);
    throw error;
  }
};
