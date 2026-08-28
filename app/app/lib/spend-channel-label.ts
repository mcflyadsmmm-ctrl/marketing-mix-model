/**
 * ONE resolver for the name a merchant sees next to a spend amount.
 *
 * 2026-08-26 Admin smoke: a merchant typed the channel "Billboard", the save
 * confirmation said "Other $400", the Overview split said "Other", and the
 * Spend page said "Billboard" — three names for one row. Every surface that
 * labels spend now goes through here.
 *
 * Rules:
 * - Named platforms use the engine label ("Meta Ads").
 * - An `other` row with the merchant's own name uses that name ("Billboard").
 * - An `other` row with no name stays "Other" — unattributed spend keeps its
 *   dollars and its honest label; it is never dropped or invented into a name.
 */

import { SPEND_CHANNEL_LABELS, type SpendChannel } from "@mcfly/mer-engine";

export type SpendLabelInput = {
  channel: string;
  /** Merchant-typed name for an `other` row (SpendEntry.note / CSV header). */
  customLabel?: string | null;
};

/** Display name for one spend row / mix slice. */
export function spendChannelLabel(input: SpendLabelInput): string {
  const named = SPEND_CHANNEL_LABELS[input.channel as SpendChannel];
  if (input.channel === "other") {
    const custom = input.customLabel?.trim();
    if (custom) return custom;
  }
  return named ?? input.channel;
}

/** Compact form for chips and legends — "Meta", not "Meta Ads". */
export function spendChannelShortLabel(input: SpendLabelInput): string {
  return spendChannelLabel(input).replace(/ Ads$/, "");
}

/**
 * Stable identity for a spend bucket: named platforms key on the channel,
 * `other` rows key on channel + slug so two extras on one day stay separate.
 */
export function spendBucketKey(channel: string, customKey?: string | null): string {
  const slug = customKey?.trim();
  return channel === "other" && slug ? `other:${slug}` : channel;
}
