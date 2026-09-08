/**
 * Allocation history — portfolio co-occurrence heuristics only.
 *
 * Cash Total ROAS = store sales ÷ ad spend. These helpers describe mix that
 * *co-occurred* when the till looked best — never channel causal ROAS / path credit.
 *
 * Weeks: Monday-start (`weekKey` = YYYY-MM-DD of that Monday, UTC calendar parse of dateKey).
 * Quarters: calendar Q1–Q4 from dateKey.
 * Rolling windows: closed calendar days only (exclude in-progress today).
 */

import { calculateMer } from "@mcfly/mer-core";

export type HistoryDay = {
  dateKey: string; // YYYY-MM-DD
  sales: number;
  spend: number;
  channels: Array<{ channel: string; amount: number }>;
};

export type HistoryWeek = {
  /** Monday-start week key (YYYY-MM-DD). */
  weekKey: string;
  sales: number;
  spend: number;
  mer: number | null; // sales/spend
  channelShares: Array<{ channel: string; share: number; amount: number }>;
};

export type SpendBandRow = {
  label: string;
  weekCount: number;
  avgMer: number | null;
  daysOrWeeksAboveBe: number;
  aboveBePct: number | null; // 0–1
  avgSpend: number;
};

export type BestMixStrip = {
  topWeekCount: number;
  topAvgMer: number | null;
  topShares: Array<{ channel: string; share: number }>;
  nowShares: Array<{ channel: string; share: number }>;
  diffs: Array<{ channel: string; deltaPp: number }>; // percentage points now − top
};

export type PeriodMixSlice = {
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  shares: Array<{ channel: string; share: number }>;
};

export type PeriodMixCompare = {
  mtd: PeriodMixSlice;
  lm: PeriodMixSlice;
};

export type WindowGrain = "week" | "month" | "quarter" | "year";

export type TopWindowAllocation = {
  grain: WindowGrain;
  /** Stable key for selection (week Monday, YYYY-MM, YYYY-Qn, year). */
  key: string;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  /** Budget share mix (spend %) — not channel ROAS. */
  shares: Array<{ channel: string; share: number; amount: number }>;
};

export type TopQuarterAllocation = TopWindowAllocation & {
  year: number;
  quarter: number;
};

export const WINDOW_GRAINS: readonly WindowGrain[] = [
  "week",
  "month",
  "quarter",
  "year",
] as const;

export function windowGrainLabel(grain: WindowGrain): string {
  switch (grain) {
    case "week":
      return "Weeks";
    case "month":
      return "Months";
    case "quarter":
      return "Quarters";
    case "year":
      return "Years";
    default: {
      const _exhaustive: never = grain;
      return _exhaustive;
    }
  }
}

/** Caption under Best windows — period vs last-12-month fallback. */
export function windowScopeCaption(
  grain: WindowGrain,
  scope: "period" | "lookback",
  periodLabel: string,
): string {
  const grainWord = windowGrainLabel(grain).toLowerCase();
  if (scope === "period") {
    return `Best ${grainWord} inside ${periodLabel}, ranked by Total ROAS.`;
  }
  return `${periodLabel} is too short to rank ${grainWord} — showing last 12 months instead.`;
}

export type SpendShareDiff = {
  channel: string;
  periodShare: number;
  windowShare: number;
  /** Window share − this-period share, in percentage points. */
  deltaPp: number;
};

/** Spend-share mix vs this period (budget %, not channel ROAS). */
export function compareSpendShares(
  periodShares: Array<{ channel: string; share: number }>,
  windowShares: Array<{ channel: string; share: number }>,
): SpendShareDiff[] {
  const periodMap = new Map(periodShares.map((s) => [s.channel, s.share]));
  const windowMap = new Map(windowShares.map((s) => [s.channel, s.share]));
  const channels = new Set([...periodMap.keys(), ...windowMap.keys()]);
  return [...channels]
    .map((channel) => {
      const periodShare = periodMap.get(channel) ?? 0;
      const windowShare = windowMap.get(channel) ?? 0;
      return {
        channel,
        periodShare,
        windowShare,
        deltaPp: round2((windowShare - periodShare) * 100),
      };
    })
    .sort((a, b) => {
      const byAbs = Math.abs(b.deltaPp) - Math.abs(a.deltaPp);
      if (byAbs !== 0) return byAbs;
      const byDelta = b.deltaPp - a.deltaPp;
      if (byDelta !== 0) return byDelta;
      return a.channel.localeCompare(b.channel);
    });
}

