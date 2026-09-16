/**
 * Prior-period compare chips — same sales basis as the hero.
 * Never compare Net ÷ spend to Total ÷ spend.
 */

import { computeMer } from "@mcfly/mer-engine";
import { actionSalesForBasis, type SalesBasisPreference } from "./sales-basis";

export type PeriodDeltas = {
  priorLabel: string;
  priorSales: number;
  priorSpend: number;
  priorMer: number | null;
  salesPct: number | null;
  spendPct: number | null;
  /** Absolute MER change (current − prior), in × units. */
  merAbs: number | null;
};

export function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

export function periodDeltasForBasis(input: {
  basis: SalesBasisPreference;
  currentSales: number;
  currentMer: number | null;
  currentSpend: number;
  priorTotalSales: number;
  priorNetSales?: number | null;
  priorNetSalesKnown?: boolean;
  priorSpend: number;
  priorLabel: string;
}): PeriodDeltas | null {
  const priorAction = actionSalesForBasis(
    {
      totalSales: input.priorTotalSales,
      netSales: input.priorNetSales,
      netSalesKnown: input.priorNetSalesKnown,
    },
    input.basis,
  );
  if (input.basis === "net" && priorAction.netUnavailable) {
    return null;
  }
  const priorMer = computeMer(priorAction.sales, input.priorSpend);
  return {
    priorLabel: input.priorLabel,
    priorSales: priorAction.sales,
    priorSpend: input.priorSpend,
    priorMer,
    salesPct: pctChange(input.currentSales, priorAction.sales),
    spendPct: pctChange(input.currentSpend, input.priorSpend),
    merAbs:
      input.currentMer !== null && priorMer !== null
        ? Math.round((input.currentMer - priorMer) * 100) / 100
        : null,
  };
}
