import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { ensureShopMetadata } from "./shop-metadata.server";
import {
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  shopLocalDayRange,
} from "./shop-local-day";
import { formatPeriodQuery, SHOPIFY_READ_ORDERS_WINDOW_DAYS } from "./periods";
import {
  isShopifyHistoryWindowError,
  shopifyOrderHistoryIsLimited,
} from "./shopify-order-window";
import { salesDayFactWindowDayCount } from "./sales-facts.server";
import { isBillingEnabled } from "./billing-flag.server";
import { resolveCommercialOrderWindowDays } from "./live-ingest-depth";
import { shopIsProForIngest } from "./live-ingest-depth.server";
import {
  adminGraphqlJson,
  ORDER_FACT_PAGES_COST_SAFE_CAP,
  type GraphqlCost,
} from "./shopify-graphql-cost.server";
import { orderGrossAmount, orderNetAmount } from "./shopify-sales.server";
import { sumCohortWindows } from "./ltv-depth";
import { enqueueJob } from "./job-queue.server";

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

/**
 * Soft page cap per kick (in addition to day-window chunk).
 * Raised from 25 so a busy closed day (~4k orders) can finish in one kick;
 * still clamped by {@link ORDER_FACT_PAGES_COST_SAFE_CAP} (never unbounded).
 */
export const ORDER_FACT_MAX_PAGES_PER_RUN = 40;

/** Queue type: resume a truncated OrderFact crawl on the next worker tick. */
export const BACKFILL_ORDER_FACTS_JOB = "backfill_order_facts";

/**
 * Sentinel `OrderBackfillState.cursor` prefix: GraphQL page resume for a
 * shop-local day that hit the page cap. Distinct from a completed-day key.
 */
export const ORDER_FACT_PAGE_CURSOR_PREFIX = "__page__:";

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Marker id written when a shop-local day crawl finishes (not page-capped). */
export function orderFactDayCompleteMarkerId(dayKey: string): string {
  return `${ORDER_FACT_DAY_COMPLETE_PREFIX}${dayKey}`;
}

/** Persist GraphQL pagination so the next kick continues a truncated day. */
export function orderFactPageCursorMarker(
  dayKey: string,
  graphqlCursor: string,
): string {
  return `${ORDER_FACT_PAGE_CURSOR_PREFIX}${dayKey}:${graphqlCursor}`;
}

/** Parse a `__page__:YYYY-MM-DD:<graphqlCursor>` resume token. */
export function parseOrderFactPageCursor(
  raw: string | null | undefined,
): { dayKey: string; graphqlCursor: string } | null {
  if (!raw || !raw.startsWith(ORDER_FACT_PAGE_CURSOR_PREFIX)) return null;
  const rest = raw.slice(ORDER_FACT_PAGE_CURSOR_PREFIX.length);
  const match = /^(\d{4}-\d{2}-\d{2}):(.+)$/.exec(rest);
  const dayKey = match?.[1];
  const graphqlCursor = match?.[2];
  if (!dayKey || !graphqlCursor) return null;
  return { dayKey, graphqlCursor };
}

/**
 * A day is sealed complete only when the crawl finished every GraphQL page.
 * Page-capped or history-denied days stay unsealed so the next kick retries.
 */
export function shouldSealOrderFactDay(flags: {
  truncated: boolean;
  historyLimited: boolean;
  hasMorePages: boolean;
}): boolean {
  return !flags.truncated && !flags.historyLimited && !flags.hasMorePages;
}

