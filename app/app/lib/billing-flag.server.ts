/**
 * Shopify App Pricing — one plan $39 after a 7-day whole-desk trial.
 * Production Fly has MCFLY_BILLING=1. Billing is not a desk mode.
 * Never claim Free+Pro feature gates while the whole desk is on trial/paid.
 */

export function isBillingEnabled(): boolean {
  return process.env.MCFLY_BILLING === "1";
}

/** Soft flood control for CSV desks (0 = unlimited). */
export function freeSpendImportDailyCap(): number {
  const raw = process.env.MCFLY_FREE_SPEND_IMPORT_CAP?.trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export type BillingTier = "free" | "pro";

/** Founder lock 2026-08-26: $39/store/mo after 7-day full-access trial. */
export const PRO_PLAN = {
  name: "Mcfly Analytics",
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
  // Leftover Partner names / Shopify App Pricing shorthand.
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
      headline: "Not charging on this host",
      detail:
        "This host is not charging. Start 7-day trial is unavailable until billing is on. The desk still shows Sample data | Live data.",
    };
  }
  return {
    tier: "pro",
    headline: "7-day trial · then $39/store/mo",
    detail:
      "7-day full-access trial, then $39 per store / month for the whole desk — not a percent of sales, not a per-order fee. Shopify bills this app; uninstall in Admin to stop the next 30-day cycle (the current cycle may still charge).",
  };
}
