import type { LiveIngestDepth } from "./live-ingest-depth";
import { WEEKDAY_SHORT } from "./shopify-depth-stats";
import { resolveSalesReadiness } from "./sales-pending";

/**
 * Overview first viewport — OrderFact book only on the first fold.
 * Hero dollars are order sums labeled From orders — never Shopify Total
 * Sales / Analytics-matched. Spend stays off Overview. Marketing tabs own cash.
 */

/** First-fold coverage — order book depth only, no ShopifyQL wording. */
export function overviewCoverageLine(depth: LiveIngestDepth): string {
  switch (depth) {
    case "trial_slice":
    case "paid_full":
      return "Up to 24 months of orders";
    default: {
      const _never: never = depth;
      return _never;
    }
  }
}

export const OVERVIEW_COVERAGE_LINE = overviewCoverageLine("paid_full");

export const OVERVIEW_PENDING_IN_TOTAL_SALES =
  "Pending, authorized, COD, and Klarna sit in this Shopify Total Sales.";

export const OVERVIEW_SHOP_NOT_COMPANY =
  "This is Shopify Total Sales for orders on this shop — not the company book.";

export const OVERVIEW_PENDING_LINE =
  "Orders still loading — not $0.";

/** Order-fact crawl resume — N complete closed days on file, window still filling. */
export function overviewOrderBackfillLine(completeDays: number): string {
  const n = Math.max(0, Math.floor(completeDays));
  return `Orders still loading — ${n} days on file — not $0.`;
}

/** Chart / YoY card label — deeper sections; first-fold hero uses From orders. */
export const OVERVIEW_PERIOD_TOTAL_LABEL = "Shopify Total Sales";

export const OVERVIEW_PERIOD_TOTAL_SENTENCE =
  "Shopify Total Sales for this period.";

export const OVERVIEW_LAST_YEAR_NOT_ON_FILE = "not on file";

/** First-lane label — morning YoY from orders, not a soft KPI farm. */
export const OVERVIEW_FIRST_LANE_LABEL =
  "This period vs last year · from orders";

/**
 * Kept for deeper copy — never a first-fold apology essay.
 * Do not claim the order-book hero matches Shopify Analytics.
 */
export const OVERVIEW_ANALYTICS_CONTRAST =
  "Order-book dollars — not Shopify Analytics day totals.";

export const OVERVIEW_THIN_EMPTY_LINE =
  "Typical order, returning $, and weekends fill after paid orders land — not $0.";
/**
 * Deterministic empty-state rhythm (steal map craft) — never an AI analyst.
 * Signal = what we see · Evidence = why the board is — · Next move = what fills.
 */
export type OverviewFinding = {
  signal: string;
  evidence: string;
  next: string;
};

/** Pending sales — scoreboard shells stay up; values stay — not $0. */
export function overviewPendingFinding(): OverviewFinding {
  return {
    signal: "Orders still landing",
    evidence: OVERVIEW_PENDING_LINE,
    next: "Typical order, returning $, and weekend fill as closed days land — not $0.",
  };
}

/** Thin live window — no paid orders yet; never a sealed $0 year. */
export function overviewThinEmptyFinding(): OverviewFinding {
  return {
    signal: "No paid orders in this window yet",
    evidence: OVERVIEW_THIN_EMPTY_LINE,
    next: "After the first paid orders land, YoY and the sales board paint here — never a fake $0 year.",
  };
}

/** Same pad as Customers — peek only; full clock stays on Customers. */
export const OVERVIEW_WINBACK_PAD_DAYS = 15;

/** Overview section ids — daily scoreboard, then mix, then the year board. */
export const OVERVIEW_YOY_GLANCE_ID = "mcfly-yoy-glance";
export const OVERVIEW_MIX_CLOSE_ID = "mcfly-mix-close";
export const OVERVIEW_YOY_YEAR_ID = "mcfly-yoy-year";
export const OVERVIEW_YOY_YEAR_PANEL = "yoy-year";

/** `?panel=` on Overview → section id. Unknown panels stay at the top. */
export function overviewPanelElementId(
  panel: string | null | undefined,
): string | null {
  if (panel === OVERVIEW_YOY_YEAR_PANEL) return OVERVIEW_YOY_YEAR_ID;
  return null;
}

