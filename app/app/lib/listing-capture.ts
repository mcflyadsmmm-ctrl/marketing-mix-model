/**
 * App Store listing-capture mode.
 *
 * Hides SAMPLE / demo chrome on desk routes so Partner screenshots look like
 * the live product desk. SAMPLE *numbers* may still fill the metrics — this
 * mode only removes yellow banners, SAMPLE chips, and other demo-only chrome.
 *
 * Enable:  ?listing=1  (canonical)  · aliases ?shot=1  ?capture=1
 * Disable: ?listing=0  (also shot=0 / capture=0) — restores merchant honesty
 *
 * sessionStorage keeps the mode on if Shopify Admin drops the query param
 * during iframe navigation. The boot script re-attaches ?listing=1 before paint.
 * Merchant SAMPLE honesty is unchanged when this mode is off.
 */

export const LISTING_CAPTURE_CANONICAL_PARAM = "listing";
export const LISTING_CAPTURE_PARAM_KEYS = [
  "listing",
  "shot",
  "capture",
] as const;
export const LISTING_CAPTURE_ON_VALUES = ["1", "true", "yes"] as const;
export const LISTING_CAPTURE_OFF_VALUES = ["0", "false", "off"] as const;
export const LISTING_CAPTURE_STORAGE_KEY = "mcfly_listing_capture";
export const LISTING_CAPTURE_HTML_CLASS = "mcfly-listing-capture";

export type ListingCaptureParamKey =
  (typeof LISTING_CAPTURE_PARAM_KEYS)[number];

function normalizeFlag(value: string | null): string | null {
  if (value == null) return null;
  return value.trim().toLowerCase();
}

function isOnValue(value: string | null): boolean {
  const normalized = normalizeFlag(value);
  return (
    normalized != null &&
    (LISTING_CAPTURE_ON_VALUES as readonly string[]).includes(normalized)
  );
}

function isOffValue(value: string | null): boolean {
  const normalized = normalizeFlag(value);
  return (
    normalized != null &&
    (LISTING_CAPTURE_OFF_VALUES as readonly string[]).includes(normalized)
  );
}

/** Explicit off wins so `?listing=0&shot=1` cannot strand capture mode. */
export function listingCaptureFromSearchParams(
  params: URLSearchParams,
): boolean {
  for (const key of LISTING_CAPTURE_PARAM_KEYS) {
    if (isOffValue(params.get(key))) return false;
  }
  for (const key of LISTING_CAPTURE_PARAM_KEYS) {
    if (isOnValue(params.get(key))) return true;
  }
  return false;
}

export function listingCaptureFromRequest(request: Request): boolean {
  return listingCaptureFromSearchParams(new URL(request.url).searchParams);
}

export function applyListingCaptureParam(
  params: URLSearchParams,
  enabled: boolean,
): URLSearchParams {
  if (enabled) {
    params.set(LISTING_CAPTURE_CANONICAL_PARAM, "1");
    // Keep shot=1 so older capture links and CSS --shot class paths stay aligned.
    params.set("shot", "1");
    params.delete("capture");
    return params;
  }
  for (const key of LISTING_CAPTURE_PARAM_KEYS) {
    params.delete(key);
  }
  return params;
}

export function listingCaptureHref(path: string, enabled: boolean): string {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const qIndex = withoutHash.indexOf("?");
  const base = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const params = new URLSearchParams(
    qIndex >= 0 ? withoutHash.slice(qIndex + 1) : "",
  );
  applyListingCaptureParam(params, enabled);
  const query = params.toString();
  return `${base}${query ? `?${query}` : ""}${hash}`;
}

/**
 * Period ctx label. Listing-capture never says SAMPLE or "live sales" —
 * period only — so shots crop clean without demo chrome or a live lie.
 * Merchant mode (listingCapture=false) keeps SAMPLE honesty unchanged.
 */
export function formatListingTillLabel(input: {
  periodLabel: string;
  useSampleDesk: boolean;
  listingCapture: boolean;
  salesError?: boolean;
  blockedMockAsLive?: boolean;
  salesSource?: string | null;
  factsIncomplete?: boolean;
  /** Token lacks read_all_orders — recent Shopify window, not a dead desk. */
  recentWindowOnly?: boolean;
}): string {
  if (input.listingCapture) {
    return input.periodLabel;
  }
  if (input.useSampleDesk) {
    return `${input.periodLabel} · SAMPLE`;
  }
  if (
    input.salesError ||
    input.blockedMockAsLive ||
    input.salesSource === "mock"
  ) {
    return `${input.periodLabel} · sales unavailable`;
  }
  if (input.recentWindowOnly) {
    return `${input.periodLabel} · recent ~60 days`;
  }
  if (input.factsIncomplete) {
    return `${input.periodLabel} · facts incomplete`;
  }
  return `${input.periodLabel} · live sales`;
}

/** Inline boot: persist capture mode + hide chrome before first paint. */
export const LISTING_CAPTURE_BOOT_SCRIPT = `(function(){
  try {
    if (location.pathname !== "/app" && location.pathname.indexOf("/app/") !== 0) return;
    var params = new URLSearchParams(location.search);
    var keys = ${JSON.stringify(LISTING_CAPTURE_PARAM_KEYS)};
    var onVals = ${JSON.stringify(LISTING_CAPTURE_ON_VALUES)};
    var offVals = ${JSON.stringify(LISTING_CAPTURE_OFF_VALUES)};
    var storageKey = ${JSON.stringify(LISTING_CAPTURE_STORAGE_KEY)};
    var htmlClass = ${JSON.stringify(LISTING_CAPTURE_HTML_CLASS)};
    var explicitOff = false;
    var explicitOn = false;
    for (var i = 0; i < keys.length; i++) {
      var raw = params.get(keys[i]);
      if (raw == null) continue;
      var v = String(raw).toLowerCase();
      if (offVals.indexOf(v) !== -1) explicitOff = true;
      if (onVals.indexOf(v) !== -1) explicitOn = true;
    }
    if (explicitOff) {
      sessionStorage.removeItem(storageKey);
      document.documentElement.classList.remove(htmlClass);
      return;
    }
    if (explicitOn) sessionStorage.setItem(storageKey, "1");
    var active = explicitOn || sessionStorage.getItem(storageKey) === "1";
    if (!active) return;
    document.documentElement.classList.add(htmlClass);
    if (!explicitOn) {
      params.set(${JSON.stringify(LISTING_CAPTURE_CANONICAL_PARAM)}, "1");
      params.set("shot", "1");
      var next = location.pathname + "?" + params.toString() + location.hash;
      location.replace(next);
    }
  } catch (e) {}
})();`;