/** Clamp a kick's page budget — never unbounded, never above the cost-safe cap. */
export function resolveOrderFactMaxPages(raw?: number): number {
  const n = raw ?? ORDER_FACT_MAX_PAGES_PER_RUN;
  if (!Number.isFinite(n) || n <= 0) return ORDER_FACT_MAX_PAGES_PER_RUN;
  return Math.min(Math.floor(n), ORDER_FACT_PAGES_COST_SAFE_CAP);
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
  // Refunds during a truncated crawl must restart the day, not resume mid-page.
  const state = await prisma.orderBackfillState.findUnique({
    where: { shopId },
    select: { cursor: true },
  });
  const resume = parseOrderFactPageCursor(state?.cursor);
  if (resume?.dayKey === dayKey) {
    await prisma.orderBackfillState.updateMany({
      where: { shopId },
      data: { cursor: null },
    });
  }
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
          discountApplications(first: 5) {
            nodes {
              ... on DiscountCodeApplication {
                code
              }
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
            numberOfOrders
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
          discountApplications?: {
            nodes?: Array<{ code?: string | null } | null> | null;
          } | null;
          totalPriceSet?: {
            shopMoney?: { amount?: string; currencyCode?: string };
          };
          currentTotalPriceSet?: {
            shopMoney?: { amount?: string; currencyCode?: string };
          };
          customer?: { id?: string; numberOfOrders?: number | string | null } | null;
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
  /** totalPriceSet shop amount. Null when Shopify did not send a gross. */
  grossAmount: number | null;
  currency: string | null;
  discountAmount: number | null;
  /** First DiscountCodeApplication code when Shopify sent one. Null otherwise. */
  discountCode: string | null;
  sourceName: string | null;
  unitCount: number | null;
  lifetimeOrders?: number | null;
}

export interface CohortRollup {
  cohortMonth: string;
  customers: number;
  /** Net dollars (order revenue − refunds in the window). Heroes read these. */
  revenueD30: number;
  revenueD90: number;
  revenueD365: number;
  /**
   * Gross order revenue in the window when every order carried a known gross.
   * Null means gross is not on file — not $0. Not stored on CohortFact.
   */
  grossRevenueD30: number | null;
  grossRevenueD90: number | null;
  grossRevenueD365: number | null;
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
  /** True when a closed day hit the page cap — not sealed, next tick retries. */
  truncated: boolean;
  truncatedDay: string | null;
  /** Closed days still missing after this chunk (window resume, not a 2-day book). */
  remainingMissingDays: number;
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

function parseMoneyAmount(raw: string | undefined): number {
  if (raw == null || raw === "") return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseUnitCount(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw) || raw < 0) return null;
  return Math.trunc(raw);
}

function parseLifetimeOrders(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

/**
 * First non-empty DiscountCodeApplication.code. Never invent from discount $.
 */
function firstDiscountCodeFromApplications(
  apps:
    | { nodes?: Array<{ code?: string | null } | null> | null }
    | null
    | undefined,
): string | null {
  for (const node of apps?.nodes ?? []) {
    const code = node?.code?.trim();
    if (code) return code;
  }
  return null;
}

const isHistoryWindowError = isShopifyHistoryWindowError;

/**
 * Pure cohort math: first non-guest order on file defines cohort month; sum
 * amounts/orders within 30/90/365 days of that first *visible* order.
 * Buyers whose Shopify `numberOfOrders` is greater than in-window orders are
 * not a new cohort — first-on-file is not lifetime first.
 * Guests are ignored.
 */
export function computeCohortRollups(
  orders: Array<{
    customerKey: string;
    orderedAt: Date;
    amount: number;
    /** Order revenue before refunds, when known. Omit rather than invent. */
    grossAmount?: number | null;
    lifetimeOrders?: number | null;
  }>,
): CohortRollup[] {
  const byCustomer = new Map<
    string,
    Array<{
      orderedAt: Date;
      amount: number;
      grossAmount: number | null;
      lifetimeOrders: number | null;
    }>
  >();

  for (const o of orders) {
    if (!o.customerKey || o.customerKey === ORDER_FACT_GUEST_KEY) continue;
    const lifetime =
      o.lifetimeOrders != null && Number.isFinite(o.lifetimeOrders)
        ? Math.max(0, Math.trunc(o.lifetimeOrders))
        : null;
    const list = byCustomer.get(o.customerKey) ?? [];
    list.push({
      orderedAt: o.orderedAt,
      amount: o.amount,
      grossAmount:
        o.grossAmount != null && Number.isFinite(o.grossAmount)
          ? o.grossAmount
          : null,
      lifetimeOrders: lifetime,
    });
    byCustomer.set(o.customerKey, list);
  }

  const byMonth = new Map<
    string,
    {
      cohortMonth: string;
      customers: number;
      revenueD30: number;
      revenueD90: number;
      revenueD365: number;
      grossD30: number;
      grossD90: number;
      grossD365: number;
      grossKnownD30: boolean;
      grossKnownD90: boolean;
      grossKnownD365: boolean;
      ordersD30: number;
      ordersD90: number;
      ordersD365: number;
    }
  >();

  for (const list of byCustomer.values()) {
    list.sort((a, b) => a.orderedAt.getTime() - b.orderedAt.getTime());
    const first = list[0];
    if (!first) continue;
    const lifetimeKnown = list
      .map((row) => row.lifetimeOrders)
      .filter((n): n is number => n != null);
    const lifetimeOrders =
      lifetimeKnown.length > 0 ? Math.max(...lifetimeKnown) : null;
    if (lifetimeOrders != null && lifetimeOrders > list.length) {
      continue;
    }
    const cohortMonth = cohortMonthFromDate(first.orderedAt);
    const sums = sumCohortWindows(
      list.map((row) => ({
        orderedAt: row.orderedAt,
        amount: Number.isFinite(row.amount) ? row.amount : 0,
        grossAmount: row.grossAmount,
      })),
      first.orderedAt,
    );

    const row = byMonth.get(cohortMonth) ?? {
      cohortMonth,
      customers: 0,
      revenueD30: 0,
      revenueD90: 0,
      revenueD365: 0,
      grossD30: 0,
      grossD90: 0,
      grossD365: 0,
      grossKnownD30: true,
      grossKnownD90: true,
      grossKnownD365: true,
      ordersD30: 0,
      ordersD90: 0,
      ordersD365: 0,
    };
    row.customers += 1;
    row.revenueD30 += sums.net30;
    row.revenueD90 += sums.net90;
    row.revenueD365 += sums.net365;
    row.ordersD30 += sums.orders30;
    row.ordersD90 += sums.orders90;
    row.ordersD365 += sums.orders365;
    if (sums.gross30 == null) row.grossKnownD30 = false;
    else row.grossD30 += sums.gross30;
    if (sums.gross90 == null) row.grossKnownD90 = false;
    else row.grossD90 += sums.gross90;
    if (sums.gross365 == null) row.grossKnownD365 = false;
    else row.grossD365 += sums.gross365;
    byMonth.set(cohortMonth, row);
  }

  return [...byMonth.values()]
    .sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth))
    .map((row) => ({
      cohortMonth: row.cohortMonth,
      customers: row.customers,
      revenueD30: row.revenueD30,
      revenueD90: row.revenueD90,
      revenueD365: row.revenueD365,
      grossRevenueD30: row.grossKnownD30 ? row.grossD30 : null,
      grossRevenueD90: row.grossKnownD90 ? row.grossD90 : null,
      grossRevenueD365: row.grossKnownD365 ? row.grossD365 : null,
      ordersD30: row.ordersD30,
      ordersD90: row.ordersD90,
      ordersD365: row.ordersD365,
    }));
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
    grossAmount: row.grossAmount,
    currency: row.currency,
    discountAmount: row.discountAmount,
    discountCode: row.discountCode,
    sourceName: row.sourceName,
    unitCount: row.unitCount,
    lifetimeOrders: row.lifetimeOrders ?? null,
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

/** Coalesce one OrderFact backfill job per shop so the next tick resumes. */
async function enqueueTruncatedOrderFactsRetry(
  shopId: string,
  truncatedDay: string,
): Promise<void> {
  try {
    await enqueueJob({
      shopId,
      type: BACKFILL_ORDER_FACTS_JOB,
      dedupeKey: shopId,
      payload: { reason: "truncated_page_cap", day: truncatedDay },
      maxAttempts: 40,
    });
  } catch {
    // Queue is best-effort — page-load kicks still resume via `__page__` cursor.
  }
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
      lifetimeOrders: true,
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
  afterCursor: string | null = null,
): Promise<{
  rows: OrderFactRow[];
  pages: number;
  historyLimited: boolean;
  error: string | null;
  /** False when page-capped mid-day — do not mark the day complete. */
  complete: boolean;
  truncated: boolean;
  /** GraphQL `after` cursor for the next kick; null when there is nothing to resume. */
  resumeCursor: string | null;
}> {
  const range = shopLocalDayRange(dayKey, timeZone);
  const query = formatPeriodQuery({
    start: range.start,
    end: range.end,
    label: dayKey,
  });
  const rows: OrderFactRow[] = [];
  let cursor: string | null = afterCursor;
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
        grossAmount: orderGrossAmount(node),
        currency:
          node.currentTotalPriceSet?.shopMoney?.currencyCode ??
          node.totalPriceSet?.shopMoney?.currencyCode ??
          null,
        discountAmount: parseMoneyAmount(
          node.currentTotalDiscountsSet?.shopMoney?.amount,
        ),
        discountCode: firstDiscountCodeFromApplications(
          node.discountApplications,
        ),
        sourceName: node.sourceName?.trim() || null,
        unitCount: parseUnitCount(node.currentSubtotalLineItemsQuantity),
        lifetimeOrders: parseLifetimeOrders(node.customer?.numberOfOrders),
      });
    }

    const hasNext = Boolean(orders.pageInfo?.hasNextPage);
    const endCursor = orders.pageInfo?.endCursor ?? null;
    if (hasNext && !endCursor) {
      // Cannot resume and must not seal an incomplete day as $0/complete.
      truncated = true;
      cursor = null;
      break;
    }
    cursor = hasNext ? endCursor : null;
  } while (cursor);

  return {
    rows,
    pages,
    historyLimited,
    error,
    truncated,
    resumeCursor: truncated && cursor ? cursor : null,
    complete: shouldSealOrderFactDay({
      truncated,
      historyLimited,
      hasMorePages: cursor != null,
    }),
  };
}

