/**
 * Shopify app / webhook / health paths that must not be served as static
 * marketing HTML from `site/`.
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
