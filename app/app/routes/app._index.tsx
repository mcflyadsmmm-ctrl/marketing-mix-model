import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useNavigation, redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { PUBLIC_APP_STUB, isGoneResponse } from "../lib/public-app-gate.server";
import {
  hasShopifySessionContext,
  isEmbeddedAdminRequest,
} from "../../scripts/shopify-app-path.mjs";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "../components/SpendExplorer";
import { OverviewFirstViewport } from "../components/OverviewFirstViewport";
import { OverviewSectionIndex } from "../components/OverviewSectionIndex";
import { MarketingSnapSection } from "../components/MarketingSnapSection";
import { GoalsSnapSection } from "../components/GoalsSnapSection";
import { ShareOverviewButton } from "../components/ShareOverviewButton";
import {
  buildDashboardMetrics,
  buildSpendExplorerSeries,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { channelFillKey } from "../lib/channel-fill";
import { spendChannelLabel } from "../lib/spend-channel-label";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  shopifyNativePeriodStats,
} from "../lib/shopify-native-stats";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import { formatOverviewShareText } from "../lib/cash-close";
import { formatPeriodDaySpan } from "../lib/desk-history";
import { OVERVIEW_COVERAGE_LINE } from "../lib/overview-first-viewport";
import { spendAddHref } from "../lib/number-honesty";
import {
  loadOverviewGoalPeriods,
} from "../lib/sales-goals.server";
import {
  emptySales,
  type SalesResult,
} from "../lib/shopify-sales.server";
import {
  runSalesFactsBackfill,
  getSalesFactsCoverage,
  getSalesFactsTotals,
  getSalesFactsByDay,
  loadDeskSalesForPeriod,
  type SalesFactsCoverage,
} from "../lib/sales-facts.server";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
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
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { materializeRecurringSpendForShop } from "../lib/spend-recurring.server";
import { shopLocalDayKey } from "../lib/shop-local-day";
import {
  dateKeyFromLocal,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
  explorerQueryMatchingScoreboard,
} from "../lib/spend-explorer";

