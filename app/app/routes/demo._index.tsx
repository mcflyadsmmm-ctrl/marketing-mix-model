import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useLocation, useNavigation, useSearchParams } from "react-router";

import { DeskLane } from "../components/DeskLane";
import {
  OverviewDepthPeeks,
  OverviewFirstViewport,
} from "../components/OverviewFirstViewport";
import { OverviewMixForecast } from "../components/OverviewMixForecast";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import { OverviewYoyCards } from "../components/OverviewYoyCards";
import { ShareableInsightCards } from "../components/ShareableInsightCards";
import { WeekdaySalesChart } from "../components/WeekdaySalesChart";
import { useDeskHashScroll } from "../components/useDeskHashScroll";
import { useDeskHref } from "../lib/desk-base-path";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  DESK_SECTION,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isOverviewHomeStage,
} from "../lib/desk-nav";
import { formatCurrency } from "../lib/mer-format";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import { OVERVIEW_FIRST_LANE_LABEL } from "../lib/overview-first-viewport";
import {
  emptyOverviewMixForecast,
  overviewMixForecastRead,
} from "../lib/overview-mix-forecast";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import {
  buildShareableInsights,
  pickShareableLtvPeek,
} from "../lib/shareable-insights";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoOverview() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const deskHref = useDeskHref();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  useDeskHashScroll();
  const isLoading = navigation.state === "loading";
  const stage = data.shotMode
    ? DESK_SECTION.overview
    : deskStageFromHash(location.hash);
  const onHome = isOverviewHomeStage(stage);
  const ordersHref = deskNavHrefFromSearch(deskHref("/app/orders"), searchParams);
  const yoyHref = deskNavHrefFromSearch(deskHref("/app/yoy"), searchParams);
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
                  ltvPeek={ltvPeek?.amount ?? null}
                  ltvPeekDays={ltvPeek?.days ?? null}
                  ltvHistoryLimited={false}
                  monthClose={mixView.forecast?.projected ?? null}
                  monthCloseRemainingDays={mixView.forecast?.remainingDays ?? null}
                  monthCloseClosed={mixView.forecast?.closed ?? false}
                  salesPending={false}
                  ordersHref={ordersHref}
                  useSampleDesk
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
                <OverviewSalesChart
                  days={data.explorerDays}
                  ordersHref={ordersHref}
                  salesPending={false}
                  typicalDay={data.depth.medianDailySales}
                />
              )}
            </DeskLane>
            {embed ? null : (
              <>
                <DeskLane rank="next" label="Mix and month close">
                  <OverviewMixForecast
                    view={mixView}
                    customersHref={deskNavHrefFromSearch(
                      deskHref("/app/customers"),
                      searchParams,
                    )}
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
                <footer className="mcfly-book__links">
                  <Link to={deskNavHrefFromSearch(deskHref("/app/customers"), searchParams)}>
                    {PRODUCT_NOUN.buyersTitle}
                  </Link>
                  <Link to={deskNavHrefFromSearch(deskHref("/app/growth"), searchParams)}>
                    {PRODUCT_NOUN.growthTitle}
                  </Link>
                  <Link to={ordersHref}>{PRODUCT_NOUN.ordersTitle}</Link>
                  <Link to={deskNavHrefFromSearch(deskHref("/app/ltv"), searchParams)}>
                    {PRODUCT_NOUN.openLtv}
                  </Link>
                </footer>
              </>
            )}
          </div>
        ) : null}
      </div>
    </s-page>
  );
}
