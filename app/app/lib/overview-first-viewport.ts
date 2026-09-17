/**
 * Overview first viewport — Shopify-depth peeks after the YoY glance.
 * Total ROAS / ad spend / EOM projected ROAS never live here. Those sit on
 * Total ROAS after Spend Upload. Spend stays optional forever on this tab.
 */

export const OVERVIEW_COVERAGE_LINE =
  "Shopify orders · last ~60 days available · returns included";

export const OVERVIEW_SPEND_EMPTY_LINE =
  "Spend is optional. Overview works without it.";

export const OVERVIEW_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

export const OVERVIEW_SPEND_DOOR_LINE =
  "Spend is optional. Total ROAS lives on that tab after you add spend.";

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

export type OverviewGreetingInput = {
  salesPending: boolean;
  sales: number;
  coverageComplete?: boolean | null;
  periodExceedsFactWindow?: boolean;
  useSampleDesk?: boolean;
};

export type OverviewPeekThird =
  | { kind: "weekend"; share: number }
  | { kind: "daysToSecond"; days: number }
  | { kind: "empty" };

function wholePercent(share: number): number {
  return Math.round(share * 100);
}

/**
 * Overview greeting pending — chrome “still loading sales days” must not
 * become a finished $0 year. Incomplete coverage + $0 sales is unknown,
 * even when a few empty fact days already exist.
 */
export function overviewGreetingPending(input: OverviewGreetingInput): boolean {
  if (input.useSampleDesk) return false;
  if (input.salesPending) return true;
  const sales = Number.isFinite(input.sales) ? input.sales : 0;
  const incomplete =
    input.coverageComplete === false && !input.periodExceedsFactWindow;
  return incomplete && sales <= 0;
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
  return "Sales in this window come from your Shopify orders. Spend is optional.";
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
  return "Sales in this window come from your Shopify orders. Spend is optional.";
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
