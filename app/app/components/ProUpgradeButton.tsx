import { useEffect } from "react";
import { useFetcher, useLocation } from "react-router";
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

/** Open Shopify charge confirmation in the top frame (embedded apps cannot iframe it). */
export function navigateToBillingConfirmation(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return;
  try {
    if (window.top && window.top !== window) {
      window.top.location.assign(trimmed);
      return;
    }
  } catch {
    // Cross-origin top — fall through.
  }
  window.location.assign(trimmed);
}

/**
 * Starts Pro via Shopify Billing — posts to /app/billing, then top-navigates
 * to confirmationUrl. Never a plain link to Settings.
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
  // Keep shop/host on the action URL so returnUrl after approve stays embedded-safe.
  const action = `/app/billing${location.search}`;

  useEffect(() => {
    if (data?.ok && data.confirmationUrl) {
      navigateToBillingConfirmation(data.confirmationUrl);
    }
  }, [data]);

  if (!enabled) return null;

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
      {data && !data.ok ? (
        <p className="mcfly-pro-upgrade__error" role="alert">
          {data.error}
        </p>
      ) : null}
    </div>
  );
}
