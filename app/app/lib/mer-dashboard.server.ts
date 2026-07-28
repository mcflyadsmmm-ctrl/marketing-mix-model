import prisma from "../db.server";
import {
  channelMix,
  computeBreakEvenMer,
  computeMer,
  sumSpend,
  SPEND_CHANNELS,
  SPEND_CHANNEL_LABELS,
  type ChannelSpend,
  type SpendChannel,
} from "@mcfly/mer-engine";
import {
  suggestAllocation,
  type SuggestAllocationResult,
} from "@mcfly/mer-core";
import type { DateRange } from "./periods";
import { localDayKey, utcDayKey } from "./sample-desk.server";
import {
  listRecentClosedShopLocalDays,
  nextShopLocalDayKey,
  shopLocalDayKey,
  utcMidnightFromDayKey,
} from "./shop-local-day";
import {
  collectFilledSpendDayKeys,
  computeSpendPeriodCoverage,
  countClosedDaysInPeriod,
  resolveHonestSales,
  type FreshnessSource,
  type SpendPeriodCoverage,
} from "./mer-trust";
import {
  applyExplorerMode,
  bucketExplorerRows,
  summarizeExplorer,
  type ExplorerDailyRow,
  type ExplorerGranularity,
  type ExplorerMode,
  type ExplorerPlotBucket,
  type ExplorerSummary,
  type ExplorerWindow,
} from "./spend-explorer";
import {
  buildTillLtvSummary,
  type TillLtvSummary,
} from "./till-ltv.server";
import { countNewBuyersInRange } from "./order-facts.server";

const CHANNEL_DISPLAY = SPEND_CHANNEL_LABELS;

export type { FreshnessSource, SpendPeriodCoverage };

/** D3 trust: last overnight snapshot / sync, live sales pull, spend log time. */
export interface DashboardFreshness {
  snapshotAt: string | null;
  syncAt: string | null;
  lastAt: string | null;
  source: FreshnessSource;
  /** When Shopify (or sample) sales were pulled for this desk render. */
  salesPulledAt: string | null;
  /** Latest spend entry touch in the active desk scope (ISO). */
  spendUpdatedAt: string | null;
}

/** One closed calendar day for the 14-day channel × MER stack. */
export interface DailySpineDay {
  dateKey: string;
  label: string;
  sales: number;
  spend: number;
  mer: number | null;
  aboveTarget: boolean | null;
  channels: Array<{ channel: SpendChannel; amount: number }>;
}

/** Month/period pace + safe-spend headroom at the target rail. */
export interface ControlPace {
  daysElapsed: number;
  daysInPeriod: number;
  remainingDays: number;
  densityLabel: string;
  projSales: number;
  projSpend: number;
  /**
   * Pace-forward MER — equals current MER when sales/spend share one multiplier.
   * Kept for headroom math; do not render as a distinct “Projected ME” tile.
   */
  projMer: number | null;
  /** Period safe spend at rail: sales ÷ target − spend (actuals). */
  headroomPeriod: number;
  /** Projected close headroom at rail (pace-forward). */
  headroomMonth: number;
  headroomDay: number;
  /** Current ME at or above target (not a distinct projected forecast). */
  railOk: boolean;
  statusLabel: string;
  /**
   * Period sales required so ME hits target at expected (pace-forward) spend:
   * projSpend × targetMer.
   */
  targetPeriodSales: number;
  /** Sales needed per remaining day to hit pace-forward spend × target MER. */
  dailySalesNeeded: number;
  /** Sales vs projected period sales at rail (0–100). */
  salesProgressPct: number;
  /** Calendar elapsed share of the period (0–100). */
  calendarProgressPct: number;
  progressCls: "good" | "warn" | "bad";
}

/** Prior-window deltas for Sales / Spend / MER KPI lines. */
export interface PeriodDeltas {
  priorLabel: string;
  priorSales: number;
  priorSpend: number;
  priorMer: number | null;
  salesPct: number | null;
  spendPct: number | null;
  /** Absolute MER change (current − prior), in × units. */
  merAbs: number | null;
}

