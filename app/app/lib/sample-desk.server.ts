import prisma from "../db.server";
import {
  addUtcDays,
  buildThreeYearSampleDesk,
  sampleSpendBounds,
  sampleSpendUsesNoonStamp,
  startOfUtcDay,
} from "./demo-sample-desk.server";
import type { SalesResult } from "./shopify-sales.server";
import type { DateRange } from "./periods";
import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";
import { seedSampleCohortFacts, clearSampleCohortFacts, seedSampleOrderFacts, clearSampleOrderFacts } from "./order-facts.server";
import { sampleBookIsPaintable } from "./sample-book-ready";

export { sampleBookIsPaintable } from "./sample-book-ready";

export function isSampleOnlyFreeze(): boolean {
  const value = process.env.MCFLY_SAMPLE_ONLY;
  return value === "true" || value === "1";
}

export async function getSampleDeskEnabled(shopId: string): Promise<boolean> {
  if (isSampleOnlyFreeze()) return true;
  const settings = await prisma.settings.findUnique({ where: { shopId } });
  // Settings can hide Sample entirely — always serve real store.
  if (settings?.samplePreviewAllowed === false) return false;
  // Read-only. Seeding here ran inside every Admin loader and took Postgres down.
  // Compact SAMPLE is written only when the merchant toggles Sample on.
  return Boolean(settings?.useSampleDesk);
}

export async function getSamplePreviewAllowed(shopId: string): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { shopId } });
  // Default true when row missing (pre-migration / fresh shop).
  return settings?.samplePreviewAllowed !== false;
}

/**
 * Force Sample on for the parked-Live freeze. Uses the in-flight book map so
 * a book already through today is not rewritten on every Admin load.
 */
