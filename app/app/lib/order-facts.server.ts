import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { ensureShopMetadata } from "./shop-metadata.server";
import {
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  shopLocalDayRange,
} from "./shop-local-day";
import { formatPeriodQuery, SHOPIFY_READ_ORDERS_WINDOW_DAYS } from "./periods";
import { salesDayFactWindowDayCount } from "./sales-facts.server";
import { adminGraphqlJson, type GraphqlCost } from "./shopify-graphql-cost.server";
import { orderNetAmount } from "./shopify-sales.server";

/** OrderFact.source for live Shopify ingest — never write sample from this lane. */
export const ORDER_FACT_SOURCE = "shopify_order_v1";

export const ORDER_FACT_GUEST_KEY = "guest";

/**
 * Sentinel `shopifyOrderId` prefix: day is fully crawled and skipped by backfill.
 * Cleared on order webhooks (refunds/cancels) so the next LTV kick re-crawls.
 */
export const ORDER_FACT_DAY_COMPLETE_PREFIX = "__day_complete__:";

/** Max closed shop-local days ingested per `runOrderFactsBackfill` kick. */
export const ORDER_FACT_MAX_DAYS_PER_RUN = 7;

/** Soft page cap per kick (in addition to day-window chunk). */
export const ORDER_FACT_MAX_PAGES_PER_RUN = 25;

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Marker id written when a shop-local day crawl finishes (not page-capped). */
export function orderFactDayCompleteMarkerId(dayKey: string): string {
  return `${ORDER_FACT_DAY_COMPLETE_PREFIX}${dayKey}`;
}

/**
 * Delete the `__day_complete__` seal for one shop-local day so
 * `runOrderFactsBackfill` will re-crawl (refunds/edits update net amounts).
 *
 * Fail-closed: returns 0 and does not touch the DB when `dayKey` is not
 * YYYY-MM-DD. Callers must only invoke with a day derived from shop IANA —
 * never a guessed server-local day.
 */
export async function clearOrderFactDayCompleteSeal(
  shopId: string,
  dayKey: string,
): Promise<number> {
  if (!shopId || !DAY_KEY_RE.test(dayKey)) return 0;
  const result = await prisma.orderFact.deleteMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      shopifyOrderId: orderFactDayCompleteMarkerId(dayKey),
    },
  });
  return result.count;
}

/**
 * OrderFact v2 recrawl: if live rows still lack unitCount, drop `__day_complete__`
 * seals so `runOrderFactsBackfill` re-fetches discount/source/units.
 */
export async function unsealOrderFactsMissingV2(
  shopId: string,
): Promise<number> {
  if (!shopId) return 0;
  const stale = await prisma.orderFact.count({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      unitCount: null,
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
  });
  if (stale === 0) return 0;
  const result = await prisma.orderFact.deleteMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX },
    },
  });
  await prisma.orderBackfillState.updateMany({
    where: { shopId },
    data: { cursor: null },
  });
  return result.count;
}

/**
 * OrderFact.amount prefers currentTotalPriceSet (net after returns/refunds /
 * edits) so till LTV aligns with action Total ROAS. totalPriceSet is still
 * queried as a fallback when current totals are missing.
 */
const ORDERS_FOR_FACTS_QUERY = `#graphql
  query McflyOrdersForFacts($query: String!, $cursor: String) {
    orders(first: 100, after: $cursor, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          createdAt
          sourceName
          currentSubtotalLineItemsQuantity
          currentTotalDiscountsSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customer {
            id
          }
        }
      }
    }
  }
`;

type OrdersForFactsJson = {
  data?: {
    orders?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      edges?: Array<{
        node?: {
          id?: string;
          createdAt?: string;
          sourceName?: string | null;
          currentSubtotalLineItemsQuantity?: number | null;
          currentTotalDiscountsSet?: {
            shopMoney?: { amount?: string; currencyCode?: string };
          };
          totalPriceSet?: {
            shopMoney?: { amount?: string; currencyCode?: string };
          };
          currentTotalPriceSet?: {
            shopMoney?: { amount?: string; currencyCode?: string };
          };
          customer?: { id?: string } | null;
        };
      }>;
    };
  };
  errors?: Array<{ message?: string; extensions?: { code?: string } }>;
  extensions?: { cost?: GraphqlCost };
};

