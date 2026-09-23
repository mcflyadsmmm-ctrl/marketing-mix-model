import { OVERVIEW_LAST_YEAR_NOT_ON_FILE } from "./overview-first-viewport";
import { overviewWindowRange } from "./overview-yoy";
import { shopLocalDayKey, shopLocalHour } from "./shop-local-day";
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

/** Same weekday last year — 52 weeks, not the calendar date. */
export const OVERVIEW_SAME_WEEKDAY_SHIFT_DAYS = -364;

export type OverviewClockOrder = {
  orderedAt: Date;
  amount: number;
};

/** Serializable clock orders for the Overview loader → desk. */
export type OverviewClockOrderInput = {
  orderedAt: string;
  amount: number;
};

export type OverviewClockPayload = {
  timeZone: string | null;
  nowIso: string;
  /** Book has not synced — today must not paint as a finished $0. */
  pending: boolean;
  /** Null when today's orders are not on file. Empty means a real zero. */
  todayOrders: OverviewClockOrderInput[] | null;
  /** Null when that weekday's orders are not in the stored book. */
  priorOrders: OverviewClockOrderInput[] | null;
};

export type OverviewClockStatus = "no-timezone" | "syncing" | "ready";

export type OverviewClockCompare = {
  status: OverviewClockStatus;
  clockLabel: string | null;
  todaySales: number | null;
  priorSales: number | null;
  todayKey: string | null;
  priorKey: string | null;
};

export type OverviewSameDatesWindow = {
  fromKey: string;
  toKey: string;
  /** Each current day mapped onto the prior year. Not a filled calendar span. */
  dateKeys: string[];
};

function clockMinute(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  if (!Number.isFinite(minute)) return 0;
  return Math.min(59, Math.max(0, minute));
}

function clockSecond(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const second = Number(parts.find((part) => part.type === "second")?.value ?? 0);
  if (!Number.isFinite(second)) return 0;
  return Math.min(59, Math.max(0, second));
}

/** Shop-local seconds after midnight. Hour grain matches Orders' shopLocalHour. */
function shopLocalClockSeconds(instant: Date, timeZone: string): number {
  const hour = shopLocalHour(instant, timeZone);
  return hour * 3600 + clockMinute(instant, timeZone) * 60 + clockSecond(instant, timeZone);
}

