/**
 * Partner API activeSubscription for Shopify App Pricing.
 * Does not call appSubscriptionCreate or any Billing API charge mutation.
 *
 * Token stays in SHOPIFY_PARTNER_ACCESS_TOKEN. Org and app ids are public
 * (shopify.app.toml comment) and can be overridden without committing a secret.
 */

import {
  futureIso,
  type FlatPartnerSubscription,
} from "./billing-subscription";

export const PARTNER_API_VERSION = "2026-07";
/** Dev Dashboard org in shopify.app.toml. Override with SHOPIFY_PARTNER_ORG_ID. */
export const PUBLIC_PARTNER_ORG_ID = "227535001";
/** Public app id in shopify.app.toml. Override with SHOPIFY_APP_ID. */
export const PUBLIC_APP_ID = "403721814017";

const ACTIVE_SUBSCRIPTION_QUERY = `query ActiveSubscription($appId: ID!, $shopId: ID!) {
  activeSubscription(appId: $appId, shopId: $shopId) {
    billingPeriod
    cancelAtEndOfCycle
    trialEndsAt
    currentBillingCycle {
      endTime
    }
    items {
      handle
      price {
        __typename
        ... on FlatRatePrice {
          amount
          currency
        }
        ... on TieredPrice {
          tiersMode
        }
      }
    }
    legacySubscriptionId
  }
}`;

export type PartnerBillingConfig = {
  orgId: string;
  accessToken: string;
  appGid: string;
};

export type ParsedPartnerSubscription =
  | { status: "none" }
  | { status: "tiered" }
  | ({ status: "flat"; amount: number; currency: string | null } & FlatPartnerSubscription)
  | { status: "error" };

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export function shopifyGid(type: "App" | "Shop", id: string): string {
  const trimmed = id.trim();
  if (trimmed.startsWith("gid://")) return trimmed;
  return `gid://shopify/${type}/${trimmed}`;
}

export function readPartnerBillingConfig(
  env: NodeJS.ProcessEnv = process.env,
): PartnerBillingConfig | null {
  const accessToken = env.SHOPIFY_PARTNER_ACCESS_TOKEN?.trim();
  if (!accessToken) return null;
  const orgId = env.SHOPIFY_PARTNER_ORG_ID?.trim() || PUBLIC_PARTNER_ORG_ID;
  const appId = env.SHOPIFY_APP_ID?.trim() || PUBLIC_APP_ID;
  if (!orgId || !appId) return null;
  return { orgId, accessToken, appGid: shopifyGid("App", appId) };
}

export function partnerApiUrl(orgId: string): string {
  return `https://partners.shopify.com/${encodeURIComponent(orgId)}/api/${PARTNER_API_VERSION}/graphql.json`;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

/**
 * Read one activeSubscription payload.
 * A tiered (GMV / usage) price is not the flat desk plan.
 * A future trialEndsAt marks a trial and does not become a paid-cycle end.
 */
export function parsePartnerSubscriptionPayload(
  json: unknown,
  now: Date,
): ParsedPartnerSubscription {
  const root = asRecord(json);
  if (!root) return { status: "error" };
  const errors = root.errors;
  if (Array.isArray(errors) && errors.length > 0) return { status: "error" };

  const data = asRecord(root.data);
  if (!data || !("activeSubscription" in data)) return { status: "error" };
  const sub = data.activeSubscription;
  if (sub == null) return { status: "none" };
  const record = asRecord(sub);
  if (!record) return { status: "error" };

  const items = Array.isArray(record.items) ? record.items : [];
  let flatAmount: number | null = null;
  let currency: string | null = null;
  let tiered = false;
  for (const item of items) {
    const price = asRecord(asRecord(item)?.price);
    if (!price) continue;
    const typename = typeof price.__typename === "string" ? price.__typename : "";
    if (typename === "TieredPrice" || "tiersMode" in price || "tiers" in price) {
      tiered = true;
      continue;
    }
    if (typename === "FlatRatePrice" || "amount" in price) {
      const amount = parseAmount(price.amount);
      if (amount != null && flatAmount == null) {
        flatAmount = amount;
        currency = typeof price.currency === "string" ? price.currency : null;
      }
    }
  }
  if (tiered) return { status: "tiered" };
  if (items.length === 0 || flatAmount == null) return { status: "error" };

  const trialRaw =
    typeof record.trialEndsAt === "string" ? record.trialEndsAt : null;
  const inTrial = futureIso(trialRaw, now) != null;
  const cycle = asRecord(record.currentBillingCycle);
  const cycleEnd =
    cycle && typeof cycle.endTime === "string" ? cycle.endTime : null;
  const legacy =
    typeof record.legacySubscriptionId === "string"
      ? record.legacySubscriptionId
      : null;

  return {
    status: "flat",
    inTrial,
    paidCycleEndsAt: inTrial ? null : cycleEnd,
    cancelAtEndOfCycle: record.cancelAtEndOfCycle === true,
    legacySubscriptionId: legacy,
    amount: flatAmount,
    currency,
  };
}

export async function queryPartnerActiveSubscription(input: {
  config: PartnerBillingConfig;
  shopGid: string;
  fetchImpl?: FetchLike;
  now?: Date;
}): Promise<ParsedPartnerSubscription> {
  const fetchImpl = input.fetchImpl ?? (fetch as unknown as FetchLike);
  const now = input.now ?? new Date();
  let response: { ok: boolean; status: number; json: () => Promise<unknown> };
  try {
    response = await fetchImpl(partnerApiUrl(input.config.orgId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": input.config.accessToken,
      },
      body: JSON.stringify({
        query: ACTIVE_SUBSCRIPTION_QUERY,
        variables: {
          appId: input.config.appGid,
          shopId: input.shopGid,
        },
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    return { status: "error" };
  }
  if (!response.ok) return { status: "error" };
  try {
    const json = await response.json();
    return parsePartnerSubscriptionPayload(json, now);
  } catch {
    return { status: "error" };
  }
}
