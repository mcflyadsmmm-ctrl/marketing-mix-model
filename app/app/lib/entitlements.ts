/**
 * Client-safe Free vs Pro constants (no env / secrets).
 * Server resolution lives in entitlements.server.ts.
 */

import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

/**
 * Free install: Meta + Google + named extras (billboards, radio, typed channels).
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

/**
 * Single SoT for Pro upsell copy. Partner Pricing = Free + Pro via Shopify App Pricing.
 * Keep $39 in-app only — never in App Store listing paste.
 */
export const PRO_UPSELL = {
  short: "Pro · $39/store/mo",
  priceLine: "$39 per store / month",
  /** One-line “what you get” for banners and empty states. */
  includes:
    "Named ad platforms, customer LTV, and a full-year Goals board.",
  channels:
    "Free includes Meta, Google, and named extras like billboards. Pro adds TikTok, Amazon, Email, and other named platforms.",
  ltv: "See how long new customers take to pay back ad spend. Try it on Practice, or upgrade to use it on your store.",
  goals:
    "Set a 12-month sales plan and fill months from last year. Free still shows this period vs your Total ROAS goal.",
  close:
    "Share Overview (Email) is free — opens your mail app with this period’s cards. Mcfly never sends mail for you.",
  upgradeCta: "Upgrade to Pro — $39/mo",
  seeSettings: "See Free vs Pro in Settings",
} as const;

export const FREE_FEATURE_BULLETS = [
  "Total ROAS = Shopify sales ÷ the spend you add",
  "Break-even from optional profit margin",
  "Spend CSV: Meta, Google, and named extras (billboards, radio, …)",
  "Period filters and Spend Allocation for Free channels",
  "Email Overview (opens your mail app)",
  "Practice desk to try Pro features",
] as const;

export const PRO_FEATURE_BULLETS = [
  "Everything in Free",
  "Named platforms: TikTok, Amazon, Email, Affiliate, and more",
  "Customer LTV and payback",
  "Full-year Goals board",
  "$39 per store / month",
] as const;
