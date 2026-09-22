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
import { isBillingEnabled } from "./billing-flag.server";
import { resolveShopEntitlements } from "./entitlements.server";
import { requireAdmin } from "./public-app-gate.server";
import { loadDeskSalesPage } from "./desk-sales-page.server";
import { loadCustomerAnalytics } from "./desk-customers-page.server";
import { loadGrowthComeback } from "./desk-growth-page.server";
import { loadLtvDepth } from "./ltv-depth-page.server";
import prisma from "../db.server";
import {
  parseCustomersPanel,
  customersPanelRedirectPath,
} from "./customers-first-viewport";

export { parseCustomersPanel, customersPanelRedirectPath };

export async function loadCustomersStackPage(request: Request) {
  const base = await loadDeskSalesPage(request, "/app/customers");
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const [analytics, comeback, depth, liveSpendCount, entitlements] =
    await Promise.all([
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
      loadLtvDepth({
        shopId: shop.id,
        useSampleDesk: base.useSampleDesk,
        historyLimited: Boolean(
          !base.useSampleDesk &&
            (base.orderBackfillProgress?.historyLimited ||
              base.metrics.tillLtv.historyLimited),
        ),
      }),
      prisma.spendEntry.count({
        where: { shopId: shop.id, NOT: { source: "sample" } },
      }),
      resolveShopEntitlements(session.shop),
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
    liveHistoryLocked:
      !base.useSampleDesk && isBillingEnabled() && !entitlements.isPro,
    panel,
  };
}
