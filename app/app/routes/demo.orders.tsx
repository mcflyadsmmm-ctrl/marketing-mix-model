import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";

import { DeskBookPage } from "../components/DeskBookPage";
import { DeskLane } from "../components/DeskLane";
import { OrdersCompareGlance } from "../components/OrdersCompareGlance";
import { OrdersFirstViewport } from "../components/OrdersFirstViewport";
import { OrdersFrequencyChart } from "../components/OrdersFrequencyChart";
import { OrdersIntelligence } from "../components/OrdersIntelligence";
import { OrdersScoreboard } from "../components/OrdersScoreboard";
import { OrdersTimingChart } from "../components/OrdersTimingChart";
import {
  assembleOrdersIntelligence,
  ordersIntelPeriodBadge,
  ordersLastYearRows,
  type OrderIntelRow,
} from "../lib/orders-intelligence";
import {
  ORDERS_CLOCK_LANE_LABEL,
  ORDERS_FIRST_LANE_LABEL,
} from "../lib/orders-first-viewport";
import { parsePeriodPreset, resolvePeriod, resolvePriorPeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { PUBLIC_SAMPLE_TZ } from "../lib/public-sample-constants";
import { loadPublicSampleBook } from "../lib/public-sample-book.server";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";

export const headers: HeadersFunction = () => publicDemoHeaders();

function sampleOrderToIntel(row: {
  customerKey: string;
  amount: number;
  discountAmount: number;
  orderedAt: Date;
  shopLocalDate: Date;
  discountCode: string | null;
  lifetimeOrders: number | null;
  unitCount: number;
}): OrderIntelRow {
  return {
    customerKey: row.customerKey,
    amount: row.amount,
    discountAmount: row.discountAmount,
    orderedAt: row.orderedAt,
    shopLocalDate: row.shopLocalDate,
    discountCode: row.discountCode,
    grossAmount: null,
    lifetimeOrders: row.lifetimeOrders,
    unitCount: row.unitCount,
  };
}

function ordersBetween(
  rows: OrderIntelRow[],
  start: Date,
  end: Date,
): OrderIntelRow[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return rows.filter((row) => {
    const t = row.orderedAt.getTime();
    return t >= startMs && t <= endMs;
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const page = await loadPublicSamplePage(request);
  const url = new URL(request.url);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const now = new Date();
  const range = resolvePeriod(preset, now, PUBLIC_SAMPLE_TZ);
  const prior = resolvePriorPeriod(preset, now, PUBLIC_SAMPLE_TZ);
  const book = loadPublicSampleBook(now).orders.map(sampleOrderToIntel);
  const through = book.filter((row) => row.orderedAt.getTime() <= range.end.getTime());
  const assembled = assembleOrdersIntelligence({
    rows: ordersBetween(through, range.start, range.end),
    priorRows: ordersBetween(book, prior.start, prior.end),
    lastYearRows: ordersLastYearRows(book, range.start, range.end),
    orderBook: through,
    periodLabel: range.label,
    badge: ordersIntelPeriodBadge(preset),
    netSales: page.sales.netSales,
    netSalesKnown: page.sales.netSalesKnown !== false,
    timeZone: PUBLIC_SAMPLE_TZ,
  });
  if (!assembled) {
    return { ...page, ordersIntel: null, ordersFrequency: null };
  }
  const { frequency, ...ordersIntel } = assembled;
  return {
    ...page,
    ordersIntel,
    ordersFrequency: frequency,
  };
};

export default function PublicDemoOrders() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { ordersIntel, ordersFrequency } = data;
  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.ordersTitle}
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      showPeriod={false}
      orderBookDepth="paid_full"
      retryHref="/demo/orders"
    >
      <div className="mcfly-desk-anchor mcfly-scoreboard--orders">
        <DeskLane rank="first" label={ORDERS_FIRST_LANE_LABEL} hint="">
          <div className="mcfly-overview-first-beat mcfly-orders-first-beat">
            <OrdersFirstViewport
              depth={data.depth}
              salesPending={false}
              useSampleDesk
              stepMix={ordersIntel?.stepMix ?? null}
              tickets={ordersIntel?.tickets ?? null}
              todaySalesTruncated={false}
              periodLabel="This month"
            />
            <OrdersCompareGlance intel={ordersIntel ?? null} salesPending={false} />
          </div>
          <OrdersTimingChart
            weekdayShares={data.depth.weekdaySalesShare}
            hourlyShares={data.depth.hourlySalesShare}
            peakWeekday={data.depth.peakWeekday}
            salesPending={false}
            timingSplit={ordersIntel?.timingSplit ?? null}
          />
        </DeskLane>
        <DeskLane rank="more" label={ORDERS_CLOCK_LANE_LABEL} fold defaultOpen={data.shotMode}>
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
          {ordersIntel ? <OrdersIntelligence intel={ordersIntel} /> : null}
          {ordersFrequency && ordersFrequency.length > 1 ? (
            <OrdersFrequencyChart buckets={ordersFrequency} />
          ) : null}
        </DeskLane>
      </div>
    </DeskBookPage>
  );
}
