/**
 * Pure Spend Explorer math — Apps Script `renderSpendExplorer` port.
 * Cash MER = sales ÷ spend (never inverted). Channel bars are spend mix only.
 */

import type { PeriodPreset } from "./periods";
import type { LiveIngestDepth } from "./live-ingest-depth";
import {
  dateKeyFromYmd,
  listRecentClosedShopLocalDays,
  mondayOfDayKey,
  shiftCivilDayKey,
  shopLocalDayKey,
  shopLocalDayRange,
  shopLocalYmd,
} from "./shop-local-day";

export type ExplorerRange = "14d" | "30d" | "90d" | "YTD" | "1y" | "All" | "custom";
export type ExplorerGranularity = "Day" | "Week" | "Month" | "Quarter" | "Weekday";
export type ExplorerMode = "stacked" | "share" | "total";

export type ExplorerWindowOptions = {
  from?: string | null;
  to?: string | null;
  /** Shop IANA timezone — when set, closed-day edges follow merchant calendar. */
  timeZone?: string | null;
};

export type ExplorerChannelSlice = {
  channel: string;
  amount: number;
};

/** One closed calendar day of cash sales + channel spend. */
export type ExplorerDailyRow = {
  dateKey: string;
  sales: number;
  spend: number;
  channels: ExplorerChannelSlice[];
  /**
   * False when Shopify sales are not on file for this date (missing map key).
   * Omitted / true means `sales` is a certified closed-day amount, including $0.
   */
  salesOnFile?: boolean;
};

export type ExplorerBucket = {
  key: string;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  channels: ExplorerChannelSlice[];
};

/** Ready-to-plot bar values after stacked / share / total mode. */
export type ExplorerPlotBucket = {
  key: string;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  /** Bar segments (share = 0–100; stacked/total = $). */
  bars: ExplorerChannelSlice[];
  /** True when stacked $ mix was scaled down to match cash spend. */
  scaledToCash: boolean;
};

export type ExplorerSummary = {
  totalSales: number;
  totalSpend: number;
  overallMer: number | null;
  /** Period spend ÷ newCustomers — null if unavailable. */
  costPerNew: number | null;
  /** Period spend ÷ (new + returning) — null if unavailable. */
  costPerCustomer: number | null;
  closedDays: number;
  bucketCount: number;
};

export type ExplorerWindow = {
  start: Date;
  end: Date;
  label: string;
  range: ExplorerRange;
};

const MONTHS_SHORT = [
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

const RANGE_PRESETS: ExplorerRange[] = [
  "14d",
  "30d",
  "90d",
  "YTD",
  "1y",
  "All",
];
const GRANULARITIES: ExplorerGranularity[] = [
  "Day",
  "Week",
  "Month",
  "Quarter",
  "Weekday",
];
const MODES: ExplorerMode[] = ["stacked", "share", "total"];

/** ISO date YYYY-MM-DD */
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const EXPLORER_RANGE_OPTIONS: { value: ExplorerRange; label: string }[] =
  [
    { value: "14d", label: "14 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
    { value: "YTD", label: "This year" },
    { value: "1y", label: "1 year" },
    { value: "All", label: "All" },
  ];

/** Year-length chips. Trial and paid both keep them. */
export function explorerSellsFinishedYear(range: ExplorerRange): boolean {
  return range === "YTD" || range === "1y" || range === "All";
}

export function explorerRangeAllowedOnBook(
  _range: ExplorerRange,
  orderBookDepth: LiveIngestDepth,
): boolean {
  switch (orderBookDepth) {
    case "paid_full":
    case "trial_slice":
      return true;
    default: {
      const _never: never = orderBookDepth;
      return _never;
    }
  }
}

export function explorerRangeOptionsFor(
  orderBookDepth: LiveIngestDepth,
): { value: ExplorerRange; label: string }[] {
  return EXPLORER_RANGE_OPTIONS.filter((opt) =>
    explorerRangeAllowedOnBook(opt.value, orderBookDepth),
  );
}

export function clampExplorerRangeToBook(
  range: ExplorerRange,
  orderBookDepth: LiveIngestDepth,
): ExplorerRange {
  if (explorerRangeAllowedOnBook(range, orderBookDepth)) return range;
  return "90d";
}

export function explorerYearChipNote(
  orderBookDepth: LiveIngestDepth,
): string | null {
  switch (orderBookDepth) {
    case "paid_full":
    case "trial_slice":
      return null;
    default: {
      const _never: never = orderBookDepth;
      return _never;
    }
  }
}

export const EXPLORER_GRANULARITY_OPTIONS: {
  value: ExplorerGranularity;
  label: string;
}[] = [
  { value: "Day", label: "Day" },
  { value: "Week", label: "Week" },
  { value: "Weekday", label: "Weekday" },
  { value: "Month", label: "Month" },
  { value: "Quarter", label: "Chart quarter" },
];

export const EXPLORER_MODE_OPTIONS: { value: ExplorerMode; label: string }[] = [
  { value: "stacked", label: "Channels $" },
  { value: "share", label: "Share %" },
  { value: "total", label: "Total $" },
];

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfLocalDay(d: Date): Date {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999,
  );
}

function addLocalDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return startOfLocalDay(next);
}

