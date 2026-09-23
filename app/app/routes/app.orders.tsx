import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { OrdersCompareGlance } from "../components/OrdersCompareGlance";
import { OrdersFirstViewport } from "../components/OrdersFirstViewport";
import { OrdersScoreboard } from "../components/OrdersScoreboard";
import { OrdersTimingChart } from "../components/OrdersTimingChart";
import { OrdersIntelligence } from "../components/OrdersIntelligence";
import { OrdersFrequencyChart } from "../components/OrdersFrequencyChart";
import { DeskLane } from "../components/DeskLane";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  ORDERS_CLOCK_LANE_LABEL,
  ORDERS_FIRST_LANE_LABEL,
} from "../lib/orders-first-viewport";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDeskSalesPage(request, "/app/orders", {
    includeOrdersIntelligence: true,
  });
};

export default function OrdersPage() {
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
    ordersIntel,
    ordersFrequency,
    orderBookDepth,
  } = useLoaderData<typeof loader>();
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
  const totalSalesDisplay = metrics.totalSalesAmount ?? metrics.sales;

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.ordersTitle}
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
      salesErrorBody="Sales didn’t load. Retry to see typical order and weekends."
      retryHref={`/app/orders?period=${preset}`}
    >
      <div className="mcfly-desk-anchor mcfly-scoreboard--orders">
        <DeskLane rank="first" label={ORDERS_FIRST_LANE_LABEL} hint="">
          <div className="mcfly-overview-first-beat mcfly-orders-first-beat">
            <OrdersFirstViewport
              depth={metrics.shopifyDepth}
              salesPending={Boolean(metrics.salesPending)}
              useSampleDesk={useSampleDesk}
              stepMix={ordersIntel?.stepMix ?? null}
              tickets={ordersIntel?.tickets ?? null}
              todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
              periodLabel={
                metrics.period.label === "Month to date"
                  ? "This month"
                  : metrics.period.label
              }
            />
            <OrdersCompareGlance
              intel={ordersIntel ?? null}
              salesPending={Boolean(metrics.salesPending)}
            />
          </div>
          <OrdersTimingChart
            weekdayShares={metrics.shopifyDepth.weekdaySalesShare}
            hourlyShares={metrics.shopifyDepth.hourlySalesShare}
            windowSales={metrics.sales}
            peakWeekday={metrics.shopifyDepth.peakWeekday}
            peakHour={metrics.shopifyDepth.peakHour}
            salesPending={Boolean(metrics.salesPending)}
            timingSplit={ordersIntel?.timingSplit ?? null}
          />
        </DeskLane>
        <DeskLane
          rank="more"
          label={ORDERS_CLOCK_LANE_LABEL}
          fold
          defaultOpen={shotMode}
        >
          <OrdersScoreboard
            book={book}
            depth={metrics.shopifyDepth}
            clocks={{
              gross: metrics.grossSales,
              grossKnown: metrics.grossSalesKnown,
              total: totalSalesDisplay,
              net: metrics.netSales,
              netKnown: metrics.netSalesKnown,
            }}
            salesPending={Boolean(metrics.salesPending)}
            useSampleDesk={useSampleDesk}
          />
          {ordersIntel && !metrics.salesPending ? (
            <OrdersIntelligence intel={ordersIntel} />
          ) : null}
          {ordersFrequency && ordersFrequency.length > 1 && !metrics.salesPending ? (
            <OrdersFrequencyChart buckets={ordersFrequency} />
          ) : null}
        </DeskLane>
        <footer className="mcfly-book__links">
          <s-link href="/app">{PRODUCT_NOUN.overviewTitle}</s-link>
          <s-link href="/app/customers">{PRODUCT_NOUN.buyersTitle}</s-link>
          <s-link href="/app/customers?panel=growth">
            {PRODUCT_NOUN.growthTitle}
          </s-link>
          <s-link href="/app/customers?panel=ltv">{PRODUCT_NOUN.openLtv}</s-link>
        </footer>
      </div>
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/orders" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
