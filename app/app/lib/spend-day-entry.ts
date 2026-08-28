import {
  resolvePeriod,
  type DateRange,
  type PeriodPreset,
} from "./periods";
import { shopLocalDayRange } from "./shop-local-day";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function isSpendYmd(value: string): boolean {
  return YMD.test(value.trim());
}

/**
 * One-day Add spend uses spendDate (YYYY-MM-DD). Missing/invalid date keeps
 * the selected period lump (legacy manual form).
 */
export function resolveManualSpendRange(opts: {
  spendDate: string | null | undefined;
  periodPreset: PeriodPreset;
  now?: Date;
  timeZone?: string | null;
}): DateRange {
  const ymd = (opts.spendDate ?? "").trim();
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? null;
  if (isSpendYmd(ymd)) {
    if (timeZone) {
      const day = shopLocalDayRange(ymd, timeZone);
      return { start: day.start, end: day.end, label: ymd };
    }
    const [year, month, day] = ymd.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start, end, label: ymd };
  }
  return resolvePeriod(opts.periodPreset, now, timeZone);
}
