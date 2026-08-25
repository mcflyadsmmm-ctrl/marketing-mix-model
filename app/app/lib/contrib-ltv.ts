/**
 * Contribution-adjusted LTV helpers — till margin × cohort revenue.
 * Average portfolio math; not path credit.
 */

/** Round money to cents for stable aggregates across tiles. */
export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/** Round ROAS/× ratios to 2 decimals. */
export function roundMer(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Settings / Practice / DashboardMetrics store contribution margin as 0–1
 * (0.35 = 35%). Older percent-point callers may still pass 1–100.
 */
export function marginAsMultiplier(marginPct: number): number | null {
  if (!Number.isFinite(marginPct) || marginPct <= 0) return null;
  if (marginPct <= 1) return marginPct;
  if (marginPct <= 100) return marginPct / 100;
  return null;
}

/**
 * Contribution LTV = cohort avg revenue × contribution margin.
 * `marginPct` is 0–1 (Practice SAMPLE_DESK_MARGIN_PCT = 0.35, Settings same).
 */
export function contributionAdjustedLtv(
  avgRevenue: number | null | undefined,
  marginPct: number,
): number | null {
  if (avgRevenue == null || !Number.isFinite(avgRevenue)) return null;
  const margin = marginAsMultiplier(marginPct);
  if (margin == null) return null;
  return roundMoney(avgRevenue * margin);
}

/** Contribution LTV : cash CAC when both defined. */
export function contributionLtvCacRatio(
  contribLtv: number | null,
  cashCac: number | null,
): number | null {
  if (contribLtv == null || cashCac == null || !(cashCac > 0)) return null;
  return roundMer(contribLtv / cashCac);
}

/**
 * Honest caption: cohort LTV windows ≠ selected-period Cash CAC.
 * Never imply 30/90/365d revenue and this-period spend share one slicer.
 */
export function ltvWindowCaption(opts: {
  periodLabel: string;
  cohortMaxDays?: number;
}): string {
  const periodLabel = opts.periodLabel.trim() || "this period";
  const cohortMaxDays =
    opts.cohortMaxDays != null &&
    Number.isFinite(opts.cohortMaxDays) &&
    opts.cohortMaxDays > 0
      ? Math.round(opts.cohortMaxDays)
      : 365;
  return (
    `30/90/${cohortMaxDays}d cohort windows are from each customer’s first-order month` +
    ` (often longer than ${periodLabel}). Cash CAC uses this period’s spend ÷ new buyers` +
    ` — not the same window. Shopify Analytics does not combine LTV with ad spend.`
  );
}
