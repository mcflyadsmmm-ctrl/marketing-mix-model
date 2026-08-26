/**
 * Trust-banner copy — keep first-run incomplete coverage from looking like a 404.
 * Reviewers saw “Sales loaded for 0 of 23 days” right after install (App Store 2.1.1 tape).
 */

export function salesFactsIncompleteMessage(input: {
  factDays: number;
  expectedClosedDays: number;
  periodLabel: string;
}): { heading: string; body: string } {
  const factDays = Math.max(0, Math.floor(input.factDays));
  const expectedClosedDays = Math.max(0, Math.floor(input.expectedClosedDays));
  const periodLabel = input.periodLabel.trim() || "this period";

  if (factDays <= 0) {
    return {
      heading: "Your spend is saved — sales are still loading",
      body: `Shopify sales for ${periodLabel} are still filling in (0 of ${expectedClosedDays} days ready). Nothing is wrong and nothing is lost. Total ROAS waits rather than show 0× against sales we do not have yet. Refresh in a few minutes.`,
    };
  }

  return {
    heading: `Sales loaded for ${factDays} of ${expectedClosedDays} days`,
    body: `${periodLabel} is still filling in. Your spend is already counted for every day — days with no spend row are $0. Refresh in a few minutes for full coverage.`,
  };
}
