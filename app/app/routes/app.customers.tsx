import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { ShopifyBookSection } from "../components/ShopifyBookSection";
import { ShareBarsChart } from "../components/DeskMixChart";
import { deskBookLede, deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";
import { formatCurrency } from "../lib/mer-format";

const CUSTOMERS_CONTRAST =
  "Shopify Analytics returning-customer rate is headcount. This page is returning dollars, guests, and the top 10% of customers.";

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
      {!metrics.salesPending && !metrics.customerMetricsAvailable ? (
        <p className="mcfly-book__lede">
          Returning dollars need identified buyers in this window — not $0.
        </p>
      ) : null}
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
          <ShareBarsChart
            title="New vs returning dollars"
            items={[
              {
                label: "Returning",
                value:
                  book.returningSales != null && book.returningSales > 0
                    ? formatCurrency(book.returningSales)
                    : "—",
                share: book.returningSalesShare ?? 0,
                detail:
                  "Sales from buyers who had ordered before. Shopify Analytics Overview uses a returning-customer rate (headcount).",
              },
              {
                label: "New",
                value:
                  book.newSales != null && book.newSales > 0
                    ? formatCurrency(book.newSales)
                    : "—",
                share: book.newSalesShare ?? 0,
                detail:
                  "Sales from first-time buyers in this window. Growth covers days to a second order.",
              },
            ]}
          />
          <footer className="mcfly-book__links">
            <s-link href="/app/growth">{PRODUCT_NOUN.growthTitle}</s-link>
            <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
          </footer>
    </DeskBookPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
