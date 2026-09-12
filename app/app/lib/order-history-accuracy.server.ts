import {
  ORDER_FACT_DAY_COMPLETE_PREFIX,
  ORDER_FACT_SOURCE,
  orderFactDayCompleteMarkerId,
} from "./order-facts.server";
import { closedLedgerDayKeys } from "./period-ledger.server";
import { shopLocalDayKey } from "./shop-local-day";
import { getSalesFactsCoverage } from "./sales-facts.server";
import {
  assessOrderHistoryAccuracy,
  orderHistoryAccuracyNeedsRefresh,
  type OrderHistoryAccuracySnapshot,
} from "./order-history-accuracy";
import prisma from "../db.server";

/**
 * Order-history seal coverage for the selected period.
 * Optionally signals that Customers depth should keep crawling.
 */
export async function loadOrderHistoryAccuracy(args: {
  shopId: string;
  range: { start: Date; end: Date };
  ianaTimezone: string | null | undefined;
  now?: Date;
  grantedScopes?: string | null;
  useSampleDesk?: boolean;
}): Promise<OrderHistoryAccuracySnapshot> {
  const now = args.now ?? new Date();
  const timeZone = args.ianaTimezone?.trim() || null;

  if (!timeZone || args.useSampleDesk) {
    return assessOrderHistoryAccuracy({
      expectedClosedDayKeys: [],
      sealedDayKeys: [],
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

  const sealedDayKeys = await listSealedOrderFactDayKeys(
    args.shopId,
    expectedClosedDayKeys,
  );

  return assessOrderHistoryAccuracy({
    expectedClosedDayKeys,
    sealedDayKeys,
    openDayKey: shopLocalDayKey(now, timeZone),
    periodExceedsFactWindow: coverage.periodExceedsFactWindow,
  });
}

export async function listSealedOrderFactDayKeys(
  shopId: string,
  dayKeys: string[],
): Promise<string[]> {
  if (dayKeys.length === 0) return [];
  const markers = await prisma.orderFact.findMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      shopifyOrderId: {
        in: dayKeys.map((k) => orderFactDayCompleteMarkerId(k)),
      },
    },
    select: { shopifyOrderId: true },
  });
  return markers.map((r) =>
    r.shopifyOrderId.replace(ORDER_FACT_DAY_COMPLETE_PREFIX, ""),
  );
}

/** Re-export for callers that only need the refresh predicate. */
export { orderHistoryAccuracyNeedsRefresh };
