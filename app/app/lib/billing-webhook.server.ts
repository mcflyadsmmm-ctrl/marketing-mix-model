/**
 * Apply APP_SUBSCRIPTIONS_UPDATE payload to Shop Pro cache.
 * Clears Pro when status is not ACTIVE (cancel / decline / expire).
 */

import prisma from "../db.server";
import { subscriptionMatchesProPlan } from "./billing-flag.server";

export type AppSubscriptionWebhookPayload = {
  app_subscription?: {
    admin_graphql_api_id?: string;
    name?: string;
    status?: string;
    admin_graphql_api_shop_id?: string;
  };
};

export function proActiveFromSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return (status ?? "").toUpperCase() === "ACTIVE";
}

/**
 * Update Shop.proBillingActive from webhook body for this shop domain.
 * Only mutates when the subscription name matches Mcfly Pro (or known GID).
 */
export async function applyAppSubscriptionWebhook(
  shopDomain: string,
  payload: AppSubscriptionWebhookPayload,
): Promise<{ touched: boolean; active: boolean }> {
  const sub = payload.app_subscription;
  if (!sub) return { touched: false, active: false };

  const gid = sub.admin_graphql_api_id?.trim() || null;
  const name = sub.name ?? "";
  const status = sub.status ?? "";
  const domain = shopDomain.trim().toLowerCase();

  const shop = await prisma.shop.findUnique({
    where: { domain },
    select: { id: true, proSubscriptionGid: true, proBillingActive: true },
  });
  if (!shop) return { touched: false, active: false };

  const isOurPlan =
    subscriptionMatchesProPlan(name) ||
    (gid != null && shop.proSubscriptionGid === gid);
  if (!isOurPlan) return { touched: false, active: shop.proBillingActive };

  const active = proActiveFromSubscriptionStatus(status);
  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      proBillingActive: active,
      proSubscriptionGid: active ? gid ?? shop.proSubscriptionGid : null,
    },
  });
  return { touched: true, active };
}
