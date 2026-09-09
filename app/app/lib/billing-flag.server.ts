/**
 * Shopify Billing flags — one $39 desk, 7-day trial (BILLING_TIERS.md).
 * Not a Free App Store plan. SAMPLE is preview data only.
 *
 * Enable the hosted plan picker with MCFLY_BILLING=1.
 * Never forever-free marketing. Never GMV tax.
 */

export function isBillingEnabled(): boolean {
  return process.env.MCFLY_BILLING === "1";
}

/** Soft flood control for spend CSV desks (0 = unlimited). */
export function freeSpendImportDailyCap(): number {
  const raw = process.env.MCFLY_FREE_SPEND_IMPORT_CAP?.trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** `free` = not yet billed (cache). Not a product plan. */
export type BillingTier = "free" | "pro";

/** Founder lock: $39/store/mo · 7-day trial. */
export const PRO_PLAN = {
  name: "Mcfly Analytics Pro",
  amount: 39,
  currencyCode: "USD",
  interval: "EVERY_30_DAYS" as const,
  trialDays: 7,
};

export function subscriptionMatchesProPlan(
  name: string | null | undefined,
): boolean {
  if (!name?.trim()) return false;
  const n = name.trim().toLowerCase();
  const plan = PRO_PLAN.name.toLowerCase();
  if (n === plan) return true;
  if (n.includes("mcfly") && n.includes("analytics")) return true;
  if (n.includes("mcfly") && n.includes("pro")) return true;
  // Shopify App Pricing plans are often named just "Pro".
  if (n === "pro" || n === "pro plan") return true;
  return false;
}

/** Honest UI copy — one desk, trial + $39. */
export function billingStatusCopy(billingEnabled: boolean): {
  tier: BillingTier;
  headline: string;
  detail: string;
} {
  if (!billingEnabled) {
    return {
      tier: "pro",
      headline: "7-day trial · then $39/mo",
      detail:
        "One desk: all channels (including TikTok CSV), Customer LTV, and Goals. SAMPLE is preview data only. Not a Free App Store plan — $39 flat, not a GMV tax.",
    };
  }
  return {
    tier: "pro",
    headline: "7-day trial · then $39/mo",
    detail:
      "Flat $39/store/mo via Shopify Billing — 7-day trial, then the full desk. LTV, Goals, and every named channel included. SAMPLE is preview data only.",
  };
}
