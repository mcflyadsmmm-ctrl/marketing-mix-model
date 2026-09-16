/**
 * SAMPLE → Live handoff copy.
 * Settings / data-mode already set `guide=real` after use-real.
 * Overview must paint that so Harbor spend is never mistaken for a live day.
 */

export const LIVE_HANDOFF_GUIDE = "real";

export const LIVE_HANDOFF_HEADING = "Live data is on";

export const LIVE_HANDOFF_BODY =
  "Shopify sales are this shop’s. SAMPLE spend did not transfer — Total ROAS stays — until you add a day on Spend Upload. Start 7-day trial is Shopify billing in Settings, not this switch.";

export const SAMPLE_SPEND_NOT_LIVE =
  "Total ROAS here uses example spend — not this shop. Switch to Live in Settings, then add a day on Spend Upload. SAMPLE dollars do not become yours.";

export const SAMPLE_LEDGER_HANDOFF =
  "These rows are example spend, not this shop. Saving a day switches you to Live data. SAMPLE dollars stay SAMPLE — they will not become your spend.";

export const TRIAL_VS_VIEW =
  "The whole desk is already on. Start 7-day trial in Settings is Shopify billing — Sample | Live is a view, not a plan.";

export function isLiveHandoffGuide(
  value: string | null | undefined,
): boolean {
  return String(value ?? "").trim().toLowerCase() === LIVE_HANDOFF_GUIDE;
}
