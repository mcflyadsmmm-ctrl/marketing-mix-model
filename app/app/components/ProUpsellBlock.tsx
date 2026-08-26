import {
  BILLING_HONESTY,
  PRO_FEATURE_BULLETS,
  PRO_UPSELL,
} from "../lib/entitlements";
import { ProUpgradeButton } from "./ProUpgradeButton";
import { UseSampleCta } from "./UseSampleCta";

type ProUpsellBlockProps = {
  /** Feature-specific lead (LTV / Goals / channels). Falls back to includes. */
  lead?: string;
  /** Show Practice preview CTA (same toggle as the top bar). */
  showSample?: boolean;
};

/**
 * Compact Pro upsell: one sentence, price, Upgrade.
 * Practice uses the same data-mode POST as the top toggle — never /app/demo.
 * Keep $39 visible — Free-to-Pro is the money path; do not bury the price.
 */
export function ProUpsellBlock({
  lead,
  showSample = true,
}: ProUpsellBlockProps) {
  return (
    <div className="mcfly-pro-upsell" aria-label={PRO_UPSELL.short}>
      <p className="mcfly-pro-upsell__price">{PRO_UPSELL.short}</p>
      <p className="mcfly-pro-upsell__lead">{lead ?? PRO_UPSELL.includes}</p>
      <p className="mcfly-pro-upsell__honest">{BILLING_HONESTY.flat}</p>
      <div className="mcfly-pro-upsell__actions">
        <ProUpgradeButton quiet />
        {showSample ? (
          <UseSampleCta label="See it on Practice" />
        ) : (
          <s-link href="/app/settings">{PRO_UPSELL.seeSettings}</s-link>
        )}
      </div>
      <details className="mcfly-pro-upsell__more" open>
        <summary>What’s in Pro</summary>
        <ul className="mcfly-pro-upsell__list">
          {PRO_FEATURE_BULLETS.map((line) => (
            <li key={line}>{line}</li>
          ))}
          <li>{BILLING_HONESTY.cancel}</li>
        </ul>
      </details>
    </div>
  );
}
