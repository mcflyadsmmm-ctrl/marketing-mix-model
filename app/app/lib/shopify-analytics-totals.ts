/**
 * Shopify Analytics day totals (Total / Net / Gross, QL New/Returning $).
 * PCD Level 2 is Approved and `read_reports` is requested so Live can paint
 * ShopifyQL day totals. SAMPLE desks never do — order-book first there.
 */
import type { ShopifyNativePeriodStats } from "./shopify-native-stats";

/** On after PCD L2 Approved. SAMPLE still returns false from {@link deskAnalyticsDayTotalsLive}. */
export const SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE = true;

export function deskAnalyticsDayTotalsLive(useSampleDesk: boolean): boolean {
  if (useSampleDesk) return false;
  return SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE;
}

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

/** SAMPLE withholds ShopifyQL New/Returning $. Live returns the book when the flag is on. */
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
