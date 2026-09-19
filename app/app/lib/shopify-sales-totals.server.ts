import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { adminGraphqlJson } from "./shopify-graphql-cost.server";
import {
  isReportsScopeMessage,
  mergeCustomerSplitIntoDayTotals,
  parseSalesDayCustomerSplit,
  parseSalesDayTotals,
  salesDayCustomerSplitQuery,
  salesDayTotalsQuery,
  salesTotalsYearChunks,
  type SalesDayTotal,
} from "./shopify-sales-totals";

const SALES_DAY_TOTALS_QUERY = `#graphql
  query McflySalesDayTotals($query: String!) {
    shopifyqlQuery(query: $query) {
      tableData {
        columns { name dataType }
        rows
      }
      parseErrors
    }
  }
`;

type ShopifyqlJson = {
  errors?: { message?: string }[];
  data?: {
    shopifyqlQuery?: {
      tableData?: {
        rows?: Array<Record<string, string | null>> | null;
      } | null;
      parseErrors?: string[] | null;
    } | null;
  };
};

export class ShopifyReportsScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyReportsScopeError";
  }
}

function throwIfShopifyqlFailed(json: ShopifyqlJson): void {
  const graphqlMessage = json.errors?.map((e) => e.message).filter(Boolean).join("; ") ?? "";
  if (graphqlMessage) {
    if (isReportsScopeMessage(graphqlMessage)) {
      throw new ShopifyReportsScopeError(graphqlMessage);
    }
    throw new Error(graphqlMessage);
  }
  const parsed = json.data?.shopifyqlQuery?.parseErrors?.filter(Boolean) ?? [];
  if (parsed.length > 0) {
    const message = parsed.join("; ");
    if (isReportsScopeMessage(message)) throw new ShopifyReportsScopeError(message);
    throw new Error(message);
  }
}

/**
 * Day totals for an inclusive YYYY-MM-DD span. Does not read `orders`.
 * Second ShopifyQL query fills New/Returning Total Sales $ (order-based split).
 * Throws {@link ShopifyReportsScopeError} when the token lacks `read_reports`.
 */
export async function fetchShopifySalesDayTotals(
  admin: AdminApiContext,
  range: { since: string; until: string },
): Promise<Map<string, SalesDayTotal>> {
  const out = new Map<string, SalesDayTotal>();
  for (const chunk of salesTotalsYearChunks(range.since, range.until)) {
    const totalsJson = await adminGraphqlJson<ShopifyqlJson>(admin, SALES_DAY_TOTALS_QUERY, {
      query: salesDayTotalsQuery(chunk.since, chunk.until),
    });
    throwIfShopifyqlFailed(totalsJson);
    for (const row of parseSalesDayTotals(totalsJson.data?.shopifyqlQuery?.tableData?.rows)) {
      out.set(row.dayKey, row);
    }

    // Lightweight second query — New/Returning $ without paging orders(first:100).
    const splitJson = await adminGraphqlJson<ShopifyqlJson>(admin, SALES_DAY_TOTALS_QUERY, {
      query: salesDayCustomerSplitQuery(chunk.since, chunk.until),
    });
    throwIfShopifyqlFailed(splitJson);
    mergeCustomerSplitIntoDayTotals(
      out,
      parseSalesDayCustomerSplit(splitJson.data?.shopifyqlQuery?.tableData?.rows),
    );
  }
  return out;
}
