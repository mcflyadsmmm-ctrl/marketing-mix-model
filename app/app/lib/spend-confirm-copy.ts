import { spendChannelShortLabel } from "./spend-channel-label";

/**
 * Human confirm line: "Meta $400 for 2026-08-25."
 *
 * `channels` may carry a merchant-named extra as `{ channel: "other",
 * customLabel: "Billboard" }` so the confirmation says what the merchant typed.
 * Saving "Billboard" and being told "Other" is what broke trust in the
 * 2026-08-26 Admin smoke.
 */
export type SpendConfirmChannel = string | { channel: string; customLabel?: string | null };

export function spendConfirmLine(input: {
  channels: SpendConfirmChannel[];
  totalAmount: number;
  dateRange: { start: string; end: string } | null;
  formatAmount: (n: number) => string;
}): string {
  const names =
    input.channels
      .map((entry) =>
        typeof entry === "string"
          ? spendChannelShortLabel({ channel: entry })
          : spendChannelShortLabel(entry),
      )
      .join(", ") || "Spend";
  const amount = input.formatAmount(input.totalAmount);
  const range = input.dateRange;
  if (!range) return `${names} ${amount}.`;
  if (range.start === range.end) {
    return `${names} ${amount} for ${range.start}.`;
  }
  return `${names} ${amount} for ${range.start}–${range.end}.`;
}
