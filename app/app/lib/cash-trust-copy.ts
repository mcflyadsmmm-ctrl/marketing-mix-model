/**
 * Trust-banner copy — keep first-run incomplete coverage from looking like a 404.
 * Reviewers saw “Sales loaded for 0 of 23 days” right after install (App Store 2.1.1 tape).
 * Overview is sales-first: do not greet a $0-spend install with “your spend is saved.”
 */

export function salesFactsIncompleteMessage(input: {
  factDays: number;
  expectedClosedDays: number;
  periodLabel: string;
  hasSpend?: boolean;
}): { heading: string; body: string } {
  const factDays = Math.max(0, Math.floor(input.factDays));
  const expectedClosedDays = Math.max(0, Math.floor(input.expectedClosedDays));
  const periodLabel = input.periodLabel.trim() || "this period";
  const spendTail = input.hasSpend
    ? " Your spend is already counted — days with no spend row are $0. Total ROAS waits rather than show 0×."
    : "";

  if (factDays <= 0) {
    return {
      heading: "Sales are still loading",
      body: `Shopify sales for ${periodLabel} are still filling in (0 of ${expectedClosedDays} days ready). Nothing is wrong and nothing is lost. Incomplete sales are not $0.${spendTail} Refresh in a few minutes.`,
    };
  }

  return {
    heading: `Sales loaded for ${factDays} of ${expectedClosedDays} days`,
    body: `${periodLabel} is still filling in. Incomplete days are not $0.${spendTail} Refresh in a few minutes for full coverage.`,
  };
}

export type OrderHistoryProgressInput = {
  completeDays: number;
  windowDays: number;
  remainingDays: number;
};

/**
 * Closed-day OrderFact crawl — progress / pending, never a spinner and never $0.
 * Sealed books return null so we stay quiet once days are on file.
 */
export function orderHistoryProgressMessage(
  input: OrderHistoryProgressInput,
): { heading: string; body: string } | null {
  const completeDays = Math.max(0, Math.floor(input.completeDays));
  const windowDays = Math.max(0, Math.floor(input.windowDays));
  const remainingDays = Math.max(0, Math.floor(input.remainingDays));
  if (windowDays <= 0 || remainingDays <= 0) return null;

  if (completeDays <= 0) {
    return {
      heading: "Order history still loading",
      body: `0 of ${windowDays} closed days ready. Typical order, returning dollars, and LTV wait — not $0. Refresh in a few minutes.`,
    };
  }

  return {
    heading: `Order history: ${completeDays} of ${windowDays} days ready`,
    body: `Still filling in (${remainingDays} closed ${remainingDays === 1 ? "day" : "days"} left). Incomplete history is not $0. Refresh in a few minutes.`,
  };
}

/**
 * Closed-day OrderFact crawl hit the page cap. Do not name a 60-day Shopify
 * share here — unpaid is 90 closed days, paid order rows are 24 months.
 */
export function truncatedOrderFactsMessage(): {
  heading: string;
  body: string;
} {
  return {
    heading: "Order history still loading",
    body: "A busy closed day has more orders than one fetch can finish in one pass. Typical order, returning dollars, and LTV wait — incomplete sales are not $0. Refresh in a few minutes.",
  };
}

export type HomePendingBannerInput = {
  periodLabel: string;
  hasSpend?: boolean;
  salesFactsIncomplete?: {
    factDays: number;
    expectedClosedDays: number;
  } | null;
  orderBackfillProgress?: OrderHistoryProgressInput | null;
  orderFactsTruncated?: boolean;
  todaySalesTruncated?: boolean;
  todaySalesUnavailable?: boolean;
};

const BANNED_MERCHANT_PHRASES =
  /reports scope|sales totals ingest|orders crawl|not an orders crawl/i;

/** One Home banner when sales / order history is still landing — never stack three. */
export function homePendingBannerMessage(
  input: HomePendingBannerInput,
): { heading: string; body: string } | null {
  const periodLabel = input.periodLabel.trim() || "this period";
  const factDays = Math.max(
    0,
    Math.floor(input.salesFactsIncomplete?.factDays ?? 0),
  );
  const expectedClosedDays = Math.max(
    0,
    Math.floor(input.salesFactsIncomplete?.expectedClosedDays ?? 0),
  );
  const orderProgress = input.orderBackfillProgress
    ? orderHistoryProgressMessage(input.orderBackfillProgress)
    : null;

  if (
    input.salesFactsIncomplete &&
    expectedClosedDays > 0 &&
    factDays < expectedClosedDays
  ) {
    return salesFactsIncompleteMessage({
      factDays,
      expectedClosedDays,
      periodLabel,
      hasSpend: input.hasSpend,
    });
  }

  if (input.todaySalesUnavailable && !input.todaySalesTruncated) {
    return {
      heading: "Today’s sales unavailable",
      body: `Couldn’t refresh today’s live orders. Closed-day sales still drive ${periodLabel} — retry shortly for a complete today top-up.`,
    };
  }

  if (input.todaySalesTruncated) {
    return {
      heading: "Today’s sales may be incomplete",
      body: `Live today is capped at ~100 orders for a fast desk load. High-volume shops can undercount today until the day closes into stored sales facts. Closed days in ${periodLabel} are unaffected.`,
    };
  }

  if (orderProgress) {
    return orderProgress;
  }

  if (input.orderFactsTruncated) {
    return truncatedOrderFactsMessage();
  }

  return null;
}

export function assertMerchantCopy(text: string): void {
  if (BANNED_MERCHANT_PHRASES.test(text)) {
    throw new Error(`Banned merchant phrase in copy: ${text.slice(0, 80)}`);
  }
}

/** Spend first-fold Sales KPI — same today-cap honesty as CashTrustBanners. */
export function spendFirstFoldSalesHint(input: {
  salesPending: boolean;
  periodLabel: string;
  todaySalesTruncated?: boolean;
  todaySalesUnavailable?: boolean;
}): string {
  if (input.salesPending) return "Still loading — not $0";
  const period = input.periodLabel.trim();
  if (input.todaySalesTruncated) {
    const cap = "Live today is capped at ~100 orders for a fast desk load";
    return period ? `${period} · ${cap}` : cap;
  }
  if (input.todaySalesUnavailable) {
    return period
      ? `${period} · today’s sales unavailable`
      : "today’s sales unavailable";
  }
  return input.periodLabel;
}
