import { useLocation } from "react-router";
import { PRO_UPSELL } from "../lib/entitlements";

type ProUpgradeButtonProps = {
  /** Polaris / desk button variant. */
  variant?: "primary" | "secondary" | "tertiary";
  /** Override label (default PRO_UPSELL.upgradeCta or Manage plan). */
  label?: string;
  /** When false, render nothing (caller already Pro / billing off). */
  enabled?: boolean;
  /**
   * upgrade = Free → Pro CTA.
   * manage = Pro → open Managed Pricing to change/downgrade (App Store 1.2.3).
   */
  mode?: "upgrade" | "manage";
};

/**
 * Opens Shopify Managed Pricing via GET /app/billing.
 * That loader uses authenticate.admin redirect({ target: "_top" }) so Admin
 * plan selection never loads inside the app iframe (App Store 2.1.1).
 */
export function ProUpgradeButton({
  variant = "primary",
  label,
  enabled = true,
  mode = "upgrade",
}: ProUpgradeButtonProps) {
  const location = useLocation();
  if (!enabled) return null;

  const href = `/app/billing${location.search}`;
  const text =
    label ??
    (mode === "manage" ? "Manage plan — Free or Pro" : PRO_UPSELL.upgradeCta);

  return (
    <div className="mcfly-pro-upgrade">
      <a
        href={href}
        className={`mcfly-btn mcfly-btn--${variant}`}
        data-mcfly-billing-exit={mode}
      >
        {text}
      </a>
    </div>
  );
}
