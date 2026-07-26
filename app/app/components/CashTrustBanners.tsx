/**
 * Light Cash MER trust banners — coverage honesty + mock-as-live guard.
 * Polaris chrome only; keep out of the Apps Script scoreboard island.
 */

import type { SpendPeriodCoverage } from "../lib/mer-trust";
import { formatSpendCoverageLine } from "../lib/mer-trust";

type Props = {
  blockedMockAsLive: boolean;
  spendCoverage: SpendPeriodCoverage | null;
  periodLabel: string;
  /** Live Shopify (not sample) + period wider than ~60d read_orders window. */
  shopifyOrderWindowLimited?: boolean;
  shotMode?: boolean;
};

export function CashTrustBanners({
  blockedMockAsLive,
  spendCoverage,
  periodLabel,
  shopifyOrderWindowLimited = false,
  shotMode = false,
}: Props) {
  if (shotMode) return null;

  return (
    <>
      {blockedMockAsLive ? (
        <s-banner tone="critical" heading="Mock sales blocked">
          <s-paragraph>
            Fabricated sales were refused — Cash MER never treats mock numbers as live Shopify
            when the sample desk is off. Retry the till pull, or turn on the{" "}
            <s-link href="/app/demo">sample desk</s-link> for a clearly labeled demo.
          </s-paragraph>
        </s-banner>
      ) : null}

      {shopifyOrderWindowLimited ? (
        <s-banner tone="info" heading="Live till may be incomplete for this period">
          <s-paragraph>
            {periodLabel} is longer than Shopify’s default ~60-day order window (
            <code>read_orders</code>). Cash MER still uses sales ÷ spend for orders the till
            returns — not a full L12M/3yr claim until daily sales facts backfill. Prefer MTD /
            QTD for a complete live window, or use the{" "}
            <s-link href="/app/demo">sample desk</s-link> for a labeled multi-year rehearsal.
          </s-paragraph>
        </s-banner>
      ) : null}

      {spendCoverage?.incomplete ? (
        <s-banner tone="warning" heading="Incomplete spend coverage">
          <s-paragraph>
            {formatSpendCoverageLine(spendCoverage, periodLabel)}. Cash MER still uses sales ÷
            spend for the days you logged — this is a coverage gap, not attribution. Fill missing
            days on <s-link href="/app/spend">Spend</s-link>.
          </s-paragraph>
        </s-banner>
      ) : null}
    </>
  );
}
