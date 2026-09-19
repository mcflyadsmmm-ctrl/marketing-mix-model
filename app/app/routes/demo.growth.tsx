import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { DeskBookPage } from "../components/DeskBookPage";
import { DeskLane } from "../components/DeskLane";
import { GrowthComebackChart } from "../components/GrowthComebackChart";
import { GrowthFirstViewport } from "../components/GrowthFirstViewport";
import { GrowthScoreboard } from "../components/GrowthScoreboard";
import { useDeskHref } from "../lib/desk-base-path";
import {
  growthOrderDepthBars,
} from "../lib/growth-comeback";
import { GROWTH_FIRST_LANE_LABEL } from "../lib/growth-first-viewport";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoGrowth() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const deskHref = useDeskHref();
  const depth = data.comebackDepth;
  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.growthTitle}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      retryHref="/demo/growth"
    >
      <p className="mcfly-book__lede">
        Who came back below uses SAMPLE Snowdevil order history — not this
        shop’s Shopify orders.
      </p>
      <div className="mcfly-desk-anchor mcfly-scoreboard--growth">
        <p className="mcfly-book__lede">
          Shopify Analytics Overview shows a returning-customer rate. This page shows
          first-time dollars, days to a second order, and who came back within 30 days.
        </p>
        <DeskLane rank="first" label={GROWTH_FIRST_LANE_LABEL}>
          <GrowthFirstViewport tt2={data.tt2} salesPending={false} useSampleDesk />
        </DeskLane>
        <DeskLane rank="next" label="Who came back">
          <GrowthComebackChart
            depthBars={growthOrderDepthBars(depth)}
            months={data.growthMonths}
            depth={depth}
            repeatRate={data.ltv.repeatRate}
            firstTimeDollars={data.book.newSales}
            salesPending={false}
            drillNext="Open LTV for what each first order is worth in 30 / 90 / 365 days."
            drillHref={deskHref("/app/ltv")}
            drillLabel={PRODUCT_NOUN.openLtv}
          />
          <GrowthScoreboard
            book={data.book}
            depth={depth}
            repeatRate={data.ltv.repeatRate}
            avgOrdersD90={data.ltv.avgOrdersD90}
            salesPending={false}
            useSampleDesk
            ltvHref={deskHref("/app/ltv")}
          />
        </DeskLane>
      </div>
    </DeskBookPage>
  );
}
