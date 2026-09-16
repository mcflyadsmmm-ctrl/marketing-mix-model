import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useLocation, useNavigation, useSearchParams, redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { PUBLIC_APP_STUB, isGoneResponse } from "../lib/public-app-gate.server";
import {
  hasShopifySessionContext,
  isEmbeddedAdminRequest,
} from "../../scripts/shopify-app-path.mjs";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { OverviewYoyCards } from "../components/OverviewYoyCards";
import { OverviewFirstViewport } from "../components/OverviewFirstViewport";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import { ShareOverviewButton } from "../components/ShareOverviewButton";
import { useDeskHashScroll } from "../components/useDeskHashScroll";
import {
  buildDailyRowsForWindow,
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { buildCashControlBoard } from "../lib/mer-control";
import { buildOverviewYoyCards } from "../lib/overview-yoy";
import { channelFillKey } from "../lib/channel-fill";
import { spendChannelLabel } from "../lib/spend-channel-label";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  DESK_SECTION,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isOverviewHomeStage,
} from "../lib/desk-nav";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import { formatOverviewShareText } from "../lib/cash-close";
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
import {
  getOrderBackfillProgress,
  runOrderFactsBackfill,
} from "../lib/order-facts.server";
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
  isLiveHandoffGuide,
  LIVE_HANDOFF_BODY,
  LIVE_HANDOFF_HEADING,
} from "../lib/sample-live-handoff";

