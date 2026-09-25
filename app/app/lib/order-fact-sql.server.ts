/**
 * OrderFact aggregates in Postgres.
 * A 5M book stays in the database. These queries return a handful of rows.
 * Every value is a bound parameter — no string-built SQL.
 */

import prisma from "../db.server";

/** Keep aligned with order-facts.server.ts — duplicated to avoid a module cycle. */
const ORDER_FACT_SOURCE = "shopify_order_v1";
const ORDER_FACT_GUEST_KEY = "guest";
const SEAL_LIKE = "__day_complete__:%";
const DAY_SECONDS = 86_400;

export type CohortSqlRollup = {
  cohortMonth: string;
  customers: number;
  revenueD30: number;
  revenueD90: number;
  revenueD365: number;
  ordersD30: number;
  ordersD90: number;
  ordersD365: number;
};

export type NewBuyerSqlCounts = {
  identified: number;
  unknownInRange: number;
  newBuyers: number;
};

export type OrderWindowSqlStats = {
  orderCount: number;
  medianAmount: number | null;
  returningSales: number;
};

type CohortRaw = {
  cohort_month: string;
  customers: unknown;
  revenue_d30: unknown;
  revenue_d90: unknown;
  revenue_d365: unknown;
  orders_d30: unknown;
  orders_d90: unknown;
  orders_d365: unknown;
};

