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

  const depth = await loadShopifyDepthData({
    shopId: shop.id,
    range,
    priorRange,
    ianaTimezone: shop.ianaTimezone,
    useSampleDesk,
    admin: useSampleDesk ? undefined : admin,
    grantedScopes: session.scope,
    allOrderHistory: false,
    mode: shotMode ? "full" : "fast",
  });

    const chartInput = {
    tab: "sales" as const,
    dayFacts: depth.dayFacts,
    priorDayFacts: depth.priorDayFacts,
    baselineDayFacts: depth.baselineDayFacts,
    orderFacts: depth.orderFacts,
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