export interface DashboardMetrics {
  period: DateRange;
  sales: number;
  salesSource: "shopify" | "mock";
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  /** False when Shopify denied order.customer (needs read_customers + reinstall). */
  customerMetricsAvailable: boolean;
  /** True when Cash MER is driven by the Demo sample desk (not live Shopify). */
  useSampleDesk: boolean;
  /**
   * True when caller passed mock sales with sample desk OFF —
   * till totals were zeroed; UI must not label as live Shopify.
   */
  blockedMockAsLive: boolean;
  totalSpend: number;
  mer: number | null;
  breakEvenMer: number | null;
  targetMer: number;
  marginPct: number;
  channelMix: ReturnType<typeof channelMix>;
  aboveBreakEven: boolean | null;
  allocation: SuggestAllocationResult | null;
  onboarding: RitualOnboarding;
  freshness: DashboardFreshness;
  /** Closed-day spend coverage vs selected period (recon-style honesty). */
  spendCoverage: SpendPeriodCoverage;
  /** Last ≤14 closed days — channel stack + MER rail. */
  dailySpine: DailySpineDay[];
  /** Safe-spend headroom + days-elapsed density. */
  control: ControlPace;
  /** Prior-period Sales / Spend / MER deltas (null when prior fetch skipped). */
  deltas: PeriodDeltas | null;
  /** Till LTV — opaque cohorts (Level 1), not email CRM. */
  tillLtv: TillLtvSummary;
}

export async function ensureShop(domain: string) {
  return prisma.shop.upsert({
    where: { domain },
    create: { domain },
    update: {},
  });
}

export async function getOrCreateSettings(shopId: string) {
  // find-then-create leaves marginConfirmedAt null until Settings save
  const existing = await prisma.settings.findUnique({ where: { shopId } });
  if (existing) return existing;
  return prisma.settings.create({ data: { shopId } });
}

/** True after the merchant confirmed margin via Settings save (not just defaults). */
export function marginIsConfirmed(settings: {
  marginConfirmedAt: Date | null;
}): boolean {
  return settings.marginConfirmedAt != null;
}

export interface RitualOnboarding {
  /** Margin confirmed via Settings save (or sample desk treated as confirmed). */
  settingsSaved: boolean;
  hasSpend: boolean;
  /** First-run guide until margin confirmed and spend exists */
  showGuide: boolean;
}

