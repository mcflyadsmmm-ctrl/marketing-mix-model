import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { LtvSnapSection } from "../components/LtvSnapSection";
import { ShopifyBookSection } from "../components/ShopifyBookSection";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  cashCostPerCustomer,
  shopifyNativePeriodStats,
} from "../lib/shopify-native-stats";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDeskSalesPage(request, "/app/buyers");
};

export default function BuyersPage() {
  const {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
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
  const identifiedBuyers = metrics.customerMetricsAvailable
    ? metrics.newCustomers + metrics.returningCustomers
    : metrics.shopifyDepth.identifiedBuyers;
  const cashCpa = cashCostPerCustomer(metrics.totalSpend, identifiedBuyers);
  const hasSpend = metrics.onboarding.hasSpend || useSampleDesk;

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.buyersTitle}
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
            groups={["buyers"]}
            title={PRODUCT_NOUN.buyersTitle}
            muted={PRODUCT_NOUN.buyersMuted}
          />
          <LtvSnapSection
            tillLtv={metrics.tillLtv}
            preset={preset}
            hasSpend={hasSpend}
            cashCpa={cashCpa}
          />
        </>
      )}
    </DeskBookPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
