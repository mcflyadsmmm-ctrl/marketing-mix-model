import { parseShopCurrencyCode } from "./spend-money";

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

export type ChartGrain = "day" | "week" | "month" | "quarter";
export type SalesDayInput = { dateKey: string; sales: number; orders?: number };
export type ChartBucket = {
  key: string;
  label: string;
  sales: number;
  orders: number;
  weekend: boolean;
};

export type OverviewDelta = { pct: number; kind: "up" | "down" | "even" };

export type OverviewVsTypical = {
  delta: number;
  kind: "up" | "down" | "even";
};

export type OverviewRangePreset = "30d" | "90d" | "6mo" | "ytd" | "1y";

/**
 * Human day / week / month / quarter label — never a raw 2026-09-16 dump.
 * `W:2026-09-14` → "Wk of Sep 14"; `M:2026-09` → "Sep '26";
 * `Q:2026-3` → "Q3 '26"; legacy `2026-W37` → "W37".
 */
export function overviewChartDayLabel(dateKey: string): string {
  const weekStart = dateKey.match(/^W:(\d{4}-\d{2}-\d{2})$/);
  if (weekStart) return `Wk of ${overviewChartDayLabel(weekStart[1]!)}`;
  const month = dateKey.match(/^M:(\d{4})-(\d{2})$/);
  if (month) {
    const label = MONTHS[Number(month[2]) - 1];
    return label ? `${label} '${month[1]!.slice(2)}` : dateKey;
  }
  const quarter = dateKey.match(/^Q:(\d{4})-([1-4])$/);
  if (quarter) return `Q${quarter[2]} '${quarter[1]!.slice(2)}`;
  const legacyWeek = dateKey.match(/^(\d{4})-W(\d{2})$/);
  if (legacyWeek) return `W${legacyWeek[2]}`;
  const [year, mo, day] = dateKey.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(mo) ||
    !Number.isFinite(day) ||
    mo < 1 ||
    mo > 12
  ) {
    return dateKey;
  }
  const label = MONTHS[mo - 1];
  return label ? `${label} ${day}` : dateKey;
}

/** Monday `YYYY-MM-DD` of the ISO week that owns a day. */
export function overviewIsoWeekStartKey(dateKey: string): string {
  const [year, mo, day] = dateKey.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(mo) || !Number.isFinite(day)) {
    return dateKey;
  }
  const date = new Date(Date.UTC(year, mo - 1, day));
  const isoDow = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (isoDow - 1));
  return utcDateKey(date);
}

