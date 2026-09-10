/**
 * The concrete cut/keep call, in dollars, from the allocation math mer-core
 * already computed. Nothing new is inferred here: the percent and the scope
 * come from `suggestAllocation`, this only spends them against period cash so a
 * merchant reads "cut $450, keep $1,050" instead of "-30%".
 *
 * Religion: period averages (sales ÷ spend), never marginal or causal ROAS;
 * constrained by mer-core's spend floor — keep at least half of period spend,
 * one step, never zero; no path credit.
 */

import {
  clampSpendFloorCutPct,
  SPEND_FLOOR_PCT,
  type AllocationAction,
  type SuggestAllocationResult,
} from "@mcfly/mer-core";
import { SPEND_CHANNEL_LABELS, type SpendChannel } from "@mcfly/mer-engine";
import { formatCurrency, formatMer } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";

/** Share of period spend that must stay live after one step. */
export const ALLOCATION_KEEP_PCT = 100 - SPEND_FLOOR_PCT;

export type AllocationPlanKind = "cut" | "keep" | "unavailable";

export type AllocationPlan = {
  kind: AllocationPlanKind;
  /** One sentence a merchant can act on this morning. */
  headline: string;
  /** What stays live, and the floor it may never cross. */
  keepLine: string;
  /** Optional redeploy of the freed cash — only when operator channel splits exist. */
  redeployLine: string | null;
  /** Dollars out of `scopeLabel` this step; null when the call is keep. */
  cutAmount: number | null;
  /** Period spend still running after the step. */
  keepAmount: number;
  /** ALLOCATION_KEEP_PCT of period spend — cutAmount can never breach it. */
  keepFloor: number;
  /** Channel display name, "Portfolio", or null when the call is period-wide. */
  scopeLabel: string | null;
  /** Spend the percent is taken from (channel spend, or period spend). */
  scopeSpend: number;
  cutPct: number | null;
  testDays: number;
};

/** Channel keys are stored codes — show merchant labels. */
export function allocationChannelLabel(channel: string): string {
  return SPEND_CHANNEL_LABELS[channel as SpendChannel] ?? channel;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function scopeLabelFor(action: AllocationAction): string | null {
  if (action.channel === "—") return null;
  if (action.channel === "portfolio") return "Portfolio";
  return allocationChannelLabel(action.channel);
}

function scopeSpendFor(
  action: AllocationAction,
  allocation: SuggestAllocationResult,
): number {
  const channel = allocation.inputs.channelEfficiencies.find(
    (c) => c.name === action.channel,
  );
  return channel && channel.spend > 0
    ? channel.spend
    : allocation.inputs.totalSpend;
}

function firstAction(
  actions: AllocationAction[],
  type: AllocationAction["type"],
): AllocationAction | null {
  return actions.find((a) => a.type === type) ?? null;
}

/**
 * Turn the computed action list into a dollarized cut/keep call.
 * Returns null when there is no allocation (the page is locked instead).
 */
export function resolveAllocationPlan(
  allocation: SuggestAllocationResult | null,
): AllocationPlan | null {
  if (!allocation) return null;

  const totalSpend = allocation.inputs.totalSpend;
  const keepFloor = round2((totalSpend * ALLOCATION_KEEP_PCT) / 100);
  const testDays = allocation.suggestedTestDays;

  if (!(totalSpend > 0)) {
    return {
      kind: "unavailable",
      headline: `No spend logged for this period — nothing to cut or keep yet.`,
      keepLine: `${PRODUCT_NOUN.totalRoas} is sales ÷ spend. Log daily spend and the call sizes itself.`,
      redeployLine: null,
      cutAmount: null,
      keepAmount: 0,
      keepFloor: 0,
      scopeLabel: null,
      scopeSpend: 0,
      cutPct: null,
      testDays,
    };
  }

  const cut = firstAction(allocation.actions, "cut");
  if (cut) {
    const cutPct = clampSpendFloorCutPct(Math.abs(cut.percentChange ?? 0));
    const scopeSpend = scopeSpendFor(cut, allocation);
    const scopeLabel = scopeLabelFor(cut) ?? "Portfolio";
    // Channel-scoped percents still answer to the period floor.
    const maxCut = Math.max(0, round2(totalSpend - keepFloor));
    const cutAmount = round2(Math.min((scopeSpend * cutPct) / 100, maxCut));
    const keepAmount = round2(totalSpend - cutAmount);
    const shift = firstAction(allocation.actions, "shift");

    return {
      kind: "cut",
      headline: `Cut ${scopeLabel} spend by ${formatCurrency(cutAmount)} (~${cutPct}%) for ${testDays} days.`,
      keepLine: `Keep ${formatCurrency(keepAmount)} of ${formatCurrency(totalSpend)} period spend live — floor is ${formatCurrency(keepFloor)} (${ALLOCATION_KEEP_PCT}% of period spend). One step, never zero.`,
      redeployLine: shift
        ? `Optional: move up to ${formatCurrency(round2((cutAmount * Math.min(100, Math.abs(shift.percentChange ?? 0))) / 100))} of the freed cash to ${scopeLabelFor(shift) ?? "your strongest line"} using the channel cash splits you entered — an affordability move, not path credit.`
        : null,
      cutAmount,
      keepAmount,
      keepFloor,
      scopeLabel,
      scopeSpend: round2(scopeSpend),
      cutPct,
      testDays,
    };
  }

  const hold = firstAction(allocation.actions, "hold");
  if (hold) {
    return {
      kind: "keep",
      headline: `Keep all ${formatCurrency(totalSpend)} of this period’s spend — no cut this step.`,
      keepLine: `${PRODUCT_NOUN.totalRoas} ${formatMer(allocation.overallMer)}× is at or above break-even ${formatMer(allocation.breakEvenMer)}× on this period's averages. Re-read it when the next closed day lands.`,
      redeployLine: null,
      cutAmount: null,
      keepAmount: round2(totalSpend),
      keepFloor,
      scopeLabel: scopeLabelFor(hold),
      scopeSpend: round2(totalSpend),
      cutPct: null,
      testDays,
    };
  }

  return {
    kind: "unavailable",
    headline: `No cut or keep call for this period yet.`,
    keepLine: `${formatCurrency(totalSpend)} stays as logged. ${PRODUCT_NOUN.mondayCall}.`,
    redeployLine: null,
    cutAmount: null,
    keepAmount: round2(totalSpend),
    keepFloor,
    scopeLabel: null,
    scopeSpend: round2(totalSpend),
    cutPct: null,
    testDays,
  };
}
