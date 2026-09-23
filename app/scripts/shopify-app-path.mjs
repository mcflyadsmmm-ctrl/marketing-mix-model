/**
 * Shopify app / webhook / health paths that must not be served as static
 * marketing HTML from `site/`.
 *
 * Also: embedded Admin entry (Open app, install, billing return) hits the
 * App URL `/` with `shop` / `host` / `embedded=1`. express.static ignores
 * query strings and would paint the marketing landing inside the iframe.
 */

/** Public marketing site — Fly GETs redirect here (Phase D15). */
export const MARKETING_SITE_ORIGIN = "https://mcflyads.com";

/** App Store trust URLs stay on Fly (Remix OriginShell), not mcflyads.com. */
export function isFlyTrustPath(pathname) {
  const p = appRoutePath(pathname);
  return p === "/privacy" || p === "/support" || p === "/terms";
}

/** 301 target for marketing paths: same path + query on mcflyads.com. */
export function marketingSiteRedirectLocation(originalUrl) {
  const raw = String(originalUrl ?? "/");
  const pathQuery = raw.startsWith("/") ? raw : `/${raw}`;
  return `${MARKETING_SITE_ORIGIN}${pathQuery}`;
}

/** React Router data requests use `/app.data` — same route as `/app`. */
export function appRoutePath(pathname) {
  const p = (pathname.split("?")[0] || "/").replaceAll("\\", "/");
  return p.replace(/\.data$/, "");
}

export function isShopifyAppPath(pathname) {
  const p = appRoutePath(pathname);
  if (p === "/health" || p.startsWith("/health/")) return true;
  if (p === "/app" || p.startsWith("/app/") || p.startsWith("/app.")) return true;
  if (p === "/demo" || p.startsWith("/demo/") || p.startsWith("/demo.")) return true;
  if (p === "/auth" || p.startsWith("/auth")) return true;
  if (p === "/api" || p.startsWith("/api/")) return true;
  if (p === "/v1" || p.startsWith("/v1/")) return true;
  if (p === "/webhooks" || p.startsWith("/webhooks")) return true;
  return false;
}

/**
 * True when Shopify Admin / App Bridge already supplied a session.
 * Missing this, `authenticate.admin` returns 410 and the client router
 * throws "Unable to decode turbo-stream response" on `/app.data`.
 */
export function isEmbeddedAdminRequest(request) {
  if (!request) return false;
  const url = new URL(request.url, "https://mcfly-analytics.fly.dev");
  if (url.searchParams.get("embedded") === "1") return true;
  if (url.searchParams.get("host")?.trim()) return true;
  return false;
}

export function hasShopifySessionContext(request) {
  if (!request) return false;
  const url = new URL(request.url, "https://mcfly-analytics.fly.dev");
  if (isShopifyEmbeddedSearch(url.searchParams)) return true;
  const auth = String(request.headers?.get?.("authorization") ?? "").trim();
  return auth.toLowerCase().startsWith("bearer ");
}

function queryValue(query, key) {
  if (!query || typeof query !== "object") return "";
  const raw = query[key];
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  return String(raw ?? "").trim();
}

function headerValue(req, name) {
  if (!req) return "";
  const want = String(name).toLowerCase();
  const headers = req.headers;
  if (headers && typeof headers.get === "function") {
    return String(headers.get(name) ?? headers.get(want) ?? "").trim();
  }
  if (typeof req.get === "function") {
    return String(req.get(name) || req.get(want) || "").trim();
  }
  if (headers && typeof headers === "object") {
    const raw = headers[want] ?? headers[name];
    if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
    return String(raw ?? "").trim();
  }
  return "";
}

/**
 * Shopify Admin paints the App URL in an iframe. App Bridge can arrive
 * before `shop` / `host` are on the query — static `site/index.html` must
 * not win that first paint (Install / mcflyads.com slogan).
 */
export function isShopifyAdminFrame(req) {
  return headerValue(req, "sec-fetch-dest").toLowerCase() === "iframe";
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
  if (isShopifyAdminFrame(req)) return true;
  return false;
}

export function embeddedAppRedirectLocation(req) {
  return `/app${requestSearch(req)}`;
}

/** React Router client navigations hit `/app.data` — App Bridge may 410 those. */
export function isReactRouterDataRequest(request) {
  if (!request?.url) return false;
  const url = new URL(request.url, "https://mcfly-analytics.fly.dev");
  return url.pathname.includes(".data");
}

function safeAppNextPath(pathname) {
  const path = appRoutePath(String(pathname || "/app"));
  if (path === "/app" || path.startsWith("/app/")) return path;
  return "/app";
}

/**
 * First Admin HTML paint cannot send a session-token header. A thrown 410
 * becomes the document (“410 Gone”) and App Bridge never hydrates. Bounce
 * to `/auth/opening` (200 + App Bridge), then client-navigate to /app.
 */
export function documentGoneRedirectLocation(request) {
  if (!request?.url) return "/auth/opening?next=%2Fapp";
  const url = new URL(request.url, "https://mcfly-analytics.fly.dev");
  const path = appRoutePath(url.pathname);
  if (path === "/auth/opening") return null;
  const opening = new URL("https://mcfly-analytics.fly.dev/auth/opening");
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "next") continue;
    opening.searchParams.append(key, value);
  }
  opening.searchParams.set("next", safeAppNextPath(path));
  return `${opening.pathname}?${opening.searchParams.toString()}`;
}
