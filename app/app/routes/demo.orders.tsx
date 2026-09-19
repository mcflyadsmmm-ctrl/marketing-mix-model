import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { DeskBookPage } from "../components/DeskBookPage";
import { DeskLane } from "../components/DeskLane";
import { OrdersFirstViewport } from "../components/OrdersFirstViewport";
import { OrdersScoreboard } from "../components/OrdersScoreboard";
import { OrdersTimingChart } from "../components/OrdersTimingChart";
import { deskBookLede } from "../lib/desk-history";
import {
  ORDERS_CLOCK_LANE_LABEL,
  ORDERS_FIRST_LANE_LABEL,
} from "../lib/orders-first-viewport";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

export default function PublicDemoOrders() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.ordersTitle}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      retryHref="/demo/orders"
    >
      <div className="mcfly-desk-anchor mcfly-scoreboard--orders">
        <p className="mcfly-book__lede">
          {deskBookLede(
            "Shopify Analytics shows the average order. This page shows the typical order (median) vs the average, discounts, 2+ items, then weekend, hour, and Online vs POS.",
          )}
        </p>
        <DeskLane rank="first" label={ORDERS_FIRST_LANE_LABEL}>
          <OrdersFirstViewport depth={data.depth} salesPending={false} useSampleDesk />
        </DeskLane>
        <DeskLane rank="next" label={ORDERS_CLOCK_LANE_LABEL}>
          <OrdersScoreboard
            book={data.book}
            depth={data.depth}
            clocks={{
              gross: data.sales.grossSales,
              grossKnown: true,
              total: data.sales.totalSales,
              net: data.sales.netSales,
              netKnown: true,
            }}
            salesPending={false}
            useSampleDesk
          />
        </DeskLane>
        <DeskLane rank="next" label="Weekday and hour">
          <OrdersTimingChart
            weekdayShares={data.depth.weekdaySalesShare}
            hourlyShares={data.depth.hourlySalesShare}
            peakWeekday={data.depth.peakWeekday}
            salesPending={false}
          />
        </DeskLane>
      </div>
    </DeskBookPage>
  );
}
