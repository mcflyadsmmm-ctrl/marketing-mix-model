/**
 * Client-safe desk constants (no env / secrets).
 * Server resolution lives in entitlements.server.ts.
 *
 * One App Store plan: 7-day trial, then $39/mo = full desk
 * (all channels incl. TikTok CSV, LTV, Goals). Not a Free listing.
 * SAMPLE is preview data only — not a feature unlock.
 */

import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

/**
 * Starter CSV columns (Meta + Google + custom Other).
 * Not a Free App Store plan — the $39 desk includes every named channel.
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

/** All engine channels (the $39 desk). */
export const PRO_CHANNELS: readonly SpendChannel[] = SPEND_CHANNELS;

/**
 * Single SoT for desk / billing copy.
 * Trial + $39 = full desk. SAMPLE stays labeled preview only.
 */
export const PRO_UPSELL = {
  short: "$39/store/mo · 7-day trial",
  priceLine: "7-day trial, then $39 flat per store / month — not a GMV tax",
  /** One-line “what you get” for banners and empty states. */
  includes:
    "One desk: every named ad channel (TikTok, Microsoft, Amazon, Pinterest, Email, Affiliate, …), Customer LTV / Acquisition (Cash CAC · 30/90/365 · LTV:CAC), and the full-year Goals board. SAMPLE is preview data only.",
  channels:
    "TikTok, Microsoft, Amazon, Pinterest, Email, Affiliate, and every named platform are on the $39 desk (7-day trial). SAMPLE is preview data only — not a feature unlock.",
  ltv: "Customer LTV / Acquisition is on the $39 desk: Cash CAC, 30/90/365 cohort revenue, and LTV:CAC from Shopify order cohorts (opaque ids only — no email CRM). SAMPLE is preview data only.",
  goals:
    "The full-year sales board, Grow YoY fill, and monthly fine-tune are on the $39 desk (7-day trial). SAMPLE is preview data only.",
  close:
    "Share Overview (Email) opens your mail app with this period’s cards. Mcfly never sends mail for you.",
  upgradeCta: "Start $39 plan",
  seeSettings: "See plan in Settings",
} as const;

/** One-desk bullets (trial + $39). Not a Free App Store plan. */
export const FREE_FEATURE_BULLETS = [
  "Total ROAS = Shopify Total Sales ÷ ad spend you added",
  "Break-even from optional profit margin",
  "Spend CSV: Meta, Google, TikTok, and every named channel",
  "Period filters (MTD · LM · QTD · YTD · …)",
  "Spend Allocation mix across channels",
  "Customer LTV / Acquisition + full-year Goals board",
  "Email Overview (opens your mail app)",
  "SAMPLE preview data — labeled, not live cash",
] as const;

export const PRO_FEATURE_BULLETS = [
  "7-day trial, then $39 flat / store / mo — not GMV tax",
  "All named channels: TikTok, Microsoft, Amazon, Pinterest, Email, Affiliate, and more",
  "Customer LTV / Acquisition: Cash CAC · cohort LTV 30/90/365 · LTV:CAC",
  "Full-year Goals board + YoY plan + monthly fine-tune",
  "Spend Allocation + Email Overview",
  "SAMPLE stays preview data only",
] as const;
