import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  countCustomerOrderFacts,
  extractCustomerIdFromPayload,
  redactCustomerOrderFacts,
} from "../lib/compliance-redact.server";

/**
 * Mandatory App Store compliance webhooks.
 * Topics: customers/data_request, customers/redact, shop/redact
 *
 * @see https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received compliance webhook ${topic} for ${shop}`);

  const normalized = String(topic || "").toUpperCase().replace(/\//g, "_");

  if (normalized === "SHOP_REDACT") {
    // Shop.deleteMany cascades OrderFact / CohortFact / OrderBackfillState /
    // SalesDayFact / SpendEntry / Settings / MerSnapshot / etc. (onDelete: Cascade).
    await db.session.deleteMany({ where: { shop } });
    await db.shop.deleteMany({ where: { domain: shop } });
    console.log(`Compliance SHOP_REDACT for ${shop}: shop record + cascaded facts deleted`);
    return new Response();
  }

  const customerId = extractCustomerIdFromPayload(payload);

  if (normalized === "CUSTOMERS_REDACT") {
    // Persist OrderFact rows keyed by opaque customerKey — erase those for this customer.
    // No name/email/phone/address CRM; still must delete matching OrderFacts.
    const result = await redactCustomerOrderFacts(shop, customerId);
    console.log(
      `Compliance CUSTOMERS_REDACT for ${shop}: deleted ${result.deleted} OrderFact(s) keys=${JSON.stringify(result.keys)}`,
    );
    return new Response();
  }

  if (normalized === "CUSTOMERS_DATA_REQUEST") {
    // Honest: we store opaque order facts (order ids, amounts, dates, opaque customerKey).
    // No email/name/phone/address PII to export — Shopify expects 200; log count only.
    const result = await countCustomerOrderFacts(shop, customerId);
    console.log(
      `Compliance CUSTOMERS_DATA_REQUEST for ${shop}: opaque OrderFact count=${result.count} keys=${JSON.stringify(result.keys)} (no email PII to export)`,
    );
    return new Response();
  }

  return new Response();
};
