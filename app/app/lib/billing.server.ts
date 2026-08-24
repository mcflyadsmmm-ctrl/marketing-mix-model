/**
 * Shopify App Pricing — Free + Pro $39 flat / store / mo.
 * Public apps use Shopify-hosted plan selection (not appSubscriptionCreate).
 * Docs: https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing
 *
 * Religion: flat desk fee, never GMV tax.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  billingStatusCopy,
  isBillingEnabled,
  PRO_PLAN,
  subscriptionMatchesProPlan,
  type BillingTier,
} from "./billing-flag.server";
import {
  FREE_FEATURE_BULLETS,
  getShopEntitlements,
  PRO_FEATURE_BULLETS,
  PRO_UPSELL,
  type ShopEntitlements,
} from "./entitlements.server";

export { subscriptionMatchesProPlan } from "./billing-flag.server";

const ACTIVE_SUBSCRIPTIONS_QUERY = `#graphql
  query McflyActiveAppSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        test
      }
    }
  }
`;

type ActiveSubscriptionsJson = {
  data?: {
    currentAppInstallation?: {
      activeSubscriptions?: Array<{
        id?: string | null;
        name?: string | null;
        status?: string | null;
        test?: boolean | null;
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

export type ShopBillingSnapshot = {
  enabled: boolean;
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
  confirmationUrl: string | null;
  /** True when host still has MCFLY_BILLING_TEST=1 (dev-store testing note). */
  testCharges: boolean;
};

/** Dev-store testing note only — Shopify App Pricing handles test plans in Partner. */
export function shouldUseTestCharges(): boolean {
  return process.env.MCFLY_BILLING_TEST === "1";
}

/** App handle for Shopify-hosted plan selection URLs (`shopify.app.toml` handle). */
export function getShopifyAppHandle(): string {
  const fromEnv = process.env.SHOPIFY_APP_HANDLE?.trim();
  if (fromEnv) return fromEnv;
  // Matches Partner handle / early version prefix `mcfly-analytics-public-*`.
  return "mcfly-analytics-public";
}

export function storeHandleFromShopDomain(shopDomain: string): string {
  return shopDomain
    .trim()
    .toLowerCase()
    .replace(/\.myshopify\.com$/i, "")
    .replace(/\/$/, "");
}

/**
 * Shopify App Pricing plan picker (Free + Pro).
 * https://admin.shopify.com/store/:store/charges/:app_handle/pricing_plans
 */
export function buildManagedPricingPlansUrl(shopDomain: string): string {
  const store = storeHandleFromShopDomain(shopDomain);
  const appHandle = getShopifyAppHandle();
  if (!store || !appHandle) {
    throw new Error("Cannot build plan URL without shop domain and app handle");
  }
  return `https://admin.shopify.com/store/${store}/charges/${appHandle}/pricing_plans`;
}

export function pickActiveProSubscription(
  subs: Array<{
    id?: string | null;
    name?: string | null;
    status?: string | null;
  }>,
): { id: string; name: string } | null {
  for (const sub of subs) {
    const status = (sub.status ?? "").toUpperCase();
    if (status !== "ACTIVE") continue;
    if (!subscriptionMatchesProPlan(sub.name)) continue;
    if (!sub.id) continue;
    return { id: sub.id, name: sub.name ?? PRO_PLAN.name };
  }
  return null;
}

export async function fetchActiveAppSubscriptions(
  admin: AdminApiContext,
): Promise<
  Array<{ id: string; name: string; status: string; test: boolean }>
> {
  const response = await admin.graphql(ACTIVE_SUBSCRIPTIONS_QUERY);
  const json = (await response.json()) as ActiveSubscriptionsJson;
  if (json.errors?.length) {
    throw new Error(
      json.errors.map((e) => e.message).filter(Boolean).join("; ") ||
        "Shopify Billing query failed",
    );
  }
  const raw =
    json.data?.currentAppInstallation?.activeSubscriptions ?? [];
  return raw
    .filter((s): s is { id: string; name: string; status: string; test: boolean } =>
      Boolean(s?.id && s.name && s.status),
    )
    .map((s) => ({
      id: s.id!,
      name: s.name!,
      status: s.status!,
      test: Boolean(s.test),
    }));
}

