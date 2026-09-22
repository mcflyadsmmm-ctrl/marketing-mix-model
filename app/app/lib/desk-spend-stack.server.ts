/**
 * Spend tab analysis stack — Total ROAS glance, explorer, allocation mix, CPA.
 * Religion: Total ROAS = Shopify Total Sales ÷ entered spend; empty is —, never 0×.
 * No pixels. Shared so app.spend.tsx does not inline three loaders.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { SPEND_CHANNEL_LABELS, type SpendChannel } from "@mcfly/mer-engine";
import type { SpendExplorerSeriesView } from "../components/SpendExplorer";
import {
  buildAllocationHistoryView,
  buildWindowSets,
  capHistoryDays,
  filterDaysByDateKeys,
  HISTORY_QUARTER_DAYS_CAP,
  resolveHistoryWindow,
  shiftDateKey,
  type AllocationHistoryView,
  type HistoryDay,
  type WindowSets,
} from "./allocation-history";
import {
  applyLiveBuyerIndexToCpaDays,
  applyUniqueBuyerCounts,
  buildCpaWindowSnapshot,
  cpaExplorerRangeOf,
  hasTypedSpend,
  rangeDayKeys,
  resolveCpaDeskWindows,
  type CpaDayPoint,
  type CpaExplorerRange,
  type CpaPaybackView,
  type CpaWindowId,
  type CpaWindowSnapshot,
} from "./cpa-desk";
import { cpaPaybackForWindow, type CpaDeskLoaderData } from "./cpa-desk.server";
import prisma from "../db.server";
import { buildCashControlBoard, type CashControlBoard } from "./mer-control";
import {
  buildControlPace,
  buildDailyRowsForWindow,
  buildDashboardMetrics,
  getOrCreateSettings,
  type ControlPace,
  type DashboardMetrics,
} from "./mer-dashboard.server";
import {
  countIdentifiedBuyersInRange,
  countNewBuyersInRange,
} from "./order-facts.server";
import { buildLivePasteBuyerIndex } from "./spend-paste-buyers.server";
import type { SpendPasteLiveIndex } from "./spend-paste-preview";
import {
  spendPairCoverage,
  type SpendPairCoverage,
} from "./spend-pair-coverage";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
  resolvePriorPeriod,
  type PeriodPreset,
} from "./periods";
import { parseSalesBasis } from "./sales-basis";
import {
  getSalesFactsByDay,
  loadDeskSalesForPeriod,
  salesFactsBlockLock,
} from "./sales-facts.server";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  localDayKey,
  utcDayKey,
} from "./sample-desk.server";
import { shopLocalDayKey } from "./shop-local-day";
import { scheduleFirstSessionShopifyWindow } from "./first-session-shopify-window.server";
import type { SalesResult } from "./shopify-sales.server";
import {
  isCertifiedSalesDayFact,
  shopifyReadOrdersScopesAllowDeep,
} from "./shopify-order-window";
import { buildTillLtvSummary } from "./till-ltv.server";
import {
  applyExplorerMode,
  bucketExplorerRows,
  dateKeyFromLocal,
  explorerQueryMatchingScoreboard,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
  summarizeExplorer,
  type ExplorerDailyRow,
} from "./spend-explorer";

export type SpendWindowSets = {
  period: WindowSets;
  lookback: WindowSets;
};

export type SpendCpaView = {
  windows: CpaWindowSnapshot[];
  days: CpaDayPoint[];
  explorerRanges: CpaDeskLoaderData["explorerRanges"];
  paybacks: Record<CpaWindowId, CpaPaybackView>;
  paybackBase: CpaDeskLoaderData["paybackBase"];
  hasSpend: boolean;
  salesError: string | null;
  todaySalesTruncated: boolean;
  todaySalesUnavailable: boolean;
  shopifyOrderWindowLimited: boolean;
};

export type SpendAnalysisData = {
  metrics: DashboardMetrics;
  explorer: SpendExplorerSeriesView;
  cashControl: CashControlBoard | null;
  monthPace: ControlPace | null;
  history: AllocationHistoryView | null;
  windowSets: SpendWindowSets;
  cpa: SpendCpaView;
  /** Certified SalesDayFact dollars keyed YYYY-MM-DD — missing key means no fact. */
  certifiedSalesByDay: Record<string, number>;
  /** Live unique OrderFacts for paste Cash CPA. Null on SAMPLE. */
  liveBuyerIndex: SpendPasteLiveIndex | null;
  salesError: string | null;
  todaySalesUnavailable: boolean;
  todaySalesTruncated: boolean;
  salesFactsIncomplete: {
    factDays: number;
    expectedClosedDays: number;
  } | null;
  factsIncomplete: boolean;
  shopifyOrderWindowLimited: boolean;
  pairCoverage: SpendPairCoverage;
};

