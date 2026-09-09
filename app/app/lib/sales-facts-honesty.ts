/**
 * Client-safe sales-fact honesty — no Prisma, no Shopify, no `.server`.
 * Overview's default export cannot import `sales-facts.server`.
 */

export interface SalesFactsCoverage {
  expectedClosedDays: number;
  factDays: number;
  /**
   * True only when the requested period lies entirely inside the Jan-1 × N-year
   * ingest window AND every expected closed day has a fact row. Periods that start
   * before the window are never complete — desk serves stored facts only + honest
   * banners (HARD-STOP: no unbounded live GraphQL on paint).
   */
  complete: boolean;
  /** True when range.start is before the Jan-1 × N-year fact window. */
  periodExceedsFactWindow: boolean;
}

/**
 * Desk honesty for Overview / CashVerdict / trusted hero.
 *
 * Empty facts are never complete (`factDays === 0` is not a trusted quiet period).
 * `complete: true` with $0 sales is only trusted after a live Admin confirm
 * this request — otherwise poisoned $0 rows hero “Below break-even”.
 */
export function salesFactsIncompleteForDesk(
  coverage: SalesFactsCoverage | null | undefined,
  extra?: {
    salesUntrustedZero?: boolean;
    sales?: number;
    liveConfirmedZero?: boolean;
  },
): boolean {
  if (extra?.salesUntrustedZero) return true;
  if (coverage == null) return true;
  const hasSales = (extra?.sales ?? 0) > 0;
  if (hasSales) {
    return !coverage.complete && coverage.expectedClosedDays > 0;
  }
  // $0 sales: empty table / collapsed expected window / missing days / unconfirmed
  // complete $0 — never a trusted 0.00.
  if (coverage.factDays === 0) return true;
  if (!coverage.complete) return true;
  if (extra?.liveConfirmedZero) return false;
  return true;
}

/**
 * Page-open must fill MTD even when coverage.complete is true with $0 rows.
 * Grant only enqueues `deep_history_backfill`; Fly workers are often stopped,
 * so Overview cannot skip sync ingest just because every day already has a fact.
 */
export function salesFactsNeedSyncFill(args: {
  mainCoverage: SalesFactsCoverage;
  dayCoverage: SalesFactsCoverage;
  periodSales: number;
  periodOrders: number;
}): boolean {
  if (!args.mainCoverage.complete || !args.dayCoverage.complete) return true;
  if (args.mainCoverage.factDays === 0 || args.dayCoverage.factDays === 0) {
    return true;
  }
  return args.periodSales === 0 && args.periodOrders === 0;
}

/** Overwrite existing rows when they are empty or a $0 period (poisoned facts). */
export function salesFactsNeedRefreshExisting(args: {
  factDays: number;
  periodSales: number;
  periodOrders: number;
}): boolean {
  return (
    args.factDays === 0 || (args.periodSales === 0 && args.periodOrders === 0)
  );
}
