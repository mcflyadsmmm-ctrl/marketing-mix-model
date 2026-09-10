/**
 * Shopify-true period stats that do not wait on spend uploads.
 *
 * Always-on with `read_orders` + `read_customers` (~60-day order window):
 * sales, orders, AOV, new vs returning counts and sales $, guest share,
 * Gross − Total (returns/edits), till LTV 30/90/365 + repeat rate, goals vs calendar.
 *
 * Shopify Analytics / ShopifyQL already shows (we do not copy as the hero):
 * mean AOV, order count, total/gross/net, returning_customer_rate (headcount),
 * sessions, conversion, products. Those need `read_reports` or the free
 * Analytics UI — not our scopes.
 *
 * Product contract (with `shopify-depth-stats.ts`): Overview tiles come from
 * this module + OrderFact depth. Total ROAS is Marketing, not the primary
 * dashboard output. Needs spend: Total ROAS, aMER, Cash CAC, LTV:CAC,
 * payback, allocation. Sales explorer paints without spend.
 *
 * Not sessions, conversion, traffic, or attributed ROAS — those need
 * Analytics / pixels we refuse.
 */

export type ShopifyNativePeriodInput = {
  sales: number;
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  customerMetricsAvailable: boolean;
  newCustomerNetSales: number;
  returningCustomerNetSales: number;
  grossSales: number;
  grossSalesKnown: boolean;
};

export type ShopifyNativePeriodStats = {
  orderCount: number;
  aov: number | null;
  newCustomers: number;
  returningCustomers: number;
  guestOrders: number;
  guestShare: number | null;
  newBuyerShare: number | null;
  newSalesShare: number | null;
  returningSalesShare: number | null;
  /**
   * Gross (`totalPriceSet`) minus Total (`currentTotalPriceSet`).
   * Positive when returns/edits pulled current totals below original order totals.
   */
  returnsDrag: number | null;
  returnsDragPct: number | null;
  customerMetricsAvailable: boolean;
  /** Window sales $ per unique new buyer — CSV “new AOV” mix-up. */
  newBuyerArpu: number | null;
  /** Window sales $ per unique returning buyer. */
  returningBuyerArpu: number | null;
};

export function shopifyNativePeriodStats(
  input: ShopifyNativePeriodInput,
): ShopifyNativePeriodStats {
  const orderCount = Number.isFinite(input.orderCount)
    ? Math.max(0, Math.trunc(input.orderCount))
    : 0;
  const sales = Number.isFinite(input.sales) ? input.sales : 0;
  const aov = orderCount > 0 ? sales / orderCount : null;

  const guestOrders = Number.isFinite(input.guestOrders)
    ? Math.max(0, Math.trunc(input.guestOrders))
    : 0;
  const guestShare = orderCount > 0 ? guestOrders / orderCount : null;

  const customerMetricsAvailable = input.customerMetricsAvailable === true;
  const newCustomers = customerMetricsAvailable
    ? Math.max(0, Math.trunc(input.newCustomers))
    : 0;
  const returningCustomers = customerMetricsAvailable
    ? Math.max(0, Math.trunc(input.returningCustomers))
    : 0;
  const knownBuyers = newCustomers + returningCustomers;
  const newBuyerShare =
    customerMetricsAvailable && knownBuyers > 0
      ? newCustomers / knownBuyers
      : null;

  const newSales = Number.isFinite(input.newCustomerNetSales)
    ? input.newCustomerNetSales
    : 0;
  const returningSales = Number.isFinite(input.returningCustomerNetSales)
    ? input.returningCustomerNetSales
    : 0;
  const hasSalesSplit =
    orderCount > 0 && (newSales > 0 || returningSales > 0 || sales > 0);
  const newSalesShare =
    hasSalesSplit && sales > 0 ? newSales / sales : null;
  const returningSalesShare =
    hasSalesSplit && sales > 0 ? returningSales / sales : null;

  const gross = input.grossSalesKnown && Number.isFinite(input.grossSales)
    ? input.grossSales
    : null;
  const returnsDrag =
    gross != null && sales >= 0 && gross > sales ? gross - sales : null;
  const returnsDragPct =
    returnsDrag != null && gross != null && gross > 0
      ? returnsDrag / gross
      : null;

  const newBuyerArpu =
    customerMetricsAvailable && newCustomers > 0
      ? newSales / newCustomers
      : null;
  const returningBuyerArpu =
    customerMetricsAvailable && returningCustomers > 0
      ? returningSales / returningCustomers
      : null;

  return {
    orderCount,
    aov,
    newCustomers,
    returningCustomers,
    guestOrders,
    guestShare,
    newBuyerShare,
    newSalesShare,
    returningSalesShare,
    returnsDrag,
    returnsDragPct,
    customerMetricsAvailable,
    newBuyerArpu,
    returningBuyerArpu,
  };
}

/**
 * Cash CPA = entered spend ÷ identified buyers in the window.
 * Shopify Analytics has no spend, so it cannot show this. Distinct from
 * Cash CAC (spend ÷ *new* buyers).
 */
export function cashCostPerCustomer(
  spend: number,
  identifiedBuyers: number,
): number | null {
  if (!(spend > 0) || !Number.isFinite(spend)) return null;
  const n = Number.isFinite(identifiedBuyers)
    ? Math.trunc(identifiedBuyers)
    : 0;
  if (n <= 0) return null;
  return spend / n;
}