export function emptySpendWindowSets(): SpendWindowSets {
  const empty = (): WindowSets => ({
    week: [],
    month: [],
    quarter: [],
    year: [],
  });
  return { period: empty(), lookback: empty() };
}

export function spendPanelRedirectPath(
  requestUrl: string,
  panel: "roas" | "mix" | "cpa",
  basePath: "/app/spend" | "/demo/spend",
): string {
  const url = new URL(requestUrl);
  const next = new URLSearchParams(url.searchParams);
  next.set("panel", panel);
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : `${basePath}?panel=${panel}`;
}

function historyChannelLabel(
  channel: string,
  customLabels?: Record<string, string>,
): string {
  const custom = customLabels?.[channel];
  if (custom) return custom;
  const known = SPEND_CHANNEL_LABELS[channel as SpendChannel];
  if (known) return known;
  const [base, slug] = channel.split(":");
  if (base === "other" && slug) {
    return slug.replace(/-+/g, " ");
  }
  return channel;
}

function toHistoryDays(
  rows: ExplorerDailyRow[],
  customLabels?: Record<string, string>,
): HistoryDay[] {
  return rows.map((row) => ({
    dateKey: row.dateKey,
    sales: row.sales,
    spend: row.spend,
    channels: row.channels.map((channel) => ({
      channel: historyChannelLabel(channel.channel, customLabels),
      amount: channel.amount,
    })),
  }));
}

function minDate(left: Date, right: Date): Date {
  return left.getTime() <= right.getTime() ? left : right;
}

function maxDate(left: Date, right: Date): Date {
  return left.getTime() >= right.getTime() ? left : right;
}

function rowsInWindow(
  rows: ExplorerDailyRow[],
  startKey: string,
  endKey: string,
): ExplorerDailyRow[] {
  return rows.filter((row) => row.dateKey >= startKey && row.dateKey <= endKey);
}

async function loadBuyerDays(
  shopId: string,
  range: { start: Date; end: Date },
  useSampleDesk: boolean,
): Promise<Map<string, Omit<CpaDayPoint, "spend">>> {
  const map = new Map<string, Omit<CpaDayPoint, "spend">>();
  if (useSampleDesk) {
    const rows = await prisma.sampleSalesDay.findMany({
      where: { shopId, day: { gte: range.start, lte: range.end } },
      select: {
        day: true,
        newCustomers: true,
        returningCustomers: true,
        newCustomerNetSales: true,
      },
    });
    for (const row of rows) {
      const dateKey = utcDayKey(row.day);
      map.set(dateKey, {
        dateKey,
        newCustomers: row.newCustomers,
        returningCustomers: row.returningCustomers,
        newCustomerSales: row.newCustomerNetSales,
        buyersKnown: true,
      });
    }
    return map;
  }

  const now = new Date();
  const scopesAllowDeep = shopifyReadOrdersScopesAllowDeep();
  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: range.start, lte: range.end } },
    select: {
      day: true,
      sales: true,
      newCustomers: true,
      returningCustomers: true,
      newCustomerNetSales: true,
    },
  });
  for (const row of rows) {
    if (
      !isCertifiedSalesDayFact({
        day: row.day,
        sales: row.sales,
        now,
        scopesAllowDeep,
      })
    ) {
      continue;
    }
    const dateKey = utcDayKey(row.day);
    map.set(dateKey, {
      dateKey,
      newCustomers: row.newCustomers,
      returningCustomers: row.returningCustomers,
      newCustomerSales: row.newCustomerNetSales,
      buyersKnown: false,
    });
  }
  return map;
}

