import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useLocation, useSearchParams, redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { PUBLIC_APP_STUB, isGoneResponse, requireAdmin } from "../lib/public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "../lib/first-session-shopify-window.server";
import {
  namedDeskScreenFromPath,
  namedDeskTitle,
} from "../lib/desk-request-screen";
import { deskPageShouldRevalidate } from "../lib/desk-tab-flow";
import {
  hasShopifySessionContext,
  isEmbeddedAdminRequest,
} from "../../scripts/shopify-app-path.mjs";
import { ReconciliationDesk } from "../components/ReconciliationDesk";
import { liveDeskSurfaceOpen } from "../lib/live-desk-surface";
import { resolveLiveUnparkStage } from "../lib/live-unpark";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { readReconciliationWindows } from "../lib/reconciliation-read.server";
import { EnterpriseScoreboard } from "../components/EnterpriseScoreboard";
import { OverviewYoyCards } from "../components/OverviewYoyCards";
import { OverviewDepthPeeks } from "../components/OverviewFirstViewport";
import { OrderHistoryForecast } from "../components/OrderHistoryForecast";
import { OverviewMixForecast } from "../components/OverviewMixForecast";
import {
  OverviewYoyYearSection,
  buildOverviewYoyYearModel,
  useOverviewPanelScroll,
} from "../components/OverviewYoyYearSection";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import { WeekdaySalesChart } from "../components/WeekdaySalesChart";
import { DeskLane } from "../components/DeskLane";
import { useDeskHashScroll } from "../components/useDeskHashScroll";
import {
  buildDailyRowsForWindow,
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { buildCashControlBoard, certifyDailyRows } from "../lib/mer-control";
import { buildOverviewYoyCards } from "../lib/overview-yoy";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  DESK_SECTION,
  deskNavHref,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isOverviewHomeStage,
  isOverviewToolStage,
  overviewToolFromPanel,
} from "../lib/desk-nav";
import { isDeskPeriodChip, type DeskPeriodChip } from "../lib/book-window";
import {
  LIVE_SALES_ERROR,
  ordersResumeLine,
} from "../lib/merchant-book-progress";
import { shopLiveIngestDepth } from "../lib/live-ingest-depth.server";
import {
  OVERVIEW_FIRST_LANE_LABEL,
  OVERVIEW_MIX_CLOSE_ID,
  OVERVIEW_YOY_YEAR_ID,
  OVERVIEW_YOY_YEAR_PANEL,
  overviewGreetingPending,
} from "../lib/overview-first-viewport";
import {
  buildOrderHistoryForecast,
  emptyForecastTargets,
} from "../lib/order-history-forecast";
import {
  buildOverviewMixForecast,
  emptyOverviewMixForecast,
  overviewHistoryDays,
  overviewMonthClock,
  overviewMtdFromDays,
} from "../lib/overview-mix-forecast";
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
import { readDeskMetricWindows } from "../lib/desk-metric-snapshot.server";
import {
  orderWindowsFromBook,
  orderWindowsFromStoredHeroes,
  selectStoredDeskWindow,
} from "../lib/desk-stored-windows";
import {
  buildOverviewOrderBookHero,
  orderBookDaySeries,
  orderBookFirstOrderMs,
  shiftRangeOneYear,
  type OverviewOrderBookHero,
  type OverviewOrderBookRow,
} from "../lib/overview-order-book";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  resolvePeriod,
  resolvePriorPeriod,
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
import { parseYoyYear } from "../lib/yoy-workspace";

