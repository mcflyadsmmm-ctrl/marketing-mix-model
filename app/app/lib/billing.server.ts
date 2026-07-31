/**
 * Shopify Billing scaffold — Pro $39 flat / store / mo at launch.
 * Does NOT call Billing API until isBillingEnabled() (MCFLY_BILLING=1).
 * Religion: flat desk fee, never GMV tax; listing Free until announce.
 */

import {
  billingStatusCopy,
  isBillingEnabled,
  PRO_PLAN,
  type BillingTier,
} from "./billing-flag.server";
import {
  FREE_FEATURE_BULLETS,
  getShopEntitlements,
  PRO_FEATURE_BULLETS,
  PRO_UPSELL,
  type ShopEntitlements,
} from "./entitlements.server";

export type ShopBillingSnapshot = {
  enabled: boolean;
  /** Entitlement tier for this shop (override / future subscription). */
  tier: BillingTier;
  planName: string;
  amount: number;
  currencyCode: string;
  headline: string;
  detail: string;
  upgradeCta: string;
  freeBullets: readonly string[];
  proBullets: readonly string[];
  entitlements: ShopEntitlements;
  /**
   * When enabled, wire `billing.request` / appSubscriptionCreate here.
   * Stub returns null confirmation URL until flag + Partner billing setup.
   */
  confirmationUrl: string | null;
};

export function getShopBillingSnapshot(
  shopDomain: string,
  options?: { sampleDesk?: boolean },
): ShopBillingSnapshot {
  const enabled = isBillingEnabled();
  const entitlements = getShopEntitlements(shopDomain, options);
  const copy = billingStatusCopy(enabled);
  return {
    enabled,
    tier: entitlements.tier,
    planName: PRO_PLAN.name,
    amount: PRO_PLAN.amount,
    currencyCode: PRO_PLAN.currencyCode,
    headline: entitlements.isPro
      ? "Pro · unlocked"
      : copy.headline,
    detail: entitlements.isPro
      ? "This shop has Pro entitlements (override or subscription). Flat fee path — not GMV tax."
      : copy.detail,
    upgradeCta: PRO_UPSELL.upgradeCta,
    freeBullets: FREE_FEATURE_BULLETS,
    proBullets: PRO_FEATURE_BULLETS,
    entitlements,
    confirmationUrl: null,
  };
}

/**
 * Future: create AppSubscription via Shopify Billing when MCFLY_BILLING=1
 * and founder has announced paid. Returns confirmation URL for redirect.
 */
export async function requestProSubscription(_input: {
  shopDomain: string;
  returnUrl: string;
}): Promise<{ ok: false; error: string } | { ok: true; confirmationUrl: string }> {
  if (!isBillingEnabled()) {
    return {
      ok: false,
      error:
        "Billing is not enabled (MCFLY_BILLING≠1). Listing stays Free until Pro is announced. Design partners: set MCFLY_PRO_SHOPS.",
    };
  }
  return {
    ok: false,
    error:
      "Pro subscription GraphQL not wired yet — enable after design-partner smoke + Partner Billing setup (HUMAN_GATE).",
  };
}
