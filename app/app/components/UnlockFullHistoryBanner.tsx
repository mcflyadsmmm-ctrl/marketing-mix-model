import { ProUpgradeButton } from "./ProUpgradeButton";
import { LIVE_UNPAID_INGEST_DAYS } from "../lib/live-unpark";

/**
 * Unpaid / trial shops stop at {@link LIVE_UNPAID_INGEST_DAYS} closed days
 * of order rows. Paid is up to 24 months. Flat $39. One plan.
 */
export function UnlockFullHistoryBanner() {
  return (
    <section
      className="mcfly-state mcfly-state--empty mcfly-state--soft"
      aria-label={`Trial is ${LIVE_UNPAID_INGEST_DAYS} closed days`}
    >
      <p className="mcfly-state__copy">
        <strong>
          This unpaid till is {LIVE_UNPAID_INGEST_DAYS} closed days of order rows.
        </strong>{" "}
        Paid is up to 24 months of orders. After the trial, $39 per store /
        month keeps the longer book. The price does not rise with sales. One
        plan.
      </p>
      <div className="mcfly-state__cta">
        <ProUpgradeButton
          label="See the plan"
          variant="primary"
          quiet
        />
      </div>
    </section>
  );
}
