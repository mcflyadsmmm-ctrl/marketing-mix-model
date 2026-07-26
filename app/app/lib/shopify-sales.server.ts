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

function localDayKeyFromIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Shop-local calendar day key (YYYY-MM-DD) for a UTC instant, per IANA timezone.
 * Used by the SalesDayFact backfill so "today"/"closed day" boundaries are honest
 * to the merchant's store timezone rather than the server's local clock.
 */
export function shopLocalDayKey(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** UTC offset (minutes, localTime = UTC + offset) in effect for `instant` in `timeZone`. */
function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/**
 * UTC instant range covering exactly one shop-local calendar day (YYYY-MM-DD) —
 * the shared per-day range helper for SalesDayFact backfill and any other
 * shop-local-day fetch. Offset is resolved at local noon (stable across the rare
 * day that itself contains a DST transition) rather than at midnight.
 */
export function shopLocalDayRange(dateKey: string, timeZone: string): DateRange {
  const [y, m, d] = dateKey.split("-").map(Number);
  const noonGuess = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const offsetMin = tzOffsetMinutes(noonGuess, timeZone);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMin * 60_000);
  const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0) - offsetMin * 60_000 - 1);
  return { start, end, label: dateKey };
}

/**
 * Last `count` CLOSED shop-local calendar days (excludes the in-progress local
 * "today"), oldest first. Never uses server-local time — always resolves "today"
 * in `timeZone` so the window boundary matches the merchant's store day.
 */
export function listRecentClosedShopLocalDays(
  timeZone: string,
  count: number,
  now: Date = new Date(),
): string[] {
  const todayKey = shopLocalDayKey(now, timeZone);
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const days: string[] = [];
  for (let i = count; i >= 1; i--) {
    // Noon anchor avoids landing on a DST-skipped/repeated local hour when we
    // subtract whole days in UTC before re-deriving the local day key.
    const cursor = new Date(Date.UTC(ty, tm - 1, td - i, 12, 0, 0));
    days.push(shopLocalDayKey(cursor, timeZone));
  }
  return days;
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
 * Daily till sales for the channel-stack spine (closed-day MER = sales ÷ spend).
 * Same read_orders scope as period totals; groups by local calendar day of createdAt.
 */
export async function fetchShopifySalesByDay(
  admin: AdminApiContext,
  range: DateRange,
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
      const key = localDayKeyFromIso(edge.node?.createdAt ?? "");
      if (!key || !Number.isFinite(amount)) continue;
      map.set(key, (map.get(key) ?? 0) + amount);
    }

    cursor = orders.pageInfo?.hasNextPage
      ? (orders.pageInfo.endCursor ?? null)
      : null;
  } while (cursor);

  return map;
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
