/**
 * Customer / LTV boards for the stored window.
 * The job may read at most 20,000 newest order rows (same cap as request paths).
 * A period click reads the stored JSON and does not call this.
 */

import prisma from "../db.server";
import {
  buildCustomerAnalytics,
  type CustomerAnalytics,
} from "./customers-analytics";
import { buildCustomerRfm, type CustomerRfmView } from "./customers-rfm";
import { GROWTH_COMEBACK_WINDOW_DAYS } from "./growth-comeback";
import { buildGrowthTt2, type GrowthTt2View } from "./growth-tt2";
import { buildLtvFlagship, type LtvFlagshipView } from "./ltv-flagship";
import {
  firstYearBlocked,
  orderBookSpanDays,
} from "./ltv-year-honesty";
import { shopLiveIngestDepth } from "./live-ingest-depth.server";
import {
  getOrderBackfillHistoryLimited,
  ORDER_FACT_DAY_COMPLETE_PREFIX,
  ORDER_FACT_GUEST_KEY,
  ORDER_FACT_SOURCE,
} from "./order-facts.server";
import { shopifyDepthStats, type ShopifyDepthStats } from "./shopify-depth-stats";
import { truncatedLifetimeLine } from "./till-ltv";
import type { DepthOrder } from "./ltv-depth";

/** Same cap as `loadOrderDepthRows`. Newest first so a partial book is the months already in. */
export const STORED_BOARD_ROW_CAP = 20_000;

const CUSTOMERS_WINDOW_DAYS = 90;
const DAY_MS = 86_400_000;

export type StoredOrderRow = {
  customerKey: string;
  amount: number;
  grossAmount: number | null;
  orderedAt: Date;
  shopLocalDate: Date;
  discountAmount: number | null;
  discountCode: string | null;
  sourceName: string | null;
  unitCount: number | null;
  lifetimeOrders: number | null;
};

export type StoredCustomerAnalytics = CustomerAnalytics & {
  rfm: CustomerRfmView;
};

export type StoredComeback = {
  depth: ShopifyDepthStats;
  windowDays: number;
  tt2: GrowthTt2View;
};

export type StoredLtvDepth = LtvFlagshipView & {
  truncatedLifetimeBuyers: number;
  truncatedLifetimeLine: string | null;
};

export type StoredBoards = {
  analytics: StoredCustomerAnalytics;
  comeback: StoredComeback;
  depth: StoredLtvDepth;
};

function toRetention(row: StoredOrderRow) {
  return {
    customerKey: row.customerKey,
    orderedAt: row.orderedAt,
    amount: row.amount,
    lifetimeOrders: row.lifetimeOrders,
    shopLocalDate: row.shopLocalDate,
  };
}

function toDepthOrder(row: StoredOrderRow): DepthOrder {
  return {
    customerKey: row.customerKey,
    orderedAt: row.orderedAt,
    amount: Number.isFinite(row.amount) ? row.amount : 0,
    grossAmount:
      row.grossAmount != null && Number.isFinite(row.grossAmount)
        ? row.grossAmount
        : undefined,
    units: row.unitCount != null && row.unitCount > 0 ? row.unitCount : 1,
    product: null,
    discountAmount: row.discountAmount,
    discountCode: row.discountCode ?? null,
    sourceName: row.sourceName,
  };
}

/** Job-only. Request loaders do not call this. */
export async function loadNewestCappedOrderRows(
  shopId: string,
  now: Date,
): Promise<StoredOrderRow[]> {
  return prisma.orderFact.findMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      orderedAt: { lte: now },
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
    select: {
      customerKey: true,
      amount: true,
      grossAmount: true,
      orderedAt: true,
      shopLocalDate: true,
      discountAmount: true,
      discountCode: true,
      sourceName: true,
      unitCount: true,
      lifetimeOrders: true,
    },
    orderBy: { orderedAt: "desc" },
    take: STORED_BOARD_ROW_CAP,
  });
}

