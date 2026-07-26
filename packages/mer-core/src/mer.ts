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
