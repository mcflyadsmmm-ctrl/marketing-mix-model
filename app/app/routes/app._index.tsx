import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useNavigation, redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CashTrustBanners } from "../components/CashTrustBanners";
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
} from "../lib/mer-dashboard.server";
import { channelFillKey } from "../lib/channel-fill";
import { spendChannelLabel } from "../lib/spend-channel-label";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import { formatOverviewShareText } from "../lib/cash-close";
import { ShareOverviewButton } from "../components/ShareOverviewButton";
import { TotalRoasGauge } from "../components/TotalRoasGauge";
import { NumberHonestyPanel } from "../components/NumberHonestyPanel";
import {
  NUMBER_HONESTY,
  spendAddHref,
} from "../lib/number-honesty";
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
  resolvePeriod,
  resolvePriorPeriod,
  type PeriodPreset,
} from "../lib/periods";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { shopLocalDayKey } from "../lib/shop-local-day";
import {
  dateKeyFromLocal,
  defaultExplorerGranularity,
  explorerQueryMatchingScoreboard,
  explorerShowSalesDefault,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMark,
  parseExplorerMode,
  parseExplorerRange,
  resolveExplorerWindow,
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
  const { admin, session } = await authenticate.admin(request);
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
  const exMode = parseExplorerMode(url.searchParams.get("exMode"));
  const exMark = parseExplorerMark(url.searchParams.get("exMark"));
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const salesBasis = "total" as const;
  const ianaTimezone = shop.ianaTimezone;
  const now = new Date();
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
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
  const granParam = url.searchParams.get("exGran");
  const exGran = granParam
    ? parseExplorerGranularity(granParam)
    : defaultExplorerGranularity(exRange);
  const exSales = explorerShowSalesDefault(url.searchParams.get("exSales"));
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
    timeZone: deskPeriodTimeZone(useSampleDesk, ianaTimezone),
  });

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
    showSales: exSales,
    mark: exMark,
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
    salesFactsCoverage: salesFactsCoverageForBanner,
    shareSubject: `Total ROAS — ${metrics.period.label}`,
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
  const {
    metrics,
    preset,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    useSampleDesk,
    shotMode,
    explorer,
    salesFactsCoverage,
    shareSubject,
    sharePeriodStartDay,
    sharePeriodEndDay,
    shopLabel,
  } = useLoaderData<typeof loader>();
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
  /** Live install, no spend yet — Polaris Empty owns the body; scoreboard waits. */
  const spendBlocked =
    !metrics.onboarding.hasSpend && !useSampleDesk && !shotMode;
  /** Both missing: one empty with Settings primary (do not let spend swallow margin). */
  const bothBlockedEmpty = marginBlocked && spendBlocked;
  /** Spend missing, margin OK. */
  const spendOnlyEmpty = spendBlocked && !marginBlocked;
  /** Margin missing, spend present — empty owns the body; scoreboard waits. */
  const marginOnlyEmpty = marginBlocked && !spendBlocked;
  const coldEmpty = marginOnlyEmpty || bothBlockedEmpty || spendOnlyEmpty;
  // Never paint Total ROAS scoreboard from emptySales zeros after a load failure.
  const scoreboardReady =
    !spendBlocked && !marginBlocked && !salesError;

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
  /*
   * Budget share this period vs last, in percentage points. Where the money
   * went — never a claim about which channel caused the sale.
   */
  const mixDeltaByChannel = new Map(
    metrics.mixVsPrior
      .filter((row) => row.priorAmount > 0 || row.amount > 0)
      .map((row) => [row.channel, row]),
  );
  const hasPriorMix = metrics.mixVsPrior.some((row) => row.priorAmount > 0);
  const periodChannels = [...metrics.channelMix]
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((entry) => {
      const name = channelDisplayLabel({
        channel: entry.channel,
        customLabel: entry.customLabel,
      });
      const delta = hasPriorMix
        ? (mixDeltaByChannel.get(name)?.deltaPp ?? null)
        : null;
      return {
        name,
        amount: entry.amount,
        share: entry.share,
        fill: channelFillKey(name),
        deltaPp: delta,
      };
    });
  /** Sales minus the ads that ran alongside them — cash, not attribution. */
  const cashLeftAfterAds = metrics.salesPending
    ? null
    : totalSalesDisplay - metrics.totalSpend;

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
        Boolean(salesFactsCoverage?.periodExceedsFactWindow)
      }
      /*
       * Only once spend is on the desk. Before that the layout setup card is
       * already the one thing to read, and stacking a second sync banner on a
       * fresh install is what made the first session look broken.
       */
      salesFactsIncomplete={
        !useSampleDesk &&
        metrics.onboarding.hasSpend &&
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
    <s-page heading={PRODUCT_NOUN.deskTitle} inlineSize="large">
      {!shotMode ? (
        useSampleDesk ? (
          <s-button
            slot="primary-action"
            variant="primary"
            href={spendHref}
            aria-label="See sample spend mix"
          >
            See spend mix
          </s-button>
        ) : metrics.cashActionReady ? (
          <s-button
            slot="primary-action"
            variant="primary"
            href={spendHref}
            aria-label="Update spend"
          >
            Update spend
          </s-button>
        ) : marginBlocked ? (
          <s-button
            slot="primary-action"
            variant="primary"
            href="/app/settings"
            aria-label={PRODUCT_NOUN.setupAdjustMargin}
          >
            {PRODUCT_NOUN.setupAdjustMargin}
          </s-button>
        ) : (
          <s-button
            slot="primary-action"
            variant="primary"
            href={spendHref}
            aria-label={PRODUCT_NOUN.setupAddSpend}
          >
            {PRODUCT_NOUN.setupAddSpend}
          </s-button>
        )
      ) : null}
      <div
        className={[
          "mcfly-desk",
          shotMode ? "mcfly-desk--shot" : null,
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

        {/* Cold path: trust can sit above the one empty. Live ready: defer below KPIs. */}
        {coldEmpty || (!scoreboardReady && !useSampleDesk)
          ? trustBanners
          : null}

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

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">{PRODUCT_NOUN.deskTitle}</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
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
            {!shotMode && scoreboardReady ? (
              <s-link href={spendHref}>Update spend</s-link>
            ) : null}
            {metrics.spendCoverage?.incomplete &&
            !shotMode &&
            !useSampleDesk &&
            scoreboardReady ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-eq__meta--trust">
                Add more days of spend
              </span>
            ) : null}
          </div>
        </div>

        {marginOnlyEmpty ? (
          <div className="mcfly-cold-empty">
            <s-section accessibilityLabel="Empty state — set profit margin for break-even">
              <s-grid gap="base" justifyItems="center" paddingBlock="base">
                <s-grid justifyItems="center" maxInlineSize="420px" gap="base">
                  <s-stack alignItems="center">
                    <s-heading>Lock break-even</s-heading>
                    <s-paragraph>
                      Sales and spend are ready. Confirm profit margin — then read{" "}
                      {PRODUCT_NOUN.totalRoas} vs that line.
                    </s-paragraph>
                  </s-stack>
                  <s-button
                    variant="primary"
                    href="/app/settings"
                    aria-label={PRODUCT_NOUN.setupAdjustMargin}
                  >
                    {PRODUCT_NOUN.setupAdjustMargin}
                  </s-button>
                  <p className="mcfly-cold-empty__foot">
                    <s-link href="/app/spend">Review logged spend</s-link>
                  </p>
                </s-grid>
              </s-grid>
            </s-section>
          </div>
        ) : null}

        {bothBlockedEmpty ? (
          <div className="mcfly-cold-empty">
            <s-section
              accessibilityLabel={`Empty state — set profit margin for ${PRODUCT_NOUN.totalRoas}`}
            >
              <s-grid gap="base" justifyItems="center" paddingBlock="base">
                <s-grid justifyItems="center" maxInlineSize="420px" gap="base">
                  <s-stack alignItems="center">
                    <s-heading>Get {PRODUCT_NOUN.totalRoas} in ~10 minutes</s-heading>
                    <s-paragraph>
                      {NUMBER_HONESTY.empty} Sales are already in. Margin is
                      optional for break-even.
                    </s-paragraph>
                  </s-stack>
                  <s-button
                    variant="primary"
                    href={spendHref}
                    aria-label={PRODUCT_NOUN.setupAddSpend}
                  >
                    {PRODUCT_NOUN.setupAddSpend}
                  </s-button>
                  <p className="mcfly-cold-empty__foot">
                    Next: <s-link href={spendHref}>{PRODUCT_NOUN.setupAddSpend}</s-link>
                    {" · "}
                    Switch to Sample data at the top for example numbers
                  </p>
                </s-grid>
              </s-grid>
            </s-section>
          </div>
        ) : null}

        {spendOnlyEmpty ? (
          <div className="mcfly-cold-empty">
            <s-section
              accessibilityLabel={`Empty state — add spend for ${PRODUCT_NOUN.totalRoas}`}
            >
              <s-grid gap="base" justifyItems="center" paddingBlock="base">
                <s-grid justifyItems="center" maxInlineSize="420px" gap="base">
                  <s-stack alignItems="center">
                    <s-heading>{PRODUCT_NOUN.setupAddSpend}</s-heading>
                    <s-paragraph>
                      {NUMBER_HONESTY.empty} {NUMBER_HONESTY.invoiceHint}
                    </s-paragraph>
                  </s-stack>
                  <s-button
                    variant="primary"
                    href={spendHref}
                    aria-label={PRODUCT_NOUN.setupAddSpend}
                  >
                    {PRODUCT_NOUN.setupAddSpend}
                  </s-button>
                  <p className="mcfly-cold-empty__foot">
                    Want example numbers first? Switch to Sample data at the top.
                  </p>
                </s-grid>
              </s-grid>
            </s-section>
          </div>
        ) : null}

        {/* Wave 2: Polaris empties own TTFV — hide 3-step guide while empties show. */}
        {metrics.onboarding.showGuide &&
        !shotMode &&
        !marginOnlyEmpty &&
        !bothBlockedEmpty &&
        !spendOnlyEmpty ? (
          <section className="mcfly-guide" aria-label={`First ${PRODUCT_NOUN.totalRoas} setup`}>
            <div className="mcfly-guide__head">
              <p className="mcfly-guide__title">
                First {PRODUCT_NOUN.totalRoas} in under 10 minutes
              </p>
              <p className="mcfly-guide__sub">
                Sales load automatically. Set a Total ROAS target, add spend,
                then read sales ÷ spend. Profit margin is optional for
                break-even.
              </p>
            </div>
            <ol className="mcfly-guide__steps">
              <li className="mcfly-guide__step mcfly-guide__step--done">
                <span className="mcfly-guide__n" aria-hidden="true">
                  ✓
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">
                    Set Total ROAS target
                  </p>
                  <p className="mcfly-guide__step-copy">
                    Operating goal (e.g. 4.0×). Margin is optional — only if you
                    want break-even.
                  </p>
                  <p className="mcfly-guide__step-state">
                    Target {formatMer(metrics.targetMer)}
                    {metrics.breakEvenMer != null
                      ? ` · break-even ${formatMer(metrics.breakEvenMer)}`
                      : " · margin optional"}
                  </p>
                  <s-button href="/app/settings" variant="tertiary">
                    Open Settings
                  </s-button>
                </div>
              </li>
              <li
                className={
                  metrics.onboarding.hasSpend
                    ? "mcfly-guide__step mcfly-guide__step--done"
                    : "mcfly-guide__step"
                }
              >
                <span className="mcfly-guide__n" aria-hidden="true">
                  {metrics.onboarding.hasSpend ? "✓" : "2"}
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">
                    {PRODUCT_NOUN.setupAddSpend}
                  </p>
                  <p className="mcfly-guide__step-copy">
                    Type one day’s invoice (any platform, including billboards).
                    CSV is only for many days. No ad-network logins.
                  </p>
                  {metrics.onboarding.hasSpend ? (
                    <p className="mcfly-guide__step-state">
                      Logged · {formatCurrency(metrics.totalSpend)} this period
                    </p>
                  ) : (
                    <s-button href={spendHref} variant="primary">
                      {PRODUCT_NOUN.setupAddSpend}
                    </s-button>
                  )}
                </div>
              </li>
              <li className="mcfly-guide__step">
                <span className="mcfly-guide__n" aria-hidden="true">
                  3
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">
                    Read Total ROAS — share if you want
                  </p>
                  <p className="mcfly-guide__step-copy">
                    See sales ÷ spend vs break-even. Share Overview emails or
                    copies the summary yourself — Mcfly does not send mail.
                  </p>
                  <s-button href="/app" variant="secondary">
                    {PRODUCT_NOUN.openTotalRoas}
                  </s-button>
                </div>
              </li>
            </ol>
            <p className="mcfly-guide__foot">
              Want example numbers first? Switch to Sample data at the top.
            </p>
          </section>
        ) : null}

        {!spendBlocked && !marginBlocked ? (
          <>
            {scoreboardReady ? (
              <section
                className="mcfly-hero-compact mcfly-hero-compact--v2"
                aria-label={`${PRODUCT_NOUN.totalRoas} snapshot`}
              >
                <div className="mcfly-hero-compact__status mcfly-hero-compact__status--gauge">
                  <TotalRoasGauge
                    mer={metrics.mer}
                    targetMer={metrics.targetMer}
                    deltaLine={merDeltaLine}
                  />
                  <div className="mcfly-hero-compact__actions">
                    <s-button href="/app/goals" variant="secondary">
                      {PRODUCT_NOUN.setupSetGoals}
                    </s-button>
                    <s-button
                      href={spendHref}
                      variant="primary"
                    >
                      Update spend
                    </s-button>
                    <ShareOverviewButton
                      subject={shareSubject}
                      body={shareText}
                      enabled={!shotMode && scoreboardReady}
                      compact
                    />
                  </div>
                </div>
                <div className="mcfly-hero-compact__pair">
                  <div className="mcfly-hero-compact__tile mcfly-hero-compact__tile--sales">
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
                        : PRODUCT_NOUN.totalSalesHeroHint}
                    </p>
                    <p className="mcfly-hero-compact__meta">{salesDeltaLine}</p>
                    <p className="mcfly-hero-compact__cashleft">
                      <span>Cash left after ads</span>
                      <strong
                        className={
                          cashLeftAfterAds != null && cashLeftAfterAds < 0
                            ? "mcfly-hero-compact__cashleft-neg"
                            : undefined
                        }
                      >
                        {cashLeftAfterAds == null
                          ? "—"
                          : formatCurrency(cashLeftAfterAds)}
                      </strong>
                    </p>
                  </div>
                  <div className="mcfly-hero-compact__tile mcfly-hero-compact__tile--spend">
                    <p className="mcfly-hero-compact__label">Total Spend</p>
                    <p className="mcfly-hero-compact__value">
                      {formatCurrency(metrics.totalSpend)}
                    </p>
                    <p className="mcfly-hero-compact__meta">
                      {metrics.period.label} · Spend you added
                    </p>
                    {spendDeltaLine ? (
                      <p className="mcfly-hero-compact__meta">{spendDeltaLine}</p>
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
                              {entry.deltaPp != null &&
                              Math.abs(entry.deltaPp) >= 1 ? (
                                <span
                                  className={`mcfly-kpi-channels__pp${
                                    entry.deltaPp > 0
                                      ? " mcfly-kpi-channels__pp--up"
                                      : " mcfly-kpi-channels__pp--down"
                                  }`}
                                  title={`Budget share vs ${priorLabel ?? "prior period"}`}
                                >
                                  {" "}
                                  {entry.deltaPp > 0 ? "+" : "−"}
                                  {Math.abs(Math.round(entry.deltaPp))}pp
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mcfly-hero-compact__meta">
                        No channel spend in this period
                      </p>
                    )}
                    <p className="mcfly-hero-compact__meta">
                      {hasPriorMix
                        ? "Share of budget vs prior period — where the money went, not who caused the sale"
                        : "Share of budget — where the money went, not who caused the sale"}
                    </p>
                    <p className="mcfly-hero-compact__dive">
                      <s-link href={spendHref}>
                        Update spend
                      </s-link>
                      {" · "}
                      <s-link href={`/app/allocation?period=${preset}`}>
                        {PRODUCT_NOUN.spendAllocation}
                      </s-link>
                    </p>
                  </div>
                </div>
                <NumberHonestyPanel
                  sales={totalSalesDisplay}
                  spend={metrics.totalSpend}
                  mer={metrics.mer}
                  periodLabel={metrics.period.label}
                  salesPending={metrics.salesPending}
                />
              </section>
            ) : null}

            {/* LTV snapshot — Spend + mix live in the Total Spend tile above */}
            {!shotMode && scoreboardReady ? (
              <div className="mcfly-tab-snaps mcfly-tab-snaps--solo" aria-label="Tab snapshots">
                <LtvSnapSection
                  tillLtv={metrics.tillLtv}
                  preset={preset}
                />
              </div>
            ) : null}

            <div className="mcfly-me-spine">
              <div className="mcfly-explorer-csv-bar">
                <s-button
                  href={spendHref}
                  variant="primary"
                >
                  Update spend
                </s-button>
                <span className="mcfly-explorer-csv-bar__hint">
                  Add a day’s invoice — CSV only if you have many days
                </span>
              </div>
              <SpendExplorer
                series={explorer}
                period={preset}
                shotMode={shotMode}
              />
            </div>

            {!coldEmpty ? trustBanners : null}

            {!shotMode ? (
              <p className="mcfly-overview-more" aria-label="More tools">
                <s-link href="/app/spend">Spend</s-link>
                {" · "}
                <s-link href={`/app/allocation?period=${preset}`}>
                  {PRODUCT_NOUN.spendAllocation}
                </s-link>
                {" · "}
                <s-link href={`/app/advanced?period=${preset}`}>
                  {PRODUCT_NOUN.advancedMetrics}
                </s-link>
                {" · "}
                <s-link href="/app/goals">Goals</s-link>
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

function LtvSnapSection({
  tillLtv,
  preset,
}: {
  tillLtv: {
    available: boolean;
    emptyReason: string | null;
    cashCac: number | null;
    avgRevenueD30: number | null;
    avgRevenueD90: number | null;
    ltvCacRatio: number | null;
    newBuyers: number;
    paybackDays: number | null;
  };
  preset: PeriodPreset;
}) {
  return (
    <section
      className="mcfly-tab-snap mcfly-tab-snap--ltv"
      aria-label={`${PRODUCT_NOUN.ltvTitle} snapshot`}
    >
      <div className="mcfly-tab-snap__head">
        <h2>{PRODUCT_NOUN.ltvTitle}</h2>
        <p className="mcfly-tab-snap__muted">
          Cash CAC · LTV · LTV:CAC
        </p>
      </div>

      {tillLtv.available ? (
        <>
          <div className="mcfly-tab-snap__tiles">
            <div className="mcfly-tab-snap__tile">
              <p className="mcfly-tab-snap__tile-k">Cash CAC</p>
              <p className="mcfly-tab-snap__tile-v">
                {tillLtv.cashCac != null
                  ? formatCurrency(tillLtv.cashCac)
                  : "—"}
              </p>
              <p className="mcfly-tab-snap__tile-def">
                {PRODUCT_NOUN.cashCacDef}
              </p>
            </div>
            <div className="mcfly-tab-snap__tile">
              <p className="mcfly-tab-snap__tile-k">LTV · 90d</p>
              <p className="mcfly-tab-snap__tile-v">
                {tillLtv.avgRevenueD90 != null
                  ? formatCurrency(tillLtv.avgRevenueD90)
                  : "—"}
              </p>
              <p className="mcfly-tab-snap__tile-def">
                {PRODUCT_NOUN.ltv90Def}
              </p>
            </div>
            <div className="mcfly-tab-snap__tile">
              <p className="mcfly-tab-snap__tile-k">LTV : CAC</p>
              <p
                className={`mcfly-tab-snap__tile-v${
                  tillLtv.ltvCacRatio != null && tillLtv.ltvCacRatio >= 1
                    ? " mcfly-tab-snap__tile-v--good"
                    : tillLtv.ltvCacRatio != null
                      ? " mcfly-tab-snap__tile-v--bad"
                      : ""
                }`}
              >
                {tillLtv.ltvCacRatio != null
                  ? `${tillLtv.ltvCacRatio.toFixed(2)}×`
                  : "—"}
              </p>
              <p className="mcfly-tab-snap__tile-def">
                {PRODUCT_NOUN.ltvCacDef}
              </p>
            </div>
          </div>
          <p className="mcfly-tab-snap__sentence">
            {tillLtv.cashCac != null &&
            tillLtv.avgRevenueD90 != null &&
            tillLtv.cashCac > 0
              ? `At 90d, new customers return ${formatCurrency(tillLtv.avgRevenueD90)} per ${formatCurrency(tillLtv.cashCac)} Cash CAC.`
              : tillLtv.newBuyers > 0
                ? `${tillLtv.newBuyers.toLocaleString()} new customers · open for cohorts`
                : "Open for cohort windows and history coverage."}
          </p>
          {tillLtv.paybackDays != null ? (
            <p className="mcfly-tab-snap__muted">
              Cash CAC recovered in ~{tillLtv.paybackDays}d on average
            </p>
          ) : tillLtv.avgRevenueD30 != null ? (
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
              ? `Order history is limited — open ${PRODUCT_NOUN.ltvTitle} for coverage.`
              : `Backfilling cohorts — open ${PRODUCT_NOUN.ltvTitle} for progress.`}
        </p>
      )}

      <div className="mcfly-tab-snap__cta">
        <s-button href={`/app/ltv?period=${preset}`} variant="primary">
          {PRODUCT_NOUN.openLtv}
        </s-button>
      </div>
    </section>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
