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
  calculateAmer,
  suggestAllocation,
  type SuggestAllocationResult,
} from "@mcfly/mer-core";
import { deskPeriodTimeZone, type DateRange } from "./periods";
import { localDayKey, utcDayKey, SAMPLE_DESK_MARGIN_PCT, SAMPLE_DESK_TARGET_MER } from "./sample-desk.server";
import {
  listRecentClosedShopLocalDays,
  nextShopLocalDayKey,
  shopLocalDayKey,
  utcMidnightFromDayKey,
} from "./shop-local-day";
import {
  collectFilledSpendDayKeys,
  computeSpendPeriodCoverage,
  computeSpendRecon,
  countClosedDaysInPeriod,
  resolveHonestSales,
  spendReconMatchesPeriod,
  type FreshnessSource,
  type SpendPeriodCoverage,
  type SpendReconResult,
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
import {
  filterToAllowedChannels,
  getShopEntitlements,
  proRequiredLtvSummary,
} from "./entitlements.server";
import {
  actionSalesForBasis,
  parseSalesBasis,
} from "./sales-basis";
import { spendBucketKey, spendChannelLabel } from "./spend-channel-label";

const CHANNEL_DISPLAY = SPEND_CHANNEL_LABELS;

export type { FreshnessSource, SpendPeriodCoverage, SpendReconResult };

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
  /** Action Total ROAS sales numerator (Total Sales or Net per salesBasis). */
  sales: number;
  /** Shopify Total Sales (`currentTotalPriceSet`) — always available. */
  totalSalesAmount: number;
  /** Gross order totals — Ads Manager–comparable secondary chip. */
  grossSales: number;
  /**
   * False when closed-day gross is incomplete — do not claim Ads Manager
   * comparability. Defaults true when sales omit the flag (live GraphQL).
   */
  grossSalesKnown: boolean;
  /** Shopify Net Sales (subtotal) — may equal total when unknown. */
  netSales: number;
  /** False when Net Sales not persisted yet (legacy facts). */
  netSalesKnown: boolean;
  /** Desk preference that drove `sales` / `mer`. */
  salesBasis: "total" | "net";
  /** True when merchant asked for Net but facts lacked netSales — fell back to Total. */
  netBasisUnavailable: boolean;
  salesSource: "shopify" | "mock";
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  /**
   * New-customer sales for the period (aMER numerator).
   * Additive from facts / live sales — not unique-customer CRM.
   */
  newCustomerNetSales: number;
  /**
   * Returning-customer sales for the period (additive from facts).
   * With newCustomerNetSales, forms the new/returning sales split Shopify Admin buries.
   */
  returningCustomerNetSales: number;
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
  /** Acquisition MER = newCustomerNetSales ÷ totalSpend (average, not causal). */
  amer: number | null;
  breakEvenMer: number | null;
  /**
   * Spend is on the desk and Ads Manager recon is not drifting.
   * Incomplete day coverage no longer blocks Total ROAS — it only locks Allocation.
   * Sample desk bypasses recon gates (still needs settingsSaved).
   */
  cashActionReady: boolean;
  /**
   * No closed sales day has landed yet for this period while backfill runs.
   * Sales are unknown, not zero — `mer` stays null so the desk never paints
   * `$0 sales ÷ $X spend = 0.00×` at a merchant who did have sales.
   */
  salesPending: boolean;
  /** Soft warning — marginConfirmedAt older than 90 days. */
  marginStale: boolean;
  targetMer: number;
  marginPct: number;
  channelMix: ReturnType<typeof channelMix>;
  aboveBreakEven: boolean | null;
  allocation: SuggestAllocationResult | null;
  onboarding: RitualOnboarding;
  freshness: DashboardFreshness;
  /** Closed-day spend coverage vs selected period (recon-style honesty). */
  spendCoverage: SpendPeriodCoverage;
  /** Optional Ads Manager ±5% recon for this period (null when no matching declaration). */
  spendRecon: SpendReconResult | null;
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

/** Soft stale — confirmed margin older than 90 days (no schema change). */
export const MARGIN_STALE_DAYS = 90;

export function marginIsStale(settings: {
  marginConfirmedAt: Date | null;
}): boolean {
  if (settings.marginConfirmedAt == null) return false;
  const ageMs = Date.now() - new Date(settings.marginConfirmedAt).getTime();
  return ageMs > MARGIN_STALE_DAYS * 24 * 60 * 60 * 1000;
}

export interface RitualOnboarding {
  /** Margin confirmed via Settings save (or sample desk treated as confirmed). */
  settingsSaved: boolean;
  hasSpend: boolean;
  /**
   * First-run 3-step guide. Wave 2: Polaris empties own cold-path TTFV —
   * desk UI hides this when an empty state is showing (no duplicate guide).
   */
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
    /** Shop IANA — coverage day keys match sales spine, not server-local. */
    timeZone?: string | null;
    /** Preloaded spend rows overlapping `range` — skips a second DB read. */
    entries?: SpendEntrySlice[];
  },
): Promise<SpendPeriodCoverage> {
  const now = options?.now ?? new Date();
  const timeZone = options?.timeZone ?? null;
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
    timeZone,
  );
  return computeSpendPeriodCoverage({
    daysWithSpend: filled.size,
    daysInPeriod: countClosedDaysInPeriod(
      range.start,
      range.end,
      now,
      timeZone,
    ),
  });
}

