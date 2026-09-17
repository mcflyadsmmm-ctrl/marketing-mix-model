import { resolveSalesReadiness } from "./sales-pending";

/**
 * Overview first viewport — Shopify-order-data only.
 * Typical order, returning dollars, weekend vs weekday, and an open sales
 * chart live here. Marketing tabs own entered cash later.
 */

export const OVERVIEW_COVERAGE_LINE =
  "Shopify orders · last ~60 days available · returns included";

export const OVERVIEW_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

/** Overview as-of chip — never “still loading sales days” next to a sealed $0. */
export const OVERVIEW_PENDING_ASOF = " · still loading — not $0";

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

export type OverviewGreetingInput = {
  salesPending: boolean;
  sales: number;
  coverageComplete?: boolean | null;
  periodExceedsFactWindow?: boolean;
  useSampleDesk?: boolean;
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
