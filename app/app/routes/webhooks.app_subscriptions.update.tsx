import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  applyAppSubscriptionWebhook,
  type AppSubscriptionWebhookPayload,
} from "../lib/billing-webhook.server";
import {
  recordWebhookDelivery,
  releaseWebhookDelivery,
} from "../lib/webhook-delivery.server";

/**
 * APP_SUBSCRIPTIONS_UPDATE — keep Shop.proBillingActive in sync on
 * activate / cancel / decline / expire (do not rely on Settings visits alone).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, webhookId, payload } =
    await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const delivery = await recordWebhookDelivery({
    shopDomain: shop,
    topic,
    webhookId,
    resourceId: "app_subscription",
  });
  if (!delivery.firstDelivery) {
    return new Response();
  }

  try {
    await applyAppSubscriptionWebhook(
      shop,
      payload as AppSubscriptionWebhookPayload,
    );
    return new Response();
  } catch (error) {
    await releaseWebhookDelivery(delivery.deliveryKey);
    throw error;
  }
};
