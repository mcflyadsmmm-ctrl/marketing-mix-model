# Legacy MER Apps Script — digest (for Mcfly UX)

**Status:** Source available locally (clasp)  
**Script ID:** `1Ws8OibDzYP4HQR8q04TP_PU5zytokIcz6y8eRQuRidzWY9VyzUARINfS`  
**Clone (gitignored):** `vendor/mer-apps-script/` (also `/tmp/mcfly-mer-script2`)  
**Access / refresh steps:** [`APPS_SCRIPT_ACCESS.md`](./APPS_SCRIPT_ACCESS.md)  
**Do not** commit proprietary BCUSA seed data, spreadsheet IDs, or API tokens.

## What it is

Internal Black Clover “MER Dashboard” web app (Apps Script + HTML). Thesis in UI:

> Cash MER · Domo sales ÷ Domo total cost · not platform ROAS

Default target MER rail: **4.0**.

## Architecture (sanitized)

| Piece | Role |
| --- | --- |
| `Code.js` | Server: brand registry, Domo-ready sheet readers, dashboard payload, probes |
| `Index.html` / `JavaScript.html` / `Stylesheet.html` | Client UI: time windows, spend explorer, control panel, ledger, export CSV |
| `MetaAds.js` / `AdsDeep.js` / `Klaviyo*.js` / `Shopify*.js` | Enrichment / caches / seeds — **not** required for Mcfly Truth MVP |
| Seed `*SeedData.js` files | Large proprietary dumps — ignore for Mcfly |

## Cash MER math (what Mcfly must match)

- **Sales** = online sales for the day (from Domo-ready sheet or Shopify override tab)
- **Spend** = `max(Σ channel columns, Total Cost)` when both exist
- **MER** = `sales / spend` when spend > 0
- Channels mapped by header synonyms: Google, Meta/Facebook, Microsoft/Bing, Klaviyo/SMS, Criteo/Adroll → Other
- UI emphasizes **closed days only** (no inventing today’s incomplete spend)

## Daily spine format (critical for Mcfly CSV)

Wide one-row-per-day sheet (Domo READY style):

| Day | Online Sales | Google | Meta | Microsoft | Klaviyo | Total Cost | …
| --- | --- | --- | --- | --- | --- | --- | --- |

Mcfly equivalent:

1. **Sales** come from Shopify Admin API (`read_orders` totals only) — never trust a CSV sales column as SoT
2. **Spend** via CSV upload — accept **both**:
   - Long: `date,channel,amount`
   - Wide: `Day` + Google/Meta/… columns (sales/total columns ignored)

## UX lessons to keep in Mcfly

1. One clear ritual: upload long history of daily spend → see MER vs break-even
2. Spend explorer / channel mix vs MER (glanceable)
3. Target MER rail (settings) + honest “not platform ROAS” copy
4. Period controls (MTD / custom) with server-authoritative “today”
5. Export CSV for operators (optional later)
6. Refuse: pixels, MTA, path credit, Domo connector zoo as launch requirement

## Explicitly out of Mcfly scope (do not port)

- Domo / multi-brand portfolio workbook wiring
- Live Meta/Google/Klaviyo OAuth App Review zoo for free launch
- Customer LTV / Gmail archive seeds
- Asana promo tooling
- Hill-curve “optimal spend” as attribution theater (rules-based allocation from mer-core is enough)

## Mcfly ship status (related)

- CSV daily spend upload lives at `/app/spend` (`app/app/lib/spend-csv.ts`)
- Long + wide formats supported
- Privacy: spend aggregates + shop domain only; GDPR webhooks; no customer CRM

## Human follow-ups

1. Install hosted app on `devmcflyads` → Settings → CSV upload → Dashboard MER
2. Reply `install works` when smoke passes
