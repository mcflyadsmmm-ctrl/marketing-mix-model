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
  resolvePriorPeriod,
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
  assembleOrdersIntelligence,
  ordersIntelPeriodBadge,
  ordersLastYearRows,
  type OrderIntelRow,
  type OrdersFrequencyBucket,
  type OrdersIntelData,
} from "./orders-intelligence";
import { requireAdmin } from "./public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "./first-session-shopify-window.server";
import { shopLiveIngestDepth } from "./live-ingest-depth.server";
import type { LiveIngestDepth } from "./live-ingest-depth";

function toOrderIntelRow(row: {
  customerKey: string;
  amount: number;
  discountAmount: number | null;
  orderedAt: Date;
  shopLocalDate: Date;
  discountCode: string | null;
  grossAmount: number | null;
  lifetimeOrders: number | null;
  unitCount: number | null;
}): OrderIntelRow {
  return {
    customerKey: row.customerKey,
    amount: row.amount,
    discountAmount: row.discountAmount,
    orderedAt: row.orderedAt,
    shopLocalDate: row.shopLocalDate,
    discountCode: row.discountCode,
    grossAmount: row.grossAmount,
    lifetimeOrders: row.lifetimeOrders,
    unitCount: row.unitCount,
  };
}

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
  const now = new Date();
  const range = resolvePeriod(preset, now, deskTz);

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
  const orderBookDepth: LiveIngestDepth = useSampleDesk
    ? "paid_full"
    : await shopLiveIngestDepth(shop.id);

  let ordersIntel: OrdersIntelData | null = null;
  let ordersFrequency: OrdersFrequencyBucket[] | null = null;
  if (options?.includeOrdersIntelligence && !salesError) {
    try {
      const source = useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
      const priorRange = resolvePriorPeriod(preset, now, deskTz);
      const [bookRows, priorDepth] = await Promise.all([
        loadOrderDepthRows(shop.id, { end: range.end }, source),
        loadOrderDepthRows(
          shop.id,
          { start: priorRange.start, end: priorRange.end },
          source,
        ),
      ]);
      const orderBook = bookRows.map(toOrderIntelRow);
      const startMs = range.start.getTime();
      const endMs = range.end.getTime();
      const rows = orderBook.filter((row) => {
        const t = row.orderedAt.getTime();
        return t >= startMs && t <= endMs;
      });
      const assembled = assembleOrdersIntelligence({
        rows,
        priorRows: priorDepth.map(toOrderIntelRow),
        lastYearRows: ordersLastYearRows(orderBook, range.start, range.end),
        orderBook,
        periodLabel: range.label,
        badge: ordersIntelPeriodBadge(preset),
        netSales: sales.netSales,
        netSalesKnown: sales.netSalesKnown,
        timeZone: deskTz,
      });
      if (assembled) {
        const { frequency, ...intel } = assembled;
        ordersFrequency = frequency;
        ordersIntel = intel;
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
    orderBookDepth,
    ordersIntel,
    ordersFrequency,
    shopLabel: session.shop,
  };
}
