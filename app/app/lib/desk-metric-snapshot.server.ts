/**
 * Off-request desk metrics. Overview paint reads the latest row.
 * Written after OrderFact backfill and by the nightly job on this app.
 * Not a second Fly machine.
 *
 * The five period chips are stored here. A click reads one window.
 * Sales come from day rows. Customer and LTV figures are aggregates.
 */

import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import {
  DESK_PERIOD_CHIPS,
  isDeskPeriodChip,
  type DeskPeriodChip,
} from "./book-window";
import {
  composeStoredBoards,
  loadNewestCappedOrderRows,
  type StoredBoards,
  type StoredOrderRow,
} from "./desk-stored-boards.server";
import {
  overviewYoyPct,
  overviewYoyZoneFromPct,
  shiftRangeOneYear,
  type OverviewOrderBookHero,
} from "./overview-order-book";
import { countNewBuyersInRange, getCohortFacts } from "./order-facts.server";
import {
  queryBookLifetimeMeta,
  queryOrderWindowStats,
} from "./order-fact-sql.server";
import { resolvePeriod, type DateRange, type PeriodPreset } from "./periods";
import { getSalesFactsByDay, getSalesFactsTotals } from "./sales-facts.server";
import { shopifyDepthStats, type ShopifyDepthStats } from "./shopify-depth-stats";

export const DESK_METRICS_PHASE = "desk_metrics";
export const RECOMPUTE_DESK_METRICS_JOB = "recompute_desk_metrics";

const DAY_MS = 86_400_000;

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
  boards: StoredBoards | null;
};

type StoredChip = {
  hero: StoredDeskHero | null;
  depth: ShopifyDepthStats | null;
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

function asChip(value: unknown): StoredChip | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { hero?: unknown; depth?: unknown };
  const hero = asHero(row.hero);
  const depth = asDepth(row.depth);
  if (!hero && !depth) return null;
  return { hero, depth };
}

function asWindows(
  value: unknown,
): Partial<Record<DeskPeriodChip, StoredChip>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  const out: Partial<Record<DeskPeriodChip, StoredChip>> = {};
  for (const chip of DESK_PERIOD_CHIPS) {
    const parsed = asChip(row[chip]);
    if (parsed) out[chip] = parsed;
  }
  return out;
}

function asBoards(value: unknown): StoredBoards | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as {
    analytics?: unknown;
    comeback?: unknown;
    depth?: unknown;
  };
  if (!row.analytics || typeof row.analytics !== "object") return null;
  if (!row.comeback || typeof row.comeback !== "object") return null;
  if (!row.depth || typeof row.depth !== "object") return null;
  const analytics = row.analytics as { available?: unknown; rfm?: unknown };
  if (typeof analytics.available !== "boolean" || !analytics.rfm) return null;
  return value as StoredBoards;
}

function weekendShareFromDaySales(days: Map<string, number>): number | null {
  let total = 0;
  let weekend = 0;
  let daysWith = 0;
  for (const [key, sales] of days) {
    if (!(sales > 0)) continue;
    daysWith += 1;
    total += sales;
    const [year, month, day] = key.split("-").map(Number);
    if (!year || !month || !day) continue;
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (dow === 0 || dow === 6) weekend += sales;
  }
  if (daysWith < 5 || !(total > 0)) return null;
  return weekend / total;
}

function rowsInRange(rows: StoredOrderRow[], range: DateRange): StoredOrderRow[] {
  const start = range.start.getTime();
  const end = range.end.getTime();
  return rows.filter((row) => {
    const t = row.orderedAt.getTime();
    return t >= start && t <= end;
  });
}

/**
 * Latest stored window. Pass a chip to read that period.
 * A missing chip does not fall back to another month.
 * `mtd` with no chip map still reads the legacy hero written before windows.
 */
export async function readDeskMetricSnapshot(
  shopId: string,
  preset?: PeriodPreset | null,
): Promise<DeskMetricSnapshot | null> {
  const row = await prisma.syncRun.findFirst({
    where: { shopId, phase: DESK_METRICS_PHASE, status: "ready" },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true, metrics: true },
  });
  if (!row?.metrics || typeof row.metrics !== "object" || Array.isArray(row.metrics)) {
    return null;
  }
  const metrics = row.metrics as {
    depth?: unknown;
    hero?: unknown;
    windows?: unknown;
    boards?: unknown;
  };
  const boards = asBoards(metrics.boards);
  const windows = asWindows(metrics.windows);
  const chipPreset = preset && isDeskPeriodChip(preset) ? preset : null;
  let hero: StoredDeskHero | null;
  let depth: ShopifyDepthStats | null;
  if (chipPreset) {
    const chip = windows[chipPreset];
    if (chip) {
      hero = chip.hero;
      depth = chip.depth;
    } else if (chipPreset === "mtd") {
      hero = asHero(metrics.hero);
      depth = asDepth(metrics.depth);
    } else {
      hero = null;
      depth = null;
    }
  } else {
    hero = asHero(metrics.hero);
    depth = asDepth(metrics.depth);
  }
  if (!hero && !depth && !boards) return null;
  return {
    asOf: row.finishedAt ?? new Date(0),
    depth,
    hero,
    boards,
  };
}