export interface OrderFactRow {
  shopifyOrderId: string;
  customerKey: string;
  orderedAt: Date;
  shopLocalDate: Date;
  amount: number;
  currency: string | null;
  discountAmount: number | null;
  sourceName: string | null;
  unitCount: number | null;
}

export interface CohortRollup {
  cohortMonth: string;
  customers: number;
  revenueD30: number;
  revenueD90: number;
  revenueD365: number;
  ordersD30: number;
  ordersD90: number;
  ordersD365: number;
}

export interface OrderFactBackfillResult {
  shopId: string;
  ranAt: string;
  attemptedDays: number;
  written: number;
  pages: number;
  historyLimited: boolean;
  skippedReason: "no_timezone" | null;
  lastError: string | null;
  touchedMonths: string[];
}

function dayKeyToUtcDate(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function cohortMonthFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function msDays(n: number): number {
  return n * 86_400_000;
}

function parseMoneyAmount(raw: string | undefined): number {
  if (raw == null || raw === "") return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseUnitCount(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw) || raw < 0) return null;
  return Math.trunc(raw);
}

function isHistoryWindowError(
  errors: Array<{ message?: string; extensions?: { code?: string } }> | undefined,
  message?: string | null,
): boolean {
  const blob = [
    ...(errors ?? []).map((e) => `${e.message ?? ""} ${e.extensions?.code ?? ""}`),
    message ?? "",
  ]
    .join(" ")
    .toUpperCase();
  return (
    /ACCESS_DENIED/.test(blob) ||
    /READ_ALL_ORDERS/.test(blob) ||
    /ORDER.*WINDOW/.test(blob) ||
    /OLDER THAN/.test(blob) ||
    /ACCESS DENIED/.test(blob)
  );
}

/**
 * Pure cohort math: first non-guest order defines cohort month; sum amounts/orders
 * within 30/90/365 days of that first order. Guests are ignored.
 */
export function computeCohortRollups(
  orders: Array<{
    customerKey: string;
    orderedAt: Date;
    amount: number;
  }>,
): CohortRollup[] {
  const byCustomer = new Map<
    string,
    Array<{ orderedAt: Date; amount: number }>
  >();

  for (const o of orders) {
    if (!o.customerKey || o.customerKey === ORDER_FACT_GUEST_KEY) continue;
    const list = byCustomer.get(o.customerKey) ?? [];
    list.push({ orderedAt: o.orderedAt, amount: o.amount });
    byCustomer.set(o.customerKey, list);
  }

  const byMonth = new Map<string, CohortRollup>();

  for (const list of byCustomer.values()) {
    list.sort((a, b) => a.orderedAt.getTime() - b.orderedAt.getTime());
    const first = list[0];
    if (!first) continue;
    const cohortMonth = cohortMonthFromDate(first.orderedAt);
    const firstMs = first.orderedAt.getTime();

    let revenueD30 = 0;
    let revenueD90 = 0;
    let revenueD365 = 0;
    let ordersD30 = 0;
    let ordersD90 = 0;
    let ordersD365 = 0;

    for (const o of list) {
      const delta = o.orderedAt.getTime() - firstMs;
      if (delta < 0) continue;
      const amount = Number.isFinite(o.amount) ? o.amount : 0;
      if (delta <= msDays(30)) {
        revenueD30 += amount;
        ordersD30 += 1;
      }
      if (delta <= msDays(90)) {
        revenueD90 += amount;
        ordersD90 += 1;
      }
      if (delta <= msDays(365)) {
        revenueD365 += amount;
        ordersD365 += 1;
      }
    }

    const row = byMonth.get(cohortMonth) ?? {
      cohortMonth,
      customers: 0,
      revenueD30: 0,
      revenueD90: 0,
      revenueD365: 0,
      ordersD30: 0,
      ordersD90: 0,
      ordersD365: 0,
    };
    row.customers += 1;
    row.revenueD30 += revenueD30;
    row.revenueD90 += revenueD90;
    row.revenueD365 += revenueD365;
    row.ordersD30 += ordersD30;
    row.ordersD90 += ordersD90;
    row.ordersD365 += ordersD365;
    byMonth.set(cohortMonth, row);
  }

  return [...byMonth.values()].sort((a, b) =>
    a.cohortMonth.localeCompare(b.cohortMonth),
  );
}

