import prisma from "../db.server";
import { localDayKey, utcDayKey } from "./sample-desk.server";

/** Last N local calendar days for the coverage strip (history, not just a month). */
export const SPEND_COVERAGE_DAYS = 90;

export type SpendDayCoverageCell = {
  dateKey: string;
  label: string;
  filled: boolean;
};

export type SpendDayCoverage = {
  days: SpendDayCoverageCell[];
  filledCount: number;
  total: number;
  includesSample: boolean;
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addLocalDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return startOfLocalDay(next);
}

function addUtcDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()),
  );
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Build filled/empty strip so CSV holes are visible at a glance. */
export async function loadSpendDayCoverage(
  shopId: string,
  sampleOn: boolean,
  now = new Date(),
): Promise<SpendDayCoverage> {
  if (sampleOn) {
    const windowEnd = startOfUtcDay(now);
    const windowStart = addUtcDays(windowEnd, -(SPEND_COVERAGE_DAYS - 1));
    const windowEndInclusive = new Date(
      Date.UTC(
        windowEnd.getUTCFullYear(),
        windowEnd.getUTCMonth(),
        windowEnd.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    const entries = await prisma.spendEntry.findMany({
      where: {
        shopId,
        source: "sample",
        periodStart: { lte: windowEndInclusive },
        periodEnd: { gte: windowStart },
        amount: { gt: 0 },
      },
      select: { periodStart: true, periodEnd: true },
    });
    const filled = new Set<string>();
    for (const entry of entries) {
      filled.add(utcDayKey(entry.periodStart));
    }
    const days: SpendDayCoverageCell[] = [];
    for (let i = 0; i < SPEND_COVERAGE_DAYS; i++) {
      const cursor = addUtcDays(windowStart, i);
      const dateKey = utcDayKey(cursor);
      days.push({
        dateKey,
        label: String(cursor.getUTCDate()),
        filled: filled.has(dateKey),
      });
    }
    return {
      days,
      filledCount: days.filter((d) => d.filled).length,
      total: days.length,
      includesSample: true,
    };
  }

  const windowEnd = startOfLocalDay(now);
  const windowStart = addLocalDays(windowEnd, -(SPEND_COVERAGE_DAYS - 1));

  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: windowEnd },
      periodEnd: { gte: windowStart },
      amount: { gt: 0 },
      source: { not: "sample" },
    },
    select: { periodStart: true, periodEnd: true },
  });

  const filled = new Set<string>();
  for (const entry of entries) {
    let cursor = startOfLocalDay(
      entry.periodStart < windowStart ? windowStart : entry.periodStart,
    );
    const end = startOfLocalDay(
      entry.periodEnd > windowEnd ? windowEnd : entry.periodEnd,
    );
    for (; cursor <= end; cursor = addLocalDays(cursor, 1)) {
      filled.add(localDayKey(cursor));
    }
  }

  const days: SpendDayCoverageCell[] = [];
  for (let cursor = windowStart; cursor <= windowEnd; cursor = addLocalDays(cursor, 1)) {
    const dateKey = localDayKey(cursor);
    days.push({
      dateKey,
      label: String(cursor.getDate()),
      filled: filled.has(dateKey),
    });
  }

  return {
    days,
    filledCount: days.filter((d) => d.filled).length,
    total: days.length,
    includesSample: false,
  };
}