/** Same resolver the Spend page uses — Billboard must not read "Other" here. */
const channelDisplayLabel = spendChannelLabel;

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
  const preset = parsePeriodPreset(rawPeriod);
  // y3 stays shot-only (listing captures). L12M is a desk preset — do not redirect.
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app?${next.toString()}`);
  }
  const exGran = parseExplorerGranularity(url.searchParams.get("exGran"));
  const exMode = parseExplorerMode(url.searchParams.get("exMode"));
  const exSales = parseExplorerShowSales(url.searchParams.get("exSales"));
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const salesBasis = "total" as const;
  const ianaTimezone = shop.ianaTimezone;
  const now = new Date();
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  await materializeRecurringSpendForShop({
    shopId: shop.id,
    currencyCode: shop.currencyCode,
    ianaTimezone: shop.ianaTimezone,
    sampleOn: useSampleDesk,
  });
  const deskTz = deskPeriodTimeZone(useSampleDesk, ianaTimezone);
  const range = resolvePeriod(preset, now, deskTz);
  const priorRange = resolvePriorPeriod(preset, now, deskTz);

  const exRangeParam = url.searchParams.get("exRange");
  const tiedExplorer = exRangeParam
    ? null
    : explorerQueryMatchingScoreboard(preset, range, deskTz);
  const exRange = exRangeParam
    ? parseExplorerRange(exRangeParam)
    : (tiedExplorer?.range ?? "custom");
  const exFrom = exRangeParam
    ? parseExplorerDateParam(url.searchParams.get("exFrom"))
    : (tiedExplorer?.from ?? null);
  const exTo = exRangeParam
    ? parseExplorerDateParam(url.searchParams.get("exTo"))
    : (tiedExplorer?.to ?? null);

  let sales: SalesResult = emptySales("shopify");
  /** Null when prior facts are outside the window / failed — skip deltas (never fake 0). */
  let priorSales: { totalSales: number } | null = null;
  let salesError: string | null = null;
  let todaySalesUnavailable = false;
  let todaySalesTruncated = false;
  let salesByDay = new Map<string, number>();
  let explorerCustomers = {
    newCustomers: 0,
    returningCustomers: 0,
    customerMetricsAvailable: false,
  };
  let salesFactsCoverageForBanner: SalesFactsCoverage | null = null;
  /** Stamp only after a successful desk load — never before. */
  let salesPulledAt: string | null = null;

  const explorerWindow = resolveExplorerWindow(exRange, now, {
    from: exFrom,
    to: exTo,
    timeZone: deskPeriodTimeZone(useSampleDesk, ianaTimezone),
  });
  const dayFetchRange = {
    start: explorerWindow.start,
    end: explorerWindow.end,
    label: explorerWindow.label,
  };

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
    priorSales = { totalSales: samplePrior.totalSales };
    salesByDay = await fetchSampleSalesByDay(shop.id, dayFetchRange);
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
     * (LIVE_TODAY_MAX_PAGES). Fire-and-forget backfill stays chunked (maxDays: 2).
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

    // Chunked resume only — never full history inside this request.
    if (!mainCoverage.complete || !dayCoverage.complete) {
      void runSalesFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
        // ignore — banners disclose incomplete facts
      });
    }
    // LTV cohort ingest — part of the one desk, chunked so paint stays fast.
    void runOrderFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
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
          : { totalSales: priorFacts.totalSales };
    } catch {
      priorSales = null;
    }

    try {
      salesByDay = await getSalesFactsByDay(shop.id, dayFetchRange);
    } catch {
      salesByDay = new Map();
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
    salesCoverage: salesFactsCoverageForBanner,
  });

  const [explorerSeries, goalPeriods] = await Promise.all([
    buildSpendExplorerSeries(shop.id, {
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
      timeZone: deskPeriodTimeZone(useSampleDesk, ianaTimezone),
    }),
    loadOverviewGoalPeriods(shop.id, ianaTimezone, useSampleDesk, now),
  ]);

  const explorerTz = deskPeriodTimeZone(useSampleDesk, ianaTimezone);
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
    targetMer: explorerSeries.targetMer,
    breakEvenMer: metrics.breakEvenMer,
    showSales: exSales || metrics.totalSpend <= 0,
    fromKey: explorerDayKey(explorerWindow.start),
    toKey: explorerDayKey(explorerWindow.end),
    asOfKey: explorerDayKey(explorerWindow.end),
    channelLabels: explorerSeries.channelLabels,
  };

  const shareTz = deskPeriodTimeZone(useSampleDesk, ianaTimezone);
  const shareDayKey = (instant: Date) =>
    shareTz
      ? shopLocalDayKey(instant, shareTz)
      : instant.toISOString().slice(0, 10);

  return {
    metrics,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    preset,
    useSampleDesk,
    shotMode,
    explorer,
    goalPeriods,
    salesFactsCoverage: salesFactsCoverageForBanner,
    shareSubject:
      !metrics.onboarding.hasSpend && !useSampleDesk
        ? `Shopify sales — ${metrics.period.label}`
        : `Total ROAS — ${metrics.period.label}`,
    sharePeriodStartDay: shareDayKey(metrics.period.start),
    sharePeriodEndDay: shareDayKey(metrics.period.end),
    shopLabel: session.shop,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Overview locks to Shopify Total Sales — sales basis is Settings-only.
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
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
    explorer,
    goalPeriods,
    salesFactsCoverage,
    shareSubject,
    sharePeriodStartDay,
    sharePeriodEndDay,
    shopLabel,
  } = data;
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const spendHref = spendAddHref({ period: preset, shot: shotMode });
  // Never label mock / blocked sales as live Shopify when sample is off.
  // Shot mode may quiet chrome, but never omit SAMPLE when desk is sample.
  const tillLabel = useSampleDesk
    ? `${metrics.period.label}${PRODUCT_NOUN.samplePeriodSuffix}`
    : shotMode
      ? metrics.period.label
      : salesError ||
          metrics.blockedMockAsLive ||
          metrics.salesSource === "mock"
        ? `${metrics.period.label} · sales unavailable`
        : salesFactsCoverage != null &&
            !salesFactsCoverage.complete &&
            !salesFactsCoverage.periodExceedsFactWindow
          ? `${metrics.period.label}${PRODUCT_NOUN.factsIncompleteSuffix}`
          : `${metrics.period.label} · live sales`;
  const freshLabel = formatCashFreshnessChip({
    useSampleDesk,
    salesPulledAt: metrics.freshness.salesPulledAt,
    lastAt: metrics.freshness.lastAt,
    source: metrics.freshness.source,
    spendUpdatedAt: metrics.freshness.spendUpdatedAt,
  });
  /** Margin is optional (BE only). Total ROAS never waits on Settings margin. */
  const marginBlocked = false;
  /** Live install, no spend yet — still paint sales; Total ROAS stays —. */
  const spendBlocked =
    !metrics.onboarding.hasSpend && !useSampleDesk && !shotMode;
  /** Both missing: one empty with Settings primary (do not let spend swallow margin). */
  const bothBlockedEmpty = marginBlocked && spendBlocked;
  /** Spend missing, margin OK — hero still shows sales. */
  const spendOnlyEmpty = spendBlocked && !marginBlocked;
  /** Margin missing, spend present — empty owns the body; scoreboard waits. */
  const marginOnlyEmpty = marginBlocked && !spendBlocked;
  const coldEmpty = marginOnlyEmpty || bothBlockedEmpty;
  // Never paint Total ROAS scoreboard from emptySales zeros after a load failure.
  // Missing spend is $0 + — ratio, not a hidden scoreboard.
  const scoreboardReady =
    !marginBlocked && !salesError;

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
  const periodChannels = [...metrics.channelMix]
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((entry) => {
      const name = channelDisplayLabel({
        channel: entry.channel,
        customLabel: entry.customLabel,
      });
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
    totalSales: totalSalesDisplay,
    totalSpend: metrics.totalSpend,
    mer: metrics.mer,
    breakEvenMer: metrics.breakEvenMer,
    marginPct: metrics.marginPct,
    spendIncomplete: Boolean(metrics.spendCoverage?.incomplete),
    salesPending: metrics.salesPending,
    shopLabel,
    channels: periodChannels,
    salesDeltaLine,
    spendDeltaLine,
  });

  const trustBanners = (
    <CashTrustBanners
      blockedMockAsLive={Boolean(metrics.blockedMockAsLive)}
      spendCoverage={
        !useSampleDesk && metrics.onboarding.hasSpend
          ? metrics.spendCoverage
          : null
      }
      periodLabel={metrics.period.label}
      shopifyOrderWindowLimited={
        !useSampleDesk &&
        (Boolean(salesFactsCoverage?.periodExceedsFactWindow) ||
          periodMayExceedShopifyOrderWindow(metrics.period))
      }
      salesFactsIncomplete={
        !useSampleDesk &&
        (metrics.orderCount > 0 || metrics.sales > 0) &&
        salesFactsCoverage != null &&
        !salesFactsCoverage.complete &&
        !salesFactsCoverage.periodExceedsFactWindow
          ? {
              factDays: salesFactsCoverage.factDays,
              expectedClosedDays: salesFactsCoverage.expectedClosedDays,
            }
          : null
      }
      todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
      todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}
      shotMode={shotMode}
      cashActionReady={metrics.cashActionReady}
      spendRecon={
        !useSampleDesk && metrics.onboarding.hasSpend
          ? metrics.spendRecon
          : null
      }
      belowBreakEven={
        metrics.cashActionReady &&
        metrics.breakEvenMer != null &&
        metrics.aboveBreakEven === false
          ? {
              mer: metrics.mer,
              breakEvenMer: metrics.breakEvenMer,
              totalSpend: metrics.totalSpend,
            }
          : null
      }
      marginStale={!useSampleDesk && Boolean(metrics.marginStale)}
      onboarding={
        !useSampleDesk &&
        !shotMode &&
        !marginBlocked &&
        !spendBlocked
          ? {
              settingsSaved: metrics.onboarding.settingsSaved,
              hasSpend: metrics.onboarding.hasSpend,
            }
          : null
      }
    />
  );

  return (
    <s-page heading={PRODUCT_NOUN.overviewTitle} inlineSize="large">
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

        {/* Cold path: trust can sit above the one empty. Live ready: defer below KPIs. */}
        {coldEmpty || (!scoreboardReady && !useSampleDesk)
          ? trustBanners
          : null}

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing sales for this period…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
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
            <span className="mcfly-ctx__asof">{tillLabel}</span>
            <PeriodControl preset={preset} shotMode={shotMode} />
          </div>
          <div className="mcfly-ctx__chips">
            <span
              className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-ctx-chip--fresh"
              title={freshLabel}
            >
              {freshLabel}
            </span>
          </div>
        </div>

        {!marginBlocked ? (
          <>
            {scoreboardReady ? (
              <section
                className="mcfly-hero-compact mcfly-hero-compact--v2 mcfly-hero-compact--live-lead"
                aria-label="Shopify sales this period"
              >
                <div className="mcfly-hero-compact__pair">
                  <div className="mcfly-hero-compact__tile mcfly-hero-compact__tile--sales mcfly-hero-compact__tile--lead">
                    <p className="mcfly-hero-compact__label">
                      Shopify Total Sales
                    </p>
                    <p className="mcfly-hero-compact__value">
                      {metrics.salesPending
                        ? "—"
                        : formatCurrency(totalSalesDisplay)}
                    </p>
                    <p className="mcfly-hero-compact__meta">
                      {metrics.salesPending
                        ? "Still loading closed days — not $0"
                        : formatPeriodDaySpan(
                            sharePeriodStartDay,
                            sharePeriodEndDay,
                          )}
                    </p>
                    {metrics.salesPending ? null : (
                      <p className="mcfly-hero-compact__meta">
                        {OVERVIEW_COVERAGE_LINE}
                      </p>
                    )}
                    <p className="mcfly-hero-compact__meta">{salesDeltaLine}</p>
                    {!shotMode ? (
                      <div className="mcfly-hero-compact__actions">
                        <ShareOverviewButton
                          subject={shareSubject}
                          body={shareText}
                          enabled={scoreboardReady}
                          compact
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {scoreboardReady ? (
              <OverviewFirstViewport
                orderCount={metrics.orderCount}
                typicalOrder={metrics.shopifyDepth.medianAov}
                meanAov={metrics.shopifyDepth.meanAov ?? shopBook.aov}
                returningSalesShare={shopBook.returningSalesShare}
                medianDaysToSecond={metrics.shopifyDepth.medianDaysToSecond}
                discountedOrderShare={metrics.shopifyDepth.discountedOrderShare}
                salesPending={metrics.salesPending}
                spendEmpty={!metrics.onboarding.hasSpend && !useSampleDesk}
              />
            ) : null}

            {!shotMode && scoreboardReady ? (
              <>
                <OverviewSectionIndex preset={preset} />
                <div
                  className="mcfly-tab-snaps mcfly-tab-snaps--below"
                  aria-label="Goals and marketing"
                >
                  <GoalsSnapSection periods={goalPeriods} />
                  <MarketingSnapSection
                    spendOnlyEmpty={spendOnlyEmpty}
                    spendHref={spendHref}
                    preset={preset}
                    totalSales={totalSalesDisplay}
                    totalSpend={metrics.totalSpend}
                    mer={metrics.mer}
                    targetMer={metrics.targetMer}
                    periodLabel={metrics.period.label}
                    salesPending={metrics.salesPending}
                    merDeltaLine={merDeltaLine}
                    spendDeltaLine={spendDeltaLine}
                    periodChannels={periodChannels}
                  />
                </div>
              </>
            ) : null}

            <div className="mcfly-me-spine">
              <SpendExplorer
                series={explorer}
                period={preset}
                shotMode={shotMode}
              />
            </div>

            {!coldEmpty ? trustBanners : null}

            {!shotMode && scoreboardReady ? (
              <p className="mcfly-overview-more" aria-label="More tools">
                <s-link href={`/app/orders?period=${preset}`}>
                  {PRODUCT_NOUN.ordersTitle}
                </s-link>
                {" · "}
                <s-link href={`/app/buyers?period=${preset}`}>
                  {PRODUCT_NOUN.buyersTitle}
                </s-link>
                {" · "}
                <s-link href={`/app/timing?period=${preset}`}>
                  {PRODUCT_NOUN.timingTitle}
                </s-link>
                {" · "}
                <s-link href="/app/goals">Goals</s-link>
                {" · "}
                <s-link href={spendHref}>{PRODUCT_NOUN.marketingSection}</s-link>
                {" · "}
                <s-link href="/app/settings">Settings</s-link>
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </s-page>
  );
}


export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
