import { calculateMer, isAboveBreakEven } from "./mer.js";

export type AllocationChannelInput = {
  name: string;
  spend: number;
  /** Optional cash sales attributed to channel (manual operator input — not MTA). */
  salesContribution?: number;
  /** Manual/CSV channels are cut first when below break-even. */
  isManual?: boolean;
};

export type ChannelEfficiency = {
  name: string;
  spend: number;
  spendShare: number;
  assumedSales: number;
  effectiveMer: number | null;
  efficiencyVsBreakEven: number | null;
  isManual: boolean;
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
  inputs: {
    totalSales: number;
    totalSpend: number;
    channelEfficiencies: ChannelEfficiency[];
  };
};

const DEFAULT_TEST_DAYS = 7;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function assumedSalesForChannel(
  channel: AllocationChannelInput,
  totalSales: number,
  totalSpend: number,
): number {
  if (
    channel.salesContribution !== undefined &&
    Number.isFinite(channel.salesContribution)
  ) {
    return channel.salesContribution;
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
      const effectiveMer =
        channel.spend > 0 && Number.isFinite(assumedSales)
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

function worstCutCandidate(efficiencies: ChannelEfficiency[]): ChannelEfficiency | null {
  const belowOne = efficiencies.filter(
    (c) => c.efficiencyVsBreakEven !== null && c.efficiencyVsBreakEven < 1,
  );
  const pool = belowOne.length > 0 ? belowOne : efficiencies;

  const manual = pool.filter((c) => c.isManual);
  const search = manual.length > 0 ? manual : pool;

  return (
    [...search].sort((a, b) => {
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
  return (
    [...efficiencies]
      .filter((c) => c.spend > 0)
      .sort((a, b) => {
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
 * Rules-based allocation suggestions from cash spend vs Shopify sales.
 * No MTA, pixels, or path credit — auditable heuristics only.
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
      "Break-even MER is invalid. Set a contribution margin in (0, 100%] before allocation advice applies.";
    actions.push({
      type: "watch",
      channel: "—",
      detail: "Save a valid contribution margin in Settings to unlock mix suggestions.",
    });
  } else if (!salesOk || overallMer === null) {
    why = "MER could not be calculated. Check sales and spend inputs.";
    actions.push({
      type: "watch",
      channel: "—",
      detail: "Fix non-finite sales or spend inputs, then retry allocation.",
    });
  } else if (aboveBreakEven === true) {
    const heavy = [...efficiencies].sort((a, b) => b.spendShare - a.spendShare)[0];
    why = `Overall MER (${round(overallMer)}) is at or above break-even (${round(breakEvenMer)}). Hold core mix; trim overweight channels only if MER softens.`;
    actions.push({
      type: "hold",
      channel: heavy?.name ?? "portfolio",
      detail: `Largest spend share: ${heavy ? round(heavy.spendShare * 100, 1) : 0}%. Monitor before shifting.`,
    });
  } else {
    const cut = worstCutCandidate(efficiencies);
    const target = bestShiftTarget(
      efficiencies.filter((c) => c.name !== cut?.name),
    );
    const cutPct = cut && cut.spendShare >= 0.15 ? 20 : 15;

    why = `Overall MER (${round(overallMer)}) is below break-even (${round(breakEvenMer)}). Cash view says reduce least efficient spend before scaling winners.`;

    if (cut) {
      actions.push({
        type: "cut",
        channel: cut.name,
        percentChange: -cutPct,
        detail: cut.isManual
          ? `Manual/other channel with weak efficiency vs break-even — test a ${cutPct}% spend reduction.`
          : `Lowest efficiency vs break-even — test a ${cutPct}% spend reduction.`,
      });
    }

    if (target && cut && target.name !== cut.name) {
      actions.push({
        type: "shift",
        channel: target.name,
        percentChange: Math.min(15, cutPct),
        detail: `Reallocate freed budget toward ${target.name} (stronger spend-share efficiency in cash view).`,
      });
    } else if (!cut) {
      actions.push({
        type: "watch",
        channel: "portfolio",
        detail: "Add channel-level spend breakdown to refine cuts.",
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
    inputs: {
      totalSales: round(safeSales, 2),
      totalSpend: round(Number.isFinite(totalSpend) ? totalSpend : 0, 2),
      channelEfficiencies: efficiencies,
    },
  };
}
