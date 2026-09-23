/**
 * Shopify Analytics day totals (Total / Net / Gross, QL New/Returning $).
 * Off until PCD Level 2 + `read_reports` — desk heroes stay order-book first.
 */

/** Flip when L2 lands and SalesDayFact rows are ShopifyQL-sourced. */
export const SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE = false;

export function deskAnalyticsDayTotalsLive(useSampleDesk: boolean): boolean {
  if (useSampleDesk) return false;
  return SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE;
}

/** Analytics sales clock — em dash until {@link deskAnalyticsDayTotalsLive}. */
import type { ShopifyNativePeriodStats } from "./shopify-native-stats";

export function deskAnalyticsSalesClockValues(input: {
  useSampleDesk: boolean;
  gross: number;
  grossKnown: boolean;
  total: number;
  net: number;
  netKnown: boolean;
}): {
  gross: number;
  grossKnown: boolean;
  total: number;
  net: number;
  netKnown: boolean;
} {
  if (deskAnalyticsDayTotalsLive(input.useSampleDesk)) {
    return {
      gross: input.gross,
      grossKnown: input.grossKnown,
      total: input.total,
      net: input.net,
      netKnown: input.netKnown,
    };
  }
  return {
    gross: 0,
    grossKnown: false,
    total: 0,
    net: 0,
    netKnown: false,
  };
}

/** Hide ShopifyQL New/Returning $ until L2 — order-book split stays on Customers. */
export function deskAnalyticsNativeBook(
  book: ShopifyNativePeriodStats,
  useSampleDesk: boolean,
): ShopifyNativePeriodStats {
  if (deskAnalyticsDayTotalsLive(useSampleDesk)) return book;
  return {
    ...book,
    customerMetricsAvailable: false,
    newSales: null,
    returningSales: null,
    newSalesShare: null,
    returningSalesShare: null,
    newBuyerShare: null,
    newBuyerArpu: null,
    returningBuyerArpu: null,
  };
}
