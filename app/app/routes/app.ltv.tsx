import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { buildDashboardMetrics, ensureShop } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import { parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import { authenticate } from "../shopify.server";
import { getShopEntitlements } from "../lib/entitlements.server";
import { PRO_UPSELL } from "../lib/entitlements";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  // y3 stays shot-only. L12M is a desk preset (PeriodControl) — do not redirect.
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/ltv?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const range = resolvePeriod(preset, new Date(), shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: useSampleDesk,
  });

  // Free + live: fail closed — no live OrderFact / cohort compute on this route.
  if (!entitlements.canUseLtv) {
    return {
      metrics: null,
      preset,
      shotMode,
      useSampleDesk,
      salesError: null as string | null,
      todaySalesTruncated: false,
      todaySalesUnavailable: false,
      entitlements,
      locked: true as const,
    };
  }

  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    void runOrderFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
      // ignore — page shows honest empty/backfill states until cohort facts land
    });
    /*
     * HARD-STOP: same as Home / Close / Allocation — never unbounded
     * fetchShopifySales for a multi-day period. Facts + capped today only.
     */
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesTruncated = desk.todaySalesTruncated;
    todaySalesUnavailable = desk.todaySalesUnavailable;
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales);
  return {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    entitlements,
    locked: false as const,
  };
};

export default function LtvPage() {
  const {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    locked,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  if (locked || !metrics) {
    return (
      <s-page heading={PRODUCT_NOUN.ltvTitle} inlineSize="large">
        <div className="mcfly-desk">
          <s-banner tone="info" heading="Pro · Customer LTV">
            <s-paragraph>{PRO_UPSELL.ltv}</s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button href="/app/settings" variant="primary">
                {PRO_UPSELL.upgradeCta}
              </s-button>
              <s-button href="/app/demo" variant="secondary">
                Turn on sample desk to preview
              </s-button>
              <s-button href="/app/connections" variant="tertiary">
                Test Meta / Google spend
              </s-button>
            </div>
          </s-banner>
        </div>
      </s-page>
    );
  }

  const tillLabel = useSampleDesk
    ? `${metrics.period.label} · SAMPLE`
    : shotMode
      ? metrics.period.label
      : `${metrics.period.label} · live sales`;

  return (
    <s-page
      heading={shotMode ? undefined : PRODUCT_NOUN.ltvTitle}
      inlineSize="large"
    >
      <div
        className={[
          "mcfly-desk",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="Customer cohorts below use SAMPLE sales + spend — not your live Shopify orders." />
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

        {!useSampleDesk && !shotMode && !salesError && todaySalesTruncated ? (
          <s-banner tone="warning" heading="Today’s sales may be incomplete">
            <s-paragraph>
              Live today top-up hit the page cap — closed-day facts are still
              included. Refresh later for a fuller today total.
            </s-paragraph>
          </s-banner>
        ) : null}

        {!useSampleDesk &&
        !shotMode &&
        !salesError &&
        todaySalesUnavailable &&
        !todaySalesTruncated ? (
          <s-banner tone="warning" heading="Today’s live sales unavailable">
            <s-paragraph>
              Showing closed-day sales facts only — today’s Shopify pull did not
              complete.
            </s-paragraph>
          </s-banner>
        ) : null}

        <header className="mcfly-topbar">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              Customer cohorts from Shopify orders — no email CRM.{" "}
              {PRODUCT_NOUN.salesBasisShort}.
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
                {PRODUCT_NOUN.samplePreview}
              </span>
            ) : null}
          </div>
        </div>

        <section className="mcfly-panel mcfly-till-ltv" aria-label={PRODUCT_NOUN.ltvTitle}>
          <div className="mcfly-panel__head">
            <h2>{PRODUCT_NOUN.ltvTitle}</h2>
            <p className="mcfly-panel__muted">
              Cohort revenue from Shopify orders — not email CRM.
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
                {metrics.onboarding.settingsSaved &&
                metrics.breakEvenMer != null &&
                metrics.tillLtv.cashCac != null &&
                metrics.tillLtv.avgRevenueD30 != null &&
                metrics.tillLtv.avgRevenueD30 > 0 ? (
                  <div className="mcfly-control__tile">
                    <p className="mcfly-control__k">Payback · 30d LTV</p>
                    <p className="mcfly-control__v">
                      ~
                      {(
                        metrics.tillLtv.cashCac / metrics.tillLtv.avgRevenueD30
                      ).toFixed(1)}{" "}
                      mo
                    </p>
                    <p className="mcfly-control__delta">
                      Cost per new customer ÷ 30d LTV ·{" "}
                      {PRODUCT_NOUN.breakEvenShort}{" "}
                      {formatMer(metrics.breakEvenMer)}
                    </p>
                  </div>
                ) : null}
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
                  Free desk shows cohorts for the available order window. Deeper
                  multi-year history unlocks when Shopify approves broader order
                  access (Pro) — still order ids and amounts only, no email CRM.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mcfly-state__copy">
              {metrics.tillLtv.emptyReason === "no_timezone"
                ? "Shop timezone needed before customer cohorts can bucket by local day."
                : metrics.tillLtv.emptyReason === "history_limited"
                  ? "Order history is limited on this shop — Free shows the available window; broader Shopify order access unlocks deeper mature cohorts (order ids and amounts only)."
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
