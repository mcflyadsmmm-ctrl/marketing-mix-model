import { useEffect, useState } from "react";
import { useFetcher, useLocation } from "react-router";
import { useBillingExit } from "../lib/billing-exit-context";
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
  /** Hide the extra billing-exit note (Settings keeps the full chrome). */
  quiet?: boolean;
};

/**
 * Starts Managed Pricing via user-gesture top-frame open.
 *
 * Dual safety for App Store 2.1.1 (Settings → Start 7-day trial):
 * 1) Immediate App Bridge `open(_, "_top")` on click (no POST wait, no iframe 302)
 * 2) GET /app/billing?embedded=1 HTML bounce if JS cannot leave the frame
 */
export function ProUpgradeButton({
  variant = "primary",
  label,
  enabled = true,
  mode = "upgrade",
  quiet = false,
}: ProUpgradeButtonProps) {
  const fetcher = useFetcher<ProUpgradeActionData>();
  const location = useLocation();
  const { plansUrl } = useBillingExit();
  const busy = fetcher.state !== "idle";
  const data = fetcher.data;
  const [navError, setNavError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const billingSearch = withEmbeddedBillingSearch(location.search);
  const action = `/app/billing${billingSearch}`;
  const text =
    label ??
    (mode === "manage" ? PRO_UPSELL.manageCta : PRO_UPSELL.upgradeCta);

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

  function openPlansNow(url: string) {
    setNavError(null);
    setOpening(true);
    const ok = navigateToBillingConfirmation(url);
    if (!ok) {
      setOpening(false);
      setNavError(
        "Could not leave the app frame to open Shopify plans. Use “Open plans in Admin” below — that page exits the embed safely.",
      );
      return;
    }
    // Re-enable if Admin did not take over (blocked open that still returned a handle).
    window.setTimeout(() => setOpening(false), 2000);
  }

  return (
    <div
      className={["mcfly-pro-upgrade", quiet ? "mcfly-pro-upgrade--quiet" : null]
        .filter(Boolean)
        .join(" ")}
    >
      {plansUrl ? (
        <button
          type="button"
          className={`mcfly-btn mcfly-btn--${variant}`}
          disabled={opening}
          aria-busy={opening}
          data-mcfly-billing-exit={mode}
          data-mcfly-billing-user-gesture="1"
          onClick={() => openPlansNow(plansUrl)}
        >
          {opening ? "Opening plans…" : text}
        </button>
      ) : (
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
      )}
      {quiet ? null : (
        <p className="mcfly-pro-upgrade__hint">
          Opens Shopify’s plan page · {PRO_UPSELL.priceLine}.
        </p>
      )}
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
