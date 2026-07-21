# Mcfly Analytics — Enterprise ship checklist

Goal: charge serious money without becoming Triple Whale. Cash MER + allocation + trust + sales motion.

## A. Marketing site (ship now)

- [x] Product homepage with anti-attribution thesis
- [x] Interactive demos (claims vs cash, break-even, allocation)
- [x] Product / pricing / privacy / terms / support
- [x] App feature map page
- [x] Downloadable PWA calculator (services + demos)
- [x] Sample warehouse feed wired into hero
- [x] GitHub Pages workflow
- [ ] Enable GitHub Pages (repo Settings → Actions) — **human**
- [ ] Point `mcflyads.com` DNS — **human**

## B. Product Truth MVP (ship to design partner)

- [x] Embedded Shopify app scaffold (React Router)
- [x] Dashboard: sales, spend, MER, break-even, mix
- [x] Allocation card + detail (mer-core)
- [x] Manual spend + settings
- [x] Connections stubs
- [x] Sample warehouse + seed script
- [x] GDPR compliance webhook + uninstall data cleanup
- [x] App Store 2.3.1 — no shop-domain install form
- [x] No silent mock sales in production loaders
- [x] Prisma migration for Shop / Settings / SpendEntry
- [ ] Shopify Partner app linked (`client_id`) — **human** → start with [SHIP_NOW.md](./SHIP_NOW.md)
- [ ] Hosted HTTPS app URL (Railway/Fly) — **human**
- [ ] Dev / design-partner store install — **human**
- [x] Postgres schema + migration (production-ready)
- [x] `/health` route + Docker/Railway/Fly configs
- [ ] `npm run seed` against real `DATABASE_URL`

## C. Reliability (required before big ASP)

- [x] `/v1` MER API (`/mer`, `/spend`, `/allocation`)
- [x] Overnight worker + `SyncRun` / `MerSnapshot` tables
- [x] GitHub Actions nightly orchestrator (`.github/workflows/overnight.yml`)
- [x] Enterprise Sheets orchestrator (hourly triggers, recon, alerts)
- [ ] Live Google spend sync OR Ads Script path
- [ ] Freshness badges + failed-sync alerts
- [ ] Postgres in production (not SQLite)
- [ ] Sentry / error monitoring
- [ ] Daily job worker for spend sync

## D. Enterprise packaging (when buyers ask)

- [ ] Shopify Billing + trial
- [ ] App Store listing (anti-attribution copy)
- [ ] DPA + hardened privacy/terms
- [ ] Multi-store portfolio
- [ ] Roles / seats
- [ ] SSO (SAML) — later
- [ ] Uptime SLA + support email on domain
- [ ] 3–5 case studies (anonymized MER decisions)

## E. Explicit non-goals (do not block ship)

- Pixels / MTA / path credit
- SyncWith connector zoo
- TW feature parity
- Custom MMM consulting as core SKU

## Human gates only you can flip

| Gate | Why |
| --- | --- |
| GitHub Pages enable | API token lacks admin |
| Cloudflare DNS → Pages | Domain ownership |
| Shopify Partner login | App credentials |
| Meta / Google developer apps | OAuth + review |
| Design-partner store access | Real data |

## Command cheat sheet

```bash
# regenerate sample warehouse
node data/scripts/generate-warehouse.mjs

# mer packages
npm test

# seed demo shop (needs app/.env DATABASE_URL)
npm run seed

# marketing site locally
python3 -m http.server 8765 --directory site
```
