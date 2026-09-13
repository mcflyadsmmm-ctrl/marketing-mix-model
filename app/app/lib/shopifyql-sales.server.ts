/**
 * Live ShopifyQL day sales — same grain as Shopify Admin Analytics.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { adminGraphqlJson } from "./shopify-graphql-cost.server";
import {
  buildShopifyQlSalesDaysQuery,
  parseShopifyQlSalesDayRows,
  type ShopifyQlSalesDayRow,
} from "./shopifyql-sales";

const SHOPIFYQL_SALES_DAYS_QUERY = `#graphql
  query McflyShopifyQlSalesDays($query: String!) {
    shopifyqlQuery(query: $query) {
      tableData {
        rows
      }
      parseErrors
    }
  }
`;

type ShopifyQlSalesDaysJson = {
  data?: {
    shopifyqlQuery?: {
      tableData?: { rows?: Array<Record<string, unknown>> | null } | null;
      parseErrors?: string[] | null;
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

/**
 * Fetch Analytics day totals for an inclusive shop-local day span.
 * Returns null when ShopifyQL is unavailable or parse fails — callers fall back.
 */
export async function fetchShopifyQlSalesByDay(
  admin: AdminApiContext,
  args: { sinceDayKey: string; untilDayKey: string },
): Promise<Map<string, ShopifyQlSalesDayRow> | null> {
  let ql: string;
  try {
    ql = buildShopifyQlSalesDaysQuery(args);
  } catch {
    return null;
  }

  try {
    const json = await adminGraphqlJson<ShopifyQlSalesDaysJson>(
      admin,
      SHOPIFYQL_SALES_DAYS_QUERY,
      { query: ql },
    );
    if (json.errors?.length) {
      console.warn(
        "[shopifyql] GraphQL errors:",
        json.errors.map((e) => e.message ?? "unknown").join("; "),
      );
      return null;
    }
    const payload = json.data?.shopifyqlQuery;
    if (!payload) return null;
    if (payload.parseErrors?.length) {
      console.warn(
        "[shopifyql] parseErrors:",
        payload.parseErrors.join("; "),
      );
      return null;
    }
    const rows = payload.tableData?.rows;
    // Empty rows are not "every day is $0" — TIMESERIES often omits days.
    // Treat as unavailable so callers keep crawl / skip spot-check probes.
    if (!rows || rows.length === 0) return null;
    const map = parseShopifyQlSalesDayRows(rows);
    if (map.size === 0) return null;
    return map;
  } catch {
    return null;
  }
}

/**
 * One closed day via ShopifyQL, or null when unavailable / omitted.
 * Absence must NOT become a synthetic $0 — that seals real revenue as quiet.
 */
export async function fetchShopifyQlSalesDay(
  admin: AdminApiContext,
  dayKey: string,
): Promise<ShopifyQlSalesDayRow | null> {
  const map = await fetchShopifyQlSalesByDay(admin, {
    sinceDayKey: dayKey,
    untilDayKey: dayKey,
  });
  if (!map) return null;
  return map.get(dayKey) ?? null;
}
