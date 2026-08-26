import prisma from "../db.server";
import {
  buildThreeYearSampleDesk,
  sampleDayTotalSpend,
  sampleSpendBounds,
  sampleSpendUsesNoonStamp,
  SAMPLE_SEED_VERSION_NOTE,
  type SampleDayRow,
} from "./demo-sample-desk.server";
import { deskHistoryFloorYear } from "./desk-history";
import type { SalesResult } from "./shopify-sales.server";
import type { DateRange } from "./periods";
import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";
import {
  seedSampleCohortFacts,
  clearSampleCohortFacts,
} from "./order-facts.server";

export async function getSampleDeskEnabled(shopId: string): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { shopId } });
  // Settings can hide Sample entirely — always serve real store.
  if (settings?.samplePreviewAllowed === false) return false;
  return Boolean(settings?.useSampleDesk);
}

export async function getSamplePreviewAllowed(
  shopId: string,
): Promise<boolean> {
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

/** Rows per createMany. Big enough that a full seed is a handful of trips. */
const SEED_CHUNK = 1000;

/** Impressive SAMPLE desk default — Total ROAS lands above 4×. */
export const SAMPLE_DESK_TARGET_MER = 4.4;
/** SAMPLE break-even economics (~35% → BE ≈ 2.86). Applied at read time only. */
export const SAMPLE_DESK_MARGIN_PCT = 0.35;

/**
 * Write one slice of the sample desk. Callers pick the slice so a desk paint
 * can wait for just the window it is about to draw while the rest of the
 * history lands off-request.
 *
 * `rows` must already be filtered to the slice; the delete is scoped to the
 * same day range so a slice never wipes history it is not replacing.
 */
async function writeSampleRange(
  shopId: string,
  rows: SampleDayRow[],
  opts: { enableSample: boolean },
) {
  if (rows.length === 0) return;
  const firstDay = rows[0]!.day;
  const lastDay = rows[rows.length - 1]!.day;
  const spendFrom = sampleSpendBounds(firstDay).start;
  const spendTo = sampleSpendBounds(lastDay).end;

  await prisma.$transaction(
    async (tx) => {
      await tx.sampleSalesDay.deleteMany({
        where: { shopId, day: { gte: firstDay, lte: lastDay } },
      });
      await tx.spendEntry.deleteMany({
        where: {
          shopId,
          source: "sample",
          periodStart: { gte: spendFrom, lte: spendTo },
        },
      });

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
      for (let i = 0; i < salesData.length; i += SEED_CHUNK) {
        await tx.sampleSalesDay.createMany({
          data: salesData.slice(i, i + SEED_CHUNK),
        });
      }

      const spendData: Array<{
        shopId: string;
        channel: SpendChannel;
        customKey: string;
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
            customKey: "",
            amount,
            periodStart: start,
            periodEnd: end,
            note: SAMPLE_SEED_VERSION_NOTE,
            source: "sample",
          });
        }
        /*
         * Named extras key on `other:<slug>`, so the Sample desk shows a real
         * Billboard series instead of folding offline spend into "Other".
         */
        for (const extra of r.namedExtras) {
          if (!(extra.amount > 0)) continue;
          spendData.push({
            shopId,
            channel: "other",
            customKey: extra.slug,
            amount: extra.amount,
            periodStart: start,
            periodEnd: end,
            note: extra.label,
            source: "sample",
          });
        }
      }
      // skipDuplicates guards the (shopId, channel, periodStart) unique index in the rare
      // case a real (non-sample) entry already occupies that day/channel — sample rows lose.
      for (let i = 0; i < spendData.length; i += SEED_CHUNK) {
        await tx.spendEntry.createMany({
          data: spendData.slice(i, i + SEED_CHUNK),
          skipDuplicates: true,
        });
      }

      if (!opts.enableSample) return;
      // Toggle SAMPLE only when preview is still allowed — never clobber margin.
      // Desk math applies SAMPLE_DESK_* at read time while useSampleDesk is true.
      const settings = await tx.settings.findUnique({ where: { shopId } });
      if (settings?.samplePreviewAllowed !== false) {
        await tx.settings.update({
          where: { shopId },
          data: { useSampleDesk: true },
        });
      }
    },
    { maxWait: 15_000, timeout: 120_000 },
  );
}

