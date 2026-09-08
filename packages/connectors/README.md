# @mcfly/connectors — Meta & Google daily spend clients (backend)

Internal package for **amounts-only** Meta Insights / Google Ads cost pulls used by overnight/mock jobs.

**Merchant product:** Free desk spend SoT is **CSV on `/app/spend`**. There is **no** Connections OAuth UI — [`docs/RETIRED_SURFACES.md`](../../docs/RETIRED_SURFACES.md).

Do **not** claim this package “powers Connections” for merchants.

## Modes

| Mode | When | Behavior |
| --- | --- | --- |
| **MOCK** | `useMock: true` (default) | Deterministic daily fixtures for local/dev/tests / overnight without creds |
| **REAL** | `useMock: false` + env credentials | Live Meta Insights / Google Ads GAQL — **ops/internal only**, not a merchant OAuth product |
| **OUT OF PRODUCT** | Merchant-facing ads OAuth | Retired — CSV + optional merchant-paid SyncWith-class pipes |

## Env (ops only — see `app/.env.example`)

```bash
# Overnight live (requires creds) — not a merchant Connect button
MCFLY_LIVE_META=1
MCFLY_LIVE_GOOGLE=1

META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=

GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`MCFLY_SPEND_OAUTH*` flags are **removed** from the app (no Connections scaffold).

## Religion

- Amounts only — no pixels, MTA, path credit, or “true ROAS”
- Shopify app spend path for merchants = CSV
- Never SyncWith-scale connector zoo inside Mcfly