export const OVERVIEW_FIRST_FOLD_HEROES = [
  "typicalOrder",
  "returningDollars",
  "weekendWeekday",
  "yoySameDays",
  "newVsReturningMix",
  "daysToSecond",
  "orderLtvPeek",
  "monthClosePeek",
] as const;

export type OverviewFirstFoldHero = (typeof OVERVIEW_FIRST_FOLD_HEROES)[number];

/** Overview as-of chip — name orders, never a sealed $0. */
export const OVERVIEW_PENDING_ASOF = " · orders still loading — not $0";

/** Live switch landed on Overview — sales only. Spend honesty lives later. */
export const OVERVIEW_LIVE_HANDOFF_BODY =
  "Shopify sales are this shop’s. SAMPLE dollars did not transfer.";

export const OVERVIEW_SALES_ONLY_LINE =
  "Sales in this window come from your Shopify orders.";

export type OverviewNoticeInput = {
  orderCount: number;
  returningSalesShare: number | null;
  discountedOrderShare: number | null;
  medianDaysToSecond: number | null;
  salesPending: boolean;
};

export type OverviewTakeawayInput = {
  typicalOrderLabel: string | null;
  returningSalesShare: number | null;
  salesPending: boolean;
  orderCount: number;
};

export type OverviewOperatorGreetingInput = {
  salesPending: boolean;
  orderCount: number;
  typicalOrderLabel: string | null;
  returningSalesShare: number | null;
  weekendSalesShare?: number | null;
};

export type OverviewLtvPeekDays = 30 | 90 | 365;

export type OverviewHandoffPeek =
  | { kind: "daysToSecond"; days: number; winBack: number }
  | {
      kind: "ltvPeek";
      amount: number;
      windowDays: OverviewLtvPeekDays;
    }
  | {
      kind: "monthClose";
      projected: number;
      remainingDays: number;
      closed: boolean;
    };

export type OverviewGreetingInput = {
  salesPending: boolean;
  sales: number;
  coverageComplete?: boolean | null;
  periodExceedsFactWindow?: boolean;
  useSampleDesk?: boolean;
  /** Paid orders in the selected window — OrderFact book paints the hero. */
  orderCount?: number;
  /** Certified SalesDayFact rows in the selected window. */
  factDays?: number | null;
};

export type OverviewPeekThird =
  | { kind: "weekend"; share: number }
  | { kind: "daysToSecond"; days: number }
  | { kind: "empty" };

export type OverviewWeekendWeekday = {
  weekendPct: number;
  weekdayPct: number;
};

export type OverviewBusiestWeekday = {
  label: string;
  dollars: number | null;
  pct: number;
};

function wholePercent(share: number): number {
  return Math.round(share * 100);
}

/**
 * Overview greeting pending — same bar as `resolveSalesReadiness`.
 * A $0 month with certified fact days is an empty month, not loading.
 * SAMPLE is never pending.
 */
export function overviewGreetingPending(input: OverviewGreetingInput): boolean {
  if (input.useSampleDesk) return false;
  const orderCount =
    input.orderCount != null && Number.isFinite(input.orderCount)
      ? Math.max(0, Math.trunc(input.orderCount))
      : 0;
  if (orderCount > 0) return false;
  if (input.salesPending) return true;

  const sales = Number.isFinite(input.sales) ? input.sales : 0;
  const factDays =
    input.factDays != null && Number.isFinite(input.factDays)
      ? Math.max(0, input.factDays)
      : null;
  const coverageKnown =
    input.coverageComplete != null ||
    factDays != null ||
    Boolean(input.periodExceedsFactWindow);
  if (!coverageKnown) return false;

  return resolveSalesReadiness({
    coverage: {
      complete: input.coverageComplete === true,
      factDays: factDays ?? 0,
      periodExceedsFactWindow: Boolean(input.periodExceedsFactWindow),
    },
    sales,
    useSampleDesk: false,
  }).salesPending;
}

/**
 * One shop-owner sentence. Order facts only — not an AI analyst.
 * Prefer returning-sales share when we have it (the specified 5-second read).
 */