/** Last fully closed local calendar day (excludes incomplete today). */
export function closedDayEnd(now = new Date()): Date {
  const yesterday = addLocalDays(startOfLocalDay(now), -1);
  return endOfLocalDay(yesterday);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function dateKeyFromLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateKey(dateKey: string): Date | null {
  if (!DATE_KEY_RE.test(dateKey)) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Spend on file with no sales dollars — never paint 0× from `$0 / $spend`. */
export function isUnpairedSpendDay(sales: number, spend: number): boolean {
  return spend > 0 && !(sales > 0);
}

/**
 * Explorer Total ROAS. Sales not on file stay —. Certified `$0` with spend
 * is unpaired (—), never 0× from `sales ?? 0`.
 */
export function explorerMer(
  sales: number,
  spend: number,
  salesOnFile = true,
): number | null {
  if (salesOnFile === false) return null;
  if (isUnpairedSpendDay(sales, spend)) return null;
  return merOf(sales, spend);
}

function merOf(sales: number, spend: number): number | null {
  if (
    !Number.isFinite(sales) ||
    !Number.isFinite(spend) ||
    spend <= 0 ||
    !(sales > 0)
  ) {
    return null;
  }
  const mer = sales / spend;
  return Number.isFinite(mer) ? mer : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function parseExplorerRange(raw: string | null): ExplorerRange {
  if (raw && RANGE_PRESETS.includes(raw as ExplorerRange)) {
    return raw as ExplorerRange;
  }
  if (raw === "custom") return "custom";
  return "90d";
}

/**
 * When Overview has no `exRange` query, the route defaults to last 14 closed
 * days (Day grain). Spend / Allocation still call this to follow the
 * scoreboard period.
 */
export function explorerQueryMatchingScoreboard(
  preset: PeriodPreset,
  period: { start: Date; end: Date },
  timeZone?: string | null,
): { range: ExplorerRange; from: string | null; to: string | null } {
  const tz = timeZone?.trim() || null;
  const keyOf = (instant: Date) =>
    tz ? shopLocalDayKey(instant, tz) : dateKeyFromLocal(instant);

  switch (preset) {
    case "ytd":
      return { range: "YTD", from: null, to: null };
    case "l12m":
      return { range: "1y", from: null, to: null };
    case "y3":
      return { range: "All", from: null, to: null };
    case "mtd":
    case "lm":
    case "qtd":
      return {
        range: "custom",
        from: keyOf(period.start),
        to: keyOf(period.end),
      };
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown period preset: ${_exhaustive}`);
    }
  }
}

export function parseExplorerGranularity(
  raw: string | null,
): ExplorerGranularity {
  if (raw && GRANULARITIES.includes(raw as ExplorerGranularity)) {
    return raw as ExplorerGranularity;
  }
  return "Week";
}

export function parseExplorerMode(raw: string | null): ExplorerMode {
  if (raw && MODES.includes(raw as ExplorerMode)) {
    return raw as ExplorerMode;
  }
  return "stacked";
}

/** Apps Script `ex.showSales` — URL `exSales=1`. */
export function parseExplorerShowSales(raw: string | null): boolean {
  if (raw == null || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export type ExplorerPaintControls = {
  range: ExplorerRange;
  granularity: ExplorerGranularity;
  mode: ExplorerMode;
  showSales: boolean;
};

/**
 * Optimistic range/grain/mode paint while a same-route explorer navigation
 * is in flight. Missing explorer keys keep the current control so a period
 * refresh does not snap the chart chrome to defaults.
 */
export function paintExplorerControls(
  current: ExplorerPaintControls,
  pendingSearch: string | null | undefined,
  orderBookDepth: LiveIngestDepth,
): ExplorerPaintControls {
  const clamp = (range: ExplorerRange) =>
    clampExplorerRangeToBook(range, orderBookDepth);
  if (!pendingSearch) {
    return { ...current, range: clamp(current.range) };
  }
  const query = pendingSearch.startsWith("?")
    ? pendingSearch.slice(1)
    : pendingSearch;
  const params = new URLSearchParams(query);
  const touching =
    params.has("exRange") ||
    params.has("exGran") ||
    params.has("exMode") ||
    params.has("exSales") ||
    params.has("exFrom") ||
    params.has("exTo");
  if (!touching) return { ...current, range: clamp(current.range) };
  return {
    range: clamp(
      params.has("exRange")
        ? parseExplorerRange(params.get("exRange"))
        : current.range,
    ),
    granularity: params.has("exGran")
      ? parseExplorerGranularity(params.get("exGran"))
      : current.granularity,
    mode: params.has("exMode")
      ? parseExplorerMode(params.get("exMode"))
      : current.mode,
    showSales: parseExplorerShowSales(params.get("exSales")),
  };
}

/** Parse optional YYYY-MM-DD; returns null when missing/invalid. */
export function parseExplorerDateParam(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return parseDateKey(trimmed) ? trimmed : null;
}

/**
 * Resolve explorer window from "now" (closed-day end).
 * Custom FROM/TO (exFrom/exTo) wins when both valid and ordered.
 * All ≈ full available history capped at ~3y closed days (Apps Script: min→max rows).
 * When `options.timeZone` (IANA) is set, edges follow the shop calendar — not Fly UTC.
 */
export function resolveExplorerWindow(
  range: ExplorerRange,
  now = new Date(),
  options?: ExplorerWindowOptions,
): ExplorerWindow {
  const tz = options?.timeZone?.trim() || null;
  if (tz) {
    return resolveExplorerWindowInTimeZone(range, now, tz, options);
  }

  const end = closedDayEnd(now);
  const endStart = startOfLocalDay(end);

  const customFrom = options?.from ? parseDateKey(options.from) : null;
  const customTo = options?.to ? parseDateKey(options.to) : null;
  if (
    range === "custom" &&
    customFrom &&
    customTo &&
    customFrom.getTime() <= customTo.getTime()
  ) {
    let start = startOfLocalDay(customFrom);
    let to = endOfLocalDay(customTo);
    if (to.getTime() > end.getTime()) to = end;
    if (start.getTime() > startOfLocalDay(to).getTime()) {
      start = startOfLocalDay(to);
    }
    return {
      start,
      end: to,
      label: `${dateKeyFromLocal(start)} → ${dateKeyFromLocal(to)}`,
      range: "custom",
    };
  }

  switch (range) {
    case "14d": {
      const start = addLocalDays(endStart, -13);
      return { start, end, label: "14 closed days", range };
    }
    case "30d": {
      const start = addLocalDays(endStart, -29);
      return { start, end, label: "30 closed days", range };
    }
    case "90d": {
      const start = addLocalDays(endStart, -89);
      return { start, end, label: "90 closed days", range };
    }
    case "YTD": {
      const start = startOfLocalDay(new Date(endStart.getFullYear(), 0, 1));
      return { start, end, label: "Year to date", range };
    }
    case "1y": {
      const start = addLocalDays(endStart, -364);
      return { start, end, label: "Last 365 closed days", range };
    }
    case "All": {
      // Cap at ~3 years of closed days — Apps Script uses full row span.
      const start = addLocalDays(endStart, -1094);
      return { start, end, label: "All closed days", range };
    }
    case "custom": {
      // Custom without valid dates — fall back to 90d.
      const start = addLocalDays(endStart, -89);
      return { start, end, label: "90 closed days", range: "90d" };
    }
    default: {
      const _exhaustive: never = range;
      throw new Error(`Unknown explorer range: ${_exhaustive}`);
    }
  }
}

function resolveExplorerWindowInTimeZone(
  range: ExplorerRange,
  now: Date,
  timeZone: string,
  options?: ExplorerWindowOptions,
): ExplorerWindow {
  // Last fully closed shop-local day (excludes incomplete "today" in shop TZ).
  const lastClosedKey = listRecentClosedShopLocalDays(timeZone, 1, now)[0];
  const end = shopLocalDayRange(lastClosedKey, timeZone).end;

  const customFromKey =
    options?.from && DATE_KEY_RE.test(options.from.trim())
      ? options.from.trim()
      : null;
  const customToKey =
    options?.to && DATE_KEY_RE.test(options.to.trim())
      ? options.to.trim()
      : null;
  if (
    range === "custom" &&
    customFromKey &&
    customToKey &&
    customFromKey <= customToKey
  ) {
    let fromKey = customFromKey;
    let toKey = customToKey > lastClosedKey ? lastClosedKey : customToKey;
    if (fromKey > toKey) fromKey = toKey;
    return {
      start: shopLocalDayRange(fromKey, timeZone).start,
      end: shopLocalDayRange(toKey, timeZone).end,
      label: `${fromKey} → ${toKey}`,
      range: "custom",
    };
  }

  const takeClosed = (
    n: number,
    label: string,
    rangeId: ExplorerRange,
  ): ExplorerWindow => {
    const keys = listRecentClosedShopLocalDays(timeZone, n, now);
    return {
      start: shopLocalDayRange(keys[0], timeZone).start,
      end: shopLocalDayRange(keys[keys.length - 1], timeZone).end,
      label,
      range: rangeId,
    };
  };

  switch (range) {
    case "14d":
      return takeClosed(14, "14 closed days", range);
    case "30d":
      return takeClosed(30, "30 closed days", range);
    case "90d":
      return takeClosed(90, "90 closed days", range);
    case "1y":
      return takeClosed(365, "Last 365 closed days", range);
    case "All":
      return takeClosed(1095, "All closed days", range);
    case "YTD": {
      // Match server-local path: YTD year is the year of the last closed day
      // (not open "today"), so Jan 1 shop-morning stays in the prior year.
      const closedStart = shopLocalDayRange(lastClosedKey, timeZone).start;
      const endKey = shopLocalDayKey(closedStart, timeZone);
      const { y } = shopLocalYmd(closedStart, timeZone);
      const start = shopLocalDayRange(dateKeyFromYmd(y, 1, 1), timeZone).start;
      return {
        start,
        end: shopLocalDayRange(endKey, timeZone).end,
        label: "Year to date",
        range,
      };
    }
    case "custom":
      return takeClosed(90, "90 closed days", "90d");
    default: {
      const _exhaustive: never = range;
      throw new Error(`Unknown explorer range: ${_exhaustive}`);
    }
  }
}

function mondayOf(d: Date): Date {
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addLocalDays(startOfLocalDay(d), -dow);
}

type BucketMeta = { key: string; label: string; sortMs: number };

function isoWeekdayFromDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function bucketMetaForDay(
  date: Date,
  granularity: ExplorerGranularity,
  spansYears: boolean,
  dateKey: string,
): BucketMeta {
  const y = date.getFullYear();
  const monthIndex = date.getMonth();
  const day = date.getDate();
  const yy = ` ’${String(y).slice(2)}`;

  switch (granularity) {
    case "Day": {
      const key = dateKeyFromLocal(date);
      const label = spansYears
        ? `${monthIndex + 1}/${day}/${String(y).slice(2)}`
        : `${monthIndex + 1}/${day}`;
      return { key, label, sortMs: date.getTime() };
    }
    case "Week": {
      const mon = mondayOf(date);
      const key = `w:${dateKeyFromLocal(mon)}`;
      const label = spansYears
        ? `Wk of ${mon.getMonth() + 1}/${mon.getDate()}/${String(mon.getFullYear()).slice(2)}`
        : `Wk of ${mon.getMonth() + 1}/${mon.getDate()}`;
      return { key, label, sortMs: mon.getTime() };
    }
    case "Month": {
      const key = `m:${y}-${pad2(monthIndex + 1)}`;
      const label = `${MONTHS_SHORT[monthIndex]}${yy}`;
      return {
        key,
        label,
        sortMs: new Date(y, monthIndex, 1).getTime(),
      };
    }
    case "Quarter": {
      const q = Math.floor(monthIndex / 3) + 1;
      const key = `q:${y}-Q${q}`;
      // Apps Script: `Q${q}${yy}` e.g. "Q3 ’26"
      const label = `Q${q}${yy}`;
      return {
        key,
        label,
        sortMs: new Date(y, (q - 1) * 3, 1).getTime(),
      };
    }
    case "Weekday": {
      const iso = isoWeekdayFromDateKey(dateKey);
      return {
        key: `wd:${iso}`,
        label: WEEKDAY_LABELS[iso - 1] ?? "Mon",
        sortMs: iso,
      };
    }
    default: {
      const _exhaustive: never = granularity;
      throw new Error(`Unknown granularity: ${_exhaustive}`);
    }
  }
}

function mergeChannels(
  into: Map<string, number>,
  channels: ExplorerChannelSlice[],
): void {
  for (const { channel, amount } of channels) {
    if (!channel || !(amount > 0)) continue;
    into.set(channel, (into.get(channel) ?? 0) + amount);
  }
}

function channelsFromMap(map: Map<string, number>): ExplorerChannelSlice[] {
  return [...map.entries()]
    .map(([channel, amount]) => ({ channel, amount: round2(amount) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Aggregate daily rows into Day | Week | Month | Quarter buckets.
 * MER per bucket = Σsales ÷ Σspend (cash formula).
 */
export function bucketExplorerRows(
  rows: ExplorerDailyRow[],
  granularity: ExplorerGranularity,
): ExplorerBucket[] {
  if (!rows.length) return [];

  let minY = Infinity;
  let maxY = -Infinity;
  for (const row of rows) {
    const d = parseDateKey(row.dateKey);
    if (!d) continue;
    const y = d.getFullYear();
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const spansYears = Number.isFinite(minY) && minY !== maxY;

  type Acc = {
    label: string;
    sortMs: number;
    sales: number;
    spend: number;
    salesOnFile: boolean;
    unpairedSpend: boolean;
    channels: Map<string, number>;
  };
  const map = new Map<string, Acc>();

  for (const row of rows) {
    const d = parseDateKey(row.dateKey);
    if (!d) continue;
    const meta = bucketMetaForDay(d, granularity, spansYears, row.dateKey);
    let acc = map.get(meta.key);
    if (!acc) {
      acc = {
        label: meta.label,
        sortMs: meta.sortMs,
        sales: 0,
        spend: 0,
        salesOnFile: false,
        unpairedSpend: false,
        channels: new Map(),
      };
      map.set(meta.key, acc);
    }
    if (row.salesOnFile !== false) {
      acc.salesOnFile = true;
      acc.sales += row.sales;
    }
    acc.spend += row.spend;
    if (granularity === "Weekday" && row.spend > 0 && row.salesOnFile === false) {
      acc.unpairedSpend = true;
    }
    mergeChannels(acc.channels, row.channels);
  }

  return [...map.entries()]
    .sort((a, b) => a[1].sortMs - b[1].sortMs)
    .map(([key, acc]) => {
      const sales = round2(acc.sales);
      const spend = round2(acc.spend);
      const mer =
        granularity === "Weekday" && acc.unpairedSpend
          ? null
          : explorerMer(sales, spend, acc.salesOnFile);
      return {
        key,
        label: acc.label,
        sales,
        spend,
        mer,
        channels: channelsFromMap(acc.channels),
      };
    });
}

/** Minimal bucket shape both ExplorerBucket and ExplorerPlotBucket satisfy. */
export type ExplorerComparableBucket = {
  key: string;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
};

export type ExplorerBucketComparison = {
  key: string;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  /** Prior bucket key at the same granularity (null on malformed key). */
  priorKey: string | null;
  /** True when the prior bucket has data inside the current window. */
  hasPrior: boolean;
  priorLabel: string | null;
  priorSales: number | null;
  priorSpend: number | null;
  priorMer: number | null;
  /** current − prior; null when the prior bucket is outside the window. */
  spendDelta: number | null;
  salesDelta: number | null;
  /** Total ROAS (sales ÷ spend) delta — null when either period's spend is 0. */
  merDelta: number | null;
};

/**
 * Prior bucket key of the same length: day → previous day, week → previous
 * ISO week (Mon start), month → previous month, quarter → previous quarter.
 * Handles year boundaries (Jan → Dec, Q1 → Q4). Null on malformed keys.
 */
export function priorExplorerBucketKey(
  key: string,
  granularity: ExplorerGranularity,
): string | null {
  switch (granularity) {
    case "Day": {
      const d = parseDateKey(key);
      if (!d) return null;
      return dateKeyFromLocal(addLocalDays(d, -1));
    }
    case "Week": {
      if (!key.startsWith("w:")) return null;
      const mon = parseDateKey(key.slice(2));
      if (!mon) return null;
      return `w:${dateKeyFromLocal(addLocalDays(mon, -7))}`;
    }
    case "Month": {
      const m = /^m:(\d{4})-(\d{2})$/.exec(key);
      if (!m) return null;
      const y = Number(m[1]);
      const month = Number(m[2]);
      if (month < 1 || month > 12) return null;
      const prevY = month === 1 ? y - 1 : y;
      const prevM = month === 1 ? 12 : month - 1;
      return `m:${prevY}-${pad2(prevM)}`;
    }
    case "Quarter": {
      const m = /^q:(\d{4})-Q([1-4])$/.exec(key);
      if (!m) return null;
      const y = Number(m[1]);
      const q = Number(m[2]);
      const prevY = q === 1 ? y - 1 : y;
      const prevQ = q === 1 ? 4 : q - 1;
      return `q:${prevY}-Q${prevQ}`;
    }
    case "Weekday":
      return null;
    default: {
      const _exhaustive: never = granularity;
      throw new Error(`Unknown granularity: ${_exhaustive}`);
    }
  }
}

/**
 * Calendar span for one explorer column. Week keys are Monday–Sunday.
 * Callers should clamp `toKey` to the feed as-of day so today stays out.
 */
export function explorerBucketDateRange(
  key: string,
  granularity: ExplorerGranularity,
): { fromKey: string; toKey: string } | null {
  switch (granularity) {
    case "Day": {
      if (!DATE_KEY_RE.test(key)) return null;
      return { fromKey: key, toKey: key };
    }
    case "Week": {
      if (!key.startsWith("w:")) return null;
      const fromKey = key.slice(2);
      const mon = parseDateKey(fromKey);
      if (!mon) return null;
      return {
        fromKey,
        toKey: dateKeyFromLocal(addLocalDays(mon, 6)),
      };
    }
    case "Month": {
      const m = /^m:(\d{4})-(\d{2})$/.exec(key);
      if (!m) return null;
      const y = Number(m[1]);
      const month = Number(m[2]);
      if (month < 1 || month > 12) return null;
      const last = new Date(y, month, 0).getDate();
      return {
        fromKey: `${m[1]}-${m[2]}-01`,
        toKey: `${m[1]}-${m[2]}-${pad2(last)}`,
      };
    }
    case "Quarter": {
      const m = /^q:(\d{4})-Q([1-4])$/.exec(key);
      if (!m) return null;
      const y = Number(m[1]);
      const q = Number(m[2]);
      const startMonth = (q - 1) * 3;
      const endMonth = startMonth + 2;
      const last = new Date(y, endMonth + 1, 0).getDate();
      return {
        fromKey: `${m[1]}-${pad2(startMonth + 1)}-01`,
        toKey: `${m[1]}-${pad2(endMonth + 1)}-${pad2(last)}`,
      };
    }
    case "Weekday":
      return null;
    default: {
      const _exhaustive: never = granularity;
      throw new Error(`Unknown granularity: ${_exhaustive}`);
    }
  }
}

/** Drop a range that starts after as-of; cap the end at as-of. */
export function clampExplorerRangeToAsOf(
  range: { fromKey: string; toKey: string },
  asOfKey: string,
): { fromKey: string; toKey: string } | null {
  if (!(DATE_KEY_RE.test(asOfKey) && DATE_KEY_RE.test(range.fromKey))) {
    return range;
  }
  if (range.fromKey > asOfKey) return null;
  return {
    fromKey: range.fromKey,
    toKey: range.toKey > asOfKey ? asOfKey : range.toKey,
  };
}

/**
 * This-period-vs-prior comparison per bucket. Prior lookup is key-based (not
 * index-based) so data gaps never misalign windows. Total ROAS delta uses
 * sales ÷ spend on both sides — never inverted — and is null whenever either
 * period has no spend (ratio undefined).
 */
export function compareExplorerBuckets(
  buckets: ExplorerComparableBucket[],
  granularity: ExplorerGranularity,
): ExplorerBucketComparison[] {
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  return buckets.map((b) => {
    const priorKey = priorExplorerBucketKey(b.key, granularity);
    const prior = priorKey ? (byKey.get(priorKey) ?? null) : null;
    if (!prior) {
      return {
        key: b.key,
        label: b.label,
        sales: b.sales,
        spend: b.spend,
        mer: b.mer,
        priorKey,
        hasPrior: false,
        priorLabel: null,
        priorSales: null,
        priorSpend: null,
        priorMer: null,
        spendDelta: null,
        salesDelta: null,
        merDelta: null,
      };
    }
    return {
      key: b.key,
      label: b.label,
      sales: b.sales,
      spend: b.spend,
      mer: b.mer,
      priorKey,
      hasPrior: true,
      priorLabel: prior.label,
      priorSales: prior.sales,
      priorSpend: prior.spend,
      priorMer: prior.mer,
      spendDelta: round2(b.spend - prior.spend),
      salesDelta: round2(b.sales - prior.sales),
      merDelta:
        b.mer != null && prior.mer != null ? b.mer - prior.mer : null,
    };
  });
}

/**
 * Apply stacked ($) / share (100%) / total modes.
 * Dollar stacked mode scales channel segments down when they sum above cash spend.
 */
export function applyExplorerMode(
  buckets: ExplorerBucket[],
  mode: ExplorerMode,
): ExplorerPlotBucket[] {
  switch (mode) {
    case "total":
      return buckets.map((b) => ({
        key: b.key,
        label: b.label,
        sales: b.sales,
        spend: b.spend,
        mer: b.mer,
        bars:
          b.spend > 0
            ? [{ channel: "total", amount: round2(b.spend) }]
            : [],
        scaledToCash: false,
      }));
    case "share":
      return buckets.map((b) => {
        const chTotal = b.channels.reduce((s, c) => s + c.amount, 0);
        return {
          key: b.key,
          label: b.label,
          sales: b.sales,
          spend: b.spend,
          mer: b.mer,
          bars:
            chTotal > 0
              ? b.channels.map((c) => ({
                  channel: c.channel,
                  amount: round2((c.amount / chTotal) * 100),
                }))
              : [],
          scaledToCash: false,
        };
      });
    case "stacked":
      return buckets.map((b) => {
        const chTotal = b.channels.reduce((s, c) => s + c.amount, 0);
        const needsScale =
          chTotal > (b.spend || 0) + 0.5 && chTotal > 0 && b.spend > 0;
        const scale = needsScale ? b.spend / chTotal : 1;
        return {
          key: b.key,
          label: b.label,
          sales: b.sales,
          spend: b.spend,
          mer: b.mer,
          bars: b.channels
            .map((c) => ({
              channel: c.channel,
              amount: round2(c.amount * scale),
            }))
            .filter((c) => c.amount > 0),
          scaledToCash: needsScale,
        };
      });
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unknown explorer mode: ${_exhaustive}`);
    }
  }
}

export function summarizeExplorer(
  rows: ExplorerDailyRow[],
  options?: {
    newCustomers?: number | null;
    returningCustomers?: number | null;
    customerMetricsAvailable?: boolean;
    bucketCount?: number;
  },
): ExplorerSummary {
  let totalSales = 0;
  let totalSpend = 0;
  let closedDays = 0;
  let salesOnFile = false;
  for (const row of rows) {
    if (row.salesOnFile !== false) {
      salesOnFile = true;
      totalSales += row.sales;
    }
    totalSpend += row.spend;
    if (
      row.spend > 0 ||
      (row.salesOnFile !== false && row.sales > 0)
    ) {
      closedDays += 1;
    }
  }
  totalSales = round2(totalSales);
  totalSpend = round2(totalSpend);

  const available = Boolean(options?.customerMetricsAvailable);
  const neu = options?.newCustomers ?? null;
  const ret = options?.returningCustomers ?? null;
  const costPerNew =
    available && neu != null && neu > 0 && totalSpend > 0
      ? round2(totalSpend / neu)
      : null;
  const customers =
    available && neu != null && ret != null ? neu + ret : null;
  const costPerCustomer =
    customers != null && customers > 0 && totalSpend > 0
      ? round2(totalSpend / customers)
      : null;

  return {
    totalSales,
    totalSpend,
    overallMer: explorerMer(totalSales, totalSpend, salesOnFile),
    costPerNew,
    costPerCustomer,
    closedDays,
    bucketCount: options?.bucketCount ?? 0,
  };
}

/** Channel keys present across plot buckets (stable legend order by total $). */
export function explorerLegendChannels(
  buckets: ExplorerPlotBucket[],
  mode: ExplorerMode,
): string[] {
  if (mode === "total") return ["total"];
  const totals = new Map<string, number>();
  for (const b of buckets) {
    for (const c of b.bars) {
      totals.set(c.channel, (totals.get(c.channel) ?? 0) + c.amount);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ch]) => ch);
}

