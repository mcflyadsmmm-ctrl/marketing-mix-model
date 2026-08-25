/**
 * Shopify App Pricing flags — Pro $39 flat (raise later).
 * Production Fly has MCFLY_BILLING=1 — Partner listing must show Free + Pro.
 * Never forever-free marketing; never claim “no charges” while Upgrade is live.
 */

export function isBillingEnabled(): boolean {
  return process.env.MCFLY_BILLING === "1";
}

/** Soft flood control for Free CSV desks (0 = unlimited). */
export function freeSpendImportDailyCap(): number {
  const raw = process.env.MCFLY_FREE_SPEND_IMPORT_CAP?.trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export type BillingTier = "free" | "pro";

/** Founder lock 2026-07-29: Pro launch $39; may raise later. */
export const PRO_PLAN = {
  name: "Mcfly Analytics Pro",
  amount: 39,
  currencyCode: "USD",
  interval: "EVERY_30_DAYS" as const,
  trialDays: 0,
};

export function subscriptionMatchesProPlan(
  name: string | null | undefined,
): boolean {
  if (!name?.trim()) return false;
  const n = name.trim().toLowerCase();
  const plan = PRO_PLAN.name.toLowerCase();
  if (n === plan) return true;
  if (n.includes("mcfly") && n.includes("pro")) return true;
  // Shopify App Pricing plans are often named just "Pro".
  if (n === "pro" || n === "pro plan") return true;
  return false;
}

/** Honest UI copy when Billing API is not charging yet. */
export function billingStatusCopy(billingEnabled: boolean): {
  tier: BillingTier;
  headline: string;
  detail: string;
} {
  if (!billingEnabled) {
    return {
      tier: "free",
      headline: "Free · Meta + Google + custom Other",
      detail:
        "Free desk: Meta + Google + custom Other (name it), Total ROAS, break-even. Pro ($39/store/mo flat) adds TikTok/Amazon and other named platforms, Customer LTV, and advanced Goals. Upgrade is temporarily unavailable on this host.",
    };
  }
  return {
    tier: "pro",
    headline: "Pro billing available",
    detail:
      "Flat $39/store/mo via Shopify Billing at launch — cash close desk, not GMV tax. LTV + all spend channels on Pro. Price may rise later for new subscribers.",
  };
}
