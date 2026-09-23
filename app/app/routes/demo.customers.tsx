import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { CustomerMixChart } from "../components/CustomerMixChart";
import { CustomerRetentionBoard } from "../components/CustomerRetentionBoard";
import { CustomersFirstViewport } from "../components/CustomersFirstViewport";
import { CustomersScoreboard } from "../components/CustomersScoreboard";
import { CustomerWhaleWatch } from "../components/CustomerWhaleWatch";
import { CustomerRfmBoard } from "../components/CustomerRfmBoard";
import { CustomerValueBands } from "../components/CustomerValueBands";
import { CustomerWhaleTable } from "../components/CustomerWhaleTable";
import { CustomerConcentrationChart } from "../components/CustomerConcentrationChart";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskLane } from "../components/DeskLane";
import { CustomersGrowthSection } from "../components/CustomersGrowthSection";
import {
  CustomersLtvDepth,
  CustomersLtvEconomics,
  CustomersLtvWindows,
  type CustomersLtvMetrics,
} from "../components/CustomersLtvSection";
import { deskBookLede } from "../lib/desk-history";
import { CUSTOMERS_FIRST_LANE_LABEL } from "../lib/customers-first-viewport";
import { GROWTH_FIRST_LANE_LABEL } from "../lib/growth-first-viewport";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import {
  loadPublicSamplePage,
  type PublicSamplePage,
} from "../lib/public-sample-page.server";
import { loadLtvDepth } from "../lib/ltv-depth-page.server";
import { parseCustomersPanel } from "../lib/customers-first-viewport";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { flagshipDailyRead } from "../lib/ltv-flagship";
import {
  buildShareableInsights,
  pickShareableLtvPeek,
} from "../lib/shareable-insights";

export const headers: HeadersFunction = () => publicDemoHeaders();

