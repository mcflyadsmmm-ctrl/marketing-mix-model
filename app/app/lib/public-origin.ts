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
export function isShopifyEmbeddedPath(pathname: string): boolean {
  if (pathname === "/app" || pathname.startsWith("/app/")) return true;
  if (pathname === "/auth" || pathname.startsWith("/auth")) return true;
  if (pathname === "/api" || pathname.startsWith("/api/")) return true;
  if (pathname === "/v1" || pathname.startsWith("/v1/")) return true;
  if (pathname === "/webhooks" || pathname.startsWith("/webhooks")) return true;
  return false;
}

export function isPublicOriginPath(pathname: string): boolean {
  return !isShopifyEmbeddedPath(pathname);
}
