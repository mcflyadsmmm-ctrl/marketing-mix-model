/**
 * Client-safe Free vs Pro constants (no env / secrets).
 * Server resolution lives in entitlements.server.ts.
 */

import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

/**
 * Free install: Meta + Google + custom Other (name it).
 * Named paid platforms (TikTok, Microsoft, Amazon, …) stay Pro upsell.
 */
export const FREE_CHANNELS = [
  "meta",
  "google",
  "other",
] as const satisfies readonly SpendChannel[];

export type FreeChannel = (typeof FREE_CHANNELS)[number];

export const FREE_CHANNEL_SET: ReadonlySet<string> = new Set(FREE_CHANNELS);

export function isFreeChannel(channel: string): channel is FreeChannel {
  return FREE_CHANNEL_SET.has(channel);
}

/** All engine channels (Pro). */
export const PRO_CHANNELS: readonly SpendChannel[] = SPEND_CHANNELS;

export const PRO_UPSELL = {
  short: "Pro · $39/store/mo",
  channels:
    "Free: Meta, Google, and custom Other (name it). Pro ($39/mo): TikTok, Microsoft, Amazon, and every named platform — plus Customer LTV and full Goals.",
  ltv: "Customer LTV is on Pro ($39/mo at launch). Preview it on the sample desk anytime.",
  goals:
    "Pro: full-year sales plan and YoY. Free still shows Total ROAS and your break-even goal.",
  close:
    "Share Overview from Home anytime — email or copy Total ROAS yourself. Mcfly does not send mail.",
  upgradeCta: "Unlock TikTok + more — $39/mo",
} as const;

export const FREE_FEATURE_BULLETS = [
  "Total ROAS = Shopify sales after returns ÷ ad spend",
  "Break-even from your profit margin",
  "Meta + Google spend (CSV / Connections)",
  "Custom Other — name influencers, podcasts, agency",
  "Basic allocation for Meta + Google",
  "Full SAMPLE preview of Pro",
] as const;

export const PRO_FEATURE_BULLETS = [
  "Everything in Free",
  "Named platforms: TikTok, Microsoft, Amazon, Pinterest, and more",
  "Customer LTV from Shopify order cohorts (no email CRM)",
  "Full-year sales plan and year-over-year goals",
  "Share Overview (email or copy yourself)",
  "Deeper spend history as it ships",
] as const;
