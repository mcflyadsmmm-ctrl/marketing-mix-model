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
  "Example orders — not this shop.";

/** Orders door — typical ticket and timing. Spend stays off this tab. */
export const SAMPLE_ORDERS_DOOR =
  "Example orders — not this shop.";

/** Growth door — days-to-second / win-back. Spend stays off this tab. */
export const SAMPLE_GROWTH_DOOR =
  "Example order history — not this shop.";

/** Customers door — RFM-lite / whales / repurchase. Spend stays off this tab. */
export const SAMPLE_CUSTOMERS_DOOR =
  "Example buyers — not this shop.";
export const SAMPLE_SPEND_NOT_LIVE =
  "Total ROAS here uses example spend — not this shop. Those dollars do not become yours.";

export const SAMPLE_LEDGER_HANDOFF =
  "These rows are example spend, not this shop. They will not become your spend.";

export const TRIAL_VS_VIEW =
  "Start 7-day trial in Settings is Shopify billing — Sample | Live is a view, not a plan. 7 days, then $39. Trial and paid both keep the full desk, up to 24 months of orders. Spend stays optional. One plan.";

export function isLiveHandoffGuide(
  value: string | null | undefined,
): boolean {
  return String(value ?? "").trim().toLowerCase() === LIVE_HANDOFF_GUIDE;
}