function sqlInt(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function sqlFloat(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Same rules as `computeCohortRollups`: guests out, unknown lifetime out,
 * Shopify lifetime longer than stored orders out. One row per cohort month.
 */
export async function queryCohortRollups(
  shopId: string,
): Promise<CohortSqlRollup[]> {
  const rows = await prisma.$queryRaw<CohortRaw[]>`
    WITH base AS (
      SELECT
        "customerKey",
        "orderedAt",
        amount,
        "lifetimeOrders"
      FROM "OrderFact"
      WHERE "shopId" = ${shopId}
        AND source = ${ORDER_FACT_SOURCE}
        AND "customerKey" <> ${ORDER_FACT_GUEST_KEY}
        AND "shopifyOrderId" NOT LIKE ${SEAL_LIKE}
    ),
    cust AS (
      SELECT
        "customerKey",
        MIN("orderedAt") AS first_at,
        COUNT(*)::int AS n_orders,
        MAX("lifetimeOrders") AS lifetime
      FROM base
      GROUP BY "customerKey"
    ),
    eligible AS (
      SELECT "customerKey", first_at
      FROM cust
      WHERE lifetime IS NOT NULL
        AND lifetime <= n_orders
    )
    SELECT
      to_char(e.first_at AT TIME ZONE 'UTC', 'YYYY-MM') AS cohort_month,
      COUNT(DISTINCT e."customerKey")::int AS customers,
      COALESCE(SUM(CASE
        WHEN EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) >= 0
         AND EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) <= ${30 * DAY_SECONDS}
        THEN o.amount ELSE 0 END), 0)::float8 AS revenue_d30,
      COALESCE(SUM(CASE
        WHEN EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) >= 0
         AND EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) <= ${90 * DAY_SECONDS}
        THEN o.amount ELSE 0 END), 0)::float8 AS revenue_d90,
      COALESCE(SUM(CASE
        WHEN EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) >= 0
         AND EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) <= ${365 * DAY_SECONDS}
        THEN o.amount ELSE 0 END), 0)::float8 AS revenue_d365,
      COALESCE(SUM(CASE
        WHEN EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) >= 0
         AND EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) <= ${30 * DAY_SECONDS}
        THEN 1 ELSE 0 END), 0)::int AS orders_d30,
      COALESCE(SUM(CASE
        WHEN EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) >= 0
         AND EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) <= ${90 * DAY_SECONDS}
        THEN 1 ELSE 0 END), 0)::int AS orders_d90,
      COALESCE(SUM(CASE
        WHEN EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) >= 0
         AND EXTRACT(EPOCH FROM (o."orderedAt" - e.first_at)) <= ${365 * DAY_SECONDS}
        THEN 1 ELSE 0 END), 0)::int AS orders_d365
    FROM eligible e
    JOIN base o ON o."customerKey" = e."customerKey"
    GROUP BY 1
    ORDER BY 1
  `;

  return rows.map((row) => ({
    cohortMonth: row.cohort_month,
    customers: sqlInt(row.customers),
    revenueD30: sqlFloat(row.revenue_d30) ?? 0,
    revenueD90: sqlFloat(row.revenue_d90) ?? 0,
    revenueD365: sqlFloat(row.revenue_d365) ?? 0,
    ordersD30: sqlInt(row.orders_d30),
    ordersD90: sqlInt(row.orders_d90),
    ordersD365: sqlInt(row.orders_d365),
  }));
}

/**
 * Unique buyers whose first stored order falls in range.
 * Null lifetime on an in-range first order → unknown (caller returns null).
 * No identified buyers on file → identified 0 (caller returns null).
 */
export async function queryNewBuyerCounts(
  shopId: string,
  start: Date,
  end: Date,
): Promise<NewBuyerSqlCounts> {
  const rows = await prisma.$queryRaw<
    Array<{
      identified: unknown;
      unknown_in_range: unknown;
      new_buyers: unknown;
    }>
  >`
    WITH base AS (
      SELECT "customerKey", "orderedAt", "lifetimeOrders"
      FROM "OrderFact"
      WHERE "shopId" = ${shopId}
        AND source = ${ORDER_FACT_SOURCE}
        AND "customerKey" <> ${ORDER_FACT_GUEST_KEY}
        AND "shopifyOrderId" NOT LIKE ${SEAL_LIKE}
    ),
    cust AS (
      SELECT
        "customerKey",
        MIN("orderedAt") AS first_at,
        COUNT(*)::int AS n_orders,
        MAX("lifetimeOrders") AS lifetime
      FROM base
      GROUP BY "customerKey"
    )
    SELECT
      COUNT(*)::int AS identified,
      COUNT(*) FILTER (
        WHERE first_at >= ${start}
          AND first_at <= ${end}
          AND lifetime IS NULL
      )::int AS unknown_in_range,
      COUNT(*) FILTER (
        WHERE first_at >= ${start}
          AND first_at <= ${end}
          AND lifetime IS NOT NULL
          AND lifetime <= n_orders
      )::int AS new_buyers
    FROM cust
  `;
  const row = rows[0];
  return {
    identified: sqlInt(row?.identified),
    unknownInRange: sqlInt(row?.unknown_in_range),
    newBuyers: sqlInt(row?.new_buyers),
  };
}

/** Median order and returning dollars for one window. Aggregate only. */
export async function queryOrderWindowStats(
  shopId: string,
  start: Date,
  end: Date,
): Promise<OrderWindowSqlStats> {
  const rows = await prisma.$queryRaw<
    Array<{
      order_count: unknown;
      median_amount: unknown;
      returning_sales: unknown;
    }>
  >`
    WITH firsts AS (
      SELECT "customerKey", MIN("orderedAt") AS first_at
      FROM "OrderFact"
      WHERE "shopId" = ${shopId}
        AND source = ${ORDER_FACT_SOURCE}
        AND "customerKey" <> ${ORDER_FACT_GUEST_KEY}
        AND "shopifyOrderId" NOT LIKE ${SEAL_LIKE}
      GROUP BY "customerKey"
    ),
    window_orders AS (
      SELECT amount, "customerKey", "orderedAt"
      FROM "OrderFact"
      WHERE "shopId" = ${shopId}
        AND source = ${ORDER_FACT_SOURCE}
        AND "orderedAt" >= ${start}
        AND "orderedAt" <= ${end}
        AND "shopifyOrderId" NOT LIKE ${SEAL_LIKE}
    )
    SELECT
      COUNT(*)::int AS order_count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY amount)::float8 AS median_amount,
      COALESCE((
        SELECT SUM(w.amount)::float8
        FROM window_orders w
        JOIN firsts f ON f."customerKey" = w."customerKey"
        WHERE w."orderedAt" > f.first_at
      ), 0)::float8 AS returning_sales
    FROM window_orders
  `;
  const row = rows[0];
  return {
    orderCount: sqlInt(row?.order_count),
    medianAmount: sqlFloat(row?.median_amount),
    returningSales: sqlFloat(row?.returning_sales) ?? 0,
  };
}

/** Truncated-lifetime buyers and oldest identified order. Not an order array. */
export async function queryBookLifetimeMeta(shopId: string): Promise<{
  truncatedBuyers: number;
  oldest: Date | null;
}> {
  const rows = await prisma.$queryRaw<
    Array<{ truncated: unknown; oldest: Date | null }>
  >`
    WITH base AS (
      SELECT "customerKey", "orderedAt", "lifetimeOrders"
      FROM "OrderFact"
      WHERE "shopId" = ${shopId}
        AND source = ${ORDER_FACT_SOURCE}
        AND "customerKey" <> ${ORDER_FACT_GUEST_KEY}
        AND "shopifyOrderId" NOT LIKE ${SEAL_LIKE}
    ),
    cust AS (
      SELECT
        COUNT(*)::int AS n_orders,
        MAX("lifetimeOrders") AS lifetime,
        MIN("orderedAt") AS first_at
      FROM base
      GROUP BY "customerKey"
    )
    SELECT
      COUNT(*) FILTER (
        WHERE lifetime IS NOT NULL AND lifetime > n_orders
      )::int AS truncated,
      MIN(first_at) AS oldest
    FROM cust
  `;
  const row = rows[0];
  const oldest = row?.oldest instanceof Date ? row.oldest : null;
  return {
    truncatedBuyers: sqlInt(row?.truncated),
    oldest,
  };
}