export async function getDashboardFreshness(
  shopId: string,
  options?: {
    salesPulledAt?: string | null;
    spendUpdatedAt?: string | null;
  },
): Promise<DashboardFreshness> {
  const [snapshot, syncRun] = await Promise.all([
    prisma.merSnapshot.findFirst({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.syncRun.findFirst({
      where: { shopId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
  ]);

  const snapshotAt = snapshot?.createdAt.toISOString() ?? null;
  const syncAt = syncRun?.finishedAt?.toISOString() ?? null;
  const salesPulledAt = options?.salesPulledAt ?? null;
  const spendUpdatedAt = options?.spendUpdatedAt ?? null;

  if (!snapshotAt && !syncAt) {
    return {
      snapshotAt: null,
      syncAt: null,
      lastAt: salesPulledAt,
      source: "live",
      salesPulledAt,
      spendUpdatedAt,
    };
  }

  const snapshotMs = snapshotAt ? Date.parse(snapshotAt) : Number.NEGATIVE_INFINITY;
  const syncMs = syncAt ? Date.parse(syncAt) : Number.NEGATIVE_INFINITY;
  const preferSnapshot = snapshotMs >= syncMs;

  return {
    snapshotAt,
    syncAt,
    lastAt: preferSnapshot ? snapshotAt : syncAt,
    source: preferSnapshot ? "snapshot" : "sync",
    salesPulledAt,
    spendUpdatedAt,
  };
}

/**
 * Closed-day spend coverage for the selected period — sparse CSV gaps, not attribution.
 */
export async function getSpendPeriodCoverage(
  shopId: string,
  range: DateRange,
  options?: {
    sampleOnly?: boolean;
    excludeSample?: boolean;
    now?: Date;
    /** Preloaded spend rows overlapping `range` — skips a second DB read. */
    entries?: SpendEntrySlice[];
  },
): Promise<SpendPeriodCoverage> {
  const now = options?.now ?? new Date();
  const entries =
    options?.entries?.filter((e) => e.amount > 0) ??
    (
      await prisma.spendEntry.findMany({
        where: {
          shopId,
          periodStart: { lte: range.end },
          periodEnd: { gte: range.start },
          amount: { gt: 0 },
          ...(options?.sampleOnly
            ? { source: "sample" }
            : options?.excludeSample
              ? { NOT: { source: "sample" } }
              : {}),
        },
        select: { periodStart: true, periodEnd: true, amount: true },
      })
    );

  const filled = collectFilledSpendDayKeys(
    entries,
    range.start,
    range.end,
    now,
  );
  return computeSpendPeriodCoverage({
    daysWithSpend: filled.size,
    daysInPeriod: countClosedDaysInPeriod(range.start, range.end, now),
  });
}

type SpendEntrySlice = {
  channel: SpendChannel | string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
};

function channelSpendFromEntries(entries: SpendEntrySlice[]): ChannelSpend[] {
  const totals = emptyChannelTotals();
  for (const entry of entries) {
    const ch = entry.channel as SpendChannel;
    if (ch in totals) totals[ch] += entry.amount;
  }
  return SPEND_CHANNELS.map((channel) => ({
    channel,
    amount: totals[channel],
  }));
}

async function loadSpendEntries(
  shopId: string,
  range: DateRange,
  options?: { sampleOnly?: boolean; excludeSample?: boolean },
): Promise<SpendEntrySlice[]> {
  return prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: range.end },
      periodEnd: { gte: range.start },
      ...(options?.sampleOnly
        ? { source: "sample" }
        : options?.excludeSample
          ? { NOT: { source: "sample" } }
          : {}),
    },
    select: {
      channel: true,
      amount: true,
      periodStart: true,
      periodEnd: true,
    },
  });
}

export async function getSpendByChannel(
  shopId: string,
  range: DateRange,
  options?: { sampleOnly?: boolean; excludeSample?: boolean },
): Promise<ChannelSpend[]> {
  const entries = await loadSpendEntries(shopId, range, options);
  return channelSpendFromEntries(entries);
}

export function buildAllocationSuggestion(
  spends: ChannelSpend[],
  totalSales: number,
  totalSpend: number,
  breakEvenMer: number | null,
): SuggestAllocationResult | null {
  if (breakEvenMer === null) {
    return null;
  }

  return suggestAllocation({
    channels: spends
      .filter((s) => s.amount > 0)
      .map((s) => ({
        name: CHANNEL_DISPLAY[s.channel],
        spend: s.amount,
        isManual:
          s.channel === "other" ||
          s.channel === "affiliate" ||
          s.channel === "email",
      })),
    breakEvenMer,
    totalSales,
    totalSpend,
  });
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addLocalDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return startOfLocalDay(next);
}

function closedDayEnd(now = new Date()): Date {
  // Exclude incomplete today — last closed local day ends yesterday 23:59:59.999
  const yesterday = addLocalDays(startOfLocalDay(now), -1);
  return new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
    23,
    59,
    59,
    999,
  );
}

function dayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return `${m}/${d}`;
}

function emptyChannelTotals(): Record<SpendChannel, number> {
  return Object.fromEntries(SPEND_CHANNELS.map((c) => [c, 0])) as Record<
    SpendChannel,
    number
  >;
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function addUtcDays(d: Date, n: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n),
  );
}

function endOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

/**
 * Attribute a spend entry across overlapping closed calendar days
 * (single-day CSV rows stay intact; multi-day ranges prorate evenly).
 * Uses UTC day stamps — matches SalesDayFact / CSV `YYYY-MM-DD` storage.
 */