/** Default best-window grain for the desk period filter. */
export function defaultWindowGrain(
  preset: "mtd" | "lm" | "qtd" | "ytd" | "l12m" | "y3",
): WindowGrain {
  switch (preset) {
    case "mtd":
    case "lm":
      return "week";
    case "qtd":
    case "ytd":
      return "month";
    case "l12m":
    case "y3":
      return "quarter";
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

export function selectWindowsForGrain(
  periodItems: TopWindowAllocation[],
  lookbackItems: TopWindowAllocation[],
  grain: WindowGrain,
): { items: TopWindowAllocation[]; scope: "period" | "lookback" } {
  const minCount = grain === "year" ? 1 : 2;
  if (periodItems.length >= minCount) {
    return { items: periodItems, scope: "period" };
  }
  return { items: lookbackItems, scope: "lookback" };
}

export type RollingWindowTile = {
  days: 7 | 14 | 28;
  /** e.g. "Last 7d" */
  label: string;
  current: { sales: number; spend: number; mer: number | null };
  prior: { sales: number; spend: number; mer: number | null };
  /** current.mer − prior.mer (Total ROAS points); null if either side missing. */
  delta: number | null;
};

export type AllocationHistoryView = {
  weekCount: number;
  spendWeekCount: number;
  bands: SpendBandRow[];
  bestMix: BestMixStrip | null;
  /** @deprecated LM/MTD compare — kept for tests; UI uses rollingWindows. */
  periodCompare: PeriodMixCompare | null;
  topQuarters: TopQuarterAllocation[];
  rollingWindows: RollingWindowTile[];
  groundingLine: string | null;
};

/** Fixed weekly-spend bands (USD). */
export const SPEND_BAND_DEFS = [
  { label: "$0–2k", min: 0, max: 2000 },
  { label: "$2–5k", min: 2000, max: 5000 },
  { label: "$5–10k", min: 5000, max: 10000 },
  { label: "$10k+", min: 10000, max: Number.POSITIVE_INFINITY },
] as const;

const HISTORY_CLOSED_DAYS_DEFAULT = 84;
/** Cap for quarter all-time window inside L12M / facts (~1y). */
export const HISTORY_QUARTER_DAYS_CAP = 365;
/** Minimum portfolio spend ($) for a quarter to rank. */
const MEANINGFUL_QUARTER_SPEND = 100;

/** Prefer last ~N closed days inside an available fact window. */
export function resolveHistoryWindow(
  factRange: { start: Date; end: Date },
  maxClosedDays = HISTORY_CLOSED_DAYS_DEFAULT,
): { start: Date; end: Date } {
  const end = factRange.end;
  const msDay = 24 * 60 * 60 * 1000;
  const startCandidate = new Date(
    end.getTime() - (maxClosedDays - 1) * msDay,
  );
  const start =
    startCandidate.getTime() < factRange.start.getTime()
      ? factRange.start
      : startCandidate;
  return { start, end };
}

/** Keep the newest `maxDays` activity days by dateKey. */
export function capHistoryDays(
  days: HistoryDay[],
  maxDays = HISTORY_CLOSED_DAYS_DEFAULT,
): HistoryDay[] {
  if (days.length <= maxDays) {
    return [...days].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }
  return [...days]
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(-maxDays);
}

export function filterDaysByDateKeys(
  days: HistoryDay[],
  startKey: string,
  endKey: string,
): HistoryDay[] {
  return days.filter((d) => d.dateKey >= startKey && d.dateKey <= endKey);
}

/** Monday-start week key from a YYYY-MM-DD calendar day (UTC parse). */
export function mondayWeekKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=Sun … 6=Sat
  const backToMonday = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + backToMonday);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Shift a YYYY-MM-DD key by `deltaDays` using UTC noon arithmetic. */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays, 12, 0, 0));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Calendar quarter 1–4 from YYYY-MM-DD. */
export function calendarQuarter(dateKey: string): {
  year: number;
  quarter: number;
  label: string;
} {
  const [y, m] = dateKey.split("-").map(Number);
  const year = y || 0;
  const month = m || 1;
  const quarter = Math.floor((month - 1) / 3) + 1;
  return { year, quarter, label: `${year} Q${quarter}` };
}