export function overviewNoticeSentence(input: OverviewNoticeInput): string {
  if (input.salesPending) {
    return OVERVIEW_PENDING_LINE;
  }
  if (!(input.orderCount > 0)) {
    return "No orders in this window yet.";
  }
  if (
    input.returningSalesShare != null &&
    Number.isFinite(input.returningSalesShare)
  ) {
    return `Returning customers generated ${wholePercent(input.returningSalesShare)}% of sales in this window.`;
  }
  if (
    input.medianDaysToSecond != null &&
    Number.isFinite(input.medianDaysToSecond)
  ) {
    return `Typical wait to a second order was ${Math.round(input.medianDaysToSecond)} days.`;
  }
  if (
    input.discountedOrderShare != null &&
    Number.isFinite(input.discountedOrderShare) &&
    input.discountedOrderShare >= 0.25
  ) {
    return `${wholePercent(input.discountedOrderShare)}% of orders used a discount.`;
  }
  return OVERVIEW_SALES_ONLY_LINE;
}

/**
 * Uninstall-killer greeting — typical order, returning $, weekends.
 * Never a Total Sales-only scoreboard Shopify already shows.
 */
export function overviewOperatorGreeting(
  input: OverviewOperatorGreetingInput,
): string {
  if (input.salesPending) {
    return OVERVIEW_PENDING_LINE;
  }
  if (!(input.orderCount > 0)) {
    return "No orders in this window yet.";
  }
  const typical = input.typicalOrderLabel
    ? `Typical order around ${input.typicalOrderLabel}.`
    : null;
  const returning =
    input.returningSalesShare != null &&
    Number.isFinite(input.returningSalesShare)
      ? `Returning buyers carry ${wholePercent(input.returningSalesShare)}% of sales.`
      : null;
  const weekend = overviewWeekendWeekday(input.weekendSalesShare);
  const weekendLine = weekend ? `Weekends are ${weekend.weekendPct}%.` : null;
  const parts = [typical, returning, weekendLine].filter(
    (part): part is string => part != null,
  );
  if (parts.length === 0) {
    return OVERVIEW_ANALYTICS_CONTRAST;
  }
  return `${parts.join(" ")} ${OVERVIEW_ANALYTICS_CONTRAST}`;
}

/**
 * PASS only when the first-fold hero is Mcfly-differentiated — not a free
 * Shopify Analytics Overview clone (Total Sales, sessions, returning rate).
 */
