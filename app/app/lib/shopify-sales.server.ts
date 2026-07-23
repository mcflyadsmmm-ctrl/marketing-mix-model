import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { formatPeriodQuery, type DateRange } from "./periods";

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

/** Sales + order count — works with read_orders alone. */
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

/**
 * Sum Shopify order totals for a date range via Admin GraphQL.
 * Sales/orders use read_orders only. New/returning need read_customers.
 */
export async function fetchShopifySales(
  admin: AdminApiContext,
  range: DateRange,
): Promise<SalesResult> {
  const query = formatPeriodQuery(range);
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

      for (const edge of orders.edges ?? []) {
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
 * Dev-only helper. Production loaders must not call this —
 * show $0 + error banner instead of fabricated revenue.
 */
export function mockSales(range: DateRange): SalesResult {
  const days = Math.max(
    1,
    Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  return {
    totalSales: days * 4200,
    orderCount: days * 12,
    newCustomers: days * 4,
    returningCustomers: days * 3,
    guestOrders: days,
    customerMetricsAvailable: true,
    source: "mock",
  };
}

export { emptySales };
