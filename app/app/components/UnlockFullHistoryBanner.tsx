import { ProUpgradeButton } from "./ProUpgradeButton";

/**
 * Trial shops already have the same 24-month order book as paid.
 * This is a plan reminder, not a history gate.
 */
export function UnlockFullHistoryBanner() {
  return (
    <section
      className="mcfly-state mcfly-state--empty mcfly-state--soft"
      aria-label="Trial includes 24 months"
    >
      <p className="mcfly-state__copy">
        <strong>24 months of orders are already on this desk.</strong> Trial
        and paid use the same book. After the trial, $39 per store / month
        keeps it. The price does not rise with sales.
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
