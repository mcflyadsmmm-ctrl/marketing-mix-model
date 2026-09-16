import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { CountBarsChart } from "../components/DeskMixChart";
import {
  BookFactGrid,
  ShopifyBookSection,
} from "../components/ShopifyBookSection";
import { deskBookLede, deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";

const GROWTH_LEDE =
  "Shopify Analytics Overview shows returning-customer rate. This page shows days to a second order and who came back within 30 days — from order history.";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDeskSalesPage(request, "/app/growth");
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
      {metrics.salesPending ? (
        <p className="mcfly-book__lede">
          Sales for closed days are still loading — not $0.
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
            groups={["growth"]}
            title={PRODUCT_NOUN.growthTitle}
            muted={deskBookLede(GROWTH_LEDE)}
          />

          <section className="mcfly-book" aria-label="Repeat rate">
            <BookFactGrid
              facts={[
                {
                  k: "Repeat rate",
                  v:
                    metrics.tillLtv.repeatRate != null
                      ? pct(metrics.tillLtv.repeatRate)
                      : "—",
                  d: "Extra orders beyond the first in the first 90 days. Order history, not email.",
                  keepDash: true,
                },
              ]}
            />
          </section>

          {metrics.tillLtv.cohorts.length > 0 ? (
            <section className="mcfly-book" aria-label="First orders by month">
              <p className="mcfly-book__lede">First orders by month</p>
              <CountBarsChart
                title="First orders by month"
                items={metrics.tillLtv.cohorts.map((row) => ({
                  label: row.cohortMonth,
                  count: row.customers,
                  detail: "Customers who placed a first order that month.",
                }))}
              />
            </section>
          ) : null}

          <footer className="mcfly-book__links">
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
