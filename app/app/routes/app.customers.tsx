import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { CustomersScoreboard } from "../components/CustomersScoreboard";
import { CustomerMixChart } from "../components/CustomerMixChart";
import { CustomerRetentionBoard } from "../components/CustomerRetentionBoard";
import { CustomerWhaleWatch } from "../components/CustomerWhaleWatch";
import { CustomerRfmBoard } from "../components/CustomerRfmBoard";
import { CustomerValueBands } from "../components/CustomerValueBands";
import { CustomerWhaleTable } from "../components/CustomerWhaleTable";
import { CustomerConcentrationChart } from "../components/CustomerConcentrationChart";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import { DeskLane } from "../components/DeskLane";
import { CustomersCompareGlance } from "../components/CustomersCompareGlance";
import { CustomersFirstViewport } from "../components/CustomersFirstViewport";
import { CustomersGrowthSection } from "../components/CustomersGrowthSection";
import {
  CustomersLtvDepth,
  CustomersLtvEconomics,
  CustomersLtvWindows,
} from "../components/CustomersLtvSection";
import { UnlockFullHistoryBanner } from "../components/UnlockFullHistoryBanner";
import {
  LiveDeskLockedNotice,
  LiveDeskLockedPage,
} from "../components/LiveDeskLockedPage";
import { ReviewAsk } from "../components/ReviewAsk";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { loadCustomersStackPage } from "../lib/desk-customers-stack.server";
import {
  customersLivePageDecision,
  liveDeskLockedCopy,
} from "../lib/live-desk-surface";
import { resolveLiveUnparkStage } from "../lib/live-unpark";
import { requireAdmin } from "../lib/public-app-gate.server";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { CUSTOMERS_FIRST_LANE_LABEL } from "../lib/customers-first-viewport";
import {
  namedDeskScreenFromPath,
  namedDeskTitle,
} from "../lib/desk-request-screen";
import { useDeskHref } from "../lib/desk-base-path";
import { GROWTH_FIRST_LANE_LABEL } from "../lib/growth-first-viewport";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { flagshipDailyRead } from "../lib/ltv-flagship";
import {
  buildShareableInsights,
  emptyShareableInsights,
  pickShareableLtvPeek,
} from "../lib/shareable-insights";
import {
  customersOnScreenWindow,
  labelCustomersDaysToSecondCard,
  type CustomersWindowDays,
} from "../lib/customers-days-to-second";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await requireAdmin(request);
  const decision = customersLivePageDecision({
    sampleDesk: await getSampleDeskEnabled(session.shop),
    stage: resolveLiveUnparkStage(),
  });
  if (decision.serve === "locked") {
    return {
      kind: "locked" as const,
      stage: decision.stage,
      copy: decision.copy,
    };
  }
  const page = await loadCustomersStackPage(request, {
    includeLtv: decision.ltvOpen,
  });
  return {
    ...page,
    kind: "open" as const,
    ltvOpen: decision.ltvOpen,
    growthOpen: decision.growthOpen,
    liveStage: decision.stage,
  };
};

