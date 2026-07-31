import { calculateMer, isAboveBreakEven } from "./mer.js";

export type AllocationChannelInput = {
  name: string;
  spend: number;
  /** Optional cash sales attributed to channel (manual operator input — not MTA). */
  salesContribution?: number;
  /** Manual/CSV label for detail copy — not a preferential cut signal. */
  isManual?: boolean;
};

export type ChannelEfficiency = {
  name: string;
  spend: number;
  spendShare: number;
  assumedSales: number;
  /**
   * Channel Total ROAS — only when operator entered salesContribution.
   * Null when sales are spend-share assumptions (would equal portfolio Total ROAS).
   */
  effectiveMer: number | null;
  efficiencyVsBreakEven: number | null;
  isManual: boolean;
  /** operator_cash = measured-ish operator split; spend_share = proportional fiction avoided in UI. */
  basis: "operator_cash" | "spend_share";
};

export type AllocationAction = {
  type: "cut" | "shift" | "hold" | "watch";
  channel: string;
  percentChange?: number;
  detail: string;
};

export type SuggestAllocationInput = {
  channels: AllocationChannelInput[];
  breakEvenMer: number;
  totalSales: number;
  totalSpend: number;
  suggestedTestDays?: number;
};

export type SuggestAllocationResult = {
  overallMer: number | null;
  breakEvenMer: number;
  isAboveBreakEven: boolean | null;
  suggestedTestDays: number;
  actions: AllocationAction[];
  why: string;
  /** True when at least one channel has operator-entered salesContribution. */
  hasOperatorChannelCash: boolean;
  inputs: {
    totalSales: number;
    totalSpend: number;
    channelEfficiencies: ChannelEfficiency[];
  };
};

const DEFAULT_TEST_DAYS = 7;
const CUT_PCT_MIN = 10;

/**
 * Never recommend cutting more than this % of current-period spend in one step.
 * Floor means KEEP at least (100 − SPEND_FLOOR_PCT)% — also never imply zero spend.
 */
export const SPEND_FLOOR_PCT = 50;

/** Alias: max cut percent in one step (= SPEND_FLOOR_PCT). */
export const spendFloorMaxCutPct = SPEND_FLOOR_PCT;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Clamp a cut percent to [CUT_PCT_MIN, spendFloorMaxCutPct] — never zero / never >50%. */
export function clampSpendFloorCutPct(cutPct: number): number {
  if (!Number.isFinite(cutPct) || cutPct <= 0) {
    return CUT_PCT_MIN;
  }
  return Math.min(spendFloorMaxCutPct, Math.max(CUT_PCT_MIN, cutPct));
}

/**
 * Illustrative step-test size from average Total ROAS (portfolio period efficiency).
 * Algebra: cutFraction = 1 - overallMer/breakEvenMer if sales held — NOT marginal/causal ROAS.
 * Clamp to [10, SPEND_FLOOR_PCT], round to nearest 5. Never claims the cut will restore BE in market.
 */
export function portfolioCutPercent(
  overallMer: number,
  breakEvenMer: number,
): number {
  if (!(breakEvenMer > 0) || !Number.isFinite(breakEvenMer)) {
    return spendFloorMaxCutPct;
  }
  if (!Number.isFinite(overallMer) || overallMer <= 0) {
    return spendFloorMaxCutPct;
  }
  // Hold path does not use this; return min cut if called anyway.
  if (overallMer >= breakEvenMer) {
    return CUT_PCT_MIN;
  }
  const cutFraction = 1 - overallMer / breakEvenMer;
  const pct = cutFraction * 100;
  const clamped = clampSpendFloorCutPct(pct);
  return Math.round(clamped / 5) * 5;
}

function channelHasOperatorCash(channel: AllocationChannelInput): boolean {
  return (
    channel.salesContribution !== undefined &&
    Number.isFinite(channel.salesContribution)
  );
}

function anyOperatorChannelCash(channels: AllocationChannelInput[]): boolean {
  return channels.some(channelHasOperatorCash);
}

function assumedSalesForChannel(
  channel: AllocationChannelInput,
  totalSales: number,
  totalSpend: number,
): number {
  if (channelHasOperatorCash(channel)) {
    return channel.salesContribution as number;
  }
  if (totalSpend <= 0 || channel.spend <= 0) {
    return 0;
  }
  return (channel.spend / totalSpend) * totalSales;
}

