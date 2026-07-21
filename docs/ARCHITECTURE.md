# Mcfly Analytics — Architecture (shared foundations)

**One brain.** Shopify embedded app, daily workers, and Google Sheets companion all call the same MER API and share packages under `/workspace/packages/`. The marketing site in `/site` does **not** compute production MER.

## Packages

| Package | Path | Role |
| --- | --- | --- |
| `@mcfly/mer-core` | `packages/mer-core` | Cash MER math + rules-based `suggestAllocation()` (no MTA) |
| `@mcfly/connectors` | `packages/connectors` | Meta/Google spend client interfaces + `syncShopSpend()` stub |
| `@mcfly/api-contract` | `packages/api-contract` | Zod schemas + OpenAPI for `/mer`, `/spend`, `/allocation` |

## Clients (thin)

```text
┌─────────────┐     ┌─────────────┐
│ Shopify app │     │ Sheets add-on│
│  (/app)     │     │  (/sheets)   │
└──────┬──────┘     └──────┬───────┘
       │                   │
       └─────────┬─────────┘
                 ▼
         Mcfly API (future)
    uses mer-core + api-contract
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  Shopify Admin      Spend repository
  (sales in)         (manual + Meta/Google sync)
```

### Shopify app (sibling agent)

- Embedded Polaris UI, OAuth, Postgres
- Imports `@mcfly/mer-core`, `@mcfly/api-contract`, `@mcfly/connectors`
- Implements `SpendRepository` and HTTP handlers validated against Zod schemas

### Sheets companion (`/sheets`)

- Apps Script menu → `GET /mer` → writes template row
- Same break-even MER and allocation copy as the app
- Design-partner deploy via copy/paste; Marketplace listing optional

## MER religion (locked)

```text
MER = Total Shopify sales (period) ÷ Total ad spend (same period)
Break-even MER ≈ 1 / contribution margin
```

Allocation uses **cash spend vs total sales** and optional manual `salesContribution` per channel — never path attribution, pixels, or MTA.

## Connector stubs (Phase 2)

- `MockMetaSpendClient` / `MockGoogleSpendClient` — deterministic daily spend for dev
- `syncShopSpend(shopId, from, to, repository)` — orchestration ready for cron worker
- Live OAuth clients throw until humans complete Developer app setup (see `packages/connectors/README.md`)

## Tests

Allocation unit tests live in `packages/mer-core/tests/allocation.test.ts`.

```bash
npm install
npm test
```

## Human-only gates

| Gate | Owner |
| --- | --- |
| Shopify Partner app + store install | Founder |
| Meta Developer app + Marketing API App Review | Founder |
| Google Ads API developer token + OAuth | Founder |
| Postgres + API host (Railway/Render/Fly) | Founder |
| DNS / production API URL | Founder |
| Sheets Marketplace publish | Later; not blocking design partners |

## Related docs

- [MASTER_PLAN.md](./MASTER_PLAN.md) — product directive and phase order
- [packages/connectors/README.md](../packages/connectors/README.md) — spend pipe human gates