/** Deep scopes ignore a stale historyLimited flag when sizing the window. */
function orderHistoryIsLimitedForWindow(
  storedHistoryLimited: boolean,
  scopesAllowDeep: boolean,
): boolean {
  return scopesAllowDeep ? false : storedHistoryLimited;
}

/** Shopify-visible order span before the commercial slice and 24-month cap. */
function shopifyVisibleOrderDays(historyLimited: boolean, now: Date): number {
  const deepWindowDays = salesDayFactWindowDayCount(now);
  return historyLimited
    ? SHOPIFY_READ_ORDERS_WINDOW_DAYS
    : Math.max(SHOPIFY_READ_ORDERS_WINDOW_DAYS, deepWindowDays);
}

/**
 * Unpaid / trial stops at LIVE_UNPAID_INGEST_DAYS. Paid keeps the
 * Shopify-visible span, then the 24-month order-row cap. An explicit
 * `requestedWindowDays` can only shrink that result.
 */
async function clampedOrderWindowDays(input: {
  shopId: string;
  historyLimited: boolean;
  now: Date;
  requestedWindowDays?: number;
}): Promise<number> {
  const visible = shopifyVisibleOrderDays(input.historyLimited, input.now);
  const billingEnabled = isBillingEnabled();
  const isPro = billingEnabled ? await shopIsProForIngest(input.shopId) : false;
  const commercial = resolveCommercialOrderWindowDays({
    billingEnabled,
    isPro,
    shopifyWindowDays: visible,
    now: input.now,
  });
  if (input.requestedWindowDays == null) return commercial;
  const requested = Math.floor(input.requestedWindowDays);
  if (!Number.isFinite(requested) || requested <= 0) return commercial;
  return Math.min(commercial, requested);
}

