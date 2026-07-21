# Mcfly Analytics

Anti-attribution marketing cockpit for Shopify: **real ad spend vs Shopify sales (MER)**, then budget allocation — not path attribution theater.

**Domain:** [mcflyads.com](https://mcflyads.com)

## Docs

- **[Master plan](docs/MASTER_PLAN.md)** — **LOCKED directive**, scope, phases, anti-sway rules, kill criteria

## Product site

Static marketing site in [`/site`](site/) (home, product, pricing, privacy, terms, support). Deploy via GitHub Pages workflow.

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

Phase 0 — product marketing site in `/site`. Shared backend foundations (items 3–5 stubs) in `/packages` + `/sheets`. Shopify app scaffold pending (sibling agent).

## Optimal path (short)

1. Ship / harden product site  
2. Shopify Truth MVP (sales + manual spend → MER)  
3. Live Meta/Google spend  
4. Allocation card  
5. Sheets companion  

Do **not**: custom MMM consulting as the offer, pixels/MTA, SyncWith clone, or revive discarded niches (see master plan §2).
