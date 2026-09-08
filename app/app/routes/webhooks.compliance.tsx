import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  extractCustomerIdFromPayload,
  extractOrdersToRedactFromPayload,
  fulfillCustomerDataRequest,
  redactCustomerOrderFacts,
} from "../lib/compliance-redact.server";
import { enqueueJob } from "../lib/job-queue.server";
import { RECOMPUTE_COHORT_FACTS_JOB } from "../lib/order-webhook";
import {
  purgeWebhookDeliveriesForShop,
  recordWebhookDelivery,
  releaseWebhookDelivery,
} from "../lib/webhook-delivery.server";

/**
 * Mandatory App Store compliance webhooks.
 * Topics: customers/data_request, customers/redact, shop/redact
 *
 * Idempotent via WebhookDelivery (Shopify retries). Cohort rebuild after redact
 * is enqueued so ACK stays inside Shopify's 5s budget.
 *
 * Logs: shop + topic + counts only — never packageJson / amount dumps.
 *
 * @see https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, webhookId } = await authenticate.webhook(request);
  console.log(`Compliance webhook topic=${topic} shop=${shop}`);

  const normalized = String(topic || "").toUpperCase().replace(/\//g, "_");
  const customerId = extractCustomerIdFromPayload(payload);

  const delivery = await recordWebhookDelivery({
    shopDomain: shop,
    topic,
    webhookId,
    resourceId:
      normalized === "SHOP_REDACT" ? "shop" : (customerId ?? "no-customer"),
  });
  if (!delivery.firstDelivery) {
    console.log(
      `Compliance replay ignored topic=${topic} shop=${shop} deliveryKey=${delivery.deliveryKey}`,
    );
    return new Response();
  }

  try {
    if (normalized === "SHOP_REDACT") {
      // Shop.deleteMany cascades OrderFact / CohortFact / OrderBackfillState /
      // SalesDayFact / SpendEntry / Settings / MerSnapshot / Job / etc. (onDelete: Cascade).
      // ComplianceDataExport and WebhookDelivery have no Shop FK — delete by domain.
      await db.session.deleteMany({ where: { shop } });
      await db.complianceDataExport.deleteMany({ where: { shopDomain: shop } });
      await purgeWebhookDeliveriesForShop(shop);
      await db.shop.deleteMany({ where: { domain: shop } });
      console.log(`Compliance SHOP_REDACT shop=${shop} ok`);
      return new Response();
    }

    if (normalized === "CUSTOMERS_REDACT") {
      // Persist OrderFact rows keyed by opaque customerKey — erase those for this customer
      // plus any orders_to_redact (guest checkouts). No name/email/phone/address CRM.
      const ordersToRedact = extractOrdersToRedactFromPayload(payload);
      const result = await redactCustomerOrderFacts(
        shop,
        customerId,
        ordersToRedact,
        { recomputeCohorts: false },
      );
      if (result.shopId && result.deleted > 0) {
        await enqueueJob({
          shopId: result.shopId,
          type: RECOMPUTE_COHORT_FACTS_JOB,
          dedupeKey: "cohort",
          payload: { reason: "customers_redact" },
        });
      }
      console.log(
        `Compliance CUSTOMERS_REDACT shop=${shop} deleted=${result.deleted} keyVariants=${result.keys.length} orderIdVariants=${result.orderIds.length}`,
      );
      return new Response();
    }

    if (normalized === "CUSTOMERS_DATA_REQUEST") {
      // Level-1 package (order ids, amounts, dates, opaque customerKey) stored as
      // ComplianceDataExport for merchant/ops retrieval — not emailed PII.
      const result = await fulfillCustomerDataRequest(shop, customerId);
      console.log(
        `Compliance CUSTOMERS_DATA_REQUEST shop=${shop} exportId=${result.exportId ?? "none"} orderFactCount=${result.count}`,
      );
      return new Response();
    }

    return new Response();
  } catch (error) {
    // Claim-then-poison: if work fails after a successful claim, release so
    // Shopify's retry is not dropped as a replay with no work done.
    await releaseWebhookDelivery(delivery.deliveryKey);
    throw error;
  }
};