export function overviewHeroBeatsShopifyAnalytics(
  hero: OverviewFirstFoldHero,
): boolean {
  switch (hero) {
    case "typicalOrder":
    case "returningDollars":
    case "weekendWeekday":
    case "yoySameDays":
    case "newVsReturningMix":
    case "daysToSecond":
    case "orderLtvPeek":
    case "monthClosePeek":
      return true;
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}

/** Win-back peek = typical wait + 15. Null until a real days-to-second exists. */
export function overviewWinBackDay(
  medianDaysToSecond?: number | null,
): number | null {
  if (
    medianDaysToSecond == null ||
    !Number.isFinite(medianDaysToSecond) ||
    medianDaysToSecond <= 0
  ) {
    return null;
  }
  return Math.round(medianDaysToSecond) + OVERVIEW_WINBACK_PAD_DAYS;
}

/**
 * Second-row peeks — days-to-second / win-back, order LTV, month close.
 * Missing truths stay off the row — never a fake $0 graveyard.
 */
export function overviewHandoffPeeks(input: {
  medianDaysToSecond?: number | null;
  ltvPeek?: number | null;
  ltvPeekDays?: OverviewLtvPeekDays | null;
  historyLimited?: boolean;
  monthClose?: number | null;
  monthCloseRemainingDays?: number | null;
  monthCloseClosed?: boolean;
}): OverviewHandoffPeek[] {
  const peeks: OverviewHandoffPeek[] = [];
  const days = input.medianDaysToSecond;
  const winBack = overviewWinBackDay(days);
  if (
    days != null &&
    Number.isFinite(days) &&
    days > 0 &&
    winBack != null
  ) {
    peeks.push({
      kind: "daysToSecond",
      days: Math.round(days),
      winBack,
    });
  }
  const worth = input.ltvPeek;
  const windowDays = input.ltvPeekDays;
  if (
    worth != null &&
    Number.isFinite(worth) &&
    worth > 0 &&
    (windowDays === 30 || windowDays === 90 || windowDays === 365)
  ) {
    if (!(windowDays === 365 && input.historyLimited)) {
      peeks.push({ kind: "ltvPeek", amount: worth, windowDays });
    }
  }
  const projected = input.monthClose;
  if (projected != null && Number.isFinite(projected) && projected > 0) {
    const remaining =
      input.monthCloseRemainingDays != null &&
      Number.isFinite(input.monthCloseRemainingDays)
        ? Math.max(0, Math.trunc(input.monthCloseRemainingDays))
        : 0;
    peeks.push({
      kind: "monthClose",
      projected,
      remainingDays: remaining,
      closed: input.monthCloseClosed === true || remaining <= 0,
    });
  }
  return peeks;
}

export function overviewLtvWindowLabel(days: OverviewLtvPeekDays): string {
  switch (days) {
    case 30:
      return "first 30 days";
    case 90:
      return "first 90 days";
    case 365:
      return "first year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

/** Demo-desk takeaway — typical order + returning dollars, never an AI analyst. */
export function overviewDecisionTakeaway(input: OverviewTakeawayInput): string {
  if (input.salesPending) {
    return OVERVIEW_PENDING_LINE;
  }
  if (!(input.orderCount > 0)) {
    return "No orders in this window yet.";
  }
  const returning =
    input.returningSalesShare != null &&
    Number.isFinite(input.returningSalesShare)
      ? `Returning buyers carry ${wholePercent(input.returningSalesShare)}% of sales.`
      : null;
  if (input.typicalOrderLabel && returning) {
    return `Typical order around ${input.typicalOrderLabel}. ${returning}`;
  }
  if (input.typicalOrderLabel) {
    return `Typical order around ${input.typicalOrderLabel}.`;
  }
  if (returning) return returning;
  return OVERVIEW_SALES_ONLY_LINE;
}

/**
 * Overview compact Returning is dollars only.
 * Missing returning $ is an em dash — never headcount or a rate %.
 */
export function overviewReturningCompactDollars(
  returningSales: number | null | undefined,
): number | null {
  if (
    returningSales != null &&
    Number.isFinite(returningSales) &&
    returningSales > 0
  ) {
    return returningSales;
  }
  return null;
}

/** Weekend vs weekday percents. Null until a real weekend share exists. */
export function overviewWeekendWeekday(
  weekendSalesShare?: number | null,
): OverviewWeekendWeekday | null {
  if (
    weekendSalesShare == null ||
    !Number.isFinite(weekendSalesShare)
  ) {
    return null;
  }
  const weekendPct = Math.round(weekendSalesShare * 100);
  if (weekendPct <= 0) return null;
  return {
    weekendPct,
    weekdayPct: Math.max(0, 100 - weekendPct),
  };
}

/** Third peek: weekend share, else days-to-second. Never a fake 0%. */
export function overviewPeekThird(input: {
  weekendSalesShare?: number | null;
  medianDaysToSecond?: number | null;
}): OverviewPeekThird {
  const weekend = input.weekendSalesShare;
  if (
    weekend != null &&
    Number.isFinite(weekend) &&
    Math.round(weekend * 100) > 0
  ) {
    return { kind: "weekend", share: weekend };
  }
  const days = input.medianDaysToSecond;
  if (days != null && Number.isFinite(days)) {
    return { kind: "daysToSecond", days };
  }
  return { kind: "empty" };
}

/** Peak weekday dollars for the Overview busiest peek. */
export function overviewBusiestWeekday(input: {
  peakWeekday?: number | null;
  weekdaySalesShare?: number[] | null;
  windowSales?: number | null;
}): OverviewBusiestWeekday | null {
  const peak = input.peakWeekday;
  if (peak == null || !Number.isInteger(peak) || peak < 0 || peak > 6) {
    return null;
  }
  const share = input.weekdaySalesShare?.[peak];
  if (share == null || !Number.isFinite(share) || share <= 0) {
    return null;
  }
  const windowSales = input.windowSales;
  const dollars =
    windowSales != null && Number.isFinite(windowSales) && windowSales > 0
      ? windowSales * share
      : null;
  return {
    label: WEEKDAY_SHORT[peak],
    dollars,
    pct: wholePercent(share),
  };
}
