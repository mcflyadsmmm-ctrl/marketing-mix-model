/**
 * Customers-owned loader add-on: retention + value analytics over a trailing
 * order-history window, independent of the (hidden) period slicer.
 *
 * "When do they come back", "who to save", spend bands, order frequency, and
 * whale recency are lifetime-of-relationship questions, not a calendar-month
 * slice — a month-to-date window cannot hold a repurchase cadence. So this reads
 * the trailing ~90 days of OrderFacts (Sample or live), which is also what packs
 * the Snowdevil SAMPLE walkthrough.
 *
 * Reuses `loadDeskSalesPage` for period sales/metrics — this only adds one
 * OrderFact query plus pure analytics math. Order history only. No spend, no ROAS.
 */

import { ensureShop } from "./mer-dashboard.server";
import { loadOrderDepthRows, ORDER_FACT_SOURCE } from "./order-facts.server";
import { requireAdmin } from "./public-app-gate.server";
import {
  buildCustomerAnalytics,
  type CustomerAnalytics,
} from "./customers-analytics";

const DAY_MS = 86_400_000;

/** Trailing order-history window Customers analytics read. */
export const CUSTOMERS_ANALYTICS_WINDOW_DAYS = 90;

/**
 * Retention + value analytics for the Customers tab. `windowEnd` aligns with
 * the page's "as of" instant (period end) so the trailing window ends where
 * sales do.
 */
export async function loadCustomerAnalytics(
  request: Request,
  options: { useSampleDesk: boolean; windowEnd: Date },
): Promise<CustomerAnalytics> {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const end = options.windowEnd;
  const start = new Date(end.getTime() - CUSTOMERS_ANALYTICS_WINDOW_DAYS * DAY_MS);
  const source = options.useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const rows = await loadOrderDepthRows(shop.id, { start, end }, source);

  return buildCustomerAnalytics(
    rows.map((row) => ({
      customerKey: row.customerKey,
      orderedAt: row.orderedAt,
      amount: row.amount,
    })),
    { windowEnd: end, historyWindowDays: CUSTOMERS_ANALYTICS_WINDOW_DAYS },
  );
}