function formatShopClock(instant: Date, timeZone: string): string {
  const hour = shopLocalHour(instant, timeZone);
  const minute = clockMinute(instant, timeZone);
  const suffix = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/**
 * Same calendar month/day one year earlier.
 * Feb 29 has no prior-year date — returns null. Does not clamp onto Feb 28.
 */
export function overviewCalendarDateLastYear(dateKey: string): string | null {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const priorYear = year - 1;
  const shifted = new Date(Date.UTC(priorYear, month - 1, day));
  if (
    shifted.getUTCFullYear() !== priorYear ||
    shifted.getUTCMonth() !== month - 1 ||
    shifted.getUTCDate() !== day
  ) {
    return null;
  }
  return utcDateKey(shifted);
}

/**
 * Custom from/to → those calendar dates one year earlier.
 * A Feb 29 anywhere in the range makes the whole compare not on file.
 * This is not {@link overviewPriorWindow}.
 */
export function overviewSameDatesLastYear(
  fromKey: string,
  toKey: string,
): OverviewSameDatesWindow | null {
  const lo = fromKey <= toKey ? fromKey : toKey;
  const hi = fromKey <= toKey ? toKey : fromKey;
  const span = overviewDaySpan(lo, hi);
  if (span <= 0) return null;
  const dateKeys: string[] = [];
  let cursor = lo;
  for (let index = 0; index < span; index += 1) {
    const prior = overviewCalendarDateLastYear(cursor);
    if (!prior) return null;
    dateKeys.push(prior);
    cursor = overviewShiftDayKey(cursor, 1);
  }
  const priorFrom = dateKeys[0];
  const priorTo = dateKeys[dateKeys.length - 1];
  if (!priorFrom || !priorTo) return null;
  return { fromKey: priorFrom, toKey: priorTo, dateKeys };
}

/**
 * Shopify Total Sales for those dates last year.
 * Any missing day in the mapped prior window is null — never filled with $0.
 * A stored 0 on every required day is a real zero.
 */
export function overviewSameDatesSales(
  days: readonly SalesDayInput[],
  fromKey: string,
  toKey: string,
): number | null {
  const window = overviewSameDatesLastYear(fromKey, toKey);
  if (!window) return null;
  const byKey = new Map<string, number>();
  for (const day of days) {
    if (!Number.isFinite(day.sales)) continue;
    if (!byKey.has(day.dateKey)) byKey.set(day.dateKey, day.sales);
  }
  let sum = 0;
  for (const key of window.dateKeys) {
    if (!byKey.has(key)) return null;
    sum += byKey.get(key)!;
  }
  return sum;
}

function sameDatesRangeLabel(fromKey: string, toKey: string): string {
  const lo = fromKey <= toKey ? fromKey : toKey;
  const hi = fromKey <= toKey ? toKey : fromKey;
  const span = overviewWindowRange(lo, hi) ?? `${lo}–${hi}`;
  if (lo.slice(0, 4) === hi.slice(0, 4) && !span.includes(lo.slice(0, 4))) {
    return `${span}, ${lo.slice(0, 4)}`;
  }
  return span;
}

function honestDeltaTail(delta: OverviewDelta | null): string {
  if (delta == null) return "";
  switch (delta.kind) {
    case "even":
      return " (even)";
    case "up":
      return ` (+${delta.pct}%)`;
    case "down":
      return ` (−${Math.abs(delta.pct)}%)`;
    default: {
      const _never: never = delta.kind;
      return _never;
    }
  }
}

/** Labeled line for a custom range versus those dates last year. */
export function overviewSameDatesSentence(input: {
  fromKey: string;
  toKey: string;
  sales: number;
  priorSales: number | null;
  money: (amount: number) => string;
}): string {
  const label = sameDatesRangeLabel(input.fromKey, input.toKey);
  if (input.priorSales == null || !Number.isFinite(input.sales)) {
    return `Shopify Total Sales for ${label} versus those dates last year is — ${OVERVIEW_LAST_YEAR_NOT_ON_FILE}.`;
  }
  const delta = overviewDeltaPct(input.sales, input.priorSales);
  return `Shopify Total Sales for ${label} is ${input.money(input.sales)} versus ${input.money(input.priorSales)} those dates last year${honestDeltaTail(delta)}.`;
}

function sumThroughClock(
  orders: readonly OverviewClockOrder[],
  dayKey: string,
  now: Date,
  timeZone: string,
): number {
  const cutoff = shopLocalClockSeconds(now, timeZone);
  let sum = 0;
  for (const order of orders) {
    const at = order.orderedAt;
    if (!(at instanceof Date) || Number.isNaN(at.getTime())) continue;
    if (!Number.isFinite(order.amount)) continue;
    if (shopLocalDayKey(at, timeZone) !== dayKey) continue;
    if (shopLocalClockSeconds(at, timeZone) > cutoff) continue;
    sum += order.amount;
  }
  return sum;
}

function clockOrdersFromInput(
  rows: OverviewClockOrderInput[] | null,
): OverviewClockOrder[] | null {
  if (rows == null) return null;
  return rows.map((row) => ({
    orderedAt: new Date(row.orderedAt),
    amount: row.amount,
  }));
}

/**
 * Shopify Total Sales from shop-local midnight through the current shop-local
 * clock, versus the same weekday last year through that clock.
 * No timezone → not on file. No stored orders on the prior weekday → not on
 * file, even when a sales-day total exists. Day totals have no hour split.
 */
export function overviewThroughClock(input: {
  now: Date;
  timeZone: string | null;
  pending: boolean;
  todayOrders: OverviewClockOrder[] | null;
  priorOrders: OverviewClockOrder[] | null;
}): OverviewClockCompare {
  const zone = input.timeZone?.trim() || null;
  if (!zone) {
    return {
      status: "no-timezone",
      clockLabel: null,
      todaySales: null,
      priorSales: null,
      todayKey: null,
      priorKey: null,
    };
  }
  const todayKey = shopLocalDayKey(input.now, zone);
  const priorKey = overviewShiftDayKey(todayKey, OVERVIEW_SAME_WEEKDAY_SHIFT_DAYS);
  const clockLabel = formatShopClock(input.now, zone);
  if (input.pending || input.todayOrders == null) {
    return {
      status: "syncing",
      clockLabel,
      todaySales: null,
      priorSales: null,
      todayKey,
      priorKey,
    };
  }
  return {
    status: "ready",
    clockLabel,
    todaySales: sumThroughClock(input.todayOrders, todayKey, input.now, zone),
    priorSales:
      input.priorOrders == null
        ? null
        : sumThroughClock(input.priorOrders, priorKey, input.now, zone),
    todayKey,
    priorKey,
  };
}

/** One copyable sentence for the through-this-clock compare. */
export function overviewClockSentence(
  compare: OverviewClockCompare,
  money: (amount: number) => string,
): string {
  switch (compare.status) {
    case "no-timezone":
      return `Shopify Total Sales through this clock is — ${OVERVIEW_LAST_YEAR_NOT_ON_FILE}.`;
    case "syncing":
      return "Shopify Total Sales through this clock is still loading — not $0.";
    case "ready": {
      const clock = compare.clockLabel ?? "this clock";
      if (compare.todaySales == null) {
        return `Shopify Total Sales through ${clock} is — ${OVERVIEW_LAST_YEAR_NOT_ON_FILE}.`;
      }
      const todayMoney = money(compare.todaySales);
      if (compare.priorSales == null) {
        return `Shopify Total Sales through ${clock} is ${todayMoney}, and the same weekday last year is — ${OVERVIEW_LAST_YEAR_NOT_ON_FILE}.`;
      }
      const delta = overviewDeltaPct(compare.todaySales, compare.priorSales);
      return `Shopify Total Sales through ${clock} is ${todayMoney} versus ${money(compare.priorSales)} the same weekday last year${honestDeltaTail(delta)}.`;
    }
    default: {
      const _never: never = compare.status;
      return _never;
    }
  }
}

export function overviewClockSentenceFromPayload(
  payload: OverviewClockPayload,
  money: (amount: number) => string,
): string {
  return overviewClockSentence(
    overviewThroughClock({
      now: new Date(payload.nowIso),
      timeZone: payload.timeZone,
      pending: payload.pending,
      todayOrders: clockOrdersFromInput(payload.todayOrders),
      priorOrders: clockOrdersFromInput(payload.priorOrders),
    }),
    money,
  );
}

/**
 * Slim the stored order book down to today and the weekday 364 days earlier.
 * A prior weekday with no stored orders stays null — a sales-day total is not
 * an hour split.
 */
export function overviewClockPayloadFromOrders(input: {
  now: Date;
  timeZone: string | null;
  pending: boolean;
  orders: readonly OverviewClockOrder[] | null;
}): OverviewClockPayload {
  const zone = input.timeZone?.trim() || null;
  const nowIso = input.now.toISOString();
  if (!zone || input.orders == null) {
    return {
      timeZone: zone,
      nowIso,
      pending: input.pending,
      todayOrders: null,
      priorOrders: null,
    };
  }
  const todayKey = shopLocalDayKey(input.now, zone);
  const priorKey = overviewShiftDayKey(todayKey, OVERVIEW_SAME_WEEKDAY_SHIFT_DAYS);
  const today: OverviewClockOrderInput[] = [];
  const prior: OverviewClockOrderInput[] = [];
  for (const order of input.orders) {
    if (!(order.orderedAt instanceof Date) || Number.isNaN(order.orderedAt.getTime())) {
      continue;
    }
    const key = shopLocalDayKey(order.orderedAt, zone);
    const row = {
      orderedAt: order.orderedAt.toISOString(),
      amount: order.amount,
    };
    if (key === todayKey) today.push(row);
    else if (key === priorKey) prior.push(row);
  }
  return {
    timeZone: zone,
    nowIso,
    pending: input.pending,
    todayOrders: today,
    priorOrders: prior.length > 0 ? prior : null,
  };
}
