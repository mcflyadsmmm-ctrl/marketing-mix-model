/**
 * Top-frame navigation to Shopify Admin plan / charge URLs.
 *
 * Embedded apps run in a sandboxed iframe. Assigning admin.shopify.com to
 * window.location loads Admin inside that iframe → "refused to connect" and
 * bricks the desk until reload (App Store 2.1.1).
 *
 * App Bridge patches global `open(url, "_top")`. Prefer that (user gesture),
 * then a target=_top anchor. Never same-frame-assign Admin hosts.
 *
 * @see https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing/redirect-plan-selection-page
 * @see https://shopify.dev/docs/api/app-home/apis/user-interface-and-interactions/navigation-api
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

type OpenFn = (url: string, target?: string, features?: string) => Window | null;

function tryOpenTop(openFn: OpenFn | undefined, url: string): boolean {
  if (typeof openFn !== "function") return false;
  try {
    const opened = openFn(url, "_top");
    // null/undefined = blocked; App Bridge may return a Window-like handle.
    return opened != null;
  } catch {
    return false;
  }
}

/** Browser host used by ProUpgradeButton (App Bridge patches open / window.open). */
export function createBrowserBillingNavigateHost(): BillingNavigateHost {
  return {
    openTop(url: string) {
      const g = globalThis as typeof globalThis & { open?: OpenFn };
      if (tryOpenTop(g.open, url)) return true;
      if (typeof window !== "undefined" && tryOpenTop(window.open, url)) {
        return true;
      }
      return false;
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

/** Ensure embedded=1 (and shop/host when known) survive on billing URLs. */
export function withEmbeddedBillingSearch(
  search: string,
  extras?: { shop?: string | null; host?: string | null },
): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  if (params.get("embedded") !== "1") {
    params.set("embedded", "1");
  }
  if (extras?.shop && !params.get("shop")) {
    params.set("shop", extras.shop);
  }
  if (extras?.host && !params.get("host")) {
    params.set("host", extras.host);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "?embedded=1";
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
