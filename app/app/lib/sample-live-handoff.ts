/**
 * SAMPLE → Live handoff copy.
 * Settings / data-mode already set `guide=real` after use-real.
 * Overview must paint that so Snowdevil spend is never mistaken for a live day.
 */

export const LIVE_HANDOFF_GUIDE = "real";

export const LIVE_HANDOFF_HEADING = "Live data is on";

export const LIVE_HANDOFF_BODY =
  "Shopify sales are this shop’s. SAMPLE spend did not transfer — Total ROAS stays — until you add a day on Spend Upload. Start 7-day trial is Shopify billing in Settings, not this switch.";

/** Overview door — SAMPLE chip owns the label; no parked apology on first screen. */
export const SAMPLE_OVERVIEW_DOOR =
  "Sample shop example orders — not this shop.";

/** Orders door — typical ticket and timing. Spend stays off this tab. */
export const SAMPLE_ORDERS_DOOR =
  "Sample shop example orders — not this shop.";

/** Growth door — days-to-second / win-back. Spend stays off this tab. */
export const SAMPLE_GROWTH_DOOR =
  "Sample shop example order history — not this shop.";

/** Customers door — RFM-lite / whales / repurchase. Spend stays off this tab. */
export const SAMPLE_CUSTOMERS_DOOR =
  "Sample shop example buyers — not this shop.";
export const SAMPLE_SPEND_NOT_LIVE =
  "Total ROAS here uses Sample shop example spend — not this shop. SAMPLE dollars do not become yours.";

export const SAMPLE_LEDGER_HANDOFF =
  "These rows are Sample shop example spend, not this shop. SAMPLE dollars stay SAMPLE — they will not become your spend.";

export const TRIAL_VS_VIEW =
  "Start 7-day trial in Settings is Shopify billing — Sample | Live is a view, not a plan. Trial and paid keep Customers, LTV, and up to 24 months of orders. Spend stays optional. $39 after 7 days, one plan.";

export function isLiveHandoffGuide(
  value: string | null | undefined,
): boolean {
  return String(value ?? "").trim().toLowerCase() === LIVE_HANDOFF_GUIDE;
}
