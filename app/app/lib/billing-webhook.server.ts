/**
 * Apply APP_SUBSCRIPTIONS_UPDATE payload to Shop Pro cache.
 * Clears Pro when status is not ACTIVE (cancel / decline / expire).
 */

import prisma from "../db.server";
import { subscriptionMatchesProPlan } from "./billing-flag.server";
import {
  clearPaidCycle,
  normalizeBillingShopDomain,
  readPaidCycleEnd,
} from "./billing-cycle.server";
import { futureIso } from "./billing-subscription";

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
 * Update Shop.proBillingActive from a legacy APP_SUBSCRIPTIONS_UPDATE body.
 * Shopify App Pricing stopped sending this webhook after April 2026; the
 * Partner API sync is the source of truth. While the webhook still arrives,
 * CANCELLED keeps the desk when a paid cycle has not ended. DECLINED,
 * EXPIRED, and FROZEN do not.
 * Only mutates when the subscription name matches the flat plan (or known GID).
 */
export async function applyAppSubscriptionWebhook(
  shopDomain: string,
  payload: AppSubscriptionWebhookPayload,
  now: Date = new Date(),
): Promise<{ touched: boolean; active: boolean }> {
  const sub = payload.app_subscription;
  if (!sub) return { touched: false, active: false };

  const gid = sub.admin_graphql_api_id?.trim() || null;
  const name = sub.name ?? "";
  const status = (sub.status ?? "").toUpperCase();
  const domain = normalizeBillingShopDomain(shopDomain);

  const shop = await prisma.shop.findUnique({
    where: { domain },
    select: { id: true, proSubscriptionGid: true, proBillingActive: true },
  });
  const nameMatches = subscriptionMatchesProPlan(name);
  if (!shop) {
    if (!nameMatches || !proActiveFromSubscriptionStatus(status)) {
      return { touched: false, active: false };
    }
    await prisma.shop.create({
      data: {
        domain,
        proBillingActive: true,
        proSubscriptionGid: gid,
      },
    });
    return { touched: true, active: true };
  }

  const isOurPlan =
    nameMatches || (gid != null && shop.proSubscriptionGid === gid);
  if (!isOurPlan) return { touched: false, active: shop.proBillingActive };

  const paidEnd = await readPaidCycleEnd(domain);
  const paidStillRuns =
    futureIso(paidEnd ? paidEnd.toISOString() : null, now) != null;
  const cutsPaidPeriod = status === "EXPIRED" || status === "FROZEN";
  const active =
    proActiveFromSubscriptionStatus(status) ||
    (paidStillRuns && !cutsPaidPeriod);

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      proBillingActive: active,
      proSubscriptionGid: active ? gid ?? shop.proSubscriptionGid : null,
    },
  });
  if (!active) await clearPaidCycle(domain);
  return { touched: true, active };
}
