/**
 * Shop entitlements — one $39 desk (7-day trial), not a Free App Store plan.
 * See docs/BILLING_TIERS.md.
 */

import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";
import { isBillingEnabled, type BillingTier } from "./billing-flag.server";
import {
  FREE_CHANNELS,
  FREE_CHANNEL_SET,
  isFreeChannel,
  PRO_UPSELL,
} from "./entitlements";
import prisma from "../db.server";

export {
  FREE_CHANNELS,
  FREE_CHANNEL_SET,
  FREE_FEATURE_BULLETS,
  isFreeChannel,
  PRO_CHANNELS,
  PRO_FEATURE_BULLETS,
  PRO_UPSELL,
} from "./entitlements";

function normalizeShopDomain(shopDomain: string): string {
  return shopDomain.trim().toLowerCase();
}

/** Comma-separated *.myshopify.com domains treated as billed (design partners / QA). */
export function parseProShopOverrideList(
  raw: string | undefined = process.env.MCFLY_PRO_SHOPS,
): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => normalizeShopDomain(s))
      .filter(Boolean),
  );
}

/**
 * Billed / override shop (Shopify App Pricing cache or MCFLY_PRO_SHOPS).
 * Feature access does **not** wait on this — unpaid/trial first session is the full desk.
 */
export function isProShop(
  shopDomain: string,
  options?: { paidPro?: boolean },
): boolean {
  const domain = normalizeShopDomain(shopDomain);
  if (!domain) return false;
  if (parseProShopOverrideList().has(domain)) return true;
  if (options?.paidPro) return true;
  void isBillingEnabled;
  return false;
}

export type ShopEntitlements = {
  /** `pro` = billed/override; `free` = not yet billed — not a product plan. */
  tier: BillingTier;
  isPro: boolean;
  /** Live Customer LTV (OrderFact / CohortFact). On the $39 desk during trial. */
  canUseLiveLtv: boolean;
  /** Show LTV UI (desk — SAMPLE is preview data, not an unlock). */
  canUseLtv: boolean;
  canUseAdvancedGoals: boolean;
  canUseAdvancedClose: boolean;
  canUseAllChannels: boolean;
  showProTeaser: boolean;
  allowedChannels: readonly SpendChannel[];
  upsell: typeof PRO_UPSELL;
};

export function getShopEntitlements(
  shopDomain: string,
  options?: { sampleDesk?: boolean; paidPro?: boolean },
): ShopEntitlements {
  const isPro = isProShop(shopDomain, { paidPro: options?.paidPro });
  // SAMPLE is preview data only — never a feature gate.
  void options?.sampleDesk;

  return {
    tier: isPro ? "pro" : "free",
    isPro,
    canUseLiveLtv: true,
    canUseLtv: true,
    canUseAdvancedGoals: true,
    canUseAdvancedClose: true,
    canUseAllChannels: true,
    showProTeaser: false,
    allowedChannels: SPEND_CHANNELS,
    upsell: PRO_UPSELL,
  };
}

/** Resolve billing cache from Shop.proBillingActive (DB) + MCFLY_PRO_SHOPS override. */
export async function resolveShopEntitlements(
  shopDomain: string,
  options?: { sampleDesk?: boolean },
): Promise<ShopEntitlements> {
  const domain = normalizeShopDomain(shopDomain);
  const shop = domain
    ? await prisma.shop.findUnique({
        where: { domain },
        select: { proBillingActive: true },
      })
    : null;
  return getShopEntitlements(domain, {
    sampleDesk: options?.sampleDesk,
    paidPro: Boolean(shop?.proBillingActive),
  });
}

export function canUseChannel(
  entitlements: ShopEntitlements,
  channel: string,
): boolean {
  if (entitlements.canUseAllChannels) return true;
  return isFreeChannel(channel);
}

/** Returns an error message if any channel is outside the shop's plan. */
export function assertChannelsAllowed(
  entitlements: ShopEntitlements,
  channels: Iterable<string>,
): string | null {
  if (entitlements.canUseAllChannels) return null;
  const blocked = new Set<string>();
  for (const ch of channels) {
    if (!FREE_CHANNEL_SET.has(ch)) blocked.add(ch);
  }
  if (blocked.size === 0) return null;
  const list = [...blocked].sort().join(", ");
  return `Channel(s) not on this desk: ${list}. The $39 desk (7-day trial) includes every named platform (${PRO_UPSELL.short}).`;
}

/**
 * Live desks: keep only entitled channel rows.
 * The $39 desk includes every named channel — this is a no-op unless a
 * caller constructs a restricted entitlement object.
 */
export function filterToAllowedChannels<T extends { channel: string }>(
  entitlements: ShopEntitlements,
  entries: T[],
): T[] {
  if (entitlements.canUseAllChannels) return entries;
  const allowed = new Set<string>(entitlements.allowedChannels);
  return entries.filter((e) => allowed.has(e.channel));
}

export function proRequiredLtvSummary(periodLabel: string | null = null) {
  return {
    available: false as const,
    historyLimited: false,
    emptyReason: "pro_required" as const,
    cohortCount: 0,
    avgRevenueD30: null,
    avgRevenueD90: null,
    avgRevenueD365: null,
    cashCac: null,
    newBuyers: 0,
    ltvCacRatio: null,
    cohorts: [],
    repeatRate: null,
    buyerRepeat: {
      buyers: 0,
      secondWithin30: null,
      secondWithin60: null,
      secondWithin90: null,
      medianDaysToSecond: null,
      firstOrderRevenue: 0,
      subsequentRevenue: 0,
      firstOrderRevenueShare: null,
      subsequentRevenueShare: null,
    },
    buyerConcentration: {
      buyers: 0,
      totalRevenue: 0,
      top10Share: null,
      top20Share: null,
      topBuyerShare: null,
      topBuyerRevenue: 0,
    },
    
    periodOrderMix: {
      firstOrderRevenue: 0,
      subsequentRevenue: 0,
      firstOrderRevenueShare: null,
      subsequentRevenueShare: null,
      firstOrderCount: 0,
      subsequentOrderCount: 0,
    },
    periodLabel,
  };
}
