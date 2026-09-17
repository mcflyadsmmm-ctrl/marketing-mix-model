const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type OverviewVsTypical = {
  delta: number;
  kind: "up" | "down" | "even";
};

/** Human day / ISO week on the sales chart — never a raw 2026-09-16 dump. */
export function overviewChartDayLabel(dateKey: string): string {
  const week = dateKey.match(/^(\d{4})-W(\d{2})$/);
  if (week) return `W${week[2]}`;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12
  ) {
    return dateKey;
  }
  const label = MONTHS[month - 1];
  return label ? `${label} ${day}` : dateKey;
}

/**
 * Day vs typical daily sales. Shopify Analytics Overview does not put
 * this line on the sales chart. Null when typical is unknown — never a fake $0.
 */
export function overviewVsTypical(
  sales: number,
  typicalDay: number | null | undefined,
): OverviewVsTypical | null {
  if (
    typicalDay == null ||
    !Number.isFinite(typicalDay) ||
    typicalDay <= 0 ||
    !Number.isFinite(sales)
  ) {
    return null;
  }
  const delta = sales - typicalDay;
  if (Math.abs(delta) < 0.5) return { delta: 0, kind: "even" };
  return { delta, kind: delta > 0 ? "up" : "down" };
}
