/**
 * Shopify app / webhook / health paths that must not be served as static
 * marketing HTML from `site/`.
 *
 * Also: embedded Admin entry (Open app, install, billing return) hits the
 * App URL `/` with `shop` / `host` / `embedded=1`. express.static ignores
 * query strings and would paint the marketing landing inside the iframe.
 */

export function isShopifyAppPath(pathname) {
  const p = (pathname.split("?")[0] || "/").replaceAll("\\", "/");
  if (p === "/health" || p.startsWith("/health/")) return true;
  if (p === "/app" || p.startsWith("/app/")) return true;
  if (p === "/auth" || p.startsWith("/auth")) return true;
  if (p === "/api" || p.startsWith("/api/")) return true;
  if (p === "/v1" || p.startsWith("/v1/")) return true;
  if (p === "/webhooks" || p.startsWith("/webhooks")) return true;
  return false;
}

function queryValue(query, key) {
  if (!query || typeof query !== "object") return "";
  const raw = query[key];
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  return String(raw ?? "").trim();
}

/**
 * Shopify Admin session query — present on install, Open app, and billing return.
 * @param {string | Record<string, unknown> | URLSearchParams | null | undefined} queryOrSearch
 */
export function isShopifyEmbeddedSearch(queryOrSearch) {
  if (!queryOrSearch) return false;
  if (typeof queryOrSearch === "string") {
    const qs = queryOrSearch.startsWith("?")
      ? queryOrSearch.slice(1)
      : queryOrSearch;
    if (!qs) return false;
    return isShopifyEmbeddedSearch(new URLSearchParams(qs));
  }
  const get =
    queryOrSearch instanceof URLSearchParams
      ? (key) => String(queryOrSearch.get(key) ?? "").trim()
      : (key) => queryValue(queryOrSearch, key);
  if (get("shop")) return true;
  if (get("host")) return true;
  if (get("id_token")) return true;
  if (get("hmac")) return true;
  if (get("session")) return true;
  if (get("embedded") === "1") return true;
  return false;
}

export function requestSearch(req) {
  const raw = String(req?.originalUrl || req?.url || "");
  const i = raw.indexOf("?");
  return i >= 0 ? raw.slice(i) : "";
}

/**
 * Marketing `site/` must not win these requests. `/app` and `/auth` fall
 * through to Remix; every other path redirects to `/app` + the same query.
 */
export function shouldSkipMarketingSite(req) {
  const path = String(req?.path || "/");
  if (isShopifyAppPath(path)) return true;
  if (isShopifyEmbeddedSearch(req?.query)) return true;
  if (isShopifyEmbeddedSearch(requestSearch(req))) return true;
  return false;
}

export function embeddedAppRedirectLocation(req) {
  return `/app${requestSearch(req)}`;
}
