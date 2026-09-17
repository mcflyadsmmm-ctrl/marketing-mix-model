import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { CustomersScoreboard } from "../components/CustomersScoreboard";
import { CustomerMixChart } from "../components/CustomerMixChart";
import { CustomerRetentionBoard } from "../components/CustomerRetentionBoard";
import { CustomerValueBands } from "../components/CustomerValueBands";
import { CustomerWhaleTable } from "../components/CustomerWhaleTable";
import { CustomerConcentrationChart } from "../components/CustomerConcentrationChart";
import { deskBookLede, deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { loadCustomerAnalytics } from "../lib/desk-customers-page.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";

// Shopify Analytics Overview shows a returning-customer rate (headcount); this
// tab is one spine: explorer → What-to-do / retention → value bands / whales.
const CUSTOMERS_CONTRAST =
  "Shopify Analytics Overview shows a returning-customer rate — headcount. Deeper: returning dollars, when they come back, and who to save — from this shop's orders.";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const base = await loadDeskSalesPage(request, "/app/customers");
  const analytics = await loadCustomerAnalytics(request, {
    useSampleDesk: base.useSampleDesk,
    windowEnd: base.metrics.period.end,
  });
  return { ...base, analytics };
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

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.buyersTitle}
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

      <p className="mcfly-book__lede">{deskBookLede(CUSTOMERS_CONTRAST)}</p>

      {/* 1. Marquee explorer — new vs returning $ dual-axis, above the fold. */}
      <CustomerMixChart analytics={analytics} salesPending={metrics.salesPending} />

      {/* 2. Compact returning hero — gauge + three unique facts, not a tile wall. */}
      <CustomersScoreboard
        book={book}
        depth={metrics.shopifyDepth}
        periodLabel={metrics.period.label}
        salesPending={metrics.salesPending}
        useSampleDesk={useSampleDesk}
      />

      {/* 3. What to do — repurchase clock, fall-off, win-back, save-now. */}
      <CustomerRetentionBoard analytics={analytics} />

      {/* 4. Value bands / whales as needed — who the dollars sit with. */}
      <CustomerValueBands analytics={analytics} />
      <CustomerWhaleTable analytics={analytics} />

      {!metrics.salesPending ? (
        <CustomerConcentrationChart book={book} depth={metrics.shopifyDepth} />
      ) : null}

      {!metrics.customerMetricsAvailable ? (
        <p className="mcfly-book__lede">
          Returning dollars need identified buyers in this window — not $0.
        </p>
      ) : null}

      <footer className="mcfly-book__links">
        <s-link href="/app/growth">{PRODUCT_NOUN.growthTitle}</s-link>
        <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
      </footer>
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/customers" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