/**
 * Reorder bar segments to match legend order. Missing channels get amount 0
 * so stack band positions stay stable across buckets (Tableau-style).
 */
export function orderBarsByLegend(
  bars: ExplorerChannelSlice[],
  legendOrder: string[],
): ExplorerChannelSlice[] {
  const byCh = new Map(bars.map((s) => [s.channel, s.amount]));
  return legendOrder.map((channel) => ({
    channel,
    amount: byCh.get(channel) ?? 0,
  }));
}

export function explorerBarMax(
  buckets: ExplorerPlotBucket[],
  mode: ExplorerMode,
): number {
  if (mode === "share") return 100;
  let max = 0;
  for (const b of buckets) {
    const h =
      mode === "total"
        ? b.spend
        : b.bars.reduce((s, c) => s + c.amount, 0);
    if (h > max) max = h;
  }
  return max > 0 ? max : 1;
}

/**
 * Left-axis $ ceiling. When Sales line is on (and not share %), uses
 * max(spend bars, sales) so heights are comparable on one shared scale.
 */
export function explorerMoneyCeil(
  buckets: ExplorerPlotBucket[],
  mode: ExplorerMode,
  showSales: boolean,
): number {
  if (mode === "share") return 100;
  const barMax = explorerBarMax(buckets, mode);
  if (!showSales) return barMax;
  return explorerSalesCeil(buckets, barMax);
}

