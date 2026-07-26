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
  shotMode?: boolean;
};

export function CashTrustBanners({
  blockedMockAsLive,
  spendCoverage,
  periodLabel,
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