/**
 * Chunked OrderFact backfill — up to `maxDays` closed shop-local days (default 7)
 * within the commercial order window (unpaid/trial closed-day slice, else
 * Shopify-visible, always inside 24 months).
 * Never writes sample source. After upserts, recomputes touched cohort months.
 */
export async function runOrderFactsBackfill(
  admin: AdminApiContext,
  shopId: string,
  options?: {
    maxDays?: number;
    now?: Date;
    maxPages?: number;
    enqueueRetry?: boolean;
    windowDays?: number;
  },
): Promise<OrderFactBackfillResult> {
  const now = options?.now ?? new Date();
  const maxDays = options?.maxDays ?? ORDER_FACT_MAX_DAYS_PER_RUN;
  const maxPages = resolveOrderFactMaxPages(options?.maxPages);
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
      truncated: false,
      truncatedDay: null,
      remainingMissingDays: 0,
    };
  }

  const state = await ensureBackfillState(shopId);
  const scopesAllowDeep = (process.env.SCOPES ?? "").includes("read_all_orders");
  let historyLimited = orderHistoryIsLimitedForWindow(
    state.historyLimited,
    scopesAllowDeep,
  );
  const windowDays = await clampedOrderWindowDays({
    shopId,
    historyLimited,
    now,
    requestedWindowDays: options?.windowDays,
  });

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
  const resume = parseOrderFactPageCursor(state.cursor);
  const resumeDay =
    resume && missing.includes(resume.dayKey) ? resume.dayKey : null;
  const orderedMissing = resumeDay
    ? [resumeDay, ...missing.filter((k) => k !== resumeDay)]
    : missing;
  const batch = orderedMissing.slice(0, maxDays);

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
  let pagesLeft = maxPages;
  let wroteAnyOrders = false;
  let truncatedDay: string | null = null;
  let pageCursorToStore: string | null = null;

  for (const dayKey of batch) {
    if (pagesLeft <= 0) break;
    const afterCursor =
      resumeDay === dayKey &&
      resume?.graphqlCursor &&
      resume.graphqlCursor !== "retry"
        ? resume.graphqlCursor
        : null;
    try {
      const result = await fetchOrdersForDay(
        admin,
        dayKey,
        timeZone,
        pagesLeft,
        afterCursor,
      );
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
            grossAmount: null,
            currency: metadata.currencyCode,
            discountAmount: 0,
            discountCode: null,
            sourceName: null,
            unitCount: null,
          },
          now,
          ORDER_FACT_SOURCE,
        );
        lastCompletedDay = dayKey;
      } else if (result.truncated) {
        truncatedDay = dayKey;
        pageCursorToStore = result.resumeCursor
          ? orderFactPageCursorMarker(dayKey, result.resumeCursor)
          : orderFactPageCursorMarker(dayKey, "retry");
        break;
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
      cursor: pageCursorToStore ?? lastCompletedDay,
      updatedAt: now,
    },
  });

  if (truncatedDay && options?.enqueueRetry !== false) {
    await enqueueTruncatedOrderFactsRetry(shopId, truncatedDay);
  }

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
    truncated: truncatedDay != null,
    truncatedDay,
    remainingMissingDays: Math.max(0, missing.length - batch.length),
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
  return shopifyOrderHistoryIsLimited(state?.historyLimited ?? false);
}

