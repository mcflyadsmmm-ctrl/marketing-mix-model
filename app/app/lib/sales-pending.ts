/**
 * When is a Total ROAS number not worth showing?
 *
 * 2026-08-26 Admin smoke: Overview showed "$0 sales ÷ $650 spend = 0.00×" on a
 * fresh install with 0 of 25 closed sales days ready. Sales were unknown, not
 * zero. A merchant reads 0.00× as "my ads made nothing" and may cut spend.
 *
 * Two separate thresholds, because they protect different things:
 *
 * - `salesPending` — nothing has landed yet, so there is no ratio to show.
 *   Suppress the number entirely rather than print a false zero.
 * - `salesCoverageIncomplete` — some days are missing, so the ratio is real but
 *   understated. Show it (the desk stays usable) and withhold break-even
 *   advice, because "cut or shift spend" from a half-loaded period is wrong.
 *
 * Pure — no Prisma, no clock.
 */

export type SalesCoverageSlice = {
  /** Every expected closed day in the period has a stored fact row. */
  complete: boolean;
  /** Closed days actually stored for the period. */
  factDays: number;
  /** Period starts before the fact window — a different, disclosed situation. */
  periodExceedsFactWindow: boolean;
};

export type SalesPendingInput = {
  coverage: SalesCoverageSlice | null | undefined;
  /** Sales resolved for the period on the current sales basis. */
  sales: number;
  /** Sample desk numbers are complete by construction. */
  useSampleDesk: boolean;
};

export type SalesReadiness = {
  /** Suppress the ratio: sales are unknown for this period, not $0. */
  salesPending: boolean;
  /** Withhold break-even advice: the period is still filling in. */
  salesCoverageIncomplete: boolean;
};

export function resolveSalesReadiness(
  input: SalesPendingInput,
): SalesReadiness {
  const { coverage, sales, useSampleDesk } = input;

  /*
   * A period reaching before the fact window is capped, not loading, and gets
   * its own banner. Treat it as complete here so the desk still shows a number
   * for the days it does have.
   */
  const stillLoading =
    !useSampleDesk &&
    coverage != null &&
    !coverage.complete &&
    !coverage.periodExceedsFactWindow;

  return {
    /*
     * Requires BOTH zero stored days and zero resolved sales. A shop that
     * genuinely made $0 with complete coverage keeps its honest 0.00×, and a
     * partially loaded period keeps the real ratio it can support.
     */
    salesPending: stillLoading && coverage!.factDays <= 0 && sales <= 0,
    salesCoverageIncomplete: stillLoading,
  };
}
