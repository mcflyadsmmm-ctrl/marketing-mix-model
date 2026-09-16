/**
 * Daily-rate fill preview — client-safe.
 * A far-back first day still writes empty days through yesterday; this names
 * the day count so the merchant confirms before a multi-month write.
 */

import { isSpendYmd } from "./spend-day-entry";

export const RECURRING_LONG_FILL_DAYS = 31;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function addUtcYmd(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

export function recurringFillDayCount(
  fromYmd: string,
  throughYmd: string,
): number {
  if (!isSpendYmd(fromYmd) || !isSpendYmd(throughYmd)) return 0;
  if (fromYmd > throughYmd) return 0;
  let count = 0;
  let cursor = fromYmd;
  for (let i = 0; i < 2000; i++) {
    count += 1;
    if (cursor === throughYmd) return count;
    cursor = addUtcYmd(cursor, 1);
  }
  return count;
}

export function recurringFillNeedsConfirm(dayCount: number): boolean {
  return dayCount > RECURRING_LONG_FILL_DAYS;
}

export function recurringFillPreviewCopy(opts: {
  fromYmd: string;
  throughYmd: string;
  amount?: number;
  currency?: string;
}): { dayCount: number; needsConfirm: boolean; body: string } {
  const dayCount = recurringFillDayCount(opts.fromYmd, opts.throughYmd);
  const needsConfirm = recurringFillNeedsConfirm(dayCount);
  if (dayCount <= 0) {
    return {
      dayCount: 0,
      needsConfirm: false,
      body: "Pick a first day on or before yesterday.",
    };
  }
  const money =
    opts.amount != null &&
    Number.isFinite(opts.amount) &&
    opts.amount > 0 &&
    opts.currency
      ? ` · about ${opts.currency} ${(opts.amount * dayCount).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} if every empty day fills`
      : "";
  if (dayCount === 1) {
    return {
      dayCount,
      needsConfirm: false,
      body: `Fills 1 empty day through yesterday${money}. Typed or uploaded days stay.`,
    };
  }
  return {
    dayCount,
    needsConfirm,
    body: needsConfirm
      ? `Fills empty days from ${opts.fromYmd} through yesterday — ${dayCount} days${money}. Confirm below to write that many days. Typed or uploaded days stay.`
      : `Fills ${dayCount} empty days through yesterday${money}. Typed or uploaded days stay.`,
  };
}

export function recurringFillConfirmRequiredError(
  dayCount: number,
  fromYmd: string,
  throughYmd: string,
): string {
  return `That daily rate would write ${dayCount} days (${fromYmd} → ${throughYmd}). Check the box to confirm a fill that long. Typed or uploaded days stay.`;
}