function attributeSpendAcrossDays(
  periodStart: Date,
  periodEnd: Date,
  amount: number,
  windowStart: Date,
  windowEnd: Date,
): Array<{ dateKey: string; amount: number }> {
  const start = startOfUtcDay(
    periodStart < windowStart ? windowStart : periodStart,
  );
  const end = startOfUtcDay(periodEnd > windowEnd ? windowEnd : periodEnd);
  if (end < start || amount <= 0) return [];

  const fullStart = startOfUtcDay(periodStart);
  const fullEnd = startOfUtcDay(periodEnd);
  const fullDays =
    Math.round((fullEnd.getTime() - fullStart.getTime()) / 86_400_000) + 1;
  const perDay = amount / Math.max(1, fullDays);

  const out: Array<{ dateKey: string; amount: number }> = [];
  for (let cursor = start; cursor <= end; cursor = addUtcDays(cursor, 1)) {
    out.push({ dateKey: utcDayKey(cursor), amount: perDay });
  }
  return out;
}

/**
 * Closed-day cash spine for an arbitrary window (≤ ~366 days).
 * Sales from Shopify/sample map; spend attributed across overlapping CSV days.
 * When `timeZone` is set, row keys follow shop IANA calendar days (matching
 * live/facts `salesByDay` keys) instead of the server process TZ.
 */
export async function buildDailyRowsForWindow(
  shopId: string,
  options: {
    sampleOnly?: boolean;
    excludeSample?: boolean;
    salesByDay: Map<string, number>;
    windowStart: Date;
    windowEnd: Date;
    timeZone?: string | null;
    /** Preloaded spend rows — skips a second DB read when the caller already has them. */
    spendEntries?: SpendEntrySlice[];
  },
): Promise<ExplorerDailyRow[]> {
  const timeZone = options.timeZone || null;
  // Shop IANA when known; else server-local keys (sample / legacy explorer windows).
  const startKey = timeZone
    ? shopLocalDayKey(options.windowStart, timeZone)
    : localDayKey(startOfLocalDay(options.windowStart));
  const endKey = timeZone
    ? shopLocalDayKey(options.windowEnd, timeZone)
    : localDayKey(startOfLocalDay(options.windowEnd));
  const stepTz = timeZone ?? "UTC";
  // Spend overlap query uses UTC-midnight stamps of those calendar keys so
  // CSV day rows align with SalesDayFact / shop-local sales keys.
  const windowStart = utcMidnightFromDayKey(startKey);
  const windowEnd = utcMidnightFromDayKey(endKey);

  const entries =
    options.spendEntries ??
    (await prisma.spendEntry.findMany({
      where: {
        shopId,
        periodStart: { lte: endOfUtcDay(windowEnd) },
        periodEnd: { gte: windowStart },
        ...(options.sampleOnly
          ? { source: "sample" }
          : options.excludeSample
            ? { NOT: { source: "sample" } }
            : {}),
      },
      select: {
        channel: true,
        amount: true,
        periodStart: true,
        periodEnd: true,
      },
    }));

  const byDay = new Map<
    string,
    { sales: number; channels: Record<SpendChannel, number> }
  >();

  const ensureDay = (key: string) => {
    let row = byDay.get(key);
    if (!row) {
      row = { sales: 0, channels: emptyChannelTotals() };
      byDay.set(key, row);
    }
    return row;
  };

  for (const [key, sales] of options.salesByDay) {
    if (key < startKey || key > endKey) continue;
    ensureDay(key).sales += sales;
  }

  for (const entry of entries) {
    const slices = attributeSpendAcrossDays(
      entry.periodStart,
      entry.periodEnd,
      entry.amount,
      windowStart,
      endOfUtcDay(windowEnd),
    );
    for (const slice of slices) {
      const row = ensureDay(slice.dateKey);
      row.channels[entry.channel as SpendChannel] += slice.amount;
    }
  }

  const rows: ExplorerDailyRow[] = [];
  for (
    let dateKey = startKey;
    dateKey <= endKey;
    dateKey = nextShopLocalDayKey(dateKey, stepTz)
  ) {
    const row = byDay.get(dateKey) ?? {
      sales: 0,
      channels: emptyChannelTotals(),
    };
    const channels = SPEND_CHANNELS.map((channel) => ({
      channel,
      amount: Math.round(row.channels[channel] * 100) / 100,
    })).filter((c) => c.amount > 0);
    const spend =
      Math.round(channels.reduce((s, c) => s + c.amount, 0) * 100) / 100;
    const sales = Math.round(row.sales * 100) / 100;
    if (sales <= 0 && spend <= 0) continue;
    rows.push({ dateKey, sales, spend, channels });
  }
  return rows;
}

