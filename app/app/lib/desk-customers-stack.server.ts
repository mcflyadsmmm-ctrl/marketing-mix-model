/**
 * Combined Customers stack loader — returning dollars, LTV 30/90/365, Growth
 * come-back, then RFM / LTV flagship depth. One Admin page.
 *
 * HARD-STOP: live path is loadDeskSalesPage → loadDeskSalesForPeriod
 * (same as Home / Close / Allocation). Never unbounded fetchShopifySales
 * for a multi-day period. SAMPLE path stays on fetchSampleSales inside
 * loadDeskSalesPage. orderFactsTruncated / scheduleFirstSessionShopifyWindow /
 * getOrderBackfillProgress live on that same helper.
 */

import {
  ensureShop,
  getOrCreateSettings,
  marginIsConfirmed,
} from "./mer-dashboard.server";
import { requireAdmin } from "./public-app-gate.server";
import { loadDeskSalesPage } from "./desk-sales-page.server";
import { loadCustomerAnalytics } from "./desk-customers-page.server";
import { loadGrowthComeback } from "./desk-growth-page.server";
import { loadLtvDepth } from "./ltv-depth-page.server";
import { readDeskMetricSnapshot } from "./desk-metric-snapshot.server";
import { emptyLiveCustomerBoards } from "./desk-stored-boards.server";
import { deskPeriodTimeZone } from "./periods";
import prisma from "../db.server";
import {
  parseCustomersPanel,
  customersPanelRedirectPath,
} from "./customers-first-viewport";

export { parseCustomersPanel, customersPanelRedirectPath };

export async function loadCustomersStackPage(
  request: Request,
  options?: { includeLtv?: boolean },
) {
  const includeLtv = options?.includeLtv !== false;
  const base = await loadDeskSalesPage(request, "/app/customers");
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const liveSpendCount = await prisma.spendEntry.count({
    where: { shopId: shop.id, NOT: { source: "sample" } },
  });
  if (!base.useSampleDesk) {
    const snap = await readDeskMetricSnapshot(shop.id, base.preset);
    const fallback = emptyLiveCustomerBoards({
      windowEnd: base.metrics.period.end,
      periodStart: base.metrics.period.start,
      periodEnd: base.metrics.period.end,
      timeZone: deskPeriodTimeZone(false, shop.ianaTimezone),
      historyLimited: Boolean(
        base.orderBackfillProgress?.historyLimited ||
          base.metrics.tillLtv.historyLimited,
      ),
    });
    const boards = snap?.boards ?? fallback;
    const url = new URL(request.url);
    const panel = parseCustomersPanel(url.searchParams.get("panel"));
    return {
      ...base,
      analytics: boards.analytics,
      comeback: boards.comeback,
      depth: includeLtv ? boards.depth : null,
      marginConfirmed: marginIsConfirmed(settings),
      hasLiveSpend: liveSpendCount > 0,
      installedAt: shop.createdAt.toISOString(),
      liveHistoryLocked: false,
      panel,
    };
  }
  const [analytics, comeback, depth] = await Promise.all([
      loadCustomerAnalytics(request, {
        useSampleDesk: base.useSampleDesk,
        windowEnd: base.metrics.period.end,
        periodStart: base.metrics.period.start,
        periodEnd: base.metrics.period.end,
      }),
      loadGrowthComeback(request, {
        useSampleDesk: base.useSampleDesk,
        windowEnd: base.metrics.period.end,
      }),
      includeLtv
        ? loadLtvDepth({
            shopId: shop.id,
            useSampleDesk: base.useSampleDesk,
            orderBookDepth: base.orderBookDepth,
            historyLimited: Boolean(
              !base.useSampleDesk &&
                (base.orderBackfillProgress?.historyLimited ||
                  base.metrics.tillLtv.historyLimited),
            ),
          })
        : Promise.resolve(null),
    ]);
  const url = new URL(request.url);
  const panel = parseCustomersPanel(url.searchParams.get("panel"));
  return {
    ...base,
    analytics,
    comeback,
    depth,
    marginConfirmed: marginIsConfirmed(settings),
    hasLiveSpend: liveSpendCount > 0,
    installedAt: shop.createdAt.toISOString(),
    liveHistoryLocked: false,
    panel,
  };
}