export async function hydrateSampleOnlyFreeze(shopId: string): Promise<void> {
  if (!isSampleOnlyFreeze()) return;
  await setSamplePreviewAllowed(shopId, true);
  await ensureSampleBookThroughToday(shopId);
  let stats = await getSampleDeskStats(shopId);
  if (!sampleBookIsPaintable(stats)) {
    await seedThreeYearSampleDesk(shopId, SAMPLE_DESK_TARGET_MER);
    stats = await getSampleDeskStats(shopId);
  }
  if (sampleBookIsPaintable(stats)) {
    await setSampleDeskEnabled(shopId, true);
  }
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

export type SampleDeskIntent =
  | "use-sample"
  | "use-real"
  | "allow-sample-preview"
  | "hide-sample-preview";

export function isSampleDeskIntent(value: string): value is SampleDeskIntent {
  return (
    value === "use-sample" ||
    value === "use-real" ||
    value === "allow-sample-preview" ||
    value === "hide-sample-preview"
  );
}

/**
 * Merchant Sample | Live switch. Seed the compact Snowdevil book before turning
 * SAMPLE on so Overview is never an empty 200 after the click.
 */
export async function applySampleDeskIntent(
  shopId: string,
  intent: SampleDeskIntent,
): Promise<void> {
  switch (intent) {
    case "use-sample":
      await setSamplePreviewAllowed(shopId, true);
      await ensureSampleBookThroughToday(shopId);
      let stats = await getSampleDeskStats(shopId);
      if (!sampleBookIsPaintable(stats)) {
        await seedThreeYearSampleDesk(shopId, SAMPLE_DESK_TARGET_MER);
        stats = await getSampleDeskStats(shopId);
      }
      if (!sampleBookIsPaintable(stats)) {
        throw new Error(
          "SAMPLE book failed to seed — desk stays Live until sales and spend exist",
        );
      }
      await setSampleDeskEnabled(shopId, true);
      return;
    case "use-real":
      if (isSampleOnlyFreeze()) return;
      await setSampleDeskEnabled(shopId, false);
      return;
    case "allow-sample-preview":
      await setSamplePreviewAllowed(shopId, true);
      return;
    case "hide-sample-preview":
      if (isSampleOnlyFreeze()) return;
      await setSamplePreviewAllowed(shopId, false);
      return;
    default: {
      const _exhaustive: never = intent;
      throw new Error(`Unhandled sample intent: ${_exhaustive}`);
    }
  }
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
  await clearSampleOrderFacts(shopId);
}

/** Snowdevil SAMPLE Total ROAS — impressive, not 4.4× theater. */
export const SAMPLE_DESK_TARGET_MER = 3.5;
/** SAMPLE break-even economics (~35% → BE ≈ 2.86). Applied at read time only. */
export const SAMPLE_DESK_MARGIN_PCT = 0.35;
/** SAMPLE chrome brand — Shopify snowboard generated-data shop. */
export const SAMPLE_DESK_SHOP_NAME = "Snowdevil";
/** Spend note that marks the Snowdevil book (rewrites leftover Harbor rows). */
export const SAMPLE_BOOK_NOTE = "sample:snowdevil-1";

const sampleSeedInFlight = new Map<string, Promise<unknown>>();

export function sampleUtcToday(now = new Date()): Date {
  return startOfUtcDay(now);
}

/**
 * Keep SAMPLE through today UTC so MTD never looks a week behind.
 * Compact rewrite if empty / midnight stamps / a long gap. Never a 5-year
 * 14-channel transaction inside an Admin request.
 */
export async function ensureSampleBookThroughToday(
  shopId: string,
): Promise<void> {
  const pending = sampleSeedInFlight.get(shopId);
  if (pending) {
    await pending;
    return;
  }
  const run = ensureSampleBookThroughTodayOnce(shopId);
  sampleSeedInFlight.set(shopId, run);
  try {
    await run;
  } finally {
    sampleSeedInFlight.delete(shopId);
  }
}

async function ensureSampleBookThroughTodayOnce(
  shopId: string,
): Promise<void> {
  const today = sampleUtcToday();
  const last = await prisma.sampleSalesDay.findFirst({
    where: { shopId },
    orderBy: { day: "desc" },
    select: { day: true },
  });

  if (await sampleDeskNeedsSeed(shopId)) {
    await seedThreeYearSampleDeskOnce(shopId, SAMPLE_DESK_TARGET_MER);
    return;
  }

  if (!last) {
    await seedThreeYearSampleDeskOnce(shopId, SAMPLE_DESK_TARGET_MER);
    return;
  }

  const lastDay = startOfUtcDay(last.day);
  if (lastDay >= today) {
    const sampleOrders = await prisma.orderFact.count({
      where: { shopId, source: "sample" },
    });
    if (sampleOrders === 0) await seedSampleOrderFacts(shopId);
    return;
  }

  const gapDays = Math.round(
    (today.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (gapDays > 14) {
    await seedThreeYearSampleDeskOnce(shopId, SAMPLE_DESK_TARGET_MER);
    return;
  }

  const rows = buildThreeYearSampleDesk({
    from: addUtcDays(lastDay, 1),
    now: today,
    targetMer: SAMPLE_DESK_TARGET_MER,
  });
  if (rows.length === 0) {
    const sampleOrders = await prisma.orderFact.count({
      where: { shopId, source: "sample" },
    });
    if (sampleOrders === 0) await seedSampleOrderFacts(shopId);
    return;
  }
  await insertSampleRows(shopId, rows);
  await seedSampleOrderFacts(shopId);
}

export async function seedThreeYearSampleDesk(
  shopId: string,
  targetMer = SAMPLE_DESK_TARGET_MER,
  _options?: { years?: number },
) {
  const pending = sampleSeedInFlight.get(shopId);
  if (pending) {
    await pending;
    return {
      days: 0,
      start: null,
      end: null,
      totalSales: 0,
      totalSpend: 0,
    };
  }

  const run = seedThreeYearSampleDeskOnce(shopId, targetMer);
  sampleSeedInFlight.set(shopId, run);
  try {
    return await run;
  } finally {
    sampleSeedInFlight.delete(shopId);
  }
}

async function insertSampleRows(
  shopId: string,
  rows: ReturnType<typeof buildThreeYearSampleDesk>,
) {
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
    await prisma.sampleSalesDay.createMany({
      data: salesData.slice(i, i + 200),
      skipDuplicates: true,
    });
  }

  const spendData: Array<{
    shopId: string;
    channel: SpendChannel;
    amount: number;
    currency: string;
    periodStart: Date;
    periodEnd: Date;
    note: string;
    source: string;
  }> = [];
  for (const r of rows) {
    const { start, end } = sampleSpendBounds(r.day);
    for (const [channel, amount] of Object.entries(r.spendByChannel) as Array<
      [SpendChannel, number]
    >) {
      if (!amount || amount <= 0) continue;
      spendData.push({
        shopId,
        channel,
        amount,
        currency: "USD",
        periodStart: start,
        periodEnd: end,
        note: SAMPLE_BOOK_NOTE,
        source: "sample",
      });
    }
  }
  for (let i = 0; i < spendData.length; i += 200) {
    await prisma.spendEntry.createMany({
      data: spendData.slice(i, i + 200),
      skipDuplicates: true,
    });
  }
}

async function seedThreeYearSampleDeskOnce(
  shopId: string,
  targetMer: number,
) {
  const rows = buildThreeYearSampleDesk({ targetMer });

  await prisma.sampleSalesDay.deleteMany({ where: { shopId } });
  await prisma.spendEntry.deleteMany({ where: { shopId, source: "sample" } });
  await insertSampleRows(shopId, rows);

  await seedSampleCohortFacts(shopId);
  await seedSampleOrderFacts(shopId);

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
 * Re-seed when SAMPLE sales or spend is missing, leftover spend still uses
 * UTC midnight (collides with live CSV unique keys → empty Spend page), or
 * the spend note is not the current Snowdevil book.
 */
export async function sampleDeskNeedsSeed(shopId: string): Promise<boolean> {
  const [dayCount, probe] = await Promise.all([
    prisma.sampleSalesDay.count({ where: { shopId } }),
    prisma.spendEntry.findFirst({
      where: { shopId, source: "sample" },
      select: { periodStart: true, note: true },
    }),
  ]);
  if (dayCount === 0) return true;
  if (!probe) return true;
  if (probe.note !== SAMPLE_BOOK_NOTE) return true;
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
