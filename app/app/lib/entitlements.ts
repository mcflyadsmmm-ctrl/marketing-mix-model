/**
 * Client-safe Free vs Pro constants (no env / secrets).
 * Server resolution lives in entitlements.server.ts.
 */

import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

/**
 * Free install: every named platform plus typed extras (billboards, radio, …).
 * Pro $39 unlocks live LTV + the full-year Goals board — not channels.
 */
export const FREE_CHANNELS: readonly SpendChannel[] = SPEND_CHANNELS;

export type FreeChannel = SpendChannel;

export const FREE_CHANNEL_SET: ReadonlySet<string> = new Set(FREE_CHANNELS);

export function isFreeChannel(channel: string): channel is SpendChannel {
  return FREE_CHANNEL_SET.has(channel);
}

/** All engine channels (Free and Pro). */
export const PRO_CHANNELS: readonly SpendChannel[] = SPEND_CHANNELS;

/**
 * Single SoT for Pro upsell copy. Partner Pricing = Free + Pro via Shopify App Pricing.
 * Keep $39 in-app only — never in App Store listing paste.
 */
export const PRO_UPSELL = {
  short: "Pro · $39/store/mo",
  priceLine: "$39 per store / month",
  /** One-line “what you get” for banners and empty states. */
  includes: "Customer LTV/payback and a full-year Goals board.",
  channels:
    "Free includes every named platform plus extras like billboards. Pro is LTV and the full Goals board.",
  ltv: "See how long new customers take to pay back ad spend. Try it on Practice, or upgrade to use it on your store.",
  goals:
    "Set a 12-month sales plan and fill months from last year. Free still shows this period vs your Total ROAS goal.",
  close:
    "Share Overview (Email) is free — opens your mail app with this period’s cards. Mcfly never sends mail for you.",
  upgradeCta: "Upgrade to Pro — $39/mo",
  seeSettings: "See Free vs Pro in Settings",
} as const;

export const FREE_FEATURE_BULLETS = [
  "Shopify sales beside the spend you add (any platform, including billboards)",
  "Total ROAS = Shopify sales ÷ that spend",
  "Break-even from optional profit margin",
  "Period filters and Spend Allocation",
  "Email Overview (opens your mail app)",
  "Practice desk to try Pro features",
] as const;

export const PRO_FEATURE_BULLETS = [
  "Everything in Free",
  "Customer LTV and payback on your store",
  "Full-year Goals board",
  "$39 per store / month",
] as const;
