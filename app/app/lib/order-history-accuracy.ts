/**
 * Order-history honesty for Customers (and order-fact depth charts).
 * Pure helpers — no Prisma.
 *
 * Day seals (`__day_complete__`) mark a closed shop-local day as fully crawled.
 * Missing seals mean cohort / concentration / repeat charts are still filling —
 * never treat a thin OrderFact set as the final customer picture.
 */

export type OrderHistoryAccuracyStatus =
  | "complete"
  | "catching_up"
  | "partial_history"
  | "no_closed_days";

export type OrderHistoryAccuracySnapshot = {
  status: OrderHistoryAccuracyStatus;
  expectedClosedDays: number;
  sealedDays: number;
  missingDayKeys: string[];
  openDayKey: string | null;
  periodExceedsFactWindow: boolean;
  headline: string;
  detail: string;
};

export function assessOrderHistoryAccuracy(args: {
  expectedClosedDayKeys: string[];
  sealedDayKeys: Iterable<string>;
  openDayKey?: string | null;
  periodExceedsFactWindow?: boolean;
}): OrderHistoryAccuracySnapshot {
  const expected = [...new Set(args.expectedClosedDayKeys)].sort();
  const sealed = new Set(args.sealedDayKeys);
  const missingDayKeys = expected.filter((k) => !sealed.has(k));
  const sealedDays = expected.length - missingDayKeys.length;
  const openDayKey = args.openDayKey ?? null;
  const periodExceedsFactWindow = Boolean(args.periodExceedsFactWindow);

  let status: OrderHistoryAccuracyStatus;
  if (expected.length === 0) {
    status = "no_closed_days";
  } else if (periodExceedsFactWindow) {
    status = "partial_history";
  } else if (missingDayKeys.length === 0) {
    status = "complete";
  } else {
    status = "catching_up";
  }

  return {
    status,
    expectedClosedDays: expected.length,
    sealedDays: Math.max(0, sealedDays),
    missingDayKeys,
    openDayKey,
    periodExceedsFactWindow,
    headline: orderHistoryHeadline(status, {
      expected: expected.length,
      sealedDays: Math.max(0, sealedDays),
      missing: missingDayKeys.length,
    }),
    detail: orderHistoryDetail(status, {
      missingDayKeys,
      openDayKey,
    }),
  };
}

function orderHistoryHeadline(
  status: OrderHistoryAccuracyStatus,
  counts: { expected: number; sealedDays: number; missing: number },
): string {
  switch (status) {
    case "complete":
      return `Order history sealed for all ${counts.expected} closed day${counts.expected === 1 ? "" : "s"}`;
    case "catching_up":
      return `Still crawling order history (${counts.sealedDays}/${counts.expected} days sealed)`;
    case "partial_history":
      return "Customer depth reaches past stored Shopify order history";
    case "no_closed_days":
      return "No closed days in this period yet";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function orderHistoryDetail(
  status: OrderHistoryAccuracyStatus,
  args: { missingDayKeys: string[]; openDayKey: string | null },
): string {
  const openNote = args.openDayKey
    ? ` Today (${args.openDayKey}) stays open until shop midnight.`
    : "";

  switch (status) {
    case "complete":
      return `Repeat, cohort, and concentration charts use a full order crawl for this period.${openNote}`;
    case "catching_up": {
      const sample = args.missingDayKeys.slice(0, 3).join(", ");
      const more =
        args.missingDayKeys.length > 3
          ? ` (+${args.missingDayKeys.length - 3} more)`
          : "";
      return `Unsealed ${sample}${more}. Charts stay partial until those days finish crawling — not a final customer picture.${openNote}`;
    }
    case "partial_history":
      return `Extend read_all_orders or wait for backfill before trusting full-period buyer depth.${openNote}`;
    case "no_closed_days":
      return `Buyer depth fills after the first shop-local day closes.${openNote}`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function orderHistoryAccuracyNeedsRefresh(
  snapshot: OrderHistoryAccuracySnapshot,
): boolean {
  return (
    snapshot.status === "catching_up" || snapshot.status === "partial_history"
  );
}
