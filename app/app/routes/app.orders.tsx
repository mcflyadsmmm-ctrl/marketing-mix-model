import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { OrdersScoreboard } from "../components/OrdersScoreboard";
import { OrdersTimingChart } from "../components/OrdersTimingChart";
import { OrdersIntelligence } from "../components/OrdersIntelligence";
import { OrdersFrequencyChart } from "../components/OrdersFrequencyChart";
import { DeskLane } from "../components/DeskLane";
import { deskBookLede, deskPeriodTillLabel } from "../lib/desk-history";
import { PRODUCT_NOUN } from "../lib/product-labels";
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
      orderFactsTruncated={
        !useSampleDesk && Boolean(orderBackfillProgress?.truncated)
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
      {metrics.salesPending ? (
        <p className="mcfly-book__lede">
          Sales for closed days are still loading — not $0.
        </p>
      ) : null}
      <div className="mcfly-desk-anchor mcfly-scoreboard--orders">
        <p className="mcfly-book__lede">
          {deskBookLede(
            "Shopify Analytics shows the average order. This page shows the typical order (median) vs the average, discounts, 2+ items, then weekend, hour, and Online vs POS. Pending sales are a banner — the board still paints from orders on file.",
          )}
        </p>
        <DeskLane rank="first" label="Typical order">
          {ordersIntel && !metrics.salesPending ? (
            <OrdersIntelligence intel={ordersIntel} />
          ) : null}
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
        </DeskLane>
        <DeskLane rank="next" label="Weekday and hour">
          <OrdersTimingChart
            weekdayShares={metrics.shopifyDepth.weekdaySalesShare}
            hourlyShares={metrics.shopifyDepth.hourlySalesShare}
            windowSales={metrics.sales}
            peakWeekday={metrics.shopifyDepth.peakWeekday}
            peakHour={metrics.shopifyDepth.peakHour}
            salesPending={Boolean(metrics.salesPending)}
          />
          {ordersFrequency && ordersFrequency.length > 1 && !metrics.salesPending ? (
            <OrdersFrequencyChart buckets={ordersFrequency} />
          ) : null}
        </DeskLane>
        <footer className="mcfly-book__links">
          <s-link href="/app">{PRODUCT_NOUN.overviewTitle}</s-link>
          <s-link href="/app/customers">{PRODUCT_NOUN.buyersTitle}</s-link>
          <s-link href="/app/growth">{PRODUCT_NOUN.growthTitle}</s-link>
          <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
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