/** Left-axis ceiling when Sales line is on — max(spend bars, sales). */
export function explorerSalesCeil(
  buckets: ExplorerPlotBucket[],
  barMax: number,
): number {
  let max = barMax;
  for (const b of buckets) {
    if (b.sales > max) max = b.sales;
  }
  return max > 0 ? max : 1;
}

export function explorerMerCeil(
  buckets: ExplorerPlotBucket[],
  targetMer: number,
  breakEvenMer: number | null = null,
): number {
  let max = targetMer > 0 ? targetMer : 1;
  if (breakEvenMer != null && breakEvenMer > max) max = breakEvenMer;
  for (const b of buckets) {
    if (b.mer != null && b.mer > max) max = b.mer;
  }
  return max * 1.08;
}

/** Apps Script gran subtitle phrase (without count). */
export function explorerGranLabel(granularity: ExplorerGranularity): string {
  switch (granularity) {
    case "Week":
      return "ISO weeks (Mon start)";
    case "Day":
      return "day buckets";
    case "Month":
      return "month buckets";
    case "Quarter":
      return "quarter buckets";
    case "Weekday":
      return "weekday buckets";
    default: {
      const _exhaustive: never = granularity;
      return _exhaustive;
    }
  }
}

/**
 * Apps Script subtitle parity:
 * `{n} {gran} · spend $ · Total ROAS (Σsales ÷ Σspend) · Total ROAS = sales ÷ spend · closed days only · as of …`
 */
