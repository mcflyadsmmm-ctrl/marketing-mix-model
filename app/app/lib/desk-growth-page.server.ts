/**
 * Growth-owned loader add-on: come-back depth over a trailing order-history
 * window, plus days-to-second / win-back over the full stored book,
 * independent of the (hidden) period slicer.
 *
 * Growth hides the period control, and "who came back within 30 days" is a
 * retention question, not a calendar-month slice — a month-to-date window
 * cannot hold a first-timer with a full 30 days to return. So the come-back
 * explorer still reads the trailing ~90 days of OrderFacts (Sample or live),
 * which is also what packs the Snowdevil SAMPLE walkthrough.
 *
 * The habit clock and win-back fall-off read the full stored book — year /
 * long fall-off when `read_all_orders` has filled it. Thin shops stay honest
 * empties, never a fake year.
 *
 * Reuses `loadDeskSalesPage` for period sales/metrics — this only adds one
 * OrderFact query plus pure depth / TT2 math. No spend, no ROAS.
 */

import { ensureShop } from "./mer-dashboard.server";
import { deskPeriodTimeZone } from "./periods";
import {
  getOrderBackfillHistoryLimited,
  loadOrderDepthRows,
  ORDER_FACT_SOURCE,
} from "./order-facts.server";
import { requireAdmin } from "./public-app-gate.server";
import { shopifyDepthStats, type ShopifyDepthStats } from "./shopify-depth-stats";
import { GROWTH_COMEBACK_WINDOW_DAYS } from "./growth-comeback";
import {
  buildGrowthTt2,
  type GrowthTt2OrderRow,
  type GrowthTt2View,
} from "./growth-tt2";

export type GrowthComeback = {
  depth: ShopifyDepthStats;
  windowDays: number;
  tt2: GrowthTt2View;
};

const DAY_MS = 86_400_000;

function toTt2Rows(
  rows: Array<{
    customerKey: string;
    orderedAt: Date;
    amount: number;
    shopLocalDate: Date;
  }>,
): GrowthTt2OrderRow[] {
  return rows.map((row) => ({
    customerKey: row.customerKey,
    orderedAt: row.orderedAt,
    amount: row.amount,
    shopLocalDate: row.shopLocalDate,
  }));
}

/**
 * Come-back depth + TT2 / win-back for the Growth tab. `windowEnd` aligns
 * with the page's "as of" instant (period end) so the trailing window ends
 * where sales do. TT2 uses the same rows without a 90-day cap.
 */
export async function loadGrowthComeback(
  request: Request,
  options: { useSampleDesk: boolean; windowEnd: Date },
): Promise<GrowthComeback> {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const deskTz = deskPeriodTimeZone(options.useSampleDesk, shop.ianaTimezone);
  const end = options.windowEnd;
  const source = options.useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const rows = await loadOrderDepthRows(shop.id, { end }, source);
  const recentStart = end.getTime() - GROWTH_COMEBACK_WINDOW_DAYS * DAY_MS;
  const recent = rows.filter((row) => row.orderedAt.getTime() >= recentStart);
  const historyLimited = options.useSampleDesk
    ? false
    : await getOrderBackfillHistoryLimited(shop.id);

  // Come-back fields (days-to-second, 30-day rate, 2nd/3rd+ mix, first/second
  // medians) depend only on the order rows + windowEnd — not on period sales
  // totals — so an order-sum stand-in for totals is enough here.
  const orderSum = recent.reduce(
    (sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0),
    0,
  );
  const depth = shopifyDepthStats({
    orders: recent,
    totalSales: orderSum,
    netSales: orderSum,
    netSalesKnown: false,
    grossSales: 0,
    grossSalesKnown: false,
    timeZone: deskTz,
    windowEnd: end,
  });

  return {
    depth,
    windowDays: GROWTH_COMEBACK_WINDOW_DAYS,
    tt2: buildGrowthTt2(toTt2Rows(rows), { windowEnd: end, historyLimited }),
  };
}
