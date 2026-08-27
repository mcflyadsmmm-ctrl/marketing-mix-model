import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { buildDashboardMetrics, ensureShop, getOrCreateSettings, marginIsConfirmed } from "../lib/mer-dashboard.server";
import { parseSalesBasis } from "../lib/sales-basis";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
  ltvWindowCaption,
} from "../lib/contrib-ltv";
import { runOrderFactsBackfill, getOrderBackfillProgress, ORDER_FACT_MAX_DAYS_PER_RUN } from "../lib/order-facts.server";
import { deskPeriodTimeZone, parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import { authenticate } from "../shopify.server";

/** CohortFact stores window totals — desk LTV is per new customer. */
function perCustomerRevenue(
  total: number,
  customers: number,
): number | null {
  if (!(customers > 0) || !Number.isFinite(total)) return null;
  return total / customers;
}

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
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const range = resolvePeriod(preset, new Date(), deskTz);
  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    // Cohort OrderFact backfill — one desk, chunked so paint stays fast.
    void runOrderFactsBackfill(admin, shop.id, {
      maxDays: ORDER_FACT_MAX_DAYS_PER_RUN,
    }).catch(() => {
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

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(settings.salesBasis, "total"),
  });
  const orderBackfillProgress = useSampleDesk
    ? null
    : await getOrderBackfillProgress(shop.id, {
        ianaTimezone: shop.ianaTimezone,
      });
  return {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    marginConfirmed: marginIsConfirmed(settings),
    orderBackfillProgress,
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
    marginConfirmed,
    orderBackfillProgress,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const tillLabel = useSampleDesk
    ? `${metrics.period.label}${PRODUCT_NOUN.samplePeriodSuffix}`
    : shotMode
      ? metrics.period.label
      : salesError ||
          metrics.blockedMockAsLive ||
          metrics.salesSource === "mock"
        ? `${metrics.period.label} · sales unavailable`
        : `${metrics.period.label} · live sales`;

  const custOk = metrics.customerMetricsAvailable;
  const newCount = custOk ? metrics.newCustomers : 0;
  const retCount = custOk ? metrics.returningCustomers : 0;
  const knownBuyers = newCount + retCount;
  const newShare = knownBuyers > 0 ? newCount / knownBuyers : null;
  const retShare = knownBuyers > 0 ? retCount / knownBuyers : null;

  const newSales = metrics.newCustomerNetSales;
  const returningSales = metrics.returningCustomerNetSales;
  const hasSalesSplit =
    metrics.orderCount > 0 &&
    (newSales > 0 || returningSales > 0 || metrics.sales > 0);
  const newSalesShare =
    hasSalesSplit && metrics.sales > 0 ? newSales / metrics.sales : null;
  const retSalesShare =
    hasSalesSplit && metrics.sales > 0 ? returningSales / metrics.sales : null;

  const aov =
    metrics.orderCount > 0 ? metrics.sales / metrics.orderCount : null;

  const cashCac =
    metrics.tillLtv.available && metrics.tillLtv.cashCac != null
      ? metrics.tillLtv.cashCac
      : custOk && newCount > 0 && metrics.totalSpend > 0
        ? metrics.totalSpend / newCount
        : metrics.tillLtv.newBuyers > 0 && metrics.totalSpend > 0
          ? metrics.totalSpend / metrics.tillLtv.newBuyers
          : null;

  const contrib90 = contributionAdjustedLtv(
    metrics.tillLtv.avgRevenueD90,
    metrics.marginPct,
  );
  const contrib30 = contributionAdjustedLtv(
    metrics.tillLtv.avgRevenueD30,
    metrics.marginPct,
  );
  const contrib365 = contributionAdjustedLtv(
    metrics.tillLtv.avgRevenueD365,
    metrics.marginPct,
  );
  const contribRatio = contributionLtvCacRatio(
    contrib90,
    metrics.tillLtv.cashCac,
  );

  return (
    <s-page
      heading={shotMode ? undefined : PRODUCT_NOUN.ltvTitle}
      inlineSize="large"
    >
      <div
        className={[
          "mcfly-desk",
          "mcfly-ltv",
          "mcfly-acq",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="Acquisition + cohort figures below use SAMPLE sales + spend — not your live Shopify orders." />
        ) : null}

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">
              Refreshing {PRODUCT_NOUN.ltvTitle} for this period…
            </p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load — acquisition and cohort views need the sales
              side of Shopify orders.
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

        <header className="mcfly-topbar mcfly-ltv__top">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              {PRODUCT_NOUN.ltvNotInShopify}
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
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
              Order history · not email lists
            </span>
          </div>
        </div>

        {/* ── A · Acquisition (this period) ── */}
        <section
          className="mcfly-panel mcfly-acq-band"
          aria-label="Acquisition this period"
        >
          <div className="mcfly-panel__head mcfly-panel__head--tight">
            <h2>Acquisition · this period</h2>
            <p className="mcfly-panel__muted">
              New vs returning sales from Shopify order flags · averages, not
              platform CAC or path attribution
            </p>
          </div>

          {!hasSalesSplit && !custOk ? (
            <p className="mcfly-acq-band__empty">
              Acquisition lights up once sales facts land for this period. Mcfly
              uses order flags and opaque customer ids only — no email CRM.
            </p>
          ) : (
            <>
              {custOk ? (
                <div className="mcfly-acq-split" aria-label="New vs returning buyers">
                  <div className="mcfly-acq-split__counts">
                    <div className="mcfly-acq-tile mcfly-acq-tile--mint">
                      <p className="mcfly-acq-tile__k">New customers</p>
                      <p className="mcfly-acq-tile__v">
                        {newCount.toLocaleString()}
                      </p>
                      <p className="mcfly-acq-tile__def">
                        {newShare != null
                          ? `${formatPercent(newShare)} of known buyers`
                          : "First-order in period"}
                      </p>
                    </div>
                    <div className="mcfly-acq-tile mcfly-acq-tile--sky">
                      <p className="mcfly-acq-tile__k">Returning</p>
                      <p className="mcfly-acq-tile__v">
                        {retCount.toLocaleString()}
                      </p>
                      <p className="mcfly-acq-tile__def">
                        {retShare != null
                          ? `${formatPercent(retShare)} of known buyers`
                          : "Repeat buyers in period"}
                      </p>
                    </div>
                  </div>
                  {newShare != null && retShare != null ? (
                    <div
                      className="mcfly-acq-share"
                      role="img"
                      aria-label={`New ${formatPercent(newShare)}, returning ${formatPercent(retShare)}`}
                    >
                      <div
                        className="mcfly-acq-share__new"
                        style={{ width: `${(newShare * 100).toFixed(1)}%` }}
                      />
                      <div
                        className="mcfly-acq-share__ret"
                        style={{ width: `${(retShare * 100).toFixed(1)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {hasSalesSplit && !custOk && newSalesShare != null && retSalesShare != null ? (
                <div
                  className="mcfly-acq-share mcfly-acq-share--sales"
                  role="img"
                  aria-label={`New sales ${formatPercent(newSalesShare)}, returning ${formatPercent(retSalesShare)}`}
                >
                  <div
                    className="mcfly-acq-share__new"
                    style={{ width: `${(newSalesShare * 100).toFixed(1)}%` }}
                  />
                  <div
                    className="mcfly-acq-share__ret"
                    style={{ width: `${(retSalesShare * 100).toFixed(1)}%` }}
                  />
                </div>
              ) : null}

              <div className="mcfly-acq-grid">
                <div className="mcfly-acq-tile mcfly-acq-tile--cream">
                  <p className="mcfly-acq-tile__k">New customer sales</p>
                  <p className="mcfly-acq-tile__v">
                    {formatCurrency(newSales)}
                  </p>
                  <p className="mcfly-acq-tile__def">
                    {newSalesShare != null
                      ? `${formatPercent(newSalesShare)} of period sales`
                      : "New-customer sales"}
                  </p>
                </div>
                <div className="mcfly-acq-tile mcfly-acq-tile--cream">
                  <p className="mcfly-acq-tile__k">Returning sales</p>
                  <p className="mcfly-acq-tile__v">
                    {formatCurrency(returningSales)}
                  </p>
                  <p className="mcfly-acq-tile__def">
                    {retSalesShare != null
                      ? `${formatPercent(retSalesShare)} of period sales`
                      : "Repeat + existing buyers"}
                  </p>
                </div>
                <div className="mcfly-acq-tile mcfly-acq-tile--sky">
                  <p className="mcfly-acq-tile__k">Orders</p>
                  <p className="mcfly-acq-tile__v">
                    {metrics.orderCount.toLocaleString()}
                  </p>
                  <p className="mcfly-acq-tile__def">
                    {custOk && metrics.guestOrders > 0
                      ? `${metrics.guestOrders.toLocaleString()} guest (no customer id)`
                      : "Shopify orders in period"}
                  </p>
                </div>
                <div className="mcfly-acq-tile mcfly-acq-tile--sky">
                  <p className="mcfly-acq-tile__k">AOV</p>
                  <p className="mcfly-acq-tile__v">
                    {aov != null ? formatCurrency(aov) : "—"}
                  </p>
                  <p className="mcfly-acq-tile__def">Sales ÷ orders</p>
                </div>
                <div className="mcfly-acq-tile mcfly-acq-tile--mint">
                  <p className="mcfly-acq-tile__k">Cash CAC</p>
                  <p className="mcfly-acq-tile__v">
                    {cashCac != null ? formatCurrency(cashCac) : "—"}
                  </p>
                  <p className="mcfly-acq-tile__def">
                    {PRODUCT_NOUN.cashCacDef}
                  </p>
                  <p className="mcfly-acq-tile__hint">
                    {cashCac == null
                      ? "Needs new-buyer count (cohorts or live flags)"
                      : "Blended till · not platform CAC"}
                  </p>
                </div>
                <div className="mcfly-acq-tile mcfly-acq-tile--mint">
                  <p className="mcfly-acq-tile__k">New-customer sales ÷ spend</p>
                  <p className="mcfly-acq-tile__v">
                    {metrics.amer != null ? formatMer(metrics.amer) : "—"}
                  </p>
                  <p className="mcfly-acq-tile__def">{PRODUCT_NOUN.amerDef}</p>
                  <p className="mcfly-acq-tile__hint">
                    Also called {PRODUCT_NOUN.amer}. Average for the period —
                    not which ad to scale.
                  </p>
                </div>
              </div>

              <p className="mcfly-acq-band__hedge">
                Average for the period — not ads-manager ROAS
                {!custOk
                  ? " · unique buyer counts need live customer flags; sales split uses day facts"
                  : ""}
              </p>
            </>
          )}
        </section>

        {/* ── B · Lifetime value (cohorts) — Pro / SAMPLE ── */}
            <section
              className="mcfly-panel mcfly-till-ltv mcfly-ltv-summary mcfly-acq-ltv"
              aria-label="Lifetime value summary"
            >
              <div className="mcfly-panel__head mcfly-panel__head--tight">
                <h2>Lifetime value · cohorts</h2>
                <p className="mcfly-panel__muted">
                  LTV is average revenue per new customer. Contribution LTV
                  applies {formatPercent(metrics.marginPct)} margin
                  {marginConfirmed
                    ? "."
                    : " (default until you confirm in Settings)."}{" "}
                  Averages, not causal channel ROAS.
                </p>
                <p className="mcfly-panel__note mcfly-acq-ltv__window">
                  {ltvWindowCaption({
                    periodLabel: metrics.period.label,
                    cohortMaxDays: 365,
                  })}
                </p>
              </div>

              {metrics.tillLtv.available ? (
                <div className="mcfly-ltv-summary__grid">
                  <div className="mcfly-ltv-summary__hero">
                    <p className="mcfly-ltv-summary__k">LTV · 90d</p>
                    <p className="mcfly-ltv-summary__v">
                      {metrics.tillLtv.avgRevenueD90 != null
                        ? formatCurrency(metrics.tillLtv.avgRevenueD90)
                        : "—"}
                    </p>
                    <p className="mcfly-ltv-summary__hint">
                      {PRODUCT_NOUN.ltv90Def}
                    </p>
                    <p className="mcfly-ltv-summary__def">
                      Contrib{" "}
                      {contrib90 != null ? formatCurrency(contrib90) : "—"}{" "}
                      after {formatPercent(metrics.marginPct)} margin
                      {marginConfirmed
                        ? ""
                        : " (default until you confirm in Settings)"}
                    </p>
                  </div>
                  <div className="mcfly-ltv-summary__side">
                    <div className="mcfly-ltv-summary__tile mcfly-ltv-summary__tile--soft">
                      <p className="mcfly-ltv-summary__k">LTV · 30d</p>
                      <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                        {metrics.tillLtv.avgRevenueD30 != null
                          ? formatCurrency(metrics.tillLtv.avgRevenueD30)
                          : "—"}
                      </p>
                      <p className="mcfly-ltv-summary__def">
                        Contrib{" "}
                        {contrib30 != null ? formatCurrency(contrib30) : "—"}
                      </p>
                    </div>
                    <div className="mcfly-ltv-summary__tile mcfly-ltv-summary__tile--soft">
                      <p className="mcfly-ltv-summary__k">LTV · 365d</p>
                      <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                        {metrics.tillLtv.avgRevenueD365 != null
                          ? formatCurrency(metrics.tillLtv.avgRevenueD365)
                          : "—"}
                      </p>
                      <p className="mcfly-ltv-summary__def">
                        Contrib{" "}
                        {contrib365 != null ? formatCurrency(contrib365) : "—"}
                      </p>
                    </div>
                    <div className="mcfly-ltv-summary__tile mcfly-ltv-summary__tile--cac">
                      <p className="mcfly-ltv-summary__k">Cash CAC</p>
                      <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                        {metrics.tillLtv.cashCac != null
                          ? formatCurrency(metrics.tillLtv.cashCac)
                          : "—"}
                      </p>
                      <p className="mcfly-ltv-summary__def">
                        {PRODUCT_NOUN.cashCacDef}
                      </p>
                      <p className="mcfly-ltv-summary__delta">
                        {metrics.tillLtv.newBuyers > 0
                          ? `${metrics.tillLtv.newBuyers.toLocaleString()} new`
                          : "No new buyers"}
                      </p>
                    </div>
                    <div className="mcfly-ltv-summary__tile mcfly-ltv-summary__tile--ratio">
                      <p className="mcfly-ltv-summary__k">LTV : CAC</p>
                      <p
                        className={`mcfly-ltv-summary__v mcfly-ltv-summary__v--sm${
                          metrics.tillLtv.ltvCacRatio == null
                            ? ""
                            : metrics.tillLtv.ltvCacRatio >= 1
                              ? " mcfly-ltv-summary__v--good"
                              : " mcfly-ltv-summary__v--bad"
                        }`}
                      >
                        {metrics.tillLtv.ltvCacRatio != null
                          ? `${metrics.tillLtv.ltvCacRatio.toFixed(2)}×`
                          : "—"}
                      </p>
                      <p className="mcfly-ltv-summary__def">
                        {PRODUCT_NOUN.ltvCacDef}
                      </p>
                      <p className="mcfly-ltv-summary__delta">
                        {contribRatio != null
                          ? `Contrib ${contribRatio.toFixed(2)}× after margin`
                          : metrics.tillLtv.repeatRate != null
                            ? `Repeat ${(metrics.tillLtv.repeatRate * 100).toFixed(0)}% · average, not causal`
                            : "Average, not causal"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {metrics.tillLtv.available ? (
                <p className="mcfly-panel__note">
                  {metrics.tillLtv.paybackDays != null
                    ? `Cash CAC recovered in ~${metrics.tillLtv.paybackDays} days on average`
                    : metrics.tillLtv.cashCac != null
                      ? "Not recovered by 365d on average"
                      : "Payback needs Cash CAC — upload spend and new-buyer counts"}
                  {metrics.tillLtv.ltvCacRatio != null
                    ? ` · LTV:CAC 90d ${metrics.tillLtv.ltvCacRatio.toFixed(2)}×`
                    : ""}
                  {" · average cohort, not causal"}
                </p>
              ) : (
                <p className="mcfly-state__copy">
                  {metrics.tillLtv.emptyReason === "no_timezone"
                    ? "Shop timezone needed before customer cohorts can bucket by local day."
                    : metrics.tillLtv.emptyReason === "history_limited"
                      ? "Order history from Shopify is limited on this shop (~60 days). Cohorts only cover that window — not $0 LTV."
                      : orderBackfillProgress
                        ? `Orders still syncing — not $0 LTV. Ingested ${orderBackfillProgress.completeDays} of ${orderBackfillProgress.windowDays} closed days. Refresh this page.`
                        : "Orders still syncing — not $0 LTV"}
                </p>
              )}
            </section>

            {metrics.tillLtv.available ? (
              <section
                className="mcfly-panel mcfly-ltv-dive mcfly-acq-ltv"
                aria-label="Cohort deep dive"
              >
                <div className="mcfly-panel__head mcfly-panel__head--tight">
                  <h2>Cohort deep dive</h2>
                  <p className="mcfly-panel__muted">
                    Monthly first-order cohorts · cumulative revenue windows ·
                    Cash CAC below uses this period’s spend (not the cohort
                    window)
                  </p>
                </div>

                <div className="mcfly-ltv-dive__cost">
                  <div className="mcfly-ltv-dive__cost-tile mcfly-ltv-dive__cost-tile--soft">
                    <p className="mcfly-ltv-summary__k">Repeat rate</p>
                    <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                      {metrics.tillLtv.repeatRate != null
                        ? `${(metrics.tillLtv.repeatRate * 100).toFixed(0)}%`
                        : "—"}
                    </p>
                    <p className="mcfly-ltv-summary__def">
                      Extra orders beyond first · cohort average
                    </p>
                  </div>
                  {metrics.tillLtv.cashCac != null ? (
                    <div className="mcfly-ltv-dive__cost-tile">
                      <p className="mcfly-ltv-summary__k">Cash payback</p>
                      <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                        {metrics.tillLtv.paybackDays != null
                          ? `~${metrics.tillLtv.paybackDays}d`
                          : "Not recovered by 365d"}
                      </p>
                      <p className="mcfly-ltv-summary__delta">
                        Days to recover {formatCurrency(metrics.tillLtv.cashCac)}{" "}
                        Cash CAC · average cohort, not causal
                      </p>
                    </div>
                  ) : (
                    <div className="mcfly-ltv-dive__cost-tile mcfly-ltv-dive__cost-tile--soft">
                      <p className="mcfly-ltv-summary__k">Spend ÷ buyers</p>
                      <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                        {knownBuyers > 0
                          ? formatCurrency(metrics.totalSpend / knownBuyers)
                          : "—"}
                      </p>
                      <p className="mcfly-ltv-summary__def">
                        Period spend ÷ new + returning (not Cash CAC)
                      </p>
                    </div>
                  )}
                  <div className="mcfly-ltv-dive__cost-tile mcfly-ltv-dive__cost-tile--soft">
                    <p className="mcfly-ltv-summary__k">Orders · 90d</p>
                    <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                      {metrics.tillLtv.avgOrdersD90 != null
                        ? metrics.tillLtv.avgOrdersD90.toFixed(2)
                        : "—"}
                    </p>
                    <p className="mcfly-ltv-summary__def">
                      Avg orders per customer · cohort average
                    </p>
                  </div>
                </div>

                {metrics.tillLtv.cohorts.length > 0 ? (
                  <div className="mcfly-ltv-dive__table-wrap">
                    <table className="mcfly-ltv-dive__table">
                      <thead>
                        <tr>
                          <th scope="col">Cohort</th>
                          <th scope="col">Buyers</th>
                          <th scope="col">LTV 30d</th>
                          <th scope="col">LTV 90d</th>
                          <th scope="col">LTV 365d</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.tillLtv.cohorts.map((row) => {
                          const ltv30 = perCustomerRevenue(
                            row.revenueD30,
                            row.customers,
                          );
                          const ltv90 = perCustomerRevenue(
                            row.revenueD90,
                            row.customers,
                          );
                          const ltv365 = perCustomerRevenue(
                            row.revenueD365,
                            row.customers,
                          );
                          return (
                            <tr key={row.cohortMonth}>
                              <th scope="row">{row.cohortMonth}</th>
                              <td>{row.customers.toLocaleString()}</td>
                              <td>
                                {ltv30 != null ? formatCurrency(ltv30) : "—"}
                              </td>
                              <td>
                                {ltv90 != null ? formatCurrency(ltv90) : "—"}
                              </td>
                              <td>
                                {ltv365 != null ? formatCurrency(ltv365) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mcfly-panel__note">
                    Cohort rows appear once enough first-order months are
                    backfilled.
                  </p>
                )}

                {metrics.tillLtv.historyLimited ? (
                  <p className="mcfly-panel__note">
                    Cohorts cover the available order window. Deeper multi-year
                    history unlocks when Shopify approves broader order access —
                    still order ids and amounts only, no email CRM.
                  </p>
                ) : null}
              </section>
            ) : null}
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
