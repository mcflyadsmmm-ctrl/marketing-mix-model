import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useNavigation } from "react-router";

import { CustomerMixChart } from "../components/CustomerMixChart";
import { CustomerRetentionBoard } from "../components/CustomerRetentionBoard";
import { CustomersCompareGlance } from "../components/CustomersCompareGlance";
import { CustomersFirstViewport } from "../components/CustomersFirstViewport";
import { CustomersScoreboard } from "../components/CustomersScoreboard";
import { CustomerWhaleWatch } from "../components/CustomerWhaleWatch";
import { CustomerRfmBoard } from "../components/CustomerRfmBoard";
import { CustomerValueBands } from "../components/CustomerValueBands";
import { CustomerWhaleTable } from "../components/CustomerWhaleTable";
import { CustomerConcentrationChart } from "../components/CustomerConcentrationChart";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskLane } from "../components/DeskLane";
import { CustomersGrowthSection } from "../components/CustomersGrowthSection";
import {
  CustomersLtvDepth,
  CustomersLtvEconomics,
  CustomersLtvWindows,
  type CustomersLtvMetrics,
} from "../components/CustomersLtvSection";
import {
  CUSTOMERS_FIRST_LANE_LABEL,
  parseCustomersPanel,
} from "../lib/customers-first-viewport";
import { GROWTH_FIRST_LANE_LABEL } from "../lib/growth-first-viewport";
import {
  namedDeskScreenFromPath,
  namedDeskTitle,
} from "../lib/desk-request-screen";
import { deskPageShouldRevalidate } from "../lib/desk-tab-flow";
import { useDeskHref } from "../lib/desk-base-path";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import {
  loadPublicSamplePage,
  type PublicSamplePage,
} from "../lib/public-sample-page.server";
import { loadLtvDepth } from "../lib/ltv-depth-page.server";
import {
  customersOnScreenWindow,
  type CustomersWindowDays,
} from "../lib/customers-days-to-second";

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

export const shouldRevalidate = deskPageShouldRevalidate;

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
  const location = useLocation();
  const deskHref = useDeskHref();
  const pathScreen = namedDeskScreenFromPath(location.pathname);
  const screen =
    pathScreen ??
    (data.panel === "ltv" ? "ltv" : data.panel === "growth" ? "growth" : null);
  const showCustomers = screen == null;
  const showLtv = screen === "ltv";
  const showGrowth = screen === "growth";
  const showSave = screen === "who-to-save";
  const pageHeading =
    screen === "ltv" || screen === "growth" || screen === "who-to-save"
      ? namedDeskTitle(screen)
      : PRODUCT_NOUN.buyersTitle;
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
  const windowDays: CustomersWindowDays = {
    label: customersOnScreenWindow(data.rangeLabel),
    days: data.depth.medianDaysToSecond,
    cameBack: data.depth.repeatBuyers,
  };

  return (
    <DeskBookPage
      heading={pageHeading}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      orderBookDepth="paid_full"
      retryHref="/demo/customers"
    >
      <div className="mcfly-desk-anchor mcfly-scoreboard--customers">
        {showCustomers ? (
        <div id="mcfly-returning">
          <DeskLane
            rank="first"
            label={
              showCustomers ? PRODUCT_NOUN.buyersTitle : CUSTOMERS_FIRST_LANE_LABEL
            }
            hint=""
          >
            <div className="mcfly-overview-first-beat mcfly-customers-first-beat">
              <CustomersFirstViewport
                analytics={data.customers}
                book={data.book}
                salesPending={false}
                useSampleDesk
                todaySalesTruncated={false}
                periodLabel={
                  data.rangeLabel === "Month to date"
                    ? "This month"
                    : data.rangeLabel
                }
                windowSales={data.sales.totalSales}
              />
              <CustomersCompareGlance
                book={data.book}
                lastYear={data.customers.lastYearMix}
                salesPending={false}
              />
            </div>
            <CustomerMixChart
              analytics={data.customers}
              salesPending={false}
              quotedShare={data.book.returningSalesShare}
              quotedWindow={
                data.rangeLabel === "Month to date"
                  ? "This month"
                  : data.rangeLabel
              }
            />
          </DeskLane>
          <DeskLane
            rank="more"
            label="Returning mix and facts"
            fold
            defaultOpen={data.shotMode}
          >
            <CustomersScoreboard
              book={data.book}
              depth={data.depth}
              periodLabel={data.rangeLabel}
              salesPending={false}
              useSampleDesk
              growthHref={deskHref("/app/growth")}
              ltvHref={deskHref("/app/ltv")}
            />
          </DeskLane>
        </div>
        ) : null}
        {showLtv ? (
        <div id="mcfly-ltv">
          <DeskLane rank="next" label="What a new buyer is worth">
            <CustomersLtvWindows {...ltvProps} />
            <CustomersLtvEconomics {...ltvProps} />
          </DeskLane>
        </div>
        ) : null}
        {showGrowth ? (
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
              windowDays={windowDays}
              quotedComeback={{
                historyDays: data.customers.historyDays,
                within30Share: data.customers.within30Share,
                within30Count: data.customers.within30Count,
                eligible30: data.customers.eligible30,
                winBackDay: data.customers.winBackDay,
                saveNowOneOrder: data.customers.saveNowOneOrder,
              }}
            />
          </DeskLane>
        </div>
        ) : null}
        {showCustomers ? (
        <div id="mcfly-depth">
          <DeskLane
            rank="more"
            label="Who the dollars sit with"
            fold
            defaultOpen={data.shotMode || data.panel === "depth"}
          >
            <div className="mcfly-cust-action-row">
              <CustomerRetentionBoard
                analytics={data.customers}
                windowDays={windowDays}
              />
              <CustomerWhaleWatch rfm={data.customers.rfm} />
            </div>
            <CustomerRfmBoard rfm={data.customers.rfm} />
            <CustomerValueBands analytics={data.customers} />
            <CustomerWhaleTable analytics={data.customers} />
            <CustomerConcentrationChart book={data.book} depth={data.depth} />
            <CustomersLtvDepth {...ltvProps} />
          </DeskLane>
        </div>
        ) : null}
        {showSave ? (
          <section aria-label="Who to save">
            <CustomerRetentionBoard
              analytics={data.customers}
              windowDays={windowDays}
            />
          </section>
        ) : null}
      </div>
    </DeskBookPage>
  );
}
