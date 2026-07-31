import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  purgeWebhookDeliveriesForShop,
  recordWebhookDelivery,
  releaseWebhookDelivery,
} from "../lib/webhook-delivery.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, webhookId } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Shopify retries uninstall — claim first so cascade work runs once.
  const delivery = await recordWebhookDelivery({
    shopDomain: shop,
    topic,
    webhookId,
    resourceId: "app",
  });
  if (!delivery.firstDelivery) {
    console.log(
      `Uninstall replay ignored shop=${shop} deliveryKey=${delivery.deliveryKey}`,
    );
    return new Response();
  }

  try {
    // Always clear sessions for this shop domain (match shop/redact) — session may
    // already be null on repeat deliveries, but other Session rows can remain.
    await db.session.deleteMany({ where: { shop } });

    // ComplianceDataExport and WebhookDelivery have no Shop FK — erase by domain
    // before the shop cascade.
    await db.complianceDataExport.deleteMany({ where: { shopDomain: shop } });
    await purgeWebhookDeliveriesForShop(shop);

    // Cascade deletes Settings + SpendEntry + OrderFact / CohortFact / Job via Prisma.
    await db.shop.deleteMany({ where: { domain: shop } });

    return new Response();
  } catch (error) {
    // Release so Shopify's retry can re-claim; leaving the row ACKs poison forever.
    await releaseWebhookDelivery(delivery.deliveryKey);
    throw error;
  }
};
