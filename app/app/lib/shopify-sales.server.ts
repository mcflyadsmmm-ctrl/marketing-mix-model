import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { formatPeriodQuery, type DateRange } from "./periods";
import { shopLocalDayKey } from "./shop-local-day";
import {
  adminGraphqlJson as fetchAdminGraphqlJson,
  type GraphqlCost,
} from "./shopify-graphql-cost.server";

export {
  shopLocalDayKey,
  shopLocalDayRange,
  listRecentClosedShopLocalDays,
} from "./shop-local-day";

export interface SalesResult {
  /**
   * Action Total ROAS numerator = net Shopify sales
   * (`currentTotalPriceSet` sum). Kept as `totalSales` so mer-dashboard /
   * allocation / Monday stay on one field.
   */
  totalSales: number;
  /** Gross order totals (`totalPriceSet`) — Ads Manager–comparable secondary. */
  grossSales: number;
  /**
   * False when closed-day gross is incomplete/unknown (legacy facts) — UI must
   * not claim Ads Manager–comparable gross. Default true for live GraphQL.
   */
  grossSalesKnown?: boolean;
  /** Same as totalSales (net) — explicit alias for UI / honesty chips. */
  netSales: number;
  /** Action basis — always net after Phase 1A. */
  salesBasisUsed: "net";
  orderCount: number;
  /** Unique customers whose first-ever order falls in this period (cash desk definition). */
  newCustomers: number;
  /** Unique customers who ordered in this period and had prior orders. */
  returningCustomers: number;
  /**
   * Net sales from new-customer orders (Level-1 opaque lifetimeOrders heuristic).
   * Guest order net stays in totalSales/netSales but is excluded here.
   */
  newCustomerNetSales: number;
  /** Net sales from returning-customer orders (same heuristic). */
  returningCustomerNetSales: number;
  /** Orders with no customer (guest checkout) — excluded from new/returning. */
  guestOrders: number;
  /** True when customer fields were readable (needs read_customers). */
  customerMetricsAvailable: boolean;
  source: "shopify" | "mock";
  /**
   * True when `maxPages` stopped pagination while Shopify still had a next page.
   * Desk today top-up may undercount — surface via CashTrustBanners; never silent.
   */
  truncatedByPageCap?: boolean;
}

/** Sales + order count — works with read_orders alone (fallback / by-day). */
const ORDERS_SALES_QUERY = `#graphql
  query McflyOrdersSales($query: String!, $cursor: String) {
    orders(first: 100, after: $cursor, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          createdAt
          totalPriceSet {
            shopMoney {
              amount
            }
          }
          currentTotalPriceSet {
            shopMoney {
              amount
            }
          }
        }
      }
    }
  }
`;

/**
 * Combined sales + opaque customer mix — preferred path (one crawl).
 * Needs read_customers for customer fields; falls back to dual crawl on deny.
 * Only opaque id + numberOfOrders; never name/email/address.
 */
