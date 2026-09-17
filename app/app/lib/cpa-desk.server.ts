/**
 * CPA desk loader — This month / Last 28 windows + daily spend/buyer spine.
 * SAMPLE uses day-sum buyers; live overlays unique OrderFacts when on file.
 */

import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import prisma from "../db.server";
import {
  applyUniqueBuyerCounts,
  buildCpaPaybackView,
  buildCpaWindowSnapshot,
  cpaExplorerRangeOf,
  hasTypedSpend,
  rangeDayKeys,
  resolveCpaDeskWindows,
  type CpaDayPoint,
  type CpaExplorerRange,
  type CpaPaybackView,
  type CpaWindowId,
  type CpaWindowSnapshot,
} from "./cpa-desk";
import { deskPeriodTillLabel } from "./desk-history";
import {
  buildDailyRowsForWindow,
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "./mer-dashboard.server";
import {
  countIdentifiedBuyersInRange,
  countNewBuyersInRange,
} from "./order-facts.server";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
} from "./periods";
import { requireAdmin } from "./public-app-gate.server";
import {
  getSalesFactsByDay,
  loadDeskSalesForPeriod,
} from "./sales-facts.server";
import { parseSalesBasis } from "./sales-basis";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
  utcDayKey,
} from "./sample-desk.server";
import { isCertifiedSalesDayFact, shopifyReadOrdersScopesAllowDeep } from "./shopify-order-window";
import { buildTillLtvSummary, cashPaybackDays } from "./till-ltv.server";
import { scheduleFirstSessionShopifyWindow } from "./first-session-shopify-window.server";

export type CpaDeskLoaderData = {
  windows: CpaWindowSnapshot[];
  days: CpaDayPoint[];
  explorerRanges: Record<CpaExplorerRange, { fromKey: string; toKey: string }>;
  paybacks: Record<CpaWindowId, CpaPaybackView>;
  paybackBase: {
    avgRevenueD30: number | null;
    avgRevenueD90: number | null;
    avgRevenueD365: number | null;
    historyLimited: boolean;
  };
  hasSpend: boolean;
  preset: ReturnType<typeof parsePeriodPreset>;
  shotMode: boolean;
  useSampleDesk: boolean;
  salesError: string | null;
  tillLabel: string;
  todaySalesTruncated: boolean;
  todaySalesUnavailable: boolean;
  shopifyOrderWindowLimited: boolean;
};

async function loadBuyerDays(
  shopId: string,
  range: { start: Date; end: Date },
  useSampleDesk: boolean,
): Promise<Map<string, Omit<CpaDayPoint, "spend">>> {
  const map = new Map<string, Omit<CpaDayPoint, "spend">>();
  if (useSampleDesk) {
    const rows = await prisma.sampleSalesDay.findMany({
      where: { shopId, day: { gte: range.start, lte: range.end } },
      select: {
        day: true,
        newCustomers: true,
        returningCustomers: true,
        newCustomerNetSales: true,
      },
    });
    for (const row of rows) {
      const dateKey = utcDayKey(row.day);
      map.set(dateKey, {
        dateKey,
        newCustomers: row.newCustomers,
        returningCustomers: row.returningCustomers,
        newCustomerSales: row.newCustomerNetSales,
        buyersKnown: true,
      });
    }
    return map;
  }

  const now = new Date();
  const scopesAllowDeep = shopifyReadOrdersScopesAllowDeep();
  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: range.start, lte: range.end } },
    select: {
      day: true,
      sales: true,
      newCustomers: true,
      returningCustomers: true,
      newCustomerNetSales: true,
    },
  });
  for (const row of rows) {
    if (
      !isCertifiedSalesDayFact({
        day: row.day,
        sales: row.sales,
        now,
        scopesAllowDeep,
      })
    ) {
      continue;
    }
    const dateKey = utcDayKey(row.day);
    map.set(dateKey, {
      dateKey,
      newCustomers: row.newCustomers,
      returningCustomers: row.returningCustomers,
      newCustomerSales: row.newCustomerNetSales,
      buyersKnown: false,
    });
  }
  return map;
}

function joinCpaDays(
  spendByDay: Map<string, number>,
  buyersByDay: Map<string, Omit<CpaDayPoint, "spend">>,
): CpaDayPoint[] {
  const keys = new Set<string>([...spendByDay.keys(), ...buyersByDay.keys()]);
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((dateKey) => {
      const buyers = buyersByDay.get(dateKey);
      const spend = spendByDay.get(dateKey) ?? 0;
      return {
        dateKey,
        spend: spend > 0 ? spend : 0,
        newCustomers: buyers?.newCustomers ?? 0,
        returningCustomers: buyers?.returningCustomers ?? 0,
        newCustomerSales: buyers?.newCustomerSales ?? 0,
        buyersKnown: buyers?.buyersKnown ?? false,
      };
    });
}

