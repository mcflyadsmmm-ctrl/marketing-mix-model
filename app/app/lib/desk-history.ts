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
  todaySalesTruncated?: boolean;
  todaySalesUnavailable?: boolean;
  /** YTD / Last 12 months vs ~60-day `read_orders` — not a finished year. */
  shopifyOrderWindowLimited?: boolean;
  /** Book pages: mention the Shopify order window on the till. */
  includeShopifyOrderWindow?: boolean;
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
  if (input.shopifyOrderWindowLimited) {
    return `${input.periodLabel} · last ~60 days`;
  }
  if (input.factsIncomplete) {
    return `${input.periodLabel}${PRODUCT_NOUN.factsIncompleteSuffix}`;
  }
  if (input.todaySalesUnavailable && !input.todaySalesTruncated) {
    return `${input.periodLabel} · today’s sales unavailable`;
  }
  if (input.todaySalesTruncated) {
    return `${input.periodLabel} · today’s sales incomplete`;
  }
  if (input.includeShopifyOrderWindow) {
    return `${input.periodLabel} · live sales · last ~60 days`;
  }
  return `${input.periodLabel} · live sales`;
}

/** Contrast vs native Analytics, plus the shared ~60-day Shopify book line. */
export function deskBookLede(contrast: string): string {
  return `${contrast} ${PRODUCT_NOUN.shopifyBookMuted}`;
}

export type DeskBookHonestyNotice = {
  tone: "info" | "warning";
  heading: string;
  body: string;
};

/**
 * Customers / Growth / Orders / LTV — same window honesty as Overview,
 * without mounting CashTrustBanners (spend-centric on a $0-spend book).
 */
export function deskBookHonestyNotices(input: {
  periodLabel: string;
  todaySalesTruncated?: boolean;
  todaySalesUnavailable?: boolean;
  shopifyOrderWindowLimited?: boolean;
}): DeskBookHonestyNotice[] {
  const notices: DeskBookHonestyNotice[] = [];
  const periodLabel = input.periodLabel.trim() || "This period";
  if (input.shopifyOrderWindowLimited) {
    notices.push({
      tone: "info",
      heading: "Sales history limited for this period",
      body: `${periodLabel} is longer than the ~60-day Shopify order window on this install. Sales before that window are not $0. Prefer a shorter period, or switch to Sample data in Settings for a multi-year walkthrough.`,
    });
  }
  if (input.todaySalesTruncated) {
    notices.push({
      tone: "warning",
      heading: "Today’s sales may be incomplete",
      body: "Today’s top-up hit the page cap — closed days are still included. Refresh later for a fuller total.",
    });
  }
  if (input.todaySalesUnavailable && !input.todaySalesTruncated) {
    notices.push({
      tone: "warning",
      heading: "Today’s live sales unavailable",
      body: "Showing closed-day sales only — today’s Shopify pull did not complete.",
    });
  }
  return notices;
}

/** Shop-owner date span under Shopify Total Sales (YYYY-MM-DD – YYYY-MM-DD). */
export function formatPeriodDaySpan(startDay: string, endDay: string): string {
  return `${startDay} – ${endDay}`;
}
