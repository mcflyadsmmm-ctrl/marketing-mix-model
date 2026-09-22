import prisma from "../db.server";
import {
  SPEND_COVERAGE_DAYS,
  spendCoverageDateKeys,
  spendEntryCoverageDateKey,
} from "./spend-coverage";

export { SPEND_COVERAGE_DAYS } from "./spend-coverage";
export {
  spendCoverageClosedDateKeys,
  spendCoverageDateKeys,
  spendEntryCoverageDateKey,
} from "./spend-coverage";

export type SpendDayCoverageCell = {
  dateKey: string;
  label: string;
  filled: boolean;
  /** SalesDayFact / SAMPLE day has sales > 0. Never fills spend. */
  hasSales?: boolean;
};

export type SpendDayCoverage = {
  days: SpendDayCoverageCell[];
  filledCount: number;
  total: number;
  includesSample: boolean;
};

function utcMidnightFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function endOfUtcDayFromKey(dateKey: string): Date {
  const start = utcMidnightFromKey(dateKey);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function eachCivilKeysInclusive(fromKey: string, toKey: string): string[] {
  if (fromKey > toKey) return [];
  const keys: string[] = [];
  let cursor = utcMidnightFromKey(fromKey);
  const end = utcMidnightFromKey(toKey);
  while (cursor.getTime() <= end.getTime()) {
    keys.push(spendEntryCoverageDateKey(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return keys;
}

/** Build filled/empty strip so CSV holes are visible at a glance. */
export async function loadSpendDayCoverage(
  shopId: string,
  sampleOn: boolean,
  options?: { now?: Date; timeZone?: string | null },
): Promise<SpendDayCoverage> {
  const now = options?.now ?? new Date();
  const timeZone = options?.timeZone ?? (sampleOn ? "UTC" : null);
  const dateKeys = spendCoverageDateKeys(now, timeZone, SPEND_COVERAGE_DAYS);
  const firstKey = dateKeys[0];
  const lastKey = dateKeys[dateKeys.length - 1];
  const windowStart = utcMidnightFromKey(firstKey);
  const windowEndInclusive = endOfUtcDayFromKey(lastKey);

  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: windowEndInclusive },
      periodEnd: { gte: windowStart },
      amount: { gt: 0 },
      ...(sampleOn
        ? { source: "sample" as const }
        : { source: { not: "sample" } }),
    },
    select: { periodStart: true, periodEnd: true },
  });

  const filled = new Set<string>();
  const windowSet = new Set(dateKeys);
  for (const entry of entries) {
    const fromKey = spendEntryCoverageDateKey(entry.periodStart);
    const toKey = spendEntryCoverageDateKey(entry.periodEnd);
    for (const key of eachCivilKeysInclusive(fromKey, toKey)) {
      if (windowSet.has(key)) filled.add(key);
    }
  }

  const days: SpendDayCoverageCell[] = dateKeys.map((dateKey) => ({
    dateKey,
    label: String(Number(dateKey.slice(8, 10))),
    filled: filled.has(dateKey),
  }));

  return {
    days,
    filledCount: days.filter((d) => d.filled).length,
    total: days.length,
    includesSample: sampleOn,
  };
}
