/**
 * Pure Spend Explorer math — Apps Script `renderSpendExplorer` port.
 * Cash MER = sales ÷ spend (never inverted). Channel bars are spend mix only.
 */

import type { PeriodPreset } from "./periods";
import {
  dateKeyFromYmd,
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  shopLocalDayRange,
  shopLocalYmd,
} from "./shop-local-day";

export type ExplorerRange = "14d" | "30d" | "90d" | "YTD" | "1y" | "All" | "custom";
export type ExplorerGranularity = "Day" | "Week" | "Month" | "Quarter";
export type ExplorerMode = "stacked" | "share" | "total";
export type ExplorerMark = "bar" | "line";

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
];
const MODES: ExplorerMode[] = ["stacked", "share", "total"];

/** ISO date YYYY-MM-DD */
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const EXPLORER_RANGE_OPTIONS: { value: ExplorerRange; label: string }[] =
  [
    { value: "14d", label: "14d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "YTD", label: "YTD" },
    { value: "1y", label: "1y" },
    { value: "All", label: "All" },
  ];

export const EXPLORER_GRANULARITY_OPTIONS: {
  value: ExplorerGranularity;
  label: string;
}[] = [
  { value: "Day", label: "Day" },
  { value: "Week", label: "Week" },
  { value: "Month", label: "Month" },
  { value: "Quarter", label: "Quarter" },
];

export const EXPLORER_MODE_OPTIONS: { value: ExplorerMode; label: string }[] = [
  { value: "stacked", label: "Channels $" },
  { value: "share", label: "Share %" },
  { value: "total", label: "Total $" },
];

export const EXPLORER_MARK_OPTIONS: { value: ExplorerMark; label: string }[] = [
  { value: "bar", label: "Stacked bar" },
  { value: "line", label: "Line" },
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

function merOf(sales: number, spend: number): number | null {
  if (!Number.isFinite(sales) || !Number.isFinite(spend) || spend <= 0) {
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
 * When Overview has no `exRange` query, the chart follows the scoreboard
 * period instead of a separate 14-day window.
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

/**
 * Day buckets for short windows so missing spend reads as a $0 hole
 * instead of one fat bar. Week for long windows so All/1y stay readable.
 */
export function defaultExplorerGranularity(
  range: ExplorerRange,
): ExplorerGranularity {
  switch (range) {
    case "14d":
    case "30d":
    case "custom":
      return "Day";
    case "90d":
    case "YTD":
    case "1y":
    case "All":
      return "Week";
    default: {
      const _exhaustive: never = range;
      return _exhaustive;
    }
  }
}

/**
 * Unset `exSales` means sales-on — mix vs that day's sales is the $39 view.
 * Explicit `exSales=0` still turns the line off. `parseExplorerShowSales(null)`
 * stays false so URL parsers do not invert a missing flag elsewhere.
 */
export function explorerShowSalesDefault(raw: string | null): boolean {
  if (raw == null || raw === "") return true;
  return parseExplorerShowSales(raw);
}

/**
 * Insert $0 sales/spend days so a sparse CSV does not collapse into one bar.
 * Calendar keys increment as YYYY-MM-DD (UTC date arithmetic).
 */
export function fillExplorerDayHoles(
  rows: ExplorerDailyRow[],
  startKey: string,
  endKey: string,
): ExplorerDailyRow[] {
  if (!DATE_KEY_RE.test(startKey) || !DATE_KEY_RE.test(endKey)) {
    return rows;
  }
  if (startKey > endKey) return rows;
  const byKey = new Map(rows.map((row) => [row.dateKey, row]));
  const filled: ExplorerDailyRow[] = [];
  let guard = 0;
  for (let key = startKey; key <= endKey; ) {
    filled.push(
      byKey.get(key) ?? {
        dateKey: key,
        sales: 0,
        spend: 0,
        channels: [],
      },
    );
    const next = nextUtcCalendarDayKey(key);
    if (!next || next <= key) break;
    key = next;
    guard += 1;
    if (guard > 2000) break;
  }
  return filled;
}

function nextUtcCalendarDayKey(dateKey: string): string {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  return dateKeyFromLocal(addLocalDays(parsed, 1));
}

export function parseExplorerMode(raw: string | null): ExplorerMode {
  if (raw && MODES.includes(raw as ExplorerMode)) {
    return raw as ExplorerMode;
  }
  return "stacked";
}

/** Stacked bar is the default mix. `line` is the same mix as polylines — not attribution. */
export function parseExplorerMark(raw: string | null): ExplorerMark {
  if (raw === "line" || raw === "bar") return raw;
  return "bar";
}

/** Apps Script `ex.showSales` — URL `exSales=1`. */
export function parseExplorerShowSales(raw: string | null): boolean {
  if (raw == null || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
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

function bucketMetaForDay(
  date: Date,
  granularity: ExplorerGranularity,
  spansYears: boolean,
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
    channels: Map<string, number>;
  };
  const map = new Map<string, Acc>();

  for (const row of rows) {
    const d = parseDateKey(row.dateKey);
    if (!d) continue;
    const meta = bucketMetaForDay(d, granularity, spansYears);
    let acc = map.get(meta.key);
    if (!acc) {
      acc = {
        label: meta.label,
        sortMs: meta.sortMs,
        sales: 0,
        spend: 0,
        channels: new Map(),
      };
      map.set(meta.key, acc);
    }
    acc.sales += row.sales;
    acc.spend += row.spend;
    mergeChannels(acc.channels, row.channels);
  }

  return [...map.entries()]
    .sort((a, b) => a[1].sortMs - b[1].sortMs)
    .map(([key, acc]) => {
      const sales = round2(acc.sales);
      const spend = round2(acc.spend);
      return {
        key,
        label: acc.label,
        sales,
        spend,
        mer: merOf(sales, spend),
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
    default: {
      const _exhaustive: never = granularity;
      throw new Error(`Unknown granularity: ${_exhaustive}`);
    }
  }
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
  for (const row of rows) {
    totalSales += row.sales;
    totalSpend += row.spend;
    if (row.sales > 0 || row.spend > 0) closedDays += 1;
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
    overallMer: merOf(totalSales, totalSpend),
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

/** SVG / aria ids cannot keep `:` from week keys or `other:billboard`. */
export function explorerSafeId(key: string): string {
  const cleaned = key.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "col";
}

export type ExplorerReadout = {
  /** Shopify sales in the window — the ceiling for every cash figure here. */
  sales: number;
  /** Cash ad spend in the window. */
  spend: number;
  /** sales − spend. Negative means ads cost more than the till took. */
  cashLeftAfterAds: number;
  /** Σsales ÷ Σspend, or null with no spend. */
  mer: number | null;
  /** Closed days in the window (including $0 holes). */
  closedDays: number;
  /** Closed days that actually carry spend. */
  daysWithSpend: number;
  /** Closed days with no invoice — drawn as $0 holes. */
  zeroSpendDays: number;
};

/**
 * One honest cash readout for the window. Spend is clamped to the summed
 * channel mix so a scaled bar and the strip never disagree, and no figure here
 * is allowed to exceed the shop's own sales for the window.
 */
export function explorerReadout(
  buckets: ExplorerPlotBucket[],
  summary: Pick<ExplorerSummary, "totalSales" | "totalSpend" | "closedDays">,
): ExplorerReadout {
  const sales = Number.isFinite(summary.totalSales)
    ? Math.max(0, summary.totalSales)
    : 0;
  const spend = Number.isFinite(summary.totalSpend)
    ? Math.max(0, summary.totalSpend)
    : 0;
  let daysWithSpend = 0;
  for (const bucket of buckets) {
    if (bucket.spend > 0) daysWithSpend += 1;
  }
  const closedDays = Math.max(summary.closedDays, buckets.length);
  return {
    sales,
    spend,
    cashLeftAfterAds: round2(sales - spend),
    mer: merOf(sales, spend),
    closedDays,
    daysWithSpend,
    zeroSpendDays: Math.max(0, buckets.length - daysWithSpend),
  };
}

/**
 * Days of spend still needed before a window reads as a real period rather
 * than a couple of invoices. Null once the window is covered.
 */
export function explorerNeedsDays(
  readout: ExplorerReadout,
  wanted = 7,
): number | null {
  const missing = wanted - readout.daysWithSpend;
  return missing > 0 ? missing : null;
}

/**
 * Period mix share (0–1) per channel from plot bars.
 * Share-% mode reconstructs dollars from bucket spend so the legend % is cash mix,
 * not a mean of daily percentages. Total-$ mode is a single 100% band.
 */
export function explorerMixShares(
  buckets: ExplorerPlotBucket[],
  mode: ExplorerMode,
): Record<string, number> {
  const amounts = new Map<string, number>();
  for (const bucket of buckets) {
    if (mode === "share") {
      const spend = Number.isFinite(bucket.spend) ? bucket.spend : 0;
      for (const bar of bucket.bars) {
        const pct = Number.isFinite(bar.amount) ? bar.amount : 0;
        const dollars = spend * (pct / 100);
        amounts.set(bar.channel, (amounts.get(bar.channel) ?? 0) + dollars);
      }
    } else {
      for (const bar of bucket.bars) {
        const amt = Number.isFinite(bar.amount) ? bar.amount : 0;
        amounts.set(bar.channel, (amounts.get(bar.channel) ?? 0) + amt);
      }
    }
  }
  const total = [...amounts.values()].reduce((sum, n) => sum + n, 0);
  const out: Record<string, number> = {};
  for (const [channel, amount] of amounts) {
    out[channel] = total > 0 ? amount / total : 0;
  }
  return out;
}

function finiteOr(n: number, fallback: number): number {
  return Number.isFinite(n) ? n : fallback;
}

export const EXPLORER_PAD = { l: 56, r: 48, t: 16, b: 28 } as const;
export const EXPLORER_PLOT_H = 270;

export type ExplorerPlotSeg = {
  channel: string;
  amount: number;
  x: number;
  y: number;
  w: number;
  h: number;
  yTop: number;
};

export type ExplorerPlotColumn = {
  key: string;
  safeId: string;
  label: string;
  xCenter: number;
  slotX: number;
  slotW: number;
  barX: number;
  barW: number;
  segs: ExplorerPlotSeg[];
  hole: boolean;
  merY: number | null;
  salesY: number | null;
  /** Day grain only — this column starts an ISO week (Monday). */
  weekStart: boolean;
};

/** True when a `YYYY-MM-DD` bucket key falls on a Monday. */
export function isWeekStartKey(key: string): boolean {
  const parsed = parseDateKey(key);
  return parsed != null && parsed.getDay() === 1;
}

export type ExplorerChannelBand = {
  channel: string;
  /** Stacked-area path (line mark). Empty when a band cannot be drawn. */
  d: string;
  /** Polyline along the band top. */
  points: string;
};

export type ExplorerPlotModel = {
  vbW: number;
  vbH: number;
  leftCeil: number;
  merCeil: number;
  columns: ExplorerPlotColumn[];
  merLine: string;
  salesLine: string;
  channelBands: ExplorerChannelBand[];
  hasPlot: boolean;
};

function explorerColMinPx(
  granularity: ExplorerGranularity,
  mode: ExplorerMode,
): number {
  if (granularity === "Day") return 28;
  if (granularity === "Quarter") return 64;
  if (mode === "total") return 48;
  return 52;
}

function polylinePoints(
  pts: Array<{ x: number; y: number | null }>,
): string {
  return pts
    .filter((p) => Number.isFinite(p.x) && p.y != null && Number.isFinite(p.y))
    .map((p) => `${p.x},${p.y as number}`)
    .join(" ");
}

/**
 * Layout for stacked bar vs line. Never emits NaN coordinates — $0 days are
 * baseline holes, Billboard extras stack as `other:<slug>`.
 */
export function buildExplorerPlotModel(input: {
  buckets: ExplorerPlotBucket[];
  mode: ExplorerMode;
  mark: ExplorerMark;
  granularity: ExplorerGranularity;
  showSales: boolean;
  targetMer: number;
  breakEvenMer: number | null;
  hiddenChannels?: ReadonlySet<string>;
}): ExplorerPlotModel {
  const hidden = input.hiddenChannels ?? new Set<string>();
  const isShare = input.mode === "share";
  const showSales = input.showSales && !isShare;
  const legend = explorerLegendChannels(input.buckets, input.mode).filter(
    (ch) => !hidden.has(ch),
  );
  const n = input.buckets.length;
  const colMinPx = explorerColMinPx(input.granularity, input.mode);
  const vbW = Math.max(360, n * colMinPx);
  const vbH = EXPLORER_PAD.t + EXPLORER_PLOT_H + EXPLORER_PAD.b;
  const plotW = Math.max(1, vbW - EXPLORER_PAD.l - EXPLORER_PAD.r);
  const slotW = n > 0 ? plotW / n : plotW;
  const barW = slotW * (input.mark === "line" ? 0.28 : 0.62);
  const leftCeil = finiteOr(
    explorerMoneyCeil(input.buckets, input.mode, showSales),
    1,
  );
  const merCeil = finiteOr(
    explorerMerCeil(input.buckets, input.targetMer, input.breakEvenMer),
    1,
  );
  const yLeft = (val: number) =>
    EXPLORER_PAD.t +
    EXPLORER_PLOT_H -
    (leftCeil > 0 ? (finiteOr(val, 0) / leftCeil) * EXPLORER_PLOT_H : 0);
  const yMer = (val: number) =>
    EXPLORER_PAD.t +
    EXPLORER_PLOT_H -
    (merCeil > 0 ? (finiteOr(val, 0) / merCeil) * EXPLORER_PLOT_H : 0);

  const columns: ExplorerPlotColumn[] = input.buckets.map((bucket, i) => {
    const ordered = orderBarsByLegend(bucket.bars, legend);
    const cx = EXPLORER_PAD.l + (i + 0.5) * slotW;
    const x = cx - barW / 2;
    let yCursor = EXPLORER_PAD.t + EXPLORER_PLOT_H;
    const segs: ExplorerPlotSeg[] = [];
    for (const seg of ordered) {
      const amount = finiteOr(seg.amount, 0);
      const h =
        amount > 0 && leftCeil > 0 ? (amount / leftCeil) * EXPLORER_PLOT_H : 0;
      const safeH = finiteOr(h, 0);
      yCursor -= safeH;
      const yTop = finiteOr(yCursor, EXPLORER_PAD.t + EXPLORER_PLOT_H);
      segs.push({
        channel: seg.channel,
        amount,
        x: finiteOr(x, EXPLORER_PAD.l),
        y: yTop,
        w: finiteOr(barW, 1),
        h: safeH,
        yTop,
      });
    }
    const merY =
      bucket.mer != null && Number.isFinite(bucket.mer) && merCeil > 0
        ? yMer(Math.min(bucket.mer, merCeil))
        : null;
    const salesY =
      showSales && Number.isFinite(bucket.sales)
        ? yLeft(Math.min(bucket.sales, leftCeil))
        : null;
    return {
      key: bucket.key,
      safeId: explorerSafeId(bucket.key),
      label: bucket.label,
      xCenter: finiteOr(cx, EXPLORER_PAD.l),
      slotX: finiteOr(EXPLORER_PAD.l + i * slotW, EXPLORER_PAD.l),
      slotW: finiteOr(slotW, 1),
      barX: finiteOr(x, EXPLORER_PAD.l),
      barW: finiteOr(barW, 1),
      segs,
      hole: !(bucket.spend > 0) && !bucket.bars.some((b) => b.amount > 0),
      merY: merY != null && Number.isFinite(merY) ? merY : null,
      salesY: salesY != null && Number.isFinite(salesY) ? salesY : null,
      weekStart:
        input.granularity === "Day" && i > 0 && isWeekStartKey(bucket.key),
    };
  });

  const merLine = polylinePoints(
    columns.map((c) => ({ x: c.xCenter, y: c.merY })),
  );
  const salesLine = polylinePoints(
    columns.map((c) => ({ x: c.xCenter, y: c.salesY })),
  );

  const baseline = EXPLORER_PAD.t + EXPLORER_PLOT_H;
  const channelBands: ExplorerChannelBand[] = legend.map((channel) => {
    const tops: Array<{ x: number; y: number }> = [];
    const bottoms: Array<{ x: number; y: number }> = [];
    for (const col of columns) {
      const idx = col.segs.findIndex((s) => s.channel === channel);
      const seg = idx >= 0 ? col.segs[idx] : null;
      const yTop = seg && Number.isFinite(seg.yTop) ? seg.yTop : baseline;
      const yBot =
        idx > 0 && col.segs[idx - 1] && Number.isFinite(col.segs[idx - 1]!.yTop)
          ? col.segs[idx - 1]!.yTop
          : baseline;
      tops.push({ x: col.xCenter, y: yTop });
      bottoms.push({ x: col.xCenter, y: yBot });
    }
    const points = polylinePoints(tops.map((p) => ({ x: p.x, y: p.y })));
    let d = "";
    if (tops.length >= 2) {
      const up = tops.map((p) => `${p.x},${p.y}`).join(" L ");
      const down = [...bottoms]
        .reverse()
        .map((p) => `${p.x},${p.y}`)
        .join(" L ");
      d = `M ${up} L ${down} Z`;
      if (d.includes("NaN") || d.includes("Infinity")) d = "";
    }
    return { channel, d, points };
  });

  return {
    vbW: finiteOr(vbW, 360),
    vbH: finiteOr(vbH, EXPLORER_PAD.t + EXPLORER_PLOT_H + EXPLORER_PAD.b),
    leftCeil,
    merCeil,
    columns,
    merLine,
    salesLine,
    channelBands,
    hasPlot: n > 0,
  };
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
            : opts.bucketCount === 1
              ? "quarter bucket"
              : "quarter buckets";
  const asOf = opts.asOfKey ? ` · as of ${opts.asOfKey}` : "";
  return (
    `${opts.bucketCount} ${gran} · spend ${opts.formatCurrency(opts.totalSpend)}` +
    ` · Total ROAS ${opts.formatMer(opts.overallMer)} (Σsales ÷ Σspend)` +
    ` · ${formula} · closed days only${asOf}`
  );
}