async function upsertOrderFact(
  shopId: string,
  row: OrderFactRow,
  asOf: Date,
  source: string,
): Promise<void> {
  if (source !== ORDER_FACT_SOURCE && source !== "sample") {
    throw new Error(`OrderFact source must be ${ORDER_FACT_SOURCE} or sample`);
  }
  const data = {
    customerKey: row.customerKey,
    orderedAt: row.orderedAt,
    shopLocalDate: row.shopLocalDate,
    amount: row.amount,
    currency: row.currency,
    discountAmount: row.discountAmount,
    sourceName: row.sourceName,
    unitCount: row.unitCount,
    asOf,
    source,
  };
  await prisma.orderFact.upsert({
    where: {
      shopId_shopifyOrderId: {
        shopId,
        shopifyOrderId: row.shopifyOrderId,
      },
    },
    create: { shopId, shopifyOrderId: row.shopifyOrderId, ...data },
    update: data,
  });
}

async function ensureBackfillState(shopId: string) {
  return prisma.orderBackfillState.upsert({
    where: { shopId },
    create: { shopId, status: "idle", historyLimited: false },
    update: {},
  });
}

/**
 * Recompute CohortFact rows for the given months (or all months present in OrderFact
 * when `months` is empty) from stored OrderFacts for this shop.
 */
export async function recomputeCohortFacts(
  shopId: string,
  months?: string[],
  asOf: Date = new Date(),
): Promise<string[]> {
  const orders = await prisma.orderFact.findMany({
    where: {
      shopId,
      customerKey: { not: ORDER_FACT_GUEST_KEY },
      // Exclude sample rows from live cohort recompute when both exist.
      source: ORDER_FACT_SOURCE,
    },
    select: {
      customerKey: true,
      orderedAt: true,
      amount: true,
    },
  });

  const rollups = computeCohortRollups(orders);
  const filter =
    months && months.length > 0 ? new Set(months) : null;
  const touched: string[] = [];

  for (const rollup of rollups) {
    if (filter && !filter.has(rollup.cohortMonth)) continue;
    touched.push(rollup.cohortMonth);
    await prisma.cohortFact.upsert({
      where: {
        shopId_cohortMonth_source: {
          shopId,
          cohortMonth: rollup.cohortMonth,
          source: ORDER_FACT_SOURCE,
        },
      },
      create: {
        shopId,
        cohortMonth: rollup.cohortMonth,
        customers: rollup.customers,
        revenueD30: rollup.revenueD30,
        revenueD90: rollup.revenueD90,
        revenueD365: rollup.revenueD365,
        ordersD30: rollup.ordersD30,
        ordersD90: rollup.ordersD90,
        ordersD365: rollup.ordersD365,
        asOf,
        source: ORDER_FACT_SOURCE,
      },
      update: {
        customers: rollup.customers,
        revenueD30: rollup.revenueD30,
        revenueD90: rollup.revenueD90,
        revenueD365: rollup.revenueD365,
        ordersD30: rollup.ordersD30,
        ordersD90: rollup.ordersD90,
        ordersD365: rollup.ordersD365,
        asOf,
      },
    });
  }

  return touched;
}

