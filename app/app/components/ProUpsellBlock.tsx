import {
  PRO_FEATURE_BULLETS,
  PRO_UPSELL,
} from "../lib/entitlements";
import { ProUpgradeButton } from "./ProUpgradeButton";

type ProUpsellBlockProps = {
  /** Feature-specific lead (LTV / Goals / channels). Falls back to includes. */
  lead?: string;
  /** Show SAMPLE preview CTA. */
  showSample?: boolean;
};

/**
 * Clear Pro upsell: price, what’s included, Billing CTA (not Settings deep-link).
 */
export function ProUpsellBlock({
  lead,
  showSample = true,
}: ProUpsellBlockProps) {
  return (
    <div className="mcfly-pro-upsell" aria-label={PRO_UPSELL.short}>
      <p className="mcfly-pro-upsell__price">
        {PRO_UPSELL.short} · {PRO_UPSELL.priceLine}
      </p>
      <p className="mcfly-pro-upsell__lead">{lead ?? PRO_UPSELL.includes}</p>
      <ul className="mcfly-pro-upsell__list">
        {PRO_FEATURE_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="mcfly-pro-upsell__actions">
        <ProUpgradeButton />
        {showSample ? (
          <s-button href="/app/demo" variant="secondary">
            Preview on SAMPLE
          </s-button>
        ) : (
          <s-link href="/app/settings">{PRO_UPSELL.seeSettings}</s-link>
        )}
      </div>
    </div>
  );
}
