export const FLY_PUBLIC_ORIGIN = "https://mcfly-analytics.fly.dev";

export const FLY_SUPPORT_URL = `${FLY_PUBLIC_ORIGIN}/support`;
export const FLY_PRIVACY_URL = `${FLY_PUBLIC_ORIGIN}/privacy`;
export const FLY_TERMS_URL = `${FLY_PUBLIC_ORIGIN}/terms`;
export const FLY_PRICING_URL = `${FLY_PUBLIC_ORIGIN}/pricing`;

/** Partner listing trust URLs (Website / Privacy / Support / Terms / Pricing). */
export const PUBLIC_ORIGIN_PATHS = [
  "/",
  "/support",
  "/privacy",
  "/terms",
  "/pricing",
] as const;

/**
 * Embedded Shopify surfaces that may load App Bridge.
 * Everything else on this origin is a public marketing / trust page.
 */
function routePath(pathname: string): string {
  const p = (pathname.split("?")[0] || "/").replaceAll("\\", "/");
  return p.replace(/\.data$/, "");
}

export function isShopifyEmbeddedPath(pathname: string): boolean {
  const p = routePath(pathname);
  if (p === "/app" || p.startsWith("/app/") || p.startsWith("/app.")) return true;
  if (p === "/auth" || p.startsWith("/auth")) return true;
  if (p === "/api" || p.startsWith("/api/")) return true;
  if (p === "/v1" || p.startsWith("/v1/")) return true;
  if (p === "/webhooks" || p.startsWith("/webhooks")) return true;
  return false;
}

export function isPublicOriginPath(pathname: string): boolean {
  return !isShopifyEmbeddedPath(pathname);
}
