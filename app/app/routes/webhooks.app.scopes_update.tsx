import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  applyReadAllOrdersGrant,
  readScopesUpdateLists,
} from "../lib/scopes-update.server";
import {
  recordWebhookDelivery,
  releaseWebhookDelivery,
} from "../lib/webhook-delivery.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop, webhookId } =
    await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const delivery = await recordWebhookDelivery({
    shopDomain: shop,
    topic,
    webhookId,
    resourceId: session?.id ?? "no-session",
  });
  if (!delivery.firstDelivery) {
    return new Response();
  }

  try {
    const { current, previous } = readScopesUpdateLists(payload);
    if (session) {
      await db.session.update({
        where: {
          id: session.id,
        },
        data: {
          scope: current.toString(),
        },
      });
    }
    // Fast ACK path: clear stuck historyLimited + enqueue deep backfill.
    const grant = await applyReadAllOrdersGrant({
      shopDomain: shop,
      current,
      previous,
    });
    if (grant.enqueued) {
      console.log(
        `scopes_update shop=${shop} read_all_orders clearedLimited=${grant.clearedHistoryLimited} gained=${grant.gainedReadAllOrders}`,
      );
    }
    return new Response();
  } catch (error) {
    // Release so Shopify's retry can re-claim; leaving the row ACKs poison forever.
    await releaseWebhookDelivery(delivery.deliveryKey);
    throw error;
  }
};
