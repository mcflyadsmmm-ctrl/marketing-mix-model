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
import {
  firstSessionPrimaryAction,
  resolveFirstSessionPath,
} from "../lib/first-session-path";
import {
  decideReviewAsk,
  firstOpenRedirect,
  isTrustedMer,
} from "../lib/install-stickiness";
import { ReviewAsk } from "../components/ReviewAsk";
import { DeepHistoryBanner } from "../components/DeepHistoryBanner";
import {
  CASH_NOT_ATTRIBUTION,
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
import prisma from "../db.server";
import { channelFillKey } from "../lib/channel-fill";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import {
  formatListingTillLabel,
  listingCaptureFromRequest,
} from "../lib/listing-capture";
import { formatOverviewShareText } from "../lib/cash-close";
import { ShareOverviewButton } from "../components/ShareOverviewButton";
import { TotalRoasGauge } from "../components/TotalRoasGauge";
import { CashVerdict } from "../components/CashVerdict";
import { PeriodTrustNote } from "../components/PeriodTrustNote";
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
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
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
    } catch {
      priorSales = null;
    }

    try {
      salesByDay = await getSalesFactsByDay(shop.id, dayFetchRange, ianaTimezone);
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

  const shareTz = useSampleDesk ? null : ianaTimezone;
  const shareDayKey = (instant: Date) =>
    shareTz
      ? shopLocalDayKey(instant, shareTz)
      : instant.toISOString().slice(0, 10);

  const factsIncompleteForHonesty =
    !useSampleDesk &&
    salesFactsIncompleteForDesk(salesFactsCoverageForBanner, {
      salesUntrustedZero,
      sales: metrics.sales,
      spend: metrics.totalSpend,
      liveConfirmedZero,
      shopOrdersSeen,
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
    salesUntrustedZero,
    liveConfirmedZero,
    factsIncompleteForHonesty,
    shareSubject: `Total ROAS — ${metrics.period.label}`,
    sharePeriodStartDay: shareDayKey(metrics.period.start),
    sharePeriodEndDay: shareDayKey(metrics.period.end),
    shopLabel: session.shop,
    marginConfirmed: marginIsConfirmed(settings),
    hasLiveSpend,
    hasReadAllOrders: scopesIncludeReadAllOrders(session.scope),
    shopDomain: session.shop,
    periodWiderThanRecentWindow: periodMayExceedShopifyOrderWindow(range),
    reviewAskEligible: decideReviewAsk({
      useSampleDesk,
      trustedMer: isTrustedMer({
        useSampleDesk,
        hasLiveSpend,
        mer: metrics.mer,
        blockedMockAsLive: metrics.blockedMockAsLive,
        salesError,
      }),
      installedAt: shop.createdAt,
      now,
      shotMode,
      scoreboardReady:
        !salesError &&
        hasLiveSpend &&
        metrics.mer != null &&
        !metrics.blockedMockAsLive &&
        !useSampleDesk,
      historyLimited:
        !useSampleDesk &&
        !scopesIncludeReadAllOrders(session.scope) &&
        periodMayExceedShopifyOrderWindow(range),
      factsIncomplete: factsIncompleteForHonesty,
    }).ask,
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
    salesUntrustedZero,
    liveConfirmedZero,
    factsIncompleteForHonesty,
    shareSubject,
    sharePeriodStartDay,
    sharePeriodEndDay,
    shopLabel,
    marginConfirmed,
    hasLiveSpend,
    hasReadAllOrders,
    shopDomain,
    periodWiderThanRecentWindow,
    reviewAskEligible,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  // Listing-capture: period only (no SAMPLE banner/ctx, no live lie).
  // Merchant mode keeps SAMPLE / facts / live honesty unchanged.
  const tillLabel = formatListingTillLabel({
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
  const scoreboardReady = !coldEmpty && !salesError;
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
  const primaryAction = trustedHero.hideUntrustedZero
    ? { href: trustedHero.primaryHref, label: trustedHero.primaryLabel }
    : firstSessionPrimaryAction(firstSession);

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
      salesFactsIncomplete={
        !useSampleDesk &&
        !trustedHero.hideUntrustedZero &&
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
        !trustedHero.hideUntrustedZero &&
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
        !useSampleDesk && !shotMode && !coldEmpty
          ? {
              settingsSaved: metrics.onboarding.settingsSaved,
              hasSpend: metrics.onboarding.hasSpend,
            }
          : null
      }
      deepHistoryKind="hidden"
      shopDomain={shopDomain}
      hasReadAllOrders={hasReadAllOrders}
    />
  );

  return (
    <s-page heading={PRODUCT_NOUN.deskTitle} inlineSize="large">
      {!shotMode ? (
        <s-button
          slot="primary-action"
          variant="primary"
          href={primaryAction.href}
          aria-label={primaryAction.label}
        >
          {primaryAction.label}
        </s-button>
      ) : null}
      <div
        className={[
          "mcfly-desk",
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
            showCashReligion
            showMtdCta={deepHistory.kind === "missing_scope_wide"}
          />
        ) : null}

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
              <s-link href="/app/spend#mcfly-spend-uploads">Update spend</s-link>
            ) : null}
            {trustedHero.kind === "pick_covered_period" ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-eq__meta--trust">
                Period not covered
              </span>
            ) : trustedHero.hideUntrustedZero ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-eq__meta--trust">
                Sales facts loading
              </span>
            ) : !periodTrust.trusted &&
              !shotMode &&
              !useSampleDesk &&
              scoreboardReady ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-eq__meta--trust">
                Period not trusted
              </span>
            ) : !metrics.cashActionReady &&
              !shotMode &&
              !useSampleDesk &&
              scoreboardReady ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-eq__meta--trust">
                Finish spend trust
              </span>
            ) : null}
          </div>
        </div>
        {!shotMode ? (
          <p className="mcfly-topbar__def mcfly-topbar__def--solo">
            {CASH_NOT_ATTRIBUTION}
          </p>
        ) : null}

        {!shotMode && scoreboardReady ? (
          <PeriodTrustNote trust={periodTrust} />
        ) : null}

        {coldEmpty ? (
          <div className="mcfly-cold-empty">
            <s-section
              accessibilityLabel={`Empty state — ${firstSession.heading}`}
            >
              <s-grid gap="base" justifyItems="center" paddingBlock="base">
                <s-grid justifyItems="center" maxInlineSize="420px" gap="base">
                  <s-stack alignItems="center">
                    <s-heading>{firstSession.heading}</s-heading>
                    <s-paragraph>{firstSession.body}</s-paragraph>
                  </s-stack>
                  <s-button
                    variant="primary"
                    href={firstSession.primaryHref}
                    aria-label={firstSession.primaryLabel}
                  >
                    {firstSession.primaryLabel}
                  </s-button>
                  <p className="mcfly-cold-empty__foot">
                    Next:{" "}
                    {firstSession.footerLinks.map((link, index) => (
                      <span key={link.href}>
                        {index > 0 ? " · " : null}
                        <s-link href={link.href}>{link.label}</s-link>
                      </span>
                    ))}
                  </p>
                </s-grid>
              </s-grid>
            </s-section>
          </div>
        ) : null}

        {!coldEmpty ? (
          <>
            {!shotMode && scoreboardReady ? (
              <CashVerdict
                mer={trustedHero.mer}
                sales={
                  trustedHero.hideUntrustedZero ? 0 : totalSalesDisplay
                }
                spend={metrics.totalSpend}
                breakEvenMer={
                  trustedHero.hideUntrustedZero ? null : metrics.breakEvenMer
                }
                spendIncomplete={Boolean(metrics.spendCoverage?.incomplete)}
                salesFactsIncomplete={
                  factsIncompleteForTrust || trustedHero.hideUntrustedZero
                }
                salesUntrustedZero={salesUntrustedZero}
                useSampleDesk={useSampleDesk}
              />
            ) : null}

            {!shotMode && scoreboardReady ? (
              <section
                className="mcfly-hero-compact mcfly-hero-compact--v2"
                aria-label={`${PRODUCT_NOUN.totalRoas} snapshot`}
              >
                <div className="mcfly-hero-compact__status mcfly-hero-compact__status--gauge">
                  {trustedHero.hideUntrustedZero ? (
                    <s-banner
                      tone="warning"
                      heading={trustedHero.heading}
                    >
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
                      targetMer={metrics.targetMer}
                      deltaLine={merDeltaLine}
                    />
                  )}
                  <div className="mcfly-hero-compact__actions">
                    {metrics.cashActionReady ? (
                      <s-button href="/app/goals" variant="secondary">
                        {PRODUCT_NOUN.setupSetGoals}
                      </s-button>
                    ) : null}
                    <s-button
                      href="/app/spend#mcfly-spend-uploads"
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
                    {trustedHero.hideUntrustedZero ? null : (
                      <p className="mcfly-hero-compact__meta">{salesDeltaLine}</p>
                    )}
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
                      <s-link href="/app/spend#mcfly-spend-uploads">
                        Update spend
                      </s-link>
                      {" · "}
                      <s-link href={`/app/allocation?period=${preset}`}>
                        {PRODUCT_NOUN.spendAllocation}
                      </s-link>
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {!shotMode && scoreboardReady && !useSampleDesk ? (
              <ReviewAsk eligible={reviewAskEligible} />
            ) : null}

            {/* LTV snapshot — depth after first trusted ROAS, not Monday chrome */}
            {!shotMode && scoreboardReady && metrics.cashActionReady ? (
              <div className="mcfly-tab-snaps mcfly-tab-snaps--solo" aria-label="Tab snapshots">
                <LtvSnapSection
                  tillLtv={metrics.tillLtv}
                  preset={preset}
                />
              </div>
            ) : null}

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

            {!coldEmpty ? trustBanners : null}

            {!shotMode && metrics.cashActionReady ? (
              <p className="mcfly-overview-more" aria-label="More tools">
                <s-link href={`/app/allocation?period=${preset}`}>
                  {PRODUCT_NOUN.spendAllocation}
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
          {tillLtv.avgRevenueD30 != null ? (
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
                ? "Customer LTV is on the $39 desk (7-day trial). Open for cohorts while facts fill — SAMPLE is preview only."
                : `Backfilling cohorts — open ${PRODUCT_NOUN.ltvTitle} for progress. Not broken.`}
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
