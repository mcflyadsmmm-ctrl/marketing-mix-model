import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BookFactGrid } from "../components/ShopifyBookSection";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { cashCostPerCustomer } from "../lib/shopify-native-stats";
import { useDeskCurrency } from "../lib/desk-currency";

const CPA_CONTRAST =
  "Shopify Analytics shows ads-manager / platform CPA if any. This page shows entered spend ÷ Shopify buyers.";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDeskSalesPage(request, "/app/cpa");
};

export default function CpaPage() {
  const currency = useDeskCurrency();
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
  const spendPerNew = cashCostPerCustomer(
    metrics.totalSpend,
    metrics.newCustomers,
  );

  return (
    <DeskBookPage
      heading="CPA"
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
      salesError={Boolean(salesError) && !shotMode}
      salesErrorBody="Sales didn’t load. Retry to see cash CPA from entered spend."
      retryHref={`/app/cpa?period=${preset}`}
    >
      <section className="mcfly-book" aria-label="Customer acquisition cost">
        <p className="mcfly-book__lede">{CPA_CONTRAST}</p>

        {!hasSpend ? (
          <p className="mcfly-book__lede">
            Add spend in <s-link href="/app/spend">Spend Upload</s-link> to
            calculate customer costs for this period.
          </p>
        ) : null}

        <BookFactGrid
          facts={[
            {
              k: "Cash CPA",
              v:
                hasSpend && cashCpa != null ? formatCurrency(cashCpa, currency) : "—",
              d: `Spend ÷ identified buyers · ${metrics.period.label}`,
              keepDash: true,
            },
            {
              k: "Cash CAC",
              v:
                hasSpend && cashCac != null ? formatCurrency(cashCac, currency) : "—",
              d: `${PRODUCT_NOUN.cashCacDef} · ${metrics.period.label}`,
              keepDash: true,
            },
            {
              k: PRODUCT_NOUN.amer,
              v: amer != null && amer > 0 ? `${formatMer(amer)}×` : "—",
              d: `${PRODUCT_NOUN.amerDef} · ${metrics.period.label}`,
              keepDash: true,
            },
          ]}
        />

        {hasSpend && identifiedBuyers === 0 ? (
          <p className="mcfly-book__lede">
            Shopify has not identified buyers for this period yet, so customer
            costs are unavailable.
          </p>
        ) : null}

        {(hasSpend ||
          identifiedBuyers > 0 ||
          metrics.tillLtv.paybackDays != null) ? (
          <BookFactGrid
            facts={[
              hasSpend
                ? {
                    k: "Spend this period",
                    v: formatCurrency(metrics.totalSpend, currency),
                    d: `Typed spend in ${metrics.period.label}. Shopify Analytics has no spend ledger.`,
                  }
                : null,
              identifiedBuyers > 0
                ? {
                    k: "Identified buyers",
                    v: identifiedBuyers.toLocaleString(),
                    s: `New ${metrics.newCustomers.toLocaleString()} · returning ${metrics.returningCustomers.toLocaleString()}`,
                    d: "Identified new + returning buyers in this window.",
                  }
                : null,
              hasSpend && spendPerNew != null
                ? {
                    k: "Spend per new customer",
                    v: formatCurrency(spendPerNew, currency),
                    d: "Typed spend ÷ first-time buyers in this window. An average, not a platform CPA.",
                  }
                : null,
              metrics.tillLtv.paybackDays != null
                ? {
                    k: "Customer payback",
                    v: `${metrics.tillLtv.paybackDays}d`,
                    d: `Recovered in about ${metrics.tillLtv.paybackDays} days on average from order history.`,
                  }
                : null,
            ].filter((row): row is NonNullable<typeof row> => row != null)}
          />
        ) : null}
      </section>

      <footer className="mcfly-book__links">
        <s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>
        <s-link href="/app/spend">Spend Upload</s-link>
      </footer>
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/cpa" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