export type SpendExplorerSeries = {
  window: ExplorerWindow;
  granularity: ExplorerGranularity;
  mode: ExplorerMode;
  targetMer: number;
  buckets: ExplorerPlotBucket[];
  summary: ExplorerSummary;
  /** Raw closed days used for bucketing (activity-only). */
  dailyRows: ExplorerDailyRow[];
};

/**
 * Spend explorer · channel mix vs MER — Apps Script `renderSpendExplorer` core.
 */
export async function buildSpendExplorerSeries(
  shopId: string,
  options: {
    sampleOnly?: boolean;
    excludeSample?: boolean;
    salesByDay: Map<string, number>;
    window: ExplorerWindow;
    granularity: ExplorerGranularity;
    mode: ExplorerMode;
    targetMer: number;
    newCustomers?: number;
    returningCustomers?: number;
    customerMetricsAvailable?: boolean;
    timeZone?: string | null;
  },
): Promise<SpendExplorerSeries> {
  const dailyRows = await buildDailyRowsForWindow(shopId, {
    sampleOnly: options.sampleOnly,
    excludeSample: options.excludeSample,
    salesByDay: options.salesByDay,
    windowStart: options.window.start,
    windowEnd: options.window.end,
    timeZone: options.timeZone,
  });

  const buckets = bucketExplorerRows(dailyRows, options.granularity);
  const plot = applyExplorerMode(buckets, options.mode);
  const summary = summarizeExplorer(dailyRows, {
    newCustomers: options.newCustomers,
    returningCustomers: options.returningCustomers,
    customerMetricsAvailable: options.customerMetricsAvailable,
    bucketCount: plot.length,
  });

  return {
    window: options.window,
    granularity: options.granularity,
    mode: options.mode,
    targetMer: options.targetMer,
    buckets: plot,
    summary,
    dailyRows,
  };
}

/**
 * Last ≤14 closed calendar days with channel spend + cash MER (sales ÷ spend).
 * Uses shop IANA closed days when `timeZone` is provided.
 */