export function cpaPaybackForWindow(
  window: CpaWindowSnapshot,
  base: CpaDeskLoaderData["paybackBase"],
): CpaPaybackView {
  return buildCpaPaybackView({
    cashCac: window.cashCac,
    avgRevenueD30: base.avgRevenueD30,
    avgRevenueD90: base.avgRevenueD90,
    paybackDays: cashPaybackDays(
      window.cashCac,
      base.avgRevenueD30,
      base.avgRevenueD90,
      base.avgRevenueD365,
    ),
  });
}

export async function loadCpaDesk(
  request: LoaderFunctionArgs["request"],
): Promise<CpaDeskLoaderData> {
  const { admin, session } = await requireAdmin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/cpa?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const now = new Date();
  const deskWindows = resolveCpaDeskWindows(now, deskTz);

  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let shopifyOrderWindowLimited = false;
  let sales = await (useSampleDesk
    ? fetchSampleSales(shop.id, deskWindows.thisMonth)
    : Promise.resolve(null));
  if (!useSampleDesk) {
    void scheduleFirstSessionShopifyWindow(admin, shop.id);
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range: deskWindows.thisMonth,
      ianaTimezone: shop.ianaTimezone,
      signal: request.signal,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesTruncated = desk.todaySalesTruncated;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    shopifyOrderWindowLimited =
      Boolean(desk.factsCoverage?.periodExceedsFactWindow) ||
      periodMayExceedShopifyOrderWindow(deskWindows.thisMonth);
  }

  const metrics = sales
    ? await buildDashboardMetrics(session.shop, deskWindows.thisMonth, sales, {
        salesBasis: parseSalesBasis(settings.salesBasis, "total"),
      })
    : null;

  const [buyerDays, spendRows] = await Promise.all([
    loadBuyerDays(shop.id, deskWindows.explorer, useSampleDesk),
    buildDailyRowsForWindow(shop.id, {
      sampleOnly: useSampleDesk,
      excludeSample: !useSampleDesk,
      salesByDay: useSampleDesk
        ? new Map()
        : await getSalesFactsByDay(shop.id, deskWindows.explorer).catch(
            () => new Map<string, number>(),
          ),
      windowStart: deskWindows.explorer.start,
      windowEnd: deskWindows.explorer.end,
      timeZone: deskTz,
    }),
  ]);

  const spendByDay = new Map<string, number>();
  for (const row of spendRows.rows) {
    if (row.spend > 0) spendByDay.set(row.dateKey, row.spend);
  }
  const days = joinCpaDays(spendByDay, buyerDays);

  let thisMonth = buildCpaWindowSnapshot(
    "this_month",
    deskWindows.thisMonth,
    days,
    deskTz,
  );
  let last28 = buildCpaWindowSnapshot(
    "last_28",
    deskWindows.last28,
    days,
    deskTz,
  );

  if (!useSampleDesk && !salesError) {
    const [monthNew, monthId, lastNew, lastId] = await Promise.all([
      countNewBuyersInRange(shop.id, deskWindows.thisMonth),
      countIdentifiedBuyersInRange(shop.id, deskWindows.thisMonth),
      countNewBuyersInRange(shop.id, deskWindows.last28),
      countIdentifiedBuyersInRange(shop.id, deskWindows.last28),
    ]);
    thisMonth = applyUniqueBuyerCounts(thisMonth, {
      identified: monthId,
      newBuyers: monthNew,
    });
    last28 = applyUniqueBuyerCounts(last28, {
      identified: lastId,
      newBuyers: lastNew,
    });
  }

  const windows = [thisMonth, last28];
  const ltv = await buildTillLtvSummary(shop.id, {
    totalSpend: thisMonth.spend,
    newCustomers: thisMonth.newCustomers,
    periodLabel: thisMonth.label,
    useSampleDesk,
    ianaTimezone: deskTz,
  });
  const paybackBase = {
    avgRevenueD30: ltv.avgRevenueD30,
    avgRevenueD90: ltv.avgRevenueD90,
    avgRevenueD365: ltv.avgRevenueD365,
    historyLimited: ltv.historyLimited,
  };
  const paybacks: Record<CpaWindowId, CpaPaybackView> = {
    this_month: cpaPaybackForWindow(thisMonth, paybackBase),
    last_28: cpaPaybackForWindow(last28, paybackBase),
  };

  const tillLabel = deskPeriodTillLabel({
    periodLabel: "This month · Last 28 days",
    useSampleDesk,
    shotMode,
    salesError,
    blockedMockAsLive: metrics?.blockedMockAsLive ?? false,
    salesSource: metrics?.salesSource ?? "shopify",
  });

  const explorerRanges = {
    this_month: rangeDayKeys(cpaExplorerRangeOf("this_month", deskWindows), deskTz),
    last_28: rangeDayKeys(cpaExplorerRangeOf("last_28", deskWindows), deskTz),
    "90d": rangeDayKeys(cpaExplorerRangeOf("90d", deskWindows), deskTz),
    ytd: rangeDayKeys(cpaExplorerRangeOf("ytd", deskWindows), deskTz),
  } satisfies Record<CpaExplorerRange, { fromKey: string; toKey: string }>;

  return {
    windows,
    days,
    explorerRanges,
    paybacks,
    paybackBase,
    hasSpend: hasTypedSpend(days, windows),
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    tillLabel,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
  };
}
