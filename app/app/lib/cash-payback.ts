/**
 * Interpolated cash-payback days — piecewise-linear across honest
 * cohort revenue anchors (day 0 → $0, day 30, day 90, day 365).
 * Average cohort math only — never a causal or per-customer forecast.
 */

export function cashPaybackDays(
  cashCac: number | null,
  avgRevenueD30: number | null,
  avgRevenueD90: number | null,
  avgRevenueD365: number | null,
): number | null {
  if (cashCac == null || !Number.isFinite(cashCac) || cashCac <= 0) {
    return null;
  }

  const anchors: Array<{ day: number; revenue: number }> = [
    { day: 0, revenue: 0 },
  ];
  if (avgRevenueD30 != null && Number.isFinite(avgRevenueD30)) {
    anchors.push({ day: 30, revenue: avgRevenueD30 });
  }
  if (avgRevenueD90 != null && Number.isFinite(avgRevenueD90)) {
    anchors.push({ day: 90, revenue: avgRevenueD90 });
  }
  if (avgRevenueD365 != null && Number.isFinite(avgRevenueD365)) {
    anchors.push({ day: 365, revenue: avgRevenueD365 });
  }

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
    return Math.min(365, Math.max(1, Math.round(days)));
  }

  return null;
}
