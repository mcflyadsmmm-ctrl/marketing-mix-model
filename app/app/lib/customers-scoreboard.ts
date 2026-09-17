/**
 * Customers tab scoreboard — Shopify-order-data only.
 *
 * Hero is sales from *returning* customers in dollars. Shopify Analytics
 * Overview shows a returning-customer *rate* (headcount); this tab answers
 * "how many dollars came from buyers who had ordered before" plus how those
 * dollars concentrate. Zero spend / ROAS on this tab — that lives on Marketing.
 *
 * These helpers stay Prisma-free and currency-free so they unit-test cleanly;
 * the React components format the numbers with the shop currency.
 */

/** Contrast lede — dollars, not the Shopify Overview headcount rate. */
export const CUSTOMERS_CONTRAST =
  "Shopify Analytics Overview shows a returning-customer rate — headcount. This tab is returning dollars, who spends more, guests, and how concentrated your sales are.";

/** Kicker under the hero when Live (SR-only when SAMPLE so numbers lead). */
export const CUSTOMERS_KICKER =
  "Shopify orders · last ~60 days available · dollars, not headcount";

/** Returning hero empty — never headcount, never a fake $0. */
export const CUSTOMERS_RETURNING_EMPTY =
  "Returning dollars need identified buyers in this window — not $0.";

export const CUSTOMERS_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

/** A share worth painting rounds to at least 1% — never a fake 0% row. */
function hasShare(share: number | null | undefined): share is number {
  return isNum(share) && Math.round(share * 100) > 0;
}

/** Whole percent — 42%, never 42.0%. */
export function wholePercent(share: number): number {
  return Math.round(share * 100);
}

/**
 * Returning dollars for the hero. Missing / $0 returning is an em dash in the
 * component — never headcount, never a silent 0.
 */
export function customersReturningDollars(
  returningSales: number | null | undefined,
): number | null {
  if (isNum(returningSales) && returningSales > 0) return returningSales;
  return null;
}

export type CustomerDollarSplit = {
  returningShare: number;
  newShare: number;
  returningPct: number;
  newPct: number;
};

/**
 * New vs returning dollar split for the hero bar. Null when the split is
 * unknown (missing customer flags) or only guests remain — never a fake 0/100.
 */
export function customerDollarSplit(input: {
  newSalesShare: number | null;
  returningSalesShare: number | null;
}): CustomerDollarSplit | null {
  const { newSalesShare, returningSalesShare } = input;
  if (!hasShare(returningSalesShare) && !hasShare(newSalesShare)) return null;
  const returningShare = isNum(returningSalesShare)
    ? Math.min(1, Math.max(0, returningSalesShare))
    : 0;
  const newShare = isNum(newSalesShare)
    ? Math.min(1, Math.max(0, newSalesShare))
    : Math.max(0, 1 - returningShare);
  return {
    returningShare,
    newShare,
    returningPct: wholePercent(returningShare),
    newPct: wholePercent(newShare),
  };
}

export type ConcentrationRowKey =
  | "topCustomers"
  | "returning"
  | "repeat"
  | "biggestOrders";

export type ConcentrationRow = {
  key: ConcentrationRowKey;
  label: string;
  /** Share of this window's sales, 0–1. */
  share: number;
  detail: string;
  /** The headline concentration row (top 10% of buyers) is emphasized. */
  lead: boolean;
};

/**
 * "Where the dollars concentrate" ladder — each row is a share of this
 * window's sales, biggest slice first. Rows that round to 0% (or are unknown)
 * are withheld, never painted as a fake 0%.
 */
export function customerConcentrationRows(input: {
  topCustomerSalesShare: number | null;
  returningSalesShare: number | null;
  repeatSalesShare: number | null;
  topDecileSalesShare: number | null;
}): ConcentrationRow[] {
  const rows: ConcentrationRow[] = [];
  if (hasShare(input.topCustomerSalesShare)) {
    rows.push({
      key: "topCustomers",
      label: "Top 10% of customers",
      share: input.topCustomerSalesShare,
      detail:
        "Share of this window's sales from the highest-spending 10% of identified buyers. High concentration means a few accounts carry the shop.",
      lead: true,
    });
  }
  if (hasShare(input.returningSalesShare)) {
    rows.push({
      key: "returning",
      label: "Returning customers",
      share: input.returningSalesShare,
      detail:
        "Share of sales from buyers who had ordered before. Shopify Analytics Overview shows this as a headcount rate, not dollars.",
      lead: false,
    });
  }
  if (hasShare(input.repeatSalesShare)) {
    rows.push({
      key: "repeat",
      label: "Repeat buyers (2+)",
      share: input.repeatSalesShare,
      detail:
        "Share of sales from identified buyers with two or more orders in this window.",
      lead: false,
    });
  }
  if (hasShare(input.topDecileSalesShare)) {
    rows.push({
      key: "biggestOrders",
      label: "Biggest 10% of orders",
      share: input.topDecileSalesShare,
      detail:
        "Share of sales from the largest 10% of orders. Order concentration — not the same as top customers.",
      lead: false,
    });
  }
  return rows.sort((a, b) => b.share - a.share);
}

/**
 * Two-segment Pareto for the top 10% of customers vs everyone else. Null
 * until the top-customer concentration is known (needs enough buyers).
 */
export type ConcentrationPareto = {
  topPct: number;
  restPct: number;
};

export function customerConcentrationPareto(
  topCustomerSalesShare: number | null,
): ConcentrationPareto | null {
  if (!hasShare(topCustomerSalesShare)) return null;
  const topPct = wholePercent(topCustomerSalesShare);
  return { topPct, restPct: Math.max(0, 100 - topPct) };
}

/** One-line concentration read for the drill / caption. */
export function customerConcentrationHeadline(
  topCustomerSalesShare: number | null,
): string | null {
  if (!hasShare(topCustomerSalesShare)) return null;
  return `Top 10% of customers drive ${wholePercent(topCustomerSalesShare)}% of sales.`;
}