export function formatExplorerSubtitle(opts: {
  bucketCount: number;
  granularity: ExplorerGranularity;
  totalSpend: number;
  overallMer: number | null;
  asOfKey: string | null;
  empty?: boolean;
  formatCurrency: (n: number) => string;
  formatMer: (n: number | null) => string;
}): string {
  const formula = "Total ROAS = sales ÷ spend";
  if (opts.empty) {
    return `No closed days in the selected window · ${formula} · closed days only`;
  }
  const gran =
    opts.bucketCount === 1 && opts.granularity === "Week"
      ? "ISO week (Mon start)"
      : opts.granularity === "Week"
        ? "ISO weeks (Mon start)"
        : opts.granularity === "Day"
          ? opts.bucketCount === 1
            ? "day bucket"
            : "day buckets"
          : opts.granularity === "Month"
            ? opts.bucketCount === 1
              ? "month bucket"
              : "month buckets"
            : opts.granularity === "Weekday"
              ? opts.bucketCount === 1
                ? "weekday bucket"
                : "weekday buckets"
              : opts.bucketCount === 1
                ? "quarter bucket"
                : "quarter buckets";
  const asOf = opts.asOfKey ? ` · as of ${opts.asOfKey}` : "";
  const spendPaint =
    opts.totalSpend > 0 ? opts.formatCurrency(opts.totalSpend) : "—";
  const merPaint =
    opts.totalSpend > 0 && opts.overallMer != null
      ? opts.formatMer(opts.overallMer)
      : "—";
  return (
    `${opts.bucketCount} ${gran} · spend ${spendPaint}` +
    ` · Total ROAS ${merPaint} (Σsales ÷ Σspend)` +
    ` · ${formula} · closed days only${asOf}`
  );
}

