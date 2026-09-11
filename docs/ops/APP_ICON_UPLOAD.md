# App icon upload (Admin chrome)

The square icon in Shopify Admin (top-left of the embedded app) comes from the **Partner Dashboard**, not Fly.

**Upload file (ready on disk):** `docs/listing-assets/mcfly-app-icon-1200.png` (1200×1200)

**Marty steps:**
1. [dev.shopify.com](https://dev.shopify.com) → Mcfly Analytics app → **Settings** (or Distribution / Branding, depending on Partner UI).
2. Upload `mcfly-app-icon-1200.png`.
3. Save. Hard-refresh Admin (or re-open the app) — CDN can lag a few minutes.

In-app brand mark (`app/public/brand/mcfly-m-64.png`) is separate and already refreshed. Admin chrome will keep showing the old M$ until Partner upload.
