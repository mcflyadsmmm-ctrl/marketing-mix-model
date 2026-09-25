import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { enqueueJob } from "../lib/job-queue.server";
import { shopLocalDayKey } from "../lib/shop-local-day";
import {
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
 * This handler does NOT compute sales and does NOT restart the 24-month backfill.
 * orders/create and orders/updated enqueue a reconcile for shop-local today only.
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

    const timeZone = shopRow.ianaTimezone?.trim();
    if (!timeZone) {
      console.log(
        `Order webhook topic=${normalizedTopic} shop=${shop} has no timezone — acked without a history pull`,
      );
      return new Response();
    }
    const todayKey = shopLocalDayKey(new Date(), timeZone);
    const job = await enqueueJob({
      shopId: shopRow.id,
      type: RECONCILE_SALES_DAY_JOB,
      dedupeKey: todayKey,
      payload: { day: todayKey, reason: normalizedTopic },
    });

    console.log(
      `Order webhook topic=${normalizedTopic} shop=${shop} today=${todayKey} jobId=${job.jobId}`,
    );

    return new Response();
  } catch (error) {
    // Claim-then-poison: if work fails after a successful claim, release so
    // Shopify's retry is not dropped as a replay with no work queued.
    await releaseWebhookDelivery(delivery.deliveryKey);
    throw error;
  }
};
