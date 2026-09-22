/**
 * Interpolated cash-payback days — piecewise-linear across honest
 * cohort revenue anchors. Day 0 is the start of the curve ($0), not
 * earned LTV. Average cohort math only — never a causal or ads-manager
 * payback.
 */

export type CashPaybackAnchor = {
  day: number;
  revenue: number;
  /** False for the day-0 start. True only for positive cohort windows. */
  earned: boolean;
};

export function cashPaybackAnchors(
  avgRevenueD30: number | null,
  avgRevenueD90: number | null,
  avgRevenueD365: number | null,
): CashPaybackAnchor[] {
  const anchors: CashPaybackAnchor[] = [{ day: 0, revenue: 0, earned: false }];
  if (
    avgRevenueD30 != null &&
    Number.isFinite(avgRevenueD30) &&
    avgRevenueD30 > 0
  ) {
    anchors.push({ day: 30, revenue: avgRevenueD30, earned: true });
  }
  if (
    avgRevenueD90 != null &&
    Number.isFinite(avgRevenueD90) &&
    avgRevenueD90 > 0
  ) {
    anchors.push({ day: 90, revenue: avgRevenueD90, earned: true });
  }
  if (
    avgRevenueD365 != null &&
    Number.isFinite(avgRevenueD365) &&
    avgRevenueD365 > 0
  ) {
    anchors.push({ day: 365, revenue: avgRevenueD365, earned: true });
  }
  return anchors;
}

export function cashPaybackDays(
  cashCac: number | null,
  avgRevenueD30: number | null,
  avgRevenueD90: number | null,
  avgRevenueD365: number | null,
): number | null {
  if (cashCac == null || !Number.isFinite(cashCac) || cashCac <= 0) {
    return null;
  }

  const anchors = cashPaybackAnchors(
    avgRevenueD30,
    avgRevenueD90,
    avgRevenueD365,
  );

  for (let i = 1; i < anchors.length; i += 1) {
    const prev = anchors[i - 1]!;
    const curr = anchors[i]!;
    if (curr.revenue < cashCac) continue;
    const span = curr.revenue - prev.revenue;
    const days =
      span > 0
        ? prev.day +
          (curr.day - prev.day) * ((cashCac - prev.revenue) / span)
        : curr.day;
    const rounded = Math.min(365, Math.max(1, Math.round(days)));
    // Day-0 $0 is the start of interpolation, not a finished payback day.
    if (rounded <= 0) return null;
    return rounded;
  }

  return null;
}
