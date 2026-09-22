/**
 * Spend coverage strip keys. Shop IANA when set; SAMPLE passes UTC via
 * deskPeriodTimeZone. Empty TZ stays the host calendar — never invent a zone.
 */

import {
  hostLocalDayKey,
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  spendDeskTodayKey,
} from "./shop-local-day";

/** Last N calendar days for the coverage strip (history, not just a month). */
export const SPEND_COVERAGE_DAYS = 90;

function startOfHostDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addHostDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return startOfHostDay(next);
}

function hostCoverageDateKeys(now: Date, days: number): string[] {
  const today = startOfHostDay(now);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(hostLocalDayKey(addHostDays(today, -i)));
  }
  return keys;
}

/**
 * 90 civil days ending shop-local today (inclusive). Last key is open today.
 * `timeZone` is `deskPeriodTimeZone` (UTC on SAMPLE, shop IANA on Live).
 */
export function spendCoverageDateKeys(
  now: Date,
  timeZone: string | null | undefined,
  days = SPEND_COVERAGE_DAYS,
): string[] {
  const tz = timeZone?.trim() || null;
  if (!tz) return hostCoverageDateKeys(now, days);
  const todayKey = shopLocalDayKey(now, tz);
  if (days <= 1) return [todayKey];
  const closed = listRecentClosedShopLocalDays(tz, days - 1, now);
  return [...closed, todayKey];
}

/** Closed days only — incomplete today stays out, or is named open by the caller. */
export function spendCoverageClosedDateKeys(
  dateKeys: readonly string[],
  todayKey: string,
): string[] {
  return dateKeys.filter((key) => key !== todayKey);
}

/**
 * Spend rows are UTC-midnight (or noon) of the typed civil date.
 * Always read the UTC calendar — never the host Date.
 */
export function spendEntryCoverageDateKey(stamp: Date): string {
  const y = stamp.getUTCFullYear();
  const m = String(stamp.getUTCMonth() + 1).padStart(2, "0");
  const d = String(stamp.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function spendCoverageTodayKey(
  now: Date,
  timeZone: string | null | undefined,
): string {
  return spendDeskTodayKey(timeZone, now);
}