export const shouldRevalidate = deskPageShouldRevalidate;

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
    throw redirect(`${url.pathname}?${next.toString()}`);
  }
  const preset = requested;
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const salesBasis = "total" as const;
  const ianaTimezone = shop.ianaTimezone;
  const now = new Date();
  const reconciliationPromise = readReconciliationWindows({
    admin,
    timeZone: ianaTimezone,
    currency: shop.currencyCode,
  });
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
    try {
      mainCoverage = await getSalesFactsCoverage(shop.id, range, now, ianaTimezone);
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
    periodPreset: preset,
  });

  const ymd = deskTz
    ? shopLocalYmd(now, deskTz)
    : {
        y: now.getFullYear(),
        m: now.getMonth() + 1,
        d: now.getDate(),
      };
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
    monthDailySales: explorerDays
      .filter((day) => day.dateKey.startsWith(monthPrefix))
      .map((day) => day.sales),
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
  let orderWindows: Partial<Record<DeskPeriodChip, OverviewOrderBookHero>> | null =
    null;
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
      if (historyOrders.length > 0) {
        orderWindows = orderWindowsFromBook({
          orders: historyOrders,
          now,
          timeZone: deskTz ?? "UTC",
          thisMonth: preset === "mtd" ? orderHero : null,
        });
      }
      if (isDeskPeriodChip(preset)) {
        orderWindows = { ...(orderWindows ?? {}), [preset]: orderHero };
      }
    } catch {
      // Keep empty hero — paint —, never invent SalesDayFact as the Overview clock.
    }
  } else {
    // LIVE_PERIOD_WINDOW — five stored chips. Sales stay on day rows.
    // A period click selects one window in memory. It does not scan order rows
    // and it does not call Shopify for them.
    const monthFactsLanded =
      (salesFactsCoverageForBanner?.factDays ?? 0) > 0 ||
      sales.orderCount > 0 ||
      sales.totalSales > 0;
    try {
      const stored = await readDeskMetricWindows(shop.id);
      orderWindows = stored
        ? orderWindowsFromStoredHeroes(stored.windows, stored.legacyHero)
        : null;
      const chip = isDeskPeriodChip(preset) ? preset : "mtd";
      const snapHero = orderWindows?.[chip] ?? null;
      if (monthFactsLanded || (snapHero && !snapHero.empty)) {
        orderHero = {
          sales: monthFactsLanded ? sales.totalSales : (snapHero?.sales ?? null),
          priorSales: snapHero?.priorSales ?? null,
          yoyPct: snapHero?.yoyPct ?? null,
          zone:
            snapHero?.zone && snapHero.zone !== "empty" ? snapHero.zone : "empty",
          returningSales: snapHero?.returningSales ?? null,
          typicalOrder: snapHero?.typicalOrder ?? null,
          weekendShare: snapHero?.weekendShare ?? null,
          orderCount: monthFactsLanded
            ? sales.orderCount
            : (snapHero?.orderCount ?? 0),
          empty: !monthFactsLanded && (snapHero?.empty ?? true),
        };
      }
      if (isDeskPeriodChip(preset)) {
        orderWindows = { ...(orderWindows ?? {}), [preset]: orderHero };
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
        if (isDeskPeriodChip(preset)) {
          orderWindows = { [preset]: orderHero };
        }
      }
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

  const reconciliation = await reconciliationPromise;

  return {
    reconciliation,
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
    // Sales days only. A spend day with no sales fact must not paint as $0.
    salesDays: [...salesByDay.keys()]
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
    orderWindows,
    orderBookDepth,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Overview locks to Shopify Total Sales — sales basis is Settings-only.
  await requireAdmin(request);
  return null;
};

export default function Dashboard() {
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
    useSampleDesk,
    shotMode,
    cashControl = null,
    salesFactsCoverage,
    orderBackfillProgress,
    salesDays = [],
    salesExplorerDays = [],
    analyticsExplorerDays = [],
    mixForecast,
    orderForecast,
    yoyYearWorkspace,
    orderHero,
    orderWindows = null,
    orderBookDepth,
    reconciliation,
    shopLabel,
  } = data;
  const requestScreen = shotMode
    ? null
    : namedDeskScreenFromPath(location.pathname);
  const hashStage = shotMode
    ? DESK_SECTION.overview
    : deskStageFromHash(location.hash);
  const panelTool = shotMode
    ? null
    : overviewToolFromPanel(searchParams.get("panel"));
  const toolStage =
    requestScreen == null && panelTool == null && isOverviewToolStage(hashStage)
      ? hashStage
      : panelTool;
  const onHome =
    requestScreen == null && toolStage == null && isOverviewHomeStage(hashStage);
  const pageHeading =
    requestScreen === "year-over-year" || requestScreen === "month-close"
      ? namedDeskTitle(requestScreen)
      : deskStageHeading(toolStage ?? hashStage);
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
    !useSampleDesk && orderBackfillProgress
      ? ordersResumeLine({
          completeDays: orderBackfillProgress.completeDays,
          windowDays: orderBackfillProgress.windowDays,
          remainingDays: orderBackfillProgress.remainingDays,
          monthsFinished: orderBackfillProgress.monthsFinished,
          bookSealed: orderBackfillProgress.bookSealed,
          historyLimited: orderBackfillProgress.historyLimited,
        })
      : null;
  const deeperStillLoading = greetingPending;
  const marginBlocked = false;
  const spendBlocked =
    !metrics.onboarding.hasSpend && !useSampleDesk && !shotMode;
  const bothBlockedEmpty = marginBlocked && spendBlocked;
  const marginOnlyEmpty = marginBlocked && !spendBlocked;
  const coldEmpty = marginOnlyEmpty || bothBlockedEmpty;
  const scoreboardReady = !marginBlocked && !salesError;

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
  const picked = selectStoredDeskWindow({
    windows: orderWindows,
    period: searchParams.get("period"),
    loadedPreset: preset,
    fallback: orderHero,
  });
  let hero = picked.hero;
  if (picked.chip === (isDeskPeriodChip(preset) ? preset : "mtd")) {
    if (shopBook.returningSales != null && shopBook.returningSales > 0) {
      hero = { ...hero, returningSales: shopBook.returningSales };
    }
    if (
      metrics.shopifyDepth.medianAov != null &&
      Number.isFinite(metrics.shopifyDepth.medianAov) &&
      metrics.shopifyDepth.medianAov > 0
    ) {
      hero = {
        ...hero,
        typicalOrder: metrics.shopifyDepth.medianAov,
      };
    }
  }
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
  const closedDaysOnFile = useSampleDesk
    ? 1
    : Math.max(
        salesFactsCoverage?.factDays ?? 0,
        orderBackfillProgress?.completeDays ?? 0,
      );
  const showOverviewChartBeat =
    useSampleDesk || (closedDaysOnFile >= 1 && !greetingPending);

  const ordersHref = deskNavHrefFromSearch("/app/orders", searchParams);
  const yoyHref = deskNavHref("/app/yoy", {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
  });
  const customersHref = deskNavHrefFromSearch("/app/customers", searchParams);
  const goalsHref = deskNavHrefFromSearch("/app/goals", searchParams);
  const customersGrowthHref = deskNavHref("/app/growth", {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
  });
  const customersLtvHref = deskNavHref("/app/ltv", {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
  });
  const onYoyYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (shotMode) params.set("shot", "1");
    setSearchParams(params);
  };
  const olderMonthsLoading = Boolean(orderBackfillResumeLine);

  return (
    <s-page heading={onHome && !shotMode ? undefined : pageHeading} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          scoreboardReady && !useSampleDesk && !spendBlocked
            ? "mcfly-desk--live-ready"
            : null,
          coldEmpty ? "mcfly-desk--cold-empty" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* SAMPLE chip lives on the shell header. */}
        {onHome && reconciliation ? (
          <ReconciliationDesk
            data={reconciliation}
            shopName={shopLabel}
            live={!useSampleDesk}
            spendEntered={!useSampleDesk && metrics.onboarding.hasSpend}
            spendPartial={
              !useSampleDesk &&
              metrics.onboarding.hasSpend &&
              metrics.spendCoverage.incomplete
            }
            totalRoas={
              !useSampleDesk &&
              metrics.onboarding.hasSpend &&
              !metrics.salesPending &&
              metrics.mer != null &&
              Number.isFinite(metrics.mer)
                ? metrics.mer
                : null
            }
            customerLtvAvailable={
              useSampleDesk
                ? true
                : metrics.customerMetricsAvailable &&
                  liveDeskSurfaceOpen({
                    sampleDesk: false,
                    stage: resolveLiveUnparkStage(),
                    surface: "ltv",
                  })
            }
            priorYearLoaded={
              useSampleDesk
                ? null
                : orderHero != null &&
                  orderHero.priorSales != null &&
                  Number.isFinite(orderHero.priorSales)
            }
            trialEndsAt={null}
          />
        ) : null}

        {useSampleDesk && !shotMode ? <SampleDeskBanner /> : null}

        {!marginBlocked ? (
          <>
            {scoreboardReady && onHome ? (
              <div
                className="mcfly-desk-anchor mcfly-scoreboard--overview"
                id={DESK_SECTION.overview}
              >
                <DeskLane rank="first" label={OVERVIEW_FIRST_LANE_LABEL} hint="">
                  <div className="mcfly-overview-first-beat">
                  <EnterpriseScoreboard
                    hero={hero}
                    olderMonthsLoading={olderMonthsLoading}
                    salesError={Boolean(salesError) && !shotMode}
                    errorLine={LIVE_SALES_ERROR}
                    retryHref={`/app?period=${picked.chip}`}
                  />
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
                        typicalDay={mixView.forecast?.typicalDay ?? null}
                        typicalDayWindow={mixView.typicalDayWindow}
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
                  </div>
                </DeskLane>
                <DeskLane
                  rank="more"
                  label="More order detail"
                  fold
                  defaultOpen={shotMode}
                >
                  <OverviewDepthPeeks
                    orderBookDepth={orderBookDepth}
                    orderCount={hero.orderCount}
                    typicalOrder={hero.typicalOrder}
                    meanAov={
                      hero.orderCount > 0 && hero.sales != null
                        ? hero.sales / hero.orderCount
                        : null
                    }
                    typicalDay={metrics.shopifyDepth.medianDailySales}
                    returningSalesShare={
                      hero.sales != null &&
                      hero.sales > 0 &&
                      hero.returningSales != null
                        ? hero.returningSales / hero.sales
                        : shopBook.returningSalesShare
                    }
                    returningSales={hero.returningSales}
                    weekendSalesShare={hero.weekendShare}
                    peakWeekday={metrics.shopifyDepth.peakWeekday}
                    weekdaySalesShare={metrics.shopifyDepth.weekdaySalesShare}
                    windowSales={hero.sales}
                    salesPending={greetingPending}
                    ordersHref={ordersHref}
                    useSampleDesk={useSampleDesk}
                    orderHero={hero}
                  />
                  <WeekdaySalesChart
                    shares={metrics.shopifyDepth.weekdaySalesShare}
                    windowSales={hero.sales ?? metrics.sales}
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

            {scoreboardReady && requestScreen === "year-over-year" ? (
              <section id={OVERVIEW_YOY_YEAR_ID} data-panel={OVERVIEW_YOY_YEAR_PANEL} aria-label="Year over year">
                <OverviewYoyYearSection
                  {...yoyYearWorkspace}
                  salesPending={greetingPending}
                  onYearChange={onYoyYearChange}
                />
              </section>
            ) : null}
            {scoreboardReady && requestScreen === "month-close" ? (
              <section id={OVERVIEW_MIX_CLOSE_ID} aria-label="Month close">
                <OverviewMixForecast
                  view={mixView}
                  customersHref={customersHref}
                />
              </section>
            ) : null}
            {scoreboardReady && toolStage === DESK_SECTION.compare ? (
              <section id={DESK_SECTION.compare} aria-label="Compare">
                <OverviewYoyCards
                  cards={buildOverviewYoyCards(cashControl?.chips ?? [])}
                  salesPending={deeperStillLoading}
                  yoyHref={yoyHref}
                />
                <OverviewYoyYearSection
                  {...yoyYearWorkspace}
                  salesPending={deeperStillLoading}
                  onYearChange={onYoyYearChange}
                />
              </section>
            ) : null}
            {scoreboardReady && toolStage === DESK_SECTION.ledger ? (
              <section id={DESK_SECTION.ledger} aria-label="Ledger">
                <OverviewSalesChart
                  caption="Ledger"
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
                  typicalDay={mixView.forecast?.typicalDay ?? null}
                  typicalDayWindow={mixView.typicalDayWindow}
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
              </section>
            ) : null}
            {scoreboardReady && toolStage === DESK_SECTION.mix ? (
              <section id={DESK_SECTION.mix} aria-label="Mix">
                <OverviewMixForecast
                  view={mixView}
                  customersHref={customersHref}
                />
              </section>
            ) : null}
            {scoreboardReady && toolStage === DESK_SECTION.plan ? (
              <section id={DESK_SECTION.plan} aria-label="Plan">
                <OrderHistoryForecast
                  view={forecastView}
                  variant="overview"
                  goalsHref={goalsHref}
                />
              </section>
            ) : null}

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
