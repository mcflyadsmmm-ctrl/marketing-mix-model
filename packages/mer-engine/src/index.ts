export type SpendChannel = "meta" | "google" | "other";

export interface ChannelSpend {
  channel: SpendChannel;
  amount: number;
}

export interface ChannelMixEntry {
  channel: SpendChannel;
  amount: number;
  share: number;
}

/**
 * MER = total Shopify sales ÷ total ad spend (same period).
 * Returns null when spend is zero (undefined ratio).
 */
export function computeMer(sales: number, spend: number): number | null {
  if (spend <= 0) return null;
  return sales / spend;
}

/**
 * Break-even MER ≈ 1 / contribution margin.
 * Margin is a decimal (e.g. 0.35 for 35%).
 */
export function computeBreakEvenMer(contributionMargin: number): number | null {
  if (contributionMargin <= 0 || contributionMargin > 1) return null;
  return 1 / contributionMargin;
}

/**
 * Channel mix as spend share per channel (sums to 1 when total > 0).
 */
export function channelMix(spends: ChannelSpend[]): ChannelMixEntry[] {
  const total = spends.reduce((sum, entry) => sum + entry.amount, 0);
  if (total <= 0) {
    return spends.map(({ channel }) => ({ channel, amount: 0, share: 0 }));
  }
  return spends.map(({ channel, amount }) => ({
    channel,
    amount,
    share: amount / total,
  }));
}

export function sumSpend(spends: ChannelSpend[]): number {
  return spends.reduce((sum, entry) => sum + entry.amount, 0);
}
