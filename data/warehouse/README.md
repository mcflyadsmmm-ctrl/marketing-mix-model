# Mcfly Analytics — Sample Ecommerce Warehouse

Deterministic **cash MER** demo data for Mcfly Analytics. Sales come from Shopify-like daily totals; ad spend is channel cash outlay only (`meta` | `google` | `other`). There are **no path, click, or multi-touch attribution fields**.

MER is always:

```text
MER = net_sales ÷ ad_spend   (same calendar period)
break_even_mer ≈ 1 ÷ margin_pct
```

## Layout

```text
data/
  scripts/generate-warehouse.mjs   # regenerate everything (seeded RNG)
  warehouse/
    README.md                      # this file
    demo-dtc/                      # primary DTC brand (90 days)
    demo-agency/                   # lighter second brand (30 days)
site/
  sample/mer-feed.json             # marketing-site MTD feed (demo-dtc)
  data/mer-feed.json               # mirror for /data/ hosts
```

## Brands

| Folder | Shop | Domain | History | Margin | Target MER |
| --- | --- | --- | --- | --- | --- |
| `demo-dtc/` | Northline Supply | `northline-supply.myshopify.com` | 90 days | 35% | 3.5 |
| `demo-agency/` | Harbor Home Co | `harbor-home-co.myshopify.com` | 30 days | 40% | 3.0 |

## Schema

### `shops.json`

One Shopify-like shop per brand.

| Field | Type | Notes |
| --- | --- | --- |
| `shop_id` | string | Stable demo id |
| `domain` | string | `*.myshopify.com` |
| `name` | string | Display name |
| `currency` | string | `USD` |
| `margin_pct` | number | Contribution margin decimal (e.g. `0.35`) |
| `target_mer` | number | Operating goal above break-even |
| `as_of` | date | Warehouse as-of date (`YYYY-MM-DD`) |

### `daily_sales.csv`

One row per shop per day.

| Column | Type | Notes |
| --- | --- | --- |
| `date` | date | UTC calendar day |
| `shop_id` | string | FK → shops |
| `orders` | int | Order count |
| `gross_sales` | number | Pre-refund gross |
| `refunds` | number | Cash refunds (~3–8% of gross) |
| `net_sales` | number | `gross_sales − refunds` (MER numerator) |

### `daily_spend.csv`

One row per shop / day / channel. Cash media spend only.

| Column | Type | Notes |
| --- | --- | --- |
| `date` | date | UTC calendar day |
| `shop_id` | string | FK → shops |
| `channel` | enum | `meta` \| `google` \| `other` |
| `spend` | number | USD cash outlay |

Patterns: Meta-heavy mix, weekend dips on sales and spend, daily MER typically **2.5–4.5×**.

### `mer_daily.json`

Precomputed daily rollups (net sales + total spend + MER + channel spend object). Same grain as joining `daily_sales` ⟕ sum(`daily_spend`).

### `period_snapshots.json`

Aggregates matching the app dashboard period presets:

| Key | Window |
| --- | --- |
| `mtd` | Month-to-date through `as_of` |
| `qtd` | Quarter-to-date through `as_of` |
| `ytd` | Year-to-date through `as_of` (clamped to available history) |

Each snapshot includes: `orders`, `gross_sales`, `refunds`, `net_sales`, `spend`, `mer`, `break_even_mer`, `target_mer`, `margin_pct`, `above_break_even`, `channels`, `channel_mix`.

## Daily refresh

1. Optionally bump `AS_OF` in `data/scripts/generate-warehouse.mjs` (default demo date is fixed for stable screenshots).
2. Re-run:

```bash
node data/scripts/generate-warehouse.mjs
```

The script uses a **seeded PRNG** (`SEED`), so the same `AS_OF` + seed always regenerates identical CSVs/JSON. Bumping `AS_OF` shifts the window and redraws deterministic series for the new end date.

Outputs overwritten in place:

- `warehouse/demo-dtc/*`
- `warehouse/demo-agency/*`
- `site/sample/mer-feed.json`
- `site/data/mer-feed.json`

## Site feed

`site/sample/mer-feed.json` (and the `site/data/` mirror) expose the **current MTD** cash snapshot for marketing demos:

```json
{
  "period": "mtd",
  "spend": …,
  "sales": …,
  "mer": …,
  "break_even": …,
  "channels": { "meta": …, "google": …, "other": … }
}
```

Fetch example: `/sample/mer-feed.json` or `/data/mer-feed.json` from the static site root.

## What this is not

- Not live Shopify / Meta / Google API data
- Not multi-touch or platform ROAS attribution
- Not production ETL — sample warehouse for demos and local UI wiring