const MONTH_SHORT = [
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

/** Calendar month from YYYY-MM-DD. */
export function calendarMonth(dateKey: string): {
  year: number;
  month: number;
  key: string;
  label: string;
} {
  const [y, m] = dateKey.split("-").map(Number);
  const year = y || 0;
  const month = m || 1;
  const name = MONTH_SHORT[month - 1] ?? "Jan";
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: `${name} ${year}`,
  };
}

/** Calendar year from YYYY-MM-DD. */
export function calendarYear(dateKey: string): {
  year: number;
  key: string;
  label: string;
} {
  const [y] = dateKey.split("-").map(Number);
  const year = y || 0;
  return { year, key: String(year), label: String(year) };
}

function weekWindowLabel(weekKey: string): string {
  const [y, m, d] = weekKey.split("-").map(Number);
  if (!y || !m || !d) return `Week of ${weekKey}`;
  const name = MONTH_SHORT[m - 1] ?? "Jan";
  return `Week of ${name} ${d}`;
}

function windowKeyForDay(
  dateKey: string,
  grain: WindowGrain,
): { key: string; label: string } {
  switch (grain) {
    case "week": {
      const key = mondayWeekKey(dateKey);
      return { key, label: weekWindowLabel(key) };
    }
    case "month": {
      const month = calendarMonth(dateKey);
      return { key: month.key, label: month.label };
    }
    case "quarter": {
      const q = calendarQuarter(dateKey);
      return { key: `${q.year}-Q${q.quarter}`, label: q.label };
    }
    case "year": {
      const year = calendarYear(dateKey);
      return { key: year.key, label: year.label };
    }
    default: {
      const _exhaustive: never = grain;
      return _exhaustive;
    }
  }
}