export type OrderBackfillProgress = {
  completeDays: number;
  windowDays: number;
  remainingDays: number;
  historyLimited: boolean;
  status: string;
  /** Closed-day OrderFact crawl hit the page cap — not sealed, not $0. */
  truncated: boolean;
  truncatedDay: string | null;
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
    select: { historyLimited: true, status: true, cursor: true },
  });
  const historyLimited = state?.historyLimited ?? false;
  const scopesAllowDeep = (process.env.SCOPES ?? "").includes("read_all_orders");
  const windowDaysCount = await clampedOrderWindowDays({
    shopId,
    historyLimited: orderHistoryIsLimitedForWindow(
      historyLimited,
      scopesAllowDeep,
    ),
    now,
  });
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
  const resume = parseOrderFactPageCursor(state?.cursor);
  return {
    completeDays,
    windowDays,
    remainingDays: Math.max(0, windowDays - completeDays),
    historyLimited,
    status: state?.status ?? "idle",
    truncated: resume != null,
    truncatedDay: resume?.dayKey ?? null,
  };
}

/**
 * Period order rows for depth stats (median AOV, repeat $, concentration).
 * Excludes day-complete seals. Capped so a backfill never blows the loader.
 */
export async function loadOrderDepthRows(
  shopId: string,
  range: { start?: Date; end: Date },
  source: string,
): Promise<
  Array<{
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
  }>
