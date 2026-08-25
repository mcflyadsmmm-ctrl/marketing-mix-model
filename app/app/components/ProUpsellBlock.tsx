import {
  PRO_UPSELL,
} from "../lib/entitlements";
import { ProUpgradeButton } from "./ProUpgradeButton";
import { UseSampleCta } from "./UseSampleCta";

type ProUpsellBlockProps = {
  /** Feature-specific lead (LTV / Goals / channels). Falls back to includes. */
  lead?: string;
  /** Show Sample preview CTA (same toggle as the top bar). */
  showSample?: boolean;
};

const PRO_PREVIEW_BULLETS = [
  "Every named channel (TikTok, Amazon, Email, Affiliate, …)",
  "Customer LTV · Cash CAC · LTV:CAC",
  "Full-year Goals board",
] as const;

/**
 * Short Pro upsell: price, three facts, Billing CTA. Sample uses the same
 * data-mode POST as the top toggle — never /app/demo.
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
        {PRO_PREVIEW_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="mcfly-pro-upsell__actions">
        <ProUpgradeButton />
        {showSample ? (
          <UseSampleCta label="Preview on Sample" />
        ) : (
          <s-link href="/app/settings">{PRO_UPSELL.seeSettings}</s-link>
        )}
      </div>
    </div>
  );
}
