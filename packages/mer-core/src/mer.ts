/**
 * Cash MER: total Shopify sales ÷ total ad spend for the same period.
 * No path attribution — period-level cash view only.
 */
export function calculateMer(totalSales: number, totalSpend: number): number | null {
  if (totalSpend <= 0) {
    return null;
  }
  return totalSales / totalSpend;
}

/**
 * Break-even MER ≈ 1 / contribution margin (decimal, e.g. 0.4 → MER 2.5).
 */
export function calculateBreakEvenMer(contributionMargin: number): number | null {
  if (contributionMargin <= 0 || contributionMargin > 1) {
    return null;
  }
  return 1 / contributionMargin;
}

export function isAboveBreakEven(mer: number | null, breakEvenMer: number): boolean | null {
  if (mer === null) {
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
