# Mcfly Analytics — Enterprise ship checklist

Goal: charge serious money without becoming Triple Whale. Cash MER + allocation + trust + sales motion.

**Agent OS:** [`MASTER_DIRECTIVE.md`](./MASTER_DIRECTIVE.md) — DoD D0–D3, ship/overnight loops, P0 backlog.  
**Rule:** Flip a box only when verified with evidence (command output, URL, screenshot). Never flip on vibes.

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
- [x] CSV daily spend upload (`/app/spend`) — multi-platform template (Day, Meta, Google, Microsoft, TikTok, Affiliate, Email) + long format; SyncWith external tip. Evidence 2026-07-23: `bash scripts/agent-ship-gate.sh` → exit 0 (unit+typecheck+build+health); `fly deploy` image `deployment-01KY6KGZ…` released; `curl https://mcfly-analytics.fly.dev/health` → `{"ok":true,"db":"up"}` @04:27Z
- [x] Named spend channels in DB + dashboard mix (hide $0 channels) — evidence 2026-07-23: migration `20260723043000_spend_channels_named` applied on Fly Postgres boot ("The following migration(s) have been applied"); `SpendChannel` enum = meta/google/microsoft/tiktok/affiliate/email/other in schema + `@mcfly/mer-engine`; dashboard `channelMix` filters `amount > 0`; typecheck clean after `prisma generate`
- [x] Connections stubs
- [x] Sample warehouse + seed script
- [x] GDPR compliance webhook + uninstall data cleanup
- [x] App Store 2.3.1 — no shop-domain install form
- [x] No silent mock sales in production loaders
- [x] Prisma migration for Shop / Settings / SpendEntry
- [x] Shopify Partner app linked (`client_id`) — evidence: `shopify.app.toml` client_id `88c56d21…` + `shopify app deploy --allow-updates` released `mcfly-analytics-7` ("AppStore dist + AOV + URL lock", 2026-07-23; supersedes `-6`)
- [x] Hosted HTTPS app URL (Fly) — evidence 2026-07-23: `curl https://mcfly-analytics.fly.dev/health` → `{"ok":true,"db":"up"}`; Fly deploy `deployment-01KY6MSPNZ19KVCMVWYBR12DEA`
- [ ] Dev / design-partner store install — **human** (hosted install on `devmcflyads`, no `shopify app dev`)
- [x] Postgres schema + migration (production-ready)
- [x] `/health` route + Docker/Railway/Fly configs
- [ ] `npm run seed` against real `DATABASE_URL`
- [x] AppDistribution.AppStore + toml URL lock (`automatically_update_urls_on_dev = false`) — evidence: code + `mcfly-analytics-7`
- [ ] Partner Dashboard Distribution → Shopify App Store — **human**
- [ ] PCD questionnaire for `read_orders` + minimal `read_customers` (opaque id + `numberOfOrders` only) — **human** (answers in `docs/APP_STORE_LISTING.md` §PCD)
- [ ] App Store listing submit — **human** (draft Free-only in `docs/APP_STORE_LISTING.md`; runbook `docs/SUBMIT_TOMORROW.md`)

## C. Reliability (required before big ASP)

- [x] `/v1` MER API (`/mer`, `/spend`, `/allocation`)
- [x] Overnight worker + `SyncRun` / `MerSnapshot` tables
- [x] GitHub Actions nightly orchestrator (`.github/workflows/overnight.yml`)
- [x] Enterprise Sheets orchestrator (hourly triggers, recon, alerts)
- [ ] Live Meta spend sync (mock + recon loop shipped; live OAuth human-gated)
- [ ] Live Google spend sync OR Ads Script path
- [ ] Freshness badges + failed-sync alerts
- [x] Postgres in production (not SQLite)
- [ ] Sentry / error monitoring
- [x] Daily job worker for spend sync (`npm run overnight`)

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