export default function CustomersPage() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  const location = useLocation();
  const deskHref = useDeskHref();
  const pathScreen = namedDeskScreenFromPath(location.pathname);
  if (data.kind === "locked") {
    const lockedHeading = pathScreen
      ? namedDeskTitle(pathScreen)
      : PRODUCT_NOUN.buyersTitle;
    if (pathScreen === "ltv") {
      return (
        <LiveDeskLockedPage
          heading={lockedHeading}
          surface="ltv"
          copy={data.copy}
        />
      );
    }
    if (pathScreen === "growth" || pathScreen === "who-to-save") {
      return (
        <LiveDeskLockedPage
          heading={lockedHeading}
          surface="growth"
          copy={data.copy}
        />
      );
    }
    return (
      <LiveDeskLockedPage
        heading={lockedHeading}
        surface="customers"
        copy={data.copy}
      />
    );
  }
  const {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
    factsIncomplete,
    orderBackfillProgress,
    analytics,
    comeback,
    depth,
    marginConfirmed,
    hasLiveSpend,
    installedAt,
    liveHistoryLocked,
    shopLabel,
    panel,
    orderBookDepth,
    ltvOpen,
    growthOpen,
    liveStage,
  } = data;
  const screen =
    pathScreen ??
    (panel === "ltv" ? "ltv" : panel === "growth" ? "growth" : null);
  const showCustomers = screen == null;
  const showLtv = screen === "ltv";
  const showGrowth = screen === "growth";
  const showSave = screen === "who-to-save";
  const pageHeading =
    screen === "ltv" || screen === "growth" || screen === "who-to-save"
      ? namedDeskTitle(screen)
      : PRODUCT_NOUN.buyersTitle;
  const isLoading = navigation.state === "loading";
  const tillLabel = deskPeriodTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    shotMode,
    salesError,
    blockedMockAsLive: metrics.blockedMockAsLive,
    salesSource: metrics.salesSource,
    factsIncomplete: !useSampleDesk && factsIncomplete,
    todaySalesTruncated: !useSampleDesk && todaySalesTruncated,
    todaySalesUnavailable: !useSampleDesk && todaySalesUnavailable,
    shopifyOrderWindowLimited: !useSampleDesk && shopifyOrderWindowLimited,
    includeShopifyOrderWindow: true,
    orderBookDepth,
  });
  const book = shopifyNativePeriodStats({
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
  const historyLimited = Boolean(
    !useSampleDesk &&
      (orderBackfillProgress?.historyLimited || metrics.tillLtv.historyLimited),
  );
  const ltvBlock =
    ltvOpen && depth
      ? {
          metrics: {
            tillLtv: metrics.tillLtv,
            totalSpend: metrics.totalSpend,
            marginPct: metrics.marginPct,
            salesPending: Boolean(metrics.salesPending),
            newCustomers: metrics.newCustomers,
            returningCustomers: metrics.returningCustomers,
            customerMetricsAvailable: metrics.customerMetricsAvailable,
            period: { label: metrics.period.label },
          },
          depth,
          marginConfirmed,
          useSampleDesk,
          orderBackfillProgress,
          shopLabel,
          shotMode,
        }
      : null;
  const daily = ltvBlock
    ? flagshipDailyRead(ltvBlock.depth.windows, ltvBlock.depth.predictive)
    : null;
  const ltvPeek = !ltvOpen
    ? null
    : daily
      ? { amount: daily.worth, days: daily.worthDays }
      : pickShareableLtvPeek({
          revenue30: metrics.tillLtv.avgRevenueD30,
          revenue90: metrics.tillLtv.avgRevenueD90,
          revenue365: metrics.tillLtv.avgRevenueD365,
          historyLimited,
        });
  const insightView = metrics.salesPending
    ? emptyShareableInsights()
    : buildShareableInsights(
        {
          salesPending: Boolean(metrics.salesPending),
          orderCount: metrics.orderCount,
          returningSales: book.returningSales,
          returningShare: book.returningSalesShare,
          newSales: book.newSales,
          typicalOrder: metrics.shopifyDepth.medianAov,
          daysToSecond: metrics.shopifyDepth.medianDaysToSecond,
          ltvPeek: ltvPeek?.amount ?? null,
          ltvPeekDays: ltvPeek?.days ?? null,
          historyLimited,
          shopLabel,
          sample: useSampleDesk,
          periodLabel: metrics.period.label,
          todaySalesTruncated: !useSampleDesk && todaySalesTruncated,
        },
        (n) => formatCurrency(n, currency),
      );
  const returningInsight = {
    ...insightView,
    cards: insightView.cards.filter((card) => card.kind === "returning"),
    empty: null,
  };
  const windowDays: CustomersWindowDays = {
    label: customersOnScreenWindow(metrics.period.label),
    days: metrics.shopifyDepth.medianDaysToSecond,
    cameBack: metrics.shopifyDepth.repeatBuyers,
  };
  const depthInsight = {
    ...insightView,
    cards: insightView.cards
      .filter(
        (card) =>
          card.kind !== "returning" && (ltvOpen || card.kind !== "ltvPeek"),
      )
      .map((card) => labelCustomersDaysToSecondCard(card, windowDays)),
  };

  return (
    <DeskBookPage
      heading={pageHeading}
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
      orderBookDepth={orderBookDepth}
      orderFactsTruncated={
        !useSampleDesk && Boolean(orderBackfillProgress?.truncated)
      }
      orderBackfillProgress={
        !useSampleDesk && orderBackfillProgress
          ? {
              completeDays: orderBackfillProgress.completeDays,
              windowDays: orderBackfillProgress.windowDays,
              remainingDays: orderBackfillProgress.remainingDays,
            }
          : null
      }
      todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
      todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}
      shopifyOrderWindowLimited={!useSampleDesk && shopifyOrderWindowLimited}
      periodLabel={metrics.period.label}
      showPeriod={false}
      salesError={Boolean(salesError) && !shotMode}
      salesErrorBody="Sales didn’t load. Retry to see returning dollars."
      retryHref={`/app/customers?period=${preset}`}
    >
      <div className="mcfly-desk-anchor mcfly-scoreboard--customers">
      {showCustomers ? (
      <div id="mcfly-returning">
      <DeskLane rank="first" label={showCustomers ? PRODUCT_NOUN.buyersTitle : CUSTOMERS_FIRST_LANE_LABEL} hint="">
        <div className="mcfly-overview-first-beat mcfly-customers-first-beat">
          <CustomersFirstViewport
            analytics={analytics}
            book={book}
            salesPending={Boolean(metrics.salesPending)}
            useSampleDesk={useSampleDesk}
            todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
            periodLabel={
              metrics.period.label === "Month to date"
                ? "This month"
                : metrics.period.label
            }
            windowSales={metrics.sales}
          />
          <CustomersCompareGlance
            book={book}
            lastYear={analytics.lastYearMix}
            salesPending={Boolean(metrics.salesPending)}
          />
        </div>
        <CustomerMixChart
          analytics={analytics}
          salesPending={metrics.salesPending}
          quotedShare={book.returningSalesShare}
          quotedWindow={
            metrics.period.label === "Month to date"
              ? "This month"
              : metrics.period.label
          }
        />
      </DeskLane>
      <DeskLane
        rank="more"
        label="Returning mix and facts"
        fold
        defaultOpen={shotMode}
      >
        {returningInsight.cards.length > 0 ? (
          <ShareableInsightCards view={returningInsight} shotMode={shotMode} />
        ) : null}
        <CustomersScoreboard
          book={book}
          depth={metrics.shopifyDepth}
          periodLabel={metrics.period.label}
          salesPending={metrics.salesPending}
          useSampleDesk={useSampleDesk}
          growthHref={deskHref("/app/growth")}
          ltvHref={deskHref("/app/ltv")}
          ltvNextLabel={ltvOpen ? "Open LTV" : "LTV locked"}
        />
      </DeskLane>
      </div>
      ) : null}

      {showLtv ? (
      <div id="mcfly-ltv">
      {ltvBlock ? (
        <>
          {liveHistoryLocked && !shotMode ? <UnlockFullHistoryBanner /> : null}
          <DeskLane rank="next" label="What a new buyer is worth">
            <CustomersLtvWindows {...ltvBlock} />
            <CustomersLtvEconomics {...ltvBlock} />
          </DeskLane>
        </>
      ) : (
        <LiveDeskLockedNotice
          surface="ltv"
          copy={liveDeskLockedCopy("ltv", liveStage)}
        />
      )}
      </div>
      ) : null}

      {showGrowth ? (
      <div id="mcfly-growth">
      {growthOpen ? (
      <DeskLane rank="next" label={GROWTH_FIRST_LANE_LABEL}>
        <CustomersGrowthSection
          book={book}
          tt2={comeback.tt2}
          depth={comeback.depth}
          cohorts={metrics.tillLtv.cohorts}
          repeatRate={metrics.tillLtv.repeatRate}
          avgOrdersD90={metrics.tillLtv.avgOrdersD90}
          salesPending={Boolean(metrics.salesPending)}
          useSampleDesk={useSampleDesk}
          shopLabel={shopLabel}
          shotMode={shotMode}
          orderSteps={analytics.orderSteps}
          quietBack={analytics.quietBack}
          comebackWait={analytics.comebackWait}
          lifetimeSpan={analytics.lifetimeSpan}
          windowDays={windowDays}
          quotedComeback={{
            historyDays: analytics.historyDays,
            within30Share: analytics.within30Share,
            within30Count: analytics.within30Count,
            eligible30: analytics.eligible30,
            winBackDay: analytics.winBackDay,
            saveNowOneOrder: analytics.saveNowOneOrder,
          }}
        />
      </DeskLane>
      ) : (
        <LiveDeskLockedNotice
          surface="growth"
          copy={liveDeskLockedCopy("growth", liveStage)}
        />
      )}
      </div>
      ) : null}

      {showCustomers ? (
      <div id="mcfly-depth">
      <DeskLane
        rank="more"
        label="Who the dollars sit with"
        fold
        defaultOpen={shotMode || panel === "depth"}
      >
        <div className="mcfly-cust-action-row">
          <CustomerRetentionBoard analytics={analytics} windowDays={windowDays} />
          <CustomerWhaleWatch rfm={analytics.rfm} />
        </div>
        <CustomerRfmBoard rfm={analytics.rfm} />
        <CustomerValueBands analytics={analytics} />
        <CustomerWhaleTable analytics={analytics} />
        {!metrics.salesPending ? (
          <CustomerConcentrationChart book={book} depth={metrics.shopifyDepth} />
        ) : null}
        {ltvBlock ? <CustomersLtvDepth {...ltvBlock} /> : null}
        {depthInsight.cards.length > 0 || depthInsight.empty ? (
          <ShareableInsightCards view={depthInsight} shotMode={shotMode} />
        ) : null}
      </DeskLane>
      </div>
      ) : null}

      {showSave ? (
        <section aria-label="Who to save">
          <CustomerRetentionBoard
            analytics={analytics}
            windowDays={windowDays}
          />
        </section>
      ) : null}

      {showCustomers && !metrics.customerMetricsAvailable ? (
        <p className="mcfly-state__copy">
          Returning dollars need identified buyers in this window — not $0.
        </p>
      ) : null}
      </div>

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
  return <DeskRouteErrorBoundary retryHref="/app/customers" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
