# Shopify-only compete — Product→LTV (chunk #2)

**North star:** best $39 order-history sales desk. LTV is the signature. Full value with **zero spend upload**.

Compete features only if they **strengthen that desk** — not a kitchen-sink dump of every Lifetimely/Peel checkbox.

**Base:** tip of `cursor/spend-trust-recurring` (Fly v357 / LTV flagship #93 + mobile #92 + chart-smooth #91 + nav pills #90).

## IN (this PR)

| Surface | What ships |
| --- | --- |
| First-product read | One number after the flagship: which titled first-line item starts the higher 90-day (then 30 / year) path, lift vs shop, typical next. |
| Product cards | Soft dense Black Clover cards for the top first products — 30 / 90 / year when those starters have lived it. Not a catalog dump. |
| The math | Same written-out first + extra × later, scoped to buyers who started with that product. Observed vs estimate. |
| Path driver | Typical next titled product on the card — journeys table below stays the drill. |
| Empty | Titles hidden (live Level 1) / thin / young — floor 8 named starters × 30 days. No blank charts. Not $0. |
| Full history | Year-scale product LTV when `read_all_orders` has matured those starters. Never a fake year. |

## Skipped on this desk (cool, not stronger)

Live SKU/title crawl (PCD Level 1 — titles stay off OrderFacts). New sales-five tab. RFM, win-back, forecast, discount, share, goals.

## OUT (later chunks — do not start here)

Customers RFM-lite · Growth win-back · Overview forecast · Discount→LTV · Shareable cards · Goals.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + approved `read_all_orders`. Live LTV is the full stored book — year / 30/90/365+ are in scope. Thin shops stay honest empties, never a fake year.
- Product titles: SAMPLE on file; live OrderFacts stay units-only (Level 1). First-product LTV is an honest empty until titled line items exist — never guessed SKUs.
- NO COGS, ads/pixels, Partner paste, cold push, Amazon, Recharge MRR, TW attribution / MTA / Meta-ROAS hero
- Overview stays order-first
- Spend Upload stays optional after sales-five; no ROAS hero there
- Pricing/claims untouched ($39 after 7-day)
- No feature removals of the existing explorers or the LTV flagship — add Product→LTV only
- Pills (#90), mobile (#92), chart-smooth (#91), densify, ActionCards, SAMPLE Snowdevil, sales-five IA stay
