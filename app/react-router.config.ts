import type { Config } from "@react-router/dev/config";

/**
 * React Router 7.12+ rejects UI-route POSTs when `Origin` ≠ `request.url` host.
 * Shopify Admin embeds this app in an iframe whose Origin is often
 * `admin.shopify.com`, and Fly terminates TLS in front of Express.
 * Resource routes (no default export) skip this check; UI routes do not.
 */
export default {
  ssr: true,
  allowedActionOrigins: [
    "admin.shopify.com",
    "*.myshopify.com",
    "mcfly-analytics.fly.dev",
  ],
} satisfies Config;