async function fetchOrdersForDay(
  admin: AdminApiContext,
  dayKey: string,
  timeZone: string,
  maxPages: number,
): Promise<{
  rows: OrderFactRow[];
  pages: number;
  historyLimited: boolean;
  error: string | null;
  /** False when page-capped mid-day — do not mark the day complete. */
  complete: boolean;
}> {
  const range = shopLocalDayRange(dayKey, timeZone);
  const query = formatPeriodQuery({
    start: range.start,
    end: range.end,
    label: dayKey,
  });
  const rows: OrderFactRow[] = [];
  let cursor: string | null = null;
  let pages = 0;
  let historyLimited = false;
  let error: string | null = null;
  let truncated = false;

  do {
    if (pages >= maxPages) {
      truncated = true;
      break;
    }
    pages += 1;
    const json: OrdersForFactsJson = await adminGraphqlJson<OrdersForFactsJson>(
      admin,
      ORDERS_FOR_FACTS_QUERY,
      { query, cursor },
    );

    if (json.errors?.length) {
      const msg = json.errors
        .map((e: { message?: string }) => e.message)
        .filter(Boolean)
        .join("; ");
      if (isHistoryWindowError(json.errors, msg)) {
        historyLimited = true;
        error = msg || "ACCESS_DENIED";
        break;
      }
      throw new Error(msg || "Shopify GraphQL error");
    }

    const orders: NonNullable<OrdersForFactsJson["data"]>["orders"] =
      json.data?.orders;
    if (!orders) {
      throw new Error("Failed to fetch orders for OrderFact ingest");
    }

    for (const edge of orders.edges ?? []) {
      const node = edge.node;
      if (!node?.id || !node.createdAt) continue;
      const orderedAt = new Date(node.createdAt);
      if (Number.isNaN(orderedAt.getTime())) continue;
      // Net (currentTotalPriceSet) for OrderFact.amount — same semantics as desk
      // orderNetAmount: empty/missing currentTotal → gross; currentTotal=0 stays 0.
      const amount = orderNetAmount(node);
      const localKey = shopLocalDayKey(orderedAt, timeZone) || dayKey;
      rows.push({
        shopifyOrderId: node.id,
        customerKey: node.customer?.id || ORDER_FACT_GUEST_KEY,
        orderedAt,
        shopLocalDate: dayKeyToUtcDate(localKey),
        amount,
        currency:
          node.currentTotalPriceSet?.shopMoney?.currencyCode ??
          node.totalPriceSet?.shopMoney?.currencyCode ??
          null,
        discountAmount: parseMoneyAmount(
          node.currentTotalDiscountsSet?.shopMoney?.amount,
        ),
        sourceName: node.sourceName?.trim() || null,
        unitCount: parseUnitCount(node.currentSubtotalLineItemsQuantity),
      });
    }

    cursor = orders.pageInfo?.hasNextPage
      ? (orders.pageInfo.endCursor ?? null)
      : null;
  } while (cursor);

  return {
    rows,
    pages,
    historyLimited,
    error,
    complete: !truncated && !historyLimited && cursor == null,
  };
}

/**
 * Chunked OrderFact backfill — up to `maxDays` closed shop-local days (default 7)
 * within the trailing Shopify order window (60d when historyLimited).
 * Never writes sample source. After upserts, recomputes touched cohort months.
 */
