import {
  getSalesFactRowsByDay,
  type SalesDayFactRow,
} from "./sales-facts.server";
import {
  listBuyerOrderFacts,
  listPeriodOrderFactsForDepth,
} from "./order-facts.server";
import {
  dayFactsFromSalesDayRows,
  type DayFactInput,
  type OrderFactInput,
} from "./shopify-depth-metrics";
import { fetchSampleSalesRowsByDay } from "./sample-desk.server";
import { enqueueSalesFactsBackfill } from "./sales-backfill-kick.server";

/** Minimal admin client — unused for sync work; kept for call-site compatibility. */
type DepthAdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export type ShopifyDepthLoadMode = "fast" | "full";

export type ShopifyDepthLoaderData = {
  dayFacts: DayFactInput[];
  priorDayFacts: DayFactInput[];
  baselineDayFacts: DayFactInput[];
  orderFacts: OrderFactInput[];
  periodLabel: string;
};

/** Cap unbounded Customers history so heavy pass cannot load a decade at once. */
export const DEPTH_BUYER_HISTORY_LOOKBACK_DAYS = 365 * 4;

function sampleRowsToSalesMap(
  rows: Map<
    string,
    {
      sales: number;
      orderCount: number;
      newCustomerNetSales: number;
      returningCustomerNetSales: number;
    }
  >,
): Map<string, SalesDayFactRow> {
  const out = new Map<string, SalesDayFactRow>();
  for (const [key, row] of rows) {
    out.set(key, {
      ...row,
      netSales: null,
      grossSales: null,
    });
  }
  return out;
}

function baselineRangeBefore(
  range: { start: Date; end: Date },
  days: number,
): { start: Date; end: Date } {
  const end = new Date(range.start.getTime() - 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  return { start, end };
}

function buyerHistoryRange(now = new Date()): { start: Date; end: Date } {
  const end = now;
  const start = new Date(
    end.getTime() - DEPTH_BUYER_HISTORY_LOOKBACK_DAYS * 86400000,
  );
  return { start, end };
}

/**
 * Depth tab data.
 * - `fast`: day facts only (first paint). Skips order-fact queries.
 * - `full`: day + order facts (heavy follow-up / shot captures).
 * Never runs sync Shopify backfill on this request — enqueue only.
 */
export async function loadShopifyDepthData(args: {
  shopId: string;
  range: { start: Date; end: Date; label: string };
  priorRange: { start: Date; end: Date };
  ianaTimezone: string | null;
  useSampleDesk: boolean;
  admin?: DepthAdminClient;
  grantedScopes?: string | null;
  /** When true, order facts are shop-wide (Customers tab). */
  allOrderHistory?: boolean;
  /** Default `full` for callers that have not opted into progressive paint. */
  mode?: ShopifyDepthLoadMode;
}): Promise<ShopifyDepthLoaderData> {
  const {
    shopId,
    range,
    priorRange,
    ianaTimezone,
    useSampleDesk,
    grantedScopes,
    allOrderHistory = false,
    mode = "full",
  } = args;

  // Kick deep fill off the critical path — job tick owns GraphQL crawl.
  if (!useSampleDesk) {
    void enqueueSalesFactsBackfill({
      shopId,
      grantedScopes: grantedScopes ?? undefined,
      reason: "depth_tab",
    }).catch(() => {});
  }

  const baselineRange = baselineRangeBefore(range, 56);

  const dayPromise = (async (): Promise<{
    periodRows: Map<string, SalesDayFactRow>;
    priorRows: Map<string, SalesDayFactRow>;
    baselineRows: Map<string, SalesDayFactRow>;
  }> => {
    if (useSampleDesk) {
      const [period, prior, baseline] = await Promise.all([
        fetchSampleSalesRowsByDay(shopId, range),
        fetchSampleSalesRowsByDay(shopId, priorRange),
        fetchSampleSalesRowsByDay(shopId, baselineRange),
      ]);
      return {
        periodRows: sampleRowsToSalesMap(period),
        priorRows: sampleRowsToSalesMap(prior),
        baselineRows: sampleRowsToSalesMap(baseline),
      };
    }
    const [periodRows, priorRows, baselineRows] = await Promise.all([
      getSalesFactRowsByDay(shopId, range, ianaTimezone),
      getSalesFactRowsByDay(shopId, priorRange, ianaTimezone),
      getSalesFactRowsByDay(shopId, baselineRange, ianaTimezone),
    ]);
    return { periodRows, priorRows, baselineRows };
  })();

  const orderPromise =
    mode === "fast"
      ? Promise.resolve([] as OrderFactInput[])
      : (async (): Promise<OrderFactInput[]> => {
          if (allOrderHistory) {
            const rows = await listBuyerOrderFacts(shopId, {
              sample: useSampleDesk,
              range: buyerHistoryRange(),
            });
            return rows.map((o) => ({
              buyerKey: o.buyerKey,
              orderAt: o.orderAt,
              netSales: o.netSales,
              lifetimeOrderRank: o.lifetimeOrderRank,
              hasCustomer: true,
            }));
          }
          const rows = await listPeriodOrderFactsForDepth(shopId, range, {
            sample: useSampleDesk,
          });
          return rows.map((o) => ({
            buyerKey: o.buyerKey,
            orderAt: o.orderAt,
            netSales: o.netSales,
            hasCustomer: o.hasCustomer,
          }));
        })();

  const [days, orderFacts] = await Promise.all([dayPromise, orderPromise]);

  return {
    dayFacts: dayFactsFromSalesDayRows(days.periodRows),
    priorDayFacts: dayFactsFromSalesDayRows(days.priorRows),
    baselineDayFacts: dayFactsFromSalesDayRows(days.baselineRows),
    orderFacts,
    periodLabel: range.label,
  };
}
