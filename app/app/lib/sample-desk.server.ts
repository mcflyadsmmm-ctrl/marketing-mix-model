import prisma from "../db.server";
import {
  buildThreeYearSampleDesk,
  sampleSpendBounds,
  sampleSpendUsesNoonStamp,
} from "./demo-sample-desk.server";
import type { SalesResult } from "./shopify-sales.server";
import type { DateRange } from "./periods";
import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";
import { seedSampleCohortFacts, clearSampleCohortFacts } from "./order-facts.server";

export async function getSampleDeskEnabled(shopId: string): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { shopId } });
  // Settings can hide Sample entirely — always serve real store.
  if (settings?.samplePreviewAllowed === false) return false;
  return Boolean(settings?.useSampleDesk);
}

export async function getSamplePreviewAllowed(shopId: string): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { shopId } });
  // Default true when row missing (pre-migration / fresh shop).
  return settings?.samplePreviewAllowed !== false;
}

export async function setSamplePreviewAllowed(
  shopId: string,
  allowed: boolean,
) {
  await prisma.settings.update({
    where: { shopId },
    data: {
      samplePreviewAllowed: allowed,
      // Hiding sample always forces real-store mode.
      ...(allowed ? {} : { useSampleDesk: false }),
    },
  });
}

export async function setSampleDeskEnabled(shopId: string, enabled: boolean) {
  const allowed = await getSamplePreviewAllowed(shopId);
  await prisma.settings.update({
    where: { shopId },
    data: { useSampleDesk: allowed ? enabled : false },
  });
}

export async function clearSampleDesk(shopId: string) {
  await prisma.$transaction([
    prisma.sampleSalesDay.deleteMany({ where: { shopId } }),
    prisma.spendEntry.deleteMany({ where: { shopId, source: "sample" } }),
    prisma.settings.update({
      where: { shopId },
      data: { useSampleDesk: false },
    }),
  ]);
  // Demo CohortFacts use source=sample — delete without touching live till LTV.
  await clearSampleCohortFacts(shopId);
}

/** Impressive SAMPLE desk default — Total ROAS lands above 4×. */
export const SAMPLE_DESK_TARGET_MER = 4.4;
/** SAMPLE break-even economics (~35% → BE ≈ 2.86). Applied at read time only. */
export const SAMPLE_DESK_MARGIN_PCT = 0.35;

export async function seedThreeYearSampleDesk(
  shopId: string,
  targetMer = SAMPLE_DESK_TARGET_MER,
) {
  const rows = buildThreeYearSampleDesk({ targetMer });

  await prisma.$transaction(async (tx) => {
    await tx.sampleSalesDay.deleteMany({ where: { shopId } });
    await tx.spendEntry.deleteMany({ where: { shopId, source: "sample" } });

    // Batch create in chunks
    const salesData = rows.map((r) => ({
      shopId,
      day: r.day,
      sales: r.sales,
      orderCount: r.orderCount,
      newCustomers: r.newCustomers,
      returningCustomers: r.returningCustomers,
      newCustomerNetSales: r.newCustomerNetSales,
    }));
    for (let i = 0; i < salesData.length; i += 200) {
      await tx.sampleSalesDay.createMany({ data: salesData.slice(i, i + 200) });
    }

    const spendData: Array<{
      shopId: string;
      channel: SpendChannel;
      amount: number;
      periodStart: Date;
      periodEnd: Date;
      note: string;
      source: string;
    }> = [];
    for (const r of rows) {
      const { start, end } = sampleSpendBounds(r.day);
      for (const channel of SPEND_CHANNELS) {
        const amount = r.spendByChannel[channel];
        if (!amount || amount <= 0) continue;
        spendData.push({
          shopId,
          channel,
          amount,
          periodStart: start,
          periodEnd: end,
          note: "sample:3y",
          source: "sample",
        });
      }
    }
    // skipDuplicates guards the (shopId, channel, periodStart) unique index in the rare
    // case a real (non-sample) entry already occupies that day/channel — sample rows lose.
    for (let i = 0; i < spendData.length; i += 200) {
      await tx.spendEntry.createMany({
        data: spendData.slice(i, i + 200),
        skipDuplicates: true,
      });
    }

    // Toggle SAMPLE only when preview is still allowed — never clobber margin.
    // Desk math applies SAMPLE_DESK_* at read time while useSampleDesk is true.
    const settings = await tx.settings.findUnique({ where: { shopId } });
    if (settings?.samplePreviewAllowed !== false) {
      await tx.settings.update({
        where: { shopId },
        data: { useSampleDesk: true },
      });
    }
  });

  // Sample CohortFacts for Till LTV panel (clearly demo — not live Shopify).
  await seedSampleCohortFacts(shopId);

  return {
    days: rows.length,
    start: rows[0]?.day ?? null,
    end: rows[rows.length - 1]?.day ?? null,
    totalSales: rows.reduce((s, r) => s + r.sales, 0),
    totalSpend: rows.reduce(
      (s, r) =>
        s + SPEND_CHANNELS.reduce((a, ch) => a + (r.spendByChannel[ch] ?? 0), 0),
      0,
    ),
  };
}

