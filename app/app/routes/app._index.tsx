import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useNavigation, redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { MonthlyPacing } from "../components/MonthlyPacing";
import { PeriodControl } from "../components/PeriodControl";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "../components/SpendExplorer";
import {
  buildDashboardMetrics,
  buildSpendExplorerSeries,
  ensureShop,
} from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import {
  emptySales,
  fetchShopifySales,
  fetchShopifySalesByDay,
  shopLocalDayKey,
  shopLocalDayRange,
  type SalesResult,
} from "../lib/shopify-sales.server";
import {
  runSalesFactsBackfill,
  getSalesFactsCoverage,
  getSalesFactsTotals,
  getSalesFactsByDay,
} from "../lib/sales-facts.server";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import {
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
  resolvePriorPeriod,
  type DateRange,
  type PeriodPreset,
} from "../lib/periods";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import {
  dateKeyFromLocal,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
} from "../lib/spend-explorer";

function pacingHeading(preset: PeriodPreset): string {
  switch (preset) {
    case "mtd":
      return "Month to date";
    case "qtd":
      return "Quarter to date";
    case "ytd":
      return "Year to date";
    case "l12m":
      return "Last 12 months";
    case "y3":
      return "Last 3 years";
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

/** Today so far in shop IANA tz (midnight → now). Facts never cover the open day. */
function todayPartialRange(now: Date, ianaTimezone: string): DateRange {
  const dayKey = shopLocalDayKey(now, ianaTimezone);
  const day = shopLocalDayRange(dayKey, ianaTimezone);
  return { start: day.start, end: now, label: "Today (partial)" };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const rawPeriod = url.searchParams.get("period");
  const preset = parsePeriodPreset(rawPeriod);
  if (!shotMode && (preset === "y3" || preset === "l12m")) {
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
  let priorSales = { totalSales: 0 };
  let salesError: string | null = null;
  let salesByDay = new Map<string, number>();
  let explorerCustomers = {
    newCustomers: 0,
    returningCustomers: 0,
    customerMetricsAvailable: false,
  };

  const explorerWindow = resolveExplorerWindow(exRange, now, {
    from: exFrom,
    to: exTo,
    timeZone: ianaTimezone,
  });
  const dayFetchRange = {
    start: explorerWindow.start,
    end: explorerWindow.end,
    label: explorerWindow.label,
  };

  const salesPulledAt = new Date().toISOString();

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
  } else {
    /*
     * Remaining live GraphQL cases (happy path = SalesDayFact complete → no crawl):
     * 1. Open shop-local "today" top-up when facts cover closed days of the period.
     * 2. Period / prior / by-day totals when facts coverage is incomplete.
     * 3. Explorer new/returning (unique cross-day) — facts only store per-day sums.
     * 4. Throttled backfill below only when coverage incomplete (auth callback also resumes).
     */
    let mainCoverage = { expectedClosedDays: 0, factDays: 0, complete: false };
    let dayCoverage = { expectedClosedDays: 0, factDays: 0, complete: false };
    let priorCoverage = { expectedClosedDays: 0, factDays: 0, complete: false };
    try {
      [mainCoverage, dayCoverage, priorCoverage] = await Promise.all([
        getSalesFactsCoverage(shop.id, range),
        getSalesFactsCoverage(shop.id, dayFetchRange),
        getSalesFactsCoverage(shop.id, priorRange),
      ]);
    } catch {
      // Coverage read failed — stay incomplete, live path below covers it.
    }

    // Kick throttled backfill without blocking first paint (auth callback also resumes).
    if (!mainCoverage.complete || !dayCoverage.complete) {
      void runSalesFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
        // ignore — live fallback below
      });
    }
    // Till LTV OrderFact ingest — throttled like sales facts (≤2 closed days / paint).
    void runOrderFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
      // ignore — panel shows empty/backfilling until cohorts land
    });

    let usedFactsForTotals = false;
    if (mainCoverage.complete) {
      try {
        const factsTotals = await getSalesFactsTotals(shop.id, range);
        // Facts only cover closed days. Top up "today so far" only when we know
        // the shop IANA timezone — never invent server-local midnight.
        let todaySales: SalesResult | null = null;
        if (ianaTimezone) {
          const todayKey = shopLocalDayKey(now, ianaTimezone);
          const todayBounds = shopLocalDayRange(todayKey, ianaTimezone);
          const includesOpenToday = range.end >= todayBounds.start;
          if (includesOpenToday) {
            todaySales = await fetchShopifySales(
              admin,
              todayPartialRange(now, ianaTimezone),
            ).catch(() => null);
          }
        }
        sales = {
          totalSales: factsTotals.totalSales + (todaySales?.totalSales ?? 0),
          orderCount: factsTotals.orderCount + (todaySales?.orderCount ?? 0),
          newCustomers: 0,
          returningCustomers: 0,
          guestOrders: 0,
          // Per-day new/returning sums are not a unique cross-period count —
          // never present a facts-derived total as having live customer metrics.
          customerMetricsAvailable: false,
          source: "shopify" as const,
        };
        usedFactsForTotals = true;
      } catch {
        usedFactsForTotals = false;
      }
    }

    if (!usedFactsForTotals) {
      try {
        sales = await fetchShopifySales(admin, range);
      } catch (err) {
        salesError = err instanceof Error ? err.message : "Failed to load Shopify sales";
        // Honest empty till — never fall back to mockSales as live Shopify.
        sales = {
          totalSales: 0,
          orderCount: 0,
          newCustomers: 0,
          returningCustomers: 0,
          guestOrders: 0,
          customerMetricsAvailable: false,
          source: "shopify" as const,
        };
      }
    }

    let usedFactsForPrior = false;
    if (priorCoverage.complete) {
      try {
        const priorFacts = await getSalesFactsTotals(shop.id, priorRange);
        priorSales = { totalSales: priorFacts.totalSales };
        usedFactsForPrior = true;
      } catch {
        usedFactsForPrior = false;
      }
    }
    if (!usedFactsForPrior) {
      try {
        const livePrior = await fetchShopifySales(admin, priorRange);
        priorSales = { totalSales: livePrior.totalSales };
      } catch {
        priorSales = { totalSales: 0 };
      }
    }

    let usedFactsForDay = false;
    if (dayCoverage.complete) {
      try {
        salesByDay = await getSalesFactsByDay(shop.id, dayFetchRange);
        explorerCustomers = {
          newCustomers: 0,
          returningCustomers: 0,
          customerMetricsAvailable: false,
        };
        usedFactsForDay = true;
      } catch {
        usedFactsForDay = false;
      }
    }

    if (!usedFactsForDay) {
      const bucketTz = ianaTimezone ?? "UTC";
      try {
        salesByDay = await fetchShopifySalesByDay(admin, dayFetchRange, bucketTz);
      } catch {
        salesByDay = new Map();
      }
      try {
        const liveExplorer = await fetchShopifySales(admin, {
          start: explorerWindow.start,
          end: explorerWindow.end,
          label: explorerWindow.label,
        });
        explorerCustomers = {
          newCustomers: liveExplorer.newCustomers,
          returningCustomers: liveExplorer.returningCustomers,
          customerMetricsAvailable: liveExplorer.customerMetricsAvailable,
        };
      } catch {
        // keep defaults — explorer just shows without cost-per-customer stats
      }
    }
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesByDay,
    priorSales,
    priorRange,
    salesPulledAt: salesError ? null : salesPulledAt,
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
    timeZone: ianaTimezone,
  });

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
    fromKey: dateKeyFromLocal(explorerWindow.start),
    toKey: dateKeyFromLocal(explorerWindow.end),
    asOfKey: dateKeyFromLocal(explorerWindow.end),
  };

  return {
    metrics,
    salesError,
    preset,
    useSampleDesk,
    shotMode,
    explorer,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const { metrics, preset, salesError, useSampleDesk, shotMode, explorer } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  // Never label mock / blocked sales as live Shopify when sample is off.
  const tillLabel = shotMode
    ? metrics.period.label
    : useSampleDesk
      ? `${metrics.period.label} · sample data`
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

  return (
    <s-page heading={PRODUCT_NOUN.deskTitle} inlineSize="large">
      {!shotMode ? (
        <s-button
          slot="primary-action"
          variant="primary"
          href="/app/spend#mcfly-spend-uploads"
          aria-label="Upload spend CSV"
        >
          Upload CSV
        </s-button>
      ) : null}
      <div
        className={
          shotMode
            ? "mcfly-desk mcfly-desk--shot"
            : isLoading
              ? "mcfly-desk mcfly-desk--loading"
              : "mcfly-desk"
        }
      >
        {useSampleDesk && !shotMode ? (
          <s-banner tone="warning" heading="Sample desk — not live Shopify">
            <s-paragraph>
              Preview desk so {PRODUCT_NOUN.totalRoas} is visible before setup.{" "}
              {PRODUCT_NOUN.definitionForPeriod}. Log spend and set goals, then
              go live with your store's sales.
            </s-paragraph>
            {metrics.onboarding.hasSpend ? (
              <s-paragraph>
                When spend and goals are set, turn Sample desk OFF to go live.
              </s-paragraph>
            ) : null}
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button href="/app/spend" variant="primary">
                Log spend
              </s-button>
              <s-link href="/app/goals">Set goals</s-link>
              <s-link href="/app/demo">
                {metrics.onboarding.hasSpend
                  ? "Turn Sample desk OFF"
                  : "Demo controls"}
              </s-link>
            </div>
          </s-banner>
        ) : null}

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
            periodMayExceedShopifyOrderWindow(metrics.period)
          }
          shotMode={shotMode}
        />

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
          </div>
        </div>

        {marginOnlyEmpty ? (
          <s-section accessibilityLabel="Empty state — set contribution margin for break-even">
            <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
              <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                <s-stack alignItems="center">
                  <s-heading>Set contribution margin</s-heading>
                  <s-paragraph>
                    Sales and spend are ready. Confirm margin so break-even can
                    lock. {PRODUCT_NOUN.definitionForPeriod}.{" "}
                    {PRODUCT_NOUN.notTrueRoas}
                  </s-paragraph>
                </s-stack>
                <s-button-group>
                  <s-button
                    slot="primary-action"
                    variant="primary"
                    href="/app/settings"
                    aria-label="Set contribution margin"
                  >
                    Set margin
                  </s-button>
                  <s-button
                    slot="secondary-actions"
                    href="/app/spend"
                    aria-label="Review logged spend"
                  >
                    Review spend
                  </s-button>
                </s-button-group>
              </s-grid>
            </s-grid>
          </s-section>
        ) : null}

        {bothBlockedEmpty ? (
          <s-section accessibilityLabel={`Empty state — set contribution margin for ${PRODUCT_NOUN.totalRoas}`}>
            <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
              <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                <s-stack alignItems="center">
                  <s-heading>Set contribution margin first</s-heading>
                  <s-paragraph>
                    Confirm margin so break-even can lock, then log spend.{" "}
                    {PRODUCT_NOUN.definitionForPeriod}. {PRODUCT_NOUN.notTrueRoas}
                  </s-paragraph>
                </s-stack>
                <s-button-group>
                  <s-button
                    slot="primary-action"
                    variant="primary"
                    href="/app/settings"
                    aria-label="Set contribution margin"
                  >
                    Set margin
                  </s-button>
                  <s-button
                    slot="secondary-actions"
                    href="/app/spend#mcfly-spend-uploads"
                    aria-label="Export and upload spend"
                  >
                    Export & upload spend
                  </s-button>
                </s-button-group>
              </s-grid>
            </s-grid>
            <p className="mcfly-guide__foot">
              Preview the sample desk first?{" "}
              <s-link href="/app/demo">Load sample desk</s-link> — 3 years of
              matched sales and spend.
            </p>
          </s-section>
        ) : null}

        {spendOnlyEmpty ? (
          <s-section accessibilityLabel={`Empty state — add spend for ${PRODUCT_NOUN.totalRoas}`}>
            <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
              <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                <s-stack alignItems="center">
                  <s-heading>Add spend for {PRODUCT_NOUN.totalRoas}</s-heading>
                  <s-paragraph>
                    Sales are ready. Log daily ad spend, then open{" "}
                    {PRODUCT_NOUN.totalRoas}. {PRODUCT_NOUN.definitionForPeriod}.{" "}
                    {PRODUCT_NOUN.notTrueRoas}
                  </s-paragraph>
                </s-stack>
                <s-button-group>
                  <s-button
                    slot="primary-action"
                    variant="primary"
                    href="/app/spend#mcfly-spend-uploads"
                    aria-label="Export and upload spend"
                  >
                    Export & upload spend
                  </s-button>
                  <s-button
                    slot="secondary-actions"
                    href="/app/settings"
                    aria-label="Open Settings for break-even margin"
                  >
                    Settings
                  </s-button>
                </s-button-group>
              </s-grid>
            </s-grid>
            <p className="mcfly-guide__foot">
              Preview the sample desk first?{" "}
              <s-link href="/app/demo">Load sample desk</s-link> — 3 years of
              matched sales and spend.
            </p>
          </s-section>
        ) : null}

        {metrics.onboarding.showGuide &&
        !shotMode &&
        !spendBlocked &&
        !marginBlocked ? (
          <section className="mcfly-guide" aria-label={`First ${PRODUCT_NOUN.totalRoas} setup`}>
            <div className="mcfly-guide__head">
              <p className="mcfly-guide__title">
                First {PRODUCT_NOUN.totalRoas} in under 10 minutes
              </p>
              <p className="mcfly-guide__sub">
                Sales load automatically. Confirm margin, log spend — then
                the desk reads {PRODUCT_NOUN.definition}.
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
                  <p className="mcfly-guide__step-title">Confirm your margin</p>
                  <p className="mcfly-guide__step-copy">
                    Gross margin sets break-even — the line {PRODUCT_NOUN.totalRoas}{" "}
                    must clear.
                  </p>
                  {metrics.onboarding.settingsSaved ? (
                    <p className="mcfly-guide__step-state">
                      Saved · break-even {formatMer(metrics.breakEvenMer)}
                    </p>
                  ) : (
                    <s-link href="/app/settings">Open Settings</s-link>
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
                  <p className="mcfly-guide__step-title">Log your ad spend</p>
                  <p className="mcfly-guide__step-copy">
                    Upload a CSV or type totals by channel — Meta, Google, TikTok, the
                    rest.
                  </p>
                  {metrics.onboarding.hasSpend ? (
                    <p className="mcfly-guide__step-state">
                      Logged · {formatCurrency(metrics.totalSpend)} this period
                    </p>
                  ) : (
                    <s-link href="/app/spend#mcfly-spend-uploads">
                      Export & upload spend
                    </s-link>
                  )}
                </div>
              </li>
              <li className="mcfly-guide__step mcfly-guide__step--wait">
                <span className="mcfly-guide__n" aria-hidden="true">
                  3
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">Read {PRODUCT_NOUN.totalRoas}</p>
                  <p className="mcfly-guide__step-copy">
                    {PRODUCT_NOUN.definitionForPeriod}. Above break-even means the
                    period is profitable in cash terms.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mcfly-guide__foot">
              Preview the sample desk. When you clear break-even, move the budget.{" "}
              <s-link href="/app/demo">Load sample desk</s-link> — 3 years of matched
              sales and spend.
            </p>
          </section>
        ) : null}

        {!spendBlocked && !marginBlocked ? (
          <>
            <div className="mcfly-me-spine">
              {!shotMode ? (
                <MonthlyPacing
                  sales={metrics.sales}
                  spend={metrics.totalSpend}
                  mer={metrics.mer}
                  targetMer={metrics.targetMer}
                  heading={pacingHeading(preset)}
                  periodLabel={metrics.period.label}
                  control={metrics.control}
                />
              ) : null}

              <SpendExplorer
                series={explorer}
                period={preset}
                shotMode={shotMode}
              />
            </div>

            {metrics.allocation && !shotMode ? (
              <section className="mcfly-panel mcfly-panel--secondary" aria-label="Allocation">
                <div className="mcfly-panel__head">
                  <h2>Monday call</h2>
                  <p className="mcfly-panel__muted">{PRODUCT_NOUN.mondayCall}</p>
                </div>
                <p className="mcfly-panel__next">{metrics.allocation.why}</p>
                <div className="mcfly-decision__actions">
                  <s-button href={`/app/allocation?period=${preset}`} variant="primary">
                    Open allocation
                  </s-button>
                  <s-link href="/app/spend">Adjust spend</s-link>
                </div>
              </section>
            ) : null}

            {!shotMode ? (
              <section className="mcfly-panel mcfly-till-ltv" aria-label={PRODUCT_NOUN.ltvTitle}>
                <div className="mcfly-panel__head">
                  <h2>{PRODUCT_NOUN.ltvTitle}</h2>
                  <p className="mcfly-panel__muted">
                    Cohort revenue from Shopify orders (Level 1) — not email CRM.
                  </p>
                </div>
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
                      {metrics.tillLtv.emptyReason === "no_timezone"
                        ? "Shop timezone needed before customer cohorts can bucket by local day."
                        : metrics.tillLtv.emptyReason === "history_limited"
                          ? "Order history is limited — open Customer LTV to monitor backfill and history coverage."
                          : "Backfilling customer cohorts — open Customer LTV for live progress and cohort coverage."}
                    </p>
                    <div className="mcfly-state__cta">
                      <s-button href={`/app/ltv?period=${preset}`} variant="primary">
                        {PRODUCT_NOUN.openLtv}
                      </s-button>
                    </div>
                  </section>
                )}
              </section>
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
