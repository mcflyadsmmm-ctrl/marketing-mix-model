/**
 * Customers-owned loader add-on: retention + value analytics over a trailing
 * order-history window, plus RFM-lite / whale watchlist over the full stored
 * book, independent of the (hidden) period slicer.
 *
 * "When do they come back" and the mix marquee stay a trailing ~90-day read
 * (a month-to-date window cannot hold a repurchase cadence). RFM-lite and the
 * watchlist read the full stored OrderFact book — year / long recency when
 * `read_all_orders` has filled it. Thin shops stay honest empties, never a
 * fake lifetime.
 *
 * Reuses `loadDeskSalesPage` for period sales/metrics — this only adds one
 * OrderFact query plus pure analytics math. Order history only. No spend, no ROAS.
 */

import { ensureShop } from "./mer-dashboard.server";
import {
  getOrderBackfillHistoryLimited,
  loadOrderDepthRows,
  ORDER_FACT_SOURCE,
} from "./order-facts.server";
import { requireAdmin } from "./public-app-gate.server";
import {
  buildCustomerAnalytics,
  type CustomerAnalytics,
  type RetentionOrderRow,
} from "./customers-analytics";
import { buildCustomerRfm, type CustomerRfmView } from "./customers-rfm";

const DAY_MS = 86_400_000;

/** Trailing window for mix / repurchase / existing whale recency buckets. */
export const CUSTOMERS_ANALYTICS_WINDOW_DAYS = 90;

export type CustomerPageAnalytics = CustomerAnalytics & {
  rfm: CustomerRfmView;
};

function toRetentionRows(
  rows: Array<{ customerKey: string; orderedAt: Date; amount: number }>,
): RetentionOrderRow[] {
  return rows.map((row) => ({
    customerKey: row.customerKey,
    orderedAt: row.orderedAt,
    amount: row.amount,
  }));
}

/**
 * Retention + value analytics for the Customers tab. `windowEnd` aligns with
 * the page's "as of" instant (period end) so the trailing window ends where
 * sales do. RFM-lite uses the same rows without a 90-day cap.
 */
export async function loadCustomerAnalytics(
  request: Request,
  options: { useSampleDesk: boolean; windowEnd: Date },
): Promise<CustomerPageAnalytics> {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const end = options.windowEnd;
  const source = options.useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const rows = await loadOrderDepthRows(shop.id, { end }, source);
  const mapped = toRetentionRows(rows);
  const recentStart = end.getTime() - CUSTOMERS_ANALYTICS_WINDOW_DAYS * DAY_MS;
  const recent = mapped.filter((row) => row.orderedAt.getTime() >= recentStart);
  const historyLimited = options.useSampleDesk
    ? false
    : await getOrderBackfillHistoryLimited(shop.id);

  return {
    ...buildCustomerAnalytics(recent, {
      windowEnd: end,
      historyWindowDays: CUSTOMERS_ANALYTICS_WINDOW_DAYS,
    }),
    rfm: buildCustomerRfm(mapped, { windowEnd: end, historyLimited }),
  };
}
