import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { DepthSectionedGrid } from "../components/DepthSectionedGrid";
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
  preferFilledDepthCharts,
} from "../lib/shopify-depth-metrics";
import { authenticate } from "../shopify.server";
import { DeepHistoryBanner } from "../components/DeepHistoryBanner";
import {
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
import { loadSalesDayAccuracy } from "../lib/sales-day-accuracy.server";
import { loadOrderHistoryAccuracy } from "../lib/order-history-accuracy.server";
import { runOrderFactsBackfill } from "../lib/order-facts.server";
import { orderHistoryAccuracyNeedsRefresh } from "../lib/order-history-accuracy";
import { buildCustomersDepthDecision } from "../lib/customers-depth-decision";
import { resolveOrderEconomics } from "../lib/order-economics";
import { excludeOpenDayFacts } from "../lib/sales-day-accuracy";
import { OpsDeskIsland } from "../components/OpsDeskIsland";
import { DeskSection } from "../components/DeskSection";
import { DeskLedgerTable } from "../components/DeskLedgerTable";
import { loadBuyerLedger } from "../lib/desk-ledgers.server";
import { buildBuyerLedgerPulse } from "../lib/desk-ledger-pulse";

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
  const depthParam = url.searchParams.get("depth");
  const depthDensity =
    shotMode || useSampleDesk || depthParam === "all" ? "all" : "core";

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
      admin: useSampleDesk || shotMode ? undefined : admin,
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
    openDayKey: accuracy.openDayKey,
    timeZone: shop.ianaTimezone,
  };

  const charts = preferFilledDepthCharts(
    buildDepthChartsForTab(
      chartInput,
      shotMode ? "full" : "fast",
      depthDensity,
    ),
  );
  const placeholders = shotMode
    ? []
    : buildDepthChartPlaceholdersForTab("customers", depthDensity);
  const heavyHref = shotMode
    ? null
    : `/app/customers/heavy?period=${encodeURIComponent(preset)}&depth=${encodeURIComponent(depthDensity)}`;

  const closedDayFacts = excludeOpenDayFacts(
    depth.dayFacts,
    accuracy.openDayKey,
  );
  const salesByDay: Record<string, number> = {};
  for (const d of closedDayFacts) salesByDay[d.dayKey] = d.sales;
  const economics = resolveOrderEconomics({
    sales: closedDayFacts.reduce((s, d) => s + d.sales, 0),
    orderCount: closedDayFacts.reduce((s, d) => s + d.orderCount, 0),
    salesByDay,
    newCustomerSales: closedDayFacts.reduce(
      (s, d) => s + (d.newCustomerSales ?? 0),
      0,
    ),
    returningCustomerSales: closedDayFacts.reduce(
      (s, d) => s + (d.returningCustomerSales ?? 0),
      0,
    ),
  });
  const decision = shotMode
    ? null
    : buildCustomersDepthDecision({
        periodLabel: depth.periodLabel,
        periodPreset: preset,
        economics,
        dayAccuracy: accuracy,
        orderHistoryAccuracy,
        currencyCode: shop.currencyCode,
      });

  const buyerLedger = await loadBuyerLedger({
    shopId: shop.id,
    range,
    currencyCode: shop.currencyCode,
    useSampleDesk,
  });
  const buyerPulse = shotMode
    ? null
    : buildBuyerLedgerPulse({
        periodLabel: depth.periodLabel,
        periodPreset: preset,
        rows: buyerLedger.inputs,
        totalBuyers: buyerLedger.totalBuyers,
        currencyCode: shop.currencyCode,
      });
  // Prefer buyer-ledger pulse when it has signal; else keep depth decision.
  const deskPulse = buyerPulse ?? decision;

  return {
    depthDensity,
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
    decision: deskPulse,
    buyerLedger,
  };
};

export default function CustomersDepthPage() {
  const {
    depthDensity,
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
    decision,
    buyerLedger,
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
            Repeat and concentration for {periodLabel}.
          </p>
          {!shotMode ? <PeriodControl preset={preset} /> : null}
          {!shotMode && depthDensity === "core" ? (
            <p className="mcfly-panel__muted">
              Core desk — repeat basics that still read when history is thin. 
              <s-link href={`/app/customers?period=${encodeURIComponent(preset)}&depth=all`}>
                Show more depth
              </s-link>
            </p>
          ) : null}
          {!shotMode && depthDensity === "all" && !useSampleDesk ? (
            <p className="mcfly-panel__muted">
              <s-link href={`/app/customers?period=${encodeURIComponent(preset)}`}>
                Back to core charts
              </s-link>
            </p>
          ) : null}
        </header>
{!shotMode && decision ? <OpsDeskIsland model={decision} /> : null}

        <DeskSection
          id="buyer-ledger"
          title="Buyer ledger"
          blurb={`Top ${buyerLedger.rows.length} of ${buyerLedger.totalBuyers} identified buyers in this period — opaque keys only.`}
          hero
          actions={
            !shotMode ? (
              <s-link
                href={`/app/buyer-ledger.csv?period=${encodeURIComponent(preset)}`}
              >
                Export CSV
              </s-link>
            ) : null
          }
        >
          <p className="mcfly-desk-section__note">
            Cohort LTV table lives on{" "}
            <s-link href={`/app/cohorts?period=${encodeURIComponent(preset)}`}>
              Cohorts
            </s-link>
            . Order economics live on{" "}
            <s-link href={`/app/orders?period=${encodeURIComponent(preset)}`}>
              Orders
            </s-link>
            .
          </p>
          <DeskLedgerTable
            caption={`Buyer ledger · ${periodLabel}`}
            emptyMessage="No identified buyers in this period yet — order history backfill fills this desk."
            columns={[
              { key: "buyer", label: "Buyer" },
              { key: "firstDay", label: "First day" },
              { key: "lastDay", label: "Last day" },
              { key: "orders", label: "Orders", align: "right" },
              { key: "lifetimeSales", label: "Lifetime $", align: "right" },
              { key: "periodSales", label: "Period $", align: "right" },
              { key: "aov", label: "AOV", align: "right" },
              { key: "daysToSecond", label: "Days to 2nd", align: "right" },
              { key: "segment", label: "Segment" },
            ]}
            rows={buyerLedger.rows}
          />
        </DeskSection>

        <DepthSectionedGrid
          tab="customers"
          fastCharts={charts}
          placeholders={placeholders}
          heavyHref={heavyHref}
          deferHeavy={!shotMode}
          ledgerNote={
            <>
              Cohort LTV table lives on{" "}
              <s-link href={`/app/cohorts?period=${encodeURIComponent(preset)}`}>Cohorts</s-link>
              . Order-level economics live on{" "}
              <s-link href={`/app/orders?period=${encodeURIComponent(preset)}`}>Orders</s-link>.
            </>
          }
        />
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
