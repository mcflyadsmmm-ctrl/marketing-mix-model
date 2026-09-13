import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
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
import {
  enqueueNewestClosedDaySeal,
  spotCheckSalesDayFacts,
} from "./sales-day-reconcile.server";
import prisma from "../db.server";

/**
 * Accuracy snapshot for the selected Sales period.
 * Optionally enqueues a priority backfill / refresh so missing closed days
 * do not stay quietly wrong — and spot-checks live Shopify totals on recent
 * closed days so refunds/edits cannot leave Mcfly silently wrong.
 */
export async function loadSalesDayAccuracy(args: {
  shopId: string;
  range: { start: Date; end: Date };
  ianaTimezone: string | null | undefined;
  now?: Date;
  enqueueRepair?: boolean;
  grantedScopes?: string | null;
  useSampleDesk?: boolean;
  /** Required for live Admin spot-check (skip when SAMPLE / shot). */
  admin?: AdminApiContext;
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

  let snapshot = assessSalesDayAccuracy({
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
      refreshExisting: snapshot.status === "complete",
    }).catch(() => {});
  }

  // Seal the newest closed day on every repair paint — midnight totals must
  // converge without waiting for a refund webhook or a mismatch strip.
  if (
    args.enqueueRepair &&
    snapshot.expectedClosedDays > 0 &&
    snapshot.status !== "no_closed_days"
  ) {
    void enqueueNewestClosedDaySeal({
      shopId: args.shopId,
      expectedClosedDayKeys,
      openDayKey: snapshot.openDayKey,
      grantedScopes: args.grantedScopes,
    }).catch(() => {});
  }

  // Live Admin spot-check when we have closed facts and an admin client.
  // Skip while still catching up with zero facts — coverage strip owns that.
  if (
    args.admin &&
    args.enqueueRepair &&
    snapshot.factDays > 0 &&
    snapshot.status !== "no_closed_days"
  ) {
    try {
      const reconcile = await spotCheckSalesDayFacts({
        shopId: args.shopId,
        admin: args.admin,
        timeZone,
        expectedClosedDayKeys,
        presentDayKeys: [...rows.keys()],
        openDayKey: snapshot.openDayKey,
        range: args.range,
        grantedScopes: args.grantedScopes,
        enqueueRepair: true,
      });
      snapshot = {
        ...snapshot,
        reconcileStatus: reconcile.status,
        reconcileCheckedDays: reconcile.checkedDayKeys.length,
        reconcileMismatchDays: reconcile.mismatches.map((m) => m.dayKey),
      };
      if (reconcile.status === "mismatch" && reconcile.headline && reconcile.detail) {
        snapshot = {
          ...snapshot,
          headline: reconcile.headline,
          detail: reconcile.detail,
        };
      }
    } catch {
      // Spot-check must never break Sales paint.
      snapshot = {
        ...snapshot,
        reconcileStatus: "skipped",
        reconcileCheckedDays: 0,
        reconcileMismatchDays: [],
      };
    }
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
