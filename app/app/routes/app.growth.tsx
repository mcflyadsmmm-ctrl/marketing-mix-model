import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { GrowthComebackChart } from "../components/GrowthComebackChart";
import { GrowthScoreboard } from "../components/GrowthScoreboard";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { loadGrowthComeback } from "../lib/desk-growth-page.server";
import {
  growthFirstOrderMonths,
  growthOrderDepthBars,
} from "../lib/growth-comeback";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";

const GROWTH_LEDE =
  "Shopify Analytics Overview shows a returning-customer rate. This page shows first-time dollars, days to a second order, and who came back within 30 days — from order history, not an email list.";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const base = await loadDeskSalesPage(request, "/app/growth");
  const comeback = await loadGrowthComeback(request, {
    useSampleDesk: base.useSampleDesk,
    windowEnd: base.metrics.period.end,
  });
  return { ...base, comeback };
};

export default function GrowthPage() {
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
    comeback,
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

  // Come-back stats read the trailing order-history window, not the hidden
  // month slice — a month-to-date window cannot hold a 30-day come-back.
  const depth = comeback.depth;
  const repeatRate = metrics.tillLtv.repeatRate;
  const orderDepthBars = growthOrderDepthBars(depth);
  const firstOrderMonths = growthFirstOrderMonths(metrics.tillLtv.cohorts);

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.growthTitle}
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
      salesErrorBody="Sales didn’t load. Retry to see who came back."
      retryHref={`/app/growth?period=${preset}`}
    >
      {useSampleDesk && !shotMode ? (
        <p className="mcfly-book__lede">
          Who came back below uses SAMPLE Snowdevil order history — not this
          shop’s Shopify orders.
        </p>
      ) : null}

      {metrics.salesPending ? (
        <p className="mcfly-book__lede">
          Sales for closed days are still loading — not $0.
        </p>
      ) : null}

      <p className="mcfly-book__lede">{GROWTH_LEDE}</p>

      {/* Explorer first — comeback / first-order months at the Customers-marquee
          craft bar. Soft cards sit under; the book hero + fact grid is gone. */}
      <GrowthComebackChart
        depthBars={orderDepthBars}
        months={firstOrderMonths}
        depth={depth}
        repeatRate={repeatRate}
        firstTimeDollars={book.newSales}
        salesPending={metrics.salesPending}
        drillNext="Open LTV for what each first order is worth in 30 / 90 / 365 days."
        drillHref="/app/ltv"
        drillLabel={PRODUCT_NOUN.openLtv}
      />

      <GrowthScoreboard
        book={book}
        depth={depth}
        repeatRate={repeatRate}
        avgOrdersD90={metrics.tillLtv.avgOrdersD90}
        salesPending={metrics.salesPending}
        useSampleDesk={useSampleDesk}
      />

      <footer className="mcfly-book__links">
        <s-link href="/app/customers">{PRODUCT_NOUN.buyersTitle}</s-link>
        <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
      </footer>
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/growth" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