export async function fetchSampleSales(
  shopId: string,
  range: DateRange,
): Promise<SalesResult> {
  const days = await prisma.sampleSalesDay.findMany({
    where: {
      shopId,
      day: { gte: range.start, lte: range.end },
    },
  });

  let totalSales = 0;
  let orderCount = 0;
  let newCustomers = 0;
  let returningCustomers = 0;
  let newCustomerNetSales = 0;
  for (const d of days) {
    totalSales += d.sales;
    orderCount += d.orderCount;
    newCustomers += d.newCustomers;
    returningCustomers += d.returningCustomers;
    newCustomerNetSales += d.newCustomerNetSales;
  }

  return {
    totalSales,
    grossSales: totalSales,
    grossSalesKnown: true,
    netSales: totalSales,
    netSalesKnown: true,
    salesBasisUsed: "total",
    orderCount,
    newCustomers,
    returningCustomers,
    newCustomerNetSales,
    returningCustomerNetSales: Math.max(0, totalSales - newCustomerNetSales),
    guestOrders: 0,
    customerMetricsAvailable: true,
    source: "shopify", // treated as till totals for MER math; UI labels sample mode
  };
}

/** Calendar day key → till sales for daily spine (sample desk stores UTC-midnight days). */
export async function fetchSampleSalesByDay(
  shopId: string,
  range: { start: Date; end: Date },
): Promise<Map<string, number>> {
  const days = await prisma.sampleSalesDay.findMany({
    where: {
      shopId,
      day: { gte: range.start, lte: range.end },
    },
    select: { day: true, sales: true },
  });
  const map = new Map<string, number>();
  for (const d of days) {
    const key = utcDayKey(d.day);
    map.set(key, (map.get(key) ?? 0) + d.sales);
  }
  return map;
}

/** Local calendar YYYY-MM-DD (spend rows / closed-day window). */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** UTC calendar YYYY-MM-DD (sample desk day stamps). */
export function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Re-seed when SAMPLE sales or spend is missing, or when leftover spend still
 * uses UTC midnight (collides with live CSV unique keys → empty Spend page).
 */
export async function sampleDeskNeedsSeed(shopId: string): Promise<boolean> {
  const [dayCount, probe] = await Promise.all([
    prisma.sampleSalesDay.count({ where: { shopId } }),
    prisma.spendEntry.findFirst({
      where: { shopId, source: "sample" },
      select: { periodStart: true },
    }),
  ]);
  if (dayCount === 0) return true;
  if (!probe) return true;
  return !sampleSpendUsesNoonStamp(probe.periodStart);
}

export async function getSampleDeskStats(shopId: string) {
  const [dayCount, spendCount, settings, first, last] = await Promise.all([
    prisma.sampleSalesDay.count({ where: { shopId } }),
    prisma.spendEntry.count({ where: { shopId, source: "sample" } }),
    prisma.settings.findUnique({ where: { shopId } }),
    prisma.sampleSalesDay.findFirst({
      where: { shopId },
      orderBy: { day: "asc" },
      select: { day: true },
    }),
    prisma.sampleSalesDay.findFirst({
      where: { shopId },
      orderBy: { day: "desc" },
      select: { day: true },
    }),
  ]);
  return {
    enabled:
      settings?.samplePreviewAllowed === false
        ? false
        : Boolean(settings?.useSampleDesk),
    samplePreviewAllowed: settings?.samplePreviewAllowed !== false,
    dayCount,
    spendCount,
    start: first?.day ?? null,
    end: last?.day ?? null,
  };
}