export async function runOrderFactsBackfill(
  admin: AdminApiContext,
  shopId: string,
  options?: { maxDays?: number; now?: Date },
): Promise<OrderFactBackfillResult> {
  const now = options?.now ?? new Date();
  const maxDays = options?.maxDays ?? ORDER_FACT_MAX_DAYS_PER_RUN;
  const ranAt = now.toISOString();

  const metadata = await ensureShopMetadata(admin, shopId);
  if (!metadata.ianaTimezone) {
    return {
      shopId,
      ranAt,
      attemptedDays: 0,
      written: 0,
      pages: 0,
      historyLimited: true,
      skippedReason: "no_timezone",
      lastError: null,
      touchedMonths: [],
    };
  }

  const state = await ensureBackfillState(shopId);
  // When TOML/env declares read_all_orders, try the same Jan-1 × 4yr depth as SalesDayFact.
  const scopesAllowDeep = (process.env.SCOPES ?? "").includes("read_all_orders");
  let historyLimited = scopesAllowDeep ? false : state.historyLimited;
  const deepWindowDays = salesDayFactWindowDayCount(now);
  const windowDays = historyLimited
    ? SHOPIFY_READ_ORDERS_WINDOW_DAYS
    : Math.max(SHOPIFY_READ_ORDERS_WINDOW_DAYS, deepWindowDays);

  const timeZone = metadata.ianaTimezone;
  await unsealOrderFactsMissingV2(shopId);
  const windowDayKeys = listRecentClosedShopLocalDays(timeZone, windowDays, now);

  // Prefer oldest missing days first. A day is covered only when the
  // `__day_complete__` marker exists — partial page-capped crawls stay retryable.
  const completeMarkers = await prisma.orderFact.findMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      shopifyOrderId: {
        in: windowDayKeys.map((k) => orderFactDayCompleteMarkerId(k)),
      },
    },
    select: { shopifyOrderId: true },
  });
  const existingKeys = new Set(
    completeMarkers.map((r) =>
      r.shopifyOrderId.replace(ORDER_FACT_DAY_COMPLETE_PREFIX, ""),
    ),
  );
  const missing = windowDayKeys.filter((k) => !existingKeys.has(k));
  const batch = missing.slice(0, maxDays);

  await prisma.orderBackfillState.update({
    where: { shopId },
    data: {
      status: "running",
      windowStart: batch[0] ? dayKeyToUtcDate(batch[0]) : null,
      windowEnd: batch.length
        ? dayKeyToUtcDate(batch[batch.length - 1]!)
        : null,
      lastError: null,
    },
  });

  let written = 0;
  let pages = 0;
  let lastError: string | null = null;
  let lastCompletedDay: string | null = state.cursor;
  let pagesLeft = ORDER_FACT_MAX_PAGES_PER_RUN;
  let wroteAnyOrders = false;

  for (const dayKey of batch) {
    if (pagesLeft <= 0) break;
    try {
      const result = await fetchOrdersForDay(admin, dayKey, timeZone, pagesLeft);
      pages += result.pages;
      pagesLeft -= result.pages;
      if (result.historyLimited) {
        historyLimited = true;
        lastError = result.error;
        break;
      }
      for (const row of result.rows) {
        await upsertOrderFact(shopId, row, now, ORDER_FACT_SOURCE);
        written += 1;
        wroteAnyOrders = true;
      }
      // Only mark the day complete when the crawl finished (not page-capped).
      if (result.complete) {
        await upsertOrderFact(
          shopId,
          {
            shopifyOrderId: orderFactDayCompleteMarkerId(dayKey),
            customerKey: ORDER_FACT_GUEST_KEY,
            orderedAt: shopLocalDayRange(dayKey, timeZone).start,
            shopLocalDate: dayKeyToUtcDate(dayKey),
            amount: 0,
            currency: metadata.currencyCode,
            discountAmount: 0,
            sourceName: null,
            unitCount: null,
          },
          now,
          ORDER_FACT_SOURCE,
        );
        lastCompletedDay = dayKey;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isHistoryWindowError(undefined, msg)) {
        historyLimited = true;
        lastError = msg;
        break;
      }
      lastError = msg;
    }
  }

  // Full recompute from OrderFacts so touched months = first-order cohort months
  // (not the month of a repeat purchase written in this chunk).
  const touchedMonths = wroteAnyOrders
    ? await recomputeCohortFacts(shopId, undefined, now)
    : [];

  await prisma.orderBackfillState.update({
    where: { shopId },
    data: {
      status: "idle",
      historyLimited,
      lastError,
      cursor: lastCompletedDay,
      updatedAt: now,
    },
  });

  return {
    shopId,
    ranAt,
    attemptedDays: batch.length,
    written,
    pages,
    historyLimited,
    skippedReason: null,
    lastError,
    touchedMonths,
  };
}

