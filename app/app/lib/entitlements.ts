/**
 * Client-safe plan constants (no env / secrets).
 * Server resolution lives in entitlements.server.ts.
 * Founder lock 2026-08-26: whole desk on trial and paid — billing is not a desk mode.
 */

import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

/**
 * Every named platform plus typed extras (billboard, radio, …).
 * $39 after the 7-day trial is the whole desk — not a channel unlock.
 */
export const FREE_CHANNELS: readonly SpendChannel[] = SPEND_CHANNELS;

export type FreeChannel = SpendChannel;

export const FREE_CHANNEL_SET: ReadonlySet<string> = new Set(FREE_CHANNELS);

export function isFreeChannel(channel: string): channel is SpendChannel {
  return FREE_CHANNEL_SET.has(channel);
}

/** All engine channels (trial and paid). */
export const PRO_CHANNELS: readonly SpendChannel[] = SPEND_CHANNELS;

/**
 * Single SoT for plan copy. Keep $39 in-app only — never in App Store listing paste.
 */
export const PRO_UPSELL = {
  short: "7-day trial · then $39/store/mo",
  priceLine: "$39 per store / month",
  /** One-line “what you get” for Settings. */
  includes:
    "Whole desk: Spend, Overview, LTV, Goals. Sample data or Live data — billing is not a view.",
  channels:
    "Every named platform plus extras like billboard. Type a channel if we did not list it.",
  ltv: "Did this month’s new customers pay back the spend you logged? Mcfly follows them for 30 / 90 / 365 days. Shopify Analytics does not.",
  goals:
    "Type the sales you want this year. The board tells you the most you can spend each month and still hit your Total ROAS target.",
  close:
    "Share Overview (Email) opens your mail app with this period’s cards. Mcfly never sends mail for you.",
  upgradeCta: "Start 7-day trial",
  manageCta: "Manage plan",
  seeSettings: "See plan in Settings",
} as const;

/** In-app only (never listing paste). Contrast GMV ladders and order overages. */
export const BILLING_HONESTY = {
  flat:
    "Mcfly Analytics is $39 per store / month after a 7-day full-access trial — not a percent of sales, not a per-order fee.",
  cancel:
    "Shopify bills this app. Uninstall in Admin to stop the next 30-day cycle. The current cycle may still charge.",
} as const;

export const FREE_FEATURE_BULLETS = [
  "Shopify sales beside the spend you add (any platform, including billboard)",
  "Total ROAS = Shopify sales ÷ that spend",
  "Break-even from optional profit margin",
  "Period filters and Spend Allocation",
  "Email Overview (opens your mail app)",
  "Sample data to click around before Live data",
] as const;

export const PRO_FEATURE_BULLETS = [
  "Whole desk: Spend, Overview, LTV, Goals",
  "Every named platform plus extras like billboard",
  "Customer LTV and payback on your store",
  "Full-year Goals board",
  "7-day full-access trial, then $39 per store / month",
] as const;