> {
  return prisma.orderFact.findMany({
    where: {
      shopId,
      source,
      orderedAt: range.start
        ? { gte: range.start, lte: range.end }
        : { lte: range.end },
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
    select: { customerKey: true, orderedAt: true, lifetimeOrders: true },
  });
  if (orders.length === 0) return null;

  const firstByCustomer = new Map<
    string,
    { first: Date; lifetime: number | null; inWindow: number }
  >();
  for (const o of orders) {
    const prev = firstByCustomer.get(o.customerKey);
    const lifetime =
      o.lifetimeOrders != null && Number.isFinite(o.lifetimeOrders)
        ? Math.max(0, Math.trunc(o.lifetimeOrders))
        : null;
    if (!prev) {
      firstByCustomer.set(o.customerKey, {
        first: o.orderedAt,
        lifetime,
        inWindow: 1,
      });
      continue;
    }
    prev.inWindow += 1;
    if (o.orderedAt < prev.first) prev.first = o.orderedAt;
    if (lifetime != null) {
      prev.lifetime = prev.lifetime == null ? lifetime : Math.max(prev.lifetime, lifetime);
    }
  }

  let n = 0;
  for (const row of firstByCustomer.values()) {
    if (row.lifetime != null && row.lifetime > row.inWindow) continue;
    if (row.first >= range.start && row.first <= range.end) n += 1;
  }
  return n;
}

/**
 * Unique identified buyers (not guests) with an OrderFact inside `range`.
 * Returns null when no live OrderFacts exist yet — never a fake 0 headcount.
 */
export async function countIdentifiedBuyersInRange(
  shopId: string,
  range: { start: Date; end: Date },
): Promise<number | null> {
  const orders = await prisma.orderFact.findMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      customerKey: { not: ORDER_FACT_GUEST_KEY },
      orderedAt: { gte: range.start, lte: range.end },
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
    select: { customerKey: true },
    take: 20_000,
  });
  if (orders.length === 0) return null;
  return new Set(orders.map((order) => order.customerKey)).size;
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
    // Growing brand — more recent cohorts larger + worth more (index 0 = oldest).
    const customers = 220 + i * 52;
    // AOV lift over the year so LTV reads up-and-to-the-right; older cohorts
    // still get extra maturity on long windows.
    const aovLift = 1 + i * 0.045;
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

/** SAMPLE order-book window — enough for median/weekday/hour without two-year bloat. */
export const SAMPLE_ORDER_FACT_WINDOW_DAYS = 90;

export async function clearSampleOrderFacts(shopId: string): Promise<number> {
  const result = await prisma.orderFact.deleteMany({
    where: { shopId, source: "sample" },
  });
  return result.count;
}

/** Deterministic RNG so SAMPLE order facts are stable seed-to-seed. */
function sampleRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vary per-order amounts around the day AOV while preserving the day total. */
function splitSalesVaried(
  total: number,
  n: number,
  rng: () => number,
): number[] {
  if (n <= 0) return [];
  const weights = Array.from({ length: n }, () => 0.55 + rng() * 1.15);
  const sum = weights.reduce((a, b) => a + b, 0);
  const cents = Math.round(total * 100);
  const out = weights.map((w) => Math.max(1, Math.round((cents * w) / sum)));
  const drift = cents - out.reduce((a, b) => a + b, 0);
  out[n - 1] = Math.max(1, out[n - 1]! + drift);
  return out.map((c) => c / 100);
}

/** One SAMPLE sales-book day fed into the pure order-fact builder. */
export interface SampleSalesDayInput {
  day: Date;
  sales: number;
  orderCount: number;
  /** Guest-checkout orders that day (subset of orderCount). Optional (legacy). */
  guestOrders?: number | null;
}

/** A generated SAMPLE OrderFact row (pre-persist — no shopId / asOf / source). */
export interface SampleOrderFactRow {
  shopifyOrderId: string;
  customerKey: string;
  orderedAt: Date;
  shopLocalDate: Date;
  amount: number;
  currency: string;
  discountAmount: number;
  discountCode: string | null;
  sourceName: string;
  unitCount: number;
  lifetimeOrders: number | null;
}

/** Cap on synthesized orders per SAMPLE day — keeps the seed compact. */
const SAMPLE_ORDERS_PER_DAY_CAP = 12;

