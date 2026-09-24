/**
 * Shopify App Pricing — one plan, $39 flat / store / mo after a 7-day trial.
 * Public apps use Shopify-hosted plan selection (not appSubscriptionCreate).
 * Subscription state comes from the Partner API activeSubscription query.
 * The Admin activeSubscriptions query is only a legacy Billing API fallback.
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
  clearPaidCycle,
  readPaidCycleEnd,
  writePaidCycle,
} from "./billing-cycle.server";
import { decideSubscriptionAccess, type PartnerView } from "./billing-subscription";
import {
  DESK_FEATURE_BULLETS,
  getShopEntitlements,
  PRO_UPSELL,
  type ShopEntitlements,
} from "./entitlements.server";
import {
  queryPartnerActiveSubscription,
  readPartnerBillingConfig,
  shopifyGid,
  type ParsedPartnerSubscription,
} from "./partner-subscription.server";

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

const SHOP_ID_QUERY = `#graphql
  query McflyShopId {
    shop {
      id
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
  /** One plan, one list of what the desk includes. */
  deskBullets: readonly string[];
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
 * Shopify App Pricing plan picker (one plan, full-access trial then paid).
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

function partnerViewFromParsed(parsed: ParsedPartnerSubscription): PartnerView {
  switch (parsed.status) {
    case "error":
      return { status: "unavailable" };
    case "tiered":
    case "none":
      return { status: "none" };
    case "flat":
      return {
        status: "flat",
        inTrial: parsed.inTrial,
        paidCycleEndsAt: parsed.paidCycleEndsAt,
        cancelAtEndOfCycle: parsed.cancelAtEndOfCycle,
        legacySubscriptionId: parsed.legacySubscriptionId,
      };
    default: {
      const _exhaustive: never = parsed;
      throw new Error(`Unhandled subscription parse: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

async function fetchShopGid(admin: AdminApiContext): Promise<string | null> {
  const response = await admin.graphql(SHOP_ID_QUERY);
  const json = (await response.json()) as {
    data?: { shop?: { id?: string | null } };
    errors?: Array<{ message?: string }>;
  };
  if (json.errors?.length) return null;
  const id = json.data?.shop?.id?.trim();
  return id ? shopifyGid("Shop", id) : null;
}

/**
 * Pull the Shopify App Pricing contract (Partner API) and cache it on Shop.
 * A flat trial or paid contract entitles the desk. A paid cycle end is kept
 * after the contract disappears so that period can run out. A tiered price
 * is not this plan. Missing Partner credentials do not wipe a cached grant.
 */
export async function syncShopProFromShopify(
  admin: AdminApiContext,
  shopId: string,
): Promise<{ active: boolean; subscriptionGid: string | null }> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, domain: true, proBillingActive: true, proSubscriptionGid: true },
  });
  if (!shop) return { active: false, subscriptionGid: null };

  const now = new Date();
  const storedEnd = await readPaidCycleEnd(shop.domain);
  const config = readPartnerBillingConfig();
  let partner: PartnerView;
  if (!config) {
    partner = { status: "unconfigured" };
  } else {
    try {
      const shopGid = await fetchShopGid(admin);
      if (!shopGid) {
        partner = { status: "unavailable" };
      } else {
        const parsed = await queryPartnerActiveSubscription({
          config,
          shopGid,
          now,
        });
        partner = partnerViewFromParsed(parsed);
      }
    } catch {
      partner = { status: "unavailable" };
    }
  }

  let legacyAdminActive = false;
  let legacyGid: string | null = null;
  if (partner.status !== "flat") {
    try {
      const subs = await fetchActiveAppSubscriptions(admin);
      const pro = pickActiveProSubscription(subs);
      legacyAdminActive = pro != null;
      legacyGid = pro?.id ?? null;
    } catch {
      if (partner.status !== "unconfigured") partner = { status: "unavailable" };
    }
  }

  const decision = decideSubscriptionAccess({
    partner,
    legacyAdminActive,
    storedPaidCycleEndsAt: storedEnd ? storedEnd.toISOString() : null,
    now,
  });
  if (!decision.persist) {
    return {
      active: shop.proBillingActive,
      subscriptionGid: shop.proSubscriptionGid,
    };
  }

  if (decision.paidCycleEndsAt) {
    await writePaidCycle({
      shopDomain: shop.domain,
      paidCycleEndsAt: new Date(decision.paidCycleEndsAt),
      cancelAtEndOfCycle: decision.cancelAtEndOfCycle,
    });
  } else {
    await clearPaidCycle(shop.domain);
  }

  const subscriptionGid = decision.entitled
    ? decision.legacySubscriptionId ?? legacyGid ?? shop.proSubscriptionGid
    : null;
  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      proBillingActive: decision.entitled,
      proSubscriptionGid: subscriptionGid,
    },
  });
  return { active: decision.entitled, subscriptionGid };
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
      ? "Whole desk · on"
      : copy.headline,
    detail: entitlements.isPro
      ? "7 days, then $39. This shop has the whole desk. Uninstall stops the next 30-day cycle. The current cycle may still charge."
      : copy.detail,
    upgradeCta: PRO_UPSELL.upgradeCta,
    deskBullets: DESK_FEATURE_BULLETS,
    entitlements,
    confirmationUrl: (() => {
      if (!enabled) return null;
      try {
        return buildManagedPricingPlansUrl(shopDomain);
      } catch {
        return null;
      }
    })(),
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
    const shop = await prisma.shop.findUnique({
      where: { domain: input.shopDomain.trim().toLowerCase() },
      select: { id: true },
    });
    if (shop) {
      await syncShopProFromShopify(input.admin, shop.id);
    }
    // Still open Shopify App Pricing so the merchant can review the plan.
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
