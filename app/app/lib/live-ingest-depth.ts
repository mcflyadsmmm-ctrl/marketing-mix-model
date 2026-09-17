/**
 * Live Shopify ingest depth — billing hard-stop, not a feature gate.
 *
 * Product lock:
 * - SAMPLE demo = full wow (this module is Live ingest only).
 * - Trial/unpaid = ~90d Live slice. No free multi-year backfill.
 * - Paid $39 = full Jan-1 × N-year book immediately on subscribe
 *   (pay anytime day 1 — do not wait for a trial clock).
 *
 * Flat $39. Price does not rise with sales. No GMV cliffs.
 */

export const TRIAL_LIVE_SLICE_DAYS = 90;

export type LiveIngestDepth = "trial_slice" | "paid_full";

export function shopMayIngestFullHistory(input: {
  billingEnabled: boolean;
  isPro: boolean;
}): boolean {
  if (!input.billingEnabled) return true;
  return input.isPro;
}

export function liveIngestDepth(input: {
  billingEnabled: boolean;
  isPro: boolean;
}): LiveIngestDepth {
  return shopMayIngestFullHistory(input) ? "paid_full" : "trial_slice";
}

/**
 * Day count for SalesDayFact / OrderFact crawls.
 * `paidWindowDays` is the Jan-1 × N-year book (or the Shopify-visible
 * ~60d book when `read_all_orders` is off). Unpaid never exceeds ~90d.
 */
export function resolveLiveIngestWindowDays(input: {
  billingEnabled: boolean;
  isPro: boolean;
  paidWindowDays: number;
}): number {
  const depth = liveIngestDepth(input);
  switch (depth) {
    case "paid_full":
      return input.paidWindowDays;
    case "trial_slice":
      return Math.min(TRIAL_LIVE_SLICE_DAYS, input.paidWindowDays);
    default: {
      const _never: never = depth;
      return _never;
    }
  }
}
