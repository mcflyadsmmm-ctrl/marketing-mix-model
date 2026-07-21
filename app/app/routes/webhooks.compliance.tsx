import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Mandatory App Store compliance webhooks.
 * Topics: customers/data_request, customers/redact, shop/redact
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received compliance webhook ${topic} for ${shop}`);

  const normalized = String(topic || "").toUpperCase().replace(/\//g, "_");

  if (normalized === "SHOP_REDACT") {
    await db.session.deleteMany({ where: { shop } });
    await db.shop.deleteMany({ where: { domain: shop } });
  }

  // customers/data_request + customers/redact: Mcfly stores aggregates/spend, not a CRM.
  return new Response();
};
