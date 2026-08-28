/**
 * Shared history horizon for Sample data and Live data, trial and paid.
 * Closed days from January 1 of (UTC year − N) through today.
 * Date slicers only change the view — they do not shrink this window.
 */

export const DESK_HISTORY_YEARS_BACK = 5;

/** UTC calendar year of the floor (e.g. 2026 → 2021). */
export function deskHistoryFloorYear(now: Date = new Date()): number {
  return now.getUTCFullYear() - DESK_HISTORY_YEARS_BACK;
}

/** YYYY-MM-DD for January 1 of the floor year. */
export function deskHistoryFloorKey(now: Date = new Date()): string {
  return `${deskHistoryFloorYear(now)}-01-01`;
}

/** Merchant-facing scoreboard label. */
export function deskHistoryCaption(now: Date = new Date()): string {
  return `Daily spend by channel, back to January ${deskHistoryFloorYear(now)}.`;
}
