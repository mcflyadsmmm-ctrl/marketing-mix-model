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
import { localDayKey } from "./sample-desk.server";
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
  projMer: number | null;
  /** Period safe spend at rail: sales ÷ target − spend (actuals). */
  headroomPeriod: number;
  /** Projected close headroom at rail (pace-forward). */
  headroomMonth: number;
  headroomDay: number;
  railOk: boolean;
  statusLabel: string;
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
  options?: { sampleOnly?: boolean; excludeSample?: boolean; now?: Date },
): Promise<SpendPeriodCoverage> {
  const now = options?.now ?? new Date();
  const entries = await prisma.spendEntry.findMany({
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
  });

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

export async function getSpendByChannel(
  shopId: string,
  range: DateRange,
  options?: { sampleOnly?: boolean; excludeSample?: boolean },
): Promise<ChannelSpend[]> {
  const entries = await prisma.spendEntry.findMany({
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
  });

  const totals: Record<SpendChannel, number> = {
    meta: 0,
    google: 0,
    microsoft: 0,
    tiktok: 0,
    affiliate: 0,
    email: 0,
    other: 0,
  };

  for (const entry of entries) {
    totals[entry.channel as SpendChannel] += entry.amount;
  }

  return SPEND_CHANNELS.map((channel) => ({
    channel,
    amount: totals[channel],
  }));
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
  return {
    meta: 0,
    google: 0,
    microsoft: 0,
    tiktok: 0,
    affiliate: 0,
    email: 0,
    other: 0,
  };
}

/**
 * Attribute a spend entry across overlapping closed calendar days
 * (single-day CSV rows stay intact; multi-day ranges prorate evenly).
 */
function attributeSpendAcrossDays(
  periodStart: Date,
  periodEnd: Date,
  amount: number,
  windowStart: Date,
  windowEnd: Date,
): Array<{ dateKey: string; amount: number }> {
  const start = startOfLocalDay(
    periodStart < windowStart ? windowStart : periodStart,
  );
  const end = startOfLocalDay(periodEnd > windowEnd ? windowEnd : periodEnd);
  if (end < start || amount <= 0) return [];

  const fullStart = startOfLocalDay(periodStart);
  const fullEnd = startOfLocalDay(periodEnd);
  const fullDays =
    Math.round((fullEnd.getTime() - fullStart.getTime()) / 86_400_000) + 1;
  const perDay = amount / Math.max(1, fullDays);

  const out: Array<{ dateKey: string; amount: number }> = [];
  for (let cursor = start; cursor <= end; cursor = addLocalDays(cursor, 1)) {
    out.push({ dateKey: localDayKey(cursor), amount: perDay });
  }
  return out;
}

/**
 * Closed-day cash spine for an arbitrary window (≤ ~366 days).
 * Sales from Shopify/sample map; spend attributed across overlapping CSV days.
 */
export async function buildDailyRowsForWindow(
  shopId: string,
  options: {
    sampleOnly?: boolean;
    excludeSample?: boolean;
    salesByDay: Map<string, number>;
    windowStart: Date;
    windowEnd: Date;
  },
): Promise<ExplorerDailyRow[]> {
  const windowStart = startOfLocalDay(options.windowStart);
  const windowEnd = startOfLocalDay(options.windowEnd);

  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: endOfLocalDay(windowEnd) },
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
  });

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
    const dayDate = startOfLocalDay(new Date(`${key}T12:00:00`));
    if (dayDate < windowStart || dayDate > windowEnd) continue;
    ensureDay(key).sales += sales;
  }

  for (const entry of entries) {
    const slices = attributeSpendAcrossDays(
      entry.periodStart,
      entry.periodEnd,
      entry.amount,
      windowStart,
      endOfLocalDay(windowEnd),
    );
    for (const slice of slices) {
      const row = ensureDay(slice.dateKey);
      row.channels[entry.channel as SpendChannel] += slice.amount;
    }
  }

  const rows: ExplorerDailyRow[] = [];
  for (
    let cursor = windowStart;
    cursor <= windowEnd;
    cursor = addLocalDays(cursor, 1)
  ) {
    const dateKey = localDayKey(cursor);
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
  },
): Promise<SpendExplorerSeries> {
  const dailyRows = await buildDailyRowsForWindow(shopId, {
    sampleOnly: options.sampleOnly,
    excludeSample: options.excludeSample,
    salesByDay: options.salesByDay,
    windowStart: options.window.start,
    windowEnd: options.window.end,
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
 */
export async function buildDailySpine(
  shopId: string,
  options: {
    sampleOnly?: boolean;
    excludeSample?: boolean;
    salesByDay: Map<string, number>;
    targetMer: number;
    now?: Date;
  },
): Promise<DailySpineDay[]> {
  const now = options.now ?? new Date();
  const windowEnd = closedDayEnd(now);
  const windowStart = addLocalDays(startOfLocalDay(windowEnd), -13);

  const dailyRows = await buildDailyRowsForWindow(shopId, {
    sampleOnly: options.sampleOnly,
    excludeSample: options.excludeSample,
    salesByDay: options.salesByDay,
    windowStart,
    windowEnd,
  });

  const byKey = new Map(dailyRows.map((r) => [r.dateKey, r]));
  const keys: string[] = [];
  for (
    let cursor = windowStart;
    cursor <= startOfLocalDay(windowEnd);
    cursor = addLocalDays(cursor, 1)
  ) {
    keys.push(localDayKey(cursor));
  }

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
  const railOk = projMer !== null && target > 0 ? projMer >= target : false;

  // Pace-forward: sales needed so period closes at rail given projected spend
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
  const progressCls: "good" | "warn" | "bad" =
    salesProgressPct >= calendarProgressPct
      ? "good"
      : currentMer !== null && target > 0 && currentMer >= target * 0.85
        ? "warn"
        : "bad";

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
    statusLabel: railOk
      ? "On rail — room to scale carefully"
      : "Below rail — protect MER before chasing sales",
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

  const [spends, spendCoverage, latestSpend, dailySpine, priorSpends] =
    await Promise.all([
      getSpendByChannel(shop.id, range, spendOpts),
      getSpendPeriodCoverage(shop.id, range, spendOpts),
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
      buildDailySpine(shop.id, {
        ...spendOpts,
        salesByDay: options?.salesByDay ?? new Map(),
        targetMer: settings.targetMer,
      }),
      priorRange
        ? getSpendByChannel(shop.id, priorRange, spendOpts)
        : Promise.resolve(null),
    ]);

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
    allocation: buildAllocationSuggestion(
      spends,
      honestSales.totalSales,
      totalSpend,
      breakEvenMer,
    ),
    onboarding,
    freshness,
    spendCoverage,
    dailySpine,
    control,
    deltas,
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