/** Same weekday last year — 52 weeks, not the calendar date. */
export const EXPLORER_WEEKDAY_SHIFTED_YEAR_DAYS = -364;

function eachCivilKeyInclusive(fromKey: string, toKey: string): string[] {
  if (!DATE_KEY_RE.test(fromKey) || !DATE_KEY_RE.test(toKey) || fromKey > toKey) {
    return [];
  }
  const keys: string[] = [];
  let cursor = fromKey;
  for (let i = 0; i < 400; i++) {
    keys.push(cursor);
    if (cursor === toKey) break;
    cursor = shiftCivilDayKey(cursor, 1);
  }
  return keys;
}

function sumSalesOnFile(
  salesByDay: ReadonlyMap<string, number>,
  keys: readonly string[],
): number | null {
  let saw = false;
  let sum = 0;
  for (const key of keys) {
    if (!salesByDay.has(key)) continue;
    const amount = salesByDay.get(key);
    if (amount == null || !Number.isFinite(amount)) continue;
    saw = true;
    sum += amount;
  }
  return saw ? round2(sum) : null;
}

function thisWeekKeys(asOfKey: string): string[] {
  const monday = mondayOfDayKey(asOfKey);
  return eachCivilKeyInclusive(monday, asOfKey);
}

function thisMonthKeys(asOfKey: string): string[] {
  const start = `${asOfKey.slice(0, 7)}-01`;
  return eachCivilKeyInclusive(start, asOfKey);
}

