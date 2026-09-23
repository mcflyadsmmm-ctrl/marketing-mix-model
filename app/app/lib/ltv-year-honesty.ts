/**
 * First-year LTV is a certified dollar only when the stored book can hold
 * a year. Unpaid / trial is 90 closed days. A short, truncated, or still
 * pending book stays — / not on file. Never a certified $0 year.
 */

import type { LiveIngestDepth } from "./live-ingest-depth";

export const LTV_YEAR_DAYS = 365;

const COHORT_MONTH = /^(\d{4})-(\d{2})$/;
const DAY_MS = 86_400_000;

/**
 * Whole-dollar chrome. A missing, zero, or sub-dollar year formats as `$0`
 * and is not on file.
 */
export function paintedYearDollars(
  value: number | null | undefined,
): number | null {
  if (value == null || !Number.isFinite(value) || value < 0.5) return null;
  return value;
}

/**
 * True when first-year / 365 must stay blank.
 * Trial slice blocks even if older rows are still stored. A paid book
 * blocks when the orders on file do not span a year.
 */
export function firstYearBlocked(input: {
  historyLimited?: boolean;
  orderBookDepth?: LiveIngestDepth | null;
  bookSpanDays?: number | null;
}): boolean {
  if (input.historyLimited) return true;
  const depth = input.orderBookDepth;
  if (depth != null) {
    switch (depth) {
      case "trial_slice":
        return true;
      case "paid_full":
        break;
      default: {
        const _never: never = depth;
        return _never;
      }
    }
  }
  const span = input.bookSpanDays;
  if (span != null && Number.isFinite(span) && span < LTV_YEAR_DAYS) return true;
  return false;
}

/** Closed days from the oldest order on file to `asOf`. Null when the book is empty. */
export function orderBookSpanDays(
  orderedAt: readonly Date[],
  asOf: Date,
): number | null {
  let oldest = Number.POSITIVE_INFINITY;
  for (const at of orderedAt) {
    const ms = at.getTime();
    if (Number.isFinite(ms) && ms < oldest) oldest = ms;
  }
  if (!Number.isFinite(oldest)) return null;
  return Math.floor((asOf.getTime() - oldest) / DAY_MS);
}

/**
 * A first-order month has lived a year when 365 days have passed since
 * the first of that month. Younger months are pending — not a $0 year.
 */
export function cohortHasLivedYear(cohortMonth: string, asOf: Date): boolean {
  const match = COHORT_MONTH.exec(cohortMonth);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return false;
  const start = Date.UTC(year, month - 1, 1);
  return asOf.getTime() - start >= LTV_YEAR_DAYS * DAY_MS;
}
