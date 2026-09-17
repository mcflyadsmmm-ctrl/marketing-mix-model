import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BookFactGrid, type BookFact } from "../components/ShopifyBookSection";
import { DeskBookPage } from "../components/DeskBookPage";
import { LtvValueBuild, type LtvBuildWindow } from "../components/LtvValueBuild";
import { LtvBuildCurves } from "../components/LtvBuildCurves";
import { LtvRetentionHeat } from "../components/LtvRetentionHeat";
import { LtvTierTables } from "../components/LtvTierTables";
import { LtvPathTable } from "../components/LtvPathTable";
import { LtvWhaleRecency } from "../components/LtvWhaleRecency";
import { LtvFlagshipBoard } from "../components/LtvFlagshipBoard";
import { LtvProductBoard } from "../components/LtvProductBoard";
import { LtvPromoBoard } from "../components/LtvPromoBoard";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { ReviewAsk } from "../components/ReviewAsk";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { UnlockFullHistoryBanner } from "../components/UnlockFullHistoryBanner";
import { buildDashboardMetrics, ensureShop, getOrCreateSettings, marginIsConfirmed } from "../lib/mer-dashboard.server";
import { parseSalesBasis } from "../lib/sales-basis";
import { formatCurrency } from "../lib/mer-format";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
} from "../lib/contrib-ltv";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { getOrderBackfillProgress } from "../lib/order-facts.server";
import { loadLtvDepth } from "../lib/ltv-depth-page.server";
import { deskPeriodTimeZone, parsePeriodPreset, periodMayExceedShopifyOrderWindow, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import { requireAdmin } from "../lib/public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "../lib/first-session-shopify-window.server";
import { isBillingEnabled } from "../lib/billing-flag.server";
import { resolveShopEntitlements } from "../lib/entitlements.server";
import prisma from "../db.server";
import { useDeskCurrency } from "../lib/desk-currency";
import { flagshipDailyRead } from "../lib/ltv-flagship";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  buildShareableInsights,
  emptyShareableInsights,
  pickShareableLtvPeek,
} from "../lib/shareable-insights";

/** Stored month totals — desk LTV is per new customer. */
function perCustomerRevenue(
  total: number,
  customers: number,
): number | null {
  if (!(customers > 0) || !Number.isFinite(total)) return null;
  return total / customers;
}

/**
 * Whole percents in merchant chrome — 35%, never 35.0%.
 * `formatPercent(metrics.marginPct)` prints one decimal, which the desk bans.
 */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

type LtvRow = BookFact;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdmin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  // y3 stays shot-only. L12M is a desk preset (PeriodControl) — do not redirect.
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/ltv?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const range = resolvePeriod(preset, new Date(), deskTz);
  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let shopifyOrderWindowLimited = false;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    // First-order-month OrderFact backfill — chunked so paint stays fast.
    void scheduleFirstSessionShopifyWindow(admin, shop.id);
    /*
     * HARD-STOP: same as Home / Close / Allocation — never unbounded
     * fetchShopifySales for a multi-day period. Facts + capped today only.
     */
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
      signal: request.signal,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesTruncated = desk.todaySalesTruncated;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    shopifyOrderWindowLimited =
      Boolean(desk.factsCoverage?.periodExceedsFactWindow) ||
      periodMayExceedShopifyOrderWindow(range);
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(settings.salesBasis, "total"),
  });
  const orderBackfillProgress = useSampleDesk
    ? null
    : await getOrderBackfillProgress(shop.id, {
        ianaTimezone: shop.ianaTimezone,
      });
  const liveSpendCount = await prisma.spendEntry.count({
    where: { shopId: shop.id, NOT: { source: "sample" } },
  });
  const entitlements = await resolveShopEntitlements(session.shop);
  const liveHistoryLocked =
    !useSampleDesk && isBillingEnabled() && !entitlements.isPro;
  // Order-history depth pack (spend-build curves, retention grid, product
  // journeys, first-order-size tiers, best-customer recency) over the trailing
  // order window — independent of the period slicer, like Growth's come-back.
  const depth = await loadLtvDepth({ shopId: shop.id, useSampleDesk });
  return {
    metrics,
    depth,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
    marginConfirmed: marginIsConfirmed(settings),
    orderBackfillProgress,
    hasLiveSpend: liveSpendCount > 0,
    installedAt: shop.createdAt.toISOString(),
    liveHistoryLocked,
    shopLabel: session.shop,
  };
};