const ORDERS_FULL_QUERY = `#graphql
  query McflyOrdersFull($query: String!, $cursor: String) {
    orders(first: 100, after: $cursor, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          createdAt
          totalPriceSet {
            shopMoney {
              amount
            }
          }
          currentTotalPriceSet {
            shopMoney {
              amount
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

/**
 * New/returning — needs read_customers (Shopify denies order.customer otherwise).
 * Only opaque id + numberOfOrders; never name/email/address.
 */
const ORDERS_CUSTOMER_QUERY = `#graphql
  query McflyOrdersCustomers($query: String!, $cursor: String) {
    orders(first: 100, after: $cursor, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          totalPriceSet {
            shopMoney {
              amount
            }
          }
          currentTotalPriceSet {
            shopMoney {
              amount
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

type CustomerAccum = {
  lifetimeOrders: number;
  ordersInPeriod: number;
  netSalesInPeriod: number;
};

type MoneySet = { shopMoney?: { amount?: string } };

type OrdersSalesJson = {
  data?: {
    orders?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      edges?: Array<{
        node?: {
          id?: string;
          createdAt?: string;
          totalPriceSet?: MoneySet;
          currentTotalPriceSet?: MoneySet;
          customer?: {
            id?: string;
            numberOfOrders?: number | string | null;
          } | null;
        };
      }>;
    };
  };
  errors?: Array<{ message?: string; extensions?: { code?: string } }>;
  extensions?: { cost?: GraphqlCost };
};

/**
 * One Admin GraphQL page with a single THROTTLED retry after cost-based wait.
 * Paged `first: 100` only — for >~250 historical orders prefer Bulk Operations.
 */
function adminGraphqlJson(
  admin: AdminApiContext,
  document: string,
  variables: { query: string; cursor: string | null },
): Promise<OrdersSalesJson> {
  return fetchAdminGraphqlJson<OrdersSalesJson>(admin, document, variables);
}

function parseMoneyAmount(set: MoneySet | undefined): number {
  const amount = parseFloat(set?.shopMoney?.amount ?? "0");
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Prefer net (after returns). Fully refunded orders have currentTotal = 0 — that
 * must win (do not treat 0 as "missing"). Fall back to gross only when
 * currentTotalPriceSet.shopMoney.amount is absent (matches OrderFact ingest).
 */
export function orderNetAmount(node: {
  totalPriceSet?: MoneySet;
  currentTotalPriceSet?: MoneySet;
} | null | undefined): number {
  const gross = parseMoneyAmount(node?.totalPriceSet);
  const netRaw = node?.currentTotalPriceSet?.shopMoney?.amount;
  if (netRaw == null || netRaw === "") {
    return gross;
  }
  const net = parseFloat(netRaw);
  return Number.isFinite(net) ? net : gross;
}

/** Bucket an order `createdAt` ISO into a shop-local YYYY-MM-DD day key. */
export function shopLocalDayKeyFromIso(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return shopLocalDayKey(date, timeZone);
}

function emptySales(source: SalesResult["source"] = "shopify"): SalesResult {
  return {
    totalSales: 0,
    grossSales: 0,
    grossSalesKnown: true,
    netSales: 0,
    salesBasisUsed: "net",
    orderCount: 0,
    newCustomers: 0,
    returningCustomers: 0,
    newCustomerNetSales: 0,
    returningCustomerNetSales: 0,
    guestOrders: 0,
    customerMetricsAvailable: false,
    source,
  };
}

function isCustomerScopeError(errors: Array<{ message?: string }> | undefined): boolean {
  return Boolean(
    errors?.some((e) => /read_customers|customer field/i.test(String(e.message ?? ""))),
  );
}

function accumulateCustomerMix(
  edges: NonNullable<NonNullable<OrdersSalesJson["data"]>["orders"]>["edges"],
  customers: Map<string, CustomerAccum>,
): number {
  let guestOrders = 0;
  for (const edge of edges ?? []) {
    const customerId = edge.node?.customer?.id;
    if (!customerId) {
      guestOrders += 1;
      continue;
    }
    const lifetimeRaw = edge.node?.customer?.numberOfOrders;
    const lifetimeOrders =
      typeof lifetimeRaw === "number"
        ? lifetimeRaw
        : Number.parseInt(String(lifetimeRaw ?? "0"), 10) || 0;
    const netAmount = orderNetAmount(edge.node);
    const prev = customers.get(customerId);
    if (prev) {
      prev.ordersInPeriod += 1;
      prev.lifetimeOrders = Math.max(prev.lifetimeOrders, lifetimeOrders);
      prev.netSalesInPeriod += netAmount;
    } else {
      customers.set(customerId, {
        lifetimeOrders,
        ordersInPeriod: 1,
        netSalesInPeriod: netAmount,
      });
    }
  }
  return guestOrders;
}

function mixFromCustomerMap(
  customers: Map<string, CustomerAccum>,
  guestOrders: number,
): {
  newCustomers: number;
  returningCustomers: number;
  newCustomerNetSales: number;
  returningCustomerNetSales: number;
  guestOrders: number;
  available: boolean;
} {
  let newCustomers = 0;
  let returningCustomers = 0;
  let newCustomerNetSales = 0;
  let returningCustomerNetSales = 0;
  for (const {
    lifetimeOrders,
    ordersInPeriod,
    netSalesInPeriod,
  } of customers.values()) {
    if (lifetimeOrders <= ordersInPeriod) {
      newCustomers += 1;
      newCustomerNetSales += netSalesInPeriod;
    } else {
      returningCustomers += 1;
      returningCustomerNetSales += netSalesInPeriod;
    }
  }
  return {
    newCustomers,
    returningCustomers,
    newCustomerNetSales,
    returningCustomerNetSales,
    guestOrders,
    available: true,
  };
}

/**
 * HARD-STOP desk budget for open-day ("today") live top-up.
 * One GraphQL page = ≤100 orders — cheap enough for paint; high-volume shops may
 * undercount today until the closed-day SalesDayFact lands. Never use unbounded
 * pagination for multi-day / L12M / 3yr windows on desk nav.
 */
export const LIVE_TODAY_MAX_PAGES = 1;

export type FetchShopifySalesOptions = {
  /**
   * Stop after this many `orders(first: 100)` pages. Required for any desk-paint
   * live call (today top-up). Omit only for single-day ingest/backfill that already
   * scopes the query to one closed shop-local day.
   */
  maxPages?: number;
};

/**
 * Sum Shopify order totals for a date range via Admin GraphQL.
 * Action numerator = net (`currentTotalPriceSet`); gross (`totalPriceSet`) is
 * Ads Manager–comparable secondary. Prefers one ORDERS_FULL crawl; falls back
 * to sales + customer dual crawl when read_customers is denied.
 *
 * HARD-STOP: desk nav must not call this for full multi-year / incomplete periods —
 * serve SalesDayFact (+ capped today via `maxPages: LIVE_TODAY_MAX_PAGES`) instead.
 */
export async function fetchShopifySales(
  admin: AdminApiContext,
  range: DateRange,
  options?: FetchShopifySalesOptions,
): Promise<SalesResult> {
  const query = formatPeriodQuery(range);
  const maxPages = options?.maxPages;

  // Preferred: single crawl with opaque customer fields.
  try {
    let cursor: string | null = null;
    let pages = 0;
    let netSales = 0;
    let grossSales = 0;
    let orderCount = 0;
    let guestOrders = 0;
    let truncatedByPageCap = false;
    const customers = new Map<string, CustomerAccum>();

    do {
      pages += 1;
      const json = await adminGraphqlJson(admin, ORDERS_FULL_QUERY, {
        query,
        cursor,
      });

      if (json.errors?.length) {
        if (isCustomerScopeError(json.errors)) {
          throw new Error("CUSTOMER_SCOPE_FALLBACK");
        }
        throw new Error(
          json.errors.map((e) => e.message).filter(Boolean).join("; ") ||
            "Shopify GraphQL error",
        );
      }

      const orders = json.data?.orders;
      if (!orders) {
        throw new Error("Failed to fetch orders from Shopify Admin API");
      }

      for (const edge of orders.edges ?? []) {
        const gross = parseMoneyAmount(edge.node?.totalPriceSet);
        // Prefer net (after returns); fall back to gross when currentTotal is missing.
        netSales += orderNetAmount(edge.node);
        grossSales += gross;
        orderCount += 1;
      }
      guestOrders += accumulateCustomerMix(orders.edges, customers);

      const hasNext = Boolean(orders.pageInfo?.hasNextPage);
      cursor = hasNext ? (orders.pageInfo?.endCursor ?? null) : null;
      // Cap: drop remaining pages rather than crawl 100k–1M orders on desk paint.
      if (maxPages != null && pages >= maxPages && hasNext) {
        truncatedByPageCap = true;
        cursor = null;
      }
    } while (cursor);

    const mix = mixFromCustomerMap(customers, guestOrders);
    return {
      totalSales: netSales,
      netSales,
      grossSales,
      grossSalesKnown: true,
      salesBasisUsed: "net",
      orderCount,
      newCustomers: mix.newCustomers,
      returningCustomers: mix.returningCustomers,
      newCustomerNetSales: mix.newCustomerNetSales,
      returningCustomerNetSales: mix.returningCustomerNetSales,
      guestOrders: mix.guestOrders,
      customerMetricsAvailable: mix.available,
      source: "shopify",
      ...(truncatedByPageCap ? { truncatedByPageCap: true } : {}),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const customerDenied =
      msg === "CUSTOMER_SCOPE_FALLBACK" ||
      /read_customers|customer field/i.test(msg);
    if (!customerDenied) {
      throw err instanceof Error ? err : new Error(msg);
    }
    // Fall through to sales-only + customer dual crawl.
  }

  let cursor: string | null = null;
  let pages = 0;
  let netSales = 0;
  let grossSales = 0;
  let orderCount = 0;
  let truncatedByPageCap = false;

  do {
    pages += 1;
    const json = await adminGraphqlJson(admin, ORDERS_SALES_QUERY, {
      query,
      cursor,
    });

    if (json.errors?.length) {
      throw new Error(
        json.errors.map((e) => e.message).filter(Boolean).join("; ") ||
          "Shopify GraphQL error",
      );
    }

    const orders = json.data?.orders;
    if (!orders) {
      throw new Error("Failed to fetch orders from Shopify Admin API");
    }

    for (const edge of orders.edges ?? []) {
      const gross = parseMoneyAmount(edge.node?.totalPriceSet);
      netSales += orderNetAmount(edge.node);
      grossSales += gross;
      orderCount += 1;
    }

    const hasNext = Boolean(orders.pageInfo?.hasNextPage);
    cursor = hasNext ? (orders.pageInfo?.endCursor ?? null) : null;
    if (maxPages != null && pages >= maxPages && hasNext) {
      truncatedByPageCap = true;
      cursor = null;
    }
  } while (cursor);

  // Customer mix crawl is also unbounded — skip it when the sales crawl was capped
  // (desk today top-up never needs unique new/returning on paint).
  if (maxPages != null) {
    return {
      totalSales: netSales,
      netSales,
      grossSales,
      grossSalesKnown: true,
      salesBasisUsed: "net",
      orderCount,
      newCustomers: 0,
      returningCustomers: 0,
      newCustomerNetSales: 0,
      returningCustomerNetSales: 0,
      guestOrders: 0,
      customerMetricsAvailable: false,
      source: "shopify",
      ...(truncatedByPageCap ? { truncatedByPageCap: true } : {}),
    };
  }

  const customerStats = await fetchCustomerMix(admin, query);

  return {
    totalSales: netSales,
    netSales,
    grossSales,
    grossSalesKnown: true,
    salesBasisUsed: "net",
    orderCount,
    newCustomers: customerStats.newCustomers,
    returningCustomers: customerStats.returningCustomers,
    newCustomerNetSales: customerStats.newCustomerNetSales,
    returningCustomerNetSales: customerStats.returningCustomerNetSales,
    guestOrders: customerStats.guestOrders,
    customerMetricsAvailable: customerStats.available,
    source: "shopify",
  };
}

async function fetchCustomerMix(
  admin: AdminApiContext,
  query: string,
): Promise<{
  newCustomers: number;
  returningCustomers: number;
  newCustomerNetSales: number;
  returningCustomerNetSales: number;
  guestOrders: number;
  available: boolean;
}> {
  let cursor: string | null = null;
  let guestOrders = 0;
  const customers = new Map<string, CustomerAccum>();
  const unavailable = {
    newCustomers: 0,
    returningCustomers: 0,
    newCustomerNetSales: 0,
    returningCustomerNetSales: 0,
    guestOrders: 0,
    available: false as const,
  };

  try {
    do {
      const json = await adminGraphqlJson(admin, ORDERS_CUSTOMER_QUERY, {
        query,
        cursor,
      });

      if (json.errors?.length) {
        if (isCustomerScopeError(json.errors)) {
          return unavailable;
        }
        // Non-scope errors: don't fail the whole desk — sales already loaded.
        return unavailable;
      }

      const orders = json.data?.orders;
      if (!orders) {
        return unavailable;
      }

      guestOrders += accumulateCustomerMix(orders.edges, customers);

      cursor = orders.pageInfo?.hasNextPage
        ? (orders.pageInfo.endCursor ?? null)
        : null;
    } while (cursor);
  } catch {
    return unavailable;
  }

  return mixFromCustomerMap(customers, guestOrders);
}

/**
 * Daily till sales for the channel-stack spine (closed-day MER = net sales ÷ spend).
 * Uses `currentTotalPriceSet` (net) for facts consistency with period Total ROAS.
 * Same read_orders scope as period totals; groups by shop IANA calendar day of createdAt
 * (never server-local TZ — Fly is UTC; merchants are often America/*).
 *
 * HARD-STOP: desk Cash MER nav must not call this for explorer/period windows —
 * use `getSalesFactsByDay` instead. Unbounded `first:100` loops die at 100k–1M orders.
 */
export async function fetchShopifySalesByDay(
  admin: AdminApiContext,
  range: DateRange,
  timeZone: string,
  options?: FetchShopifySalesOptions,
): Promise<Map<string, number>> {
  const query = formatPeriodQuery(range);
  let cursor: string | null = null;
  let pages = 0;
  const maxPages = options?.maxPages;
  const map = new Map<string, number>();

  do {
    pages += 1;
    const json = await adminGraphqlJson(admin, ORDERS_SALES_QUERY, {
      query,
      cursor,
    });

    if (json.errors?.length) {
      throw new Error(
        json.errors.map((e) => e.message).filter(Boolean).join("; ") ||
          "Shopify GraphQL error",
      );
    }

    const orders = json.data?.orders;
    if (!orders) {
      throw new Error("Failed to fetch orders from Shopify Admin API");
    }

    for (const edge of orders.edges ?? []) {
      // Net for by-day facts; fall back to gross only when currentTotal is absent.
      const amount = orderNetAmount(edge.node);
      const key = shopLocalDayKeyFromIso(edge.node?.createdAt ?? "", timeZone);
      if (!key || !Number.isFinite(amount)) continue;
      map.set(key, (map.get(key) ?? 0) + amount);
    }

    cursor = orders.pageInfo?.hasNextPage
      ? (orders.pageInfo.endCursor ?? null)
      : null;
    if (maxPages != null && pages >= maxPages) {
      cursor = null;
    }
  } while (cursor);

  return map;
}

export { emptySales };
