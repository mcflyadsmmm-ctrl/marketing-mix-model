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
 * PC1-style contribution LTV = cohort avg revenue × (marginPct / 100).
 * `marginPct` is 0–100 (Settings contribution margin).
 */
export function contributionAdjustedLtv(
  avgRevenue: number | null | undefined,
  marginPct: number,
): number | null {
  if (avgRevenue == null || !Number.isFinite(avgRevenue)) return null;
  if (!Number.isFinite(marginPct) || marginPct <= 0) return null;
  return roundMoney(avgRevenue * (marginPct / 100));
}

/** Contribution LTV : cash CAC when both defined. */
export function contributionLtvCacRatio(
  contribLtv: number | null,
  cashCac: number | null,
): number | null {
  if (contribLtv == null || cashCac == null || !(cashCac > 0)) return null;
  return roundMer(contribLtv / cashCac);
}
