/**
 * Growth-owned loader add-on: come-back depth over a trailing order-history
 * window, independent of the (hidden) period slicer.
 *
 * Growth hides the period control, and "who came back within 30 days" is a
 * retention question, not a calendar-month slice — a month-to-date window
 * cannot hold a first-timer with a full 30 days to return. So the come-back
 * stats read the trailing ~90 days of OrderFacts (Sample or live), which is
 * also what packs the Snowdevil SAMPLE walkthrough.
 *
 * Reuses `loadDeskSalesPage` for period sales/metrics — this only adds one
 * OrderFact query plus pure depth math. No spend, no ROAS.
 */

import { ensureShop } from "./mer-dashboard.server";
import { deskPeriodTimeZone } from "./periods";
import { loadOrderDepthRows, ORDER_FACT_SOURCE } from "./order-facts.server";
import { requireAdmin } from "./public-app-gate.server";
import { shopifyDepthStats, type ShopifyDepthStats } from "./shopify-depth-stats";
import { GROWTH_COMEBACK_WINDOW_DAYS } from "./growth-comeback";

export type GrowthComeback = {
  depth: ShopifyDepthStats;
  windowDays: number;
};

const DAY_MS = 86_400_000;

/**
 * Come-back depth for the Growth tab. `windowEnd` aligns with the page's
 * "as of" instant (period end) so the trailing window ends where sales do.
 */
export async function loadGrowthComeback(
  request: Request,
  options: { useSampleDesk: boolean; windowEnd: Date },
): Promise<GrowthComeback> {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const deskTz = deskPeriodTimeZone(options.useSampleDesk, shop.ianaTimezone);
  const end = options.windowEnd;
  const start = new Date(end.getTime() - GROWTH_COMEBACK_WINDOW_DAYS * DAY_MS);
  const source = options.useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const rows = await loadOrderDepthRows(shop.id, { start, end }, source);

  // Come-back fields (days-to-second, 30-day rate, 2nd/3rd+ mix, first/second
  // medians) depend only on the order rows + windowEnd — not on period sales
  // totals — so an order-sum stand-in for totals is enough here.
  const orderSum = rows.reduce(
    (sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0),
    0,
  );
  const depth = shopifyDepthStats({
    orders: rows,
    totalSales: orderSum,
    netSales: orderSum,
    netSalesKnown: false,
    grossSales: 0,
    grossSalesKnown: false,
    timeZone: deskTz,
    windowEnd: end,
  });

  return { depth, windowDays: GROWTH_COMEBACK_WINDOW_DAYS };
}
