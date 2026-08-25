/**
 * Named extras beyond the digital catalog — billboards, radio, a podcast,
 * whatever the merchant actually pays. Stored as SpendChannel `other` plus
 * `customKey` so two extras on the same day do not overwrite each other.
 */

import { SPEND_CHANNEL_LABELS, SPEND_CHANNELS } from "@mcfly/mer-engine";

export const MAX_CUSTOM_SPEND_CHANNELS = 12;
export const CUSTOM_CHANNEL_NAME_MAX = 48;

export const CUSTOM_CHANNEL_PRESETS = [
  { id: "billboards", label: "Billboards / OOH" },
  { id: "tv", label: "TV" },
  { id: "radio", label: "Radio" },
  { id: "print", label: "Print" },
  { id: "podcast", label: "Podcast" },
  { id: "influencers", label: "Influencers" },
  { id: "agency-retainer", label: "Agency retainer" },
] as const;

export type CustomChannelPresetId = (typeof CUSTOM_CHANNEL_PRESETS)[number]["id"];

const GENERIC_OTHER = /^(other|other ads|other spend|something else)$/i;

/** Display name: trim, collapse space, cap length. */
export function sanitizeCustomChannelName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, CUSTOM_CHANNEL_NAME_MAX);
}

/**
 * Stable SpendEntry.customKey for an `other` row.
 * Empty string = unlabeled Other (legacy catch-all).
 */
export function slugCustomChannelName(raw: string): string {
  const name = sanitizeCustomChannelName(raw);
  if (!name || GENERIC_OTHER.test(name)) return "";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, CUSTOM_CHANNEL_NAME_MAX);
  if (!slug || slug === "other") return "";
  return slug;
}

/**
 * Named Meta/Google/… labels are not custom extras — they already have
 * checkboxes. Keep this local so this module does not import spend-csv
 * (spend-csv imports these slugs).
 */
export function customNameCollidesWithNamedChannel(raw: string): boolean {
  const v = sanitizeCustomChannelName(raw).toLowerCase();
  if (!v) return false;
  for (const channel of SPEND_CHANNELS) {
    if (channel === "other") continue;
    const label = SPEND_CHANNEL_LABELS[channel].toLowerCase();
    if (v === channel || v === channel.replace(/_/g, " ") || v === label) {
      return true;
    }
  }
  if (
    v.includes("meta") ||
    v.includes("facebook") ||
    v.includes("instagram") ||
    v.includes("google") ||
    v.includes("adwords") ||
    v.includes("youtube") ||
    v.includes("microsoft") ||
    v.includes("bing") ||
    v.includes("tiktok") ||
    v.includes("pinterest") ||
    v.includes("snapchat") ||
    v.includes("reddit") ||
    v.includes("twitter") ||
    v.includes("linkedin") ||
    v.includes("amazon") ||
    v.includes("apple search") ||
    v.includes("apple ads") ||
    v.includes("affiliate") ||
    v.includes("klaviyo") ||
    v.includes("mailchimp") ||
    /\bemail\b/.test(v)
  ) {
    return true;
  }
  if (v === "x" || v.startsWith("x ads") || v.includes("x/twitter")) {
    return true;
  }
  return false;
}

export function customChannelFromLabel(raw: string): {
  customKey: string;
  customLabel: string;
} | null {
  const customLabel = sanitizeCustomChannelName(raw);
  if (!customLabel) return null;
  if (customNameCollidesWithNamedChannel(customLabel)) return null;
  const customKey = slugCustomChannelName(customLabel);
  if (!customKey) return null;
  return { customKey, customLabel };
}

/**
 * Deduped merchant custom names (presets + typed), max 12, order preserved.
 * Same slug → keep the first label.
 */
export function normalizeCustomChannelList(
  names: readonly string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const parsed = customChannelFromLabel(raw);
    if (!parsed) continue;
    if (seen.has(parsed.customKey)) continue;
    seen.add(parsed.customKey);
    out.push(parsed.customLabel);
    if (out.length >= MAX_CUSTOM_SPEND_CHANNELS) break;
  }
  return out;
}

/** `?custom=Billboards%20%2F%20OOH|Radio` — pipe-separated so commas in names survive. */
export function parseCustomChannelsParam(
  raw: string | null | undefined,
): string[] {
  if (!raw?.trim()) return [];
  return normalizeCustomChannelList(raw.split("|"));
}

export function serializeCustomChannelsParam(names: readonly string[]): string {
  return normalizeCustomChannelList(names).join("|");
}

export function customListHasPreset(
  names: readonly string[],
  presetLabel: string,
): boolean {
  const want = slugCustomChannelName(presetLabel);
  if (!want) return false;
  return names.some((n) => slugCustomChannelName(n) === want);
}

export function toggleCustomPreset(
  names: readonly string[],
  presetLabel: string,
): string[] {
  const want = slugCustomChannelName(presetLabel);
  if (!want) return normalizeCustomChannelList(names);
  const has = customListHasPreset(names, presetLabel);
  if (has) {
    return normalizeCustomChannelList(
      names.filter((n) => slugCustomChannelName(n) !== want),
    );
  }
  return normalizeCustomChannelList([...names, presetLabel]);
}

export function addTypedCustomChannel(
  names: readonly string[],
  raw: string,
): { names: string[]; error: string | null } {
  const label = sanitizeCustomChannelName(raw);
  if (!label) {
    return { names: normalizeCustomChannelList(names), error: "Name this channel." };
  }
  if (customNameCollidesWithNamedChannel(label)) {
    return {
      names: normalizeCustomChannelList(names),
      error: "That is already a named platform above — check it there.",
    };
  }
  const next = normalizeCustomChannelList([...names, label]);
  if (next.length === normalizeCustomChannelList(names).length) {
    if (customListHasPreset(names, label)) {
      return { names: next, error: null };
    }
    if (next.length >= MAX_CUSTOM_SPEND_CHANNELS) {
      return {
        names: next,
        error: `You can name up to ${MAX_CUSTOM_SPEND_CHANNELS} extra channels.`,
      };
    }
  }
  return { names: next, error: null };
}