function shiftedKeys(keys: readonly string[], deltaDays: number): string[] {
  return keys.map((key) => shiftCivilDayKey(key, deltaDays));
}

function formatPeriodCopy(opts: {
  label: string;
  current: number | null;
  lastYear: number | null;
  previousWeek: number | null;
  money: (n: number) => string;
  lastYearPhrase?: string;
  missingPhrase?: string;
}): string | null {
  if (opts.current == null) return null;
  const currentText = `Shopify Total Sales ${opts.label} is ${opts.money(opts.current)}`;
  if (opts.lastYear != null) {
    return `${currentText} versus ${opts.money(opts.lastYear)} ${opts.lastYearPhrase ?? "the same weekdays last year"}.`;
  }
  if (opts.previousWeek != null) {
    return `${currentText} versus ${opts.money(opts.previousWeek)} last week (same weekdays last year not on file).`;
  }
  return `${currentText}. ${opts.missingPhrase ?? "Same weekdays last year and last week are not on file."}`;
}

function calendarLastYearKeys(keys: readonly string[]): string[] | null {
  const shifted: string[] = [];
  for (const key of keys) {
    if (!DATE_KEY_RE.test(key)) return null;
    const year = Number(key.slice(0, 4)) - 1;
    const month = Number(key.slice(5, 7));
    const day = Number(key.slice(8, 10));
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (
      probe.getUTCFullYear() !== year ||
      probe.getUTCMonth() !== month - 1 ||
      probe.getUTCDate() !== day
    ) {
      return null;
    }
    shifted.push(`${String(year).padStart(4, "0")}-${key.slice(5, 7)}-${key.slice(8, 10)}`);
  }
  return shifted;
}

