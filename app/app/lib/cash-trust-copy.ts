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
      heading: "Sales still syncing — expected after install",
      body: `Shopify sales for ${periodLabel} are still filling in (0 of ${expectedClosedDays} days ready). This is not an error. Import spend on Spend — Total ROAS updates as days close. Refresh in a few minutes.`,
    };
  }

  return {
    heading: "Sales facts still backfilling",
    body: `Sales loaded for ${factDays} of ${expectedClosedDays} days in ${periodLabel}. Refresh in a few minutes for more coverage. The desk stays usable while backfill runs.`,
  };
}
