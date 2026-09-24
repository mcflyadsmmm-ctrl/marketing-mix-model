/**
 * Off-request desk metrics. Overview paint reads the latest row.
 * Written after OrderFact backfill and by the nightly job on this app.
 * Not a second Fly machine.
 */

import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import {
  buildOverviewOrderBookHero,
  filterOrdersInRange,
  orderBookFirstOrderMs,
  orderBookReturningSales,
  OVERVIEW_ORDER_GUEST_KEY,
  shiftRangeOneYear,
  type OverviewOrderBookHero,
  type OverviewOrderBookRow,
} from "./overview-order-book";
import {
  computeCohortRollups,
  countNewBuyersFromOrders,
  getCohortFacts,
  loadOrderDepthRows,
  ORDER_FACT_SOURCE,
} from "./order-facts.server";
import { orderBookSpanDays } from "./ltv-year-honesty";
import { resolvePeriod } from "./periods";
import { shopifyDepthStats, type ShopifyDepthStats } from "./shopify-depth-stats";

export const DESK_METRICS_PHASE = "desk_metrics";
export const RECOMPUTE_DESK_METRICS_JOB = "recompute_desk_metrics";

export type StoredDeskHero = OverviewOrderBookHero & {
  newSales: number | null;
  daysToSecond: number | null;
  ltvD30: number | null;
  ltvD90: number | null;
  ltvD365: number | null;
  newBuyers: number | null;
  truncatedLifetimeBuyers: number;
  bookSpanDays: number | null;
};

export type DeskMetricSnapshot = {
  asOf: Date;
  depth: ShopifyDepthStats | null;
  hero: StoredDeskHero | null;
};

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function weightedCohortRevenue(
  rows: Array<{ customers: number; revenue: number }>,
): number | null {
  let customers = 0;
  let revenue = 0;
  for (const row of rows) {
    if (row.customers <= 0) continue;
    customers += row.customers;
    revenue += row.revenue;
  }
  if (customers <= 0) return null;
  return revenue / customers;
}

function identifiedNewSales(
  windowOrders: OverviewOrderBookRow[],
  firstByCustomer: Map<string, number>,
): number {
  let total = 0;
  for (const row of windowOrders) {
    const key = row.customerKey.trim().toLowerCase();
    if (!key || key === OVERVIEW_ORDER_GUEST_KEY) continue;
    const first = firstByCustomer.get(row.customerKey);
    if (first == null || row.orderedAt.getTime() !== first) continue;
    total += Number.isFinite(row.amount) ? row.amount : 0;
  }
  return total;
}

function asHero(value: unknown): StoredDeskHero | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const zone = row.zone;
  if (
    zone !== "up" &&
    zone !== "down" &&
    zone !== "even" &&
    zone !== "empty"
  ) {
    return null;
  }
  if (typeof row.orderCount !== "number" || typeof row.empty !== "boolean") {
    return null;
  }
  return {
    sales: finiteOrNull(row.sales),
    priorSales: finiteOrNull(row.priorSales),
    yoyPct: finiteOrNull(row.yoyPct),
    zone,
    returningSales: finiteOrNull(row.returningSales),
    newSales: finiteOrNull(row.newSales),
    typicalOrder: finiteOrNull(row.typicalOrder),
    weekendShare: finiteOrNull(row.weekendShare),
    orderCount: row.orderCount,
    empty: row.empty,
    daysToSecond: finiteOrNull(row.daysToSecond),
    ltvD30: finiteOrNull(row.ltvD30),
    ltvD90: finiteOrNull(row.ltvD90),
    ltvD365: finiteOrNull(row.ltvD365),
    newBuyers: finiteOrNull(row.newBuyers),
    truncatedLifetimeBuyers:
      typeof row.truncatedLifetimeBuyers === "number"
        ? row.truncatedLifetimeBuyers
        : 0,
    bookSpanDays: finiteOrNull(row.bookSpanDays),
  };
}

function asDepth(value: unknown): ShopifyDepthStats | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { orderCount?: unknown; medianAov?: unknown };
  if (typeof row.orderCount !== "number") return null;
  if (row.medianAov != null && typeof row.medianAov !== "number") return null;
  return value as ShopifyDepthStats;
}

