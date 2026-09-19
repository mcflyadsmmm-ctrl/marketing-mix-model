import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { enqueueJob } from "../lib/job-queue.server";
import { BACKFILL_SALES_DAY_FACTS_JOB } from "../lib/sales-facts.server";
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
    const current = payload.current as string[];
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
    if (current.includes("read_reports")) {
      const row = await db.shop.findUnique({
        where: { domain: shop },
        select: { id: true },
      });
      if (row) {
        await enqueueJob({
          shopId: row.id,
          type: BACKFILL_SALES_DAY_FACTS_JOB,
          dedupeKey: "reports-scope",
          payload: { reason: "read_reports" },
          maxAttempts: 40,
        });
      }
    }
    return new Response();
  } catch (error) {
    // Release so Shopify's retry can re-claim; leaving the row ACKs poison forever.
    await releaseWebhookDelivery(delivery.deliveryKey);
    throw error;
  }
};
