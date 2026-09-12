import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import {
  getSalesFactRowsByDay,
  type SalesDayFactRow,
} from "./sales-facts.server";
import {
  listBuyerOrderFacts,
  listPeriodOrderFactsForDepth,
  runOrderFactsBackfill,
} from "./order-facts.server";
import {
  dayFactsFromSalesDayRows,
  type DayFactInput,
  type OrderFactInput,
} from "./shopify-depth-metrics";
import { fetchSampleSalesRowsByDay } from "./sample-desk.server";
import { runSalesFactsBackfill } from "./sales-facts.server";
import {
  FIRST_PAINT_SALES_BACKFILL_DAYS,
  enqueueSalesFactsBackfill,
} from "./sales-backfill-kick.server";

export type ShopifyDepthLoaderData = {
  dayFacts: DayFactInput[];
  priorDayFacts: DayFactInput[];
  baselineDayFacts: DayFactInput[];
  orderFacts: OrderFactInput[];
  periodLabel: string;
};

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

export async function loadShopifyDepthData(args: {
  shopId: string;
  range: { start: Date; end: Date; label: string };
  priorRange: { start: Date; end: Date };
  ianaTimezone: string | null;
  useSampleDesk: boolean;
  admin?: AdminApiContext["admin"];
  grantedScopes?: string | null;
  /** When true, order facts are shop-wide (Customers tab). */
  allOrderHistory?: boolean;
}): Promise<ShopifyDepthLoaderData> {
  const {
    shopId,
    range,
    priorRange,
    ianaTimezone,
    useSampleDesk,
    admin,
    grantedScopes,
    allOrderHistory = false,
  } = args;

  if (!useSampleDesk && admin) {
    void runOrderFactsBackfill(admin, shopId, {
      maxDays: 7,
      grantedScopes: grantedScopes ?? undefined,
    }).catch(() => {});
    void runSalesFactsBackfill(admin, shopId, {
      maxDays: FIRST_PAINT_SALES_BACKFILL_DAYS,
      grantedScopes: grantedScopes ?? undefined,
      newestFirst: true,
      priorityRange: range,
    }).catch(() => {});
    void enqueueSalesFactsBackfill({
      shopId,
      grantedScopes: grantedScopes ?? undefined,
      reason: "depth_tab",
    }).catch(() => {});
  }

  const baselineRange = baselineRangeBefore(range, 56);
  let periodRows: Map<string, SalesDayFactRow>;
  let priorRows: Map<string, SalesDayFactRow>;
  let baselineRows: Map<string, SalesDayFactRow>;

  if (useSampleDesk) {
    const [period, prior, baseline] = await Promise.all([
      fetchSampleSalesRowsByDay(shopId, range),
      fetchSampleSalesRowsByDay(shopId, priorRange),
      fetchSampleSalesRowsByDay(shopId, baselineRange),
    ]);
    periodRows = sampleRowsToSalesMap(period);
    priorRows = sampleRowsToSalesMap(prior);
    baselineRows = sampleRowsToSalesMap(baseline);
  } else {
    [periodRows, priorRows, baselineRows] = await Promise.all([
      getSalesFactRowsByDay(shopId, range, ianaTimezone),
      getSalesFactRowsByDay(shopId, priorRange, ianaTimezone),
      getSalesFactRowsByDay(shopId, baselineRange, ianaTimezone),
    ]);
  }

  let orderFacts: OrderFactInput[] = [];
  if (allOrderHistory) {
    const rows = await listBuyerOrderFacts(shopId, { sample: useSampleDesk });
    orderFacts = rows.map((o) => ({
      buyerKey: o.buyerKey,
      orderAt: o.orderAt,
      netSales: o.netSales,
      lifetimeOrderRank: o.lifetimeOrderRank,
      hasCustomer: true,
    }));
  } else {
    const rows = await listPeriodOrderFactsForDepth(shopId, range, {
      sample: useSampleDesk,
    });
    orderFacts = rows.map((o) => ({
      buyerKey: o.buyerKey,
      orderAt: o.orderAt,
      netSales: o.netSales,
      hasCustomer: o.hasCustomer,
    }));
  }

  return {
    dayFacts: dayFactsFromSalesDayRows(periodRows),
    priorDayFacts: dayFactsFromSalesDayRows(priorRows),
    baselineDayFacts: dayFactsFromSalesDayRows(baselineRows),
    orderFacts,
    periodLabel: range.label,
  };
}
