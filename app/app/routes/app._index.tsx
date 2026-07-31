import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useNavigation, redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import { authenticate } from "../shopify.server";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { PeriodControl } from "../components/PeriodControl";
import { SalesGoalGauges } from "../components/SalesGoalGauges";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "../components/SpendExplorer";
import {
  buildDashboardMetrics,
  buildSpendExplorerSeries,
  ensureShop,
} from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer, merToneBand } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import { computeGrossMer, formatOverviewShareText } from "../lib/cash-close";
import { ShareOverviewButton } from "../components/ShareOverviewButton";
import { loadOverviewGoalPeriods } from "../lib/sales-goals.server";
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
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
} from "../lib/spend-explorer";

function pctDeltaClass(pct: number | null): "up" | "down" | "flat" {
  if (pct == null || Math.abs(pct) < 0.5) return "flat";
  return pct > 0 ? "up" : "down";
}

function merAbsDeltaClass(abs: number | null): "up" | "down" | "flat" {
  if (abs == null || Math.abs(abs) < 0.01) return "flat";
  return abs > 0 ? "up" : "down";
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

function formatMerAbsDelta(abs: number | null, priorLabel?: string): string {
  const vs = deltaVsLabel(priorLabel);
  if (abs == null) return vs === "YoY" ? "YoY —" : `vs ${vs} —`;
  const sign = abs > 0 ? "+" : "";
  if (vs === "YoY") return `${sign}${abs.toFixed(2)}× YoY`;
  return `${sign}${abs.toFixed(2)}× vs ${vs}`;
}

function channelDisplayLabel(channel: string): string {
  const known = SPEND_CHANNEL_LABELS[channel as SpendChannel];
  return known ?? channel;
}

type DecisionTone = "ok" | "warn" | "bad";

/**
 * One clear sentence: Total ROAS vs BE / target + safe-spend headroom.
 * Apps Script `renderOverviewDecision_` parity — cash math only.
 */
function decisionTakeaway(metrics: {
  mer: number | null;
  targetMer: number;
  breakEvenMer: number | null;
  aboveBreakEven: boolean | null;
  sales: number;
  totalSpend: number;
  cashActionReady: boolean;
  control: { projMer: number | null; railOk: boolean; headroomPeriod: number } | null;
}): { text: string; tone: DecisionTone } {
  const target = metrics.targetMer;
  const { mer } = metrics;
  const be = metrics.breakEvenMer;
  const headroom =
    metrics.sales > 0 && target > 0
      ? metrics.sales / target - metrics.totalSpend
      : null;
  const headroomBit =
    headroom == null
      ? null
      : headroom >= 0
        ? `${formatCurrency(headroom)} safe-spend headroom at the ${formatMer(target)} rail`
        : `${formatCurrency(Math.abs(headroom))} over target-safe spend`;

  if (mer == null) {
    return {
      text: `Add the other half of sales ÷ spend — then read ${PRODUCT_NOUN.totalRoas} vs break-even.`,
      tone: "warn",
    };
  }

  if (!metrics.cashActionReady) {
    return {
        text: [
        `${PRODUCT_NOUN.totalRoas} ${formatMer(mer)} needs trusted spend before you share`,
        headroomBit,
      ]
        .filter(Boolean)
        .join(" · "),
      tone: "warn",
    };
  }

  if (metrics.aboveBreakEven === false && be != null) {
    return {
      text: [
        `${PRODUCT_NOUN.totalRoas} ${formatMer(mer)} is below break-even ${formatMer(be)} — cut or shift before you export`,
        headroomBit,
      ]
        .filter(Boolean)
        .join(" · "),
      tone: "bad",
    };
  }

  if (metrics.control?.railOk) {
    return {
      text: [
        `${PRODUCT_NOUN.totalRoas} ${formatMer(mer)} clears the ${formatMer(target)} target` +
          (be != null ? ` and break-even ${formatMer(be)}` : ""),
        headroomBit,
      ]
        .filter(Boolean)
        .join(" · "),
      tone: "ok",
    };
  }

  return {
    text: [
      `${PRODUCT_NOUN.totalRoas} ${formatMer(mer)} is above break-even` +
        (be != null ? ` ${formatMer(be)}` : "") +
        ` but below the ${formatMer(target)} target — tighten mix before close`,
      headroomBit,
    ]
      .filter(Boolean)
      .join(" · "),
    tone: "warn",
  };
}

type DecisionVerb = {
  label: string;
  href: string;
  primary: boolean;
};

/** Ritual verbs — Spend (inputs). Share lives on the till scoreboard. */
function decisionVerbs(
  metrics: {
    cashActionReady: boolean;
    aboveBreakEven: boolean | null;
    totalSpend: number;
  },
  _preset: PeriodPreset,
): DecisionVerb[] {
  const spendHref = "/app/spend";

  if (!metrics.cashActionReady) {
    return [
      { label: "Review spend", href: spendHref, primary: true },
      { label: PRODUCT_NOUN.openTotalRoas, href: "/app", primary: false },
    ];
  }

  if (metrics.aboveBreakEven === false) {
    return [
      { label: "Review spend", href: spendHref, primary: true },
      { label: PRODUCT_NOUN.openTotalRoas, href: "/app", primary: false },
    ];
  }

  return [
    {
      label: metrics.totalSpend > 0 ? "Review spend" : PRODUCT_NOUN.setupAddSpend,
      href: spendHref,
      primary: true,
    },
    { label: PRODUCT_NOUN.openTotalRoas, href: "/app", primary: false },
  ];
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
  // Desk default: short window (14d) when explorer range unset.
  const exRange = parseExplorerRange(url.searchParams.get("exRange") || "14d");
  const exGran = parseExplorerGranularity(url.searchParams.get("exGran"));
  const exMode = parseExplorerMode(url.searchParams.get("exMode"));
  const exSales = parseExplorerShowSales(url.searchParams.get("exSales"));
  const exFrom = parseExplorerDateParam(url.searchParams.get("exFrom"));
  const exTo = parseExplorerDateParam(url.searchParams.get("exTo"));
  const shop = await ensureShop(session.shop);
  const ianaTimezone = shop.ianaTimezone;
  const now = new Date();
  // Shop-local calendar when IANA is known; otherwise legacy server-local edges.
  const range = resolvePeriod(preset, now, ianaTimezone);
  const priorRange = resolvePriorPeriod(preset, now, ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

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
    // SAMPLE stamps UTC calendar days — don't shift explorer edges to shop-local.
    timeZone: useSampleDesk ? null : ianaTimezone,
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
    // Till LTV OrderFact ingest — throttled like sales facts (≤2 closed days / paint).
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
    targetMer: explorerSeries.targetMer,
    breakEvenMer: metrics.breakEvenMer,
    showSales: exSales,
    fromKey: explorerDayKey(explorerWindow.start),
    toKey: explorerDayKey(explorerWindow.end),
    asOfKey: explorerDayKey(explorerWindow.end),
  };

  const goalPeriods = await loadOverviewGoalPeriods(
    shop.id,
    ianaTimezone,
    useSampleDesk,
    now,
  );

  const shareTz = useSampleDesk ? null : ianaTimezone;
  const shareDayKey = (instant: Date) =>
    shareTz
      ? shopLocalDayKey(instant, shareTz)
      : instant.toISOString().slice(0, 10);

  const shareText = formatOverviewShareText({
    periodLabel: metrics.period.label,
    periodStartDay: shareDayKey(metrics.period.start),
    periodEndDay: shareDayKey(metrics.period.end),
    netSales: metrics.netSales,
    grossSales: metrics.grossSales,
    grossSalesKnown: metrics.grossSalesKnown,
    totalSpend: metrics.totalSpend,
    mer: metrics.mer,
    breakEvenMer: metrics.breakEvenMer,
    marginPct: metrics.marginPct,
    spendIncomplete: Boolean(metrics.spendCoverage?.incomplete),
    shopLabel: session.shop,
  });

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
    goalPeriods,
    shareText,
    shareSubject: `Total ROAS — ${metrics.period.label}`,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
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
    goalPeriods,
    shareText,
    shareSubject,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  // Never label mock / blocked sales as live Shopify when sample is off.
  // Shot mode may quiet chrome, but never omit SAMPLE when desk is sample.
  const tillLabel = useSampleDesk
    ? `${metrics.period.label} · SAMPLE`
    : shotMode
      ? metrics.period.label
      : metrics.blockedMockAsLive || metrics.salesSource === "mock"
        ? `${metrics.period.label} · sales unavailable`
        : `${metrics.period.label} · live sales`;
  const freshLabel = formatCashFreshnessChip({
    useSampleDesk,
    salesPulledAt: metrics.freshness.salesPulledAt,
    lastAt: metrics.freshness.lastAt,
    source: metrics.freshness.source,
    spendUpdatedAt: metrics.freshness.spendUpdatedAt,
  });
  /** Margin unconfirmed or break-even unset — Settings before spend. */
  const marginBlocked =
    (!metrics.onboarding.settingsSaved || metrics.breakEvenMer == null) &&
    !useSampleDesk &&
    !shotMode;
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
  const scoreboardReady = !spendBlocked && !marginBlocked;
  const decision = scoreboardReady ? decisionTakeaway(metrics) : null;
  const verbs = scoreboardReady ? decisionVerbs(metrics, preset) : [];

  const deltas = metrics.deltas;
  const priorLabel = deltas?.priorLabel;
  const merTargetLine = [
    `Target ${formatMer(metrics.targetMer)}`,
    metrics.breakEvenMer != null
      ? `BE ${formatMer(metrics.breakEvenMer)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const merDeltaLine = deltas
    ? formatMerAbsDelta(deltas.merAbs, priorLabel)
    : null;
  const salesDeltaLine = deltas
    ? formatPctDelta(deltas.salesPct, priorLabel)
    : metrics.orderCount > 0
      ? `${metrics.orderCount.toLocaleString()} orders · AOV ${formatCurrency(metrics.sales / metrics.orderCount)}`
      : `${metrics.orderCount.toLocaleString()} orders`;
  const spendDeltaLine = deltas
    ? formatPctDelta(deltas.spendPct, priorLabel)
    : (metrics.control?.densityLabel ?? metrics.period.label);
  const platformMix = [...metrics.channelMix]
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const topSpendChannels = platformMix.slice(0, 3);

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
      salesFactsIncomplete={
        !useSampleDesk &&
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
      showSalesBasis={false}
      netSales={!useSampleDesk ? metrics.netSales : null}
      grossSales={!useSampleDesk ? metrics.grossSales : null}
      grossSalesKnown={!useSampleDesk ? metrics.grossSalesKnown : true}
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
            href="/app/demo"
            aria-label={PRODUCT_NOUN.samplePreviewOffReviewTitle}
          >
            {PRODUCT_NOUN.samplePreviewOffReviewTitle}
          </s-button>
        ) : metrics.cashActionReady ? (
          <s-button
            slot="primary-action"
            variant="primary"
            href="/app/spend"
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
            href="/app/spend"
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
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">{freshLabel}</span>
            {!useSampleDesk && !shotMode && scoreboardReady ? (
              <span
                className="mcfly-ctx-chip mcfly-ctx-chip--flat"
                title={PRODUCT_NOUN.salesBasis}
              >
                Net {formatCurrency(metrics.netSales)}
                {metrics.grossSalesKnown &&
                metrics.grossSales !== metrics.netSales
                  ? ` · Gross ${formatCurrency(metrics.grossSales)}`
                  : !metrics.grossSalesKnown
                    ? " · Gross still backfilling"
                    : ""}
              </span>
            ) : null}
            {!metrics.cashActionReady &&
            !shotMode &&
            !useSampleDesk &&
            scoreboardReady ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-eq__meta--trust">
                Finish spend trust
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
                      Start with profit margin (sets break-even). Then add Meta +
                      Google spend. Sales are already in.
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
                    Next: <s-link href="/app/spend">{PRODUCT_NOUN.setupAddSpend}</s-link>
                    {" · "}
                    <s-link href="/app/demo">Try SAMPLE preview</s-link>
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
                      Margin is set. Add daily Meta + Google spend to unlock{" "}
                      {PRODUCT_NOUN.totalRoas} vs break-even.
                    </s-paragraph>
                  </s-stack>
                  <s-button
                    variant="primary"
                    href="/app/spend"
                    aria-label={PRODUCT_NOUN.setupAddSpend}
                  >
                    {PRODUCT_NOUN.setupAddSpend}
                  </s-button>
                  <p className="mcfly-cold-empty__foot">
                    Want a labeled walkthrough first?{" "}
                    <s-link href="/app/demo">Try SAMPLE preview</s-link>
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
                Sales load automatically. Adjust profit margin, add spend, then
                read Total ROAS vs break-even.
              </p>
            </div>
            <ol className="mcfly-guide__steps">
              <li
                className={
                  metrics.onboarding.settingsSaved
                    ? "mcfly-guide__step mcfly-guide__step--done"
                    : "mcfly-guide__step"
                }
              >
                <span className="mcfly-guide__n" aria-hidden="true">
                  {metrics.onboarding.settingsSaved ? "✓" : "1"}
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">
                    {PRODUCT_NOUN.setupAdjustMargin}
                  </p>
                  <p className="mcfly-guide__step-copy">
                    Profit margin sets break-even — the line{" "}
                    {PRODUCT_NOUN.totalRoas} must clear.
                  </p>
                  {metrics.onboarding.settingsSaved ? (
                    <p className="mcfly-guide__step-state">
                      Saved · break-even {formatMer(metrics.breakEvenMer)}
                    </p>
                  ) : (
                    <s-button href="/app/settings" variant="primary">
                      {PRODUCT_NOUN.setupAdjustMargin}
                    </s-button>
                  )}
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
                    Meta + Google ready — upload or paste Day + columns from
                    Sheets. No ad logins.
                  </p>
                  {metrics.onboarding.hasSpend ? (
                    <p className="mcfly-guide__step-state">
                      Logged · {formatCurrency(metrics.totalSpend)} this period
                    </p>
                  ) : (
                    <s-button href="/app/spend" variant="primary">
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
              Want a labeled walkthrough first?{" "}
              <s-link href="/app/demo">Try SAMPLE preview</s-link>
            </p>
          </section>
        ) : null}

        {!spendBlocked && !marginBlocked ? (
          <>
            {!shotMode && scoreboardReady ? (
              <section
                className="mcfly-home-till"
                aria-label="Sales versus spend honesty"
              >
                <div className="mcfly-home-till__tile mcfly-home-till__tile--lead">
                  <span className="mcfly-home-till__label">
                    {PRODUCT_NOUN.totalRoas} (net)
                  </span>
                  <span className="mcfly-home-till__value">
                    {formatMer(metrics.mer)}
                  </span>
                  <span className="mcfly-home-till__meta">After returns</span>
                </div>
                <div className="mcfly-home-till__tile">
                  <span className="mcfly-home-till__label">
                    {PRODUCT_NOUN.amer}
                  </span>
                  <span className="mcfly-home-till__value">
                    {formatMer(metrics.amer)}
                  </span>
                  <span className="mcfly-home-till__meta">
                    {PRODUCT_NOUN.amerDef} · average, not causal
                  </span>
                </div>
                <div className="mcfly-home-till__tile">
                  <span className="mcfly-home-till__label">Gross ÷ spend</span>
                  <span className="mcfly-home-till__value">
                    {metrics.grossSalesKnown
                      ? formatMer(
                          computeGrossMer(
                            metrics.grossSales,
                            metrics.totalSpend,
                          ),
                        )
                      : "—"}
                  </span>
                  <span className="mcfly-home-till__meta">
                    {metrics.grossSalesKnown
                      ? "Ads Manager–comparable"
                      : "Gross still backfilling"}
                  </span>
                </div>
                <div className="mcfly-home-till__tile">
                  <span className="mcfly-home-till__label">
                    {PRODUCT_NOUN.breakEvenShort}
                  </span>
                  <span className="mcfly-home-till__value">
                    {formatMer(metrics.breakEvenMer)}
                  </span>
                  <span className="mcfly-home-till__meta">From margin</span>
                </div>
                <div className="mcfly-home-till__tile">
                  <span className="mcfly-home-till__label">Safe-spend headroom</span>
                  <span className="mcfly-home-till__value">
                    {metrics.control
                      ? formatCurrency(metrics.control.headroomPeriod)
                      : "—"}
                  </span>
                  <span className="mcfly-home-till__meta">
                    {metrics.control?.statusLabel ?? "At break-even rail"}
                  </span>
                </div>
                <div className="mcfly-home-till__actions">
                  <ShareOverviewButton
                    subject={shareSubject}
                    body={shareText}
                    enabled={!shotMode && scoreboardReady}
                  />
                  {metrics.spendCoverage?.incomplete ? (
                    <s-button href="/app/spend" variant="secondary">
                      Fill spend gaps first
                    </s-button>
                  ) : (
                    <s-button href="/app/spend" variant="tertiary">
                      Review spend
                    </s-button>
                  )}
                </div>
              </section>
            ) : null}
            {decision ? (
              <section
                className={`mcfly-decision mcfly-decision--hero mcfly-decision--${decision.tone}`}
                aria-label={`${PRODUCT_NOUN.totalRoas} decision`}
              >
                <p className="mcfly-decision__kicker">
                  {PRODUCT_NOUN.totalRoas} · not platform ROAS
                </p>
                <p className="mcfly-decision__takeaway">{decision.text}</p>
                {!shotMode ? (
                  <div className="mcfly-decision__actions">
                    {verbs.map((verb) =>
                      verb.primary ? (
                        <s-button
                          key={verb.label}
                          href={verb.href}
                          variant="primary"
                        >
                          {verb.label}
                        </s-button>
                      ) : (
                        <s-link key={verb.label} href={verb.href}>
                          {verb.label}
                        </s-link>
                      ),
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section
              className="mcfly-kpi-board"
              aria-label={`${PRODUCT_NOUN.totalRoas} KPIs`}
            >
              <div className="mcfly-kpi mcfly-kpi--sales">
                <p className="mcfly-kpi__label">Total Sales</p>
                <p className="mcfly-kpi__value">
                  {formatCurrency(metrics.sales)}
                </p>
                <p className="mcfly-kpi__formula">After returns</p>
                <p
                  className={`mcfly-kpi__delta mcfly-kpi__delta--${
                    deltas ? pctDeltaClass(deltas.salesPct) : "flat"
                  }`}
                >
                  {salesDeltaLine}
                </p>
                {goalPeriods && !shotMode ? (
                  <SalesGoalGauges
                    periods={goalPeriods}
                    variant="inline"
                    heading="Goal progress"
                  />
                ) : null}
              </div>
              <div className="mcfly-kpi mcfly-kpi--spend">
                <p className="mcfly-kpi__label">Total Spend</p>
                <p className="mcfly-kpi__value">
                  {formatCurrency(metrics.totalSpend)}
                </p>
                <p className="mcfly-kpi__formula">Logged channels</p>
                <p
                  className={`mcfly-kpi__delta mcfly-kpi__delta--${
                    deltas ? pctDeltaClass(deltas.spendPct) : "flat"
                  }`}
                >
                  {spendDeltaLine}
                </p>
                {topSpendChannels.length > 0 ? (
                  <ul
                    className="mcfly-kpi-channels"
                    aria-label="Top spend channels"
                  >
                    {topSpendChannels.map((entry) => (
                      <li
                        className="mcfly-kpi-channels__row"
                        key={entry.channel}
                      >
                        <span className="mcfly-kpi-channels__name">
                          {channelDisplayLabel(entry.channel)}
                        </span>
                        <span className="mcfly-kpi-channels__amt">
                          {formatCurrency(entry.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="mcfly-kpi mcfly-kpi--lead">
                <p className="mcfly-kpi__label">{PRODUCT_NOUN.totalRoas}</p>
                <p className="mcfly-kpi__value">
                  {metrics.mer === null ? "—.——" : formatMer(metrics.mer)}
                </p>
                <p className="mcfly-kpi__formula">{merTargetLine}</p>
                <p
                  className={`mcfly-kpi__delta mcfly-kpi__delta--${
                    deltas
                      ? merAbsDeltaClass(deltas.merAbs)
                      : merToneBand(metrics.mer, metrics.targetMer)
                  }`}
                >
                  {merDeltaLine ?? metrics.period.label}
                </p>
                <p className="mcfly-kpi__def">{PRODUCT_NOUN.definitionForPeriod}</p>
              </div>
            </section>

            {/* Live ready: trust after decision + KPIs so banners never bury the till. */}
            {!coldEmpty ? trustBanners : null}

            <div className="mcfly-me-spine">
              <SpendExplorer
                series={explorer}
                period={preset}
                shotMode={shotMode}
              />
            </div>

            {platformMix.length > 0 ? (
              <section
                className="mcfly-panel"
                aria-label="Spend by platform"
              >
                <div className="mcfly-panel__head">
                  <h2>Spend by platform</h2>
                  <p className="mcfly-panel__muted">
                    Exact logged spend · share of total
                  </p>
                </div>
                <div className="mcfly-channel-list">
                  {platformMix.map((entry) => {
                    const pct = Math.round(entry.share * 100);
                    return (
                      <div className="mcfly-channel" key={entry.channel}>
                        <span className="mcfly-channel__name">
                          {channelDisplayLabel(entry.channel)}
                        </span>
                        <div className="mcfly-channel__track" aria-hidden="true">
                          <div
                            className={`mcfly-channel__fill mcfly-channel__fill--${entry.channel}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="mcfly-channel__meta">
                          {formatCurrency(entry.amount)} · {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {!shotMode ? (
              <p className="mcfly-overview-more" aria-label="More tools">
                <s-link href="/app/goals">Goals</s-link>
                {" · "}
                <s-link href="/app/spend">Spend</s-link>
                {" · "}
                <s-link href={`/app/allocation?period=${preset}`}>
                  Allocation
                </s-link>
                {" · "}
                <s-link href="/app/settings">Settings</s-link>
              </p>
            ) : null}

            {!shotMode ? (
              <details className="mcfly-panel mcfly-panel--secondary mcfly-till-ltv">
                <summary className="mcfly-panel__head mcfly-till-ltv__summary">
                  <h2>{PRODUCT_NOUN.ltvTitle}</h2>
                  <p className="mcfly-panel__muted">
                    Optional · open for cohort LTV
                  </p>
                </summary>
                {metrics.tillLtv.available ? (
                  <div className="mcfly-control__grid mcfly-till-ltv__grid">
                    <div className="mcfly-control__tile">
                      <p className="mcfly-control__k">Customer LTV · 30d</p>
                      <p className="mcfly-control__v">
                        {metrics.tillLtv.avgRevenueD30 != null
                          ? formatCurrency(metrics.tillLtv.avgRevenueD30)
                          : "—"}
                      </p>
                    </div>
                    <div className="mcfly-control__tile">
                      <p className="mcfly-control__k">Customer LTV · 90d</p>
                      <p className="mcfly-control__v">
                        {metrics.tillLtv.avgRevenueD90 != null
                          ? formatCurrency(metrics.tillLtv.avgRevenueD90)
                          : "—"}
                      </p>
                    </div>
                    <div className="mcfly-control__tile">
                      <p className="mcfly-control__k">Total Cost per New Customer</p>
                      <p className="mcfly-control__v">
                        {metrics.tillLtv.cashCac != null
                          ? formatCurrency(metrics.tillLtv.cashCac)
                          : "—"}
                      </p>
                      <p className="mcfly-control__delta">
                        {metrics.newCustomers > 0
                          ? `${metrics.newCustomers.toLocaleString()} new customers`
                          : "No new customers in this period"}
                      </p>
                    </div>
                    <div className="mcfly-control__tile">
                      <p className="mcfly-control__k">LTV : Cost per New Customer</p>
                      <p
                        className={`mcfly-control__v${
                          metrics.tillLtv.ltvCacRatio != null &&
                          metrics.tillLtv.ltvCacRatio >= 1
                            ? " mcfly-control__v--good"
                            : metrics.tillLtv.ltvCacRatio != null
                              ? " mcfly-control__v--bad"
                              : ""
                        }`}
                      >
                        {metrics.tillLtv.ltvCacRatio != null
                          ? `${metrics.tillLtv.ltvCacRatio.toFixed(2)}×`
                          : "—"}
                      </p>
                      <p className="mcfly-control__delta">
                        90d customer LTV ÷ total cost per new customer
                      </p>
                    </div>
                    <div className="mcfly-control__tile mcfly-control__tile--action">
                      <p className="mcfly-control__k">Deep dive</p>
                      <p className="mcfly-control__v mcfly-control__v--action">
                        Cohorts, 30/90/365 windows, and history-limit disclosure
                      </p>
                      <div className="mcfly-decision__actions">
                        <s-button href={`/app/ltv?period=${preset}`} variant="primary">
                          {PRODUCT_NOUN.openLtv}
                        </s-button>
                        <s-link href="/app/spend">Review spend inputs</s-link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <section className="mcfly-state mcfly-state--empty" aria-label="LTV unavailable">
                    <p className="mcfly-state__copy">
                      {metrics.tillLtv.emptyReason === "pro_required"
                        ? "Customer LTV is on Pro ($39/store/mo). Preview on SAMPLE, or upgrade in Settings."
                        : metrics.tillLtv.emptyReason === "no_timezone"
                        ? "Shop timezone needed before customer cohorts can bucket by local day."
                        : metrics.tillLtv.emptyReason === "history_limited"
                          ? "Order history is limited — open Customer LTV to monitor backfill and history coverage."
                          : "Backfilling customer cohorts — open Customer LTV for live progress and cohort coverage."}
                    </p>
                    <div className="mcfly-state__cta">
                      {metrics.tillLtv.emptyReason === "pro_required" ? (
                        <>
                          <s-button href="/app/settings" variant="primary">
                            Upgrade to Pro — $39/mo
                          </s-button>
                          <s-button href="/app/demo" variant="secondary">
                            Try SAMPLE preview
                          </s-button>
                        </>
                      ) : (
                        <s-button href={`/app/ltv?period=${preset}`} variant="primary">
                          {PRODUCT_NOUN.openLtv}
                        </s-button>
                      )}
                    </div>
                  </section>
                )}
              </details>
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