/** Last year prints only when every day of that window is on file. */
function sumCompleteSales(
  salesByDay: ReadonlyMap<string, number>,
  keys: readonly string[] | null,
): number | null {
  if (keys == null || keys.length === 0) return null;
  let sum = 0;
  for (const key of keys) {
    if (!salesByDay.has(key)) return null;
    const amount = salesByDay.get(key);
    if (amount == null || !Number.isFinite(amount)) return null;
    sum += amount;
  }
  return round2(sum);
}

export type ExplorerWeekMonthCopy = {
  week: string | null;
  month: string | null;
  combined: string;
};

/**
 * Copyable this-week / this-month Shopify Total Sales and the same
 * weekday-shifted last year $, or previous week $ when last year is missing.
 * Never a fake $0. A percent-only chip is not enough.
 */
export function explorerWeekMonthCopyText(opts: {
  salesByDay: ReadonlyMap<string, number>;
  asOfKey: string;
  money: (n: number) => string;
}): ExplorerWeekMonthCopy | null {
  if (!DATE_KEY_RE.test(opts.asOfKey)) return null;
  const weekKeys = thisWeekKeys(opts.asOfKey);
  const monthKeys = thisMonthKeys(opts.asOfKey);
  const prevWeekKeys = shiftedKeys(weekKeys, -7);
  const lastYearWeekKeys = shiftedKeys(
    weekKeys,
    EXPLORER_WEEKDAY_SHIFTED_YEAR_DAYS,
  );
  const week = formatPeriodCopy({
    label: "this week",
    current: sumSalesOnFile(opts.salesByDay, weekKeys),
    lastYear: sumSalesOnFile(opts.salesByDay, lastYearWeekKeys),
    previousWeek: sumSalesOnFile(opts.salesByDay, prevWeekKeys),
    money: opts.money,
  });
  const month = formatPeriodCopy({
    label: "this month",
    current: sumSalesOnFile(opts.salesByDay, monthKeys),
    lastYear: sumCompleteSales(
      opts.salesByDay,
      calendarLastYearKeys(monthKeys),
    ),
    previousWeek: null,
    money: opts.money,
    lastYearPhrase: "the same dates last year",
    missingPhrase: "Same dates last year are not on file.",
  });
  if (!week && !month) return null;
  const combined = [week, month].filter(Boolean).join("\n");
  return { week, month, combined };
}