/** Sample days whose calendar day falls on or after `fromDay`. */
function rowsFrom(rows: SampleDayRow[], fromDay: Date): SampleDayRow[] {
  return rows.filter((r) => r.day >= fromDay);
}

/** Sample days strictly before `beforeDay`. */
function rowsBefore(rows: SampleDayRow[], beforeDay: Date): SampleDayRow[] {
  return rows.filter((r) => r.day < beforeDay);
}

/** Start of the UTC day `days` back from the newest generated row. */
function windowStartDay(rows: SampleDayRow[], days: number): Date {
  const last = rows[rows.length - 1]?.day ?? new Date();
  const start = new Date(last);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

/**
 * Days of sample a desk paint is allowed to wait for. Roughly a quarter —
 * enough for every default explorer window and the MTD/QTD scoreboard, and a
 * few hundred rows rather than the ~14,500 a full history costs.
 */
export const SAMPLE_FIRST_PAINT_DAYS = 120;

/**
 * Seed only what the first paint draws. Returns the day the window starts so
 * the caller can hand the remainder to the background filler.
 */
export async function seedSampleDeskWindow(
  shopId: string,
  targetMer = SAMPLE_DESK_TARGET_MER,
  days = SAMPLE_FIRST_PAINT_DAYS,
): Promise<Date> {
  const rows = buildThreeYearSampleDesk({ targetMer });
  const from = windowStartDay(rows, days);
  await writeSampleRange(shopId, rowsFrom(rows, from), { enableSample: true });
  return from;
}

/**
 * Fill the years behind the first-paint window.
 *
 * Newest chunk first, for two reasons: a merchant reaches last quarter before
 * they reach 2021, and it keeps `sampleDeskNeedsHistory` honest — the oldest
 * stored day only reaches the floor once every chunk has landed, so a run that
 * dies halfway is still reported as incomplete.
 */
export async function seedSampleDeskHistory(
  shopId: string,
  targetMer = SAMPLE_DESK_TARGET_MER,
  days = SAMPLE_FIRST_PAINT_DAYS,
): Promise<void> {
  const rows = buildThreeYearSampleDesk({ targetMer });
  const older = rowsBefore(rows, windowStartDay(rows, days));
  // A year at a time keeps each transaction small enough to never wedge.
  const YEAR = 365;
  for (let end = older.length; end > 0; end -= YEAR) {
    const chunk = older.slice(Math.max(0, end - YEAR), end);
    if (chunk.length === 0) continue;
    await writeSampleRange(shopId, chunk, { enableSample: false });
  }
}

export async function seedThreeYearSampleDesk(
  shopId: string,
  targetMer = SAMPLE_DESK_TARGET_MER,
) {
  const rows = buildThreeYearSampleDesk({ targetMer });
  await writeSampleRange(shopId, rows, { enableSample: true });

  // Sample CohortFacts for Till LTV panel (clearly demo — not live Shopify).
  await seedSampleCohortFacts(shopId);

  return {
    days: rows.length,
    start: rows[0]?.day ?? null,
    end: rows[rows.length - 1]?.day ?? null,
    totalSales: rows.reduce((s, r) => s + r.sales, 0),
    totalSpend: rows.reduce((s, r) => s + sampleDayTotalSpend(r), 0),
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
 * Re-seed when SAMPLE sales or spend is missing, when leftover spend still
 * uses UTC midnight (collides with live CSV unique keys → empty Spend page),
 * or when the seeded rows predate the current sample shape.
 */
export async function sampleDeskNeedsSeed(shopId: string): Promise<boolean> {
  const [dayCount, probe, current] = await Promise.all([
    prisma.sampleSalesDay.count({ where: { shopId } }),
    prisma.spendEntry.findFirst({
      where: { shopId, source: "sample" },
      select: { periodStart: true },
    }),
    prisma.spendEntry.findFirst({
      where: { shopId, source: "sample", note: SAMPLE_SEED_VERSION_NOTE },
      select: { id: true },
    }),
  ]);
  if (dayCount === 0) return true;
  if (!probe) return true;
  if (!sampleSpendUsesNoonStamp(probe.periodStart)) return true;
  return current == null;
}

/**
 * True until the stored sample reaches the history floor the generator aims
 * for — Jan 1 of five years back. Compared against the intended floor rather
 * than a rolling window so a half-finished backfill still reads as incomplete.
 */
export async function sampleDeskNeedsHistory(shopId: string): Promise<boolean> {
  const oldest = await prisma.sampleSalesDay.findFirst({
    where: { shopId },
    orderBy: { day: "asc" },
    select: { day: true },
  });
  if (!oldest) return true;
  const intendedStart = Date.UTC(deskHistoryFloorYear(new Date()), 0, 1);
  // A few days of slack for the generator's own edge handling.
  return oldest.day.getTime() > intendedStart + 3 * 86_400_000;
}

/** In-flight heals, so concurrent paints share one seed instead of racing. */
const sampleHealInFlight = new Map<string, Promise<boolean>>();
/** Shops whose history backfill is already running in this process. */
const sampleHistoryInFlight = new Set<string>();

/**
 * Hard ceiling on what a desk paint will wait for. Fly's proxy answers a slow
 * request with an HTML 502/504, which the single-fetch client cannot decode
 * ("Unable to decode turbo-stream response") — a white screen. Rendering a
 * desk with $0 holes is strictly better than that, so past this we stop
 * waiting and let the seed finish off-request.
 */
export const SAMPLE_SEED_AWAIT_MS = 2_000;

export type SampleHealDeps = {
  needsSeed: (shopId: string) => Promise<boolean>;
  /** Seeds only the window the first paint draws. */
  seedWindow: (shopId: string, targetMer: number) => Promise<unknown>;
  needsHistory: (shopId: string) => Promise<boolean>;
  /** Fills the years behind the window; never awaited by a paint. */
  seedHistory: (shopId: string, targetMer: number) => Promise<unknown>;
  awaitMs: number;
};

const defaultHealDeps: SampleHealDeps = {
  needsSeed: sampleDeskNeedsSeed,
  seedWindow: (shopId, targetMer) => seedSampleDeskWindow(shopId, targetMer),
  needsHistory: sampleDeskNeedsHistory,
  seedHistory: (shopId, targetMer) => seedSampleDeskHistory(shopId, targetMer),
  awaitMs: SAMPLE_SEED_AWAIT_MS,
};

/** Kick the history filler once per process per shop, never awaited. */
function startHistoryFill(
  shopId: string,
  targetMer: number,
  deps: SampleHealDeps,
): void {
  if (sampleHistoryInFlight.has(shopId)) return;
  sampleHistoryInFlight.add(shopId);
  void (async () => {
    try {
      if (await deps.needsHistory(shopId)) {
        await deps.seedHistory(shopId, targetMer);
      }
    } catch {
      // History is not first-paint critical; the next paint tries again.
    } finally {
      sampleHistoryInFlight.delete(shopId);
    }
  })();
}

/**
 * A shop already on Sample never revisits the toggle that seeds it, so a shape
 * change shipped in code would otherwise never reach it.
 *
 * The paint awaits only the recent window — a few hundred rows — because that
 * is all the first screen draws. Waiting on the full ~14,500-row history was
 * what turned a first paint into a proxy timeout. The years behind it fill
 * off-request, so an All/1y range is complete by the time anyone picks it.
 *
 * Resolves true when the window was written in time. Never throws and never
 * blocks past `awaitMs`: Sample is a demo surface and must not take a desk
 * paint down with it.
 */
export async function ensureSampleDeskSeeded(
  shopId: string,
  targetMer: number,
  deps: SampleHealDeps = defaultHealDeps,
): Promise<boolean> {
  const existing = sampleHealInFlight.get(shopId);
  if (existing) return existing;

  const run = (async () => {
    try {
      if (!(await deps.needsSeed(shopId))) {
        startHistoryFill(shopId, targetMer, deps);
        return false;
      }
      const seeded = deps.seedWindow(shopId, targetMer).then(
        () => true,
        () => false,
      );
      const capped = await Promise.race([
        seeded,
        new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), deps.awaitMs).unref?.(),
        ),
      ]);
      startHistoryFill(shopId, targetMer, deps);
      return capped;
    } catch {
      return false;
    } finally {
      sampleHealInFlight.delete(shopId);
    }
  })();

  sampleHealInFlight.set(shopId, run);
  return run;
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
