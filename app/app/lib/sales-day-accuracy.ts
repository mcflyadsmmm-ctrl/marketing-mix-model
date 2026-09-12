/**
 * Day-accuracy honesty for Sales (and ledger-style desks).
 * Pure helpers — no Prisma. Callers supply expected closed keys + present fact keys.
 *
 * Merchants uninstall when paid numbers are quietly wrong. This module makes
 * missing / open / stale days explicit instead of treating holes as $0.
 */

export type SalesDayAccuracyStatus =
  | "complete"
  | "catching_up"
  | "partial_history"
  | "no_closed_days";

export type SalesDayAccuracySnapshot = {
  status: SalesDayAccuracyStatus;
  expectedClosedDays: number;
  factDays: number;
  missingDayKeys: string[];
  /** Shop-local today — never treated as a final closed fact. */
  openDayKey: string | null;
  /** Newest SalesDayFact.asOf in the period, if known. */
  freshestAsOfIso: string | null;
  /** True when range reaches outside the fact ingest window. */
  periodExceedsFactWindow: boolean;
  /** Short merchant-facing headline. */
  headline: string;
  /** One supporting sentence. */
  detail: string;
};

export function assessSalesDayAccuracy(args: {
  expectedClosedDayKeys: string[];
  presentDayKeys: Iterable<string>;
  openDayKey?: string | null;
  freshestAsOf?: Date | null;
  periodExceedsFactWindow?: boolean;
}): SalesDayAccuracySnapshot {
  const expected = [...new Set(args.expectedClosedDayKeys)].sort();
  const present = new Set(args.presentDayKeys);
  const missingDayKeys = expected.filter((k) => !present.has(k));
  const factDays = expected.length - missingDayKeys.length;
  const openDayKey = args.openDayKey ?? null;
  const periodExceedsFactWindow = Boolean(args.periodExceedsFactWindow);
  const freshestAsOfIso = args.freshestAsOf
    ? args.freshestAsOf.toISOString()
    : null;

  let status: SalesDayAccuracyStatus;
  if (expected.length === 0) {
    status = "no_closed_days";
  } else if (periodExceedsFactWindow) {
    status = "partial_history";
  } else if (missingDayKeys.length === 0) {
    status = "complete";
  } else {
    status = "catching_up";
  }

  const headline = accuracyHeadline(status, {
    expected: expected.length,
    factDays,
    missing: missingDayKeys.length,
  });
  const detail = accuracyDetail(status, {
    missingDayKeys,
    openDayKey,
    freshestAsOfIso,
  });

  return {
    status,
    expectedClosedDays: expected.length,
    factDays: Math.max(0, factDays),
    missingDayKeys,
    openDayKey,
    freshestAsOfIso,
    periodExceedsFactWindow,
    headline,
    detail,
  };
}

function accuracyHeadline(
  status: SalesDayAccuracyStatus,
  counts: { expected: number; factDays: number; missing: number },
): string {
  switch (status) {
    case "complete":
      return `All ${counts.expected} closed day${counts.expected === 1 ? "" : "s"} in this period are filled`;
    case "catching_up":
      return `Still filling ${counts.missing} closed day${counts.missing === 1 ? "" : "s"} (${counts.factDays}/${counts.expected})`;
    case "partial_history":
      return "This period reaches past stored Shopify history";
    case "no_closed_days":
      return "No closed days in this period yet";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function accuracyDetail(
  status: SalesDayAccuracyStatus,
  args: {
    missingDayKeys: string[];
    openDayKey: string | null;
    freshestAsOfIso: string | null;
  },
): string {
  const openNote = args.openDayKey
    ? ` Today (${args.openDayKey}) stays open until shop midnight — not final.`
    : "";
  const synced = args.freshestAsOfIso
    ? ` Last synced ${formatAsOf(args.freshestAsOfIso)}.`
    : "";

  switch (status) {
    case "complete":
      return `Closed days match Shopify order totals for this shop timezone.${synced}${openNote}`;
    case "catching_up": {
      const sample = args.missingDayKeys.slice(0, 3).join(", ");
      const more =
        args.missingDayKeys.length > 3
          ? ` (+${args.missingDayKeys.length - 3} more)`
          : "";
      return `Missing ${sample}${more}. Charts use filled days only — holes are not treated as $0.${synced}${openNote}`;
    }
    case "partial_history":
      return `We only show days inside the stored history window. Extend read_all_orders or wait for backfill before trusting the full label.${openNote}`;
    case "no_closed_days":
      return `Once the first shop-local day closes, daily facts land here.${openNote}`;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function formatAsOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Whether Sales should ask the job queue to refresh recent closed days. */
export function salesDayAccuracyNeedsRefresh(snapshot: SalesDayAccuracySnapshot): boolean {
  if (snapshot.status === "catching_up") return true;
  if (snapshot.status === "partial_history") return true;
  if (!snapshot.freshestAsOfIso) return snapshot.expectedClosedDays > 0;
  const ageMs = Date.now() - new Date(snapshot.freshestAsOfIso).getTime();
  // Closed-day edits/refunds — re-check if oldest sync in view is > 6h.
  return Number.isFinite(ageMs) && ageMs > 6 * 60 * 60 * 1000;
}