/** Read CohortFact rows for the desk (newest first). */
export async function getCohortFacts(
  shopId: string,
  options?: { limit?: number; sample?: boolean },
): Promise<
  Array<{
    cohortMonth: string;
    customers: number;
    revenueD30: number;
    revenueD90: number;
    revenueD365: number;
    ordersD30: number;
    ordersD90: number;
    ordersD365: number;
    asOf: Date | null;
  }>
> {
  const limit = options?.limit ?? 24;
  const source = options?.sample ? "sample" : ORDER_FACT_SOURCE;
  return prisma.cohortFact.findMany({
    where: { shopId, source },
    orderBy: { cohortMonth: "desc" },
    take: limit,
    select: {
      cohortMonth: true,
      customers: true,
      revenueD30: true,
      revenueD90: true,
      revenueD365: true,
      ordersD30: true,
      ordersD90: true,
      ordersD365: true,
      asOf: true,
    },
  });
}

export async function getOrderBackfillHistoryLimited(
  shopId: string,
): Promise<boolean> {
  const state = await prisma.orderBackfillState.findUnique({
    where: { shopId },
    select: { historyLimited: true },
  });
  return state?.historyLimited ?? false;
}

export type OrderBackfillProgress = {
  completeDays: number;
  windowDays: number;
  remainingDays: number;
  historyLimited: boolean;
  status: string;
};

/**
 * Closed-day ingest progress for LTV empty states (not a spinner).
 * Null when the shop has no IANA timezone yet.
 */
export async function getOrderBackfillProgress(
  shopId: string,
  options: { ianaTimezone: string | null; now?: Date },
): Promise<OrderBackfillProgress | null> {
  const tz = options.ianaTimezone?.trim() || null;
  if (!tz) return null;
  const now = options.now ?? new Date();
  const state = await prisma.orderBackfillState.findUnique({
    where: { shopId },
    select: { historyLimited: true, status: true },
  });
  const historyLimited = state?.historyLimited ?? false;
  const scopesAllowDeep = (process.env.SCOPES ?? "").includes("read_all_orders");
  const deepWindowDays = salesDayFactWindowDayCount(now);
  const windowDaysCount =
    historyLimited && !scopesAllowDeep
      ? SHOPIFY_READ_ORDERS_WINDOW_DAYS
      : Math.max(SHOPIFY_READ_ORDERS_WINDOW_DAYS, deepWindowDays);
  const windowDayKeys = listRecentClosedShopLocalDays(
    tz,
    windowDaysCount,
    now,
  );
  const completeMarkers = await prisma.orderFact.findMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      shopifyOrderId: {
        in: windowDayKeys.map((k) => orderFactDayCompleteMarkerId(k)),
      },
    },
    select: { shopifyOrderId: true },
  });
  const completeDays = completeMarkers.length;
  const windowDays = windowDayKeys.length;
  return {
    completeDays,
    windowDays,
    remainingDays: Math.max(0, windowDays - completeDays),
    historyLimited,
    status: state?.status ?? "idle",
  };
}

/**
 * Period order rows for depth stats (median AOV, repeat $, concentration).
 * Excludes day-complete seals. Capped so a backfill never blows the loader.
 */
export async function loadOrderDepthRows(
  shopId: string,
  range: { start: Date; end: Date },
  source: string,
): Promise<
  Array<{
    customerKey: string;
    amount: number;
    orderedAt: Date;
    shopLocalDate: Date;
    discountAmount: number | null;
    sourceName: string | null;
    unitCount: number | null;
  }>