function demoLtvMetrics(data: PublicSamplePage): CustomersLtvMetrics {
  const spend = data.spend;
  const newBuyers = data.book.newCustomers;
  const cashCac = spend > 0 && newBuyers > 0 ? spend / newBuyers : null;
  const r90 = data.ltv.revenue90;
  return {
    tillLtv: {
      available: r90 != null && r90 > 0,
      historyLimited: false,
      emptyReason: null,
      avgRevenueD30: data.ltv.revenue30,
      avgRevenueD90: data.ltv.revenue90,
      avgRevenueD365: data.ltv.revenue365,
      cashCac,
      newBuyers,
      ltvCacRatio:
        cashCac != null && r90 != null && r90 > 0 ? r90 / cashCac : null,
      cohorts: [],
      repeatRate: data.ltv.repeatRate,
      avgOrdersD90: data.ltv.avgOrdersD90,
      paybackDays: null,
      truncatedLifetimeBuyers: data.customers.truncatedLifetimeBuyers,
    },
    totalSpend: spend,
    marginPct: data.marginPct,
    salesPending: false,
    newCustomers: data.book.newCustomers,
    returningCustomers: data.book.returningCustomers,
    customerMetricsAvailable: data.book.customerMetricsAvailable,
    period: { label: data.rangeLabel },
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const page = await loadPublicSamplePage(request);
  const ltvDepth = await loadLtvDepth({
    shopId: "public-sample",
    useSampleDesk: true,
  });
  const panel = parseCustomersPanel(
    new URL(request.url).searchParams.get("panel"),
  );
  return { ...page, ltvDepth, panel };
};

export default function PublicDemoCustomers() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const currency = useDeskCurrency();
  const ltvMetrics = demoLtvMetrics(data);
  const ltvProps = {
    metrics: ltvMetrics,
    depth: data.ltvDepth,
    marginConfirmed: true,
    useSampleDesk: true,
    orderBackfillProgress: null,
    shopLabel: data.shopLabel,
    shotMode: data.shotMode,
  };
  const historyLimited = false;
  const daily = flagshipDailyRead(data.ltvDepth.windows, data.ltvDepth.predictive);
  const ltvPeek = daily
    ? { amount: daily.worth, days: daily.worthDays }
    : pickShareableLtvPeek({
        revenue30: data.ltv.revenue30,
        revenue90: data.ltv.revenue90,
        revenue365: data.ltv.revenue365,
        historyLimited,
      });
  const insightView = buildShareableInsights(
    {
      salesPending: false,
      orderCount: data.book.orderCount,
      returningSales: data.book.returningSales,
      returningShare: data.book.returningSalesShare,
      newSales: data.book.newSales,
      typicalOrder: data.depth.medianAov,
      daysToSecond: data.depth.medianDaysToSecond,
      ltvPeek: ltvPeek?.amount ?? null,
      ltvPeekDays: ltvPeek?.days ?? null,
      historyLimited,
      shopLabel: data.shopLabel,
      sample: true,
      periodLabel: data.rangeLabel,
      todaySalesTruncated: false,
    },
    (n) => formatCurrency(n, currency),
  );
  const returningInsight = {
    ...insightView,
    cards: insightView.cards.filter((card) => card.kind === "returning"),
    empty: null,
  };
  const depthInsight = {
    ...insightView,
    cards: insightView.cards.filter((card) => card.kind !== "returning"),
  };

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.buyersTitle}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      orderBookDepth="paid_full"
      retryHref="/demo/customers"
    >
      <p className="mcfly-book__lede">
        Customer depth below reads SAMPLE Snowdevil order history — not this
        shop’s Shopify orders.
      </p>
      <div className="mcfly-desk-anchor mcfly-scoreboard--customers">
        <p className="mcfly-book__lede">
          {deskBookLede(
            "Shopify Analytics Customers is a customer list. Deeper: returning dollars vs new, dollars per buyer, then LTV, growth, and who the dollars sit with.",
            "paid_full",
          )}
        </p>
        <div id="mcfly-returning">
          <DeskLane rank="first" label={CUSTOMERS_FIRST_LANE_LABEL}>
            <CustomersFirstViewport
              analytics={data.customers}
              book={data.book}
              salesPending={false}
              useSampleDesk
              todaySalesTruncated={false}
            />
            {returningInsight.cards.length > 0 ? (
              <ShareableInsightCards
                view={returningInsight}
                shotMode={data.shotMode}
              />
            ) : null}
            <CustomerMixChart analytics={data.customers} salesPending={false} />
            <CustomersScoreboard
              book={data.book}
              depth={data.depth}
              periodLabel={data.rangeLabel}
              salesPending={false}
              useSampleDesk
              growthHref="#mcfly-growth"
              ltvHref="#mcfly-ltv"
            />
          </DeskLane>
        </div>
        <div id="mcfly-ltv">
          <DeskLane rank="next" label="What a new buyer is worth">
            <CustomersLtvWindows {...ltvProps} />
            <CustomersLtvEconomics {...ltvProps} />
          </DeskLane>
        </div>
        <div id="mcfly-growth">
          <DeskLane rank="next" label={GROWTH_FIRST_LANE_LABEL}>
            <CustomersGrowthSection
              book={data.book}
              tt2={data.tt2}
              depth={data.comebackDepth}
              months={data.growthMonths}
              repeatRate={data.ltv.repeatRate}
              avgOrdersD90={data.ltv.avgOrdersD90}
              salesPending={false}
              useSampleDesk
              shopLabel={data.shopLabel}
              shotMode={data.shotMode}
              orderSteps={data.customers.orderSteps}
              quietBack={data.customers.quietBack}
              comebackWait={data.customers.comebackWait}
              lifetimeSpan={data.customers.lifetimeSpan}
            />
          </DeskLane>
        </div>
        <div id="mcfly-depth">
          <DeskLane
            rank="more"
            label="Who the dollars sit with"
            fold
            defaultOpen={data.shotMode || data.panel === "depth"}
          >
            <div className="mcfly-cust-action-row">
              <CustomerRetentionBoard analytics={data.customers} />
              <CustomerWhaleWatch rfm={data.customers.rfm} />
            </div>
            <CustomerRfmBoard rfm={data.customers.rfm} />
            <CustomerValueBands analytics={data.customers} />
            <CustomerWhaleTable analytics={data.customers} />
            <CustomerConcentrationChart book={data.book} depth={data.depth} />
            <CustomersLtvDepth {...ltvProps} />
            {depthInsight.cards.length > 0 || depthInsight.empty ? (
              <ShareableInsightCards
                view={depthInsight}
                shotMode={data.shotMode}
              />
            ) : null}
          </DeskLane>
        </div>
      </div>
    </DeskBookPage>
  );
}
