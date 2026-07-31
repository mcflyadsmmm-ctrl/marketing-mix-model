export type SpendChannel =
  | "meta"
  | "google"
  | "microsoft"
  | "tiktok"
  | "pinterest"
  | "snapchat"
  | "reddit"
  | "x"
  | "linkedin"
  | "amazon"
  | "apple_search"
  | "affiliate"
  | "email"
  | "other";

export const SPEND_CHANNELS: SpendChannel[] = [
  "meta",
  "google",
  "microsoft",
  "tiktok",
  "pinterest",
  "snapchat",
  "reddit",
  "x",
  "linkedin",
  "amazon",
  "apple_search",
  "affiliate",
  "email",
  "other",
];

export const SPEND_CHANNEL_LABELS: Record<SpendChannel, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  microsoft: "Microsoft Ads",
  tiktok: "TikTok Ads",
  pinterest: "Pinterest Ads",
  snapchat: "Snapchat Ads",
  reddit: "Reddit Ads",
  x: "X Ads",
  linkedin: "LinkedIn Ads",
  amazon: "Amazon Ads",
  apple_search: "Apple Search Ads",
  affiliate: "Affiliate",
  email: "Email",
  other: "Other",
};

export interface ChannelSpend {
  channel: SpendChannel;
  amount: number;
}

export interface ChannelMixEntry {
  channel: SpendChannel;
  amount: number;
  share: number;
}

function nonNegativeFinite(amount: number): number {
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/**
 * MER = total Shopify sales ÷ total ad spend (same period).
 * Returns null when spend is zero/negative or inputs are non-finite.
 */
export function computeMer(sales: number, spend: number): number | null {
  if (!Number.isFinite(sales) || !Number.isFinite(spend) || spend <= 0) {
    return null;
  }
  const mer = sales / spend;
  return Number.isFinite(mer) ? mer : null;
}

/**
 * Break-even MER ≈ 1 / contribution margin.
 * Margin is a decimal in (0, 1] (e.g. 0.35 for 35%).
 */
export function computeBreakEvenMer(contributionMargin: number): number | null {
  if (
    !Number.isFinite(contributionMargin) ||
    contributionMargin <= 0 ||
    contributionMargin > 1
  ) {
    return null;
  }
  const breakEven = 1 / contributionMargin;
  return Number.isFinite(breakEven) ? breakEven : null;
}

/**
 * Channel mix as spend share per channel (sums to 1 when total > 0).
 * Negative / non-finite amounts are treated as zero spend.
 */
export function channelMix(spends: ChannelSpend[]): ChannelMixEntry[] {
  const cleaned = spends.map(({ channel, amount }) => ({
    channel,
    amount: nonNegativeFinite(amount),
  }));
  const total = cleaned.reduce((sum, entry) => sum + entry.amount, 0);
  if (total <= 0) {
    return cleaned.map(({ channel, amount }) => ({ channel, amount, share: 0 }));
  }
  return cleaned.map(({ channel, amount }) => ({
    channel,
    amount,
    share: amount / total,
  }));
}

export function sumSpend(spends: ChannelSpend[]): number {
  return spends.reduce((sum, entry) => sum + nonNegativeFinite(entry.amount), 0);
}