/**
 * Five chips: this month, last month, this quarter, this year, last 12 months.
 * Sales from day rows. New buyers, returning dollars, and typical order are
 * Postgres aggregates. Cohort LTV is the stored CohortFact rows.
 * Does not call Shopify. Does not load the order book into an array.
 * Customer boards, when built, use the newest 20,000 orders only.
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
  const meta = await queryBookLifetimeMeta(shopId);
  const bookSpanDays =
    meta.oldest == null
      ? null
      : Math.floor((now.getTime() - meta.oldest.getTime()) / DAY_MS);

  let cappedRows: StoredOrderRow[] = [];
  try {
    cappedRows = await loadNewestCappedOrderRows(shopId, now);
  } catch (error) {
    console.error(
      `[desk-metrics] capped board read failed shopId=${shopId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const windows: Partial<Record<DeskPeriodChip, StoredChip>> = {};
  for (const preset of DESK_PERIOD_CHIPS) {
    const range = resolvePeriod(preset, now, timeZone);
    const prior = shiftRangeOneYear(range.start, range.end);
    const priorRange: DateRange = {
      start: prior.start,
      end: prior.end,
      label: "Prior",
    };
    const [totals, priorTotals, newBuyers, stats, byDay] = await Promise.all([
      getSalesFactsTotals(shopId, range, now),
      getSalesFactsTotals(shopId, priorRange, now),
      countNewBuyersInRange(shopId, range),
      queryOrderWindowStats(shopId, range.start, range.end),
      getSalesFactsByDay(shopId, range, { now }),
    ]);
    const slice = rowsInRange(cappedRows, range);
    const sliceSum = slice.reduce(
      (sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0),
      0,
    );
    const depth = shopifyDepthStats({
      orders: slice,
      totalSales: totals.dayCount > 0 ? totals.totalSales : sliceSum,
      netSales: totals.dayCount > 0 ? totals.netSalesSum : sliceSum,
      netSalesKnown: totals.netSalesComplete,
      grossSales: totals.grossSalesSum,
      grossSalesKnown: totals.grossSalesComplete,
      timeZone,
      windowEnd: range.end,
    });
    if (stats.medianAmount != null && stats.medianAmount > 0) {
      depth.medianAov = stats.medianAmount;
    }
    if (stats.orderCount > depth.orderCount) {
      depth.orderCount = stats.orderCount;
    }
    const sales = totals.dayCount > 0 ? totals.totalSales : null;
    const priorSales = priorTotals.dayCount > 0 ? priorTotals.totalSales : null;
    const yoyPct = sales == null ? null : overviewYoyPct(sales, priorSales);
    const hero: StoredDeskHero = {
      sales,
      priorSales,
      yoyPct,
      zone: sales == null ? "empty" : overviewYoyZoneFromPct(yoyPct),
      returningSales: stats.returningSales > 0 ? stats.returningSales : null,
      newSales: totals.customerMetricsAvailable
        ? totals.newCustomerNetSalesSum
        : null,
      typicalOrder:
        stats.medianAmount != null && stats.medianAmount > 0
          ? stats.medianAmount
          : null,
      weekendShare: weekendShareFromDaySales(byDay),
      orderCount: totals.orderCount,
      empty: totals.dayCount === 0,
      daysToSecond: depth.medianDaysToSecond,
      ltvD30,
      ltvD90,
      ltvD365,
      newBuyers,
      truncatedLifetimeBuyers: meta.truncatedBuyers,
      bookSpanDays,
    };
    windows[preset] = { hero, depth };
  }

  const mtdRange = resolvePeriod("mtd", now, timeZone);
  let boards: StoredBoards | null = null;
  try {
    boards = await composeStoredBoards(
      shopId,
      now,
      timeZone,
      mtdRange.start,
      mtdRange.end,
      cappedRows,
    );
  } catch (error) {
    console.error(
      `[desk-metrics] customer boards failed shopId=${shopId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const mtd = windows.mtd;
  const boardsJson = boards
    ? (JSON.parse(JSON.stringify(boards)) as Prisma.InputJsonValue)
    : null;
  await prisma.syncRun.create({
    data: {
      runId: `desk-metrics-${shopId}-${now.toISOString()}`,
      shopId,
      phase: DESK_METRICS_PHASE,
      status: "ready",
      finishedAt: now,
      metrics: {
        depth: mtd?.depth ?? null,
        hero: mtd?.hero ?? null,
        windows,
        boards: boardsJson,
      } as Prisma.InputJsonValue,
    },
  });
}
