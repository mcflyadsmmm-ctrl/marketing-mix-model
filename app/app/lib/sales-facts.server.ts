import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  fetchShopifySales,
  shopLocalDayRange,
  listRecentClosedShopLocalDays,
  type SalesResult,
} from "./shopify-sales.server";
import { ensureShopMetadata } from "./shop-metadata.server";
import { countClosedDaysInPeriod } from "./mer-trust";
import type { DateRange } from "./periods";

/** SalesDayFact.source for rows written by this ingest lane. */
export const SALES_DAY_FACT_SOURCE = "shopify_order_current_total_v1";

/** Backfill/resume window — last N closed shop-local days, per the ingest spec. */
export const SALES_DAY_FACT_WINDOW_DAYS = 60;

/**
 * Max days ingested per `runSalesFactsBackfill` call. Keeps a single invocation
 * (auth callback, cron tick) fast — the next call resumes via missing dates.
 */
export const SALES_DAY_FACT_MAX_DAYS_PER_RUN = 10;

export interface SalesFactBackfillResult {
  shopId: string;
  ranAt: string;
  /** Days this call attempted to fetch + upsert. */
  attempted: number;
  /** Days successfully written this call. */
  written: number;
  /** Days whose Shopify fetch failed this call — left missing for the next run to retry. */
  failed: string[];
  /** Set when ianaTimezone was (and remains) unknown; ingest was skipped entirely. */
  skippedReason: "no_timezone" | null;
  /** Missing days within the window not yet attempted this call (still to resume). */
  remainingMissingDays: number;
}

function utcDayKeyFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayKeyToUtcDate(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Which of `dayKeys` already have a SalesDayFact row for this shop. */
async function existingFactDayKeys(
  shopId: string,
  dayKeys: string[],
): Promise<Set<string>> {
  if (dayKeys.length === 0) return new Set();
  const sorted = [...dayKeys].sort();
  const rangeStart = dayKeyToUtcDate(sorted[0]);
  const rangeEnd = dayKeyToUtcDate(sorted[sorted.length - 1]);

  const rows = await prisma.salesDayFact.findMany({
    where: {
      shopId,
      day: { gte: rangeStart, lte: rangeEnd },
    },
    select: { day: true },
  });
  return new Set(rows.map((r) => utcDayKeyFromDate(r.day)));
}

async function upsertSalesDayFact(
  shopId: string,
  dayKey: string,
  sales: SalesResult,
  currencyCode: string | null,
  asOf: Date,
): Promise<void> {
  const day = dayKeyToUtcDate(dayKey);
  const data = {
    sales: sales.totalSales,
    orderCount: sales.orderCount,
    newCustomers: sales.newCustomers,
    returningCustomers: sales.returningCustomers,
    guestOrders: sales.guestOrders,
    customerMetricsAvailable: sales.customerMetricsAvailable,
    currency: currencyCode,
    asOf,
    source: SALES_DAY_FACT_SOURCE,
  };

  // Upsert only after the full per-day pagination above has succeeded — a zero-sales
  // day is a legitimate fact (written as sales: 0), a failed fetch is not (left missing).
  await prisma.salesDayFact.upsert({
    where: { shopId_day: { shopId, day } },
    create: { shopId, day, ...data },
    update: data,
  });
}

/**
 * Backfill/resume up to `SALES_DAY_FACT_MAX_DAYS_PER_RUN` missing closed shop-local
 * days within the trailing `SALES_DAY_FACT_WINDOW_DAYS` window. Idempotent and safe
 * to call repeatedly (auth callback, cron, manual) — each call re-derives the missing
 * dates from what's already in SalesDayFact, so it always resumes rather than restarts.
 *
 * Skips entirely (no rows touched) when the shop's ianaTimezone is unknown and a
 * metadata sync attempt does not resolve one — server-local time is never substituted.
 */
export async function runSalesFactsBackfill(
  admin: AdminApiContext,
  shopId: string,
  options?: { now?: Date; maxDays?: number },
): Promise<SalesFactBackfillResult> {
  const now = options?.now ?? new Date();
  const maxDays = options?.maxDays ?? SALES_DAY_FACT_MAX_DAYS_PER_RUN;
  const ranAt = now.toISOString();

  const metadata = await ensureShopMetadata(admin, shopId);
  if (!metadata.ianaTimezone) {
    return {
      shopId,
      ranAt,
      attempted: 0,
      written: 0,
      failed: [],
      skippedReason: "no_timezone",
      remainingMissingDays: 0,
    };
  }

  const timeZone = metadata.ianaTimezone;
  const windowDayKeys = listRecentClosedShopLocalDays(
    timeZone,
    SALES_DAY_FACT_WINDOW_DAYS,
    now,
  );
  const existing = await existingFactDayKeys(shopId, windowDayKeys);
  const missing = windowDayKeys.filter((key) => !existing.has(key));
  const batch = missing.slice(0, maxDays);

  let written = 0;
  const failed: string[] = [];
  for (const dayKey of batch) {
    try {
      const range = shopLocalDayRange(dayKey, timeZone);
      const sales = await fetchShopifySales(admin, range);
      await upsertSalesDayFact(shopId, dayKey, sales, metadata.currencyCode, now);
      written += 1;
    } catch {
      // Leave this day missing — the next call's missing-dates scan retries it.
      failed.push(dayKey);
    }
  }

  return {
    shopId,
    ranAt,
    attempted: batch.length,
    written,
    failed,
    skippedReason: null,
    remainingMissingDays: Math.max(0, missing.length - batch.length),
  };
}

export interface SalesFactsCoverage {
  expectedClosedDays: number;
  factDays: number;
  /**
   * True only when the requested period lies entirely inside the trailing ingest
   * window AND every expected closed day has a fact row. Long periods (L12M/YTD/3yr)
   * that start before the window are never complete — desk must use live GraphQL.
   */
  complete: boolean;
  /** True when range.start is before the trailing fact window. */
  periodExceedsFactWindow: boolean;
}

/**
 * Facts vs. live coverage for `range`. Periods reaching outside the 60-day ingest
 * window are incomplete for KPI use (no silent underclaim under a full-period label).
 */
export async function getSalesFactsCoverage(
  shopId: string,
  range: DateRange,
  now: Date = new Date(),
): Promise<SalesFactsCoverage> {
  const windowStart = new Date(
    now.getTime() - SALES_DAY_FACT_WINDOW_DAYS * 86_400_000,
  );
  const periodExceedsFactWindow = range.start < windowStart;

  if (periodExceedsFactWindow) {
    const factDays = await prisma.salesDayFact.count({
      where: { shopId, day: { gte: windowStart, lte: range.end } },
    });
    return {
      expectedClosedDays: countClosedDaysInPeriod(windowStart, range.end, now),
      factDays,
      complete: false,
      periodExceedsFactWindow: true,
    };
  }

  const expectedClosedDays = countClosedDaysInPeriod(range.start, range.end, now);

  if (expectedClosedDays <= 0) {
    return {
      expectedClosedDays: 0,
      factDays: 0,
      complete: false,
      periodExceedsFactWindow: false,
    };
  }

  const factDays = await prisma.salesDayFact.count({
    where: { shopId, day: { gte: range.start, lte: range.end } },
  });

  return {
    expectedClosedDays,
    factDays,
    complete: factDays >= expectedClosedDays,
    periodExceedsFactWindow: false,
  };
}

export interface SalesFactsTotals {
  totalSales: number;
  orderCount: number;
  /**
   * Sum of per-day new/returning counts across `range` — NOT a unique cross-day count
   * (the same customer ordering on two different days counts twice). Callers must not
   * present this as live customer metrics; pair with `customerMetricsAvailable: false`.
   */
  newCustomersSum: number;
  returningCustomersSum: number;
  guestOrdersSum: number;
  dayCount: number;
}

/** Sum SalesDayFact rows overlapping `range` (clamped to the trailing ingest window). */
export async function getSalesFactsTotals(
  shopId: string,
  range: DateRange,
  now: Date = new Date(),
): Promise<SalesFactsTotals> {
  const windowStart = new Date(
    now.getTime() - SALES_DAY_FACT_WINDOW_DAYS * 86_400_000,
  );
  const clampedStart = range.start < windowStart ? windowStart : range.start;

  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: clampedStart, lte: range.end } },
    select: {
      sales: true,
      orderCount: true,
      newCustomers: true,
      returningCustomers: true,
      guestOrders: true,
    },
  });

  let totalSales = 0;
  let orderCount = 0;
  let newCustomersSum = 0;
  let returningCustomersSum = 0;
  let guestOrdersSum = 0;
  for (const row of rows) {
    totalSales += row.sales;
    orderCount += row.orderCount;
    newCustomersSum += row.newCustomers;
    returningCustomersSum += row.returningCustomers;
    guestOrdersSum += row.guestOrders;
  }

  return {
    totalSales,
    orderCount,
    newCustomersSum,
    returningCustomersSum,
    guestOrdersSum,
    dayCount: rows.length,
  };
}

/**
 * SalesDayFact sales keyed by the same "YYYY-MM-DD" string shape the desk's other
 * daily-sales maps use (see `sample-desk.server.ts`'s `utcDayKey` for the matching
 * SampleSalesDay convention) — safe to merge straight into `buildDailySpine` /
 * `buildDailyRowsForWindow`'s `salesByDay` without a timezone-shift bug, since both
 * read the stored UTC-midnight day back through UTC getters rather than local ones.
 */
export async function getSalesFactsByDay(
  shopId: string,
  range: { start: Date; end: Date },
): Promise<Map<string, number>> {
  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: range.start, lte: range.end } },
    select: { day: true, sales: true },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    const key = utcDayKeyFromDate(row.day);
    map.set(key, (map.get(key) ?? 0) + row.sales);
  }
  return map;
}