function channelEfficiencies(
  channels: AllocationChannelInput[],
  totalSales: number,
  totalSpend: number,
  breakEvenMer: number,
): ChannelEfficiency[] {
  return channels
    .filter((c) => Number.isFinite(c.spend) && c.spend >= 0)
    .map((channel) => {
      const spendShare = totalSpend > 0 ? channel.spend / totalSpend : 0;
      const assumedSales = assumedSalesForChannel(channel, totalSales, totalSpend);
      const operatorCash = channelHasOperatorCash(channel);
      // Only expose channel MER when the operator supplied cash splits.
      // Spend-share assumptions all equal portfolio Total ROAS — showing them as
      // "efficiency" is attribution theater by algebra (religion FATAL F1).
      const effectiveMer =
        operatorCash &&
        channel.spend > 0 &&
        Number.isFinite(assumedSales)
          ? assumedSales / channel.spend
          : null;
      const efficiencyVsBreakEven =
        effectiveMer !== null &&
        Number.isFinite(effectiveMer) &&
        breakEvenMer > 0
          ? effectiveMer / breakEvenMer
          : null;

      return {
        name: channel.name,
        spend: channel.spend,
        spendShare: round(spendShare, 4),
        assumedSales: round(assumedSales, 2),
        effectiveMer:
          effectiveMer !== null && Number.isFinite(effectiveMer)
            ? round(effectiveMer, 4)
            : null,
        efficiencyVsBreakEven:
          efficiencyVsBreakEven !== null && Number.isFinite(efficiencyVsBreakEven)
            ? round(efficiencyVsBreakEven, 4)
            : null,
        isManual: channel.isManual ?? inferManual(channel.name),
        basis: operatorCash ? ("operator_cash" as const) : ("spend_share" as const),
      };
    });
}

function inferManual(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    normalized.includes("manual") ||
    normalized.includes("other") ||
    normalized.includes("csv")
  );
}

/** Lowest efficiency vs BE, then highest spend share — no manual preference. */
function worstCutCandidate(efficiencies: ChannelEfficiency[]): ChannelEfficiency | null {
  const withEff = efficiencies.filter((c) => c.efficiencyVsBreakEven !== null);
  if (withEff.length === 0) return null;

  const belowOne = withEff.filter(
    (c) => c.efficiencyVsBreakEven !== null && c.efficiencyVsBreakEven < 1,
  );
  const pool = belowOne.length > 0 ? belowOne : withEff;

  return (
    [...pool].sort((a, b) => {
      const effA = a.efficiencyVsBreakEven ?? Infinity;
      const effB = b.efficiencyVsBreakEven ?? Infinity;
      if (effA !== effB) {
        return effA - effB;
      }
      return b.spendShare - a.spendShare;
    })[0] ?? null
  );
}

function bestShiftTarget(efficiencies: ChannelEfficiency[]): ChannelEfficiency | null {
  const withEff = efficiencies.filter(
    (c) => c.spend > 0 && c.efficiencyVsBreakEven !== null,
  );
  if (withEff.length === 0) return null;

  return (
    [...withEff].sort((a, b) => {
      const effA = a.efficiencyVsBreakEven ?? -Infinity;
      const effB = b.efficiencyVsBreakEven ?? -Infinity;
      if (effA !== effB) {
        return effB - effA;
      }
      return a.spendShare - b.spendShare;
    })[0] ?? null
  );
}

/**
 * Rules-based allocation from cash spend vs Shopify sales.
 * No MTA / pixels. Without operator channel cash splits, advice is portfolio-only
 * (cut total spend / hold) — never fake channel efficiency from spend-share.
 */
