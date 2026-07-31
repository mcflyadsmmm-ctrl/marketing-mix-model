# @mcfly/connectors — Meta & Google daily spend pipes

Daily ad spend ingestion for **Meta** and **Google** — **amounts only** (no pixels, MTA, or path attribution). v1 Free path remains manual/CSV spend in the Shopify app; this package powers Connections + overnight sync.

## Modes

| Mode | When | Behavior |
| --- | --- | --- |
| **MOCK** | `useMock: true` (default) or Connections with `MCFLY_SPEND_OAUTH_MOCK=1` and no live tokens | Deterministic daily fixtures for local/dev/tests |
| **REAL** | `useMock: false` + credentials passed (or overnight `MCFLY_LIVE_META=1` / `MCFLY_LIVE_GOOGLE=1` with env creds) | Live Meta Insights / Google Ads GAQL cost pull |
| **HUMAN_GATE** | Always for production connect | Meta Marketing API **App Review** (`ads_read`), Google Ads **developer token** + OAuth client — calendar/human work; **never claimed done by agents** |

## Human gates (cannot automate in agent sandbox)

| Platform | What a human must do |
| --- | --- |
| **Meta** | Create [Meta Developer](https://developers.facebook.com/) app, Business Manager, Marketing API access, OAuth for ad accounts, **App Review** for `ads_read` |
| **Google** | GCP project, enable Google Ads API, apply for **developer token**, OAuth client (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) + refresh token |
| **Shopify app** | Store install + encrypted token storage in app DB (multi-tenant OAuth table deferred) |

Until credentials exist, clients default to **`useMock: true`**.

## Env (see `app/.env.example`)

```bash
# Connections scaffold
MCFLY_SPEND_OAUTH=1
MCFLY_SPEND_OAUTH_MOCK=1   # mock when live tokens absent

# Overnight live (requires creds)
MCFLY_LIVE_META=1
MCFLY_LIVE_GOOGLE=1

META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=

GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# optional MCC:
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
```

## Usage

```ts
import { syncShopSpend } from "@mcfly/connectors";

// Mock (default)
await syncShopSpend(shopId, from, to, repository, {
  meta: { useMock: true },
  google: { useMock: true },
});

// Live amounts
await syncShopSpend(shopId, from, to, repository, {
  meta: {
    useMock: false,
    accessToken: process.env.META_ACCESS_TOKEN,
    adAccountId: process.env.META_AD_ACCOUNT_ID,
  },
  google: {
    useMock: false,
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  },
});
```

Implement `SpendRepository.upsertSpendDays` in the app Postgres layer (sets `source` to `meta` / `google`).

## Not in scope

- Path attribution, pixels, MTA
- SyncWith-style connector catalog
- TikTok / Klaviyo (revenue-pulled later)
- Claiming App Review complete

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
