import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { formatPeriodQuery, type DateRange } from "./periods";
import { shopLocalDayKey } from "./shop-local-day";

export {
  shopLocalDayKey,
  shopLocalDayRange,
  listRecentClosedShopLocalDays,
} from "./shop-local-day";

export interface SalesResult {
  totalSales: number;
  orderCount: number;
  /** Unique customers whose first-ever order falls in this period (cash desk definition). */
  newCustomers: number;
  /** Unique customers who ordered in this period and had prior orders. */
  returningCustomers: number;
  /** Orders with no customer (guest checkout) — excluded from new/returning. */
  guestOrders: number;
  /** True when customer fields were readable (needs read_customers). */
  customerMetricsAvailable: boolean;
  source: "shopify" | "mock";
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
          customer {
            id
            numberOfOrders
          }
        }
      }
    }
  }
`;

type OrdersSalesJson = {
  data?: {
    orders?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      edges?: Array<{
        node?: {
          id?: string;
          createdAt?: string;
          totalPriceSet?: { shopMoney?: { amount?: string } };
          customer?: {
            id?: string;
            numberOfOrders?: number | string | null;
          } | null;
        };
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

/** Bucket an order `createdAt` ISO into a shop-local YYYY-MM-DD day key. */
export function shopLocalDayKeyFromIso(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return shopLocalDayKey(date, timeZone);
}

function emptySales(source: SalesResult["source"] = "shopify"): SalesResult {
  return {
    totalSales: 0,
    orderCount: 0,
    newCustomers: 0,
    returningCustomers: 0,
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
  customers: Map<string, { lifetimeOrders: number; ordersInPeriod: number }>,
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
    const prev = customers.get(customerId);
    if (prev) {
      prev.ordersInPeriod += 1;
      prev.lifetimeOrders = Math.max(prev.lifetimeOrders, lifetimeOrders);
    } else {
      customers.set(customerId, { lifetimeOrders, ordersInPeriod: 1 });
    }
  }
  return guestOrders;
}

function mixFromCustomerMap(
  customers: Map<string, { lifetimeOrders: number; ordersInPeriod: number }>,
  guestOrders: number,
): {
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  available: boolean;
} {
  let newCustomers = 0;
  let returningCustomers = 0;
  for (const { lifetimeOrders, ordersInPeriod } of customers.values()) {
    if (lifetimeOrders <= ordersInPeriod) newCustomers += 1;
    else returningCustomers += 1;
  }
  return {
    newCustomers,
    returningCustomers,
    guestOrders,
    available: true,
  };
}

/**
 * Sum Shopify order totals for a date range via Admin GraphQL.
 * Prefers one ORDERS_FULL crawl; falls back to sales + customer dual crawl
 * when read_customers is denied.
 */
export async function fetchShopifySales(
  admin: AdminApiContext,
  range: DateRange,
): Promise<SalesResult> {
  const query = formatPeriodQuery(range);

  // Preferred: single crawl with opaque customer fields.
  try {
    let cursor: string | null = null;
    let totalSales = 0;
    let orderCount = 0;
    let guestOrders = 0;
    const customers = new Map<
      string,
      { lifetimeOrders: number; ordersInPeriod: number }
    >();

    do {
      const response = await admin.graphql(ORDERS_FULL_QUERY, {
        variables: { query, cursor },
      });
      const json = (await response.json()) as OrdersSalesJson;

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
        const amount = parseFloat(
          edge.node?.totalPriceSet?.shopMoney?.amount ?? "0",
        );
        totalSales += Number.isFinite(amount) ? amount : 0;
        orderCount += 1;
      }
      guestOrders += accumulateCustomerMix(orders.edges, customers);

      cursor = orders.pageInfo?.hasNextPage
        ? (orders.pageInfo.endCursor ?? null)
        : null;
    } while (cursor);

    const mix = mixFromCustomerMap(customers, guestOrders);
    return {
      totalSales,
      orderCount,
      newCustomers: mix.newCustomers,
      returningCustomers: mix.returningCustomers,
      guestOrders: mix.guestOrders,
      customerMetricsAvailable: mix.available,
      source: "shopify",
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
  let totalSales = 0;
  let orderCount = 0;

  do {
    const response = await admin.graphql(ORDERS_SALES_QUERY, {
      variables: { query, cursor },
    });
    const json = (await response.json()) as OrdersSalesJson;

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
      const amount = parseFloat(edge.node?.totalPriceSet?.shopMoney?.amount ?? "0");
      totalSales += Number.isFinite(amount) ? amount : 0;
      orderCount += 1;
    }

    cursor = orders.pageInfo?.hasNextPage
      ? (orders.pageInfo.endCursor ?? null)
      : null;
  } while (cursor);

  const customerStats = await fetchCustomerMix(admin, query);

  return {
    totalSales,
    orderCount,
    newCustomers: customerStats.newCustomers,
    returningCustomers: customerStats.returningCustomers,
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
  guestOrders: number;
  available: boolean;
}> {
  let cursor: string | null = null;
  let guestOrders = 0;
  const customers = new Map<string, { lifetimeOrders: number; ordersInPeriod: number }>();

  try {
    do {
      const response = await admin.graphql(ORDERS_CUSTOMER_QUERY, {
        variables: { query, cursor },
      });
      const json = (await response.json()) as OrdersSalesJson;

      if (json.errors?.length) {
        if (isCustomerScopeError(json.errors)) {
          return {
            newCustomers: 0,
            returningCustomers: 0,
            guestOrders: 0,
            available: false,
          };
        }
        // Non-scope errors: don't fail the whole desk — sales already loaded.
        return {
          newCustomers: 0,
          returningCustomers: 0,
          guestOrders: 0,
          available: false,
        };
      }

      const orders = json.data?.orders;
      if (!orders) {
        return {
          newCustomers: 0,
          returningCustomers: 0,
          guestOrders: 0,
          available: false,
        };
      }

      guestOrders += accumulateCustomerMix(orders.edges, customers);

      cursor = orders.pageInfo?.hasNextPage
        ? (orders.pageInfo.endCursor ?? null)
        : null;
    } while (cursor);
  } catch {
    return {
      newCustomers: 0,
      returningCustomers: 0,
      guestOrders: 0,
      available: false,
    };
  }

  return mixFromCustomerMap(customers, guestOrders);
}

/**
 * Daily till sales for the channel-stack spine (closed-day MER = sales ÷ spend).
 * Same read_orders scope as period totals; groups by shop IANA calendar day of createdAt
 * (never server-local TZ — Fly is UTC; merchants are often America/*).
 */
export async function fetchShopifySalesByDay(
  admin: AdminApiContext,
  range: DateRange,
  timeZone: string,
): Promise<Map<string, number>> {
  const query = formatPeriodQuery(range);
  let cursor: string | null = null;
  const map = new Map<string, number>();

  do {
    const response = await admin.graphql(ORDERS_SALES_QUERY, {
      variables: { query, cursor },
    });
    const json = (await response.json()) as OrdersSalesJson;

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
      const amount = parseFloat(edge.node?.totalPriceSet?.shopMoney?.amount ?? "0");
      const key = shopLocalDayKeyFromIso(edge.node?.createdAt ?? "", timeZone);
      if (!key || !Number.isFinite(amount)) continue;
      map.set(key, (map.get(key) ?? 0) + amount);
    }

    cursor = orders.pageInfo?.hasNextPage
      ? (orders.pageInfo.endCursor ?? null)
      : null;
  } while (cursor);

  return map;
}

export { emptySales };
