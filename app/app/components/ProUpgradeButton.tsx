import { useEffect, useState } from "react";
import { useFetcher, useLocation } from "react-router";
import {
  navigateToBillingConfirmation,
  withEmbeddedBillingSearch,
} from "../lib/billing-navigate";
import { PRO_UPSELL } from "../lib/entitlements";
import type { ProUpgradeActionData } from "../routes/app.billing";

type ProUpgradeButtonProps = {
  variant?: "primary" | "secondary" | "tertiary";
  label?: string;
  enabled?: boolean;
  mode?: "upgrade" | "manage";
};

/**
 * Starts Managed Pricing via POST /app/billing, then top-frame open.
 *
 * Dual safety for App Store 2.1.1:
 * 1) Client window.open(_, "_top") after user gesture (App Bridge patches open)
 * 2) Fallback link to GET /app/billing?embedded=1 which returns HTML exit
 *    (never a bare 302 to Admin)
 */
export function ProUpgradeButton({
  variant = "primary",
  label,
  enabled = true,
  mode = "upgrade",
}: ProUpgradeButtonProps) {
  const fetcher = useFetcher<ProUpgradeActionData>();
  const location = useLocation();
  const busy = fetcher.state !== "idle";
  const data = fetcher.data;
  const [navError, setNavError] = useState<string | null>(null);

  const billingSearch = withEmbeddedBillingSearch(location.search);
  const action = `/app/billing${billingSearch}`;
  const text =
    label ??
    (mode === "manage" ? "Manage plan — Free or Pro" : PRO_UPSELL.upgradeCta);

  useEffect(() => {
    if (!data?.ok || !data.confirmationUrl) return;
    setNavError(null);
    const ok = navigateToBillingConfirmation(data.confirmationUrl);
    if (!ok) {
      setNavError(
        "Could not leave the app frame to open Shopify plans. Use “Open plans in Admin” below, or reload and try again.",
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
          data-mcfly-billing-exit={mode}
        >
          {busy ? "Opening plans…" : text}
        </button>
      </fetcher.Form>
      {errorMessage ? (
        <p className="mcfly-pro-upgrade__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <p className="mcfly-pro-upgrade__fallback">
        <a href={action} data-mcfly-billing-exit-fallback={mode}>
          Open plans in Admin
        </a>
      </p>
    </div>
  );
}