/** True for Sat/Sun day keys. Week/month/quarter buckets are never weekend. */
export function overviewIsWeekendKey(dateKey: string): boolean {
  if (/[A-Za-z]/.test(dateKey)) return false;
  const [year, mo, day] = dateKey.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(mo) || !Number.isFinite(day)) {
    return false;
  }
  const weekday = new Date(Date.UTC(year, mo - 1, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function utcDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Shift a `YYYY-MM-DD` key by whole days (UTC calendar math). */
export function overviewShiftDayKey(dateKey: string, deltaDays: number): string {
  const [year, mo, day] = dateKey.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(mo) || !Number.isFinite(day)) {
    return dateKey;
  }
  const date = new Date(Date.UTC(year, mo - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return utcDateKey(date);
}

/**
 * Fold daily sales into day / week / month / quarter buckets, ordered oldest →
 * newest. Reusable by any Mcfly sales chart. Order dollars only.
 */
export function overviewBucketize(
  days: SalesDayInput[],
  grain: ChartGrain,
): ChartBucket[] {
  if (grain === "day") {
    return days.map((day) => ({
      key: day.dateKey,
      label: overviewChartDayLabel(day.dateKey),
      sales: day.sales,
      orders: day.orders ?? 0,
      weekend: overviewIsWeekendKey(day.dateKey),
    }));
  }
  const map = new Map<string, { sales: number; orders: number }>();
  for (const day of days) {
    const bucketKey = bucketKeyFor(day.dateKey, grain);
    const prev = map.get(bucketKey) ?? { sales: 0, orders: 0 };
    map.set(bucketKey, {
      sales: prev.sales + day.sales,
      orders: prev.orders + (day.orders ?? 0),
    });
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      label: overviewChartDayLabel(key),
      sales: value.sales,
      orders: value.orders,
      weekend: false,
    }));
}

/** Average order value — sales ÷ orders. Null when orders are unknown/zero. */
export function overviewAov(
  sales: number,
  orders: number,
): number | null {
  if (!Number.isFinite(sales) || !Number.isFinite(orders) || orders <= 0) {
    return null;
  }
  return sales / orders;
}

function bucketKeyFor(dateKey: string, grain: ChartGrain): string {
  if (grain === "week") return `W:${overviewIsoWeekStartKey(dateKey)}`;
  const [year, mo] = dateKey.split("-").map(Number);
  if (grain === "month") {
    return `M:${year}-${String(mo).padStart(2, "0")}`;
  }
  const quarter = Math.floor((mo - 1) / 3) + 1;
  return `Q:${year}-${quarter}`;
}

/** Running totals across buckets — the cumulative sales sweep. */
export function overviewCumulative(buckets: ChartBucket[]): number[] {
  let running = 0;
  return buckets.map((bucket) => (running += bucket.sales));
}

/** Median of finite values. Null when empty — never a fake 0. */
export function overviewMedian(values: number[]): number | null {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/**
 * Bucket vs typical bucket sales. Shopify Analytics Overview does not put this
 * on the chart. Null when typical is unknown — never a fake $0.
 */
export function overviewVsTypical(
  sales: number,
  typical: number | null | undefined,
): OverviewVsTypical | null {
  if (
    typical == null ||
    !Number.isFinite(typical) ||
    typical <= 0 ||
    !Number.isFinite(sales)
  ) {
    return null;
  }
  const delta = sales - typical;
  if (Math.abs(delta) < 0.5) return { delta: 0, kind: "even" };
  return { delta, kind: delta > 0 ? "up" : "down" };
}

/** Chart-board copy. Shopify Analytics Overview has no typical compare. */
export function overviewChartVsCopy(
  vs: OverviewVsTypical,
  dollars: string,
): string {
  switch (vs.kind) {
    case "even":
      return "even with typical";
    case "up":
      return `+${dollars} vs typical`;
    case "down":
      return `−${dollars} vs typical`;
    default: {
      const _never: never = vs.kind;
      return _never;
    }
  }
}

/** Whole-percent distance from typical (e.g. "21% above typical"). */
export function overviewVsTypicalPctCopy(
  vs: OverviewVsTypical | null,
  typical: number | null | undefined,
): string | null {
  if (
    vs == null ||
    vs.kind === "even" ||
    typical == null ||
    !Number.isFinite(typical) ||
    typical <= 0
  ) {
    return null;
  }
  const pct = Math.round((Math.abs(vs.delta) / typical) * 100);
  if (pct <= 0) return null;
  return `${pct}% ${vs.kind === "up" ? "above" : "below"} typical`;
}

/**
 * A "nice" axis ceiling + evenly-spaced gridline ticks that always cover the
 * data. Readable tick language ($0 · $5k · $10k) instead of raw maxima.
 * Reusable by any Mcfly bar/line chart (Overview now, Spend later).
 */
export function overviewChartAxis(
  rawMax: number,
  targetSteps = 4,
): { max: number; ticks: number[] } {
  const safeSteps = Math.max(2, Math.floor(targetSteps));
  if (!Number.isFinite(rawMax) || rawMax <= 0) {
    return { max: 1, ticks: [0, 1] };
  }
  const rawStep = rawMax / safeSteps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const frac = rawStep / magnitude;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  const step = niceFrac * magnitude;
  const max = Math.ceil(rawMax / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) {
    ticks.push(Math.round(value));
  }
  return { max, ticks };
}

/**
 * Compact money for axis ticks — $0 · $5k · $13k · $1.2m. Missing/invalid shop
 * currency paints —, never a silent USD. Mirrors formatCurrency's honesty.
 */
export function overviewCompactMoney(value: number, currency: string): string {
  const code = parseShopCurrencyCode(currency);
  if (!code) return "—";
  const abs = Math.abs(value);
  const compact = abs >= 1000;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
  return formatted
    .replace(/\.0+(?=[KMBT])/g, "")
    .replace(/([KMBT])/g, (letter) => letter.toLowerCase());
}

/**
 * Which x positions get a date label so the axis never crowds. Always keeps the
 * first and last bucket; thins the middle to about `maxLabels` marks.
 */
export function overviewChartLabelIndices(
  count: number,
  maxLabels = 6,
): number[] {
  if (count <= 0) return [];
  if (count <= maxLabels) {
    return Array.from({ length: count }, (_, index) => index);
  }
  const stride = Math.ceil(count / maxLabels);
  const set = new Set<number>();
  for (let index = 0; index < count; index += stride) set.add(index);
  set.add(count - 1);
  return [...set].sort((a, b) => a - b);
}

/** Newest day key present in the series (max by string order). */
export function overviewLatestDayKey(days: SalesDayInput[]): string | null {
  let latest: string | null = null;
  for (const day of days) {
    if (latest == null || day.dateKey > latest) latest = day.dateKey;
  }
  return latest;
}

/**
 * FROM/TO keys for a range preset, anchored to the newest day in the data (so
 * SAMPLE and live behave the same). Clamped to the oldest available day.
 */
export function overviewPresetRange(
  preset: OverviewRangePreset,
  days: SalesDayInput[],
): { fromKey: string; toKey: string } | null {
  const latest = overviewLatestDayKey(days);
  if (latest == null) return null;
  let earliest = latest;
  for (const day of days) {
    if (day.dateKey < earliest) earliest = day.dateKey;
  }
  let fromKey: string;
  switch (preset) {
    case "30d":
      fromKey = overviewShiftDayKey(latest, -29);
      break;
    case "90d":
      fromKey = overviewShiftDayKey(latest, -89);
      break;
    case "6mo":
      fromKey = overviewShiftDayKey(latest, -181);
      break;
    case "ytd":
      fromKey = `${latest.slice(0, 4)}-01-01`;
      break;
    case "1y":
      fromKey = overviewShiftDayKey(latest, -364);
      break;
    default: {
      const _never: never = preset;
      return _never;
    }
  }
  if (fromKey < earliest) fromKey = earliest;
  return { fromKey, toKey: latest };
}

/** Days within [fromKey, toKey] inclusive. String compare on YYYY-MM-DD. */
export function overviewFilterRange(
  days: SalesDayInput[],
  fromKey: string,
  toKey: string,
): SalesDayInput[] {
  const lo = fromKey <= toKey ? fromKey : toKey;
  const hi = fromKey <= toKey ? toKey : fromKey;
  return days.filter((day) => day.dateKey >= lo && day.dateKey <= hi);
}

/** Whole days spanned by [fromKey, toKey] inclusive. */
export function overviewDaySpan(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  if ([fy, fm, fd, ty, tm, td].some((n) => !Number.isFinite(n))) return 0;
  const from = Date.UTC(fy!, fm! - 1, fd!);
  const to = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((to - from) / 86400000) + 1;
}

/** The equal-length window immediately before [fromKey, toKey]. */
export function overviewPriorWindow(
  fromKey: string,
  toKey: string,
): { fromKey: string; toKey: string } {
  const span = overviewDaySpan(fromKey, toKey);
  const priorTo = overviewShiftDayKey(fromKey, -1);
  const priorFrom = overviewShiftDayKey(priorTo, -(Math.max(1, span) - 1));
  return { fromKey: priorFrom, toKey: priorTo };
}

/**
 * Whole-percent change current vs prior. Null when prior is unknown / zero —
 * never a fake +∞ or a divide-by-zero. Honest vs-prior only.
 */
export function overviewDeltaPct(
  current: number,
  prior: number,
): OverviewDelta | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior <= 0) {
    return null;
  }
  const pct = Math.round(((current - prior) / prior) * 100);
  const kind = pct === 0 ? "even" : pct > 0 ? "up" : "down";
  return { pct, kind };
}

/** "+15.9% vs prior" style copy from a delta. */
export function overviewDeltaCopy(delta: OverviewDelta | null): string | null {
  if (delta == null) return null;
  const sign = delta.pct > 0 ? "+" : delta.pct < 0 ? "−" : "±";
  return `${sign}${Math.abs(delta.pct)}% vs prior`;
}
