import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useLocation, useNavigation, useSearchParams } from "react-router";

import { DeskLane } from "../components/DeskLane";
import {
  OverviewDepthPeeks,
  OverviewFirstViewport,
} from "../components/OverviewFirstViewport";
import { OrderHistoryForecast } from "../components/OrderHistoryForecast";
import { OverviewMixForecast } from "../components/OverviewMixForecast";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import { OverviewYoyCards } from "../components/OverviewYoyCards";
import {
  OverviewYoyYearSection,
  asOfFromCertifiedDays,
  buildOverviewYoyYearModel,
  useOverviewPanelScroll,
} from "../components/OverviewYoyYearSection";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import { WeekdaySalesChart } from "../components/WeekdaySalesChart";
import { useDeskHashScroll } from "../components/useDeskHashScroll";
import { useDeskHref } from "../lib/desk-base-path";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  DESK_SECTION,
  deskNavHref,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isOverviewHomeStage,
} from "../lib/desk-nav";
import { formatCurrency } from "../lib/mer-format";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import {
  OVERVIEW_FIRST_LANE_LABEL,
  OVERVIEW_MIX_CLOSE_ID,
  OVERVIEW_YOY_YEAR_ID,
  OVERVIEW_YOY_YEAR_PANEL,
} from "../lib/overview-first-viewport";
import {
  emptyOverviewMixForecast,
  overviewMixForecastRead,
} from "../lib/overview-mix-forecast";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { loadPublicSampleBook } from "../lib/public-sample-book.server";
import { PUBLIC_SAMPLE_TZ } from "../lib/public-sample-constants";
import { overviewClockPayloadFromOrders } from "../lib/overview-sales-chart";
import {
  buildShareableInsights,
  pickShareableLtvPeek,
} from "../lib/shareable-insights";
import { parseYoyYear } from "../lib/yoy-workspace";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const page = await loadPublicSamplePage(request);
  const now = new Date();
  const book = loadPublicSampleBook(now);
  return {
    ...page,
    sameClock: overviewClockPayloadFromOrders({
      now,
      timeZone: PUBLIC_SAMPLE_TZ,
      pending: false,
      orders: book.orders.map((row) => ({
        orderedAt: row.orderedAt,
        amount: row.amount,
      })),
    }),
  };
};

