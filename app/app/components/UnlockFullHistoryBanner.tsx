import { ProUpgradeButton } from "./ProUpgradeButton";

/**
 * Billing does not shorten the book. Trial and paid share Customers, LTV,
 * and up to 24 months of orders. Flat $39. One plan.
 */
export function UnlockFullHistoryBanner() {
  return (
    <section
      className="mcfly-state mcfly-state--empty mcfly-state--soft"
      aria-label="Trial and paid keep 24 months of orders"
    >
      <p className="mcfly-state__copy">
        <strong>
          Trial and paid keep the same desk: Customers, LTV, and up to 24
          months of orders.
        </strong>{" "}
        7 days, then $39. Spend stays optional. The price
        does not rise with sales. One plan.
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
