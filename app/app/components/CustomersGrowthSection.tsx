import { GrowthComebackChart } from "./GrowthComebackChart";
import { GrowthFirstViewport } from "./GrowthFirstViewport";
import { GrowthOrderStepsBoard } from "./GrowthOrderStepsBoard";
import { GrowthScoreboard } from "./GrowthScoreboard";
import { GrowthTt2Board } from "./GrowthTt2Board";
import { SlackInsightCard } from "./SlackInsightCard";
import type {
  BuyerLifetimeSpan,
  ComebackNextWait,
  OrderStepRow,
  QuietBackView,
} from "../lib/customers-analytics";
import {
  growthFirstOrderMonths,
  growthOrderDepthBars,
  growthStandupCopyText,
  type GrowthMonthBar,
  type QuotedComebackWindow,
} from "../lib/growth-comeback";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { GrowthTt2View } from "../lib/growth-tt2";
import {
  customersDaysToSecondCopy,
  type CustomersWindowDays,
} from "../lib/customers-days-to-second";
import {
  daysToSecondSlackInsight,
  firstTimeSlackInsight,
} from "../lib/shareable-insights";
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
  shopLabel = "",
  shotMode = false,
  orderSteps,
  quietBack,
  comebackWait,
  lifetimeSpan,
  windowDays,
  quotedComeback = null,
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
  shopLabel?: string;
  shotMode?: boolean;
  orderSteps: OrderStepRow[];
  quietBack: QuietBackView;
  comebackWait: ComebackNextWait;
  lifetimeSpan: BuyerLifetimeSpan;
  /** Period already on screen. Days to a second order uses this wait only. */
  windowDays: CustomersWindowDays;
  /** Customers-analytics come-back. Growth quotes this window, not the full book. */
  quotedComeback?: QuotedComebackWindow | null;
}) {
  const currency = useDeskCurrency();
  const orderDepthBars = growthOrderDepthBars(depth);
  const firstOrderMonths =
    months ?? growthFirstOrderMonths(cohorts ?? []);
  const windowCopy = salesPending ? null : customersDaysToSecondCopy(windowDays);
  const daysSlack = windowCopy
    ? daysToSecondSlackInsight({
        typicalDays: windowDays.days,
        readLine: windowCopy.line,
        shopLabel,
        sample: useSampleDesk,
        where: windowDays.label,
      })
    : null;
  const firstTimeSlack = firstTimeSlackInsight({
    line: growthStandupCopyText({
      salesPending,
      newSales: book.newSales,
      money: (n) => formatCurrency(n, currency),
      secondShare: depth.secondOrderBuyerShare,
      thirdShare: depth.thirdPlusBuyerShare,
      reachNow: tt2.reachNow,
      clockAvailable: false,
    }),
    shopLabel,
    sample: useSampleDesk,
    where: salesPending ? "Still loading" : "This period",
  });

  return (
    <>
      <p className="mcfly-book__lede">{GROWTH_LEDE}</p>
      <div id="mcfly-win-back">
        <GrowthFirstViewport
          tt2={tt2}
          salesPending={Boolean(salesPending)}
          useSampleDesk={useSampleDesk}
          windowDays={windowDays}
        />
        <SlackInsightCard insight={daysSlack} shotMode={shotMode} />
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
        windowDays={windowDays}
        quotedComeback={quotedComeback}
      />
      <GrowthScoreboard
        book={book}
        depth={depth}
        repeatRate={repeatRate}
        avgOrdersD90={avgOrdersD90}
        salesPending={salesPending}
        useSampleDesk={useSampleDesk}
        ltvHref="#mcfly-ltv"
        quietBack={quietBack}
        comebackWait={comebackWait}
        lifetimeSpan={lifetimeSpan}
        reachNow={quotedComeback?.saveNowOneOrder ?? tt2.reachNow}
        clockAvailable={false}
        windowDays={windowDays}
        quotedComeback={quotedComeback}
      />
      {firstTimeSlack ? <SlackInsightCard insight={firstTimeSlack} shotMode={shotMode} /> : null}
      <GrowthTt2Board
        tt2={tt2}
        windowDays={windowDays}
        quotedComeback={quotedComeback}
      />
      <GrowthOrderStepsBoard steps={orderSteps} />
    </>
  );
}