/** Same resolver the Spend page uses — Billboard must not read "Other" here. */
const channelDisplayLabel = spendChannelLabel;

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
  let priorSales: { totalSales: number } | null = null;
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
    priorSales = { totalSales: samplePrior.totalSales };
    salesByDay = await fetchSampleSalesByDay(shop.id, dayFetchRange);
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

  let cashControl: ReturnType<typeof buildCashControlBoard> | null = null;
  if (!metrics.salesPending) {
    try {
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
      const controlSalesByDay = useSampleDesk
        ? await fetchSampleSalesByDay(shop.id, controlRange)
        : await getSalesFactsByDay(shop.id, controlRange);
      const { rows: controlRows } = await buildDailyRowsForWindow(shop.id, {
        sampleOnly: useSampleDesk,
        excludeSample: !useSampleDesk,
        salesByDay: controlSalesByDay,
        windowStart: controlRange.start,
        windowEnd: controlRange.end,
        timeZone: deskTz,
      });
      const board = buildCashControlBoard(controlRows, metrics.targetMer);
      cashControl = board.chips.length > 0 ? board : null;
    } catch {
      cashControl = null;
    }
  }

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
    cashControl,
    salesFactsCoverage: salesFactsCoverageForBanner,
    orderBackfillProgress,
    shareSubject:
      !metrics.onboarding.hasSpend && !useSampleDesk
        ? `Shopify sales — ${metrics.period.label}`
        : `Total ROAS — ${metrics.period.label}`,
    sharePeriodStartDay: shareDayKey(metrics.period.start),
    sharePeriodEndDay: shareDayKey(metrics.period.end),
    shopLabel: session.shop,
    salesDays: [...salesByDay.entries()]
      .map(([dateKey, sales]) => ({ dateKey, sales }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Overview locks to Shopify Total Sales — sales basis is Settings-only.
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  useDeskHashScroll();
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
  } = data;
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const stage = shotMode
    ? DESK_SECTION.overview
    : deskStageFromHash(location.hash);
  const onHome = isOverviewHomeStage(stage);
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
            !salesFactsCoverage.periodExceedsFactWindow &&
            !(metrics.sales > 0)
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
  const bothBlockedEmpty = marginBlocked && spendBlocked;
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
    typicalOrder: metrics.shopifyDepth.medianAov,
    returningSalesShare: shopBook.returningSalesShare,
    weekendSalesShare: metrics.shopifyDepth.weekendSalesShare,
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
      orderFactsTruncated={
        !useSampleDesk && Boolean(orderBackfillProgress?.truncated)
      }
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
  const spendHref = deskNavHrefFromSearch("/app/spend", searchParams);
  const roasHref = deskNavHrefFromSearch("/app/roas", searchParams);
  const goalsHref = deskNavHrefFromSearch("/app/goals", searchParams);
  const settingsHref = deskNavHrefFromSearch("/app/settings", searchParams);
  const yoyHref = deskNavHrefFromSearch("/app/yoy", searchParams);
  const showLiveHandoff =
    !useSampleDesk && !shotMode && isLiveHandoffGuide(searchParams.get("guide"));
  const eomMer =
    cashControl?.dualClose?.l7Close.projMer ??
    cashControl?.dualClose?.mtdFlat.projMer ??
    null;
  const coveragePct = metrics.spendCoverage?.coveragePct;
  const recon = metrics.spendRecon;

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
            <s-paragraph>
              {LIVE_HANDOFF_BODY}{" "}
              <s-link href={spendHref}>Add a day on Spend Upload</s-link>
              {" · "}
              <s-link href={settingsHref}>Start 7-day trial in Settings</s-link>
            </s-paragraph>
          </s-banner>
        ) : null}

        {/* Cold path: trust can sit above the one empty. Live ready: defer below KPIs. */}
        {coldEmpty || (!scoreboardReady && !useSampleDesk)
          ? trustBanners
          : null}

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing sales…</p>
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
            <span className="mcfly-ctx__brand">{shopBrand}</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-trust" aria-label="Trust and freshness">
            {coveragePct != null && metrics.totalSpend > 0 ? (
              <span className="mcfly-trust__chip mcfly-trust__chip--ok">
                Coverage {Math.round(coveragePct)}%
              </span>
            ) : null}
            {recon?.status === "ok" && recon.deltaPct != null ? (
              <span className="mcfly-trust__chip mcfly-trust__chip--ok">
                Recon ±{Math.abs(recon.deltaPct * 100).toFixed(1)}%
              </span>
            ) : null}
            {metrics.marginPct > 0 ? (
              <span className="mcfly-trust__chip mcfly-trust__chip--ok">
                Margin {Math.round(metrics.marginPct * 100)}%
              </span>
            ) : null}
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
                className="mcfly-desk-anchor"
                id={DESK_SECTION.overview}
              >
                <OverviewYoyCards
                  cards={buildOverviewYoyCards(cashControl?.chips ?? [])}
                  salesPending={metrics.salesPending}
                  yoyHref={yoyHref}
                />
                <OverviewFirstViewport
                  totalSales={totalSalesDisplay}
                  periodLabel={metrics.period.label}
                  orderCount={metrics.orderCount}
                  typicalOrder={metrics.shopifyDepth.medianAov}
                  meanAov={
                    metrics.orderCount > 0
                      ? metrics.sales / metrics.orderCount
                      : null
                  }
                  returningSalesShare={shopBook.returningSalesShare}
                  returningSales={shopBook.returningSales}
                  newCustomers={metrics.newCustomers}
                  medianDaysToSecond={metrics.shopifyDepth.medianDaysToSecond}
                  discountedOrderShare={
                    metrics.shopifyDepth.discountedOrderShare
                  }
                  weekendSalesShare={metrics.shopifyDepth.weekendSalesShare}
                  salesPending={metrics.salesPending}
                  spendEmpty={!metrics.onboarding.hasSpend && !useSampleDesk}
                  totalSpend={metrics.totalSpend}
                  mer={metrics.mer}
                  breakEvenMer={metrics.breakEvenMer}
                  targetMer={metrics.targetMer}
                  eomMer={eomMer}
                  salesDelta={salesDeltaLine}
                  spendDelta={spendDeltaLine}
                  grossSales={metrics.grossSales}
                  grossSalesKnown={metrics.grossSalesKnown}
                  ordersHref={ordersHref}
                  spendHref={spendHref}
                  roasHref={roasHref}
                  goalsHref={goalsHref}
                  settingsHref={settingsHref}
                  useSampleDesk={useSampleDesk}
                  share={shareButton}
                />
                <OverviewSalesChart days={salesDays} ordersHref={ordersHref} />
                {!metrics.salesPending ? (
                  <footer className="mcfly-book__links">
                    <s-link href={deskNavHrefFromSearch("/app/customers", searchParams)}>
                      {PRODUCT_NOUN.buyersTitle}
                    </s-link>
                    <s-link href={deskNavHrefFromSearch("/app/growth", searchParams)}>
                      {PRODUCT_NOUN.growthTitle}
                    </s-link>
                    <s-link href={ordersHref}>
                      {PRODUCT_NOUN.ordersTitle}
                    </s-link>
                    <s-link href={deskNavHrefFromSearch("/app/ltv", searchParams)}>
                      {PRODUCT_NOUN.openLtv}
                    </s-link>
                  </footer>
                ) : null}
              </div>
            ) : null}

            {!coldEmpty && onHome ? trustBanners : null}
          </>
        ) : null}
      </div>
    </s-page>
  );
}


export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
