# Mcfly Analytics — Shopify App

Embedded Shopify app: **Shopify sales + CSV/manual ad spend → Total ROAS desk**.

> **Human gate:** Shopify Partner login is required to link this app and run `shopify app dev`.

**Retired (not product):** Monday Close lock UI; Meta/Google spend OAuth — see [`docs/RETIRED_SURFACES.md`](../docs/RETIRED_SURFACES.md).

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
| `SCOPES` | `read_orders` (+ minimal `read_customers` for opaque id / order counts) |
| `SHOPIFY_APP_URL` | Public app URL (CLI sets during dev tunnel) |
| `DATABASE_URL` | Prisma DB URL — default `file:./dev.sqlite` for local dev |

Do **not** commit `.env` or secrets.

## What's real vs mocked

| Feature | Status |
| --- | --- |
| Shopify install OAuth + embedded shell | Real (via `@shopify/shopify-app-react-router`) |
| Shopify sales | Real Admin GraphQL / SalesDayFact when installed |
| Ad spend | **CSV / paste / manual** on Spend — Free path |
| Meta / Google spend OAuth | **Retired** — `/app/connections` redirects to Spend |
| Total ROAS / break-even / channel mix | Real — `@mcfly/mer-engine` / `@mcfly/mer-core` |
| SAMPLE desk | Optional practice toggle on Demo (labeled SAMPLE) |

## App routes

| Route | Purpose |
| --- | --- |
| `/app` | Overview — Total ROAS, break-even, Share Overview |
| `/app/spend` | CSV / manual spend + pipe templates |
| `/app/settings` | Margin %, Total ROAS target |
| `/app/allocation` | Spend Allocation |
| `/app/goals` | Goals / pace |
| `/app/ltv` | LTV / Acquisition (Pro-gated live) |
| `/app/close` | **Redirect → Home** (retired Monday Close UI) |
| `/app/connections` | **Redirect → Spend** (retired ads OAuth UI) |

## Data model (Prisma)

- **Shop** — one row per installed store domain
- **SpendEntry** — channel, amount, period range, optional note
- **Settings** — `marginPct`, `targetMer`
- **Session** — Shopify install OAuth sessions (framework requirement)

No attribution tables. No Mcfly-owned ads OAuth tokens.

## MER engine

Shared package at `packages/mer-engine`:

```bash
npm run test --workspace=@mcfly/mer-engine
```

## Production notes

- Postgres (`DATABASE_URL`) on Fly
- Run migrations on deploy
- App URL = hosted HTTPS (never mcflyads.com)