function joinCpaDays(
  spendByDay: Map<string, number>,
  buyersByDay: Map<string, Omit<CpaDayPoint, "spend">>,
): CpaDayPoint[] {
  const keys = new Set<string>([...spendByDay.keys(), ...buyersByDay.keys()]);
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((dateKey) => {
      const buyers = buyersByDay.get(dateKey);
      const spend = spendByDay.get(dateKey) ?? 0;
      return {
        dateKey,
        spend: spend > 0 ? spend : 0,
        newCustomers: buyers?.newCustomers ?? 0,
        returningCustomers: buyers?.returningCustomers ?? 0,
        newCustomerSales: buyers?.newCustomerSales ?? 0,
        buyersKnown: buyers?.buyersKnown ?? false,
      };
    });
}

async function loadSpendCpa(args: {
  shopId: string;
  useSampleDesk: boolean;
  deskTz: string | null;
  dailyRows: ExplorerDailyRow[];
  dayKey: (instant: Date) => string;
  liveBuyerIndex: SpendPasteLiveIndex | null;
}): Promise<SpendCpaView> {
  const now = new Date();
  const deskWindows = resolveCpaDeskWindows(now, args.deskTz);
  const buyerDays = await loadBuyerDays(
    args.shopId,
    deskWindows.explorer,
    args.useSampleDesk,
  );
  const explorerFrom = args.dayKey(deskWindows.explorer.start);
  const explorerTo = args.dayKey(deskWindows.explorer.end);
  const spendByDay = new Map<string, number>();
  for (const row of rowsInWindow(args.dailyRows, explorerFrom, explorerTo)) {
    if (row.spend > 0) spendByDay.set(row.dateKey, row.spend);
  }
  const days = applyLiveBuyerIndexToCpaDays(
    joinCpaDays(spendByDay, buyerDays),
    args.useSampleDesk ? null : args.liveBuyerIndex,
  );

  let thisMonth = buildCpaWindowSnapshot(
    "this_month",
    deskWindows.thisMonth,
    days,
    args.deskTz,
  );
  let last28 = buildCpaWindowSnapshot(
    "last_28",
    deskWindows.last28,
    days,
    args.deskTz,
  );

  if (!args.useSampleDesk) {
    const [monthNew, monthId, lastNew, lastId] = await Promise.all([
      countNewBuyersInRange(args.shopId, deskWindows.thisMonth),
      countIdentifiedBuyersInRange(args.shopId, deskWindows.thisMonth),
      countNewBuyersInRange(args.shopId, deskWindows.last28),
      countIdentifiedBuyersInRange(args.shopId, deskWindows.last28),
    ]);
    thisMonth = applyUniqueBuyerCounts(thisMonth, {
      identified: monthId,
      newBuyers: monthNew,
    });
    last28 = applyUniqueBuyerCounts(last28, {
      identified: lastId,
      newBuyers: lastNew,
    });
  }

  const windows = [thisMonth, last28];
  const ltv = await buildTillLtvSummary(args.shopId, {
    totalSpend: thisMonth.spend,
    newCustomers: thisMonth.newCustomers,
    periodLabel: thisMonth.label,
    useSampleDesk: args.useSampleDesk,
    ianaTimezone: args.deskTz,
  });
  const paybackBase = {
    avgRevenueD30: ltv.avgRevenueD30,
    avgRevenueD90: ltv.avgRevenueD90,
    avgRevenueD365: ltv.avgRevenueD365,
    historyLimited: ltv.historyLimited,
  };
  const paybacks: Record<CpaWindowId, CpaPaybackView> = {
    this_month: cpaPaybackForWindow(thisMonth, paybackBase),
    last_28: cpaPaybackForWindow(last28, paybackBase),
  };
  const explorerRanges = {
    this_month: rangeDayKeys(
      cpaExplorerRangeOf("this_month", deskWindows),
      args.deskTz,
    ),
    last_28: rangeDayKeys(
      cpaExplorerRangeOf("last_28", deskWindows),
      args.deskTz,
    ),
    "90d": rangeDayKeys(cpaExplorerRangeOf("90d", deskWindows), args.deskTz),
    ytd: rangeDayKeys(cpaExplorerRangeOf("ytd", deskWindows), args.deskTz),
  } satisfies Record<CpaExplorerRange, { fromKey: string; toKey: string }>;

  return {
    windows,
    days,
    explorerRanges,
    paybacks,
    paybackBase,
    hasSpend: hasTypedSpend(days, windows),
    salesError: null,
    todaySalesTruncated: false,
    todaySalesUnavailable: false,
    shopifyOrderWindowLimited:
      periodMayExceedShopifyOrderWindow(deskWindows.thisMonth),
  };
}

