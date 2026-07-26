/**
 * Pure Spend Explorer math — Apps Script `renderSpendExplorer` port.
 * Cash MER = sales ÷ spend (never inverted). Channel bars are spend mix only.
 */

export type ExplorerRange = "14d" | "30d" | "90d" | "YTD" | "1y";
export type ExplorerGranularity = "Day" | "Week" | "Month";
export type ExplorerMode = "stacked" | "share" | "total";

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

const RANGE_PRESETS: ExplorerRange[] = ["14d", "30d", "90d", "YTD", "1y"];
const GRANULARITIES: ExplorerGranularity[] = ["Day", "Week", "Month"];
const MODES: ExplorerMode[] = ["stacked", "share", "total"];

export const EXPLORER_RANGE_OPTIONS: { value: ExplorerRange; label: string }[] =
  [
    { value: "14d", label: "14d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "YTD", label: "YTD" },
    { value: "1y", label: "1y" },
  ];

export const EXPLORER_GRANULARITY_OPTIONS: {
  value: ExplorerGranularity;
  label: string;
}[] = [
  { value: "Day", label: "Day" },
  { value: "Week", label: "Week" },
  { value: "Month", label: "Month" },
];

export const EXPLORER_MODE_OPTIONS: { value: ExplorerMode; label: string }[] = [
  { value: "stacked", label: "Stacked $" },
  { value: "share", label: "100% share" },
  { value: "total", label: "Total" },
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
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
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
  return "90d";
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

/**
 * Resolve explorer window from "now" (closed-day end).
 * Caps at ~366 closed days for 1y.
 */
export function resolveExplorerWindow(
  range: ExplorerRange,
  now = new Date(),
): ExplorerWindow {
  const end = closedDayEnd(now);
  const endStart = startOfLocalDay(end);

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
 * Aggregate daily rows into Day | Week | Month buckets.
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

export function explorerMerCeil(
  buckets: ExplorerPlotBucket[],
  targetMer: number,
): number {
  let max = targetMer > 0 ? targetMer : 1;
  for (const b of buckets) {
    if (b.mer != null && b.mer > max) max = b.mer;
  }
  return max * 1.08;
}