export default function PublicDemoOverview() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const deskHref = useDeskHref();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  useDeskHashScroll();
  useOverviewPanelScroll(searchParams.get("panel"));
  const isLoading = navigation.state === "loading";
  const stage = data.shotMode
    ? DESK_SECTION.overview
    : deskStageFromHash(location.hash);
  const onHome = isOverviewHomeStage(stage);
  const ordersHref = deskNavHrefFromSearch(deskHref("/app/orders"), searchParams);
  const yoyHref = deskNavHref(deskHref("/app"), {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
    extra: { panel: OVERVIEW_YOY_YEAR_PANEL },
    hash: OVERVIEW_YOY_YEAR_ID,
  });
  const customersHref = deskNavHrefFromSearch(
    deskHref("/app/customers"),
    searchParams,
  );
  const goalsHref = deskNavHrefFromSearch(deskHref("/app/goals"), searchParams);
  const customersGrowthHref = deskNavHref(deskHref("/app/customers"), {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
    extra: { panel: "growth" },
  });
  const customersLtvHref = deskNavHref(deskHref("/app/customers"), {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
    extra: { panel: "ltv" },
  });
  const drillDays = data.cashControl?.drillDays ?? [];
  const monthToDateSales =
    data.yoyCards.find((card) => card.id === "mtd")?.sales ?? null;
  const yoyAsOf = asOfFromCertifiedDays(drillDays, new Date());
  const yoyYear = parseYoyYear(searchParams.get("year"), yoyAsOf.year);
  const yoyYearWorkspace = buildOverviewYoyYearModel(
    drillDays,
    yoyYear,
    yoyAsOf,
  );
  const onYoyYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (data.shotMode) params.set("shot", "1");
    setSearchParams(params);
  };
  const mixView = data.mixForecast ?? emptyOverviewMixForecast();
  const mixRead = overviewMixForecastRead(mixView);
  const ltvPeek = pickShareableLtvPeek({
    revenue30: data.ltv.revenue30,
    revenue90: data.ltv.revenue90,
    revenue365: data.ltv.revenue365,
    historyLimited: false,
  });
  const insightView = buildShareableInsights(
    {
      salesPending: false,
      orderCount: data.sales.orderCount,
      returningSales: data.book.returningSales,
      returningShare: data.book.returningSalesShare,
      newSales: data.book.newSales,
      typicalOrder: data.depth.medianAov,
      daysToSecond: data.depth.medianDaysToSecond,
      ltvPeek: ltvPeek?.amount ?? null,
      ltvPeekDays: ltvPeek?.days ?? null,
      historyLimited: false,
      shopLabel: data.shopLabel,
      sample: true,
      periodLabel: data.rangeLabel,
    },
    (n) => formatCurrency(n, currency),
  );
  const freshLabel = formatCashFreshnessChip({
    useSampleDesk: true,
    salesPulledAt: null,
    lastAt: null,
    source: "snapshot",
  });
  const embed = data.embed;

  return (
    <s-page heading={data.shotMode ? undefined : deskStageHeading(stage)} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--sample",
          data.shotMode ? "mcfly-desk--shot" : null,
          isLoading ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isLoading ? (
          <section className="mcfly-state mcfly-state--loading mcfly-state--soft" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing SAMPLE sales…</p>
          </section>
        ) : null}

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">{data.shopLabel}</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{data.tillLabel}</span>
          </div>
          <div className="mcfly-trust" aria-label="Trust and freshness">
            <span className="mcfly-trust__chip mcfly-trust__chip--sample">SAMPLE</span>
            <span className="mcfly-trust__chip">{freshLabel}</span>
          </div>
        </div>

        {onHome ? (
          <div className="mcfly-desk-anchor mcfly-scoreboard--overview" id={DESK_SECTION.overview}>
            <DeskLane rank="first" label={OVERVIEW_FIRST_LANE_LABEL}>
              {embed === "yoy" ? null : (
                <OverviewFirstViewport
                  orderCount={data.sales.orderCount}
                  typicalOrder={data.depth.medianAov}
                  meanAov={
                    data.sales.orderCount > 0
                      ? data.sales.totalSales / data.sales.orderCount
                      : null
                  }
                  typicalDay={data.depth.medianDailySales}
                  returningSalesShare={data.book.returningSalesShare}
                  returningSales={data.book.returningSales}
                  newSales={data.book.newSales}
                  mixGreeting={mixRead?.line}
                  medianDaysToSecond={data.depth.medianDaysToSecond}
                  weekendSalesShare={data.depth.weekendSalesShare}
                  peakWeekday={data.depth.peakWeekday}
                  weekdaySalesShare={data.depth.weekdaySalesShare}
                  windowSales={data.sales.totalSales}
                  storedSalesDays={drillDays.map((day) => ({
                    dateKey: day.dateKey,
                    sales: day.sales,
                  }))}
                  monthToDateSales={monthToDateSales}
                  salesAsOfKey={data.cashControl?.asOfKey ?? null}
                  ltvPeek={ltvPeek?.amount ?? null}
                  ltvPeekDays={ltvPeek?.days ?? null}
                  ltvHistoryLimited={false}
                  monthClose={mixView.forecast?.projected ?? null}
                  monthCloseRemainingDays={mixView.forecast?.remainingDays ?? null}
                  monthCloseClosed={mixView.forecast?.closed ?? false}
                  salesPending={false}
                  ordersHref={ordersHref}
                  useSampleDesk
                  clock={data.sameClock}
                />
              )}
              {embed === "typical" ? null : (
                <OverviewYoyCards
                  cards={data.yoyCards}
                  salesPending={false}
                  yoyHref={yoyHref}
                />
              )}
              {embed === "overview" || embed === "yoy" || embed === "typical" ? null : (
                <div className="mcfly-desk-anchor" id={DESK_SECTION.chart}>
                  <OverviewSalesChart
                    days={data.explorerDays}
                    historyDays={drillDays.map((day) => ({
                      dateKey: day.dateKey,
                      sales: day.sales,
                    }))}
                    ordersHref={ordersHref}
                    salesPending={false}
                    typicalDay={data.depth.medianDailySales}
                  />
                </div>
              )}
            </DeskLane>
            {embed ? null : (
              <>
                <div className="mcfly-desk-anchor" id={OVERVIEW_MIX_CLOSE_ID}>
                <DeskLane rank="next" label="Mix and month close">
                  <OverviewMixForecast
                    view={mixView}
                    customersHref={customersHref}
                    typicalOrder={data.depth.medianAov}
                    meanAov={
                      data.sales.orderCount > 0
                        ? data.sales.totalSales / data.sales.orderCount
                        : null
                    }
                  />
                  <OrderHistoryForecast
                    view={data.orderHistoryForecast}
                    variant="overview"
                    goalsHref={goalsHref}
                  />
                  <ShareableInsightCards view={insightView} shotMode={data.shotMode} />
                </DeskLane>
                <DeskLane
                  rank="more"
                  label="More order detail"
                  fold
                  defaultOpen={data.shotMode}
                >
                  <OverviewDepthPeeks
                    orderCount={data.sales.orderCount}
                    typicalOrder={data.depth.medianAov}
                    meanAov={
                      data.sales.orderCount > 0
                        ? data.sales.totalSales / data.sales.orderCount
                        : null
                    }
                    typicalDay={data.depth.medianDailySales}
                    returningSalesShare={data.book.returningSalesShare}
                    returningSales={data.book.returningSales}
                    weekendSalesShare={data.depth.weekendSalesShare}
                    peakWeekday={data.depth.peakWeekday}
                    weekdaySalesShare={data.depth.weekdaySalesShare}
                    windowSales={data.sales.totalSales}
                    salesPending={false}
                    ordersHref={ordersHref}
                    useSampleDesk
                  />
                  <WeekdaySalesChart
                    shares={data.depth.weekdaySalesShare}
                    windowSales={data.sales.totalSales}
                    peakWeekday={data.depth.peakWeekday}
                  />
                </DeskLane>
                </div>
                <DeskLane rank="more" label="Year board vs last year">
                  <OverviewYoyYearSection
                    {...yoyYearWorkspace}
                    salesPending={false}
                    onYearChange={onYoyYearChange}
                  />
                </DeskLane>
                <footer className="mcfly-book__links">
                  <Link to={customersHref}>{PRODUCT_NOUN.buyersTitle}</Link>
                  <Link to={customersGrowthHref}>{PRODUCT_NOUN.growthTitle}</Link>
                  <Link to={ordersHref}>{PRODUCT_NOUN.ordersTitle}</Link>
                  <Link to={customersLtvHref}>{PRODUCT_NOUN.openLtv}</Link>
                </footer>
              </>
            )}
            {embed === "yoy" ? (
              <OverviewYoyYearSection
                {...yoyYearWorkspace}
                salesPending={false}
                onYearChange={onYoyYearChange}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </s-page>
  );
}