export async function buildDailySpine(
  shopId: string,
  options: {
    sampleOnly?: boolean;
    excludeSample?: boolean;
    salesByDay: Map<string, number>;
    targetMer: number;
    now?: Date;
    timeZone?: string | null;
    spendEntries?: SpendEntrySlice[];
  },
): Promise<DailySpineDay[]> {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone || null;
  let windowStart: Date;
  let windowEnd: Date;
  let keys: string[];
  if (timeZone) {
    keys = listRecentClosedShopLocalDays(timeZone, 14, now);
    windowStart = utcMidnightFromDayKey(keys[0]);
    windowEnd = utcMidnightFromDayKey(keys[keys.length - 1]);
  } else {
    windowEnd = closedDayEnd(now);
    windowStart = addLocalDays(startOfLocalDay(windowEnd), -13);
    keys = [];
    for (
      let cursor = windowStart;
      cursor <= startOfLocalDay(windowEnd);
      cursor = addLocalDays(cursor, 1)
    ) {
      keys.push(localDayKey(cursor));
    }
  }

  const dailyRows = await buildDailyRowsForWindow(shopId, {
    sampleOnly: options.sampleOnly,
    excludeSample: options.excludeSample,
    salesByDay: options.salesByDay,
    windowStart,
    windowEnd,
    timeZone,
    spendEntries: options.spendEntries,
  });

  const byKey = new Map(dailyRows.map((r) => [r.dateKey, r]));

  const spine: DailySpineDay[] = keys.map((dateKey) => {
    const row = byKey.get(dateKey);
    const channels = (row?.channels ?? []).map((c) => ({
      channel: c.channel as SpendChannel,
      amount: c.amount,
    }));
    const spend = row?.spend ?? 0;
    const sales = row?.sales ?? 0;
    const mer = computeMer(sales, spend);
    return {
      dateKey,
      label: dayLabel(dateKey),
      sales,
      spend,
      mer,
      aboveTarget:
        mer !== null && options.targetMer > 0 ? mer >= options.targetMer : null,
      channels,
    };
  });

  // Prefer days with activity; keep chronological order; cap at 14.
  const active = spine.filter((d) => d.spend > 0 || d.sales > 0);
  if (active.length >= 3) return active.slice(-14);
  return spine.slice(-14);
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

/**
 * Pace + safe-spend headroom at the target rail (Apps Script control panel math).
 * Closed-day density uses period length; projections pace remaining days.
 */
export function buildControlPace(input: {
  sales: number;
  totalSpend: number;
  targetMer: number;
  period: DateRange;
  now?: Date;
}): ControlPace {
  const now = input.now ?? new Date();
  const closedEnd = closedDayEnd(now);
  const periodStart = startOfLocalDay(input.period.start);
  const periodEndCap =
    startOfLocalDay(input.period.end) < startOfLocalDay(closedEnd)
      ? startOfLocalDay(input.period.end)
      : startOfLocalDay(closedEnd);

  const daysInPeriod = Math.max(
    1,
    Math.round(
      (startOfLocalDay(input.period.end).getTime() - periodStart.getTime()) /
        86_400_000,
    ) + 1,
  );

  const daysElapsed = Math.max(
    0,
    Math.min(
      daysInPeriod,
      Math.round((periodEndCap.getTime() - periodStart.getTime()) / 86_400_000) +
        1,
    ),
  );
  const remainingDays = Math.max(0, daysInPeriod - daysElapsed);

  const avgDailySales = daysElapsed > 0 ? input.sales / daysElapsed : 0;
  const avgDailySpend = daysElapsed > 0 ? input.totalSpend / daysElapsed : 0;
  const projSales = input.sales + avgDailySales * remainingDays;
  const projSpend = input.totalSpend + avgDailySpend * remainingDays;
  const projMer = computeMer(projSales, projSpend);

  const target = input.targetMer > 0 ? input.targetMer : 0;
  const headroomPeriod =
    target > 0 ? input.sales / target - input.totalSpend : 0;
  const headroomMonth = target > 0 ? projSales / target - projSpend : 0;
  const headroomDay =
    remainingDays > 0 ? headroomMonth / remainingDays : headroomMonth;
  // Pace-forward: sales needed so period closes at rail given projected spend.
  // Note: projMer ≡ current MER when sales/spend share the same pace multiplier —
  // do not surface projMer as a distinct forecast in the UI.
  const targetPeriodSales = target > 0 ? projSpend * target : 0;
  const remainingSalesNeeded = Math.max(0, targetPeriodSales - input.sales);
  const dailySalesNeeded =
    remainingDays > 0 ? remainingSalesNeeded / remainingDays : 0;
  const calendarProgressPct =
    daysInPeriod > 0
      ? Math.min(100, (daysElapsed / daysInPeriod) * 100)
      : 0;
  const salesProgressPct =
    targetPeriodSales > 0
      ? Math.min(100, (input.sales / targetPeriodSales) * 100)
      : 0;
  const currentMer = computeMer(input.sales, input.totalSpend);
  const railOk =
    currentMer !== null && target > 0 ? currentMer >= target : false;
  const progressCls: "good" | "warn" | "bad" =
    salesProgressPct >= calendarProgressPct
      ? "good"
      : currentMer !== null && target > 0 && currentMer >= target * 0.85
        ? "warn"
        : "bad";
  const statusLabel =
    progressCls === "good"
      ? "Sales ahead of calendar pace"
      : progressCls === "warn"
        ? "Sales lagging · Total ROAS near target"
        : railOk
          ? "Total ROAS at or above target"
          : "Sales lagging · Total ROAS below target";

  return {
    daysElapsed,
    daysInPeriod,
    remainingDays,
    densityLabel: `${daysElapsed} / ${daysInPeriod} days`,
    projSales,
    projSpend,
    projMer,
    headroomPeriod,
    headroomMonth,
    headroomDay,
    railOk,
    statusLabel,
    targetPeriodSales,
    dailySalesNeeded,
    salesProgressPct,
    calendarProgressPct,
    progressCls,
  };
}

function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

export async function buildDashboardMetrics(
  shopDomain: string,
  range: DateRange,
  sales: {
    totalSales: number;
    orderCount: number;
    newCustomers?: number;
    returningCustomers?: number;
    guestOrders?: number;
    customerMetricsAvailable?: boolean;
    source: "shopify" | "mock";
  },
  options?: {
    salesByDay?: Map<string, number>;
    priorSales?: { totalSales: number };
    priorRange?: DateRange;
    /** ISO timestamp when sales were pulled for this render. */
    salesPulledAt?: string | null;
  },
): Promise<DashboardMetrics> {
  const shop = await ensureShop(shopDomain);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = Boolean(settings.useSampleDesk);
  const spendOpts = useSampleDesk
    ? { sampleOnly: true as const }
    : { excludeSample: true as const };

  const { sales: honestSales, blockedMockAsLive } = resolveHonestSales(
    sales,
    useSampleDesk,
  );

  const priorRange = options?.priorRange;
  // Distinguish "caller omitted" vs "caller said no pull" (null on sales error).
  const salesPulledAt =
    options != null && "salesPulledAt" in options
      ? (options.salesPulledAt ?? null)
      : honestSales.source === "shopify" || useSampleDesk
        ? new Date().toISOString()
        : null;

  // One spend load for channel totals + coverage + daily spine (avoid triple query).
  const spineLookbackStart = new Date(range.start);
  spineLookbackStart.setUTCDate(spineLookbackStart.getUTCDate() - 14);
  const spendLoadRange: DateRange = {
    start: spineLookbackStart < range.start ? spineLookbackStart : range.start,
    end: range.end,
    label: range.label,
  };

  const [spendEntries, latestSpend, priorSpends] = await Promise.all([
    loadSpendEntries(shop.id, spendLoadRange, spendOpts),
    prisma.spendEntry.findFirst({
      where: {
        shopId: shop.id,
        ...(spendOpts.sampleOnly
          ? { source: "sample" }
          : { NOT: { source: "sample" } }),
      },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    priorRange
      ? getSpendByChannel(shop.id, priorRange, spendOpts)
      : Promise.resolve(null),
  ]);

  const rangeEntries = spendEntries.filter(
    (e) => e.periodStart <= range.end && e.periodEnd >= range.start,
  );
  const spends = channelSpendFromEntries(rangeEntries);
  const spendCoverage = await getSpendPeriodCoverage(shop.id, range, {
    ...spendOpts,
    entries: rangeEntries,
  });
  const dailySpine = await buildDailySpine(shop.id, {
    ...spendOpts,
    salesByDay: options?.salesByDay ?? new Map(),
    targetMer: settings.targetMer,
    timeZone: shop.ianaTimezone,
    spendEntries,
  });

  const spendUpdatedAt = latestSpend?.updatedAt.toISOString() ?? null;
  const freshness = await getDashboardFreshness(shop.id, {
    salesPulledAt: blockedMockAsLive ? null : salesPulledAt,
    spendUpdatedAt,
  });

  const totalSpend = sumSpend(spends);
  const mer = computeMer(honestSales.totalSales, totalSpend);
  const breakEvenMer = computeBreakEvenMer(settings.marginPct);
  const mix = channelMix(spends);
  const settingsSaved = marginIsConfirmed(settings) || useSampleDesk;
  const hasSpend = totalSpend > 0;
  const onboarding: RitualOnboarding = {
    settingsSaved,
    hasSpend,
    showGuide: !useSampleDesk && (!settingsSaved || !hasSpend),
  };
  const control = buildControlPace({
    sales: honestSales.totalSales,
    totalSpend,
    targetMer: settings.targetMer,
    period: range,
  });

  let deltas: PeriodDeltas | null = null;
  if (priorRange && options?.priorSales && priorSpends) {
    const priorSpend = sumSpend(priorSpends);
    const priorMer = computeMer(options.priorSales.totalSales, priorSpend);
    deltas = {
      priorLabel: priorRange.label,
      priorSales: options.priorSales.totalSales,
      priorSpend,
      priorMer,
      salesPct: pctChange(honestSales.totalSales, options.priorSales.totalSales),
      spendPct: pctChange(totalSpend, priorSpend),
      merAbs:
        mer !== null && priorMer !== null
          ? Math.round((mer - priorMer) * 100) / 100
          : null,
    };
  }

  const tillNewBuyers =
    useSampleDesk
      ? (honestSales.newCustomers ?? 0)
      : (await countNewBuyersInRange(shop.id, range)) ??
        (honestSales.customerMetricsAvailable
          ? (honestSales.newCustomers ?? 0)
          : 0);

  const tillLtv = await buildTillLtvSummary(shop.id, {
    totalSpend,
    newCustomers: tillNewBuyers,
    periodLabel: range.label,
    useSampleDesk,
    ianaTimezone: shop.ianaTimezone,
  });

  const allocation = buildAllocationSuggestion(
    spends,
    honestSales.totalSales,
    totalSpend,
    breakEvenMer,
  );

  // Optional ledger — throttle write amp (skip if same period written in last hour).
  const mixJson = JSON.parse(JSON.stringify(mix)) as object;
  const allocationJson = allocation
    ? (JSON.parse(JSON.stringify(allocation)) as object)
    : undefined;
  void (async () => {
    const existing = await prisma.merSnapshot.findUnique({
      where: {
        shopId_periodStart_periodEnd: {
          shopId: shop.id,
          periodStart: range.start,
          periodEnd: range.end,
        },
      },
      select: { createdAt: true, sales: true, spend: true, mer: true },
    });
    const hourMs = 60 * 60 * 1000;
    const writtenRecently =
      existing != null && Date.now() - existing.createdAt.getTime() < hourMs;
    const sameCore =
      existing != null &&
      existing.sales === honestSales.totalSales &&
      existing.spend === totalSpend &&
      existing.mer === mer;
    if (writtenRecently || sameCore) return;

    await prisma.merSnapshot.upsert({
      where: {
        shopId_periodStart_periodEnd: {
          shopId: shop.id,
          periodStart: range.start,
          periodEnd: range.end,
        },
      },
      create: {
        shopId: shop.id,
        periodStart: range.start,
        periodEnd: range.end,
        sales: honestSales.totalSales,
        spend: totalSpend,
        mer,
        breakEvenMer: breakEvenMer ?? 0,
        channelMix: mixJson,
        allocation: allocationJson,
        reconStatus: "desk",
      },
      update: {
        sales: honestSales.totalSales,
        spend: totalSpend,
        mer,
        breakEvenMer: breakEvenMer ?? 0,
        channelMix: mixJson,
        allocation: allocationJson,
        reconStatus: "desk",
      },
    });
  })().catch(() => {
    // Ledger is best-effort — never block the desk.
  });

  return {
    period: range,
    sales: honestSales.totalSales,
    salesSource: honestSales.source,
    orderCount: honestSales.orderCount,
    newCustomers: honestSales.newCustomers ?? 0,
    returningCustomers: honestSales.returningCustomers ?? 0,
    guestOrders: honestSales.guestOrders ?? 0,
    customerMetricsAvailable: honestSales.customerMetricsAvailable ?? false,
    useSampleDesk,
    blockedMockAsLive,
    totalSpend,
    mer,
    breakEvenMer,
    targetMer: settings.targetMer,
    marginPct: settings.marginPct,
    channelMix: mix,
    aboveBreakEven:
      mer !== null && breakEvenMer !== null ? mer >= breakEvenMer : null,
    allocation,
    onboarding,
    freshness,
    spendCoverage,
    dailySpine,
    control,
    deltas,
    tillLtv,
  };
}

export {
  formatCurrency,
  formatMer,
  formatPercent,
  formatFreshness,
} from "./mer-format";
export {
  formatCashFreshnessChip,
  formatSpendCoverageLine,
} from "./mer-trust";
