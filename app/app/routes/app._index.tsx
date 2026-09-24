import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useLocation, useNavigation, useSearchParams, redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { PUBLIC_APP_STUB, isGoneResponse, requireAdmin } from "../lib/public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "../lib/first-session-shopify-window.server";
import {
  hasShopifySessionContext,
  isEmbeddedAdminRequest,
} from "../../scripts/shopify-app-path.mjs";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { OverviewYoyCards } from "../components/OverviewYoyCards";
import {
  OverviewDepthPeeks,
  OverviewFirstViewport,
} from "../components/OverviewFirstViewport";
import { OrderHistoryForecast } from "../components/OrderHistoryForecast";
import { OverviewMixForecast } from "../components/OverviewMixForecast";
import {
  OverviewYoyYearSection,
  buildOverviewYoyYearModel,
  useOverviewPanelScroll,
} from "../components/OverviewYoyYearSection";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import { OverviewLivePeriodClock } from "../components/OverviewLivePeriodClock";
import { WeekdaySalesChart } from "../components/WeekdaySalesChart";
import { DeskLane } from "../components/DeskLane";
import { ShareOverviewButton } from "../components/ShareOverviewButton";
import { useDeskHashScroll } from "../components/useDeskHashScroll";
import {
  buildDailyRowsForWindow,
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { buildCashControlBoard, certifyDailyRows } from "../lib/mer-control";
import { buildOverviewYoyCards } from "../lib/overview-yoy";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  DESK_SECTION,
  deskNavHref,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isOverviewHomeStage,
} from "../lib/desk-nav";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { shopLiveIngestDepth } from "../lib/live-ingest-depth.server";
import {
  OVERVIEW_FIRST_LANE_LABEL,
  OVERVIEW_LIVE_HANDOFF_BODY,
  OVERVIEW_MIX_CLOSE_ID,
  OVERVIEW_PENDING_ASOF,
  OVERVIEW_YOY_YEAR_ID,
  OVERVIEW_YOY_YEAR_PANEL,
  overviewGreetingPending,
  overviewOrderBackfillLine,
} from "../lib/overview-first-viewport";
import {
  buildOrderHistoryForecast,
  emptyForecastTargets,
} from "../lib/order-history-forecast";
import {
  buildOverviewMixForecast,
  emptyOverviewMixForecast,
  overviewHistoryDays,
  overviewMixForecastRead,
  overviewMonthClock,
  overviewMtdFromDays,
} from "../lib/overview-mix-forecast";
import {
  buildShareableInsights,
  emptyShareableInsights,
  pickShareableLtvPeek,
} from "../lib/shareable-insights";
import { formatOverviewShareText } from "../lib/cash-close";
import {
  emptySales,
  type SalesResult,
} from "../lib/shopify-sales.server";
import {
  getSalesFactsCoverage,
  getSalesFactsTotals,
  getSalesFactsByDay,
  getSalesOrderFactsByDay,
  loadDeskSalesForPeriod,
  type SalesFactsCoverage,
} from "../lib/sales-facts.server";
import { getOrderBackfillProgress, loadOrderDepthRows, ORDER_FACT_SOURCE } from "../lib/order-facts.server";
import { readDeskMetricSnapshot } from "../lib/desk-metric-snapshot.server";
import {
  buildOverviewOrderBookHero,
  orderBookDaySeries,
  orderBookFirstOrderMs,
  orderBookReturningSales,
  shiftRangeOneYear,
  type OverviewOrderBookHero,
  type OverviewOrderBookRow,
} from "../lib/overview-order-book";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
  resolvePriorPeriod,
  type PeriodPreset,
} from "../lib/periods";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  fetchSampleSalesOrdersByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { materializeRecurringSpendForShop } from "../lib/spend-recurring.server";
import { yearDateRange } from "../lib/sales-goals.server";
import { shopLocalDayKey, shopLocalYmd, spendDeskClosedAsOfKey } from "../lib/shop-local-day";
import { deskAnalyticsDayTotalsLive } from "../lib/shopify-analytics-totals";
import {
  buildOverviewShopifyPeriodClock,
  overviewShopifyFactsPending,
  periodRangeIncludesShopToday,
} from "../lib/overview-live-period-clock";
import { useDeskCurrency } from "../lib/desk-currency";
import { parseYoyYear } from "../lib/yoy-workspace";
import {
  isLiveHandoffGuide,
  LIVE_HANDOFF_HEADING,
} from "../lib/sample-live-handoff";

/** Compact prior-period label for KPI deltas. */
function deltaVsLabel(priorLabel: string | undefined): string {
  if (!priorLabel) return "prior";
  const label = priorLabel.trim();
  if (/^prior ytd$/i.test(label)) return "last year";
  if (label.length > 32) return `${label.slice(0, 29)}…`;
  return label;
}