> {
  return prisma.orderFact.findMany({
    where: {
      shopId,
      source,
      orderedAt: { gte: range.start, lte: range.end },
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
    select: {
      customerKey: true,
      amount: true,
      orderedAt: true,
      shopLocalDate: true,
      discountAmount: true,
      sourceName: true,
      unitCount: true,
    },
    take: 20_000,
  });
}

/**
 * Unique buyers whose first OrderFact falls inside `range` (till new-buyer count).
 * Returns null when no live OrderFacts exist yet.
 */
export async function countNewBuyersInRange(
  shopId: string,
  range: { start: Date; end: Date },
): Promise<number | null> {
  const orders = await prisma.orderFact.findMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      customerKey: { not: ORDER_FACT_GUEST_KEY },
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
    select: { customerKey: true, orderedAt: true },
  });
  if (orders.length === 0) return null;

  const firstByCustomer = new Map<string, Date>();
  for (const o of orders) {
    const prev = firstByCustomer.get(o.customerKey);
    if (!prev || o.orderedAt < prev) {
      firstByCustomer.set(o.customerKey, o.orderedAt);
    }
  }

  let n = 0;
  for (const first of firstByCustomer.values()) {
    if (first >= range.start && first <= range.end) n += 1;
  }
  return n;
}

/**
 * Deterministic sample CohortFacts for the Demo desk (`source = sample`).
 * Cleared with sample desk wipe — never overwrites live `shopify_order_v1` rows.
 *
 * Store cohort **totals** (customers × per-customer LTV) — never per-customer
 * alone, or weighted avg double-divides into ~$1 on the desk.
 *
 * Tuned vs SAMPLE cash CAC (~$70–90): 30d / 90d / 365d LTV read ~$145 / $380 / $820
 * so LTV:CAC lands ~4–6× (impressive, not 1×).
 */
export async function seedSampleCohortFacts(
  shopId: string,
  options?: { now?: Date },
): Promise<number> {
  const now = options?.now ?? new Date();
  const months: string[] = [];
  // 12 months — denser LTV page + Overview till strip.
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    months.push(cohortMonthFromDate(d));
  }

  // Per-customer revenue (shop dollars) — strong DTC repeat, never ~$1 scale.
  // Older cohorts mature further on 90d/365d; recent cohorts larger headcount.
  const ltv30Base = 145;
  const ltv90Base = 380;
  const ltv365Base = 820;

  let n = 0;
  for (let i = 0; i < months.length; i += 1) {
    const cohortMonth = months[i]!;
    // Growing brand — more recent cohorts larger (index 0 = oldest).
    const customers = 220 + i * 48;
    // Mild AOV lift over the year; older cohorts get extra maturity on long windows.
    const aovLift = 1 + i * 0.03;
    const maturity90 = 1 + (months.length - 1 - i) * 0.02;
    const maturity365 = 1 + (months.length - 1 - i) * 0.045;
    const rev30 = Math.round(customers * ltv30Base * aovLift);
    const rev90 = Math.round(customers * ltv90Base * aovLift * maturity90);
    const rev365 = Math.round(customers * ltv365Base * aovLift * maturity365);
    // Healthy repeat: ~1.3 / 1.85 / 2.6 orders per customer by window.
    const ordersD30 = customers + Math.round(customers * 0.32);
    const ordersD90 = customers + Math.round(customers * 0.85 * maturity90);
    const ordersD365 = customers + Math.round(customers * 1.6 * maturity365);
    await prisma.cohortFact.upsert({
      where: {
        shopId_cohortMonth_source: {
          shopId,
          cohortMonth,
          source: "sample",
        },
      },
      create: {
        shopId,
        cohortMonth,
        customers,
        revenueD30: rev30,
        revenueD90: rev90,
        revenueD365: rev365,
        ordersD30,
        ordersD90,
        ordersD365,
        asOf: now,
        source: "sample",
      },
      update: {
        customers,
        revenueD30: rev30,
        revenueD90: rev90,
        revenueD365: rev365,
        ordersD30,
        ordersD90,
        ordersD365,
        asOf: now,
      },
    });
    n += 1;
  }
  return n;
}

