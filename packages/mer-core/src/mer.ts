/**
 * Cash MER: total Shopify sales ÷ total ad spend for the same period.
 * No path attribution — period-level cash view only.
 */
export function calculateMer(totalSales: number, totalSpend: number): number | null {
  if (!Number.isFinite(totalSales) || !Number.isFinite(totalSpend) || totalSpend <= 0) {
    return null;
  }
  const mer = totalSales / totalSpend;
  return Number.isFinite(mer) ? mer : null;
}

/**
 * Acquisition MER (aMER): new-customer net sales ÷ total ad spend for the same period.
 * Same guards as calculateMer — no path / pixel credit; cash till only.
 */
export function calculateAmer(
  newCustomerNetSales: number,
  totalSpend: number,
): number | null {
  return calculateMer(newCustomerNetSales, totalSpend);
}

/** Cost stack inputs as contribution-margin decimals (e.g. 0.30 = 30% COGS). */
export type CostStackInput = {
  cogsPct: number;
  paymentFeesPct: number;
  shippingPct: number;
};

/**
 * Contribution margin from a cost waterfall: 1 − (COGS + fees + shipping).
 * Returns null when any input is non-finite/negative or the stack sums to ≥ 1
 * (would leave margin ≤ 0).
 */
export function computeContributionMarginFromStack(
  stack: CostStackInput,
): number | null {
  const { cogsPct, paymentFeesPct, shippingPct } = stack;
  if (
    !Number.isFinite(cogsPct) ||
    !Number.isFinite(paymentFeesPct) ||
    !Number.isFinite(shippingPct) ||
    cogsPct < 0 ||
    paymentFeesPct < 0 ||
    shippingPct < 0
  ) {
    return null;
  }
  const sum = cogsPct + paymentFeesPct + shippingPct;
  if (!Number.isFinite(sum) || sum >= 1) {
    return null;
  }
  const margin = 1 - sum;
  return margin > 0 && margin <= 1 && Number.isFinite(margin) ? margin : null;
}

/**
 * Break-even MER ≈ 1 / contribution margin (decimal, e.g. 0.4 → MER 2.5).
 * Margin must be in (0, 1] — 100% contribution margin ⇒ BE MER 1.
 */
export function calculateBreakEvenMer(contributionMargin: number): number | null {
  if (
    !Number.isFinite(contributionMargin) ||
    contributionMargin <= 0 ||
    contributionMargin > 1
  ) {
    return null;
  }
  const breakEven = 1 / contributionMargin;
  return Number.isFinite(breakEven) ? breakEven : null;
}

export function isAboveBreakEven(
  mer: number | null,
  breakEvenMer: number,
): boolean | null {
  if (
    mer === null ||
    !Number.isFinite(mer) ||
    !Number.isFinite(breakEvenMer) ||
    breakEvenMer <= 0
  ) {
    return null;
  }
  return mer >= breakEvenMer;
}

export function formatMer(mer: number | null, digits = 2): string {
  if (mer === null || !Number.isFinite(mer)) {
    return "—";
  }
  return mer.toFixed(digits);
}
