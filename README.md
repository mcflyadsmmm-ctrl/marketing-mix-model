# Mcfly Analytics

Anti-attribution marketing cockpit for Shopify: **real ad spend vs Shopify sales (MER)**, then budget allocation — not path attribution theater.

**Domain:** [mcflyads.com](https://mcflyads.com)

## Docs

- **[SHIP NOW](docs/SHIP_NOW.md)** — **do this tonight** (Partner link → first install → host)
- **[Master plan](docs/MASTER_PLAN.md)** — locked product directive
- **[Shopify launch & App Store](docs/SHOPIFY_LAUNCH.md)** — full approval path
- **[Listing capture](docs/LISTING_CAPTURE.md)** — `?listing=1` Partner shots (Overview / Spend / Goals / LTV / Allocation, ~1600×900)
- **[Website readiness](docs/WEBSITE_READINESS.md)** — mcflyads.com
- **[Competitors](docs/COMPETITORS.md)** — SyncWith / TW / Northbeam / Polar

## Product site

Static marketing site in [`/site`](site/) (home, product, pricing, privacy, terms, support). Favicon, OG, sitemap, robots, 404. Live host is **Cloudflare Pages** (`wrangler.toml`: `name = mcflyads`, `pages_build_output_dir = site`). GitHub Pages is not configured — the Actions workflow only documents this and stays green on Pages API 404.

```bash
npx wrangler pages deploy site --project-name=mcflyads --branch=main --commit-dirty=true
```

## Shared packages (`/packages`)

| Package | Purpose |
| --- | --- |
| [`@mcfly/mer-core`](packages/mer-core) | MER math + rules-based allocation |
| [`@mcfly/connectors`](packages/connectors) | Meta/Google spend pipe stubs + daily sync job |
| [`@mcfly/api-contract`](packages/api-contract) | Zod + OpenAPI for `/mer`, `/spend`, `/allocation` |

Sheets companion scaffold: [`/sheets`](sheets/). Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```bash
npm install
npm test          # allocation unit tests (@mcfly/mer-core)
npm run build     # compile all packages
```

## Status

Phase 0 — product marketing site in `/site`. Shared backend in `/packages` + `/sheets`. Site ship = Cloudflare Pages wrangler deploy (not GitHub Pages).

## Optimal path (short)

1. Ship / harden product site  
2. Shopify Truth MVP (sales + manual spend → MER)  
3. Live Meta/Google spend  
4. Allocation card  
5. Sheets companion  

Do **not**: custom MMM consulting as the offer, pixels/MTA, SyncWith clone, or revive discarded niches (see master plan §2).
