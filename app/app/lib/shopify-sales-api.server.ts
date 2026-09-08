import { unauthenticated } from "../shopify.server";
import { ensureShop } from "./mer-dashboard.server";
import type { DateRange } from "./periods";
import {
  loadDeskSalesForPeriod,
  type SalesFactsCoverage,
} from "./sales-facts.server";
import { shopLocalDayRange } from "./shop-local-day";

export type ShopSalesApiOk = {
  ok: true;
  totalSales: number;
  grossSales: number;
  netSales: number;
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  warning?: string;
  factsCoverage: SalesFactsCoverage | null;
};

export type ShopSalesApiFail = {
  ok: false;
  warning: string;
  factsCoverage: SalesFactsCoverage | null;
};

export type ShopSalesApiResult = ShopSalesApiOk | ShopSalesApiFail;

/**
 * Build an API query DateRange from YYYY-MM-DD keys.
 * Prefer shop IANA day bounds; fall back to UTC calendar-day bounds
 * (never host-local `T00:00:00` without Z).
 */
export function apiQueryDateRange(
  from: string,
  to: string,
  ianaTimezone?: string | null,
): DateRange {
  if (ianaTimezone) {
    return {
      start: shopLocalDayRange(from, ianaTimezone).start,
      end: shopLocalDayRange(to, ianaTimezone).end,
      label: `${from} → ${to}`,
    };
  }
  return {
    start: new Date(`${from}T00:00:00.000Z`),
    end: new Date(`${to}T23:59:59.999Z`),
    label: `${from} → ${to}`,
  };
}

/**
 * Incomplete closed-day facts inside the ingest window — fail-closed for API MER.
 * Long periods that exceed the fact window are disclosed separately (warning), not this gate.
 */
export function isSalesFactsIncompleteForApi(
  coverage: SalesFactsCoverage | null | undefined,
): boolean {
  // Fail-closed: coverage read failure / null must not paint MER as complete.
  if (coverage == null) return true;
  return (
    coverage.expectedClosedDays > 0 &&
    !coverage.complete &&
    !coverage.periodExceedsFactWindow
  );
}

function coverageWarnings(
  coverage: SalesFactsCoverage | null,
): string[] {
  if (!coverage) return [];
  const out: string[] = [];
  if (coverage.periodExceedsFactWindow) {
    out.push(
      "Period exceeds SalesDayFact ingest window — partial facts only",
    );
  } else if (
    coverage.expectedClosedDays > 0 &&
    !coverage.complete
  ) {
    out.push(
      `Sales facts incomplete (${coverage.factDays}/${coverage.expectedClosedDays} closed days)`,
    );
  }
  return out;
}

/**
 * Fetch Shopify sales for API + overnight worker using stored offline session.
 * HARD-STOP: SalesDayFact + capped today top-up via loadDeskSalesForPeriod —
 * never unbounded multi-day fetchShopifySales.
 *
 * Fail-closed: salesError / session failure → `{ ok: false }` (never silent $0 success).
 */
export async function fetchShopifySalesForShop(
  shopDomain: string,
  query: { from: string; to: string },
): Promise<ShopSalesApiResult> {
  try {
    const shop = await ensureShop(shopDomain);
    const range = apiQueryDateRange(query.from, query.to, shop.ianaTimezone);
    const { admin } = await unauthenticated.admin(shopDomain);
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
    });

    const warnings: string[] = [...coverageWarnings(desk.factsCoverage)];
    if (desk.todaySalesTruncated) {
      warnings.push(
        "Today sales truncated by page cap — refresh later for full day",
      );
    }
    if (desk.todaySalesUnavailable) {
      warnings.push("Today live sales unavailable — closed-day facts only");
    }

    if (desk.salesError) {
      warnings.unshift(desk.salesError);
      return {
        ok: false,
        warning: warnings.join("; "),
        factsCoverage: desk.factsCoverage,
      };
    }

    return {
      ok: true,
      totalSales: desk.sales.totalSales,
      grossSales: desk.sales.grossSales,
      netSales: desk.sales.netSales,
      orderCount: desk.sales.orderCount,
      newCustomers: desk.sales.newCustomers,
      returningCustomers: desk.sales.returningCustomers,
      guestOrders: desk.sales.guestOrders,
      factsCoverage: desk.factsCoverage,
      ...(warnings.length > 0 ? { warning: warnings.join("; ") } : {}),
    };
  } catch (err) {
    return {
      ok: false,
      warning:
        err instanceof Error
          ? err.message
          : "No Shopify session — install app on store first",
      factsCoverage: null,
    };
  }
}
