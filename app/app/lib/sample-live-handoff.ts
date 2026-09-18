/**
 * SAMPLE → Live handoff copy.
 * Settings / data-mode already set `guide=real` after use-real.
 * Overview must paint that so Snowdevil spend is never mistaken for a live day.
 */

export const LIVE_HANDOFF_GUIDE = "real";

export const LIVE_HANDOFF_HEADING = "Live data is on";

export const LIVE_HANDOFF_BODY =
  "Shopify sales are this shop’s. SAMPLE spend did not transfer — Total ROAS stays — until you add a day on Spend Upload. Start 7-day trial is Shopify billing in Settings, not this switch.";

/** Overview door — sales-first. Spend / Total ROAS honesty lives on those tabs. */
export const SAMPLE_OVERVIEW_DOOR =
  "Snowdevil example sales — not this shop. Live is parked until launch.";

/** Orders door — typical ticket and timing. Spend stays off this tab. */
export const SAMPLE_ORDERS_DOOR =
  "Snowdevil example orders — not this shop. Live is parked until launch.";

/** Customers door — RFM-lite / whales / repurchase. Spend stays off this tab. */
export const SAMPLE_CUSTOMERS_DOOR =
  "Snowdevil example buyers — not this shop. Live is parked until launch.";

export const SAMPLE_SPEND_NOT_LIVE =
  "Total ROAS here uses Snowdevil example spend — not this shop. Live is parked until launch. SAMPLE dollars do not become yours.";

export const SAMPLE_LEDGER_HANDOFF =
  "These rows are Snowdevil example spend, not this shop. Live is parked until launch. SAMPLE dollars stay SAMPLE — they will not become your spend.";

export const TRIAL_VS_VIEW =
  "The whole desk is already on. Start 7-day trial in Settings is Shopify billing — Sample | Live is a view, not a plan.";

export function isLiveHandoffGuide(
  value: string | null | undefined,
): boolean {
  return String(value ?? "").trim().toLowerCase() === LIVE_HANDOFF_GUIDE;
}
