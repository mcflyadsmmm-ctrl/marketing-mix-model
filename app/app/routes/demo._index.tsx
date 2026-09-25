import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useLocation, useSearchParams } from "react-router";

import { DeskLane } from "../components/DeskLane";
import { EnterpriseScoreboard } from "../components/EnterpriseScoreboard";
import { OverviewDepthPeeks } from "../components/OverviewFirstViewport";
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
import { WeekdaySalesChart } from "../components/WeekdaySalesChart";
import { useDeskHashScroll } from "../components/useDeskHashScroll";
import { useDeskHref } from "../lib/desk-base-path";
import {
  DESK_SECTION,
  deskNavHref,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isOverviewHomeStage,
  isOverviewToolStage,
  overviewToolFromPanel,
} from "../lib/desk-nav";
import {
  OVERVIEW_FIRST_LANE_LABEL,
  OVERVIEW_MIX_CLOSE_ID,
  OVERVIEW_YOY_YEAR_ID,
  OVERVIEW_YOY_YEAR_PANEL,
} from "../lib/overview-first-viewport";
import {
  emptyOverviewMixForecast,
} from "../lib/overview-mix-forecast";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  namedDeskScreenFromPath,
  namedDeskTitle,
} from "../lib/desk-request-screen";
import { deskPageShouldRevalidate } from "../lib/desk-tab-flow";
import { selectStoredDeskWindow } from "../lib/desk-stored-windows";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { parseYoyYear } from "../lib/yoy-workspace";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const shouldRevalidate = deskPageShouldRevalidate;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoOverview() {
  const data = useLoaderData<typeof loader>();
  const deskHref = useDeskHref();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  useDeskHashScroll();
  useOverviewPanelScroll(searchParams.get("panel"));
  const picked = selectStoredDeskWindow({
    windows: data.orderWindows,
    period: searchParams.get("period"),
    loadedPreset: data.preset,
    fallback: data.orderHero,
  });
  const requestScreen = data.shotMode
    ? null
    : namedDeskScreenFromPath(location.pathname);
  const hashStage = data.shotMode
    ? DESK_SECTION.overview
    : deskStageFromHash(location.hash);
  const panelTool = data.shotMode
    ? null
    : overviewToolFromPanel(searchParams.get("panel"));
  const toolStage =
    requestScreen == null && panelTool == null && isOverviewToolStage(hashStage)
      ? hashStage
      : panelTool;
  const onHome =
    requestScreen == null && toolStage == null && isOverviewHomeStage(hashStage);
  const pageHeading =
    requestScreen === "year-over-year" || requestScreen === "month-close"
      ? namedDeskTitle(requestScreen)
      : deskStageHeading(toolStage ?? hashStage);
  const ordersHref = deskNavHrefFromSearch(deskHref("/app/orders"), searchParams);
  const yoyHref = deskNavHref(deskHref("/app/yoy"), {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
  });
  const customersHref = deskNavHrefFromSearch(
    deskHref("/app/customers"),
    searchParams,
  );
  const goalsHref = deskNavHrefFromSearch(deskHref("/app/goals"), searchParams);
  const customersGrowthHref = deskNavHref(deskHref("/app/growth"), {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
  });
  const customersLtvHref = deskNavHref(deskHref("/app/ltv"), {
    period: searchParams.get("period"),
    shot: searchParams.get("shot") === "1",
  });
  const drillDays = data.cashControl?.drillDays ?? [];
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
  const embed = data.embed;

  return (
    <s-page heading={data.shotMode || onHome ? undefined : pageHeading} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--sample",
          data.shotMode ? "mcfly-desk--shot" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {onHome ? (
          <div className="mcfly-desk-anchor mcfly-scoreboard--overview" id={DESK_SECTION.overview}>
            <DeskLane rank="first" label={OVERVIEW_FIRST_LANE_LABEL} hint="">
              <div className="mcfly-overview-first-beat">
              {embed === "yoy" ? null : (
                <EnterpriseScoreboard hero={picked.hero} />
              )}
              </div>
              {embed === "typical" ? null : (
                <div className="mcfly-desk-anchor mcfly-overview-chart-beat" id={DESK_SECTION.chart}>
                  <OverviewSalesChart
                    days={data.explorerDays}
                    ordersHref={ordersHref}
                    salesPending={false}
                    typicalDay={mixView.forecast?.typicalDay ?? null}
                    typicalDayWindow={mixView.typicalDayWindow}
                  />
                </div>
              )}
            </DeskLane>
            {embed ? null : (
              <>
                <DeskLane
                  rank="more"
                  label="Mix and month close"
                  fold
                  defaultOpen={data.shotMode}
                >
                <div className="mcfly-desk-anchor" id={OVERVIEW_MIX_CLOSE_ID}>
                  <OverviewMixForecast
                    view={mixView}
                    customersHref={customersHref}
                  />
                  <OrderHistoryForecast
                    view={data.orderHistoryForecast}
                    variant="overview"
                    goalsHref={goalsHref}
                  />
                </div>
                </DeskLane>
                <DeskLane
                  rank="more"
                  label="More order detail"
                  fold
                  defaultOpen={data.shotMode}
                >
                  <OverviewDepthPeeks
                    orderBookDepth="paid_full"
                    orderCount={data.orderHero.orderCount}
                    typicalOrder={data.orderHero.typicalOrder}
                    meanAov={
                      data.orderHero.orderCount > 0 && data.orderHero.sales != null
                        ? data.orderHero.sales / data.orderHero.orderCount
                        : null
                    }
                    typicalDay={data.depth.medianDailySales}
                    returningSalesShare={
                      data.orderHero.sales != null &&
                      data.orderHero.sales > 0 &&
                      data.orderHero.returningSales != null
                        ? data.orderHero.returningSales / data.orderHero.sales
                        : data.book.returningSalesShare
                    }
                    returningSales={data.orderHero.returningSales}
                    weekendSalesShare={data.orderHero.weekendShare}
                    peakWeekday={data.depth.peakWeekday}
                    weekdaySalesShare={data.depth.weekdaySalesShare}
                    windowSales={data.orderHero.sales}
                    salesPending={false}
                    ordersHref={ordersHref}
                    useSampleDesk
                    orderHero={data.orderHero}
                  />
                  <WeekdaySalesChart
                    shares={data.depth.weekdaySalesShare}
                    windowSales={data.orderHero.sales ?? data.sales.totalSales}
                    peakWeekday={data.depth.peakWeekday}
                  />
                </DeskLane>
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
        {requestScreen === "year-over-year" ? (
          <section id={OVERVIEW_YOY_YEAR_ID} data-panel={OVERVIEW_YOY_YEAR_PANEL} aria-label="Year over year">
            <OverviewYoyYearSection
              {...yoyYearWorkspace}
              salesPending={false}
              onYearChange={onYoyYearChange}
            />
          </section>
        ) : null}
        {requestScreen === "month-close" ? (
          <section id={OVERVIEW_MIX_CLOSE_ID} aria-label="Month close">
            <OverviewMixForecast view={mixView} customersHref={customersHref} />
          </section>
        ) : null}
        {toolStage === DESK_SECTION.compare ? (
          <section id={DESK_SECTION.compare} aria-label="Compare">
            <OverviewYoyCards
              cards={data.yoyCards}
              salesPending={false}
              yoyHref={yoyHref}
            />
            <OverviewYoyYearSection
              {...yoyYearWorkspace}
              salesPending={false}
              onYearChange={onYoyYearChange}
            />
          </section>
        ) : null}
        {toolStage === DESK_SECTION.ledger ? (
          <section id={DESK_SECTION.ledger} aria-label="Ledger">
            <OverviewSalesChart
              caption="Ledger"
              days={data.explorerDays}
              ordersHref={ordersHref}
              salesPending={false}
              typicalDay={mixView.forecast?.typicalDay ?? null}
              typicalDayWindow={mixView.typicalDayWindow}
            />
          </section>
        ) : null}
        {toolStage === DESK_SECTION.mix ? (
          <section id={DESK_SECTION.mix} aria-label="Mix">
            <OverviewMixForecast view={mixView} customersHref={customersHref} />
          </section>
        ) : null}
        {toolStage === DESK_SECTION.plan ? (
          <section id={DESK_SECTION.plan} aria-label="Plan">
            <OrderHistoryForecast
              view={data.orderHistoryForecast}
              variant="overview"
              goalsHref={goalsHref}
            />
          </section>
        ) : null}
      </div>
    </s-page>
  );
}
