import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { formatPeriodQuery, type DateRange } from "./periods";

export interface SalesResult {
  totalSales: number;
  orderCount: number;
  source: "shopify" | "mock";
}

const ORDERS_QUERY = `#graphql
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
 * Sum Shopify order totals for a date range via Admin GraphQL.
 * Paginates through orders (100 per page).
 */
export async function fetchShopifySales(
  admin: AdminApiContext["admin"],
  range: DateRange,
): Promise<SalesResult> {
  const query = formatPeriodQuery(range);
  let cursor: string | null = null;
  let totalSales = 0;
  let orderCount = 0;

  do {
    const response = await admin.graphql(ORDERS_QUERY, {
      variables: { query, cursor },
    });
    const json = await response.json();
    const orders = json.data?.orders;

    if (!orders) {
      throw new Error("Failed to fetch orders from Shopify Admin API");
    }

    for (const edge of orders.edges ?? []) {
      const amount = parseFloat(edge.node?.totalPriceSet?.shopMoney?.amount ?? "0");
      totalSales += amount;
      orderCount += 1;
    }

    cursor = orders.pageInfo?.hasNextPage ? orders.pageInfo.endCursor : null;
  } while (cursor);

  return { totalSales, orderCount, source: "shopify" };
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
    source: "mock",
  };
}