/**
 * Pull active subscriptions from Shopify and cache Pro on Shop.
 * Works with Shopify App Pricing (legacy Admin activeSubscriptions).
 */
export async function syncShopProFromShopify(
  admin: AdminApiContext,
  shopId: string,
): Promise<{ active: boolean; subscriptionGid: string | null }> {
  const subs = await fetchActiveAppSubscriptions(admin);
  const pro = pickActiveProSubscription(subs);
  const active = pro != null;
  const subscriptionGid = pro?.id ?? null;
  await prisma.shop.update({
    where: { id: shopId },
    data: {
      proBillingActive: active,
      proSubscriptionGid: subscriptionGid,
    },
  });
  return { active, subscriptionGid };
}

export function getShopBillingSnapshot(
  shopDomain: string,
  options?: { sampleDesk?: boolean; paidPro?: boolean },
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
      ? "This shop has Pro (Shopify App Pricing). Flat $39 — not a GMV tax."
      : copy.detail,
    upgradeCta: PRO_UPSELL.upgradeCta,
    freeBullets: FREE_FEATURE_BULLETS,
    proBullets: PRO_FEATURE_BULLETS,
    entitlements,
    confirmationUrl: null,
    testCharges: shouldUseTestCharges(),
  };
}

/**
 * Open Shopify-hosted Free/Pro plan selection (App Pricing).
 * Does not call appSubscriptionCreate — Managed Pricing apps cannot.
 *
 * Always returns the plan URL when billing is on — including for shops that
 * already have Pro — so merchants can upgrade OR downgrade without reinstall
 * (App Store 1.2.3). Syncs Pro cache when an active Pro sub is found.
 */
export async function requestProSubscription(input: {
  admin: AdminApiContext;
  shopDomain: string;
  returnUrl?: string;
}): Promise<{ ok: false; error: string } | { ok: true; confirmationUrl: string }> {
  void input.returnUrl;
  if (!isBillingEnabled()) {
    return {
      ok: false,
      error:
        "Pro plans are temporarily unavailable. Try again shortly, or contact support from Settings.",
    };
  }

  try {
    const existing = await fetchActiveAppSubscriptions(input.admin);
    const alreadyPro = pickActiveProSubscription(existing);
    if (alreadyPro) {
      const shop = await prisma.shop.findUnique({
        where: { domain: input.shopDomain.trim().toLowerCase() },
        select: { id: true },
      });
      if (shop) {
        await prisma.shop.update({
          where: { id: shop.id },
          data: {
            proBillingActive: true,
            proSubscriptionGid: alreadyPro.id,
          },
        });
      }
      // Still open Managed Pricing so the merchant can change/downgrade plans.
    }
  } catch {
    // Still open plan page — sync may work after approve.
  }

  try {
    return {
      ok: true,
      confirmationUrl: buildManagedPricingPlansUrl(input.shopDomain),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not build plan selection URL",
    };
  }
}

/** Absolute return URL for embedded Settings after plan change (welcome link). */
export function buildBillingReturnUrl(input: {
  requestUrl: string;
  shopDomain: string;
}): string {
  const req = new URL(input.requestUrl);
  const origin =
    process.env.SHOPIFY_APP_URL?.replace(/\/$/, "") || req.origin;
  const returnUrl = new URL("/app/settings", `${origin}/`);
  returnUrl.searchParams.set("shop", input.shopDomain);
  const host = req.searchParams.get("host");
  if (host) returnUrl.searchParams.set("host", host);
  const embedded = req.searchParams.get("embedded");
  if (embedded) returnUrl.searchParams.set("embedded", embedded);
  return returnUrl.toString();
}
