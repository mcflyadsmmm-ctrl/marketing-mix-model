/**
 * Top-frame navigation to Shopify Admin plan / charge URLs.
 *
 * Embedded apps run in a sandboxed iframe. Assigning admin.shopify.com to
 * window.location loads Admin inside that iframe → "refused to connect" and
 * bricks the desk until reload (App Store 2.1.1).
 *
 * Prefer App Bridge–patched window.open(_, "_top"). Never fall back to
 * same-frame navigation for Admin hosts.
 *
 * @see https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing/redirect-plan-selection-page
 */

const ADMIN_HOST_RE = /(^|\.)admin\.shopify\.com$/i;

export function isShopifyAdminUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ADMIN_HOST_RE.test(host);
  } catch {
    return false;
  }
}

export type BillingNavigateHost = {
  /** Returns false when the browser blocked the open (popup / sandbox). */
  openTop: (url: string) => boolean;
  clickTopAnchor: (url: string) => void;
  assignSameFrame: (url: string) => void;
};

/** Browser host used by ProUpgradeButton (App Bridge patches window.open). */
export function createBrowserBillingNavigateHost(): BillingNavigateHost {
  return {
    openTop(url: string) {
      const opened = window.open(url, "_top");
      // null/undefined = blocked; App Bridge may return a Window-like handle.
      return opened != null;
    },
    clickTopAnchor(url: string) {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_top";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("aria-hidden", "true");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
    assignSameFrame(url: string) {
      window.location.assign(url);
    },
  };
}

/**
 * Leave the embed and open a billing / plan URL in the top Admin frame.
 * Returns false if navigation could not be initiated safely.
 */
export function navigateToBillingConfirmation(
  url: string,
  host: BillingNavigateHost = createBrowserBillingNavigateHost(),
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    if (host.openTop(trimmed)) return true;
  } catch {
    // continue to anchor fallback
  }

  try {
    host.clickTopAnchor(trimmed);
    return true;
  } catch {
    // Do NOT same-frame assign Admin URLs — that is the refused-to-connect bug.
    if (isShopifyAdminUrl(trimmed)) {
      return false;
    }
    try {
      host.assignSameFrame(trimmed);
      return true;
    } catch {
      return false;
    }
  }
}
