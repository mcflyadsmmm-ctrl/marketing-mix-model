import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { ShopifyBookSection } from "../components/ShopifyBookSection";
import { CustomersScoreboard } from "../components/CustomersScoreboard";
import { CustomerConcentrationChart } from "../components/CustomerConcentrationChart";
import { deskBookLede, deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";

// Deeper-than-Analytics contrast for the buyers catalog below the scoreboard.
// Shopify Analytics Overview shows a returning-customer rate (headcount); this
// tab leads with returning dollars and how concentrated they are.
const CUSTOMERS_CONTRAST =
  "Shopify Analytics Overview shows a returning-customer rate — headcount. Deeper: returning dollars, sales per buyer, guests, one-order buyers, and top-10% concentration — from this shop's orders.";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDeskSalesPage(request, "/app/customers");
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

      {/* Hero = returning dollars, then the dense interactive buyer strip. */}
      <CustomersScoreboard
        book={book}
        depth={metrics.shopifyDepth}
        salesPending={metrics.salesPending}
        useSampleDesk={useSampleDesk}
      />

      {/* Where the dollars concentrate — the Analytics gap, made visual. */}
      {!metrics.salesPending ? (
        <CustomerConcentrationChart book={book} depth={metrics.shopifyDepth} />
      ) : null}

      {!metrics.customerMetricsAvailable ? (
        <p className="mcfly-book__lede">
          Returning dollars need identified buyers in this window — not $0.
        </p>
      ) : null}

      {/* Deeper catalog — guest AOV, one-order buyers, orders per buyer, etc. */}
      <ShopifyBookSection
        book={book}
        depth={metrics.shopifyDepth}
        clocks={{
          gross: metrics.grossSales,
          grossKnown: metrics.grossSalesKnown,
          total: totalSalesDisplay,
          net: metrics.netSales,
          netKnown: metrics.netSalesKnown,
        }}
        groups={["buyers"]}
        title={PRODUCT_NOUN.buyersTitle}
        muted={deskBookLede(CUSTOMERS_CONTRAST)}
      />

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