function formatPctDelta(pct: number | null, priorLabel?: string): string {
  const vs = deltaVsLabel(priorLabel);
  if (pct == null) return vs === "last year" ? "vs last year —" : `vs ${vs} —`;
  const sign = pct > 0 ? "+" : "";
  if (vs === "last year") return `${sign}${pct.toFixed(0)}% vs last year`;
  return `${sign}${pct.toFixed(0)}% vs ${vs}`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!hasShopifySessionContext(request)) {
    return PUBLIC_APP_STUB;
  }
  let admin;
  let session;
  try {
    ({ admin, session } = await authenticate.admin(request));
  } catch (error) {
    if (isGoneResponse(error) && !isEmbeddedAdminRequest(request)) {
      return PUBLIC_APP_STUB;
    }
    throw error;
  }
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const rawPeriod = url.searchParams.get("period");
  const requested = parsePeriodPreset(rawPeriod);
  // y3 stays shot-only (listing captures). Live Overview is not a period slicer —
  // MTD / QTD / YTD live on the chips. L12M still exists for shot captures.
  if (!shotMode && requested === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app?${next.toString()}`);
  }
  const preset = requested;
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const salesBasis = "total" as const;
  const ianaTimezone = shop.ianaTimezone;
  const now = new Date();
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const orderBookDepth = useSampleDesk
    ? "paid_full"
    : await shopLiveIngestDepth(shop.id);
  await materializeRecurringSpendForShop({
    shopId: shop.id,
    currencyCode: shop.currencyCode,
    ianaTimezone: shop.ianaTimezone,
    sampleOn: useSampleDesk,
  });
  const deskTz = deskPeriodTimeZone(useSampleDesk, ianaTimezone);
  const range = resolvePeriod(preset, now, deskTz);
  const priorRange = resolvePriorPeriod(preset, now, deskTz);

  let sales: SalesResult = emptySales("shopify");
  /** Null when prior facts are outside the window / failed — skip deltas (never fake 0). */
  let priorSales: {
    totalSales: number;
    netSales?: number | null;
    netSalesKnown?: boolean;
  } | null = null;
  let salesError: string | null = null;
  let todaySalesUnavailable = false;
  let todaySalesTruncated = false;
  let salesByDay = new Map<string, number>();
  let salesFactsCoverageForBanner: SalesFactsCoverage | null = null;
  /** Stamp only after a successful desk load — never before. */
  let salesPulledAt: string | null = null;

  const dayFetchRange = range;

  if (useSampleDesk) {
    const [sampleSales, samplePrior] = await Promise.all([
      fetchSampleSales(shop.id, range),
      fetchSampleSales(shop.id, priorRange),
    ]);
    sales = sampleSales;
    priorSales = {
      totalSales: samplePrior.totalSales,
      netSales: samplePrior.netSales,
      netSalesKnown: samplePrior.netSalesKnown,
    };
    salesByDay = await fetchSampleSalesByDay(shop.id, dayFetchRange);
    salesPulledAt = new Date().toISOString();
  } else {
    /*
     * Desk paint reads stored SalesDayFact only. It does not call ShopifyQL
     * and it does not page orders. Today's row is written by the order
     * webhook job. Window resume is fire-and-forget + job ticks.
     */
    let mainCoverage: SalesFactsCoverage = {
      expectedClosedDays: 0,
      factDays: 0,
      complete: false,
      periodExceedsFactWindow: false,
    };
    let dayCoverage: SalesFactsCoverage = {
      expectedClosedDays: 0,
      factDays: 0,
      complete: false,
      periodExceedsFactWindow: false,
    };
    try {
      [mainCoverage, dayCoverage] = await Promise.all([
        getSalesFactsCoverage(shop.id, range, now, ianaTimezone),
        getSalesFactsCoverage(shop.id, dayFetchRange, now, ianaTimezone),
      ]);
    } catch {
      // Coverage read failed — still facts-only below (never unbounded live crawl).
    }

    // Window resume + default burst — never a timid 2-day sealed book.
    void scheduleFirstSessionShopifyWindow(admin, shop.id);

    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone,
      now,
      signal: request.signal,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    todaySalesTruncated = desk.todaySalesTruncated;
    salesFactsCoverageForBanner = desk.factsCoverage ?? mainCoverage;
    // Freshness only after a successful facts load; unavailable today → null chip.
    salesPulledAt =
      desk.salesError || desk.todaySalesUnavailable
        ? null
        : new Date().toISOString();

    try {
      const [priorFacts, priorCoverage] = await Promise.all([
        getSalesFactsTotals(shop.id, priorRange, now),
        getSalesFactsCoverage(shop.id, priorRange, now, ianaTimezone),
      ]);
      // Clamped/incomplete prior → skip deltas (never fake priorMer=0 improvement).
      priorSales =
        priorFacts.rangeClampedToFactWindow || !priorCoverage.complete
          ? null
          : {
              totalSales: priorFacts.totalSales,
              netSales: priorFacts.netSalesComplete
                ? priorFacts.netSalesSum
                : null,
              netSalesKnown: priorFacts.netSalesComplete,
            };
    } catch {
      priorSales = null;
    }

    try {
      salesByDay = await getSalesFactsByDay(shop.id, dayFetchRange);
    } catch {
      salesByDay = new Map();
    }
  }

  let spendByDay = new Map<string, number>();
  try {
    const { rows: chartRows } = await buildDailyRowsForWindow(shop.id, {
      sampleOnly: useSampleDesk,
      excludeSample: !useSampleDesk,
      salesByDay,
      windowStart: range.start,
      windowEnd: range.end,
      timeZone: deskTz,
    });
    for (const row of chartRows) {
      if (row.spend > 0) spendByDay.set(row.dateKey, row.spend);
    }
  } catch {
    spendByDay = new Map();
  }

  /*
   * Sales explorer series — bounded to the last ~13 months of stored daily
   * sales so the Overview chart can own real range presets (30d/90d/6mo/YTD/1y)
   * + grain, sales-only. Reads stored SalesDayFact / SampleSalesDay only (never
   * unbounded live GraphQL). Present days only — no fake $0. Metrics / YoY /
   * peeks stay on the desk window; this feeds the chart alone.
   */
  const explorerRange = {
    start: new Date(range.end.getTime() - 400 * 24 * 60 * 60 * 1000),
    end: range.end,
    label: "Sales explorer",
  };
  let explorerByDay = new Map<string, { sales: number; orders: number }>();
  try {
    explorerByDay = useSampleDesk
      ? await fetchSampleSalesOrdersByDay(shop.id, explorerRange)
      : await getSalesOrderFactsByDay(shop.id, explorerRange);
  } catch {
    explorerByDay = new Map();
  }
  if (explorerByDay.size < salesByDay.size) {
    for (const [dateKey, value] of salesByDay) {
      if (!explorerByDay.has(dateKey)) explorerByDay.set(dateKey, { sales: value, orders: 0 });
    }
  }

  const orderBackfillProgress = useSampleDesk
    ? null
    : await getOrderBackfillProgress(shop.id, {
        ianaTimezone: shop.ianaTimezone,
        now,
      });

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesByDay,
    ...(priorSales != null ? { priorSales, priorRange } : {}),
    salesPulledAt,
    salesBasis,
    salesCoverage: salesFactsCoverageForBanner,
  });

  const ymd = shopLocalYmd(now, deskTz);
  const asOf = { year: ymd.y, month: ymd.m, day: ymd.d };
  const yoyYear = parseYoyYear(url.searchParams.get("year"), asOf.year);

  let cashControl: ReturnType<typeof buildCashControlBoard> | null = null;
  let yoyYearWorkspace = buildOverviewYoyYearModel([], yoyYear, asOf);
  try {
    const ytdRange = resolvePeriod("ytd", now, deskTz);
    const priorYtd = resolvePriorPeriod("ytd", now, deskTz);
    const startYear = Math.min(yoyYear, asOf.year) - 1;
    const yoyStart = yearDateRange(startYear, deskTz).start;
    const controlStartMs = Math.min(
      priorYtd.start.getTime(),
      ytdRange.start.getTime(),
      yoyStart.getTime(),
    );
    const controlRange = {
      start: new Date(controlStartMs),
      end: now,
      label: "Control",
    };
    const controlSalesByDay = useSampleDesk
      ? await fetchSampleSalesByDay(shop.id, controlRange)
      : await getSalesFactsByDay(shop.id, controlRange);
    const { rows: controlRows, channelLabels } = await buildDailyRowsForWindow(
      shop.id,
      {
        sampleOnly: useSampleDesk,
        excludeSample: !useSampleDesk,
        salesByDay: controlSalesByDay,
        windowStart: controlRange.start,
        windowEnd: controlRange.end,
        timeZone: deskTz,
      },
    );
    if (!metrics.salesPending) {
      const board = buildCashControlBoard(controlRows, metrics.targetMer);
      cashControl = board.chips.length > 0 ? board : null;
    }
    const { days } = certifyDailyRows(controlRows);
    yoyYearWorkspace = buildOverviewYoyYearModel(
      days,
      yoyYear,
      asOf,
      channelLabels,
    );
  } catch {
    cashControl = null;
  }

  const shareTz = deskPeriodTimeZone(useSampleDesk, ianaTimezone);
  const shareDayKey = (instant: Date) =>
    shareTz
      ? shopLocalDayKey(instant, shareTz)
      : instant.toISOString().slice(0, 10);

  const explorerDays = [...explorerByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => ({
      dateKey,
      sales: value.sales,
      orders: value.orders,
    }));
  // ShopifyQL SalesDayFact days for the Live period clock. SAMPLE stays empty
  // so order/sample bars cannot be labeled Shopify Total Sales.
  const analyticsExplorerDays = useSampleDesk ? [] : explorerDays;
  const monthPrefix = `${ymd.y}-${String(ymd.m).padStart(2, "0")}`;
  const clock = overviewMonthClock(ymd.y, ymd.m, ymd.d);
  const mtdFromChip = cashControl?.chips.find((chip) => chip.id === "mtd")?.sales;
  const mtdSales =
    mtdFromChip != null && Number.isFinite(mtdFromChip)
      ? mtdFromChip
      : overviewMtdFromDays(explorerDays, monthPrefix);
  const mixForecast = buildOverviewMixForecast({
    salesPending: Boolean(metrics.salesPending),
    orderCount: metrics.orderCount,
    windowNewSales: metrics.customerMetricsAvailable
      ? metrics.newCustomerNetSales
      : null,
    windowReturningSales: metrics.customerMetricsAvailable
      ? metrics.returningCustomerNetSales
      : null,
    mtdSales,
    dailySales: explorerDays.map((day) => day.sales),
    daysElapsed: clock.daysElapsed,
    daysInMonth: clock.daysInMonth,
    remainingDays: clock.remainingDays,
    historyLimited: Boolean(
      !useSampleDesk && orderBackfillProgress?.historyLimited,
    ),
    historyDays: overviewHistoryDays(
      explorerDays[0]?.dateKey ?? null,
      explorerDays[explorerDays.length - 1]?.dateKey ?? null,
    ),
  });
  const orderForecast = buildOrderHistoryForecast({
    salesPending: Boolean(metrics.salesPending),
    dailySales: explorerDays.map((day) => day.sales),
    todayYear: ymd.y,
    todayMonth: ymd.m,
    historyLimited: Boolean(
      !useSampleDesk && orderBackfillProgress?.historyLimited,
    ),
    targets: emptyForecastTargets(),
  });

  /*
   * Overview first-fold hero — OrderFact sums labeled From orders.
   * Never blank median / returning / weekend because SalesDayFact is pending.
   * Do not write these day sums into SalesDayFact.
   */
  const orderFactSource = useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const priorOrderRange = shiftRangeOneYear(range.start, range.end);
  const lookbackStart = new Date(range.start.getTime());
  lookbackStart.setUTCFullYear(lookbackStart.getUTCFullYear() - 2);
  let orderHero: OverviewOrderBookHero = buildOverviewOrderBookHero({
    windowOrders: [],
    priorOrders: [],
    firstByCustomer: new Map(),
  });
  let orderExplorerDays = explorerDays;
  let priorDayKey: string | null = null;
  let priorDayOnFile = false;
  let priorDaySales: number | null = null;
  if (!useSampleDesk) {
    priorDayKey = spendDeskClosedAsOfKey(deskTz, now);
    try {
      const [year, month, day] = priorDayKey.split("-").map(Number);
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        Number.isFinite(day)
      ) {
        const stamp = new Date(Date.UTC(year, month - 1, day));
        const dayMap = await getSalesFactsByDay(
          shop.id,
          { start: stamp, end: stamp },
          { now },
        );
        if (dayMap.has(priorDayKey)) {
          priorDayOnFile = true;
          priorDaySales = dayMap.get(priorDayKey) ?? null;
        }
      }
    } catch {
      priorDayOnFile = false;
      priorDaySales = null;
    }
  }
  if (useSampleDesk) {
    try {
      const [windowRows, priorRows, historyRows] = await Promise.all([
        loadOrderDepthRows(shop.id, range, orderFactSource),
        loadOrderDepthRows(shop.id, priorOrderRange, orderFactSource),
        loadOrderDepthRows(
          shop.id,
          { start: lookbackStart, end: range.end },
          orderFactSource,
        ),
      ]);
      const toBook = (
        rows: Awaited<ReturnType<typeof loadOrderDepthRows>>,
      ): OverviewOrderBookRow[] =>
        rows.map((row) => ({
          amount: row.amount,
          orderedAt: row.orderedAt,
          customerKey: row.customerKey,
          shopLocalDate: row.shopLocalDate,
        }));
      const windowOrders = toBook(windowRows);
      const priorOrders = toBook(priorRows);
      const historyOrders = toBook(historyRows);
      orderHero = buildOverviewOrderBookHero({
        windowOrders,
        priorOrders,
        firstByCustomer: orderBookFirstOrderMs(historyOrders),
        typicalOrder: metrics.shopifyDepth.medianAov,
      });
      if (
        orderHero.weekendShare == null &&
        metrics.shopifyDepth.weekendSalesShare != null
      ) {
        orderHero = {
          ...orderHero,
          weekendShare: metrics.shopifyDepth.weekendSalesShare,
        };
      }
      const series = orderBookDaySeries(historyOrders);
      if (series.length > 0) orderExplorerDays = series;
    } catch {
      // Keep empty hero — paint —, never invent SalesDayFact as the Overview clock.
    }
  } else {
    const monthFactsLanded =
      (salesFactsCoverageForBanner?.factDays ?? 0) > 0 ||
      sales.orderCount > 0 ||
      sales.totalSales > 0;
    try {
      const snap = monthFactsLanded
        ? await readDeskMetricSnapshot(shop.id)
        : null;
      if (monthFactsLanded) {
        orderHero = {
          sales: sales.totalSales,
          priorSales: snap?.hero?.priorSales ?? null,
          yoyPct: snap?.hero?.yoyPct ?? null,
          zone:
            snap?.hero?.zone && snap.hero.zone !== "empty"
              ? snap.hero.zone
              : "empty",
          returningSales: snap?.hero?.returningSales ?? null,
          typicalOrder: snap?.hero?.typicalOrder ?? null,
          weekendShare: snap?.hero?.weekendShare ?? null,
          orderCount: sales.orderCount,
          empty: false,
        };
      }
    } catch {
      if (monthFactsLanded) {
        orderHero = {
          sales: sales.totalSales,
          priorSales: null,
          yoyPct: null,
          zone: "empty",
          returningSales: null,
          typicalOrder: null,
          weekendShare: null,
          orderCount: sales.orderCount,
          empty: false,
        };
      }
    }
    try {
      const monthRows = await loadOrderDepthRows(
        shop.id,
        range,
        ORDER_FACT_SOURCE,
      );
      if (monthRows.length > 0) {
        const book: OverviewOrderBookRow[] = monthRows.map((row) => ({
          amount: row.amount,
          orderedAt: row.orderedAt,
          customerKey: row.customerKey,
          shopLocalDate: row.shopLocalDate,
        }));
        const returning = orderBookReturningSales(
          book,
          orderBookFirstOrderMs(book),
        );
        const amounts = monthRows
          .map((row) => row.amount)
          .filter((amount) => Number.isFinite(amount))
          .sort((a, b) => a - b);
        const mid = Math.floor(amounts.length / 2);
        const typical =
          amounts.length === 0
            ? null
            : amounts.length % 2 === 1
              ? amounts[mid]!
              : (amounts[mid - 1]! + amounts[mid]!) / 2;
        if (!monthFactsLanded) {
          orderHero = {
            sales: monthRows.reduce(
              (sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0),
              0,
            ),
            priorSales: null,
            yoyPct: null,
            zone: "empty",
            returningSales: returning > 0 ? returning : null,
            typicalOrder: typical,
            weekendShare: null,
            orderCount: monthRows.length,
            empty: false,
          };
        } else {
          orderHero = {
            ...orderHero,
            returningSales:
              returning > 0 ? returning : orderHero.returningSales,
            typicalOrder: typical ?? orderHero.typicalOrder,
          };
        }
      }
    } catch {
      // Month rows are stored. A miss keeps the sales-fact hero.
    }
  }

  const factsPending = overviewShopifyFactsPending({
    useSampleDesk,
    salesError: salesError != null,
    coverage: salesFactsCoverageForBanner,
  });
  const shopifyPeriodClock = buildOverviewShopifyPeriodClock({
    useSampleDesk,
    coverageComplete: salesFactsCoverageForBanner?.complete === true,
    periodExceedsFactWindow:
      salesFactsCoverageForBanner?.periodExceedsFactWindow === true,
    shopifyPeriodTotal:
      useSampleDesk || salesError != null ? null : sales.totalSales,
    periodIncludesToday: periodRangeIncludesShopToday(range, deskTz, now),
    todayShopifyTotalKnown: salesError == null && !todaySalesUnavailable,
    factsPending,
    priorDayKey,
    priorDayOnFile,
    priorDaySales,
  });

  return {
    metrics,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    preset,
    useSampleDesk,
    shotMode,
    cashControl,
    salesFactsCoverage: salesFactsCoverageForBanner,
    orderBackfillProgress,
    shareSubject: `Shopify sales — ${metrics.period.label}`,
    sharePeriodStartDay: shareDayKey(metrics.period.start),
    sharePeriodEndDay: shareDayKey(metrics.period.end),
    shopLabel: session.shop,
    salesDays: [...new Set([...salesByDay.keys(), ...spendByDay.keys()])]
      .sort((a, b) => a.localeCompare(b))
      .map((dateKey) => ({
        dateKey,
        sales: salesByDay.get(dateKey) ?? 0,
        spend: spendByDay.get(dateKey) ?? 0,
      })),
    salesExplorerDays: orderExplorerDays,
    analyticsExplorerDays,
    shopifyPeriodClock,
    mixForecast,
    orderForecast,
    yoyYearWorkspace,
    orderHero,
    orderBookDepth,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Overview locks to Shopify Total Sales — sales basis is Settings-only.
  await requireAdmin(request);
  return null;
};

export default function Dashboard() {
  const currency = useDeskCurrency();
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  useDeskHashScroll();
  useOverviewPanelScroll(searchParams.get("panel"));
  if (!("metrics" in data)) {
    return null;
  }
  const {
    metrics,
    preset,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    useSampleDesk,
    shotMode,
    cashControl = null,
    salesFactsCoverage,
    orderBackfillProgress,
    shareSubject,
    sharePeriodStartDay,
    sharePeriodEndDay,
    shopLabel,
    salesDays = [],
    salesExplorerDays = [],
    analyticsExplorerDays = [],
    shopifyPeriodClock = null,
    mixForecast,
    orderForecast,
    yoyYearWorkspace,
    orderHero,
    orderBookDepth,
  } = data;
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const stage = shotMode
    ? DESK_SECTION.overview
    : deskStageFromHash(location.hash);
  const onHome = isOverviewHomeStage(stage);
  const totalSalesDisplay = metrics.totalSalesAmount ?? metrics.sales;
  const greetingPending = overviewGreetingPending({
    salesPending: metrics.salesPending,
    sales: totalSalesDisplay,
    coverageComplete: salesFactsCoverage?.complete ?? null,
    periodExceedsFactWindow: Boolean(
      salesFactsCoverage?.periodExceedsFactWindow,
    ),
    useSampleDesk,
    orderCount: orderHero?.orderCount ?? metrics.orderCount,
    factDays: salesFactsCoverage?.factDays,
  });
  const orderBackfillResumeLine =
    !useSampleDesk &&
    orderBackfillProgress != null &&
    orderBackfillProgress.remainingDays > 0 &&
    (orderBackfillProgress.truncated ||
      orderBackfillProgress.completeDays < orderBackfillProgress.windowDays)
      ? overviewOrderBackfillLine(orderBackfillProgress.completeDays)
      : null;
  const deeperStillLoading =
    greetingPending || Boolean(orderBackfillResumeLine);
  // Never label mock / blocked sales as live Shopify when sample is off.
  // Shot mode may quiet chrome, but never omit SAMPLE when desk is sample.
  const tillLabel =
    greetingPending &&
    !useSampleDesk &&
    !shotMode &&
    !salesError &&
    !metrics.blockedMockAsLive &&
    metrics.salesSource !== "mock"
      ? `${metrics.period.label}${OVERVIEW_PENDING_ASOF}`
      : deskPeriodTillLabel({
          periodLabel: metrics.period.label,
          useSampleDesk,
          shotMode,
          salesError,
          blockedMockAsLive: metrics.blockedMockAsLive,
          salesSource: metrics.salesSource,
          todaySalesTruncated: !useSampleDesk && todaySalesTruncated,
          todaySalesUnavailable: !useSampleDesk && todaySalesUnavailable,
          shopifyOrderWindowLimited:
            !useSampleDesk &&
            (Boolean(salesFactsCoverage?.periodExceedsFactWindow) ||
              periodMayExceedShopifyOrderWindow(metrics.period)),
          includeShopifyOrderWindow: true,
          orderBookDepth,
        });
  const freshLabel = formatCashFreshnessChip({
    useSampleDesk,
    salesPulledAt: metrics.freshness.salesPulledAt,
    lastAt: metrics.freshness.lastAt,
    source: metrics.freshness.source,
    spendUpdatedAt: metrics.freshness.spendUpdatedAt,
  });
  const marginBlocked = false;
  const spendBlocked =
    !metrics.onboarding.hasSpend && !useSampleDesk && !shotMode;
  const bothBlockedEmpty = marginBlocked && spendBlocked;
  const marginOnlyEmpty = marginBlocked && !spendBlocked;
  const coldEmpty = marginOnlyEmpty || bothBlockedEmpty;
  const scoreboardReady = !marginBlocked && !salesError;

  const deltas = metrics.deltas;
  const priorLabel = deltas?.priorLabel;
  const salesDeltaLine = deltas
    ? formatPctDelta(deltas.salesPct, priorLabel)
    : metrics.orderCount > 0
      ? `${metrics.orderCount.toLocaleString()} orders · AOV ${formatCurrency(metrics.sales / metrics.orderCount, currency)}`
      : `${metrics.orderCount.toLocaleString()} orders`;
  const shopBook = shopifyNativePeriodStats({
    sales: metrics.sales,
    orderCount: metrics.orderCount,
    newCustomers: metrics.newCustomers,
    returningCustomers: metrics.returningCustomers,
    guestOrders: metrics.guestOrders,
    customerMetricsAvailable: metrics.customerMetricsAvailable,
    newCustomerNetSales: metrics.newCustomerNetSales,
    returningCustomerNetSales: metrics.returningCustomerNetSales,
    grossSales: metrics.grossSales,
    grossSalesKnown: metrics.grossSalesKnown,
  });
  const mixView = greetingPending
    ? emptyOverviewMixForecast()
    : (mixForecast ?? emptyOverviewMixForecast());
  const forecastView = greetingPending
    ? {
        ...orderForecast,
        available: false,
        estimate: null,
        typicalDay: null,
        plug: null,
        emptyCopy:
          "Orders still syncing — not $0. Next month fills after 8 days with sales.",
      }
    : orderForecast;
  const mixRead = overviewMixForecastRead(mixView);
  const ltvPeek = pickShareableLtvPeek({
    revenue30: metrics.tillLtv.avgRevenueD30,
    revenue90: metrics.tillLtv.avgRevenueD90,
    revenue365: metrics.tillLtv.avgRevenueD365,
    historyLimited: Boolean(
      !useSampleDesk &&
        (orderBackfillProgress?.historyLimited || metrics.tillLtv.historyLimited),
    ),
  });
  const insightView = greetingPending
    ? emptyShareableInsights()
    : buildShareableInsights(
        {
          salesPending: greetingPending,
          orderCount: metrics.orderCount,
          returningSales: shopBook.returningSales,
          returningShare: shopBook.returningSalesShare,
          newSales: shopBook.newSales,
          typicalOrder: metrics.shopifyDepth.medianAov,
          daysToSecond: metrics.shopifyDepth.medianDaysToSecond,
          ltvPeek: ltvPeek?.amount ?? null,
          ltvPeekDays: ltvPeek?.days ?? null,
          historyLimited: Boolean(
            !useSampleDesk &&
              (orderBackfillProgress?.historyLimited ||
                metrics.tillLtv.historyLimited),
          ),
          shopLabel,
          sample: useSampleDesk,
          periodLabel: metrics.period.label,
        },
        (n) => formatCurrency(n, currency),
      );
  const shareText = formatOverviewShareText({
    periodLabel: metrics.period.label,
    periodStartDay: sharePeriodStartDay,
    periodEndDay: sharePeriodEndDay,
    totalSales: totalSalesDisplay,
    totalSpend: 0,
    mer: null,
    breakEvenMer: null,
    marginPct: null,
    salesPending: greetingPending,
    shopLabel,
    salesDeltaLine,
    typicalOrder: metrics.shopifyDepth.medianAov,
    returningSalesShare: shopBook.returningSalesShare,
    weekendSalesShare: metrics.shopifyDepth.weekendSalesShare,
  });

  const salesFactsIncomplete =
    !useSampleDesk &&
    salesFactsCoverage != null &&
    !salesFactsCoverage.complete &&
    !salesFactsCoverage.periodExceedsFactWindow &&
    salesFactsCoverage.expectedClosedDays > 0
      ? {
          factDays: salesFactsCoverage.factDays,
          expectedClosedDays: salesFactsCoverage.expectedClosedDays,
        }
      : null;
  const orderProgressInput =
    !useSampleDesk && orderBackfillProgress
      ? {
          completeDays: orderBackfillProgress.completeDays,
          windowDays: orderBackfillProgress.windowDays,
          remainingDays: orderBackfillProgress.remainingDays,
        }
      : null;
  const syncNeedsTop =
    greetingPending ||
    salesFactsIncomplete != null ||
    Boolean(orderProgressInput && orderProgressInput.remainingDays > 0) ||
    Boolean(orderBackfillProgress?.truncated);
  const closedDaysOnFile = useSampleDesk
    ? 1
    : Math.max(
        salesFactsCoverage?.factDays ?? 0,
        orderBackfillProgress?.completeDays ?? 0,
      );
  const showOverviewChartBeat =
    useSampleDesk || (closedDaysOnFile >= 1 && !greetingPending);

  const trustBanners = (
    <CashTrustBanners
      singlePendingSurface
      blockedMockAsLive={Boolean(metrics.blockedMockAsLive)}
      spendCoverage={null}
      periodLabel={metrics.period.label}
      shopifyOrderWindowLimited={
        !useSampleDesk &&
        (Boolean(salesFactsCoverage?.periodExceedsFactWindow) ||
          periodMayExceedShopifyOrderWindow(metrics.period))
      }
      salesFactsIncomplete={salesFactsIncomplete}
      hasSpend={Boolean(metrics.onboarding.hasSpend)}
      orderBackfillProgress={orderProgressInput}
      todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
      todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}
      orderFactsTruncated={
        !useSampleDesk && Boolean(orderBackfillProgress?.truncated)
      }
      shotMode={shotMode}
      cashActionReady={metrics.cashActionReady}
      spendRecon={null}
      belowBreakEven={null}
      marginStale={!useSampleDesk && Boolean(metrics.marginStale)}
      onboarding={null}
    />
  );

  const shareButton =
    !shotMode && scoreboardReady ? (
      <ShareOverviewButton
        subject={shareSubject}
        body={shareText}
        enabled={scoreboardReady}
        compact
      />
    ) : null;

  const shopBrand = shopLabel.replace(/\.myshopify\.com$/i, "");
  const ordersHref = deskNavHrefFromSearch("/app/orders", searchParams);
  const yoyHref = deskNavHref("/app", {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
    extra: { panel: OVERVIEW_YOY_YEAR_PANEL },
    hash: OVERVIEW_YOY_YEAR_ID,
  });
  const customersHref = deskNavHrefFromSearch("/app/customers", searchParams);
  const goalsHref = deskNavHrefFromSearch("/app/goals", searchParams);
  const customersGrowthHref = deskNavHref("/app/customers", {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
    extra: { panel: "growth" },
  });
  const customersLtvHref = deskNavHref("/app/customers", {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
    extra: { panel: "ltv" },
  });
  const onYoyYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (shotMode) params.set("shot", "1");
    setSearchParams(params);
  };
  const showLiveHandoff =
    !useSampleDesk && !shotMode && isLiveHandoffGuide(searchParams.get("guide"));

  return (
    <s-page heading={deskStageHeading(stage)} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          scoreboardReady && !useSampleDesk && !spendBlocked
            ? "mcfly-desk--live-ready"
            : null,
          coldEmpty ? "mcfly-desk--cold-empty" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* SAMPLE chrome only when ON — never competes with live KPI story. */}
        {useSampleDesk && !shotMode ? <SampleDeskBanner /> : null}

        {showLiveHandoff ? (
          <s-banner tone="info" heading={LIVE_HANDOFF_HEADING}>
            <s-paragraph>{OVERVIEW_LIVE_HANDOFF_BODY}</s-paragraph>
          </s-banner>
        ) : null}

        {/* Pending / incomplete sync stays above the glance so whales see progress. */}
        {syncNeedsTop || coldEmpty || (!scoreboardReady && !useSampleDesk)
          ? trustBanners
          : null}

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading mcfly-state--soft" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing sales…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical mcfly-state--soft"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load. Retry to see this shop’s orders.
            </p>
            <div className="mcfly-state__cta">
              <s-button href={`/app?period=${preset}`} variant="primary">
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">{shopBrand}</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-trust" aria-label="Trust and freshness">
            {useSampleDesk ? (
              <span className="mcfly-trust__chip mcfly-trust__chip--sample">
                SAMPLE
              </span>
            ) : null}
            <span className="mcfly-trust__chip">{freshLabel}</span>
            {shareButton}
          </div>
        </div>

        {!marginBlocked ? (
          <>
            {scoreboardReady && onHome ? (
              <div
                className="mcfly-desk-anchor mcfly-scoreboard--overview"
                id={DESK_SECTION.overview}
              >
                <DeskLane rank="first" label={OVERVIEW_FIRST_LANE_LABEL} hint="">
                  <div className="mcfly-overview-first-beat">
                  <OverviewFirstViewport
                    orderCount={orderHero.orderCount}
                    typicalOrder={orderHero.typicalOrder}
                    meanAov={
                      orderHero.orderCount > 0 && orderHero.sales != null
                        ? orderHero.sales / orderHero.orderCount
                        : null
                    }
                    typicalDay={metrics.shopifyDepth.medianDailySales}
                    returningSalesShare={
                      orderHero.sales != null &&
                      orderHero.sales > 0 &&
                      orderHero.returningSales != null
                        ? orderHero.returningSales / orderHero.sales
                        : shopBook.returningSalesShare
                    }
                    returningSales={orderHero.returningSales}
                    newSales={shopBook.newSales}
                    mixGreeting={mixRead?.line}
                    medianDaysToSecond={metrics.shopifyDepth.medianDaysToSecond}
                    weekendSalesShare={orderHero.weekendShare}
                    peakWeekday={metrics.shopifyDepth.peakWeekday}
                    weekdaySalesShare={metrics.shopifyDepth.weekdaySalesShare}
                    windowSales={orderHero.sales}
                    ltvPeek={ltvPeek?.amount ?? null}
                    ltvPeekDays={ltvPeek?.days ?? null}
                    ltvHistoryLimited={Boolean(
                      !useSampleDesk &&
                        (orderBackfillProgress?.historyLimited ||
                          metrics.tillLtv.historyLimited),
                    )}
                    monthClose={mixView.forecast?.projected ?? null}
                    monthCloseRemainingDays={
                      mixView.forecast?.remainingDays ?? null
                    }
                    monthCloseClosed={mixView.forecast?.closed ?? false}
                    salesPending={greetingPending}
                    ordersHref={ordersHref}
                    useSampleDesk={useSampleDesk}
                    orderHero={orderHero}
                    periodLabel={
                      metrics.period.label === "Month to date"
                        ? "This month"
                        : metrics.period.label
                    }
                    orderBookDepth={orderBookDepth}
                    orderBackfillLine={orderBackfillResumeLine}
                    hideInlinePending={syncNeedsTop}
                  />
                  {shopifyPeriodClock ? (
                    <OverviewLivePeriodClock
                      clock={shopifyPeriodClock}
                      periodLabel={
                        metrics.period.label === "Month to date"
                          ? "This month"
                          : metrics.period.label
                      }
                    />
                  ) : null}
                  {showOverviewChartBeat ? (
                    <OverviewYoyCards
                      cards={buildOverviewYoyCards(cashControl?.chips ?? [])}
                      salesPending={deeperStillLoading}
                      yoyHref={yoyHref}
                    />
                  ) : null}
                  </div>
                  {showOverviewChartBeat ? (
                    <div
                      className="mcfly-desk-anchor mcfly-overview-chart-beat"
                      id={DESK_SECTION.chart}
                    >
                      <OverviewSalesChart
                        days={
                          salesExplorerDays.length >= 2
                            ? salesExplorerDays.map(({ dateKey, sales, orders }) => ({
                                dateKey,
                                sales,
                                orders,
                              }))
                            : salesDays.map(({ dateKey, sales }) => ({ dateKey, sales }))
                        }
                        ordersHref={ordersHref}
                        salesPending={greetingPending}
                        typicalDay={metrics.shopifyDepth.medianDailySales}
                        shopifyTotalsLive={deskAnalyticsDayTotalsLive(useSampleDesk)}
                        shopifyDayTotals={
                          deskAnalyticsDayTotalsLive(useSampleDesk)
                            ? analyticsExplorerDays
                            : null
                        }
                        shopifyTotalsPending={overviewShopifyFactsPending({
                          useSampleDesk,
                          salesError: salesError != null,
                          coverage: salesFactsCoverage,
                        })}
                      />
                    </div>
                  ) : null}
                </DeskLane>
                <DeskLane
                  rank="more"
                  label="Mix and month close"
                  fold
                  defaultOpen={shotMode}
                >
                  <div className="mcfly-desk-anchor" id={OVERVIEW_MIX_CLOSE_ID}>
                  <OverviewMixForecast
                    view={mixView}
                    customersHref={customersHref}
                  />
                  <OrderHistoryForecast
                    view={forecastView}
                    variant="overview"
                    goalsHref={goalsHref}
                  />
                  <ShareableInsightCards view={insightView} shotMode={shotMode} />
                  </div>
                </DeskLane>
                <DeskLane
                  rank="more"
                  label="More order detail"
                  fold
                  defaultOpen={shotMode}
                >
                  <OverviewDepthPeeks
                    orderCount={orderHero.orderCount}
                    typicalOrder={orderHero.typicalOrder}
                    meanAov={
                      orderHero.orderCount > 0 && orderHero.sales != null
                        ? orderHero.sales / orderHero.orderCount
                        : null
                    }
                    typicalDay={metrics.shopifyDepth.medianDailySales}
                    returningSalesShare={
                      orderHero.sales != null &&
                      orderHero.sales > 0 &&
                      orderHero.returningSales != null
                        ? orderHero.returningSales / orderHero.sales
                        : shopBook.returningSalesShare
                    }
                    returningSales={orderHero.returningSales}
                    weekendSalesShare={orderHero.weekendShare}
                    peakWeekday={metrics.shopifyDepth.peakWeekday}
                    weekdaySalesShare={metrics.shopifyDepth.weekdaySalesShare}
                    windowSales={orderHero.sales}
                    salesPending={greetingPending}
                    ordersHref={ordersHref}
                    useSampleDesk={useSampleDesk}
                    orderHero={orderHero}
                  />
                  <WeekdaySalesChart
                    shares={metrics.shopifyDepth.weekdaySalesShare}
                    windowSales={orderHero.sales ?? metrics.sales}
                    peakWeekday={metrics.shopifyDepth.peakWeekday}
                  />
                </DeskLane>
                <DeskLane rank="more" label="Year board vs last year">
                  <OverviewYoyYearSection
                    {...yoyYearWorkspace}
                    salesPending={deeperStillLoading}
                    onYearChange={onYoyYearChange}
                  />
                </DeskLane>
                {!greetingPending ? (
                  <footer className="mcfly-book__links">
                    <s-link href={customersHref}>
                      {PRODUCT_NOUN.buyersTitle}
                    </s-link>
                    <s-link href={customersGrowthHref}>
                      {PRODUCT_NOUN.growthTitle}
                    </s-link>
                    <s-link href={ordersHref}>
                      {PRODUCT_NOUN.ordersTitle}
                    </s-link>
                    <s-link href={customersLtvHref}>
                      {PRODUCT_NOUN.openLtv}
                    </s-link>
                  </footer>
                ) : null}
              </div>
            ) : null}

            {!syncNeedsTop && !coldEmpty && onHome ? trustBanners : null}
          </>
        ) : null}
      </div>
    </s-page>
  );
}


export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
