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
