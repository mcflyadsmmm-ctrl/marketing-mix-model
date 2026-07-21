# Mcfly Analytics — Shopify App

Embedded Shopify app for **Truth MVP**: Shopify sales + manual ad spend → **MER dashboard**.

> **Human gate:** Shopify Partner login is required to link this app to your Partner account and run `shopify app dev`. This scaffold is ready; you must authenticate locally.

## Quick start

From the **repo root**:

```bash
npm install
npm run build --workspace=@mcfly/mer-engine
cd app
cp .env.example .env
npm run setup          # prisma generate + migrate
npm run dev            # shopify app dev — prompts Partner login first time
```

Or from root after install:

```bash
npm run dev            # delegates to app workspace
```

## Environment variables

| Variable | Description |
| --- | --- |
| `SHOPIFY_API_KEY` | App API key (set by Shopify CLI after config link) |
| `SHOPIFY_API_SECRET` | App secret |
| `SCOPES` | `read_orders` for sales totals |
| `SHOPIFY_APP_URL` | Public app URL (CLI sets during dev tunnel) |
| `DATABASE_URL` | Prisma DB URL — default `file:./dev.sqlite` for local dev |

Do **not** commit `.env` or secrets.

## What's real vs mocked

| Feature | Status |
| --- | --- |
| Shopify OAuth + embedded shell | Real (via `@shopify/shopify-app-react-router`) |
| Shopify sales (orders sum) | **Real** Admin GraphQL when installed on a dev store with `read_orders` |
| Sales fallback | Mock data if GraphQL fails (e.g. no linked store) |
| Ad spend | **Manual entry** (Meta / Google / Other) — Truth MVP |
| Meta / Google OAuth | **Stub only** — Connections page placeholder; Phase 2 |
| MER / break-even / channel mix | **Real** — `@mcfly/mer-engine` pure functions |

## App routes

| Route | Purpose |
| --- | --- |
| `/app` | MER dashboard — MTD/QTD/YTD, sales, spend, MER, break-even, channel mix |
| `/app/spend` | Manual spend entry form |
| `/app/settings` | Contribution margin %, target MER |
| `/app/connections` | Placeholder for future Meta/Google OAuth |

## Data model (Prisma)

- **Shop** — one row per installed store domain
- **SpendEntry** — channel, amount, period range, optional note
- **Settings** — `marginPct`, `targetMer`
- **Session** — Shopify OAuth sessions (framework requirement)

No attribution tables.

## MER engine

Shared package at `packages/mer-engine`:

```bash
npm run test --workspace=@mcfly/mer-engine
```

Functions: `computeMer`, `computeBreakEvenMer`, `channelMix`, `sumSpend`.

## Production notes

- Replace SQLite with Postgres (`DATABASE_URL`) before deploy
- Run `npm run setup` on deploy (migrate + generate)
- Meta/Google connectors: stub interfaces in `app/lib/connectors/` — another agent may add `packages/connectors`

## Related docs

- [Master plan](../docs/MASTER_PLAN.md) — locked product directive
- [Shopify React Router template](https://github.com/Shopify/shopify-app-template-react-router)
