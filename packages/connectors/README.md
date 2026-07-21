# @mcfly/connectors — Spend pipes (Phase 2 stubs)

Daily ad spend ingestion for **Meta** and **Google**. v1 uses manual/CSV spend; this package stubs live pipes for the Shopify app worker.

## Human gates (cannot automate in agent sandbox)

| Platform | What a human must do |
| --- | --- |
| **Meta** | Create [Meta Developer](https://developers.facebook.com/) app, Business Manager, Marketing API access, OAuth for ad accounts, **App Review** for `ads_read` (calendar wall-clock, not code) |
| **Google** | GCP project, enable Google Ads API, apply for **developer token** (Basic/Standard), OAuth client + refresh token for merchant MCC/customer |
| **Shopify app** | Store install + encrypted token storage in app DB (sibling `/app` scaffold) |

Until credentials exist, clients default to **`useMock: true`** — deterministic daily spend for dev/tests.

## Usage

```ts
import { syncShopSpend } from "@mcfly/connectors";

const result = await syncShopSpend(
  shopId,
  "2026-07-01",
  "2026-07-07",
  spendRepository,
  { meta: { useMock: true }, google: { useMock: true } },
);
```

Implement `SpendRepository.upsertSpendDays` in the app Postgres layer.

## Not in scope

- Path attribution, pixels, MTA
- SyncWith-style connector catalog
- TikTok / Klaviyo (revenue-pulled later)

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
