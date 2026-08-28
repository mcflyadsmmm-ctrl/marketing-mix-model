import {
  PRO_FEATURE_BULLETS,
  PRO_UPSELL,
} from "../lib/entitlements";
import { ProUpgradeButton } from "./ProUpgradeButton";
import { UseSampleCta } from "./UseSampleCta";

type ProUpsellBlockProps = {
  /** Feature-specific lead (LTV / Goals / channels). Falls back to includes. */
  lead?: string;
  /** Show Sample data preview CTA (same toggle as the top bar). */
  showSample?: boolean;
};

/**
 * Compact plan block: one sentence, price, Start 7-day trial.
 * Sample data uses the same data-mode POST as the top toggle — never /app/demo.
 * Product pages must not render this — Settings uses ProUpgradeButton directly.
 */
export function ProUpsellBlock({
  lead,
  showSample = true,
}: ProUpsellBlockProps) {
  return (
    <div className="mcfly-pro-upsell" aria-label={PRO_UPSELL.short}>
      <p className="mcfly-pro-upsell__price">{PRO_UPSELL.short}</p>
      <p className="mcfly-pro-upsell__lead">{lead ?? PRO_UPSELL.includes}</p>
      <div className="mcfly-pro-upsell__actions">
        <ProUpgradeButton quiet />
        {showSample ? (
          <UseSampleCta label="See Sample data" />
        ) : (
          <s-link href="/app/settings">{PRO_UPSELL.seeSettings}</s-link>
        )}
      </div>
      <details className="mcfly-pro-upsell__more" open>
        <summary>What’s in the desk</summary>
        <ul className="mcfly-pro-upsell__list">
          {PRO_FEATURE_BULLETS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
