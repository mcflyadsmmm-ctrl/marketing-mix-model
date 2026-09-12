import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useLoaderData,
  useNavigation,
  redirect,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import { authenticate } from "../shopify.server";
import { AcquisitionGlance } from "../components/AcquisitionGlance";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "../components/SpendExplorer";
import {
  buildDashboardMetrics,
  buildSpendExplorerSeries,
  ensureShop,
  getOrCreateSettings,
  marginIsConfirmed,
} from "../lib/mer-dashboard.server";
import { FirstSessionGuide } from "../components/FirstSessionGuide";
import { OrderEconomicsPanel } from "../components/OrderEconomicsPanel";
import { OpsDeskIsland } from "../components/OpsDeskIsland";
import { ScoreboardHero } from "../components/ScoreboardHero";
import { SalesMixPanel } from "../components/SalesMixPanel";
import { DayQualityTablePanel } from "../components/DayQualityTable";
import { PeriodPaceStrip } from "../components/PeriodPaceStrip";
import { buildDayQuality, summarizeDayQuality } from "../lib/day-quality";
import { buildDailyRowsForWindow } from "../lib/mer-dashboard.server";
import {
  firstSessionPrimaryAction,
  resolveFirstSessionPath,
} from "../lib/first-session-path";
import { resolveOrderEconomics } from "../lib/order-economics";
import { buildOpsDeskIsland } from "../lib/ops-desk-island";
import { buildScoreboardHero } from "../lib/scoreboard-hero";
import { buildSalesMix } from "../lib/sales-mix";
import {
  firstOpenRedirect,
  isTrustedMer,
} from "../lib/install-stickiness";
import { DeepHistoryBanner } from "../components/DeepHistoryBanner";
import { SalesDayAccuracyStrip } from "../components/SalesDayAccuracyStrip";
import {
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
import { loadSalesDayAccuracy } from "../lib/sales-day-accuracy.server";
import prisma from "../db.server";
import { channelFillKey } from "../lib/channel-fill";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import {
  formatMedianDays,
  formatSecondOrderRate,
} from "../lib/cohort-buyer-metrics";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import {
  formatListingTillLabel,
  listingCaptureFromRequest,
} from "../lib/listing-capture";
import {
  formatOverviewShareSubject,
  formatOverviewShareText,
} from "../lib/cash-close";
import { ShareOverviewButton } from "../components/ShareOverviewButton";
import { TotalRoasGauge } from "../components/TotalRoasGauge";
import { resolvePeriodTrust } from "../lib/period-trust";
import {
  emptySales,
  type SalesResult,
} from "../lib/shopify-sales.server";
import {
  runSalesFactsBackfill,
  getSalesFactsCoverage,
  getSalesFactsTotals,
  getSalesFactsByDay,
  getSalesFactRowsByDay,
  loadDeskSalesForPeriod,
} from "../lib/sales-facts.server";
import {
  salesFactsIncompleteForDesk,
  salesFactsNeedRefreshExisting,
  salesFactsNeedSyncFill,
  type SalesFactsCoverage,
} from "../lib/sales-facts-honesty";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import {
  FIRST_PAINT_SALES_BACKFILL_DAYS,
  enqueueSalesFactsBackfill,
} from "../lib/sales-backfill-kick.server";
import { resolveTrustedRoasHero } from "../lib/trusted-roas-hero";
import {
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
  resolvePriorPeriod,
  type PeriodPreset,
} from "../lib/periods";
import { resolvePeriodLedgerControl } from "../lib/period-ledger";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  fetchSampleSalesRowsByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { shopLocalDayKey } from "../lib/shop-local-day";
import {
  dateKeyFromLocal,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
} from "../lib/spend-explorer";

function channelDisplayLabel(channel: string): string {
  return SPEND_CHANNEL_LABELS[channel as SpendChannel] ?? channel;
}

/** Compact prior-period label for KPI deltas. */
function deltaVsLabel(priorLabel: string | undefined): string {
  if (!priorLabel) return "prior";
  const label = priorLabel.trim();
  if (/^prior ytd$/i.test(label)) return "YoY";
  if (label.length > 32) return `${label.slice(0, 29)}…`;
  return label;
}

function formatPctDelta(pct: number | null, priorLabel?: string): string {
  const vs = deltaVsLabel(priorLabel);
  if (pct == null) return vs === "YoY" ? "YoY —" : `vs ${vs} —`;
  const sign = pct > 0 ? "+" : "";
  if (vs === "YoY") return `${sign}${pct.toFixed(0)}% YoY`;
  return `${sign}${pct.toFixed(0)}% vs ${vs}`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.toString();
  throw redirect(q ? `/app/sales?${q}` : "/app/sales");

  const { admin, session } = await authenticate.admin(request);
  const shotMode = listingCaptureFromRequest(request);
  const rawPeriod = url.searchParams.get("period");
  const preset = parsePeriodPreset(rawPeriod);
  // y3 stays shot-only (listing captures). L12M is a desk preset — do not redirect.
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app?${next.toString()}`);
  }
  // Desk default: short window (14d) when explorer range unset.
  const exRange = parseExplorerRange(url.searchParams.get("exRange") || "14d");
  const exGran = parseExplorerGranularity(url.searchParams.get("exGran"));
  const exMode = parseExplorerMode(url.searchParams.get("exMode"));
  const exSales = parseExplorerShowSales(url.searchParams.get("exSales"));
  const exFrom = parseExplorerDateParam(url.searchParams.get("exFrom"));
  const exTo = parseExplorerDateParam(url.searchParams.get("exTo"));
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const [liveSpendCount, useSampleDesk] = await Promise.all([
    prisma.spendEntry.count({
      where: { shopId: shop.id, NOT: { source: "sample" } },
    }),
    getSampleDeskEnabled(shop.id),
  ]);
  const hasLiveSpend = liveSpendCount > 0;
  const activateBounce = firstOpenRedirect({
    pathname: "/app",
    search: url.search,
    marginConfirmed: marginIsConfirmed(settings),
    hasLiveSpend,
    useSampleDesk,
    shotMode,
  });
  if (activateBounce) {
    throw redirect(activateBounce);
  }
  // Overview locks to Shopify Total Sales (after returns) — no Net toggle on this desk.
  const salesBasis = "total" as const;
  const ianaTimezone = shop.ianaTimezone;
  const now = new Date();
  // Shop-local calendar when IANA is known; otherwise legacy server-local edges.
  const range = resolvePeriod(preset, now, ianaTimezone);
  const priorRange = resolvePriorPeriod(preset, now, ianaTimezone);

  let sales: SalesResult = emptySales("shopify");
  /** Null when prior facts are outside the window / failed — skip deltas (never fake 0). */
  let priorSales: { totalSales: number } | null = null;
  let salesError: string | null = null;
  let todaySalesUnavailable = false;
  let todaySalesTruncated = false;
  let salesByDay = new Map<string, number>();
  /** Period-scoped day sales for order economics — never the explorer window alone. */
  let periodSalesByDay = new Map<string, number>();
  let explorerCustomers = {
    newCustomers: 0,
    returningCustomers: 0,
    customerMetricsAvailable: false,
  };
  let salesFactsCoverageForBanner: SalesFactsCoverage | null = null;
  /** Facts said $0 and live Admin probe failed — never a trusted 0.00. */
  let salesUntrustedZero = false;
  let usedLivePeriodProbe = false;
  let liveConfirmedZero = false;
  let shopOrdersSeen = 0;
  /** Stamp only after a successful desk load — never before. */
  let salesPulledAt: string | null = null;

  const explorerWindow = resolveExplorerWindow(exRange, now, {
    from: exFrom,
    to: exTo,
    // SAMPLE stamps UTC calendar days — don't shift explorer edges to shop-local.
    timeZone: useSampleDesk ? null : ianaTimezone,
  });
  const dayFetchRange = {
    start: explorerWindow.start,
    end: explorerWindow.end,
    label: explorerWindow.label,
  };

  /** Kept for empty-period prior order board (SAMPLE). */
  let samplePriorSales: Awaited<ReturnType<typeof fetchSampleSales>> | null =
    null;
  let priorPeriodSalesByDay = new Map<string, number>();
  /** Live prior totals for empty-period board (orders + cohort sales). */
  let priorFactsForBoard: {
    totalSales: number;
    orderCount: number;
    newCustomerNetSalesSum: number;
  } | null = null;

  if (useSampleDesk) {
    const [sampleSales, samplePrior, sampleExplorer] = await Promise.all([
      fetchSampleSales(shop.id, range),
      fetchSampleSales(shop.id, priorRange),
      fetchSampleSales(shop.id, {
        start: explorerWindow.start,
        end: explorerWindow.end,
        label: explorerWindow.label,
      }),
    ]);
    sales = sampleSales;
    samplePriorSales = samplePrior;
    priorSales = { totalSales: samplePrior.totalSales };
    const [sampleExplorerDays, samplePeriodDays, samplePriorDays] =
      await Promise.all([
        fetchSampleSalesByDay(shop.id, dayFetchRange),
        fetchSampleSalesByDay(shop.id, range),
        fetchSampleSalesByDay(shop.id, priorRange),
      ]);
    salesByDay = sampleExplorerDays;
    periodSalesByDay = samplePeriodDays;
    priorPeriodSalesByDay = samplePriorDays;
    explorerCustomers = {
      newCustomers: sampleExplorer.newCustomers,
      returningCustomers: sampleExplorer.returningCustomers,
      customerMetricsAvailable: sampleExplorer.customerMetricsAvailable,
    };
    salesPulledAt = new Date().toISOString();
  } else {
    /*
     * HARD-STOP (enterprise): desk paint NEVER starts unbounded fetchShopifySales /
     * fetchShopifySalesByDay for the selected period, prior, or explorer window —
     * that dies at 100k–1M orders on L12M / 3yr / incomplete coverage.
     *
     * Always serve stored SalesDayFact (+ honesty banners when incomplete /
     * periodExceedsFactWindow). Live GraphQL is only the capped "today" top-up
     * (LIVE_TODAY_MAX_PAGES). First paint awaits a newest-first period chunk;
     * the job tick resumes the rest.
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

    // First paint: fill the selected period HERE. scopes_update only enqueues
    // deep_history_backfill — Fly workers are often stopped, so a complete
    // row-set of $0 facts must not skip ingest (732ms Overview / permanent $0).
    let periodPeek = { totalSales: 0, orderCount: 0 };
    try {
      const peek = await getSalesFactsTotals(shop.id, range, now, ianaTimezone);
      periodPeek = { totalSales: peek.totalSales, orderCount: peek.orderCount };
    } catch {
      periodPeek = { totalSales: 0, orderCount: 0 };
    }
    const needSyncFill = salesFactsNeedSyncFill({
      mainCoverage,
      dayCoverage,
      periodSales: periodPeek.totalSales,
      periodOrders: periodPeek.orderCount,
    });
    const refreshExisting = salesFactsNeedRefreshExisting({
      factDays: mainCoverage.factDays,
      periodSales: periodPeek.totalSales,
      periodOrders: periodPeek.orderCount,
    });
    if (needSyncFill) {
      try {
        await runSalesFactsBackfill(admin, shop.id, {
          maxDays: FIRST_PAINT_SALES_BACKFILL_DAYS,
          grantedScopes: session.scope,
          newestFirst: true,
          priorityRange: range,
          refreshExisting,
        });
      } catch {
        // ignore — hero + banners disclose incomplete facts
      }
      void enqueueSalesFactsBackfill({
        shopId: shop.id,
        grantedScopes: session.scope,
        reason: refreshExisting ? "overview_refresh_zero" : "overview_incomplete",
        refreshExisting,
      }).catch(() => {
        // tick will retry if a worker is alive; page-open already filled MTD
      });
    }
    // Till LTV OrderFact ingest — fire-and-forget; sales hero is the money path.
    void runOrderFactsBackfill(admin, shop.id, {
      maxDays: 7,
      grantedScopes: session.scope,
    }).catch(() => {
      // ignore — panel shows empty/backfilling until cohorts land
    });

    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone,
      now,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    todaySalesTruncated = desk.todaySalesTruncated;
    salesFactsCoverageForBanner = desk.factsCoverage ?? mainCoverage;
    salesUntrustedZero = desk.salesUntrustedZero;
    usedLivePeriodProbe = desk.usedLivePeriodProbe;
    shopOrdersSeen = desk.shopOrdersSeen;
    liveConfirmedZero =
      desk.liveConfirmedQuiet &&
      !salesUntrustedZero &&
      !(desk.sales.totalSales > 0);
    // Freshness only after a successful facts load; unavailable today → null chip.
    salesPulledAt =
      desk.salesError || desk.todaySalesUnavailable
        ? null
        : new Date().toISOString();

    if (usedLivePeriodProbe || salesUntrustedZero) {
      void enqueueSalesFactsBackfill({
        shopId: shop.id,
        grantedScopes: session.scope,
        reason: usedLivePeriodProbe
          ? "overview_live_probe"
          : "overview_untrusted_zero",
        refreshExisting: true,
      }).catch(() => {});
    }

    try {
      const [priorFacts, priorCoverage] = await Promise.all([
        getSalesFactsTotals(shop.id, priorRange, now, ianaTimezone),
        getSalesFactsCoverage(shop.id, priorRange, now, ianaTimezone),
      ]);
      // Clamped/incomplete prior → skip deltas (never fake priorMer=0 improvement).
      priorSales =
        priorFacts.rangeClampedToFactWindow || !priorCoverage.complete
          ? null
          : { totalSales: priorFacts.totalSales };
      if (
        !priorFacts.rangeClampedToFactWindow &&
        priorCoverage.complete &&
        (priorFacts.totalSales > 0 || priorFacts.orderCount > 0)
      ) {
        priorFactsForBoard = {
          totalSales: priorFacts.totalSales,
          orderCount: priorFacts.orderCount,
          newCustomerNetSalesSum: priorFacts.newCustomerNetSalesSum,
        };
      }
    } catch {
      priorSales = null;
      priorFactsForBoard = null;
    }

    try {
      const [explorerDays, periodDays, priorDays] = await Promise.all([
        getSalesFactsByDay(shop.id, dayFetchRange, ianaTimezone),
        getSalesFactsByDay(shop.id, range, ianaTimezone),
        getSalesFactsByDay(shop.id, priorRange, ianaTimezone),
      ]);
      salesByDay = explorerDays;
      periodSalesByDay = periodDays;
      priorPeriodSalesByDay = priorDays;
    } catch {
      salesByDay = new Map();
      periodSalesByDay = new Map();
    }
    // Explorer new/returning needs a unique cross-day crawl — refused on paint.
    explorerCustomers = {
      newCustomers: 0,
      returningCustomers: 0,
      customerMetricsAvailable: false,
    };
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesByDay,
    ...(priorSales != null ? { priorSales, priorRange } : {}),
    salesPulledAt,
    salesBasis,
  });

  const explorerSeries = await buildSpendExplorerSeries(shop.id, {
    sampleOnly: useSampleDesk,
    excludeSample: !useSampleDesk,
    salesByDay,
    window: explorerWindow,
    granularity: exGran,
    mode: exMode,
    targetMer: metrics.targetMer,
    newCustomers: explorerCustomers.newCustomers,
    returningCustomers: explorerCustomers.returningCustomers,
    customerMetricsAvailable: explorerCustomers.customerMetricsAvailable,
    timeZone: useSampleDesk ? null : ianaTimezone,
  });

  const explorerTz = useSampleDesk ? null : ianaTimezone;
  const explorerDayKey = (instant: Date) =>
    explorerTz
      ? shopLocalDayKey(instant, explorerTz)
      : dateKeyFromLocal(instant);

  const explorer: SpendExplorerSeriesView = {
    buckets: explorerSeries.buckets,
    summary: explorerSeries.summary,
    mode: explorerSeries.mode,
    granularity: explorerSeries.granularity,
    range: explorerWindow.range,
    windowLabel: explorerWindow.label,
    targetMer: metrics.targetMerConfirmed ? explorerSeries.targetMer : null,
    breakEvenMer: metrics.breakEvenMer,
    showSales: exSales,
    fromKey: explorerDayKey(explorerWindow.start),
    toKey: explorerDayKey(explorerWindow.end),
    asOfKey: explorerDayKey(explorerWindow.end),
  };

  const shareTz = useSampleDesk ? null : ianaTimezone;
  const shareDayKey = (instant: Date) =>
    shareTz
      ? shopLocalDayKey(instant, shareTz)
      : instant.toISOString().slice(0, 10);

  const dayAccuracy =
    useSampleDesk || shotMode
      ? null
      : await loadSalesDayAccuracy({
          shopId: shop.id,
          range,
          ianaTimezone,
          now,
          enqueueRepair: true,
          grantedScopes: session.scope,
          useSampleDesk: false,
        });

  const factsIncompleteForHonesty =
    !useSampleDesk &&
    salesFactsIncompleteForDesk(salesFactsCoverageForBanner, {
      salesUntrustedZero,
      sales: metrics.sales,
      spend: metrics.totalSpend,
      liveConfirmedZero,
      shopOrdersSeen,
    });

  // Closed-day ledger export readiness. Mirrors the route's gates so the desk
  // never offers a download the server would refuse; the 409 stays authoritative.
  const periodLedger = resolvePeriodLedgerControl({
    preset,
    useSampleDesk,
    salesFactsReady:
      !factsIncompleteForHonesty &&
      salesFactsCoverageForBanner != null &&
      salesFactsCoverageForBanner.complete &&
      !salesFactsCoverageForBanner.periodExceedsFactWindow &&
      salesFactsCoverageForBanner.factDays ===
        salesFactsCoverageForBanner.expectedClosedDays,
    spendReady:
      metrics.spendCoverage.daysInPeriod > 0 &&
      metrics.spendCoverage.daysWithSpend ===
        metrics.spendCoverage.daysInPeriod,
    closedDays: salesFactsCoverageForBanner?.expectedClosedDays ?? 0,
  });

  const periodTz = useSampleDesk ? null : ianaTimezone;
  const periodStartKey = periodTz
    ? shopLocalDayKey(range.start, periodTz)
    : dateKeyFromLocal(range.start);
  const periodEndKey = periodTz
    ? shopLocalDayKey(range.end, periodTz)
    : dateKeyFromLocal(range.end);

  const orderEconomics = resolveOrderEconomics({
    sales: metrics.sales,
    orderCount: metrics.orderCount,
    salesByDay: periodSalesByDay,
    periodStartKey,
    periodEndKey,
    newCustomerSales: metrics.newCustomerNetSales,
    returningCustomerSales: metrics.returningCustomerNetSales,
    totalSpend: metrics.totalSpend,
  });

  const priorStartKey = periodTz
    ? shopLocalDayKey(priorRange.start, periodTz)
    : dateKeyFromLocal(priorRange.start);
  const priorEndKey = periodTz
    ? shopLocalDayKey(priorRange.end, periodTz)
    : dateKeyFromLocal(priorRange.end);

  let priorPeriodBoard: {
    economics: typeof orderEconomics;
    label: string;
    href: string;
  } | null = null;

  if (!orderEconomics.hasSignal) {
    if (samplePriorSales && samplePriorSales.orderCount > 0) {
      const priorEcon = resolveOrderEconomics({
        sales: samplePriorSales.totalSales,
        orderCount: samplePriorSales.orderCount,
        salesByDay: priorPeriodSalesByDay,
        periodStartKey: priorStartKey,
        periodEndKey: priorEndKey,
        newCustomerSales: samplePriorSales.newCustomerNetSales,
        returningCustomerSales: samplePriorSales.returningCustomerNetSales,
        totalSpend: 0,
      });
      if (priorEcon.hasSignal) {
        priorPeriodBoard = {
          economics: priorEcon,
          label: priorRange.label,
          href: `/app?period=${preset === "mtd" ? "lm" : "l12m"}&stay=1`,
        };
      }
    } else if (priorFactsForBoard) {
      const priorEcon = resolveOrderEconomics({
        sales: priorFactsForBoard.totalSales,
        orderCount: priorFactsForBoard.orderCount,
        salesByDay: priorPeriodSalesByDay,
        periodStartKey: priorStartKey,
        periodEndKey: priorEndKey,
        newCustomerSales: priorFactsForBoard.newCustomerNetSalesSum,
        returningCustomerSales: Math.max(
          0,
          priorFactsForBoard.totalSales -
            priorFactsForBoard.newCustomerNetSalesSum,
        ),
        totalSpend: 0,
      });
      if (priorEcon.hasSignal) {
        priorPeriodBoard = {
          economics: priorEcon,
          label: priorRange.label,
          href: `/app?period=${preset === "mtd" ? "lm" : "l12m"}&stay=1`,
        };
      }
    }
  }


  // Period day board — orders/AOV/new-share/spend/ROAS (Sheets replacement).
  const todayKey = periodTz
    ? shopLocalDayKey(new Date(), periodTz)
    : dateKeyFromLocal(new Date());

  let periodFactRows = new Map<
    string,
    {
      sales: number;
      orderCount: number;
      newCustomerNetSales: number;
      returningCustomerNetSales: number;
    }
  >();
  let priorFactRows = new Map<
    string,
    {
      sales: number;
      orderCount: number;
      newCustomerNetSales: number;
      returningCustomerNetSales: number;
    }
  >();

  try {
    if (useSampleDesk) {
      const [periodRows, priorRows] = await Promise.all([
        fetchSampleSalesRowsByDay(shop.id, range),
        fetchSampleSalesRowsByDay(shop.id, priorRange),
      ]);
      periodFactRows = periodRows;
      priorFactRows = priorRows;
    } else {
      const [periodRows, priorRows] = await Promise.all([
        getSalesFactRowsByDay(shop.id, range, ianaTimezone),
        getSalesFactRowsByDay(shop.id, priorRange, ianaTimezone),
      ]);
      periodFactRows = periodRows;
      priorFactRows = priorRows;
    }
  } catch {
    periodFactRows = new Map();
    priorFactRows = new Map();
  }

  const salesOnly = new Map<string, number>();
  for (const [k, row] of periodFactRows) salesOnly.set(k, row.sales);

  let spendByDay = new Map<string, number>();
  try {
    const dailyRows = await buildDailyRowsForWindow(shop.id, {
      sampleOnly: useSampleDesk,
      excludeSample: !useSampleDesk,
      salesByDay: salesOnly,
      windowStart: range.start,
      windowEnd: range.end,
      timeZone: periodTz,
    });
    for (const row of dailyRows) {
      spendByDay.set(row.dateKey, row.spend);
    }
  } catch {
    spendByDay = new Map();
  }

  let priorSpendByDay = new Map<string, number>();
  try {
    const priorSalesOnly = new Map<string, number>();
    for (const [k, row] of priorFactRows) priorSalesOnly.set(k, row.sales);
    const priorDaily = await buildDailyRowsForWindow(shop.id, {
      sampleOnly: useSampleDesk,
      excludeSample: !useSampleDesk,
      salesByDay: priorSalesOnly,
      windowStart: priorRange.start,
      windowEnd: priorRange.end,
      timeZone: periodTz,
    });
    for (const row of priorDaily) {
      priorSpendByDay.set(row.dateKey, row.spend);
    }
  } catch {
    priorSpendByDay = new Map();
  }

  const dayQuality =
    periodFactRows.size > 0
      ? buildDayQuality({
          factRows: periodFactRows,
          spendByDay,
          periodStartKey,
          periodEndKey,
          todayKey,
          breakEvenMer: metrics.breakEvenMer,
          priorFactRows,
          priorSpendByDay,
          priorStartKey,
          priorEndKey,
        })
      : null;

  return {
    metrics,
    orderEconomics,
    priorPeriodBoard,
    dayQuality,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    preset,
    useSampleDesk,
    shotMode,
    explorer,
    periodLedger,
    salesFactsCoverage: salesFactsCoverageForBanner,
    salesUntrustedZero,
    liveConfirmedZero,
    factsIncompleteForHonesty,
    dayAccuracy,
    shareSubject: formatOverviewShareSubject({
      periodLabel: metrics.period.label,
      useSampleDesk,
    }),
    sharePeriodStartDay: shareDayKey(metrics.period.start),
    sharePeriodEndDay: shareDayKey(metrics.period.end),
    shopLabel: session.shop,
    marginConfirmed: marginIsConfirmed(settings),
    hasLiveSpend,
    hasReadAllOrders: scopesIncludeReadAllOrders(session.scope),
    shopDomain: session.shop,
    periodWiderThanRecentWindow: periodMayExceedShopifyOrderWindow(range),
    installedAt: shop.createdAt.toISOString(),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Overview locks to Shopify Total Sales — sales basis is Settings-only.
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const {
    metrics,
    orderEconomics,
    priorPeriodBoard,
    dayQuality,
    preset,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    useSampleDesk,
    shotMode,
    explorer,
    periodLedger,
    salesFactsCoverage,
    salesUntrustedZero,
    liveConfirmedZero,
    factsIncompleteForHonesty,
    dayAccuracy,
    shareSubject,
    sharePeriodStartDay,
    sharePeriodEndDay,
    shopLabel,
    marginConfirmed,
    hasLiveSpend,
    hasReadAllOrders,
    shopDomain,
    installedAt,
    periodWiderThanRecentWindow,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  // Listing-capture: period only (no SAMPLE banner/ctx, no live lie).
  // Merchant mode keeps SAMPLE / facts / live honesty unchanged.
  const periodAsOfLabel = formatListingTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    listingCapture: shotMode,
    salesError: Boolean(salesError),
    blockedMockAsLive: Boolean(metrics.blockedMockAsLive),
    salesSource: metrics.salesSource,
    factsIncomplete: factsIncompleteForHonesty,
    recentWindowOnly: !useSampleDesk && !hasReadAllOrders,
  });
  const freshLabel = formatCashFreshnessChip({
    useSampleDesk,
    listingCapture: shotMode,
    salesPulledAt: metrics.freshness.salesPulledAt,
    lastAt: metrics.freshness.lastAt,
    source: metrics.freshness.source,
    spendUpdatedAt: metrics.freshness.spendUpdatedAt,
  });
  const firstSession = resolveFirstSessionPath({
    marginConfirmed,
    hasLiveSpend,
    useSampleDesk,
    shotMode,
    hasReadAllOrders,
    shopDomain,
  });
  const deepHistory = resolveDeepHistoryHonesty({
    hasReadAllOrders,
    useSampleDesk,
    shotMode,
    factsIncomplete: factsIncompleteForHonesty,
    periodWiderThanRecentWindow,
  });
  const coldEmpty = firstSession.showColdEmpty;
  // Cash MER paints once any live spend exists — margin only unlocks break-even.
  const salesDeskReady = !salesError;
  // Total ROAS scoreboard still needs spend; sales desk does not.
  const scoreboardReady = !coldEmpty && salesDeskReady;
  const periodUncovered =
    Boolean(salesFactsCoverage?.periodExceedsFactWindow) ||
    (!hasReadAllOrders && periodWiderThanRecentWindow);
  const trustedHero = resolveTrustedRoasHero({
    mer: metrics.mer,
    sales: metrics.sales,
    spend: metrics.totalSpend,
    factsIncomplete: factsIncompleteForHonesty,
    periodUncovered,
    useSampleDesk,
    periodPreset: preset,
  });
  const factsIncompleteForTrust = factsIncompleteForHonesty;
  const periodTrust = resolvePeriodTrust({
    preset,
    hasSpend: metrics.onboarding.hasSpend,
    spendIncomplete: Boolean(metrics.spendCoverage?.incomplete),
    salesFactsIncomplete: factsIncompleteForTrust,
    periodExceedsFactWindow: Boolean(
      salesFactsCoverage?.periodExceedsFactWindow,
    ),
    useSampleDesk,
    shotMode,
  });
  // Page chrome: customer insights when sales exist; spend only when they don't.
  const primaryAction = trustedHero.hideUntrustedZero
    ? { href: trustedHero.primaryHref, label: trustedHero.primaryLabel }
    : salesDeskReady
      ? {
          href: `/app/ltv?period=${preset}`,
          label: PRODUCT_NOUN.openCustomerInsights,
        }
      : firstSessionPrimaryAction(firstSession);

  /** Empty-period escapes — keep Overview useful when MTD (etc.) has no orders. */
  const emptyPeriodHrefs = (
    [
      { value: "lm" as const, label: "Last month" },
      { value: "l12m" as const, label: "Last 12 months" },
      { value: "ytd" as const, label: "Year to date" },
    ] as const
  )
    .filter((p) => p.value !== preset)
    .slice(0, 2)
    .map((p) => ({
      label: p.label,
      href: `/app?period=${p.value}&stay=1`,
    }));

  const deltas = metrics.deltas;
  const priorLabel = deltas?.priorLabel;
  const salesDeltaLine = deltas
    ? formatPctDelta(deltas.salesPct, priorLabel)
    : metrics.orderCount > 0
      ? `${metrics.orderCount.toLocaleString()} orders · AOV ${formatCurrency(metrics.sales / metrics.orderCount)}`
      : `${metrics.orderCount.toLocaleString()} orders`;
  const spendDeltaLine = deltas
    ? formatPctDelta(deltas.spendPct, priorLabel)
    : null;
  const merDeltaLine = deltas
    ? formatPctDelta(
        deltas.priorMer != null && deltas.priorMer > 0 && metrics.mer != null
          ? ((metrics.mer - deltas.priorMer) / deltas.priorMer) * 100
          : null,
        priorLabel,
      )
    : null;
  const totalSalesDisplay = metrics.totalSalesAmount ?? metrics.sales;
  const periodChannels = [...metrics.channelMix]
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((entry) => {
      const name = channelDisplayLabel(entry.channel);
      return {
        name,
        amount: entry.amount,
        share: entry.share,
        fill: channelFillKey(name),
      };
    });

  const shareText = formatOverviewShareText({
    periodLabel: metrics.period.label,
    periodStartDay: sharePeriodStartDay,
    periodEndDay: sharePeriodEndDay,
    totalSales: trustedHero.hideUntrustedZero ? 0 : totalSalesDisplay,
    totalSpend: metrics.totalSpend,
    mer: trustedHero.mer,
    breakEvenMer: trustedHero.hideUntrustedZero ? null : metrics.breakEvenMer,
    marginPct: metrics.marginPct,
    spendIncomplete: Boolean(metrics.spendCoverage?.incomplete),
    shopLabel,
    channels: periodChannels,
    salesDeltaLine: trustedHero.hideUntrustedZero
      ? "Sales facts still loading — not a trusted multiple"
      : salesDeltaLine,
    spendDeltaLine,
    useSampleDesk,
  });

  /** Love-V1: split above/below so budgeted banners are not double-mounted. */

  /*
   * VISUAL §2.3 — one primary per visible context. The desk body already owns
   * the spend primary in the first viewport (hero cluster when the scoreboard
   * paints, the unlock when cold, Retry when sales failed), so the page
   * slot keeps the action reachable at Admin level without a second dark CTA.
   * SAMPLE → Real is a mode switch, not a duplicate — it stays primary.
   */
  const bodyOwnsPrimary =
    !shotMode &&
    (Boolean(salesError) || (coldEmpty ? salesDeskReady : scoreboardReady));
  const pageActionVariant =
    bodyOwnsPrimary && primaryAction.postIntent !== "use-real"
      ? "secondary"
      : "primary";

  // Listing-gold first viewport: hero first. Only mock-as-live / cold / empty
  // honesty sits above the dial — break-even and spend gaps live under it.

  // Shot + live scoreboard both paint the three-card hero (listing SoT).
  // ROAS hero only after spend (or SAMPLE/shot). Order/customer depth never waits on CSV.
  const showRoasHero =
    shotMode ||
    (salesDeskReady && (hasLiveSpend || useSampleDesk));
  // Customer snaps + day board paint whenever Shopify sales are ready.
  const showCustomerDepth = salesDeskReady || shotMode;
  const dayQualityInsight =
    dayQuality && dayQuality.rows.length > 0
      ? summarizeDayQuality(dayQuality)
      : null;
  const dayInsightPartial =
    Boolean(dayQualityInsight?.amongFilledDays) ||
    (dayAccuracy != null &&
      (dayAccuracy.status === "catching_up" ||
        dayAccuracy.status === "partial_history"));
  const formatDayInsightLine = (): string | null => {
    if (!dayQualityInsight) return null;
    const parts = [
      dayQualityInsight.best
        ? `Strongest day ${dayQualityInsight.best.label} · ${dayQualityInsight.best.orders.toLocaleString()} orders`
        : null,
      dayQualityInsight.softest
        ? `Softest ${dayQualityInsight.softest.label}`
        : null,
      dayQualityInsight.aovDeltaPct != null
        ? `AOV ${dayQualityInsight.aovDeltaPct >= 0 ? "+" : ""}${dayQualityInsight.aovDeltaPct.toFixed(0)}% vs prior`
        : null,
      dayInsightPartial ? "among filled days" : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  };
  const opsDeskIsland = orderEconomics.hasSignal
    ? buildOpsDeskIsland({
        periodLabel: metrics.period.label,
        periodPreset: preset,
        economics: orderEconomics,
        buyerRepeat: metrics.tillLtv.available
          ? {
              secondWithin90: metrics.tillLtv.buyerRepeat.secondWithin90,
              medianDaysToSecond:
                metrics.tillLtv.buyerRepeat.medianDaysToSecond,
            }
          : null,
        avgRevenueD90: metrics.tillLtv.available
          ? metrics.tillLtv.avgRevenueD90
          : null,
        newBuyers: metrics.tillLtv.available ? metrics.tillLtv.newBuyers : null,
        top10BuyerShare: metrics.tillLtv.available
          ? metrics.tillLtv.buyerConcentration.top10Share
          : null,
        dayInsight: formatDayInsightLine(),
        hasLiveSpend,
      })
    : null;

  const scoreboardHero = orderEconomics.hasSignal
    ? buildScoreboardHero({
        periodLabel: metrics.period.label,
        periodPreset: preset,
        economics: orderEconomics,
        salesDeltaPct: deltas?.salesPct ?? null,
        priorLabel: deltas?.priorLabel ?? null,
        buyerRepeat: metrics.tillLtv.available
          ? {
              secondWithin90: metrics.tillLtv.buyerRepeat.secondWithin90,
              medianDaysToSecond:
                metrics.tillLtv.buyerRepeat.medianDaysToSecond,
            }
          : null,
        avgRevenueD90: metrics.tillLtv.available
          ? metrics.tillLtv.avgRevenueD90
          : null,
        newBuyers: metrics.tillLtv.available ? metrics.tillLtv.newBuyers : null,
        top10BuyerShare: metrics.tillLtv.available
          ? metrics.tillLtv.buyerConcentration.top10Share
          : null,
        dayInsight: formatDayInsightLine(),
        hasLiveSpend,
        mer: metrics.mer,
        spend: metrics.totalSpend,
        spendDeltaPct: deltas?.spendPct ?? null,
      })
    : null;
  const salesMix = orderEconomics.hasSignal
    ? buildSalesMix(orderEconomics, metrics.period.label)
    : null;

  // One primary CTA: customer insights when sales exist; spend is later depth.
  const heroPrimary = salesDeskReady
    ? {
        href: `/app/ltv?period=${preset}`,
        label: PRODUCT_NOUN.openCustomerInsights,
      }
    : {
        href: "/app/ltv",
        label: PRODUCT_NOUN.openCustomerInsights,
      };
  const showSpendSecondary = showRoasHero && !trustedHero.hideUntrustedZero;

  return (
    <s-page heading="Overview" inlineSize="large">
      {!shotMode &&
      primaryAction.postIntent === "use-real" &&
      primaryAction.postAction ? (
        <Form method="post" action={primaryAction.postAction}>
          <input type="hidden" name="intent" value="use-real" />
          <input
            type="hidden"
            name="returnTo"
            value={primaryAction.returnTo ?? "/app/spend"}
          />
          <s-button
            slot="primary-action"
            type="submit"
            variant="primary"
            aria-label={primaryAction.label}
          >
            {primaryAction.label}
          </s-button>
        </Form>
      ) : !shotMode ? (
        <s-button
          slot="primary-action"
          variant={pageActionVariant}
          href={primaryAction.href}
          aria-label={primaryAction.label}
        >
          {primaryAction.label}
        </s-button>
      ) : null}
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--bc",
          shotMode ? "mcfly-desk--shot mcfly-desk--listing" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          scoreboardReady && !useSampleDesk ? "mcfly-desk--live-ready" : null,
          coldEmpty ? "mcfly-desk--cold-empty" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* SAMPLE chrome only when ON — never competes with live KPI story. */}
        {useSampleDesk && !shotMode ? <SampleDeskBanner /> : null}

        {!shotMode && !useSampleDesk && deepHistory.showGrantCta ? (
          <DeepHistoryBanner
            kind={deepHistory.kind}
            shopDomain={shopDomain}
            showMtdCta={deepHistory.kind === "missing_scope_wide"}
          />
        ) : null}


        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing sales and spend for this period…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load — {PRODUCT_NOUN.totalRoas} needs the sales side of sales ÷ spend.
            </p>
            <div className="mcfly-state__cta">
              <s-button href={`/app?period=${preset}`} variant="primary">
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        <div className="mcfly-ctx mcfly-ctx--bc" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">
              <img
                className="mcfly-ctx__mark"
                src="/brand/mcfly-m-64.png"
                width={22}
                height={22}
                alt=""
              />
              Mcfly
            </span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__def">
              Shopify sales · orders · customers — spend optional
            </span>
            <span className="mcfly-ctx__asof">{periodAsOfLabel}</span>
            <PeriodControl preset={preset} shotMode={shotMode} />
          </div>
          <div className="mcfly-ctx__chips">
            <span
              className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-ctx-chip--fresh"
              title={freshLabel}
            >
              {freshLabel}
            </span>
            {trustedHero.kind === "pick_covered_period" ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                Pick a shorter period
              </span>
            ) : trustedHero.hideUntrustedZero ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                Sales still loading
              </span>
            ) : orderEconomics.hasSignal ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                {orderEconomics.orderCount.toLocaleString()} orders
              </span>
            ) : null}
          </div>
        </div>


        {/*
          API-first desk: Shopify order/customer depth paints whenever sales
          exist — spend CSV is later ROAS depth, not the cold wall.
        */}
        {salesDeskReady && !shotMode ? (
          <>
            {scoreboardHero ? (
              <ScoreboardHero model={scoreboardHero} />
            ) : opsDeskIsland ? (
              <OpsDeskIsland model={opsDeskIsland} />
            ) : null}

            {dayAccuracy ? (
              <SalesDayAccuracyStrip accuracy={dayAccuracy} when="problems" />
            ) : null}

            <div className="mcfly-desk-grid mcfly-desk-grid--bc">
              {salesMix ? <SalesMixPanel model={salesMix} /> : null}
              <OrderEconomicsPanel
                economics={orderEconomics}
                periodLabel={metrics.period.label}
                showSpendUnlock={false}
                emptyPeriodHrefs={emptyPeriodHrefs}
                priorPeriod={
                  priorPeriodBoard
                    ? {
                        economics: priorPeriodBoard.economics,
                        label: priorPeriodBoard.label,
                        href: priorPeriodBoard.href,
                      }
                    : null
                }
              />
            </div>

            {dayQuality ? (
              <div id="mcfly-day-quality">
                <DayQualityTablePanel
                  table={dayQuality}
                  periodLabel={metrics.period.label}
                  breakEvenMer={metrics.breakEvenMer}
                />
              </div>
            ) : null}

            {dayQualityInsight &&
            (dayQualityInsight.best ||
              dayQualityInsight.softest ||
              dayQualityInsight.aovDeltaPct != null) ? (
              <p className="mcfly-day-insight" aria-label="Period day insight">
                {dayQualityInsight.best ? (
                  <>
                    Strongest day {dayQualityInsight.best.label}
                    {" · "}
                    {formatCurrency(dayQualityInsight.best.sales)}
                    {" · "}
                    {dayQualityInsight.best.orders.toLocaleString()} orders
                  </>
                ) : null}
                {dayQualityInsight.best && dayQualityInsight.softest
                  ? " · "
                  : null}
                {dayQualityInsight.softest ? (
                  <>
                    Softest {dayQualityInsight.softest.label}
                    {" · "}
                    {formatCurrency(dayQualityInsight.softest.sales)}
                  </>
                ) : null}
                {dayQualityInsight.aovDeltaPct != null ? (
                  <>
                    {(dayQualityInsight.best || dayQualityInsight.softest)
                      ? " · "
                      : null}
                    AOV{" "}
                    {dayQualityInsight.aovDeltaPct >= 0 ? "+" : ""}
                    {dayQualityInsight.aovDeltaPct.toFixed(0)}% vs prior
                  </>
                ) : null}
                {dayInsightPartial ? " · among filled days" : null}
              </p>
            ) : null}

            {metrics.control.daysInPeriod > 0 ? (
              <PeriodPaceStrip
                control={metrics.control}
                periodLabel={metrics.period.label}
                showHeadroom={
                  Boolean(
                    metrics.cashActionReady && metrics.targetMerConfirmed,
                  )
                }
              />
            ) : null}

            <div className="mcfly-tab-snaps" aria-label="Customer insights">
              <LtvSnapSection
                tillLtv={metrics.tillLtv}
                preset={preset}
                emptyPeriodHrefs={emptyPeriodHrefs}
              />
              <AcquisitionGlance
                preset={preset}
                amer={metrics.amer}
                newCustomerSales={metrics.newCustomerNetSales}
                returningCustomerSales={metrics.returningCustomerNetSales}
                periodSales={metrics.sales}
                totalSpend={metrics.totalSpend}
                periodLabel={metrics.period.label}
                cashActionReady={metrics.cashActionReady}
                spendIncomplete={Boolean(metrics.spendCoverage?.incomplete)}
                salesFactsIncomplete={
                  factsIncompleteForTrust || trustedHero.hideUntrustedZero
                }
                periodUncovered={periodUncovered}
                newBuyers={
                  metrics.tillLtv.available ? metrics.tillLtv.newBuyers : null
                }
                useSampleDesk={useSampleDesk}
              />
            </div>

            {!hasLiveSpend && !useSampleDesk ? (
              <p className="mcfly-spend-later" aria-label="Spend later">
                Order and customer depth above already runs on Shopify alone.{" "}
                When you want Total ROAS,{" "}
                <s-link href="/app/spend">add spend later</s-link>
                {" — one monthly bill or a Google Sheet, not a daily chore."}
              </p>
            ) : null}
          </>
        ) : null}

        {/* No sales yet — quiet first-session path (not a spend sermon wall). */}
        {coldEmpty && !salesDeskReady && !shotMode ? (
          <FirstSessionGuide path={firstSession} />
        ) : null}

        {/* Total ROAS strip — only once spend (or SAMPLE/shot) exists. */}
        {showRoasHero ? (
          <>
            <section
              className="mcfly-hero-compact mcfly-hero-compact--v2"
              aria-label={`${PRODUCT_NOUN.totalRoas} snapshot`}
            >
              <div className="mcfly-hero-compact__status mcfly-hero-compact__status--gauge">
                {trustedHero.hideUntrustedZero ? (
                  <s-banner tone="warning" heading={trustedHero.heading}>
                    <s-paragraph>{trustedHero.body}</s-paragraph>
                    <div
                      className="mcfly-decision__actions"
                      style={{ marginTop: "0.65rem" }}
                    >
                      <s-button
                        href={trustedHero.primaryHref}
                        variant="primary"
                      >
                        {trustedHero.primaryLabel}
                      </s-button>
                      <s-button
                        href={trustedHero.secondaryHref}
                        variant="secondary"
                      >
                        {trustedHero.secondaryLabel}
                      </s-button>
                    </div>
                  </s-banner>
                ) : (
                  <TotalRoasGauge
                    mer={trustedHero.mer}
                    targetMer={
                      metrics.targetMerConfirmed ? metrics.targetMer : null
                    }
                    periodTrusted={periodTrust.trusted}
                    deltaLine={merDeltaLine}
                  />
                )}
                <div className="mcfly-hero-compact__actions">
                  {trustedHero.hideUntrustedZero ? null : (
                    <s-button href={heroPrimary.href} variant="primary">
                      {heroPrimary.label}
                    </s-button>
                  )}
                  {showSpendSecondary ? (
                    <s-button
                      href="/app/spend#mcfly-spend-uploads"
                      variant="secondary"
                    >
                      Update spend
                    </s-button>
                  ) : null}
                  <ShareOverviewButton
                    subject={shareSubject}
                    body={shareText}
                    enabled={!shotMode && scoreboardReady}
                    compact
                  />
                  <s-button
                    variant="tertiary"
                    aria-label={periodLedger.label}
                    {...(periodLedger.ready
                      ? { href: periodLedger.href }
                      : {
                          disabled: true,
                          "aria-describedby": "mcfly-period-ledger-help",
                        })}
                  >
                    {periodLedger.label}
                  </s-button>
                </div>
                {periodLedger.blockedCopy ? (
                  <p
                    className="mcfly-hero-compact__meta"
                    id="mcfly-period-ledger-help"
                  >
                    {periodLedger.blockedCopy}
                  </p>
                ) : null}
              </div>
              <div className="mcfly-hero-compact__pair">
                <div className="mcfly-hero-compact__tile mcfly-hero-compact__tile--sales">
                  <p className="mcfly-hero-compact__label">
                    Shopify Total Sales
                  </p>
                  <p className="mcfly-hero-compact__value">
                    {trustedHero.hideUntrustedZero
                      ? "—"
                      : formatCurrency(totalSalesDisplay)}
                  </p>
                  <p className="mcfly-hero-compact__meta">
                    {trustedHero.kind === "pick_covered_period"
                      ? "This period is wider than loaded sales history"
                      : trustedHero.hideUntrustedZero
                        ? "Sales facts still loading for this period"
                        : PRODUCT_NOUN.totalSalesHeroHint}
                  </p>
                  {!trustedHero.hideUntrustedZero && deltas ? (
                    <p className="mcfly-hero-compact__meta mcfly-hero-compact__delta">
                      {salesDeltaLine}
                    </p>
                  ) : null}
                  {!trustedHero.hideUntrustedZero && metrics.orderCount > 0 ? (
                    <ul
                      className="mcfly-kpi-facts"
                      aria-label={`Order facts · ${metrics.period.label}`}
                    >
                      <li className="mcfly-kpi-facts__row">
                        <span className="mcfly-kpi-facts__name">Orders</span>
                        <span className="mcfly-kpi-facts__amt">
                          {metrics.orderCount.toLocaleString()}
                        </span>
                      </li>
                      <li className="mcfly-kpi-facts__row">
                        <span className="mcfly-kpi-facts__name">
                          Avg order value
                        </span>
                        <span className="mcfly-kpi-facts__amt">
                          {formatCurrency(
                            totalSalesDisplay / metrics.orderCount,
                          )}
                        </span>
                      </li>
                    </ul>
                  ) : null}
                </div>
                <div className="mcfly-hero-compact__tile mcfly-hero-compact__tile--spend">
                  <p className="mcfly-hero-compact__label">Total Spend</p>
                  <p className="mcfly-hero-compact__value">
                    {formatCurrency(metrics.totalSpend)}
                  </p>
                  <p className="mcfly-hero-compact__meta">
                    {metrics.period.label} · Logged via CSV
                  </p>
                  {spendDeltaLine ? (
                    <p className="mcfly-hero-compact__meta mcfly-hero-compact__delta">
                      {spendDeltaLine}
                    </p>
                  ) : null}
                  {periodChannels.length > 0 ? (
                    <ul
                      className="mcfly-kpi-channels mcfly-kpi-channels--scroll"
                      aria-label={`Spend allocation · ${metrics.period.label}`}
                    >
                      {periodChannels.map((entry) => (
                        <li
                          className="mcfly-kpi-channels__row"
                          key={entry.name}
                        >
                          <span
                            className={`mcfly-spend-dot mcfly-spend-dot--${entry.fill}`}
                            aria-hidden="true"
                          />
                          <span className="mcfly-kpi-channels__name">
                            {entry.name}
                          </span>
                          <span className="mcfly-kpi-channels__amt">
                            {formatCurrency(entry.amount)}
                            <span className="mcfly-kpi-channels__share">
                              {" "}
                              · {formatPercent(entry.share)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mcfly-hero-compact__meta">
                      No channel spend in this period
                    </p>
                  )}
                  <p className="mcfly-hero-compact__dive">
                    <s-link href={`/app/allocation?period=${preset}`}>
                      {PRODUCT_NOUN.spendAllocation}
                    </s-link>
                  </p>
                </div>
              </div>
            </section>

            <details className="mcfly-me-spine mcfly-me-spine--later">
              <summary className="mcfly-me-spine__summary">
                Daily spend vs sales — optional
              </summary>
              <SpendExplorer
                series={explorer}
                period={preset}
                shotMode={shotMode}
              />
            </details>
          </>
        ) : null}

        {!shotMode && salesDeskReady ? (
          <p className="mcfly-overview-more" aria-label="More tools">
            <s-link href="/app/ltv">Customers & LTV</s-link>
            {" · "}
            <s-link href="/app/goals">Goals</s-link>
            {hasLiveSpend || useSampleDesk ? (
              <>
                {" · "}
                <s-link href="/app/spend">Spend</s-link>
                {" · "}
                <s-link href="/app/advanced">
                  {PRODUCT_NOUN.advancedMetrics}
                </s-link>
              </>
            ) : (
              <>
                {" · "}
                <s-link href="/app/spend">Add spend later</s-link>
              </>
            )}
          </p>
        ) : null}
      </div>
    </s-page>
  );
}

function LtvSnapSection({
  tillLtv,
  preset,
  emptyPeriodHrefs = [],
}: {
  tillLtv: {
    available: boolean;
    emptyReason: string | null;
    cashCac: number | null;
    avgRevenueD30: number | null;
    avgRevenueD90: number | null;
    ltvCacRatio: number | null;
    newBuyers: number;
    repeatRate: number | null;
    buyerRepeat: {
      secondWithin90: number | null;
      medianDaysToSecond: number | null;
    };
  };
  preset: PeriodPreset;
  emptyPeriodHrefs?: { label: string; href: string }[];
}) {
  const showCac = tillLtv.cashCac != null && tillLtv.newBuyers > 0;
  const hasPeriodBuyers = tillLtv.newBuyers > 0;
  /** Cohort averages without period buyers — do not present as this-period KPIs. */
  const priorCohortsOnly = tillLtv.available && !hasPeriodBuyers;

  return (
    <section
      className="mcfly-tab-snap mcfly-tab-snap--ltv"
      aria-label={`${PRODUCT_NOUN.ltvTitle} snapshot`}
    >
      <div className="mcfly-tab-snap__head">
        <h2>{PRODUCT_NOUN.ltvTitle}</h2>
        <p className="mcfly-tab-snap__muted">
          {priorCohortsOnly
            ? "No new buyers in this period — prior cohort averages below"
            : "New buyers, LTV, and 2nd-order depth — Cash CAC when spend is logged"}
        </p>
      </div>

      {tillLtv.available ? (
        <>
          <div className="mcfly-tab-snap__tiles">
            <div className="mcfly-tab-snap__tile mcfly-tab-snap__tile--accent">
              <p className="mcfly-tab-snap__tile-k">New buyers</p>
              <p className="mcfly-tab-snap__tile-v">
                {tillLtv.newBuyers.toLocaleString()}
              </p>
              <p className="mcfly-tab-snap__tile-def">
                First-time customers in this period
              </p>
            </div>
            <div className="mcfly-tab-snap__tile">
              <p className="mcfly-tab-snap__tile-k">
                {priorCohortsOnly ? "Prior LTV · 90d" : "LTV · 90d"}
              </p>
              <p className="mcfly-tab-snap__tile-v">
                {tillLtv.avgRevenueD90 != null
                  ? formatCurrency(tillLtv.avgRevenueD90)
                  : "—"}
              </p>
              <p className="mcfly-tab-snap__tile-def">
                {priorCohortsOnly
                  ? "Historical cohort average — not this period’s buyers"
                  : PRODUCT_NOUN.ltv90Def}
              </p>
            </div>
            {hasPeriodBuyers || tillLtv.buyerRepeat.secondWithin90 != null ? (
              <div className="mcfly-tab-snap__tile">
                <p className="mcfly-tab-snap__tile-k">2nd order · 90d</p>
                <p className="mcfly-tab-snap__tile-v">
                  {formatSecondOrderRate(tillLtv.buyerRepeat.secondWithin90)}
                </p>
                <p className="mcfly-tab-snap__tile-def">
                  {tillLtv.buyerRepeat.medianDaysToSecond != null
                    ? `Median ${formatMedianDays(tillLtv.buyerRepeat.medianDaysToSecond)} to 2nd · mature buyers`
                    : "Mature buyers with a 2nd purchase within 90 days"}
                </p>
              </div>
            ) : hasPeriodBuyers ? (
              <div className="mcfly-tab-snap__tile">
                <p className="mcfly-tab-snap__tile-k">Extra orders / buyer</p>
                <p className="mcfly-tab-snap__tile-v">
                  {tillLtv.repeatRate != null
                    ? `${Math.round(tillLtv.repeatRate * 100)}%`
                    : "—"}
                </p>
                <p className="mcfly-tab-snap__tile-def">
                  Orders beyond first @ 90d · not 2nd-order %
                </p>
              </div>
            ) : null}
            {showCac ? (
              <div className="mcfly-tab-snap__tile">
                <p className="mcfly-tab-snap__tile-k">Cash CAC</p>
                <p className="mcfly-tab-snap__tile-v">
                  {formatCurrency(tillLtv.cashCac!)}
                </p>
                <p className="mcfly-tab-snap__tile-def">
                  {PRODUCT_NOUN.cashCacDef}
                  {tillLtv.ltvCacRatio != null
                    ? ` · LTV:CAC ${tillLtv.ltvCacRatio.toFixed(2)}×`
                    : ""}
                </p>
              </div>
            ) : null}
          </div>
          <p className="mcfly-tab-snap__sentence">
            {priorCohortsOnly
              ? tillLtv.avgRevenueD90 != null
                ? `Prior cohorts average ${formatCurrency(tillLtv.avgRevenueD90)} LTV at 90 days. Switch period for new-buyer LTV, or open full cohorts.`
                : "No new buyers in this period — switch period or open cohorts."
              : tillLtv.avgRevenueD90 != null
                ? showCac && tillLtv.cashCac != null && tillLtv.cashCac > 0
                  ? `New buyers return ${formatCurrency(tillLtv.avgRevenueD90)} by day 90 against ${formatCurrency(tillLtv.cashCac)} Cash CAC.`
                  : `${tillLtv.newBuyers.toLocaleString()} new buyers · ${formatCurrency(tillLtv.avgRevenueD90)} LTV at 90 days.`
                : `${tillLtv.newBuyers.toLocaleString()} new customers · open cohorts for full LTV`}
          </p>
          {priorCohortsOnly && emptyPeriodHrefs.length > 0 ? (
            <p className="mcfly-tab-snap__muted">
              Try{" "}
              {emptyPeriodHrefs.map((link, i) => (
                <span key={link.href}>
                  {i > 0 ? " · " : null}
                  <s-link href={link.href}>{link.label}</s-link>
                </span>
              ))}
            </p>
          ) : tillLtv.avgRevenueD30 != null && hasPeriodBuyers ? (
            <p className="mcfly-tab-snap__muted">
              LTV · 30d {formatCurrency(tillLtv.avgRevenueD30)}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mcfly-tab-snap__empty">
          {tillLtv.emptyReason === "no_timezone"
            ? "Shop timezone needed before customer cohorts can bucket by local day."
            : tillLtv.emptyReason === "history_limited"
              ? `Recent ~60-day window — grant deeper order access so LTV can fill. Not permanently empty.`
              : tillLtv.emptyReason === "pro_required"
                ? "Customer LTV is on the $39 plan (7-day trial). Open for cohorts while facts fill — SAMPLE is preview only."
                : `Backfilling cohorts — open ${PRODUCT_NOUN.ltvTitle} for progress. Not broken.`}
        </p>
      )}

      <div className="mcfly-tab-snap__cta">
        <s-link href={`/app/ltv?period=${preset}`}>
          {PRODUCT_NOUN.openCustomerInsights}
        </s-link>
      </div>
    </section>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