export function suggestAllocation(
  input: SuggestAllocationInput,
): SuggestAllocationResult {
  const {
    channels,
    breakEvenMer,
    totalSales,
    totalSpend,
    suggestedTestDays = DEFAULT_TEST_DAYS,
  } = input;

  const spendOk = Number.isFinite(totalSpend) && totalSpend > 0;
  const salesOk = Number.isFinite(totalSales);
  const validBreakEven = Number.isFinite(breakEvenMer) && breakEvenMer > 0;
  const safeSales = salesOk ? totalSales : 0;
  const hasOperatorChannelCash = anyOperatorChannelCash(channels);

  const overallMer =
    salesOk && spendOk ? calculateMer(totalSales, totalSpend) : null;
  const aboveBreakEven = validBreakEven
    ? isAboveBreakEven(overallMer, breakEvenMer)
    : null;
  const efficiencies = channelEfficiencies(
    channels,
    safeSales,
    spendOk ? totalSpend : 0,
    validBreakEven ? breakEvenMer : 0,
  );

  const actions: AllocationAction[] = [];
  let why: string;

  if (!Number.isFinite(totalSpend) || totalSpend <= 0) {
    why =
      "No ad spend recorded for this period. Add spend (manual or synced) before allocation advice applies.";
    actions.push({
      type: "watch",
      channel: "—",
      detail: "Enter channel spend to unlock mix suggestions.",
    });
  } else if (!validBreakEven) {
    why =
      "Break-even Total ROAS is invalid. Set a contribution margin in (0, 100%] before allocation advice applies.";
    actions.push({
      type: "watch",
      channel: "—",
      detail: "Save a valid contribution margin in Settings to unlock mix suggestions.",
    });
  } else if (!salesOk || overallMer === null) {
    why =
      "Total ROAS could not be calculated. Check sales and spend inputs.";
    actions.push({
      type: "watch",
      channel: "—",
      detail: "Fix non-finite sales or spend inputs, then retry allocation.",
    });
  } else if (aboveBreakEven === true) {
    const heavy = [...efficiencies].sort((a, b) => b.spendShare - a.spendShare)[0];
    const sharePct = heavy ? round(heavy.spendShare * 100, 1) : 0;
    why = `Hold portfolio spend — Total ROAS ${round(overallMer)} is at or above break-even ${round(breakEvenMer)}${heavy ? `; largest share ${heavy.name} (${sharePct}%)` : ""}.`;
    actions.push({
      type: "hold",
      channel: "portfolio",
      detail: heavy
        ? `Largest spend share: ${heavy.name} ${sharePct}%. Monitor before shifting — not measured channel ROAS.`
        : "Monitor before shifting.",
    });
  } else if (!hasOperatorChannelCash) {
    // Portfolio-only: Total ROAS cannot identify which channel to cut.
    // Never invent channel efficiency from spend-share without operator cash.
    const cutPct = clampSpendFloorCutPct(
      portfolioCutPercent(overallMer, breakEvenMer),
    );
    why = `Total ROAS below break-even — illustrative step-test (~${cutPct}% portfolio cut; keep ≥${100 - SPEND_FLOOR_PCT}% of period spend). Sized from average Total ROAS ${round(overallMer)} vs break-even ${round(breakEvenMer)} if sales held — not marginal/causal ROAS; market may not restore BE. Channel mix is spend only (no operator channel cash) — not a measured channel ROAS call.`;
    actions.push({
      type: "cut",
      channel: "portfolio",
      percentChange: -cutPct,
      detail: `Illustrative cash step-test: try ~${cutPct}% portfolio spend cut for ${suggestedTestDays} days (≤${SPEND_FLOOR_PCT}% one step; never zero). Average Total ROAS algebra if sales held — not marginal ROAS. Optional channel sales splits are labeled assumptions — never path credit.`,
    });
  } else {
    const cut = worstCutCandidate(efficiencies);
    const target = bestShiftTarget(
      efficiencies.filter((c) => c.name !== cut?.name),
    );
    const cutPct = clampSpendFloorCutPct(
      portfolioCutPercent(overallMer, breakEvenMer),
    );

    if (cut && target && target.name !== cut.name) {
      why = `Total ROAS below break-even — illustrative step-test: cut ${cut.name} ~${cutPct}% toward ${target.name}. Sized from average Total ROAS ${round(overallMer)} vs break-even ${round(breakEvenMer)} if sales held — not marginal/causal (operator channel cash splits).`;
    } else if (cut) {
      why = `Total ROAS below break-even — illustrative step-test: cut ${cut.name} ~${cutPct}%. Sized from average Total ROAS ${round(overallMer)} vs break-even ${round(breakEvenMer)} if sales held — not marginal/causal (operator channel cash splits).`;
    } else {
      why = `Total ROAS below break-even — illustrative step-test: cut total ad spend ~${cutPct}% (keep ≥${100 - SPEND_FLOOR_PCT}% of period spend). Sized from average Total ROAS ${round(overallMer)} vs break-even ${round(breakEvenMer)} if sales held — not marginal/causal.`;
    }

    if (cut) {
      actions.push({
        type: "cut",
        channel: cut.name,
        percentChange: -cutPct,
        detail: cut.isManual
          ? `Operator cash split is weakest vs break-even on this manual/other line — illustrative step-test: ~${cutPct}% spend cut for ${suggestedTestDays} days (≤${SPEND_FLOOR_PCT}% one step; never zero). Average Total ROAS algebra if sales held — not marginal ROAS.`
          : `Operator cash split is weakest vs break-even — illustrative step-test: ~${cutPct}% spend cut for ${suggestedTestDays} days (≤${SPEND_FLOOR_PCT}% one step; never zero). Average Total ROAS algebra if sales held — not marginal ROAS.`,
      });
    } else {
      actions.push({
        type: "cut",
        channel: "portfolio",
        percentChange: -cutPct,
        detail: `Illustrative cash step-test: ~${cutPct}% spend cut for ${suggestedTestDays} days (≤${SPEND_FLOOR_PCT}% one step; never zero). Average Total ROAS algebra if sales held — not marginal ROAS.`,
      });
    }

    if (target && cut && target.name !== cut.name) {
      actions.push({
        type: "shift",
        channel: target.name,
        percentChange: Math.min(15, cutPct),
        detail: `Reallocate freed budget toward ${target.name} using your entered channel cash splits — cash affordability move, still not path credit.`,
      });
    }
  }

  return {
    overallMer: overallMer !== null ? round(overallMer, 4) : null,
    breakEvenMer: validBreakEven ? round(breakEvenMer, 4) : breakEvenMer,
    isAboveBreakEven: aboveBreakEven,
    suggestedTestDays,
    actions,
    why,
    hasOperatorChannelCash,
    inputs: {
      totalSales: round(safeSales, 2),
      totalSpend: round(Number.isFinite(totalSpend) ? totalSpend : 0, 2),
      channelEfficiencies: efficiencies,
    },
  };
}
