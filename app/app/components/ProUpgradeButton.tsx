import { useEffect, useState } from "react";
import { useFetcher, useLocation } from "react-router";
import { navigateToBillingConfirmation } from "../lib/billing-navigate";
import { PRO_UPSELL } from "../lib/entitlements";
import type { ProUpgradeActionData } from "../routes/app.billing";

type ProUpgradeButtonProps = {
  /** Polaris button variant. */
  variant?: "primary" | "secondary" | "tertiary";
  /** Override label (default PRO_UPSELL.upgradeCta). */
  label?: string;
  /** When false, render nothing (caller already Pro). */
  enabled?: boolean;
};

export { navigateToBillingConfirmation } from "../lib/billing-navigate";

/**
 * Starts Pro via Shopify Billing — posts to /app/billing, then top-navigates
 * to the Managed Pricing plan page (never iframe Admin).
 */
export function ProUpgradeButton({
  variant = "primary",
  label = PRO_UPSELL.upgradeCta,
  enabled = true,
}: ProUpgradeButtonProps) {
  const fetcher = useFetcher<ProUpgradeActionData>();
  const location = useLocation();
  const busy = fetcher.state !== "idle";
  const data = fetcher.data;
  const [navError, setNavError] = useState<string | null>(null);
  // Keep shop/host on the action URL so returnUrl after approve stays embedded-safe.
  const action = `/app/billing${location.search}`;

  useEffect(() => {
    if (!data?.ok || !data.confirmationUrl) return;
    setNavError(null);
    const ok = navigateToBillingConfirmation(data.confirmationUrl);
    if (!ok) {
      setNavError(
        "Could not open Shopify plan selection outside the app frame. Reload and try again, or open Settings → Plan in a new Admin tab.",
      );
    }
  }, [data]);

  if (!enabled) return null;

  const errorMessage =
    navError ?? (data && !data.ok ? data.error : null);

  return (
    <div className="mcfly-pro-upgrade">
      <fetcher.Form method="post" action={action}>
        <button
          type="submit"
          className={`mcfly-btn mcfly-btn--${variant}`}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Opening plans…" : label}
        </button>
      </fetcher.Form>
      {errorMessage ? (
        <p className="mcfly-pro-upgrade__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
