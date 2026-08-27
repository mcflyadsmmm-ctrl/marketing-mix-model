import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { UseSampleCta } from "../components/UseSampleCta";
import { buildAdvancedSections } from "../lib/advanced-metrics";
import { getShopEntitlements } from "../lib/entitlements.server";
import {
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { deskPeriodTimeZone, parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { parseSalesBasis } from "../lib/sales-basis";
import { loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const range = resolvePeriod(preset, new Date(), deskTz);
  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: useSampleDesk,
    paidPro: shop.proBillingActive,
  });

  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
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
    entitlements,
  };
};

export default function AdvancedMetricsPage() {
  const {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    entitlements,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const tillLabel = useSampleDesk
    ? `${metrics.period.label}${PRODUCT_NOUN.samplePeriodSuffix}`
    : salesError ||
        metrics.blockedMockAsLive ||
        metrics.salesSource === "mock"
      ? `${metrics.period.label} · sales unavailable`
      : `${metrics.period.label} · live sales`;

  const sections = buildAdvancedSections(metrics, {
    // Not a plan gate — LTV is on the one desk. See advanced-metrics.ts.
    canUseLtv: true,
    periodLabel: metrics.period.label,
  });

  return (
    <s-page
      heading={shotMode ? undefined : PRODUCT_NOUN.advancedMetrics}
      inlineSize="large"
    >
      <div
        className={[
          "mcfly-desk",
          "mcfly-advanced",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="Advanced Metrics uses SAMPLE numbers — not your live store." />
        ) : null}

        {isLoading && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--loading"
            aria-live="polite"
          >
            <p className="mcfly-state__copy">Refreshing advanced metrics…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load — Advanced Metrics needs{" "}
              {PRODUCT_NOUN.totalRoas} from sales ÷ spend.
            </p>
            <div className="mcfly-state__cta">
              <s-button
                href={`/app/advanced?period=${preset}`}
                variant="primary"
              >
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        <header className="mcfly-topbar">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              {PRODUCT_NOUN.advancedKicker}
            </p>
          </div>
          <PeriodControl preset={preset} shotMode={shotMode} />
        </header>

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">
              {PRODUCT_NOUN.advancedMetrics}
            </span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-ctx__chips">
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
              {PRODUCT_NOUN.notTrueRoas}
            </span>
          </div>
        </div>

        <p className="mcfly-advanced__lede">
          Optional. Add spend on Upload Spend first — this page is extra math, not a
          second scoreboard. Overview stays simple. Every tile is average /
          portfolio math from Shopify sales and Logged Spend via CSV.
        </p>

        <div className="mcfly-advanced__nav">
          <s-link href={`/app/allocation?period=${preset}`}>
            {PRODUCT_NOUN.nextAllocation}
          </s-link>
          <s-link href={`/app/ltv?period=${preset}`}>
            {PRODUCT_NOUN.nextCustomerPayback}
          </s-link>
          <s-link href={`/app?period=${preset}`}>
            {PRODUCT_NOUN.openTotalRoas}
          </s-link>
        </div>

        {sections.map((section) => (
          <details
            key={section.id}
            className="mcfly-advanced__section"
            open={section.open !== false}
          >
            <summary className="mcfly-advanced__summary">
              <h2>{section.title}</h2>
            </summary>
            {section.lockedReason ? (
              <section
                className="mcfly-state mcfly-state--empty"
                aria-label={`${section.title} locked`}
              >
                <p className="mcfly-state__copy">{section.lockedReason}</p>
                <div className="mcfly-state__cta">
                  <UseSampleCta />
                </div>
              </section>
            ) : (
              <div className="mcfly-advanced__grid">
                {section.tiles.map((tile) => (
                  <article
                    className="mcfly-advanced__tile"
                    key={tile.id}
                    aria-label={tile.label}
                  >
                    <p className="mcfly-advanced__label">{tile.label}</p>
                    <p className="mcfly-advanced__value">{tile.value}</p>
                    <p className="mcfly-advanced__formula">{tile.formula}</p>
                    <p className="mcfly-advanced__caveat">{tile.caveat}</p>
                  </article>
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
