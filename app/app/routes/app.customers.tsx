import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { DepthProgressiveGrid } from "../components/DepthProgressiveGrid";
import { listingCaptureFromRequest } from "../lib/listing-capture";
import { ensureShop } from "../lib/mer-dashboard.server";
import {
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
  resolvePriorPeriod,
} from "../lib/periods";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadShopifyDepthData } from "../lib/shopify-depth-loader.server";
import {
  buildDepthChartPlaceholdersForTab,
  buildDepthChartsForTab,
} from "../lib/shopify-depth-metrics";
import { authenticate } from "../shopify.server";
import { DeepHistoryBanner } from "../components/DeepHistoryBanner";
import {
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
import { SalesDayAccuracyStrip } from "../components/SalesDayAccuracyStrip";
import { OrderHistoryAccuracyStrip } from "../components/OrderHistoryAccuracyStrip";
import { loadSalesDayAccuracy } from "../lib/sales-day-accuracy.server";
import { loadOrderHistoryAccuracy } from "../lib/order-history-accuracy.server";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import { orderHistoryAccuracyNeedsRefresh } from "../lib/order-history-accuracy";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = listingCaptureFromRequest(request);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/customers?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const now = new Date();
  const range = resolvePeriod(preset, now, shop.ianaTimezone);
  const priorRange = resolvePriorPeriod(preset, now, shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const [depth, accuracy, orderHistoryAccuracy] = await Promise.all([
    loadShopifyDepthData({
      shopId: shop.id,
      range,
      priorRange,
      ianaTimezone: shop.ianaTimezone,
      useSampleDesk,
      admin: useSampleDesk ? undefined : admin,
      grantedScopes: session.scope,
      allOrderHistory: true,
      mode: shotMode ? "full" : "fast",
    }),
    loadSalesDayAccuracy({
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
      now,
      enqueueRepair: !useSampleDesk && !shotMode,
      grantedScopes: session.scope,
      useSampleDesk,
    }),
    loadOrderHistoryAccuracy({
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
      now,
      grantedScopes: session.scope,
      useSampleDesk,
    }),
  ]);

  if (
    !useSampleDesk &&
    !shotMode &&
    orderHistoryAccuracyNeedsRefresh(orderHistoryAccuracy)
  ) {
    void runOrderFactsBackfill(admin, shop.id, {
      grantedScopes: session.scope,
    }).catch(() => {});
  }

  const chartInput = {
    tab: "customers" as const,
    dayFacts: depth.dayFacts,
    priorDayFacts: depth.priorDayFacts,
    baselineDayFacts: depth.baselineDayFacts,
    orderFacts: depth.orderFacts,
    priorOrderFacts: depth.priorOrderFacts,
    missingDayKeys: accuracy.missingDayKeys,
    timeZone: shop.ianaTimezone,
  };

  const charts = buildDepthChartsForTab(
    chartInput,
    shotMode ? "full" : "fast",
  );
  const placeholders = shotMode
    ? []
    : buildDepthChartPlaceholdersForTab("customers");
  const heavyHref = shotMode
    ? null
    : `/app/customers/heavy?period=${encodeURIComponent(preset)}`;

  return {
    charts,
    placeholders,
    heavyHref,
    preset,
    shotMode,
    useSampleDesk,
    periodLabel: depth.periodLabel,
    hasReadAllOrders: scopesIncludeReadAllOrders(session.scope),
    periodWiderThanRecentWindow: periodMayExceedShopifyOrderWindow(range),
    shopDomain: session.shop,
    accuracy,
    orderHistoryAccuracy,
  };
};

export default function CustomersDepthPage() {
  const {
    charts,
    placeholders,
    heavyHref,
    preset,
    shotMode,
    useSampleDesk,
    periodLabel,
    hasReadAllOrders,
    periodWiderThanRecentWindow,
    shopDomain,
    accuracy,
    orderHistoryAccuracy,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const deepHistory = resolveDeepHistoryHonesty({
    hasReadAllOrders,
    periodWiderThanRecentWindow,
    useSampleDesk,
  });

  return (
    <s-page heading="Customers" inlineSize="large">
      {useSampleDesk && !shotMode ? <SampleDeskBanner /> : null}
      {!shotMode && deepHistory.kind !== "hidden" ? (
        <DeepHistoryBanner kind={deepHistory.kind} shopDomain={shopDomain} />
      ) : null}
      <div className="mcfly-desk mcfly-desk--bc" aria-busy={isLoading || undefined}>
        <header className="mcfly-depth-page__head">
          <p className="mcfly-panel__muted">
            Repeat, cohort, and concentration depth for {periodLabel} — no ad
            spend on this tab.
          </p>
          {!shotMode ? <PeriodControl preset={preset} /> : null}
        </header>
        {!shotMode ? <SalesDayAccuracyStrip accuracy={accuracy} /> : null}
        {!shotMode ? (
          <OrderHistoryAccuracyStrip
            accuracy={orderHistoryAccuracy}
            when="problems"
          />
        ) : null}
        <DepthProgressiveGrid
          fastCharts={charts}
          placeholders={placeholders}
          heavyHref={heavyHref}
          deferHeavy={!shotMode}
        />
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
