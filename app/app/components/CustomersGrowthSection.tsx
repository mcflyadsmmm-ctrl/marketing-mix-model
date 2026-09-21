import { GrowthComebackChart } from "./GrowthComebackChart";
import { GrowthFirstViewport } from "./GrowthFirstViewport";
import { GrowthScoreboard } from "./GrowthScoreboard";
import { GrowthTt2Board } from "./GrowthTt2Board";
import {
  growthFirstOrderMonths,
  growthOrderDepthBars,
  type GrowthMonthBar,
} from "../lib/growth-comeback";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { GrowthTt2View } from "../lib/growth-tt2";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";

const GROWTH_LEDE =
  "Shopify Analytics Overview shows a returning-customer rate. This page shows first-time dollars, days to a second order, and who came back within 30 days. Order history, not an email list.";

/**
 * Full Growth pack mounted on Customers (FOLD NEVER DELETE).
 * Routes /app/growth and /demo/growth redirect here with panel=growth.
 */
export function CustomersGrowthSection({
  book,
  tt2,
  depth,
  months,
  cohorts,
  repeatRate,
  avgOrdersD90,
  salesPending,
  useSampleDesk,
}: {
  book: ShopifyNativePeriodStats;
  tt2: GrowthTt2View;
  depth: ShopifyDepthStats;
  months?: GrowthMonthBar[];
  cohorts?: Array<{
    cohortMonth: string;
    customers: number;
    revenueD30: number;
    ordersD90: number;
  }>;
  repeatRate: number | null;
  avgOrdersD90: number | null;
  salesPending: boolean;
  useSampleDesk: boolean;
}) {
  const orderDepthBars = growthOrderDepthBars(depth);
  const firstOrderMonths =
    months ?? growthFirstOrderMonths(cohorts ?? []);

  return (
    <>
      <p className="mcfly-book__lede">{GROWTH_LEDE}</p>
      <div id="mcfly-win-back">
        <GrowthFirstViewport
          tt2={tt2}
          salesPending={Boolean(salesPending)}
          useSampleDesk={useSampleDesk}
        />
      </div>
      <GrowthComebackChart
        depthBars={orderDepthBars}
        months={firstOrderMonths}
        depth={depth}
        repeatRate={repeatRate}
        firstTimeDollars={book.newSales}
        salesPending={salesPending}
        drillNext="What each first order is worth in 30 / 90 / 365 days sits on this page."
        drillHref="#mcfly-ltv"
        drillLabel={PRODUCT_NOUN.openLtv}
      />
      <GrowthScoreboard
        book={book}
        depth={depth}
        repeatRate={repeatRate}
        avgOrdersD90={avgOrdersD90}
        salesPending={salesPending}
        useSampleDesk={useSampleDesk}
        ltvHref="#mcfly-ltv"
      />
      <GrowthTt2Board tt2={tt2} />
    </>
  );
}