export async function readDeskMetricSnapshot(
  shopId: string,
): Promise<DeskMetricSnapshot | null> {
  const row = await prisma.syncRun.findFirst({
    where: { shopId, phase: DESK_METRICS_PHASE, status: "ready" },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true, metrics: true },
  });
  if (!row?.metrics || typeof row.metrics !== "object" || Array.isArray(row.metrics)) {
    return null;
  }
  const metrics = row.metrics as { depth?: unknown; hero?: unknown };
  const hero = asHero(metrics.hero);
  const depth = asDepth(metrics.depth);
  if (!hero && !depth) return null;
  return {
    asOf: row.finishedAt ?? new Date(0),
    depth,
    hero,
  };
}

/**
 * Month vs last year, median, returning vs new, LTV 30/90/365, days to second.
 * Reads stored OrderFact and CohortFact. Does not call Shopify.
 */
export async function recomputeDeskMetricSnapshot(
  shopId: string,
  now: Date = new Date(),
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ianaTimezone: true },
  });
  const timeZone = shop?.ianaTimezone?.trim() || "UTC";
  const range = resolvePeriod("mtd", now, timeZone);
  const prior = shiftRangeOneYear(range.start, range.end);
  const rows = await loadOrderDepthRows(
    shopId,
    { end: now },
    ORDER_FACT_SOURCE,
  );
  const book: OverviewOrderBookRow[] = rows.map((row) => ({
    amount: row.amount,
    orderedAt: row.orderedAt,
    customerKey: row.customerKey,
    shopLocalDate: row.shopLocalDate,
  }));
  const windowOrders = filterOrdersInRange(book, range.start, range.end);
  const priorOrders = filterOrdersInRange(book, prior.start, prior.end);
  const firstByCustomer = orderBookFirstOrderMs(book);
  const orderSum = windowOrders.reduce(
    (sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0),
    0,
  );
  const depth = shopifyDepthStats({
    orders: rows.filter((row) => {
      const t = row.orderedAt.getTime();
      return t >= range.start.getTime() && t <= range.end.getTime();
    }),
    totalSales: orderSum,
    netSales: orderSum,
    netSalesKnown: false,
    grossSales: 0,
    grossSalesKnown: false,
    timeZone,
    windowEnd: range.end,
  });
  const base = buildOverviewOrderBookHero({
    windowOrders,
    priorOrders,
    firstByCustomer,
    typicalOrder: depth.medianAov,
  });
  const returning = orderBookReturningSales(windowOrders, firstByCustomer);
  const fresh = identifiedNewSales(windowOrders, firstByCustomer);
  const cohorts = await getCohortFacts(shopId, { limit: 24 });
  const ltvD30 = weightedCohortRevenue(
    cohorts.map((row) => ({ customers: row.customers, revenue: row.revenueD30 })),
  );
  const ltvD90 = weightedCohortRevenue(
    cohorts.map((row) => ({ customers: row.customers, revenue: row.revenueD90 })),
  );
  const ltvD365 = weightedCohortRevenue(
    cohorts.map((row) => ({ customers: row.customers, revenue: row.revenueD365 })),
  );
  const rollup = computeCohortRollups(rows);
  const hero: StoredDeskHero = {
    ...base,
    returningSales: returning > 0 ? returning : base.returningSales,
    newSales: fresh > 0 ? fresh : null,
    daysToSecond: depth.medianDaysToSecond,
    ltvD30,
    ltvD90,
    ltvD365,
    newBuyers: countNewBuyersFromOrders(rows, range),
    truncatedLifetimeBuyers: rollup.truncatedBuyers,
    bookSpanDays: orderBookSpanDays(
      rows.map((row) => row.orderedAt),
      now,
    ),
  };

  await prisma.syncRun.create({
    data: {
      runId: `desk-metrics-${shopId}-${now.toISOString()}`,
      shopId,
      phase: DESK_METRICS_PHASE,
      status: "ready",
      finishedAt: now,
      metrics: { depth, hero } as Prisma.InputJsonValue,
    },
  });
}
