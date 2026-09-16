/**
 * Overview first viewport — Total Sales + KPI cards after the YoY glance.
 * Total ROAS only when this window has spend. Ad spend lives on Total ROAS /
 * Spend Upload — never a blank 2×2 tile at $0. Spend stays optional.
 */

export const OVERVIEW_COVERAGE_LINE =
  "Shopify orders · last ~60 days available · returns included";

export const OVERVIEW_SPEND_EMPTY_LINE =
  "Spend not added. Overview works without it.";

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

function wholePercent(share: number): number {
  return Math.round(share * 100);
}

/**
 * One shop-owner sentence. Order facts only — not an AI analyst.
 * Prefer returning-sales share when we have it (the specified 5-second read).
 */
export function overviewNoticeSentence(input: OverviewNoticeInput): string {
  if (input.salesPending) {
    return "Sales for closed days are still loading — not $0.";
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
    return "Sales for closed days are still loading — not $0.";
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
