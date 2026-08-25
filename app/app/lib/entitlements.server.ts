/**
 * Shop entitlements — Free (all spend channels) vs Pro ($39 = LTV + Goals).
 * See docs/BILLING_TIERS.md. Charges stay behind MCFLY_BILLING=1.
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

/** Comma-separated *.myshopify.com domains treated as Pro (design partners / QA). */
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
 * Pro when shop is in MCFLY_PRO_SHOPS override, or paidPro from Shopify Billing cache.
 */
export function isProShop(
  shopDomain: string,
  options?: { paidPro?: boolean },
): boolean {
  const domain = normalizeShopDomain(shopDomain);
  if (!domain) return false;
  if (parseProShopOverrideList().has(domain)) return true;
  if (options?.paidPro) return true;
  return false;
}

export type ShopEntitlements = {
  tier: BillingTier;
  isPro: boolean;
  /** Live Customer LTV (OrderFact / CohortFact). SAMPLE desk may preview without Pro. */
  canUseLiveLtv: boolean;
  /** Show LTV UI (live Pro or SAMPLE preview). */
  canUseLtv: boolean;
  canUseAdvancedGoals: boolean;
  canUseAdvancedClose: boolean;
  canUseAllChannels: boolean;
  /** Show Upgrade CTA — only when Billing is on and shop is Free. */
  showProTeaser: boolean;
  /** Show Manage plan CTA — Billing on and shop is Pro (App Store 1.2.3). */
  canManagePlan: boolean;
  allowedChannels: readonly SpendChannel[];
  upsell: typeof PRO_UPSELL;
};

export function getShopEntitlements(
  shopDomain: string,
  options?: { sampleDesk?: boolean; paidPro?: boolean },
): ShopEntitlements {
  const isPro = isProShop(shopDomain, { paidPro: options?.paidPro });
  const sampleDesk = Boolean(options?.sampleDesk);
  const billingOn = isBillingEnabled();
  const canUseLiveLtv = isPro;
  const canUseLtv = isPro || sampleDesk;
  const canUseAdvancedGoals = isPro || sampleDesk;
  const canUseAdvancedClose = isPro;
  const canUseAllChannels = true;
  const allowedChannels: readonly SpendChannel[] = SPEND_CHANNELS;

  return {
    tier: isPro ? "pro" : "free",
    isPro,
    canUseLiveLtv,
    canUseLtv,
    canUseAdvancedGoals,
    canUseAdvancedClose,
    canUseAllChannels,
    showProTeaser: !isPro && billingOn,
    canManagePlan: isPro && billingOn,
    allowedChannels,
    upsell: PRO_UPSELL,
  };
}

/** Resolve Pro from Shop.proBillingActive (DB) + MCFLY_PRO_SHOPS override. */
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
  _entitlements: ShopEntitlements,
  channel: string,
): boolean {
  return isFreeChannel(channel);
}

/** Known spend channels are Free. Unknown strings still fail closed. */
export function assertChannelsAllowed(
  _entitlements: ShopEntitlements,
  channels: Iterable<string>,
): string | null {
  const blocked = new Set<string>();
  for (const ch of channels) {
    if (!FREE_CHANNEL_SET.has(ch)) blocked.add(ch);
  }
  if (blocked.size === 0) return null;
  const list = [...blocked].sort().join(", ");
  return `Unknown spend channel: ${list}.`;
}

/**
 * Drop unknown channel strings. Named platforms stay on Free.
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
    avgOrdersD90: null,
    paybackDays: null,
    periodLabel,
  };
}