export default function LtvPage() {
  const currency = useDeskCurrency();
  const {
    metrics,
    depth,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
    marginConfirmed,
    orderBackfillProgress,
    hasLiveSpend,
    installedAt,
    liveHistoryLocked,
    shopLabel,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  // salesError / mock → sales unavailable; otherwise live sales (deskPeriodTillLabel)
  const tillLabel = deskPeriodTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    shotMode,
    salesError,
    blockedMockAsLive: metrics.blockedMockAsLive,
    salesSource: metrics.salesSource,
    todaySalesTruncated: !useSampleDesk && todaySalesTruncated,
    todaySalesUnavailable: !useSampleDesk && todaySalesUnavailable,
    shopifyOrderWindowLimited: !useSampleDesk && shopifyOrderWindowLimited,
    includeShopifyOrderWindow: true,
  });

  const ltv = metrics.tillLtv;
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
  const daily = flagshipDailyRead(depth.windows, depth.predictive);
  const historyLimited = Boolean(
    !useSampleDesk &&
      (orderBackfillProgress?.historyLimited || ltv.historyLimited),
  );
  const ltvPeek = daily
    ? { amount: daily.worth, days: daily.worthDays }
    : pickShareableLtvPeek({
        revenue30: ltv.avgRevenueD30,
        revenue90: ltv.avgRevenueD90,
        revenue365: ltv.avgRevenueD365,
        historyLimited,
      });
  const insightView = metrics.salesPending
    ? emptyShareableInsights()
    : buildShareableInsights(
        {
          salesPending: Boolean(metrics.salesPending),
          orderCount: metrics.orderCount,
          returningSales: shopBook.returningSales,
          returningShare: shopBook.returningSalesShare,
          newSales: shopBook.newSales,
          typicalOrder: metrics.shopifyDepth.medianAov,
          daysToSecond: metrics.shopifyDepth.medianDaysToSecond,
          ltvPeek: ltvPeek?.amount ?? null,
          ltvPeekDays: ltvPeek?.days ?? null,
          historyLimited,
          shopLabel,
          sample: useSampleDesk,
          periodLabel: metrics.period.label,
        },
        (n) => formatCurrency(n, currency),
      );
  const custOk = metrics.customerMetricsAvailable;
  const newCount = custOk ? metrics.newCustomers : 0;
  const retCount = custOk ? metrics.returningCustomers : 0;
  const knownBuyers = newCount + retCount;
  const hasSpend = metrics.totalSpend > 0;
  const marginNote = marginConfirmed
    ? `After ${pct(metrics.marginPct)} margin from Settings.`
    : `After ${pct(metrics.marginPct)} margin — the default until you confirm in Settings.`;

  const cashCac = isNum(ltv.cashCac)
    ? ltv.cashCac
    : hasSpend && newCount > 0
      ? metrics.totalSpend / newCount
      : hasSpend && ltv.newBuyers > 0
        ? metrics.totalSpend / ltv.newBuyers
        : null;
  const contrib90 = contributionAdjustedLtv(ltv.avgRevenueD90, metrics.marginPct);
  const contrib365 = contributionAdjustedLtv(
    ltv.avgRevenueD365,
    metrics.marginPct,
  );
  const contribRatio = contributionLtvCacRatio(contrib90, ltv.cashCac);

  /*
   * The signature LTV build — how a new customer's spend grows 30 → 90 → 365.
   * Order revenue only; the year bar stays a — until enough buyers have lived
   * a year (thin / young shop), never a fake complete 365. — is not $0 LTV.
   */
  const yearOnFile = isNum(ltv.avgRevenueD365);
  const yearPending = !yearOnFile;
  const buildWindows: LtvBuildWindow[] = [
    {
      key: "d30",
      label: "First 30 days",
      value: isNum(ltv.avgRevenueD30) ? ltv.avgRevenueD30 : null,
      detail: PRODUCT_NOUN.ltv30Def,
    },
    {
      key: "d90",
      label: "First 90 days",
      value: isNum(ltv.avgRevenueD90) ? ltv.avgRevenueD90 : null,
      detail: PRODUCT_NOUN.ltv90Def,
    },
    {
      key: "d365",
      label: "First year",
      value: yearOnFile ? ltv.avgRevenueD365 : null,
      detail: yearOnFile
        ? PRODUCT_NOUN.ltv365Def
        : "Not on file yet — not enough buyers have lived a full year. Not $0 LTV.",
      pending: yearPending,
    },
  ];
  const buildCaption = yearPending
    ? "First year is not on file yet — not enough buyers have lived a year. Not $0."
    : undefined;

  /*
   * Value windows lead the page — order revenue first, never spend. Unknown
   * windows are omitted so the grid never prints a boxed dash next to real
   * dollars; First year is the exception when the year has not sealed (— means
   * not on file, not $0 LTV). `ltvWindowCaption` (lib/contrib-ltv) says the window
   * caveat in glossary words this desk keeps out of merchant chrome — the
   * per-row sentence and the build chart say it plainly instead.
   */
  const orderRows: LtvRow[] = [];
  if (isNum(ltv.avgRevenueD30) && ltv.avgRevenueD30 > 0) {
    orderRows.push({
      k: "First 30 days",
      v: formatCurrency(ltv.avgRevenueD30, currency),
      d: PRODUCT_NOUN.ltv30Def,
    });
  }
  if (isNum(ltv.avgOrdersD90) && ltv.avgOrdersD90 > 0) {
    orderRows.push({
      k: "Orders in first 90 days on file",
      v: ltv.avgOrdersD90.toFixed(1),
      d: "Average orders per new-on-file buyer in the first 90 days after their first visible order. A buyer with earlier Shopify orders is not counted as new.",
    });
  }
  if (isNum(ltv.avgRevenueD365) && ltv.avgRevenueD365 > 0) {
    orderRows.push({
      k: "First year",
      v: formatCurrency(ltv.avgRevenueD365, currency),
      d: PRODUCT_NOUN.ltv365Def,
      ...(hasSpend && contrib365 != null
        ? { x: [`${formatCurrency(contrib365, currency)} kept. ${marginNote}`] }
        : {}),
    });
  } else if (isNum(ltv.avgRevenueD90) || isNum(ltv.avgRevenueD30)) {
    orderRows.push({
      k: "First year",
      v: "—",
      d: "Not on file yet — not enough buyers have lived a full year. Not $0 LTV.",
      keepDash: true,
    });
  }
  if (isNum(ltv.repeatRate)) {
    orderRows.push({
      k: "Repeat orders",
      v: pct(ltv.repeatRate),
      d: "Extra orders beyond the first in the first 90 days — an average across new customers, not a promise.",
    });
  }

  /*
   * Cost & margin economics — optional, order-led first. Margin-kept and Cash
   * CAC only paint once spend is typed. On SAMPLE Snowdevil spend is on file so
   * these show, but they never lead ahead of the order-revenue windows above.
   */
  const economicsRows: LtvRow[] = [];
  if (contrib90 != null && hasSpend) {
    economicsRows.push({
      k: "Kept after margin",
      v: formatCurrency(contrib90, currency),
      d: `First 90 days of revenue times your margin. ${marginNote}`,
    });
  }
  if (hasSpend && cashCac != null) {
    economicsRows.push({
      k: "Cash CAC",
      v: formatCurrency(cashCac, currency),
      d: `${PRODUCT_NOUN.cashCacDef}. Blended — not platform CAC, not per ad.`,
      x: [
        ltv.paybackDays != null
          ? `Recovered in about ${ltv.paybackDays} days on average.`
          : ltv.historyLimited
            ? "Payback past 90 days needs a full year of orders — not on file yet."
            : "Not recovered inside the first year on average.",
        ...(ltv.newBuyers > 0
          ? [`${ltv.newBuyers.toLocaleString()} new customers in this window.`]
          : []),
      ],
    });
  }
  if (hasSpend && isNum(ltv.ltvCacRatio)) {
    economicsRows.push({
      k: "Value vs cost",
      v: `${ltv.ltvCacRatio.toFixed(2)}×`,
      d: "First 90 days of revenue ÷ Cash CAC. An average, not a causal claim.",
      ...(contribRatio != null
        ? { x: [`${contribRatio.toFixed(2)}× after margin.`] }
        : {}),
    });
  }
  if (hasSpend && knownBuyers > 0) {
    economicsRows.push({
      k: "Spend per buyer",
      v: formatCurrency(metrics.totalSpend / knownBuyers, currency),
      d: "Spend you entered ÷ identified buyers in this window. Shopify Analytics has no spend.",
    });
  }

  /*
   * First-order months — depth as drill rows, not a wall of table cells.
   * The 30/90/365 windows start at each customer's first order, so they run
   * longer than the selected period; each row says so in shop-owner English.
   */
  const monthRows: LtvRow[] = ltv.cohorts.map((row) => {
    const d90 = perCustomerRevenue(row.revenueD90, row.customers);
    const d30 = perCustomerRevenue(row.revenueD30, row.customers);
    const d365 = perCustomerRevenue(row.revenueD365, row.customers);
    const later = [
      d30 != null && d30 > 0 ? `30 days ${formatCurrency(d30, currency)}` : null,
      d365 != null && d365 > 0
        ? `First year ${formatCurrency(d365, currency)}`
        : null,
    ].filter((part): part is string => part != null);
    return {
      k: `First on file · ${row.cohortMonth}`,
      v: d90 != null && d90 > 0 ? formatCurrency(d90, currency) : "—",
      s: later.length > 0 ? later.join(" · ") : undefined,
      d: `${row.customers.toLocaleString()} customers had a first visible order that month. Value is 90 days after that order — not lifetime first if they bought before this window.`,
    };
  }).filter((row) => row.v !== "—");

  const emptyLine =
    ltv.emptyReason === "no_timezone"
      ? "Shop timezone needed before first orders can bucket by local day."
      : ltv.emptyReason === "history_limited"
        ? "First-year value is not on file yet — not enough buyers have lived a year. Not $0 LTV."
        : orderBackfillProgress
          ? "Orders still syncing — not $0. Refresh this page."
          : "Orders still syncing — not $0.";

  /*
   * The Black Clover depth pack — order history only, no spend. Curves and the
   * retention grid need more than a single window; on a thin or young live
   * book they collapse to honest empties and product journeys never paint (no
   * titles on file). On SAMPLE Snowdevil the whole pack is dense.
   */
  const depthHasAny = Boolean(
    depth.curves ||
      depth.retention ||
      depth.paths.length > 0 ||
      depth.aov.length > 0 ||
      depth.basket.length > 0 ||
      depth.whales ||
      depth.windows ||
      depth.predictive ||
      depth.monthWindows.length > 0 ||
      depth.productLtv.read ||
      depth.productLtv.empty ||
      depth.promoLtv.read ||
      depth.promoLtv.empty ||
      (depth.refunds && depth.refunds.orderCount > 0),
  );

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.ltvTitle}
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
      orderFactsTruncated={
        !useSampleDesk && Boolean(orderBackfillProgress?.truncated)
      }
      todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
      todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}
      shopifyOrderWindowLimited={!useSampleDesk && shopifyOrderWindowLimited}
      periodLabel={metrics.period.label}
      showPeriod={false}
    >
      {useSampleDesk && !shotMode ? (
        <SampleDeskBanner note="LTV below uses SAMPLE sales — not this shop’s Shopify orders." />
      ) : null}

      {salesError && !shotMode ? (
        <section className="mcfly-state mcfly-state--critical mcfly-state--soft" aria-label="Sales load error">
          <p className="mcfly-state__copy">
            Sales didn’t load. Retry to see what new customers spend.
          </p>
          <div className="mcfly-state__cta">
            <s-button href={`/app/ltv?period=${preset}`} variant="primary">
              Retry
            </s-button>
          </div>
        </section>
      ) : null}

      <section className="mcfly-book" aria-label="What new customers spend">
        <p className="mcfly-book__lede">
          Shopify Analytics shows LTV reports, if any. This page shows first 90 days after the first order on file — not lifetime first when a year is not on file yet. {PRODUCT_NOUN.ltvNotInShopify}
        </p>

        {ltv.available && isNum(ltv.avgRevenueD90) && ltv.avgRevenueD90 > 0 ? (
          <div className="mcfly-book__hero">
            <p className="mcfly-book__hero-k">First 90 days on file</p>
            <p className="mcfly-book__hero-v">
              {formatCurrency(ltv.avgRevenueD90, currency)}
            </p>
            <p className="mcfly-book__hero-def">
              {PRODUCT_NOUN.ltv90Def}
              {metrics.tillLtv.newBuyers > 0
                ? ` ${metrics.tillLtv.newBuyers.toLocaleString()} new customers.`
                : ""}
            </p>
          </div>
        ) : (
          <p className="mcfly-book__lede">{emptyLine}</p>
        )}

        <LtvValueBuild
          windows={buildWindows}
          newBuyers={metrics.tillLtv.newBuyers}
          caption={buildCaption}
        />

        <BookFactGrid facts={orderRows} />

        {yearPending && (isNum(ltv.avgRevenueD90) || isNum(ltv.avgRevenueD30)) ? (
          <p className="mcfly-book__lede">
            First year is not on file yet — not enough buyers have lived a year.
            Not $0.
          </p>
        ) : null}

        {liveHistoryLocked && !shotMode ? <UnlockFullHistoryBanner /> : null}
      </section>

      {depthHasAny ? (
        <section className="mcfly-book mcfly-depth-intro" aria-label="Order-history depth">
          <p className="mcfly-book__lede">
            {useSampleDesk
              ? "What a new buyer is worth is from SAMPLE Snowdevil orders. Explorers below stay on that same book. Order history only, no spend."
              : "What a new buyer is worth, then the order-history explorers. Full history when it is on file. No spend required."}
          </p>
        </section>
      ) : !useSampleDesk ? (
        <p className="mcfly-book__lede">
          Spend-build curves, who kept ordering, product journeys and best-customer
          recency need more than a handful of identified buyers — not $0. They
          fill as the order book deepens.
        </p>
      ) : null}

      <LtvFlagshipBoard
        windows={depth.windows}
        predictive={depth.predictive}
        refunds={depth.refunds}
        buyers={depth.buyers}
      />
      <LtvProductBoard product={depth.productLtv} />
      {/* Placement: LTV tab, after Product→LTV, before spend-build explorers. */}
      <LtvPromoBoard promo={depth.promoLtv} />
      <LtvBuildCurves curves={depth.curves} buyers={depth.buyers} />
      <LtvRetentionHeat heat={depth.retention} buyers={depth.buyers} />
      <LtvTierTables aov={depth.aov} basket={depth.basket} />
      <LtvPathTable paths={depth.paths} clarity={depth.pathClarity} />
      <LtvWhaleRecency whales={depth.whales} />
      <ShareableInsightCards view={insightView} shotMode={shotMode} />

      {economicsRows.length > 0 ? (
        <section className="mcfly-book" aria-label="Cost and margin">
          <p className="mcfly-book__lede">
            Spend you entered, next to what a new customer is worth. Averages,
            not causal — and never ahead of the order value above.
          </p>
          <BookFactGrid facts={economicsRows} />
        </section>
      ) : null}

      {monthRows.length > 0 && !depth.curves ? (
        <section className="mcfly-book" aria-label="First orders by month">
          <p className="mcfly-book__lede">
            First orders by month — each month shows what those customers spent
            later. Averages from order history, not a forecast.
          </p>
          <BookFactGrid facts={monthRows} />
        </section>
      ) : null}

      <footer className="mcfly-book__links">
        {hasSpend ? (
          <s-link href="/app/cpa">CPA</s-link>
        ) : (
          <s-link href="/app/spend">Spend Upload</s-link>
        )}
      </footer>

      <ReviewAsk
        hasLiveSpend={hasLiveSpend}
        useSampleDesk={useSampleDesk}
        shotMode={shotMode}
        installedAt={installedAt}
      />
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/ltv" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
