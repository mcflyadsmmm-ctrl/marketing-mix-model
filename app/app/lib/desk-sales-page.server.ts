/**
 * Shared loader for Orders / Buyers / Timing — same facts as Overview,
 * without explorer or goal snaps.
 */

import { redirect } from "react-router";
import {
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "./mer-dashboard.server";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
} from "./periods";
import { parseSalesBasis } from "./sales-basis";
import {
  loadDeskSalesForPeriod,
  salesFactsBlockLock,
} from "./sales-facts.server";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
} from "./sample-desk.server";
import { getOrderBackfillProgress } from "./order-facts.server";
import { requireAdmin } from "./public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "./first-session-shopify-window.server";

export async function loadDeskSalesPage(
  request: Request,
  redirectPath: string,
) {
  const { admin, session } = await requireAdmin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`${redirectPath}?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const range = resolvePeriod(preset, new Date(), deskTz);

  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let shopifyOrderWindowLimited = false;
  let factsIncomplete = false;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    void scheduleFirstSessionShopifyWindow(admin, shop.id);
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesTruncated = desk.todaySalesTruncated;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    shopifyOrderWindowLimited =
      Boolean(desk.factsCoverage?.periodExceedsFactWindow) ||
      periodMayExceedShopifyOrderWindow(range);
    factsIncomplete = salesFactsBlockLock(desk.factsCoverage);
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(settings.salesBasis, "total"),
  });
  const orderBackfillProgress = useSampleDesk
    ? null
    : await getOrderBackfillProgress(shop.id, {
        ianaTimezone: shop.ianaTimezone,
      });

  return {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
    factsIncomplete,
    orderBackfillProgress,
  };
}