/** Delete demo CohortFact rows only (`source = sample`). */
export async function clearSampleCohortFacts(shopId: string): Promise<number> {
  const result = await prisma.cohortFact.deleteMany({
    where: { shopId, source: "sample" },
  });
  return result.count;
}

/** SAMPLE order-book window — enough for median/weekday/hour without 400-day bloat. */
export const SAMPLE_ORDER_FACT_WINDOW_DAYS = 90;

export async function clearSampleOrderFacts(shopId: string): Promise<number> {
  const result = await prisma.orderFact.deleteMany({
    where: { shopId, source: "sample" },
  });
  return result.count;
}

function splitSalesAcrossOrders(total: number, n: number): number[] {
  if (n <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const out = Array.from({ length: n }, () => base / 100);
  const drift = (cents - base * n) / 100;
  out[n - 1] = Math.round((out[n - 1]! + drift) * 100) / 100;
  return out;
}

/**
 * Sales-first SAMPLE OrderFacts so Overview Sample is a shop book.
 * Harbor spend / Total ROAS stays on SpendEntry + Marketing.
 */
export async function seedSampleOrderFacts(
  shopId: string,
  options?: { now?: Date },
): Promise<number> {
  const now = options?.now ?? new Date();
  await clearSampleOrderFacts(shopId);
  const cutoff = new Date(
    now.getTime() - SAMPLE_ORDER_FACT_WINDOW_DAYS * 86_400_000,
  );
  const days = await prisma.sampleSalesDay.findMany({
    where: { shopId, day: { gte: cutoff } },
    orderBy: { day: "asc" },
    select: { day: true, sales: true, orderCount: true },
  });

  const rows: Array<{
    shopId: string;
    shopifyOrderId: string;
    customerKey: string;
    orderedAt: Date;
    shopLocalDate: Date;
    amount: number;
    currency: string;
    discountAmount: number;
    sourceName: string;
    unitCount: number;
    asOf: Date;
    source: string;
  }> = [];

  let buyerSeq = 0;
  for (const d of days) {
    const n = Math.max(0, Math.min(12, Math.trunc(d.orderCount)));
    if (n === 0 || !(d.sales > 0)) continue;
    const day = new Date(d.day);
    const dayKey = day.toISOString().slice(0, 10);
    const amounts = splitSalesAcrossOrders(d.sales, n);
    for (let i = 0; i < n; i += 1) {
      const isGuest = n >= 5 && i === n - 1;
      const isRepeat = !isGuest && buyerSeq > 6 && i % 3 === 0;
      const customerKey = isGuest
        ? ORDER_FACT_GUEST_KEY
        : `sample:c${isRepeat ? (buyerSeq - 4 + 40) % 40 : buyerSeq % 40}`;
      if (!isGuest && !isRepeat) buyerSeq += 1;
      const hour = 10 + (i % 8);
      const orderedAt = new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          hour,
          12 + (i % 20),
          0,
        ),
      );
      const amount = amounts[i] ?? 0;
      const sourceName = i % 7 === 0 ? "pos" : i % 11 === 0 ? "shop" : "web";
      const discountAmount =
        i % 5 === 0 ? Math.round(amount * 0.12 * 100) / 100 : 0;
      rows.push({
        shopId,
        shopifyOrderId: `sample-order:${dayKey}:${i}`,
        customerKey,
        orderedAt,
        shopLocalDate: day,
        amount,
        currency: "USD",
        discountAmount,
        sourceName,
        unitCount: 1 + (i % 4),
        asOf: now,
        source: "sample",
      });
    }
  }

  for (let i = 0; i < rows.length; i += 200) {
    await prisma.orderFact.createMany({
      data: rows.slice(i, i + 200),
      skipDuplicates: true,
    });
  }
  return rows.length;
}

