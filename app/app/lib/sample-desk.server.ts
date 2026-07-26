import prisma from "../db.server";
import {
  buildThreeYearSampleDesk,
  dayBoundsLocal,
} from "./demo-sample-desk.server";
import type { SalesResult } from "./shopify-sales.server";
import type { DateRange } from "./periods";
import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

export async function getSampleDeskEnabled(shopId: string): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { shopId } });
  return Boolean(settings?.useSampleDesk);
}

export async function setSampleDeskEnabled(shopId: string, enabled: boolean) {
  await prisma.settings.update({
    where: { shopId },
    data: { useSampleDesk: enabled },
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
}

export async function seedThreeYearSampleDesk(shopId: string, targetMer = 3.5) {
  const rows = buildThreeYearSampleDesk({ targetMer, years: 3 });

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
      const { start, end } = dayBoundsLocal(r.day);
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

    await tx.settings.update({
      where: { shopId },
      data: { useSampleDesk: true, targetMer },
    });
  });

  return {
    days: rows.length,
    start: rows[0]?.day ?? null,
    end: rows[rows.length - 1]?.day ?? null,
    totalSales: rows.reduce((s, r) => s + r.sales, 0),
    totalSpend: rows.reduce(
      (s, r) => s + SPEND_CHANNELS.reduce((a, ch) => a + (r.spendByChannel[ch] ?? 0), 0),
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
  for (const d of days) {
    totalSales += d.sales;
    orderCount += d.orderCount;
    newCustomers += d.newCustomers;
    returningCustomers += d.returningCustomers;
  }

  return {
    totalSales,
    orderCount,
    newCustomers,
    returningCustomers,
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
    enabled: Boolean(settings?.useSampleDesk),
    dayCount,
    spendCount,
    start: first?.day ?? null,
    end: last?.day ?? null,
  };
}
