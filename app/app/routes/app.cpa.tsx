import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { cashCostPerCustomer } from "../lib/shopify-native-stats";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDeskSalesPage(request, "/app/cpa");
};

export default function CpaPage() {
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
  const hasSpend = metrics.totalSpend > 0;
  const identifiedBuyers = metrics.customerMetricsAvailable
    ? metrics.newCustomers + metrics.returningCustomers
    : 0;
  const cashCpa = cashCostPerCustomer(metrics.totalSpend, identifiedBuyers);
  const cashCac = metrics.tillLtv.cashCac;
  const amer = metrics.amer;

  return (
    <DeskBookPage
      heading="CPA"
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
    >
      <section className="mcfly-book" aria-label="Customer acquisition cost">
        <p className="mcfly-book__lede">
          Entered spend beside identified Shopify buyers. Blended period
          averages, not platform attribution.
        </p>

        {!hasSpend ? (
          <p className="mcfly-book__lede">
            Add spend in <s-link href="/app/spend">Spend Upload</s-link> to
            calculate customer costs for this period.
          </p>
        ) : null}

        <div className="mcfly-book__glance mcfly-book__glance--kpis">
          <div className="mcfly-book__kpi">
            <p className="mcfly-book__kpi-k">Cash CPA</p>
            <p className="mcfly-book__kpi-v">
              {cashCpa != null ? formatCurrency(cashCpa) : "—"}
            </p>
            <p className="mcfly-book__kpi-hint">Spend ÷ identified buyers</p>
          </div>
          <div className="mcfly-book__kpi">
            <p className="mcfly-book__kpi-k">Cash CAC</p>
            <p className="mcfly-book__kpi-v">
              {cashCac != null ? formatCurrency(cashCac) : "—"}
            </p>
            <p className="mcfly-book__kpi-hint">{PRODUCT_NOUN.cashCacDef}</p>
          </div>
          <div className="mcfly-book__kpi">
            <p className="mcfly-book__kpi-k">{PRODUCT_NOUN.amer}</p>
            <p className="mcfly-book__kpi-v">
              {amer != null && amer > 0 ? `${formatMer(amer)}×` : "—"}
            </p>
            <p className="mcfly-book__kpi-hint">{PRODUCT_NOUN.amerDef}</p>
          </div>
        </div>

        {hasSpend && identifiedBuyers === 0 ? (
          <p className="mcfly-book__lede">
            Shopify has not identified buyers for this period yet, so customer
            costs are unavailable.
          </p>
        ) : null}

        {metrics.tillLtv.paybackDays != null ? (
          <p className="mcfly-book__lede">
            Customer payback: recovered in about {metrics.tillLtv.paybackDays}{" "}
            days on average.
          </p>
        ) : null}
      </section>

      <footer className="mcfly-book__links">
        <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
        <s-link href="/app/spend">Spend Upload</s-link>
      </footer>
    </DeskBookPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