type SpendEntrySlice = {
  channel: SpendChannel | string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  /** Slug for a named `other` extra (billboard, radio…). */
  customKey?: string | null;
  /** Merchant's own display name for that extra. */
  note?: string | null;
};

/**
 * One slice per named platform, plus one slice per named `other` extra so
 * "Billboard" reads as Billboard on Overview instead of collapsing into a
 * single "Other" lump. Unlabeled `other` rows stay in the "Other" slice —
 * their dollars are always counted, never dropped.
 */
function channelSpendFromEntries(entries: SpendEntrySlice[]): ChannelSpend[] {
  const totals = emptyChannelTotals();
  const customTotals = new Map<string, { label: string; amount: number }>();
  for (const entry of entries) {
    const ch = entry.channel as SpendChannel;
    if (!(ch in totals)) continue;
    const slug = ch === "other" ? (entry.customKey?.trim() ?? "") : "";
    if (slug) {
      const label = entry.note?.trim() || slug;
      const seen = customTotals.get(slug);
      if (seen) {
        seen.amount += entry.amount;
      } else {
        customTotals.set(slug, { label, amount: entry.amount });
      }
      continue;
    }
    totals[ch] += entry.amount;
  }
  const named: ChannelSpend[] = SPEND_CHANNELS.map((channel) => ({
    channel,
    amount: totals[channel],
  }));
  const extras: ChannelSpend[] = [...customTotals.values()].map((extra) => ({
    channel: "other" as SpendChannel,
    amount: extra.amount,
    customLabel: extra.label,
  }));
  return [...named, ...extras];
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
      customKey: true,
      note: true,
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
        name: spendChannelLabel({
          channel: s.channel,
          customLabel: s.customLabel,
        }),
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
): Promise<{
  rows: ExplorerDailyRow[];
  /** Slice key → merchant-facing name, for named `other` extras. */
  channelLabels: Record<string, string>;
}> {
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
        customKey: true,
        note: true,
      },
    }));

  /*
   * Slices key on the spend bucket, so a named extra ("other:billboard") is its
   * own band instead of melting into the Other lump. `channelLabels` carries the
   * merchant's word for that key; every Map keyed by the slice string keeps
   * working unchanged.
   */
  const channelLabels: Record<string, string> = {};
  const byDay = new Map<string, { sales: number; channels: Map<string, number> }>();

  const ensureDay = (key: string) => {
    let row = byDay.get(key);
    if (!row) {
      row = { sales: 0, channels: new Map() };
      byDay.set(key, row);
    }
    return row;
  };

  for (const [key, sales] of options.salesByDay) {
    if (key < startKey || key > endKey) continue;
    ensureDay(key).sales += sales;
  }

  for (const entry of entries) {
    const bucket = spendBucketKey(entry.channel, entry.customKey);
    if (bucket !== entry.channel && !channelLabels[bucket]) {
      channelLabels[bucket] = spendChannelLabel({
        channel: entry.channel,
        customLabel: entry.note ?? entry.customKey,
      });
    }
    const slices = attributeSpendAcrossDays(
      entry.periodStart,
      entry.periodEnd,
      entry.amount,
      windowStart,
      endOfUtcDay(windowEnd),
    );
    for (const slice of slices) {
      const row = ensureDay(slice.dateKey);
      row.channels.set(bucket, (row.channels.get(bucket) ?? 0) + slice.amount);
    }
  }

  const rows: ExplorerDailyRow[] = [];
  for (
    let dateKey = startKey;
    dateKey <= endKey;
    dateKey = nextShopLocalDayKey(dateKey, stepTz)
  ) {
    const row = byDay.get(dateKey);
    const channels = row
      ? [...row.channels.entries()]
          .map(([channel, raw]) => ({
            channel,
            amount: Math.round(raw * 100) / 100,
          }))
          .filter((c) => c.amount > 0)
          .sort((a, b) => b.amount - a.amount)
      : [];
    const spend =
      Math.round(channels.reduce((s, c) => s + c.amount, 0) * 100) / 100;
    const sales = Math.round((row?.sales ?? 0) * 100) / 100;
    if (sales <= 0 && spend <= 0) continue;
    rows.push({ dateKey, sales, spend, channels });
  }
  return { rows, channelLabels };
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
  /** Slice key → merchant-facing name (named `other` extras like Billboard). */
  channelLabels: Record<string, string>;
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
  const { rows: dailyRows, channelLabels } = await buildDailyRowsForWindow(
    shopId,
    {
      sampleOnly: options.sampleOnly,
      excludeSample: options.excludeSample,
      salesByDay: options.salesByDay,
      windowStart: options.window.start,
      windowEnd: options.window.end,
      timeZone: options.timeZone,
    },
  );

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
    channelLabels,
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

  const { rows: dailyRows } = await buildDailyRowsForWindow(shopId, {
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
    // Spine bands colour by engine channel; a named extra rides the Other band.
    const channels = (row?.channels ?? []).map((c) => ({
      channel: c.channel.split(":")[0] as SpendChannel,
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

/** Inclusive calendar-day span between YYYY-MM-DD keys (noon-anchor safe). */
function inclusiveDaySpan(startKey: string, endKey: string): number {
  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return 1;
  return Math.max(
    0,
    Math.round(
      (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000,
    ) + 1,
  );
}

/**
 * Pace + safe-spend headroom at the target rail (Apps Script control panel math).
 * Closed-day density uses period length; projections pace remaining days.
 * When `ianaTimezone` is set, day math is shop-local (not server-local).
 */
export function buildControlPace(input: {
  sales: number;
  totalSpend: number;
  targetMer: number;
  period: DateRange;
  now?: Date;
  ianaTimezone?: string | null;
}): ControlPace {
  const now = input.now ?? new Date();
  const tz = input.ianaTimezone;

  let daysInPeriod: number;
  let daysElapsed: number;

  if (tz) {
    const todayKey = shopLocalDayKey(now, tz);
    const [ty, tm, td] = todayKey.split("-").map(Number);
    const yesterdayKey = shopLocalDayKey(
      new Date(Date.UTC(ty, tm - 1, td - 1, 12, 0, 0)),
      tz,
    );
    const periodStartKey = shopLocalDayKey(input.period.start, tz);
    const periodEndKey = shopLocalDayKey(input.period.end, tz);
    daysInPeriod = Math.max(1, inclusiveDaySpan(periodStartKey, periodEndKey));
    const periodEndCapKey =
      periodEndKey < yesterdayKey ? periodEndKey : yesterdayKey;
    daysElapsed =
      periodStartKey > periodEndCapKey
        ? 0
        : Math.max(
            0,
            Math.min(
              daysInPeriod,
              inclusiveDaySpan(periodStartKey, periodEndCapKey),
            ),
          );
  } else {
    const closedEnd = closedDayEnd(now);
    const periodStart = startOfLocalDay(input.period.start);
    const periodEndCap =
      startOfLocalDay(input.period.end) < startOfLocalDay(closedEnd)
        ? startOfLocalDay(input.period.end)
        : startOfLocalDay(closedEnd);

    daysInPeriod = Math.max(
      1,
      Math.round(
        (startOfLocalDay(input.period.end).getTime() - periodStart.getTime()) /
          86_400_000,
      ) + 1,
    );

    daysElapsed = Math.max(
      0,
      Math.min(
        daysInPeriod,
        Math.round(
          (periodEndCap.getTime() - periodStart.getTime()) / 86_400_000,
        ) + 1,
      ),
    );
  }
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
    /** Gross comparable — optional; defaults to totalSales when absent (facts/sample). */
    grossSales?: number;
    /** False when closed-day gross incomplete — omit Ads Manager claims. */
    grossSalesKnown?: boolean;
    /** Net Sales (subtotal) — optional; defaults to totalSales when absent. */
    netSales?: number;
    /** False when Net Sales unknown (legacy facts). */
    netSalesKnown?: boolean;
    orderCount: number;
    newCustomers?: number;
    returningCustomers?: number;
    /** New-customer sales — aMER numerator when present. */
    newCustomerNetSales?: number;
    /** Returning-customer sales — additive from facts when present. */
    returningCustomerNetSales?: number;
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
    /** Override Settings.salesBasis for this render (query toggle). */
    salesBasis?: "total" | "net";
    /**
     * Closed-day SalesDayFact coverage for `range`. Drives sales-pending
     * suppression and blocks break-even advice while backfill runs.
     */
    salesCoverage?: {
      complete: boolean;
      factDays: number;
      periodExceedsFactWindow: boolean;
    } | null;
  },
): Promise<DashboardMetrics> {
  const shop = await ensureShop(shopDomain);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = Boolean(settings.useSampleDesk);
  const salesBasis = parseSalesBasis(
    options?.salesBasis ?? settings.salesBasis,
    "total",
  );
  // SAMPLE economics are read-time overlays — seed must not mutate merchant settings.
  const effectiveMarginPct = useSampleDesk
    ? SAMPLE_DESK_MARGIN_PCT
    : settings.marginPct;
  const effectiveTargetMer = useSampleDesk
    ? SAMPLE_DESK_TARGET_MER
    : settings.targetMer;
  const entitlements = getShopEntitlements(shopDomain, {
    sampleDesk: useSampleDesk,
    paidPro: shop.proBillingActive,
  });
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const spendOpts = useSampleDesk
    ? { sampleOnly: true as const }
    : { excludeSample: true as const };

  const { sales: honestSales, blockedMockAsLive } = resolveHonestSales(
    sales,
    useSampleDesk,
  );

  const priorRange = options?.priorRange;
  // Honesty: never auto-stamp when the caller omits salesPulledAt — that lied
  // about freshness before a successful desk load. Null / omitted → no sales chip.
  const salesPulledAt =
    options != null && "salesPulledAt" in options
      ? (options.salesPulledAt ?? null)
      : null;

  // One spend load for channel totals + coverage + daily spine (avoid triple query).
  const spineLookbackStart = new Date(range.start);
  spineLookbackStart.setUTCDate(spineLookbackStart.getUTCDate() - 14);
  const spendLoadRange: DateRange = {
    start: spineLookbackStart < range.start ? spineLookbackStart : range.start,
    end: range.end,
    label: range.label,
  };

  const [spendEntriesRaw, latestSpend, priorSpendsRaw] = await Promise.all([
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

  // Free live: Meta+Google only so Total ROAS cannot be inflated by Pro channels.
  // SAMPLE desk keeps the full demo mix (do not filter).
  const spendEntries = useSampleDesk
    ? spendEntriesRaw
    : filterToAllowedChannels(entitlements, spendEntriesRaw);
  const priorSpends =
    priorSpendsRaw == null
      ? null
      : useSampleDesk || entitlements.canUseAllChannels
        ? priorSpendsRaw
        : priorSpendsRaw.map((s) =>
            entitlements.allowedChannels.includes(s.channel)
              ? s
              : { ...s, amount: 0 },
          );

  const rangeEntries = spendEntries.filter(
    (e) => e.periodStart <= range.end && e.periodEnd >= range.start,
  );
  const spends = channelSpendFromEntries(rangeEntries);
  const spendCoverage = await getSpendPeriodCoverage(shop.id, range, {
    ...spendOpts,
    entries: rangeEntries,
    timeZone: deskTz,
  });
  const dailySpine = await buildDailySpine(shop.id, {
    ...spendOpts,
    salesByDay: options?.salesByDay ?? new Map(),
    targetMer: effectiveTargetMer,
    // SAMPLE desk is stamped on UTC calendar days — keep spine keys UTC so
    // salesByDay / spend attribution join. Live desks use shop IANA.
    timeZone: deskTz,
    spendEntries,
  });

  const spendUpdatedAt = latestSpend?.updatedAt.toISOString() ?? null;
  const freshness = await getDashboardFreshness(shop.id, {
    salesPulledAt: blockedMockAsLive ? null : salesPulledAt,
    spendUpdatedAt,
  });

  const totalSpend = sumSpend(spends);
  const totalSalesAmount = honestSales.totalSales;
  const netSalesAmount = honestSales.netSales ?? honestSales.totalSales;
  const netSalesKnown = honestSales.netSalesKnown !== false;
  const action = actionSalesForBasis(
    {
      totalSales: totalSalesAmount,
      netSales: netSalesAmount,
      netSalesKnown,
    },
    salesBasis,
  );
  /**
   * Live desk, backfill running, and not one closed sales day has landed:
   * sales are unknown for this period, not $0. Suppress the ratio instead of
   * painting 0.00× — a merchant seeing 0.00× reads it as "my ads made nothing".
   */
  const salesCoverage = options?.salesCoverage ?? null;
  const salesPending =
    !useSampleDesk &&
    salesCoverage != null &&
    !salesCoverage.complete &&
    !salesCoverage.periodExceedsFactWindow &&
    salesCoverage.factDays <= 0 &&
    action.sales <= 0;
  /** Any missing closed day makes break-even advice premature (not just zero days). */
  const salesCoverageIncomplete =
    !useSampleDesk &&
    salesCoverage != null &&
    !salesCoverage.complete &&
    !salesCoverage.periodExceedsFactWindow;
  const mer = salesPending ? null : computeMer(action.sales, totalSpend);
  const newCustomerNetSales = honestSales.newCustomerNetSales ?? 0;
  const returningCustomerNetSales =
    honestSales.returningCustomerNetSales ?? 0;
  const amer = salesPending
    ? null
    : calculateAmer(newCustomerNetSales, totalSpend);
  const mix = channelMix(spends);
  /**
   * Margin is optional — Total ROAS unlocks without BE.
   * Break-even only after an explicit margin confirm (or sample desk).
   */
  const settingsSaved = true;
  const breakEvenMerRaw = computeBreakEvenMer(effectiveMarginPct);
  const breakEvenMer =
    marginIsConfirmed(settings) || useSampleDesk ? breakEvenMerRaw : null;
  const hasSpend = totalSpend > 0;
  const onboarding: RitualOnboarding = {
    settingsSaved,
    hasSpend,
    // Empties own TTFV when margin/spend missing; keep false so guide never duplicates.
    showGuide: false,
  };
  const control = buildControlPace({
    sales: action.sales,
    totalSpend,
    targetMer: effectiveTargetMer,
    period: range,
    ianaTimezone: deskTz,
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
      salesPct: pctChange(action.sales, options.priorSales.totalSales),
      spendPct: pctChange(totalSpend, priorSpend),
      merAbs:
        mer !== null && priorMer !== null
          ? Math.round((mer - priorMer) * 100) / 100
          : null,
    };
  }

  let tillLtv: TillLtvSummary;
  if (!entitlements.canUseLtv) {
    // Free + live: do not compute / expose proprietary cohort LTV.
    tillLtv = proRequiredLtvSummary(range.label);
  } else {
    const tillNewBuyers =
      useSampleDesk
        ? (honestSales.newCustomers ?? 0)
        : (await countNewBuyersInRange(shop.id, range)) ??
          (honestSales.customerMetricsAvailable
            ? (honestSales.newCustomers ?? 0)
            : 0);

    tillLtv = await buildTillLtvSummary(shop.id, {
      totalSpend,
      newCustomers: tillNewBuyers,
      periodLabel: range.label,
      useSampleDesk,
      ianaTimezone: deskTz,
    });
  }

  const spendRecon = spendReconMatchesPeriod(
    settings.declaredAdsSpendPeriodStart,
    settings.declaredAdsSpendPeriodEnd,
    range.start,
    range.end,
    deskTz,
  )
    ? computeSpendRecon(totalSpend, settings.declaredAdsSpend)
    : null;

  /** Total ROAS is readable once spend exists; recon drift still warns. */
  const cashActionReady =
    settingsSaved &&
    hasSpend &&
    (useSampleDesk || spendRecon?.status !== "drift");

  const allocation =
    cashActionReady &&
    (useSampleDesk || !spendCoverage.incomplete) &&
    breakEvenMer != null
      ? buildAllocationSuggestion(
          spends,
          action.sales,
          totalSpend,
          breakEvenMer,
        )
      : null;

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
      existing.sales === action.sales &&
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
        sales: action.sales,
        spend: totalSpend,
        mer,
        breakEvenMer: breakEvenMer ?? 0,
        channelMix: mixJson,
        allocation: allocationJson,
        reconStatus: "desk",
      },
      update: {
        sales: action.sales,
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
    sales: action.sales,
    totalSalesAmount,
    grossSales: honestSales.grossSales ?? honestSales.totalSales,
    grossSalesKnown: honestSales.grossSalesKnown !== false,
    netSales: netSalesAmount,
    netSalesKnown,
    salesBasis: action.basisUsed,
    netBasisUnavailable: action.netUnavailable,
    salesSource: honestSales.source,
    orderCount: honestSales.orderCount,
    newCustomers: honestSales.newCustomers ?? 0,
    returningCustomers: honestSales.returningCustomers ?? 0,
    newCustomerNetSales,
    returningCustomerNetSales,
    guestOrders: honestSales.guestOrders ?? 0,
    customerMetricsAvailable: honestSales.customerMetricsAvailable ?? false,
    useSampleDesk,
    blockedMockAsLive,
    totalSpend,
    mer,
    amer,
    breakEvenMer,
    cashActionReady,
    marginStale: marginIsStale(settings),
    targetMer: effectiveTargetMer,
    marginPct: effectiveMarginPct,
    channelMix: mix,
    salesPending,
    /**
     * Null while closed-day sales are still landing — "cut or shift spend"
     * must never be advised from a period whose sales are half-loaded.
     */
    aboveBreakEven:
      cashActionReady &&
      !salesCoverageIncomplete &&
      mer !== null &&
      breakEvenMer !== null
        ? mer >= breakEvenMer
        : null,
    allocation,
    onboarding,
    freshness,
    spendCoverage,
    spendRecon,
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
  formatSpendReconLine,
  computeSpendRecon,
} from "./mer-trust";
