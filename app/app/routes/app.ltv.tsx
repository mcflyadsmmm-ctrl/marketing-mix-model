import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { DeskPageWhy } from "../components/DeskPageWhy";
import {
  ltvCashCacTeaching,
  ltvEmptyCashCopy,
  parseLtvEmptyKind,
} from "../lib/cash-desk-copy";
import {
  formatListingTillLabel,
  listingCaptureFromRequest,
} from "../lib/listing-capture";
import { buildDashboardMetrics, ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import { parseSalesBasis } from "../lib/sales-basis";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
} from "../lib/contrib-ltv";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import { parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";
import {
  loadDeskSalesForPeriod,
  runSalesFactsBackfill,
} from "../lib/sales-facts.server";
import {
  FIRST_PAINT_SALES_BACKFILL_DAYS,
  enqueueSalesFactsBackfill,
} from "../lib/sales-backfill-kick.server";
import { authenticate } from "../shopify.server";
import { DeepHistoryBanner } from "../components/DeepHistoryBanner";
import {
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
import { periodMayExceedShopifyOrderWindow } from "../lib/periods";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = listingCaptureFromRequest(request);
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

  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    // Cohort OrderFact backfill — on the $39 desk (trial included).
    void runOrderFactsBackfill(admin, shop.id, {
      maxDays: 7,
      grantedScopes: session.scope,
    }).catch(() => {
      // ignore — page shows honest empty/backfill states until cohort facts land
    });
    /*
     * HARD-STOP: same as Home / Close / Allocation — never unbounded
     * fetchShopifySales for a multi-day period. Facts + capped today only.
     */
    void runSalesFactsBackfill(admin, shop.id, {
      maxDays: FIRST_PAINT_SALES_BACKFILL_DAYS,
      grantedScopes: session.scope,
      newestFirst: true,
      priorityRange: range,
    }).catch(() => {
      // Overview / job tick own the sales hero; LTV still shows honest empty.
    });
    void enqueueSalesFactsBackfill({
      shopId: shop.id,
      grantedScopes: session.scope,
      reason: "ltv_incomplete",
    }).catch(() => {});
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
    salesBasis: parseSalesBasis(
      (await getOrCreateSettings(shop.id)).salesBasis,
      "total",
    ),
  });
  return {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    hasReadAllOrders: scopesIncludeReadAllOrders(session.scope),
    shopDomain: session.shop,
    periodWiderThanRecentWindow: periodMayExceedShopifyOrderWindow(range),
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
    hasReadAllOrders,
    shopDomain,
    periodWiderThanRecentWindow,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const tillLabel = formatListingTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    listingCapture: shotMode,
    salesError: Boolean(salesError),
    blockedMockAsLive: Boolean(metrics.blockedMockAsLive),
    salesSource: metrics.salesSource,
    recentWindowOnly: !useSampleDesk && !hasReadAllOrders,
  });
  const deepHistory = resolveDeepHistoryHonesty({
    hasReadAllOrders,
    useSampleDesk,
    shotMode,
    factsIncomplete:
      !metrics.tillLtv.available &&
      metrics.tillLtv.emptyReason === "backfilling",
    periodWiderThanRecentWindow,
  });

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
  const hasPeriodSpend = metrics.totalSpend > 0;

  const cashCac =
    metrics.tillLtv.available && metrics.tillLtv.cashCac != null
      ? metrics.tillLtv.cashCac
      : custOk && newCount > 0 && metrics.totalSpend > 0
        ? metrics.totalSpend / newCount
        : metrics.tillLtv.newBuyers > 0 && metrics.totalSpend > 0
          ? metrics.totalSpend / metrics.tillLtv.newBuyers
          : null;
  const acquisitionCashCacTeaching = ltvCashCacTeaching({
    hasPeriodSpend,
    hasNewBuyerCount: cashCac != null,
  });
  const cohortCashCacTeaching = ltvCashCacTeaching({
    hasPeriodSpend,
    hasNewBuyerCount: metrics.tillLtv.newBuyers > 0,
  });
  const spendPerKnownBuyer =
    hasPeriodSpend && knownBuyers > 0
      ? metrics.totalSpend / knownBuyers
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
  const ltvEmpty = ltvEmptyCashCopy(
    parseLtvEmptyKind(metrics.tillLtv.emptyReason),
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
          shotMode ? "mcfly-desk--shot mcfly-desk--listing" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="Acquisition + cohort figures below use SAMPLE sales + spend — not your live Shopify orders." />
        ) : null}

        <DeskPageWhy page="ltv" />

        {!shotMode && !useSampleDesk && deepHistory.kind !== "hidden" ? (
          <DeepHistoryBanner kind={deepHistory.kind} shopDomain={shopDomain} />
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
              Order cohorts · not CRM
            </span>
          </div>
        </div>

        {/* ── A · Acquisition (this period) — $39 desk ── */}
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
            <section
              className="mcfly-state mcfly-state--empty"
              aria-label="Acquisition teaching state"
            >
              <div className="mcfly-state__content">
                <h3 className="mcfly-state__heading">
                  Acquisition is getting ready
                </h3>
                <p className="mcfly-state__copy">
                  {salesError
                    ? "Retry the Shopify sales pull above. Until it returns, Mcfly leaves buyer splits blank instead of guessing."
                    : "Shopify order facts are still arriving for this period. New vs returning sales and AOV appear here without ad spend, email CRM, or path credit."}
                </p>
              </div>
            </section>
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
                      : "aMER numerator"}
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
                    {acquisitionCashCacTeaching}
                  </p>
                </div>
                <div className="mcfly-acq-tile mcfly-acq-tile--mint">
                  <p className="mcfly-acq-tile__k">{PRODUCT_NOUN.amer}</p>
                  <p className="mcfly-acq-tile__v">
                    {metrics.amer != null ? formatMer(metrics.amer) : "—"}
                  </p>
                  <p className="mcfly-acq-tile__def">{PRODUCT_NOUN.amerDef}</p>
                  <p className="mcfly-acq-tile__hint">
                    Average for the period — not causal channel ROAS
                  </p>
                </div>
              </div>

              <p className="mcfly-acq-band__hedge">
                Not platform CAC · not path attribution · opaque customer ids +
                order amounts only
                {!custOk
                  ? " · unique buyer counts need live customer flags; sales split uses day facts"
                  : ""}
              </p>
            </>
          )}
        </section>

        {/* ── B · Lifetime value (cohorts) — $39 desk; SAMPLE = preview ── */}
        <section
          className="mcfly-panel mcfly-till-ltv mcfly-ltv-summary mcfly-acq-ltv"
          aria-label="Lifetime value summary"
        >
          <div className="mcfly-panel__head mcfly-panel__head--tight">
            <h2>Lifetime value · cohorts</h2>
            <p className="mcfly-panel__muted">
              Contribution LTV = cohort revenue × your margin (
              {metrics.marginPct.toFixed(0)}%) · averages, not causal
              channel ROAS
            </p>
          </div>

          {metrics.tillLtv.available ? (
            <div className="mcfly-ltv-summary__grid">
              <div className="mcfly-ltv-summary__hero">
                <p className="mcfly-ltv-summary__k">
                  Contribution LTV · 90d
                </p>
                <p className="mcfly-ltv-summary__v">
                  {contrib90 != null ? formatCurrency(contrib90) : "—"}
                </p>
                <p className="mcfly-ltv-summary__hint">
                  Revenue{" "}
                  {metrics.tillLtv.avgRevenueD90 != null
                    ? formatCurrency(metrics.tillLtv.avgRevenueD90)
                    : "—"}{" "}
                  × {metrics.marginPct.toFixed(0)}% margin
                </p>
                <p className="mcfly-ltv-summary__def">
                  {PRODUCT_NOUN.ltv90Def} · then × margin
                </p>
              </div>
              <div className="mcfly-ltv-summary__side">
                <div className="mcfly-ltv-summary__tile mcfly-ltv-summary__tile--soft">
                  <p className="mcfly-ltv-summary__k">30d contrib.</p>
                  <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                    {contrib30 != null ? formatCurrency(contrib30) : "—"}
                  </p>
                  <p className="mcfly-ltv-summary__def">
                    Avg revenue · 30d × margin
                  </p>
                </div>
                <div className="mcfly-ltv-summary__tile mcfly-ltv-summary__tile--soft">
                  <p className="mcfly-ltv-summary__k">365d contrib.</p>
                  <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                    {contrib365 != null ? formatCurrency(contrib365) : "—"}
                  </p>
                  <p className="mcfly-ltv-summary__def">
                    Avg revenue · 365d × margin
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
                    {!hasPeriodSpend
                      ? "Add period spend for Cash CAC"
                      : metrics.tillLtv.newBuyers > 0
                      ? `${metrics.tillLtv.newBuyers.toLocaleString()} new`
                      : "No new buyers"}
                  </p>
                </div>
                <div className="mcfly-ltv-summary__tile mcfly-ltv-summary__tile--ratio">
                  <p className="mcfly-ltv-summary__k">Contrib LTV : CAC</p>
                  <p
                    className={`mcfly-ltv-summary__v mcfly-ltv-summary__v--sm${
                      contribRatio == null
                        ? ""
                        : contribRatio >= 1
                          ? " mcfly-ltv-summary__v--good"
                          : " mcfly-ltv-summary__v--bad"
                    }`}
                  >
                    {contribRatio != null
                      ? `${contribRatio.toFixed(2)}×`
                      : "—"}
                  </p>
                  <p className="mcfly-ltv-summary__def">
                    Contrib LTV · 90d ÷ Cash CAC
                  </p>
                  <p className="mcfly-ltv-summary__delta">
                    {metrics.tillLtv.repeatRate != null
                      ? `Repeat ${(metrics.tillLtv.repeatRate * 100).toFixed(0)}% · average, not causal`
                      : "Average, not causal"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <section
              className="mcfly-state mcfly-state--empty"
              aria-label="Lifetime value teaching state"
            >
              <div className="mcfly-state__content">
                <h3 className="mcfly-state__heading">{ltvEmpty.heading}</h3>
                <p className="mcfly-state__copy">{ltvEmpty.body}</p>
              </div>
              <div className="mcfly-state__cta">
                <s-button href={ltvEmpty.nextHref} variant="secondary">
                  {ltvEmpty.nextLabel}
                </s-button>
              </div>
            </section>
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
                cash cost context for this period
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
              {metrics.onboarding.settingsSaved &&
              metrics.breakEvenMer != null &&
              metrics.tillLtv.cashCac != null &&
              metrics.tillLtv.avgRevenueD30 != null &&
              metrics.tillLtv.avgRevenueD30 > 0 ? (
                <div className="mcfly-ltv-dive__cost-tile">
                  <p className="mcfly-ltv-summary__k">Payback · 30d</p>
                  <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                    ~
                    {(
                      metrics.tillLtv.cashCac /
                      metrics.tillLtv.avgRevenueD30
                    ).toFixed(1)}{" "}
                    mo
                  </p>
                  <p className="mcfly-ltv-summary__delta">
                    Cost per new ÷ 30d LTV · {PRODUCT_NOUN.breakEvenShort}{" "}
                    {formatMer(metrics.breakEvenMer)}
                  </p>
                </div>
              ) : (
                <div className="mcfly-ltv-dive__cost-tile mcfly-ltv-dive__cost-tile--soft">
                  <p className="mcfly-ltv-summary__k">Spend context</p>
                  <p className="mcfly-ltv-summary__v mcfly-ltv-summary__v--sm">
                    {spendPerKnownBuyer != null
                      ? formatCurrency(spendPerKnownBuyer)
                      : "—"}
                  </p>
                  <p className="mcfly-ltv-summary__def">
                    {hasPeriodSpend
                      ? "Period spend ÷ new + returning (not Cash CAC)"
                      : cohortCashCacTeaching}
                  </p>
                </div>
              )}
            </div>

            {metrics.tillLtv.cohorts.length > 0 ? (
              <div className="mcfly-ltv-dive__table-wrap">
                <table className="mcfly-ltv-dive__table">
                  <thead>
                    <tr>
                      <th scope="col">Cohort</th>
                      <th scope="col">Buyers</th>
                      <th scope="col">Rev 30d</th>
                      <th scope="col">Rev 90d</th>
                      <th scope="col">Rev 365d</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.tillLtv.cohorts.map((row) => (
                      <tr key={row.cohortMonth}>
                        <th scope="row">{row.cohortMonth}</th>
                        <td>{row.customers.toLocaleString()}</td>
                        <td>{formatCurrency(row.revenueD30)}</td>
                        <td>{formatCurrency(row.revenueD90)}</td>
                        <td>{formatCurrency(row.revenueD365)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mcfly-panel__note">
                Cohort rows appear once enough first-order months are
                backfilled.
              </p>
            )}

            {metrics.tillLtv.historyLimited && !hasReadAllOrders ? (
              <p className="mcfly-panel__note">
                Cohorts cover the recent ~60-day window. Use Update
                permissions above so Shopify can share multi-year history —
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
