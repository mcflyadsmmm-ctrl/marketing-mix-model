import { ProUpgradeButton } from "./ProUpgradeButton";

/**
 * LTV locked / ~90d Live state — one click to Shopify plans.
 * Not a feature gate: the whole desk stays on. Paid $39 unlocks full
 * order history. Price does not rise with sales.
 */
export function UnlockFullHistoryBanner() {
  return (
    <section
      className="mcfly-state mcfly-state--empty mcfly-state--soft"
      aria-label="Unlock full history"
    >
      <p className="mcfly-state__copy">
        Live orders on this desk use the recent ~90 days. $39 per store / month
        unlocks full order history — the price does not rise with sales.
      </p>
      <div className="mcfly-state__cta">
        <ProUpgradeButton
          label="Unlock full history"
          variant="primary"
          quiet
        />
      </div>
    </section>
  );
}
