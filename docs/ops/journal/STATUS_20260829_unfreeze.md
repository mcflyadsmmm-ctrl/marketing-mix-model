# Status — 2026-08-29 Fly unfreeze

**Grant:** founder removed the Fly / `app/**` edit ban so the app can pass Shopify App Store approval.

**Cause of live crash:** `GET /app` without a Shopify session returned **410 Gone**. The React Router client then fetched `/app.data` and threw `Unable to decode turbo-stream response`. `/auth/login` bounced to marketing `/` instead of starting OAuth. Static `site/` on Fly could paint `/` inside the Admin iframe.

**Shipped in source (pending Fly deploy):**
- Restore `app/**` + `fly.toml` from `cursor/desk-honesty-first-session-84ce`
- `/auth/login?shop=` calls `login()` (OAuth), not `/app` 410
- Bare `/app` without shop/host/token → 302 `/` (no 410 SPA)
- `.data` paths treated as app routes so marketing HTML cannot win
- Board/rules: **UNFROZEN**

**Human:** Fly is live. Open from Shopify Admin to see the desk. Public `/app` is a 200 host page (not 410).
