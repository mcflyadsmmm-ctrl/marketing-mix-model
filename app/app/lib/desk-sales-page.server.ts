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
import { deskPeriodTimeZone, parsePeriodPreset, resolvePeriod } from "./periods";
import { parseSalesBasis } from "./sales-basis";
import { loadDeskSalesForPeriod } from "./sales-facts.server";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
} from "./sample-desk.server";
import { runOrderFactsBackfill } from "./order-facts.server";
import { requireAdmin } from "./public-app-gate.server";

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
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    void runOrderFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
      // ignore — tiles stay honest until facts land
    });
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
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(settings.salesBasis, "total"),
  });

  return {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
  };
}
