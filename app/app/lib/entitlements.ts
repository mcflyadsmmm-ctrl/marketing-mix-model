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

/**
 * Single SoT for Pro upsell copy. Listing stays Free until Billing announce;
 * in-app gates + SAMPLE preview are live now.
 */
export const PRO_UPSELL = {
  short: "Pro · $39/store/mo",
  priceLine: "$39 flat per store / month — not a GMV tax",
  /** One-line “what you get” for banners and empty states. */
  includes:
    "Pro includes: every named ad channel (TikTok, Microsoft, Amazon, Pinterest, Email, Affiliate, …), Customer LTV / Acquisition cohorts (Cash CAC · 30/90/365 · LTV:CAC), and the full-year Goals board with YoY fill.",
  channels:
    "Free channels: Meta, Google, and custom Other (name influencers/podcasts/agency). Pro ($39/mo) unlocks TikTok, Microsoft, Amazon, Pinterest, Email, Affiliate, and every other named platform — plus Customer LTV and full Goals.",
  ltv: "Pro unlocks Customer LTV / Acquisition: Cash CAC, 30/90/365 cohort revenue, and LTV:CAC from Shopify order cohorts (opaque ids only — no email CRM). Preview the full desk on SAMPLE anytime.",
  goals:
    "Pro unlocks the full-year sales board, Grow YoY fill, and monthly fine-tune. Free still shows MTD · QTD · YTD pace vs your Total ROAS goal and break-even.",
  close:
    "Share Overview (Email) is free — opens your mail app with this period’s cards. Mcfly never sends mail for you.",
  upgradeCta: "Upgrade to Pro — $39/mo",
  seeSettings: "See Free vs Pro in Settings",
} as const;

export const FREE_FEATURE_BULLETS = [
  "Total ROAS = Shopify Total Sales ÷ ad spend",
  "Break-even from optional profit margin",
  "Spend CSV: Meta + Google + custom Other",
  "Period filters (MTD · LM · QTD · YTD · …)",
  "Spend Allocation mix for Free channels",
  "Email Overview (opens your mail app)",
  "Full SAMPLE preview of Pro features",
] as const;

export const PRO_FEATURE_BULLETS = [
  "Everything in Free",
  "All named channels: TikTok, Microsoft, Amazon, Pinterest, Email, Affiliate, and more",
  "Customer LTV / Acquisition: Cash CAC · cohort LTV 30/90/365 · LTV:CAC",
  "Full-year Goals board + YoY plan + monthly fine-tune",
  "Richer Explorer / mix history as it ships",
  "$39 flat / store / mo — not GMV tax",
] as const;
