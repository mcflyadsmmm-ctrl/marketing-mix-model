import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { buildDashboardMetrics, ensureShop } from "../lib/mer-dashboard.server";
import { formatCurrency } from "../lib/mer-format";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import { parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";
import { fetchShopifySales } from "../lib/shopify-sales.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && (preset === "y3" || preset === "l12m")) {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/ltv?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const range = resolvePeriod(preset, new Date(), shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  let salesError: string | null = null;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    void runOrderFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
      // ignore — page shows honest empty/backfill states until cohort facts land
    });
    try {
      sales = await fetchShopifySales(admin, range);
    } catch (err) {
      salesError =
        err instanceof Error ? err.message : "Failed to load Shopify sales";
      sales = {
        totalSales: 0,
        orderCount: 0,
        newCustomers: 0,
        returningCustomers: 0,
        guestOrders: 0,
        customerMetricsAvailable: false,
        source: "shopify" as const,
      };
    }
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales);
  return { metrics, preset, shotMode, useSampleDesk, salesError };
};

export default function LtvPage() {
  const { metrics, preset, shotMode, useSampleDesk, salesError } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const tillLabel = shotMode
    ? metrics.period.label
    : useSampleDesk
      ? `${metrics.period.label} · sample data`
      : `${metrics.period.label} · live sales`;

  return (
    <s-page
      heading={shotMode ? undefined : PRODUCT_NOUN.ltvTitle}
      inlineSize="large"
    >
      <div
        className={
          shotMode
            ? "mcfly-desk mcfly-desk--shot"
            : isLoading
              ? "mcfly-desk mcfly-desk--loading"
              : "mcfly-desk"
        }
      >
        {useSampleDesk && !shotMode ? (
          <s-banner tone="warning" heading="Sample desk is on — not live Shopify">
            <s-paragraph>
              Customer cohorts below use sample sales + spend, not your live
              Shopify orders. Turn sample desk <strong>OFF</strong> on the{" "}
              <s-link href="/app/demo">Demo</s-link> tab before judging live
              numbers.
            </s-paragraph>
          </s-banner>
        ) : null}

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">
              Refreshing Customer Lifetime Value for this period…
            </p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load — Customer Lifetime Value needs the sales side
              of Shopify orders.
            </p>
            <div className="mcfly-state__cta">
              <s-button href={`/app/ltv?period=${preset}`} variant="primary">
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        <header className="mcfly-topbar">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              Opaque cohorts from Shopify orders — Level 1 only
            </p>
          </div>
          <PeriodControl preset={preset} shotMode={shotMode} />
        </header>

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">{PRODUCT_NOUN.ltvTitle}</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-ctx__chips">
            {useSampleDesk && !shotMode ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                Sample desk
              </span>
            ) : null}
          </div>
        </div>

        <section className="mcfly-panel mcfly-till-ltv" aria-label={PRODUCT_NOUN.ltvTitle}>
          <div className="mcfly-panel__head">
            <h2>{PRODUCT_NOUN.ltvTitle}</h2>
            <p className="mcfly-panel__muted">
              Cohort revenue from Shopify orders (Level 1) — not email CRM.
            </p>
          </div>

          {metrics.tillLtv.available ? (
            <>
              <div className="mcfly-control__grid mcfly-till-ltv__grid">
                <div className="mcfly-control__tile">
                  <p className="mcfly-control__k">Customer LTV · 30d</p>
                  <p className="mcfly-control__v">
                    {metrics.tillLtv.avgRevenueD30 != null
                      ? formatCurrency(metrics.tillLtv.avgRevenueD30)
                      : "—"}
                  </p>
                </div>
                <div className="mcfly-control__tile">
                  <p className="mcfly-control__k">Customer LTV · 90d</p>
                  <p className="mcfly-control__v">
                    {metrics.tillLtv.avgRevenueD90 != null
                      ? formatCurrency(metrics.tillLtv.avgRevenueD90)
                      : "—"}
                  </p>
                </div>
                <div className="mcfly-control__tile">
                  <p className="mcfly-control__k">Customer LTV · 365d</p>
                  <p className="mcfly-control__v">
                    {metrics.tillLtv.avgRevenueD365 != null
                      ? formatCurrency(metrics.tillLtv.avgRevenueD365)
                      : "—"}
                  </p>
                </div>
                <div className="mcfly-control__tile">
                  <p className="mcfly-control__k">Total Cost per Customer</p>
                  <p className="mcfly-control__v">
                    {metrics.newCustomers + metrics.returningCustomers > 0
                      ? formatCurrency(
                          metrics.totalSpend /
                            (metrics.newCustomers + metrics.returningCustomers),
                        )
                      : "—"}
                  </p>
                  <p className="mcfly-control__delta">
                    {metrics.newCustomers + metrics.returningCustomers > 0
                      ? `${(metrics.newCustomers + metrics.returningCustomers).toLocaleString()} customers`
                      : metrics.tillLtv.periodLabel ?? metrics.period.label}
                  </p>
                </div>
                <div className="mcfly-control__tile">
                  <p className="mcfly-control__k">Total Cost per New Customer</p>
                  <p className="mcfly-control__v">
                    {metrics.tillLtv.cashCac != null
                      ? formatCurrency(metrics.tillLtv.cashCac)
                      : "—"}
                  </p>
                  <p className="mcfly-control__delta">
                    {metrics.newCustomers > 0
                      ? `${metrics.newCustomers.toLocaleString()} new customers`
                      : "No new customers in this period"}
                  </p>
                </div>
                <div className="mcfly-control__tile">
                  <p className="mcfly-control__k">LTV : Cost per New Customer</p>
                  <p
                    className={`mcfly-control__v${
                      metrics.tillLtv.ltvCacRatio != null &&
                      metrics.tillLtv.ltvCacRatio >= 1
                        ? " mcfly-control__v--good"
                        : metrics.tillLtv.ltvCacRatio != null
                          ? " mcfly-control__v--bad"
                          : ""
                    }`}
                  >
                    {metrics.tillLtv.ltvCacRatio != null
                      ? `${metrics.tillLtv.ltvCacRatio.toFixed(2)}×`
                      : "—"}
                  </p>
                  <p className="mcfly-control__delta">
                    90d customer LTV ÷ total cost per new customer
                    {metrics.tillLtv.repeatRate != null
                      ? ` · repeat ${(metrics.tillLtv.repeatRate * 100).toFixed(0)}%`
                      : ""}
                  </p>
                </div>
              </div>

              {metrics.tillLtv.cohorts.length > 0 ? (
                <div className="mcfly-till-ltv__table-wrap">
                  <table className="mcfly-till-ltv__table">
                    <thead>
                      <tr>
                        <th scope="col">Cohort</th>
                        <th scope="col">Customers</th>
                        <th scope="col">Rev 30d</th>
                        <th scope="col">Rev 90d</th>
                        <th scope="col">Rev 365d</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.tillLtv.cohorts.map((row) => (
                        <tr key={row.cohortMonth}>
                          <td>{row.cohortMonth}</td>
                          <td>{row.customers.toLocaleString()}</td>
                          <td>{formatCurrency(row.revenueD30)}</td>
                          <td>{formatCurrency(row.revenueD90)}</td>
                          <td>{formatCurrency(row.revenueD365)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {metrics.tillLtv.historyLimited ? (
                <p className="mcfly-panel__note">
                  Order history limited until Partner approves read_all_orders —
                  cohorts cover the available window only.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mcfly-state__copy">
              {metrics.tillLtv.emptyReason === "no_timezone"
                ? "Shop timezone needed before customer cohorts can bucket by local day."
                : metrics.tillLtv.emptyReason === "history_limited"
                  ? "Order history is limited — cohorts will fill as backfill runs (read_all_orders unlocks deeper history)."
                  : "Backfilling customer cohorts — Customer Lifetime Value lights up once facts land."}
            </p>
          )}
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
