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
