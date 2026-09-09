# Partner listing URLs — Mcfly Analytics

**SoT for Partner App listing URL fields.** Paste / verify before Save. Cursor does **not** Submit.  
**Live listing:** https://apps.shopify.com/mcfly-analytics-public · **Reviews: 0** (do not invent).
**Plan:** **Mcfly Analytics** · $39 · 7-day trial (never Free forever; never plan name Pro as live paste).
**Shots:** Harbor SAMPLE **3.51×** ($82,068 ÷ $23,414) — see [`../LISTING_VISUAL_PACK.md`](../LISTING_VISUAL_PACK.md).  
**Copy SoT:** [`../APP_STORE_LISTING.md`](../APP_STORE_LISTING.md) · Marty pack: [`LISTING_LIVE_PASTE.md`](./LISTING_LIVE_PASTE.md)

## Fields

| Partner field | URL | Rule |
| --- | --- | --- |
| **Website** | https://mcflyads.com | Marketing site (v14+ Pages) |
| **Privacy** | https://mcflyads.com/privacy | Trust page on site — not Fly |
| **Support** | https://mcflyads.com/support | Trust page on site — not Fly |
| **FAQ** | https://mcflyads.com/faq | If Partner exposes FAQ / help |
| **Terms** | https://mcflyads.com/terms | Trust page on site — not Fly |
| **App URL** | https://mcfly-analytics.fly.dev | **Fly only.** Never App URL = mcflyads.com |

Prefer **extensionless** canonicals (`.html` 308s to the same pages).

## Spot-check (before Save / Submit)

```bash
curl -sI https://mcflyads.com | head -1
curl -sI https://mcflyads.com/privacy | head -1
curl -sI https://mcflyads.com/support | head -1
curl -sI https://mcflyads.com/faq | head -1
curl -sI https://mcflyads.com/terms | head -1
curl -sI https://mcfly-analytics.fly.dev/health | head -1
```

Expect **200** (or 301/308 then 200) on site trust pages. App health on Fly.

## Bans

- App URL = `https://mcflyads.com` (or any marketing-only host)
- Privacy / Support / Terms pointing at example.com or stale Fly-as-canonical when site is live
- Inventing a second App Store URL (only `mcfly-analytics-public`)
- Inventing review or install counts
