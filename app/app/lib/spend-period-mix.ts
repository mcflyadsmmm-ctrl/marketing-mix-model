export type SpendPeriodMixInput = {
  channel: string;
  amount: number;
};

export type SpendPeriodMixRow = {
  channel: string;
  amount: number;
  share: number;
};

function clampSpendAmount(amount: number): number {
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/**
 * Period ad-spend mix by channel. Aggregates duplicate channels, treats
 * non-finite / negative amounts as 0, and sorts by amount descending.
 * Shares sum to 1 when total spend is positive.
 */
export function spendPeriodMix(
  entries: SpendPeriodMixInput[],
): SpendPeriodMixRow[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const amount = clampSpendAmount(entry.amount);
    totals.set(entry.channel, (totals.get(entry.channel) ?? 0) + amount);
  }

  const rows = [...totals.entries()].map(([channel, amount]) => ({
    channel,
    amount,
  }));
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return rows
    .map((row) => ({
      channel: row.channel,
      amount: row.amount,
      share: total > 0 ? row.amount / total : 0,
    }))
    .sort(
      (a, b) => b.amount - a.amount || a.channel.localeCompare(b.channel),
    );
}

export type SpendMixVsPriorRow = {
  channel: string;
  amount: number;
  share: number;
  priorAmount: number;
  priorShare: number;
  /** This-period share − prior share, in percentage points. */
  deltaPp: number;
};

/**
 * Spend mix this period vs last. Budget share only — never assigns sales
 * to a channel.
 */
export function spendMixVsPrior(
  current: SpendPeriodMixInput[],
  prior: SpendPeriodMixInput[],
): SpendMixVsPriorRow[] {
  const now = spendPeriodMix(current);
  const then = spendPeriodMix(prior);
  const nowMap = new Map(now.map((row) => [row.channel, row]));
  const thenMap = new Map(then.map((row) => [row.channel, row]));
  const channels = new Set([...nowMap.keys(), ...thenMap.keys()]);
  return [...channels]
    .map((channel) => {
      const here = nowMap.get(channel);
      const before = thenMap.get(channel);
      const share = here?.share ?? 0;
      const priorShare = before?.share ?? 0;
      return {
        channel,
        amount: here?.amount ?? 0,
        share,
        priorAmount: before?.amount ?? 0,
        priorShare,
        deltaPp: Math.round((share - priorShare) * 10000) / 100,
      };
    })
    .filter((row) => row.amount > 0 || row.priorAmount > 0)
    .sort(
      (a, b) =>
        b.amount - a.amount ||
        Math.abs(b.deltaPp) - Math.abs(a.deltaPp) ||
        a.channel.localeCompare(b.channel),
    );
}
