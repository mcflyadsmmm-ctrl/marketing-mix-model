/**
 * Shared history horizon for Sample data and Live data, trial and paid.
 * Closed days from January 1 of (UTC year − N) through today.
 * Date slicers only change the view — they do not shrink this window.
 */

import { PRODUCT_NOUN } from "./product-labels";

export const DESK_HISTORY_YEARS_BACK = 5;

/** UTC calendar year of the floor (e.g. 2026 → 2021). */
export function deskHistoryFloorYear(now: Date = new Date()): number {
  return now.getUTCFullYear() - DESK_HISTORY_YEARS_BACK;
}

/** YYYY-MM-DD for January 1 of the floor year. */
export function deskHistoryFloorKey(now: Date = new Date()): string {
  return `${deskHistoryFloorYear(now)}-01-01`;
}

/**
 * Merchant-facing scoreboard label.
 * Live Shopify sales on this install are ~60 days (`read_orders`), not the
 * five-year spend template floor — do not promise January {floor} here.
 */
export type DeskHistorySurface = "sales" | "spend";

export function deskHistoryCaption(
  _now: Date = new Date(),
  surface: DeskHistorySurface = "sales",
): string {
  if (surface === "spend") {
    return "Daily spend by channel · sales cover the last ~60 days.";
  }
  return "Shopify orders · last ~60 days available · returns included";
}

export function deskPeriodTillLabel(input: {
  periodLabel: string;
  useSampleDesk: boolean;
  shotMode: boolean;
  salesError: string | null;
  blockedMockAsLive: boolean;
  salesSource: string;
  factsIncomplete?: boolean;
}): string {
  if (input.useSampleDesk) {
    return `${input.periodLabel}${PRODUCT_NOUN.samplePeriodSuffix}`;
  }
  if (input.shotMode) return input.periodLabel;
  if (
    input.salesError ||
    input.blockedMockAsLive ||
    input.salesSource === "mock"
  ) {
    return `${input.periodLabel} · sales unavailable`;
  }
  if (input.factsIncomplete) {
    return `${input.periodLabel}${PRODUCT_NOUN.factsIncompleteSuffix}`;
  }
  return `${input.periodLabel} · live sales`;
}

/** Shop-owner date span under Shopify Total Sales (YYYY-MM-DD – YYYY-MM-DD). */
export function formatPeriodDaySpan(startDay: string, endDay: string): string {
  return `${startDay} – ${endDay}`;
}
