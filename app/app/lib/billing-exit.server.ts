/**
 * Bulletproof exit from the embedded app iframe to Shopify Admin URLs.
 *
 * Shopify's authenticate.admin redirect() only App Bridge–breakouts when
 * embedded=1 (or session-token data requests). A bare GET → redirect(admin…)
 * becomes an HTTP 302 inside the iframe → "admin.shopify.com refused to connect"
 * (App Store 2.1.1). Always return HTML that calls window.open(_, "_top").
 */

export function billingExitHtmlResponse(input: {
  confirmationUrl: string;
  apiKey: string;
  shopDomain?: string | null;
}): Response {
  const destination = input.confirmationUrl.trim();
  if (!destination) {
    return new Response("Missing plan URL", { status: 400 });
  }

  // Validate Admin host — never open arbitrary URLs from this exit.
  let parsed: URL;
  try {
    parsed = new URL(destination);
  } catch {
    return new Response("Invalid plan URL", { status: 400 });
  }
  if (!/(^|\.)admin\.shopify\.com$/i.test(parsed.hostname)) {
    return new Response("Plan URL must be Shopify Admin", { status: 400 });
  }

  const apiKey = JSON.stringify(input.apiKey);
  const urlJson = JSON.stringify(parsed.toString());
  const shopHandle = (input.shopDomain ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.myshopify\.com$/i, "");

  const headers = new Headers({
    "content-type": "text/html;charset=utf-8",
    "cache-control": "no-store",
  });
  // Allow Shopify Admin to frame this exit page (embedded bounce).
  const ancestors = shopHandle
    ? `https://admin.shopify.com https://${shopHandle}.myshopify.com https://*.myshopify.com`
    : "https://admin.shopify.com https://*.myshopify.com";
  headers.set("content-security-policy", `frame-ancestors ${ancestors};`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="shopify-api-key" content=${apiKey} />
  <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
  <title>Opening Shopify plans…</title>
</head>
<body>
  <p>Opening Shopify plan selection…</p>
  <script>
    (function () {
      var url = ${urlJson};
      try {
        window.open(url, "_top");
      } catch (e) {
        var a = document.createElement("a");
        a.href = url;
        a.target = "_top";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
      }
    })();
  </script>
  <noscript>
    <p><a href=${urlJson} target="_top" rel="noopener noreferrer">Continue to Shopify plans</a></p>
  </noscript>
</body>
</html>`;

  return new Response(html, { status: 200, headers });
}