export function boardsFromOrderRows(
  rows: StoredOrderRow[],
  input: {
    windowEnd: Date;
    periodStart: Date;
    periodEnd: Date;
    timeZone: string | null;
    historyLimited: boolean;
    yearBlocked: boolean;
  },
): StoredBoards {
  const end = input.windowEnd;
  const mapped = rows.map(toRetention);
  const recentStart = end.getTime() - CUSTOMERS_WINDOW_DAYS * DAY_MS;
  const recent = mapped.filter((row) => row.orderedAt.getTime() >= recentStart);
  const analytics: StoredCustomerAnalytics = {
    ...buildCustomerAnalytics(recent, {
      windowEnd: end,
      historyWindowDays: CUSTOMERS_WINDOW_DAYS,
      orderBook: mapped,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      historyLimited: input.historyLimited,
      timeZone: input.timeZone,
    }),
    rfm: buildCustomerRfm(mapped, {
      windowEnd: end,
      historyLimited: input.historyLimited,
    }),
  };

  const growthRecent = rows.filter(
    (row) => row.orderedAt.getTime() >= end.getTime() - GROWTH_COMEBACK_WINDOW_DAYS * DAY_MS,
  );
  const growthSum = growthRecent.reduce(
    (sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0),
    0,
  );
  const comeback: StoredComeback = {
    depth: shopifyDepthStats({
      orders: growthRecent,
      totalSales: growthSum,
      netSales: growthSum,
      netSalesKnown: false,
      grossSales: 0,
      grossSalesKnown: false,
      timeZone: input.timeZone,
      windowEnd: end,
    }),
    windowDays: GROWTH_COMEBACK_WINDOW_DAYS,
    tt2: buildGrowthTt2(
      rows.map((row) => ({
        customerKey: row.customerKey,
        orderedAt: row.orderedAt,
        amount: row.amount,
        shopLocalDate: row.shopLocalDate,
      })),
      { windowEnd: end, historyLimited: input.historyLimited },
    ),
  };

  const byCustomer = new Map<
    string,
    { lifetime: number | null; rows: DepthOrder[] }
  >();
  for (const row of rows) {
    if (!row.customerKey || row.customerKey === ORDER_FACT_GUEST_KEY) continue;
    const lifetime =
      row.lifetimeOrders != null && Number.isFinite(row.lifetimeOrders)
        ? Math.max(0, Math.trunc(row.lifetimeOrders))
        : null;
    const prev = byCustomer.get(row.customerKey);
    if (!prev) {
      byCustomer.set(row.customerKey, { lifetime, rows: [toDepthOrder(row)] });
      continue;
    }
    prev.rows.push(toDepthOrder(row));
    if (lifetime != null) {
      prev.lifetime =
        prev.lifetime == null ? lifetime : Math.max(prev.lifetime, lifetime);
    }
  }
  const orders: DepthOrder[] = [];
  let truncatedLifetimeBuyers = 0;
  for (const group of byCustomer.values()) {
    if (group.lifetime != null && group.lifetime > group.rows.length) {
      truncatedLifetimeBuyers += 1;
      continue;
    }
    orders.push(...group.rows);
  }
  const flagship = buildLtvFlagship(orders, end, {
    sample: false,
    historyLimited: input.historyLimited,
    yearBlocked: input.yearBlocked,
  });

  return {
    analytics,
    comeback,
    depth: {
      ...flagship,
      truncatedLifetimeBuyers,
      truncatedLifetimeLine: truncatedLifetimeLine(truncatedLifetimeBuyers),
    },
  };
}

export function emptyLiveCustomerBoards(input: {
  windowEnd: Date;
  periodStart: Date;
  periodEnd: Date;
  timeZone: string | null;
  historyLimited: boolean;
}): StoredBoards {
  return boardsFromOrderRows([], {
    ...input,
    yearBlocked: input.historyLimited,
  });
}

export async function composeStoredBoards(
  shopId: string,
  now: Date,
  timeZone: string | null,
  periodStart: Date,
  periodEnd: Date,
  rows: StoredOrderRow[],
): Promise<StoredBoards> {
  const historyLimited = await getOrderBackfillHistoryLimited(shopId);
  const orderBookDepth = await shopLiveIngestDepth(shopId);
  const yearBlocked = firstYearBlocked({
    historyLimited,
    orderBookDepth,
    bookSpanDays: orderBookSpanDays(
      rows.map((row) => row.orderedAt),
      now,
    ),
  });
  return boardsFromOrderRows(rows, {
    windowEnd: periodEnd,
    periodStart,
    periodEnd,
    timeZone,
    historyLimited,
    yearBlocked,
  });
}
