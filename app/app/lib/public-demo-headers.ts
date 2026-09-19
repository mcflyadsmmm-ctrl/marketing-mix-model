/**
 * Public SAMPLE desk may be iframed from mcflyads.com (homepage live cards,
 * /demo shell). Never Shopify Admin. No session cookies.
 */
export const PUBLIC_DEMO_FRAME_ANCESTORS =
  "'self' https://mcflyads.com https://www.mcflyads.com";

export function isPublicDemoPath(pathname: string): boolean {
  const p = (pathname.split("?")[0] || "/").replace(/\.data$/, "");
  return p === "/demo" || p.startsWith("/demo/");
}

export function publicDemoHeaders(): Headers {
  const headers = new Headers();
  headers.set(
    "Content-Security-Policy",
    `frame-ancestors ${PUBLIC_DEMO_FRAME_ANCESTORS}`,
  );
  headers.set("Cache-Control", "public, max-age=60");
  return headers;
}

/**
 * Shopify `addDocumentResponseHeaders` overwrites CSP to Admin-only
 * frame-ancestors. Re-stamp so mcflyads.com can iframe `/demo`.
 */
export function stampPublicDemoDocumentHeaders(
  request: Request,
  headers: Headers,
): void {
  const path = new URL(request.url).pathname;
  if (!isPublicDemoPath(path)) return;
  const demo = publicDemoHeaders();
  for (const [key, value] of demo.entries()) {
    headers.set(key, value);
  }
  headers.delete("X-Frame-Options");
}
