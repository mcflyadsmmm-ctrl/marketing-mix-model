import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
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
import { CustomersFirstViewport } from "../components/CustomersFirstViewport";
import { CustomersGrowthSection } from "../components/CustomersGrowthSection";
import {
  CustomersLtvDepth,
  CustomersLtvEconomics,
  CustomersLtvWindows,
} from "../components/CustomersLtvSection";
import { UnlockFullHistoryBanner } from "../components/UnlockFullHistoryBanner";
import { ReviewAsk } from "../components/ReviewAsk";
import { deskBookLede, deskPeriodTillLabel } from "../lib/desk-history";
import { loadCustomersStackPage } from "../lib/desk-customers-stack.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { CUSTOMERS_FIRST_LANE_LABEL } from "../lib/customers-first-viewport";
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

const CUSTOMERS_CONTRAST =
  "Shopify Analytics Customers is a customer list. Deeper: returning dollars vs new, dollars per buyer, then LTV, growth, and who the dollars sit with.";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadCustomersStackPage(request);
};

export default function CustomersPage() {
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
  } = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
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
  const daily = flagshipDailyRead(depth.windows, depth.predictive);
  const ltvPeek = daily
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
        },
        (n) => formatCurrency(n, currency),
      );
  const ltvProps = {
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
  };

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.buyersTitle}
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
      {metrics.salesPending ? (
        <p className="mcfly-book__lede">
          Sales for closed days are still loading — not $0.
        </p>
      ) : null}

      {useSampleDesk && !shotMode ? (
        <p className="mcfly-book__lede">
          Customer depth below reads SAMPLE Snowdevil order history — not this
          shop’s Shopify orders.
        </p>
      ) : null}

      <div className="mcfly-desk-anchor mcfly-scoreboard--customers">
      <p className="mcfly-book__lede">
        {deskBookLede(CUSTOMERS_CONTRAST, orderBookDepth)}
      </p>

      <div id="mcfly-returning">
      <DeskLane rank="first" label={CUSTOMERS_FIRST_LANE_LABEL}>
        <CustomersFirstViewport
          analytics={analytics}
          book={book}
          salesPending={metrics.salesPending}
          useSampleDesk={useSampleDesk}
        />
        <CustomerMixChart analytics={analytics} salesPending={metrics.salesPending} />
        <CustomersScoreboard
          book={book}
          depth={metrics.shopifyDepth}
          periodLabel={metrics.period.label}
          salesPending={metrics.salesPending}
          useSampleDesk={useSampleDesk}
          growthHref="#mcfly-growth"
          ltvHref="#mcfly-ltv"
        />
      </DeskLane>
      </div>

      <div id="mcfly-ltv">
      {liveHistoryLocked && !shotMode ? <UnlockFullHistoryBanner /> : null}
      <DeskLane rank="next" label="What a new buyer is worth">
        <CustomersLtvWindows {...ltvProps} />
        <CustomersLtvEconomics {...ltvProps} />
      </DeskLane>
      </div>

      <div id="mcfly-growth">
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
        />
      </DeskLane>
      </div>

      <div id="mcfly-depth">
      <DeskLane
        rank="more"
        label="Who the dollars sit with"
        fold
        defaultOpen={shotMode || panel === "depth"}
      >
        <div className="mcfly-cust-action-row">
          <CustomerRetentionBoard analytics={analytics} />
          <CustomerWhaleWatch rfm={analytics.rfm} />
        </div>
        <CustomerRfmBoard rfm={analytics.rfm} />
        <CustomerValueBands analytics={analytics} />
        <CustomerWhaleTable analytics={analytics} />
        {!metrics.salesPending ? (
          <CustomerConcentrationChart book={book} depth={metrics.shopifyDepth} />
        ) : null}
        <CustomersLtvDepth {...ltvProps} />
        <ShareableInsightCards view={insightView} shotMode={shotMode} />
      </DeskLane>
      </div>

      {!metrics.customerMetricsAvailable ? (
        <p className="mcfly-book__lede">
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
