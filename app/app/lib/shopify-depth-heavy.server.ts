import type { LoaderFunctionArgs } from "react-router";
import { listingCaptureFromRequest } from "./listing-capture";
import { ensureShop } from "./mer-dashboard.server";
import {
  parsePeriodPreset,
  resolvePeriod,
  resolvePriorPeriod,
} from "./periods";
import { getSampleDeskEnabled } from "./sample-desk.server";
import { loadShopifyDepthData } from "./shopify-depth-loader.server";
import {
  buildDepthChartsForTab,
  type DepthChartModel,
} from "./shopify-depth-metrics";
import { authenticate } from "../shopify.server";
import type { DepthTab } from "./shopify-depth-catalog";
import { loadSalesDayAccuracy } from "./sales-day-accuracy.server";

export async function loadDepthHeavyCharts(
  args: LoaderFunctionArgs,
  tab: Exclude<DepthTab, "goals">,
): Promise<{ charts: DepthChartModel[] }> {
  const { admin, session } = await authenticate.admin(args.request);
  const url = new URL(args.request.url);
  // Shots should not hit this route — parent loads full — but stay safe.
  listingCaptureFromRequest(args.request);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const shop = await ensureShop(session.shop);
  const now = new Date();
  const range = resolvePeriod(preset, now, shop.ianaTimezone);
  const priorRange = resolvePriorPeriod(preset, now, shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  const depth = await loadShopifyDepthData({
    shopId: shop.id,
    range,
    priorRange,
    ianaTimezone: shop.ianaTimezone,
    useSampleDesk,
    admin: useSampleDesk ? undefined : admin,
    grantedScopes: session.scope,
    allOrderHistory: tab === "customers",
    mode: "full",
  });

  const accuracy =
    tab === "sales" || tab === "customers"
      ? await loadSalesDayAccuracy({
          shopId: shop.id,
          range,
          ianaTimezone: shop.ianaTimezone,
          enqueueRepair: false,
          grantedScopes: session.scope,
          useSampleDesk,
        })
      : null;

  const charts = buildDepthChartsForTab(
    {
      tab,
      dayFacts: depth.dayFacts,
      priorDayFacts: depth.priorDayFacts,
      baselineDayFacts: depth.baselineDayFacts,
      orderFacts: depth.orderFacts,
      priorOrderFacts: depth.priorOrderFacts,
      missingDayKeys: accuracy?.missingDayKeys,
      timeZone: shop.ianaTimezone,
    },
    "slow",
  );

  return { charts };
}
