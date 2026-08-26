/**
 * Cash views the desk can build from Shopify sales plus the spend a merchant
 * types or uploads: no connector, no pixel, and no cost feed is involved.
 *
 * Deliberate limit: Mcfly does not read Shopify "Cost per item", so none of
 * these figures may be called profit. They are cash left after ads. When cost
 * is unknown the desk stays quiet about it rather than nagging for it.
 */

function money(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

/** Always "cash left after ads" — never "profit", because cost is unknown. */
export const CASH_LEFT_LABEL = "Cash left after ads";

/**
 * Whether the desk may say "profit" instead of "cash left after ads".
 * Only true once a real per-item cost basis exists, which Mcfly does not read
 * today. A merchant-typed margin percentage is not a cost basis.
 */
export function canCallItProfit(costBasis: {
  shopifyCostPerItem?: boolean;
}): boolean {
  return costBasis.shopifyCostPerItem === true;
}

export type GoalVsLeftoverCash = {
  /** sales − spend for the period. */
  cashLeft: number;
  /** Total ROAS goal the merchant set. */
  targetMer: number;
  /**
   * Cash the same spend would have left at the goal: spend × (target − 1).
   * A goal restated in cash, not a projection of what will happen.
   */
  cashLeftAtGoal: number | null;
  /** Sales the same spend would have produced at the goal. */
  salesAtGoal: number | null;
  /** cashLeft − cashLeftAtGoal. Positive means ahead of the goal. */
  gap: number | null;
  /** False when there is no spend or no usable goal to compare against. */
  comparable: boolean;
};

/**
 * This period's leftover cash against the merchant's own Total ROAS goal,
 * restated in dollars. Uses only sales, spend, and the goal already on the
 * desk — no forecast, no attribution, no channel gets credit.
 */
export function goalVsLeftoverCash(input: {
  sales: number;
  spend: number;
  targetMer: number;
  /** Suppress the comparison while sales are still loading. */
  salesPending?: boolean;
}): GoalVsLeftoverCash {
  const sales = Math.max(0, Number.isFinite(input.sales) ? input.sales : 0);
  const spend = Math.max(0, Number.isFinite(input.spend) ? input.spend : 0);
  const targetMer =
    Number.isFinite(input.targetMer) && input.targetMer > 0
      ? input.targetMer
      : 0;
  const cashLeft = money(sales - spend);
  const comparable = !input.salesPending && spend > 0 && targetMer > 0;
  if (!comparable) {
    return {
      cashLeft,
      targetMer,
      cashLeftAtGoal: null,
      salesAtGoal: null,
      gap: null,
      comparable: false,
    };
  }
  const salesAtGoal = money(spend * targetMer);
  const cashLeftAtGoal = money(salesAtGoal - spend);
  return {
    cashLeft,
    targetMer,
    cashLeftAtGoal,
    salesAtGoal,
    gap: money(cashLeft - cashLeftAtGoal),
    comparable: true,
  };
}

/** One sentence for the Goals-vs-leftover tile. Never claims causation. */
export function goalVsLeftoverCopy(
  view: GoalVsLeftoverCash,
  formatCurrency: (n: number) => string,
): string {
  if (!view.comparable) {
    return `Set a ${"Total ROAS"} goal and add spend to see this period's leftover cash against it.`;
  }
  const gap = view.gap ?? 0;
  const atGoal = formatCurrency(view.cashLeftAtGoal ?? 0);
  if (gap >= 0) {
    return `${formatCurrency(gap)} ahead of your ${view.targetMer.toFixed(2)}× goal — that goal on this spend is ${atGoal} left after ads.`;
  }
  return `${formatCurrency(Math.abs(gap))} behind your ${view.targetMer.toFixed(2)}× goal — that goal on this spend is ${atGoal} left after ads.`;
}

export type MixTableRow = {
  channel: string;
  amount: number;
  /** Share of period ad budget, 0–1. */
  share: number;
  /** Percentage-point move vs the prior period, or null when not comparable. */
  deltaPp: number | null;
};

/**
 * Where the money went, as a table. Budget share only — a row never implies
 * the channel caused the sale. Shares are clamped to sum to at most 1.
 */
export function buildMixTable(input: {
  channels: Array<{ channel: string; amount: number }>;
  prior?: Array<{ channel: string; amount: number }> | null;
}): MixTableRow[] {
  const totals = new Map<string, number>();
  for (const row of input.channels) {
    const amount =
      Number.isFinite(row.amount) && row.amount > 0 ? row.amount : 0;
    if (amount <= 0) continue;
    totals.set(row.channel, (totals.get(row.channel) ?? 0) + amount);
  }
  const total = [...totals.values()].reduce((s, n) => s + n, 0);

  const priorTotals = new Map<string, number>();
  for (const row of input.prior ?? []) {
    const amount =
      Number.isFinite(row.amount) && row.amount > 0 ? row.amount : 0;
    if (amount <= 0) continue;
    priorTotals.set(row.channel, (priorTotals.get(row.channel) ?? 0) + amount);
  }
  const priorTotal = [...priorTotals.values()].reduce((s, n) => s + n, 0);
  const comparable = input.prior != null && priorTotal > 0;

  return [...totals.entries()]
    .map(([channel, amount]) => {
      const share = total > 0 ? amount / total : 0;
      const priorShare = comparable
        ? (priorTotals.get(channel) ?? 0) / priorTotal
        : 0;
      return {
        channel,
        amount: money(amount),
        share,
        deltaPp: comparable
          ? Math.round((share - priorShare) * 10000) / 100
          : null,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.channel.localeCompare(b.channel));
}