/**
 * Pure SAMPLE OrderFact generator so the Customers / Orders / LTV depth is
 * unit-testable without a DB. Realistic customer base: ~68% of *identified*
 * orders are first-time buyers (a long tail of one-order accounts), the rest
 * are returning buyers picked with a whale bias so a few accounts carry many
 * orders. Guest checkouts are carried straight from the sales book's per-day
 * `guestOrders` so the Guest Checkouts tile and the sales hero agree. That
 * gives the Customers tab a believable order-frequency long tail, spend bands,
 * days-to-2nd spread, whales, and a real guest share — from order facts only.
 * Snowdevil spend / Total ROAS stays on SpendEntry + Marketing. Units stay 1–2
 * (board, or board + wax) — not Harbor multi-item baskets.
 */
export function buildSampleOrderFactRows(
  days: SampleSalesDayInput[],
  options?: { seed?: number },
): SampleOrderFactRow[] {
  const rows: SampleOrderFactRow[] = [];
  const rng = sampleRng(options?.seed ?? 0x519b2c7d);
  const pool: string[] = [];
  const orderCountByKey = new Map<string, number>();
  let seq = 0;
  const NEW_SHARE = 0.68;

  for (const d of days) {
    const n = Math.max(0, Math.min(SAMPLE_ORDERS_PER_DAY_CAP, Math.trunc(d.orderCount)));
    if (n === 0 || !(d.sales > 0)) continue;
    const day = new Date(d.day);
    const dayKey = day.toISOString().slice(0, 10);
    const amounts = splitSalesVaried(d.sales, n, rng);
    // Scale the book's guest count to the (capped) synthesized order count so
    // the guest tail survives the per-day cap; always leave ≥1 identified buyer.
    const rawGuests = Math.max(0, Math.trunc(d.guestOrders ?? 0));
    const guestForDay =
      d.orderCount > 0
        ? Math.min(n - 1, Math.round((rawGuests * n) / d.orderCount))
        : 0;
    const identifiedForDay = n - guestForDay;
    for (let i = 0; i < n; i += 1) {
      const guest = i >= identifiedForDay;
      let customerKey: string;
      if (guest) {
        customerKey = ORDER_FACT_GUEST_KEY;
      } else if (pool.length < 8 || rng() < NEW_SHARE) {
        customerKey = `sample:c${seq}`;
        seq += 1;
        pool.push(customerKey);
      } else {
        // Whale bias — older accounts accumulate the repeat orders.
        const idx = Math.min(
          pool.length - 1,
          Math.floor(pool.length * Math.pow(rng(), 2.3)),
        );
        customerKey = pool[idx]!;
      }
      let lifetimeOrders: number | null = null;
      if (customerKey !== ORDER_FACT_GUEST_KEY) {
        const next = (orderCountByKey.get(customerKey) ?? 0) + 1;
        orderCountByKey.set(customerKey, next);
        lifetimeOrders = next;
      }
      const hour = 9 + (i % 11);
      const orderedAt = new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          hour,
          7 + (i % 47),
          0,
        ),
      );
      const amount = amounts[i] ?? 0;
      const sourceName = i % 7 === 0 ? "pos" : i % 13 === 0 ? "shop" : "web";
      const discountAmount =
        rng() < 0.22 ? Math.round(amount * 0.12 * 100) / 100 : 0;
      rows.push({
        shopifyOrderId: `sample-order:${dayKey}:${i}`,
        customerKey,
        orderedAt,
        shopLocalDate: day,
        amount,
        currency: "USD",
        discountAmount,
        discountCode: null,
        sourceName,
        unitCount: 1 + (i % 2),
        lifetimeOrders,
      });
    }
  }

  return rows;
}

/**
 * Sales-first SAMPLE OrderFacts so Overview Sample is a shop book. Reads the
 * SampleSalesDay book (last {@link SAMPLE_ORDER_FACT_WINDOW_DAYS} days),
 * synthesizes order rows via {@link buildSampleOrderFactRows}, and persists them
 * as `source = "sample"` (never touching live `shopify_order_v1` rows).
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
    select: { day: true, sales: true, orderCount: true, guestOrders: true },
  });

  const built = buildSampleOrderFactRows(days);
  const rows = built.map((r) => ({
    ...r,
    shopId,
    asOf: now,
    source: "sample",
  }));

  for (let i = 0; i < rows.length; i += 200) {
    await prisma.orderFact.createMany({
      data: rows.slice(i, i + 200),
      skipDuplicates: true,
    });
  }
  return rows.length;
}

