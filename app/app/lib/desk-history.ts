/**
 * Shared history horizon for Sample data and Live data, trial and paid.
 * Closed days from January 1 of (UTC year − N) through today.
 * Date slicers only change the view — they do not shrink this window.
 *
 * Sales day totals ask multi-year ShopifyQL (needs `read_reports`).
 * Unpaid order rows are {@link LIVE_UNPAID_INGEST_DAYS} closed days.
 * Paid order rows stay up to 24 months. When Shopify history is actually
 * limited (~60d without deep scope), callers pass shopifyOrderWindowLimited.
 */

import type { LiveIngestDepth } from "./live-ingest-depth";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import { PRODUCT_NOUN } from "./product-labels";

export const DESK_HISTORY_YEARS_BACK = 5;

export type { LiveIngestDepth };

/** Merchant-facing order-row window for this till. */
export function deskOrderWindowPhrase(depth: LiveIngestDepth): string {
  switch (depth) {
    case "trial_slice":
      return `${LIVE_UNPAID_INGEST_DAYS} closed days of orders`;
    case "paid_full":
      return "up to 24 months of orders";
    default: {
      const _never: never = depth;
      return _never;
    }
  }
}

/** Coverage muted line — names the book this till actually has. */
export function shopifyBookMutedFor(depth: LiveIngestDepth): string {
  switch (depth) {
    case "trial_slice":
      return `From this shop’s orders. Stats Overview skips. ${LIVE_UNPAID_INGEST_DAYS} closed days of order rows · day totals when reports are on. Spend optional.`;
    case "paid_full":
      return PRODUCT_NOUN.shopifyBookMuted;
    default: {
      const _never: never = depth;
      return _never;
    }
  }
}

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
 * Default copy matches paid 24mo order policy + multi-year sales ask — not a blanket ~60d.
 */
export type DeskHistorySurface = "sales" | "spend";

export function deskHistoryCaption(
  _now: Date,
  surface: DeskHistorySurface,
  orderBookDepth: LiveIngestDepth,
): string {
  const window = deskOrderWindowPhrase(orderBookDepth);
  if (surface === "spend") {
    return `Daily spend by channel · sales day totals when reports are on · ${window}.`;
  }
  return `Shopify sales · day totals when reports are on · ${window} · returns included`;
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
  /** YTD / Last 12 months vs limited Shopify history (~60d) — not a finished year. */
  shopifyOrderWindowLimited?: boolean;
  /** Book pages: mention the order-detail window on the till. */
  includeShopifyOrderWindow?: boolean;
  /** Unpaid = 90 closed days. Paid = up to 24 months. SAMPLE uses paid. Required so an omit cannot paint 24 months. */
  orderBookDepth: LiveIngestDepth;
}): string {
  const orderBookDepth = input.orderBookDepth;
  if (input.useSampleDesk) {
    // The public layout names Sample shop once. Do not add a second Sample on the till.
    return input.periodLabel;
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
    return `${input.periodLabel} · today’s sales still loading`;
  }
  if (input.todaySalesTruncated) {
    return `${input.periodLabel} · today’s sales incomplete`;
  }
  if (input.includeShopifyOrderWindow) {
    return `${input.periodLabel} · live sales · ${deskOrderWindowPhrase(orderBookDepth)}`;
  }
  return `${input.periodLabel} · live sales`;
}

/** Contrast vs native Analytics, plus the shared book coverage line. */
export function deskBookLede(
  contrast: string,
  orderBookDepth: LiveIngestDepth,
): string {
  return `${contrast} ${shopifyBookMutedFor(orderBookDepth)}`;
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
      heading: "Today’s sales still loading",
      body: "Today’s sales are still syncing — not $0. Closed days already on file stay on the desk.",
    });
  }
  return notices;
}

/** Shop-owner date span under Shopify Total Sales (YYYY-MM-DD – YYYY-MM-DD). */
export function formatPeriodDaySpan(startDay: string, endDay: string): string {
  return `${startDay} – ${endDay}`;
}