function minSpendForGrain(grain: WindowGrain): number {
  switch (grain) {
    case "week":
      return 50;
    case "month":
      return 100;
    case "quarter":
      return MEANINGFUL_QUARTER_SPEND;
    case "year":
      return 200;
    default: {
      const _exhaustive: never = grain;
      return _exhaustive;
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function sharesFromAmounts(
  amounts: Map<string, number>,
  total: number,
): Array<{ channel: string; share: number; amount: number }> {
  if (!(total > 0)) return [];
  return [...amounts.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([channel, amount]) => ({
      channel,
      amount: round2(amount),
      share: amount / total,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function shareList(
  amounts: Map<string, number>,
  total: number,
): Array<{ channel: string; share: number }> {
  return sharesFromAmounts(amounts, total).map(({ channel, share }) => ({
    channel,
    share,
  }));
}

export function bucketDaysToWeeks(days: HistoryDay[]): HistoryWeek[] {
  const byWeek = new Map<
    string,
    { sales: number; spend: number; channels: Map<string, number> }
  >();

  for (const day of days) {
    const weekKey = mondayWeekKey(day.dateKey);
    let bucket = byWeek.get(weekKey);
    if (!bucket) {
      bucket = { sales: 0, spend: 0, channels: new Map() };
      byWeek.set(weekKey, bucket);
    }
    bucket.sales += day.sales;
    bucket.spend += day.spend;
    for (const ch of day.channels) {
      bucket.channels.set(
        ch.channel,
        (bucket.channels.get(ch.channel) ?? 0) + ch.amount,
      );
    }
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, bucket]) => {
      const sales = round2(bucket.sales);
      const spend = round2(bucket.spend);
      return {
        weekKey,
        sales,
        spend,
        mer: calculateMer(sales, spend),
        channelShares: sharesFromAmounts(bucket.channels, spend),
      };
    });
}

export function buildSpendBands(
  weeks: HistoryWeek[],
  breakEvenMer: number | null,
): SpendBandRow[] {
  return SPEND_BAND_DEFS.map((def) => {
    const inBand = weeks.filter((w) => {
      if (def.max === Number.POSITIVE_INFINITY) return w.spend >= def.min;
      return w.spend >= def.min && w.spend < def.max;
    });
    const weekCount = inBand.length;
    const withMer = inBand.filter((w) => w.mer != null && w.spend > 0);
    const avgMer =
      withMer.length > 0
        ? withMer.reduce((s, w) => s + (w.mer as number), 0) / withMer.length
        : null;
    const aboveBe =
      breakEvenMer != null && breakEvenMer > 0
        ? withMer.filter((w) => (w.mer as number) >= breakEvenMer).length
        : 0;
    const aboveBePct =
      breakEvenMer != null && breakEvenMer > 0 && withMer.length > 0
        ? aboveBe / withMer.length
        : null;
    const avgSpend =
      weekCount > 0
        ? inBand.reduce((s, w) => s + w.spend, 0) / weekCount
        : 0;
    return {
      label: def.label,
      weekCount,
      avgMer,
      daysOrWeeksAboveBe: aboveBe,
      aboveBePct,
      avgSpend: round2(avgSpend),
    };
  });
}

function averageShares(
  weeks: HistoryWeek[],
): Array<{ channel: string; share: number }> {
  if (weeks.length === 0) return [];
  const sums = new Map<string, number>();
  for (const week of weeks) {
    for (const row of week.channelShares) {
      sums.set(row.channel, (sums.get(row.channel) ?? 0) + row.share);
    }
  }
  return [...sums.entries()]
    .map(([channel, total]) => ({
      channel,
      share: total / weeks.length,
    }))
    .sort((a, b) => b.share - a.share);
}

function nowSharesFromSpend(
  nowChannelSpend: Array<{ channel: string; amount: number }>,
): Array<{ channel: string; share: number }> {
  const total = nowChannelSpend.reduce((s, c) => s + Math.max(0, c.amount), 0);
  const amounts = new Map<string, number>();
  for (const c of nowChannelSpend) {
    if (c.amount > 0) amounts.set(c.channel, c.amount);
  }
  return shareList(amounts, total);
}

/**
 * Top-quartile weeks by Total ROAS among weeks with spend > 0.
 * Shares are portfolio co-occurrence averages — not causal channel ROAS.
 */
export function buildBestMixStrip(
  weeks: HistoryWeek[],
  nowChannelSpend: Array<{ channel: string; amount: number }>,
  _breakEvenMer?: number | null,
): BestMixStrip | null {
  const ranked = weeks
    .filter((w) => w.spend > 0 && w.mer != null)
    .sort((a, b) => (b.mer as number) - (a.mer as number));
  if (ranked.length === 0) return null;

  const topCount = Math.max(1, Math.ceil(ranked.length / 4));
  const top = ranked.slice(0, topCount);
  const topShares = averageShares(top);
  const nowShares = nowSharesFromSpend(nowChannelSpend);

  const channels = new Set([
    ...topShares.map((s) => s.channel),
    ...nowShares.map((s) => s.channel),
  ]);
  const topMap = new Map(topShares.map((s) => [s.channel, s.share]));
  const nowMap = new Map(nowShares.map((s) => [s.channel, s.share]));
  const diffs = [...channels]
    .map((channel) => ({
      channel,
      deltaPp: ((nowMap.get(channel) ?? 0) - (topMap.get(channel) ?? 0)) * 100,
    }))
    .sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp));

  const topAvgMer =
    top.reduce((s, w) => s + (w.mer as number), 0) / top.length;

  return {
    topWeekCount: top.length,
    topAvgMer,
    topShares,
    nowShares,
    diffs,
  };
}

export function aggregatePeriodSlice(
  days: HistoryDay[],
  label: string,
): PeriodMixSlice {
  let sales = 0;
  let spend = 0;
  const amounts = new Map<string, number>();
  for (const day of days) {
    sales += day.sales;
    spend += day.spend;
    for (const ch of day.channels) {
      amounts.set(ch.channel, (amounts.get(ch.channel) ?? 0) + ch.amount);
    }
  }
  sales = round2(sales);
  spend = round2(spend);
  return {
    label,
    sales,
    spend,
    mer: calculateMer(sales, spend),
    shares: shareList(amounts, spend),
  };
}

export function buildPeriodMixCompare(
  mtdDays: HistoryDay[],
  lmDays: HistoryDay[],
  labels?: { mtd?: string; lm?: string },
): PeriodMixCompare {
  return {
    mtd: aggregatePeriodSlice(mtdDays, labels?.mtd ?? "Month to date"),
    lm: aggregatePeriodSlice(lmDays, labels?.lm ?? "Last month"),
  };
}

/**
 * Top calendar quarters by portfolio Total ROAS (sales÷spend), with budget-share mix.
 * Ranked among quarters with meaningful spend; returns up to `limit` (default 3).
 */
export function buildTopQuarterAllocations(
  days: HistoryDay[],
  limit = 3,
  minSpend = MEANINGFUL_QUARTER_SPEND,
): TopQuarterAllocation[] {
  return buildTopWindowAllocations(days, "quarter", limit, minSpend).map(
    (row) => {
      const match = /^(\d{4})-Q([1-4])$/.exec(row.key);
      const year = match ? Number(match[1]) : 0;
      const quarter = match ? Number(match[2]) : 0;
      return { ...row, year, quarter };
    },
  );
}

/**
 * Top weeks / months / quarters / years by portfolio Total ROAS.
 * Mix is spend share — not causal channel ROAS.
 */
export function buildTopWindowAllocations(
  days: HistoryDay[],
  grain: WindowGrain,
  limit = 4,
  minSpend = minSpendForGrain(grain),
): TopWindowAllocation[] {
  const byKey = new Map<
    string,
    {
      label: string;
      sales: number;
      spend: number;
      channels: Map<string, number>;
    }
  >();

  for (const day of days) {
    const { key, label } = windowKeyForDay(day.dateKey, grain);
    let bucket = byKey.get(key);
    if (!bucket) {
      bucket = { label, sales: 0, spend: 0, channels: new Map() };
      byKey.set(key, bucket);
    }
    bucket.sales += day.sales;
    bucket.spend += day.spend;
    for (const ch of day.channels) {
      bucket.channels.set(
        ch.channel,
        (bucket.channels.get(ch.channel) ?? 0) + ch.amount,
      );
    }
  }

  return [...byKey.entries()]
    .map(([key, bucket]) => {
      const sales = round2(bucket.sales);
      const spend = round2(bucket.spend);
      return {
        grain,
        key,
        label: bucket.label,
        sales,
        spend,
        mer: calculateMer(sales, spend),
        shares: sharesFromAmounts(bucket.channels, spend),
      };
    })
    .filter((row) => row.spend >= minSpend && row.mer != null)
    .sort((a, b) => (b.mer as number) - (a.mer as number))
    .slice(0, Math.max(0, limit));
}

/**
 * Rolling N-day Total ROAS vs prior equal-length window.
 * `asOfDateKey` = last closed day (exclude today). Windows are contiguous calendar days.
 */
export function buildRollingWindowTiles(
  days: HistoryDay[],
  asOfDateKey: string,
  windows: Array<7 | 14 | 28> = [7, 14, 28],
): RollingWindowTile[] {
  const byKey = new Map(days.map((d) => [d.dateKey, d]));

  return windows.map((n) => {
    const currentStart = shiftDateKey(asOfDateKey, -(n - 1));
    const priorStart = shiftDateKey(asOfDateKey, -(2 * n - 1));

    const currentDays: HistoryDay[] = [];
    const priorDays: HistoryDay[] = [];
    for (let i = 0; i < n; i++) {
      const cKey = shiftDateKey(currentStart, i);
      const pKey = shiftDateKey(priorStart, i);
      currentDays.push(
        byKey.get(cKey) ?? {
          dateKey: cKey,
          sales: 0,
          spend: 0,
          channels: [],
        },
      );
      priorDays.push(
        byKey.get(pKey) ?? {
          dateKey: pKey,
          sales: 0,
          spend: 0,
          channels: [],
        },
      );
    }

    const current = aggregatePeriodSlice(currentDays, `Last ${n}d`);
    const prior = aggregatePeriodSlice(priorDays, `Prior ${n}d`);
    const delta =
      current.mer != null && prior.mer != null
        ? current.mer - prior.mer
        : null;

    return {
      days: n,
      label: `Last ${n}d`,
      current: {
        sales: current.sales,
        spend: current.spend,
        mer: current.mer,
      },
      prior: {
        sales: prior.sales,
        spend: prior.spend,
        mer: prior.mer,
      },
      delta,
    };
  });
}

export type WindowSets = Record<WindowGrain, TopWindowAllocation[]>;

export function buildWindowSets(days: HistoryDay[]): WindowSets {
  return {
    week: buildTopWindowAllocations(days, "week"),
    month: buildTopWindowAllocations(days, "month"),
    quarter: buildTopWindowAllocations(days, "quarter"),
    year: buildTopWindowAllocations(days, "year"),
  };
}

function prettyChannel(channel: string): string {
  if (!channel) return "mix";
  // Keep display labels ("Meta Ads"); title-case engine keys ("meta").
  if (channel !== channel.toLowerCase() || /\s/.test(channel)) return channel;
  return channel.charAt(0).toUpperCase() + channel.slice(1).replace(/_/g, " ");
}

/**
 * One sentence grounding the primary move in portfolio history.
 * Returns null when history cannot honestly support a line.
 */
export function historyGroundingLine(
  strip: BestMixStrip | null,
  bands: SpendBandRow[],
  primaryAction?: { channel: string; type?: string } | null,
): string | null {
  if (!strip || strip.topWeekCount <= 0) return null;

  const actionChannel = primaryAction?.channel?.trim();
  let focus = strip.diffs[0] ?? null;
  if (actionChannel && actionChannel !== "—") {
    const matched = strip.diffs.find(
      (d) => d.channel.toLowerCase() === actionChannel.toLowerCase(),
    );
    if (matched) {
      focus = matched;
    } else if (
      strip.topShares.some(
        (s) => s.channel.toLowerCase() === actionChannel.toLowerCase(),
      )
    ) {
      focus = { channel: actionChannel, deltaPp: 0 };
    }
  }

  if (!focus) {
    const bandWithWeeks = bands.find((b) => b.weekCount > 0 && b.avgMer != null);
    if (!bandWithWeeks || bandWithWeeks.avgMer == null) return null;
    return `When weekly spend sat in ${bandWithWeeks.label}, portfolio Total ROAS averaged ${bandWithWeeks.avgMer.toFixed(2)} — co-occurrence only, not path credit.`;
  }

  const topShare =
    strip.topShares.find(
      (s) => s.channel.toLowerCase() === focus.channel.toLowerCase(),
    )?.share ?? 0;
  const nowShare =
    strip.nowShares.find(
      (s) => s.channel.toLowerCase() === focus.channel.toLowerCase(),
    )?.share ?? 0;
  const name = prettyChannel(focus.channel);
  return `In your top Total ROAS weeks (when the till looked best), ${name} averaged ${(topShare * 100).toFixed(0)}% of spend; now ${(nowShare * 100).toFixed(0)}%. Portfolio co-occurrence — not channel causal ROAS.`;
}

/** Pure view builder — loader supplies days + now mix + break-even. */
export function buildAllocationHistoryView(input: {
  days: HistoryDay[];
  nowChannelSpend: Array<{ channel: string; amount: number }>;
  breakEvenMer: number | null;
  /** Last closed day key (YYYY-MM-DD) for rolling 7/14/28. */
  asOfDateKey: string;
  mtdDays?: HistoryDay[];
  lmDays?: HistoryDay[];
  primaryAction?: { channel: string; type?: string } | null;
  periodLabels?: { mtd?: string; lm?: string };
  topQuarterLimit?: number;
}): AllocationHistoryView {
  const weeks = bucketDaysToWeeks(input.days);
  const spendWeekCount = weeks.filter((w) => w.spend > 0).length;
  const bands = buildSpendBands(weeks, input.breakEvenMer);
  const bestMix =
    spendWeekCount > 0
      ? buildBestMixStrip(weeks, input.nowChannelSpend, input.breakEvenMer)
      : null;
  const mtdDays = input.mtdDays ?? [];
  const lmDays = input.lmDays ?? [];
  const periodCompare =
    mtdDays.length > 0 || lmDays.length > 0
      ? buildPeriodMixCompare(mtdDays, lmDays, input.periodLabels)
      : null;
  const topQuarters = buildTopQuarterAllocations(
    input.days,
    input.topQuarterLimit ?? 3,
  );
  const rollingWindows = input.asOfDateKey
    ? buildRollingWindowTiles(input.days, input.asOfDateKey)
    : [];
  const groundingLine = historyGroundingLine(
    bestMix,
    bands,
    input.primaryAction,
  );

  return {
    weekCount: weeks.length,
    spendWeekCount,
    bands,
    bestMix,
    periodCompare,
    topQuarters,
    rollingWindows,
    groundingLine,
  };
}
