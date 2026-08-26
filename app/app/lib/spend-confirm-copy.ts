import { SPEND_CHANNEL_LABELS, type SpendChannel } from "@mcfly/mer-engine";

/** Human confirm line: “Meta $400 for 2026-08-25.” */
export function spendConfirmLine(input: {
  channels: string[];
  totalAmount: number;
  dateRange: { start: string; end: string } | null;
  formatAmount: (n: number) => string;
}): string {
  const names =
    input.channels
      .map((ch) => {
        const full = SPEND_CHANNEL_LABELS[ch as SpendChannel] ?? ch;
        return full.replace(/ Ads$/, "");
      })
      .join(", ") || "Spend";
  const amount = input.formatAmount(input.totalAmount);
  const range = input.dateRange;
  if (!range) return `${names} ${amount}.`;
  if (range.start === range.end) {
    return `${names} ${amount} for ${range.start}.`;
  }
  return `${names} ${amount} for ${range.start}–${range.end}.`;
}
