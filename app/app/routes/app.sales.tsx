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
import { OpsDeskIsland } from "../components/OpsDeskIsland";
import { SalesDayAccuracyStrip } from "../components/SalesDayAccuracyStrip";
import { loadSalesDayAccuracy } from "../lib/sales-day-accuracy.server";
import { buildSalesDepthDecision } from "../lib/sales-depth-decision";
import { resolveOrderEconomics } from "../lib/order-economics";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = listingCaptureFromRequest(request);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/sales?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const now = new Date();
  const range = resolvePeriod(preset, now, shop.ianaTimezone);
  const priorRange = resolvePriorPeriod(preset, now, shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const [depth, accuracy] = await Promise.all([
    loadShopifyDepthData({
      shopId: shop.id,
      range,
      priorRange,
      ianaTimezone: shop.ianaTimezone,
      useSampleDesk,
      admin: useSampleDesk ? undefined : admin,
      grantedScopes: session.scope,
      allOrderHistory: false,
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
  ]);

  const chartInput = {
    tab: "sales" as const,
    dayFacts: depth.dayFacts,
    priorDayFacts: depth.priorDayFacts,
    baselineDayFacts: depth.baselineDayFacts,
    orderFacts: depth.orderFacts,
    missingDayKeys: accuracy.missingDayKeys,
    timeZone: shop.ianaTimezone,
  };

  const charts = buildDepthChartsForTab(
    chartInput,
    shotMode ? "full" : "fast",
  );
  const placeholders = shotMode
    ? []
    : buildDepthChartPlaceholdersForTab("sales");
  const heavyHref = shotMode
    ? null
    : `/app/sales/heavy?period=${encodeURIComponent(preset)}`;

  const salesByDay: Record<string, number> = {};
  for (const d of depth.dayFacts) salesByDay[d.dayKey] = d.sales;
  const economics = resolveOrderEconomics({
    sales: depth.dayFacts.reduce((s, d) => s + d.sales, 0),
    orderCount: depth.dayFacts.reduce((s, d) => s + d.orderCount, 0),
    salesByDay,
    newCustomerSales: depth.dayFacts.reduce(
      (s, d) => s + (d.newCustomerSales ?? 0),
      0,
    ),
    returningCustomerSales: depth.dayFacts.reduce(
      (s, d) => s + (d.returningCustomerSales ?? 0),
      0,
    ),
  });
  const decision =
    shotMode
      ? null
      : buildSalesDepthDecision({
          periodLabel: depth.periodLabel,
          periodPreset: preset,
          economics,
          accuracy,
          dayFacts: depth.dayFacts,
        });

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
    decision,
  };
};

export default function SalesDepthPage() {
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
    decision,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const deepHistory = resolveDeepHistoryHonesty({
    hasReadAllOrders,
    periodWiderThanRecentWindow,
    useSampleDesk,
  });

  return (
    <s-page heading="Sales" inlineSize="large">
      {useSampleDesk && !shotMode ? <SampleDeskBanner /> : null}
      {!shotMode && deepHistory.kind !== "hidden" ? (
        <DeepHistoryBanner kind={deepHistory.kind} shopDomain={shopDomain} />
      ) : null}
      <div className="mcfly-desk mcfly-desk--bc" aria-busy={isLoading || undefined}>
        <header className="mcfly-depth-page__head">
          <p className="mcfly-panel__muted">
            Shopify order and calendar depth for {periodLabel} — no ad spend on
            this tab.
          </p>
          {!shotMode ? <PeriodControl preset={preset} /> : null}
        </header>
        {!shotMode ? <SalesDayAccuracyStrip accuracy={accuracy} /> : null}
        {!shotMode && decision ? <OpsDeskIsland model={decision} /> : null}
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
