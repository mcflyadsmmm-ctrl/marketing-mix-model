import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { ShopifyBookSection } from "../components/ShopifyBookSection";
import { deskPeriodTillLabel } from "../lib/desk-history";
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
  const { metrics, preset, shotMode, useSampleDesk, salesError } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const tillLabel = deskPeriodTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    shotMode,
    salesError,
    blockedMockAsLive: metrics.blockedMockAsLive,
    salesSource: metrics.salesSource,
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
    >
      {metrics.salesPending ? (
        <p className="mcfly-book__lede">
          Sales for closed days are still loading — not $0.
        </p>
      ) : (
        <>
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
            muted={GROWTH_LEDE}
          />

          {metrics.tillLtv.repeatRate != null ? (
            <section className="mcfly-book" aria-label="Repeat rate">
              <details className="mcfly-book__row">
                <summary className="mcfly-book__row-sum">
                  <span className="mcfly-book__row-k">Repeat rate</span>
                  <span className="mcfly-book__row-v">
                    {pct(metrics.tillLtv.repeatRate)}
                  </span>
                </summary>
                <p className="mcfly-book__row-d">
                  Extra orders beyond the first in the first 90 days. Order
                  history, not email.
                </p>
              </details>
            </section>
          ) : null}

          {metrics.tillLtv.cohorts.length > 0 ? (
            <section className="mcfly-book" aria-label="First orders by month">
              <p className="mcfly-book__lede">First orders by month</p>
              <div className="mcfly-book__rows">
                {metrics.tillLtv.cohorts.map((row) => (
                  <details className="mcfly-book__row" key={row.cohortMonth}>
                    <summary className="mcfly-book__row-sum">
                      <span className="mcfly-book__row-k">
                        {row.cohortMonth}
                      </span>
                      <span className="mcfly-book__row-v">
                        {row.customers.toLocaleString()}
                      </span>
                    </summary>
                    <p className="mcfly-book__row-d">
                      Customers who placed a first order that month.
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="mcfly-book__links">
            <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
          </footer>
        </>
      )}
    </DeskBookPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
