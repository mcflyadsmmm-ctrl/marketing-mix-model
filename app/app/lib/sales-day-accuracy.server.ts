import {
  getSalesFactRowsByDay,
  getSalesFactsCoverage,
} from "./sales-facts.server";
import { closedLedgerDayKeys } from "./period-ledger.server";
import {
  shopLocalDayKey,
  utcMidnightFromDayKey,
} from "./shop-local-day";
import {
  assessSalesDayAccuracy,
  salesDayAccuracyNeedsRefresh,
  type SalesDayAccuracySnapshot,
} from "./sales-day-accuracy";
import { enqueueSalesFactsBackfill } from "./sales-backfill-kick.server";
import prisma from "../db.server";

/**
 * Accuracy snapshot for the selected Sales period.
 * Optionally enqueues a priority backfill / refresh so missing closed days
 * do not stay quietly wrong.
 */
export async function loadSalesDayAccuracy(args: {
  shopId: string;
  range: { start: Date; end: Date };
  ianaTimezone: string | null | undefined;
  now?: Date;
  enqueueRepair?: boolean;
  grantedScopes?: string | null;
  useSampleDesk?: boolean;
}): Promise<SalesDayAccuracySnapshot> {
  const now = args.now ?? new Date();
  const timeZone = args.ianaTimezone?.trim() || null;

  if (!timeZone || args.useSampleDesk) {
    return assessSalesDayAccuracy({
      expectedClosedDayKeys: [],
      presentDayKeys: [],
      openDayKey: timeZone ? shopLocalDayKey(now, timeZone) : null,
      periodExceedsFactWindow: false,
    });
  }

  const coverage = await getSalesFactsCoverage(
    args.shopId,
    { start: args.range.start, end: args.range.end, label: "" },
    now,
    timeZone,
  );

  const expectedClosedDayKeys = closedLedgerDayKeys({
    rangeStart: args.range.start,
    rangeEnd: args.range.end,
    timeZone,
    now,
  });

  const rows = await getSalesFactRowsByDay(
    args.shopId,
    { start: args.range.start, end: args.range.end },
    timeZone,
  );

  const freshest = await freshestSalesDayFactAsOf(
    args.shopId,
    expectedClosedDayKeys,
  );

  const snapshot = assessSalesDayAccuracy({
    expectedClosedDayKeys,
    presentDayKeys: [...rows.keys()],
    openDayKey: shopLocalDayKey(now, timeZone),
    freshestAsOf: freshest,
    periodExceedsFactWindow: coverage.periodExceedsFactWindow,
  });

  if (args.enqueueRepair && salesDayAccuracyNeedsRefresh(snapshot)) {
    void enqueueSalesFactsBackfill({
      shopId: args.shopId,
      grantedScopes: args.grantedScopes ?? undefined,
      reason: "sales_day_accuracy",
      // Stale-but-complete → overwrite recent closed days (refunds/edits).
      // Catching up → missing-only fill (default).
      refreshExisting: snapshot.status === "complete",
    }).catch(() => {});
  }

  return snapshot;
}

async function freshestSalesDayFactAsOf(
  shopId: string,
  dayKeys: string[],
): Promise<Date | null> {
  if (dayKeys.length === 0) return null;
  const start = utcMidnightFromDayKey(dayKeys[0]!);
  const end = utcMidnightFromDayKey(dayKeys[dayKeys.length - 1]!);
  const row = await prisma.salesDayFact.findFirst({
    where: {
      shopId,
      day: { gte: start, lte: end },
      asOf: { not: null },
    },
    orderBy: { asOf: "desc" },
    select: { asOf: true },
  });
  return row?.asOf ?? null;
}