export async function loadSpendAnalysis(args: {
  request: Request;
  admin: AdminApiContext;
  shopDomain: string;
  shop: { id: string; ianaTimezone: string | null | undefined };
  useSampleDesk: boolean;
}): Promise<SpendAnalysisData> {
  const url = new URL(args.request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset: PeriodPreset = parsePeriodPreset(url.searchParams.get("period"));
  const settings = await getOrCreateSettings(args.shop.id);
  const now = new Date();
  const deskTz = deskPeriodTimeZone(args.useSampleDesk, args.shop.ianaTimezone);
  const range = resolvePeriod(preset, now, deskTz);
  const dayKey = (instant: Date) =>
    deskTz ? shopLocalDayKey(instant, deskTz) : dateKeyFromLocal(instant);

  let sales: SalesResult;
  let salesError: string | null = null;
  let todaySalesUnavailable = false;
  let todaySalesTruncated = false;
  let salesFactsIncomplete: SpendAnalysisData["salesFactsIncomplete"] = null;
  let factsIncomplete = false;
  let shopifyOrderWindowLimited = false;
  let salesCoverage: Awaited<
    ReturnType<typeof loadDeskSalesForPeriod>
  >["factsCoverage"] = null;

  if (args.useSampleDesk) {
    sales = await fetchSampleSales(args.shop.id, range);
  } else {
    void scheduleFirstSessionShopifyWindow(args.admin, args.shop.id);
    const desk = await loadDeskSalesForPeriod({
      admin: args.admin,
      shopId: args.shop.id,
      range,
      ianaTimezone: args.shop.ianaTimezone,
      signal: args.request.signal,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    todaySalesTruncated = desk.todaySalesTruncated;
    const coverage = desk.factsCoverage;
    salesCoverage = coverage;
    factsIncomplete = salesFactsBlockLock(coverage);
    salesFactsIncomplete =
      coverage != null &&
      !coverage.complete &&
      !coverage.periodExceedsFactWindow
        ? {
            factDays: coverage.factDays,
            expectedClosedDays: coverage.expectedClosedDays,
          }
        : null;
    shopifyOrderWindowLimited = Boolean(coverage?.periodExceedsFactWindow);
  }

  const metrics = await buildDashboardMetrics(args.shopDomain, range, sales, {
    salesBasis: parseSalesBasis(settings.salesBasis, "total"),
    salesCoverage,
  });

  const explicitExplorerRange = url.searchParams.get("exRange");
  const historyFirstEmpty =
    !metrics.onboarding.hasSpend && !args.useSampleDesk && !shotMode;
  const tiedExplorer =
    explicitExplorerRange || historyFirstEmpty
      ? null
      : explorerQueryMatchingScoreboard(preset, range, deskTz);
  const explorerRange = explicitExplorerRange
    ? parseExplorerRange(explicitExplorerRange)
    : historyFirstEmpty
      ? parseExplorerRange("90d")
      : (tiedExplorer?.range ?? "custom");
  const explorerFrom = explicitExplorerRange
    ? parseExplorerDateParam(url.searchParams.get("exFrom"))
    : (tiedExplorer?.from ?? null);
  const explorerTo = explicitExplorerRange
    ? parseExplorerDateParam(url.searchParams.get("exTo"))
    : (tiedExplorer?.to ?? null);
  const explorerWindow = resolveExplorerWindow(explorerRange, now, {
    from: explorerFrom,
    to: explorerTo,
    timeZone: deskTz,
  });

  const l12m = resolvePeriod("l12m", now, deskTz);
  const histWindow = resolveHistoryWindow(l12m, HISTORY_QUARTER_DAYS_CAP);
  const ytdRange = resolvePeriod("ytd", now, deskTz);
  const priorYtd = resolvePriorPeriod("ytd", now, deskTz);
  const controlRange = {
    start:
      priorYtd.start.getTime() < ytdRange.start.getTime()
        ? priorYtd.start
        : ytdRange.start,
    end: ytdRange.end,
    label: "Control",
  };
  const cpaWindows = resolveCpaDeskWindows(now, deskTz);

  const unionStart = minDate(
    minDate(explorerWindow.start, histWindow.start),
    minDate(controlRange.start, cpaWindows.explorer.start),
  );
  const unionEnd = maxDate(
    maxDate(explorerWindow.end, histWindow.end),
    maxDate(controlRange.end, cpaWindows.explorer.end),
  );
  const unionRange = { start: unionStart, end: unionEnd, label: "Spend stack" };

  const liveBuyerIndexPromise = buildLivePasteBuyerIndex(
    args.shop.id,
    unionRange,
    { source: args.useSampleDesk ? "sample" : undefined },
  );

  let salesByDay = new Map<string, number>();
  try {
    salesByDay = args.useSampleDesk
      ? await fetchSampleSalesByDay(args.shop.id, unionRange)
      : await getSalesFactsByDay(args.shop.id, unionRange);
  } catch {
    salesByDay = new Map();
  }
  const liveBuyerIndex = await liveBuyerIndexPromise;

  const { rows: dailyRows, channelLabels } = await buildDailyRowsForWindow(
    args.shop.id,
    {
      sampleOnly: args.useSampleDesk,
      excludeSample: !args.useSampleDesk,
      salesByDay,
      windowStart: unionStart,
      windowEnd: unionEnd,
      timeZone: deskTz,
    },
  );

  const explorerGranularity = parseExplorerGranularity(
    url.searchParams.get("exGran"),
  );
  const explorerMode = parseExplorerMode(url.searchParams.get("exMode"));
  const explorerRows = rowsInWindow(
    dailyRows,
    dayKey(explorerWindow.start),
    dayKey(explorerWindow.end),
  );
  const explorerBuckets = bucketExplorerRows(explorerRows, explorerGranularity);
  const explorerPlot = applyExplorerMode(explorerBuckets, explorerMode);
  const explorerSummary = summarizeExplorer(explorerRows, {
    newCustomers: 0,
    returningCustomers: 0,
    customerMetricsAvailable: false,
    bucketCount: explorerPlot.length,
  });
  const explorer: SpendExplorerSeriesView = {
    buckets: explorerPlot,
    summary: explorerSummary,
    mode: explorerMode,
    granularity: explorerGranularity,
    range: explorerWindow.range,
    windowLabel: explorerWindow.label,
    targetMer: metrics.targetMer,
    breakEvenMer: metrics.breakEvenMer,
    showSales: parseExplorerShowSales(url.searchParams.get("exSales")),
    fromKey: dayKey(explorerWindow.start),
    toKey: dayKey(explorerWindow.end),
    asOfKey: dayKey(explorerWindow.end),
    channelLabels,
  };

  let cashControl: CashControlBoard | null = null;
  if (!metrics.salesPending) {
    try {
      const board = buildCashControlBoard(dailyRows, metrics.targetMer);
      cashControl = board.chips.length > 0 ? board : null;
    } catch {
      cashControl = null;
    }
  }

  const mtdRange = resolvePeriod("mtd", now, deskTz);
  const monthPace = cashControl
    ? buildControlPace({
        sales: cashControl.dualClose?.mtd.sales ?? 0,
        totalSpend: cashControl.dualClose?.mtd.spend ?? 0,
        targetMer: metrics.targetMer,
        period: mtdRange,
        ianaTimezone: deskTz,
      })
    : null;

  let history: AllocationHistoryView | null = null;
  let windowSets = emptySpendWindowSets();
  try {
    const todayKey = deskTz ? shopLocalDayKey(now, deskTz) : localDayKey(now);
    const asOfDateKey = shiftDateKey(todayKey, -1);
    const historyDays = capHistoryDays(
      toHistoryDays(dailyRows, channelLabels),
      HISTORY_QUARTER_DAYS_CAP,
    );
    const periodStartKey = dayKey(range.start);
    const periodEndKey = dayKey(range.end);
    const periodDays = filterDaysByDateKeys(
      historyDays,
      periodStartKey,
      periodEndKey,
    );
    windowSets = {
      period: buildWindowSets(periodDays),
      lookback: buildWindowSets(historyDays),
    };
    const allocationForHist = salesError ? null : metrics.allocation;
    const nowChannelSpend =
      allocationForHist?.inputs.channelEfficiencies.map((channel) => ({
        channel: channel.name,
        amount: channel.spend,
      })) ?? [];
    const primaryForHist = allocationForHist?.actions[0] ?? null;
    history = buildAllocationHistoryView({
      days: historyDays,
      nowChannelSpend,
      breakEvenMer: metrics.breakEvenMer,
      asOfDateKey,
      primaryAction: primaryForHist
        ? { channel: primaryForHist.channel, type: primaryForHist.type }
        : null,
    });
  } catch {
    history = null;
  }

  const cpa = await loadSpendCpa({
    shopId: args.shop.id,
    useSampleDesk: args.useSampleDesk,
    deskTz,
    dailyRows,
    dayKey,
    liveBuyerIndex: args.useSampleDesk ? null : liveBuyerIndex,
  });
  if (!args.useSampleDesk) {
    cpa.salesError = salesError;
    cpa.todaySalesTruncated = todaySalesTruncated;
    cpa.todaySalesUnavailable = todaySalesUnavailable;
    cpa.shopifyOrderWindowLimited =
      cpa.shopifyOrderWindowLimited || shopifyOrderWindowLimited;
  }

  const certifiedSalesByDay: Record<string, number> = {};
  for (const [dateKey, sales] of salesByDay) {
    certifiedSalesByDay[dateKey] = sales;
  }

  const periodFrom = dayKey(range.start);
  const periodTo = dayKey(range.end);
  const pairCoverage = spendPairCoverage({
    salesDays: [...salesByDay.entries()]
      .filter(
        ([dateKey, sales]) =>
          dateKey >= periodFrom && dateKey <= periodTo && sales > 0,
      )
      .map(([dateKey]) => dateKey),
    spendDays: dailyRows
      .filter(
        (row) =>
          row.dateKey >= periodFrom &&
          row.dateKey <= periodTo &&
          row.spend > 0,
      )
      .map((row) => row.dateKey),
  });

  return {
    metrics,
    explorer,
    cashControl,
    monthPace,
    history,
    windowSets,
    cpa,
    certifiedSalesByDay,
    liveBuyerIndex,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    salesFactsIncomplete,
    factsIncomplete,
    shopifyOrderWindowLimited,
    pairCoverage,
  };
}
