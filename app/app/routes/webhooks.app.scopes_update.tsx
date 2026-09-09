import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  applyReadAllOrdersGrant,
  persistGrantedScopesOnSession,
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
      // updateMany: missing Session must not 5xx (uninstall race → Partner failures).
      const persisted = await persistGrantedScopesOnSession(session.id, current);
      if (!persisted.updated) {
        console.log(
          `scopes_update shop=${shop} session=${session.id} missing — skipped scope write`,
        );
      }
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
