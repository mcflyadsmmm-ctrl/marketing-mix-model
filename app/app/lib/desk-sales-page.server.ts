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
import {
  ORDER_FACT_SOURCE,
  getOrderBackfillProgress,
  loadOrderDepthRows,
} from "./order-facts.server";
import {
  aggregateOrderRows,
  buildOrdersAovTiers,
  buildOrdersFrequency,
  buildOrdersIntelDays,
  buildOrdersWeeklyRows,
  ordersIntelWindowLabel,
  type OrdersFrequencyBucket,
} from "./orders-intelligence";
import { requireAdmin } from "./public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "./first-session-shopify-window.server";

const ORDERS_INTEL_WINDOW_DAYS = 90;

export async function loadDeskSalesPage(
  request: Request,
  redirectPath: string,
  options?: { includeOrdersIntelligence?: boolean },
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
      signal: request.signal,
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

  let ordersIntel: {
    windowLabel: string;
    days: ReturnType<typeof buildOrdersIntelDays>;
    weeks: ReturnType<typeof buildOrdersWeeklyRows>;
    tiers: ReturnType<typeof buildOrdersAovTiers>;
    current: ReturnType<typeof aggregateOrderRows>;
    prior: ReturnType<typeof aggregateOrderRows> | null;
  } | null = null;
  let ordersFrequency: OrdersFrequencyBucket[] | null = null;
  if (options?.includeOrdersIntelligence && !salesError) {
    try {
      const source = useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
      const end = new Date();
      const start = new Date(
        end.getTime() - ORDERS_INTEL_WINDOW_DAYS * 86_400_000,
      );
      const priorStart = new Date(
        start.getTime() - ORDERS_INTEL_WINDOW_DAYS * 86_400_000,
      );
      const [rows, priorRows] = await Promise.all([
        loadOrderDepthRows(shop.id, { start, end }, source),
        loadOrderDepthRows(shop.id, { start: priorStart, end: start }, source),
      ]);
      if (rows.length > 0) {
        const days = buildOrdersIntelDays(rows);
        ordersIntel = {
          windowLabel: ordersIntelWindowLabel(days),
          days,
          weeks: buildOrdersWeeklyRows(rows),
          tiers: buildOrdersAovTiers(rows),
          current: aggregateOrderRows(rows),
          prior: priorRows.length > 0 ? aggregateOrderRows(priorRows) : null,
        };
        ordersFrequency = buildOrdersFrequency(rows);
      }
    } catch {
      ordersIntel = null;
      ordersFrequency = null;
    }
  }

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
    ordersIntel,
    ordersFrequency,
    shopLabel: session.shop,
  };
}
