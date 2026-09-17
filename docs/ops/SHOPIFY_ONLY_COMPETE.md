# Shopify-only compete — Customers RFM-lite + whale watchlist (chunk #3)

**North star:** best $39 order-history sales desk. LTV is the signature. Full value with **zero spend upload**.

Compete features only if they **strengthen that desk** — not a kitchen-sink dump of every Lifetimely/Peel checkbox.

**Base:** tip of `cursor/spend-trust-recurring` (Fly v358 / Product→LTV #94 + LTV flagship #93).

## IN (this PR)

| Surface | What ships |
| --- | --- |
| RFM-lite | Recency / frequency / monetary terciles from the stored order book. Four segments (Champions / Rising / At risk / Quiet) — not a 5×5 Shopify RFM dump. |
| Whale watchlist | High on-file LTV buyers whose last order is past 30 days. Actionable beside existing What-to-do ActionCards. Opaque keys stay off the desk. |
| Empty | Syncing / thin / young — floor 8 buyers × 30 days. Watchlist has its own first-win when whales are still warm. No blank charts. Not $0. |
| Full history | RFM + watchlist read the full stored book. Year-scale recency withheld when history is limited. Mix / repurchase stay the trailing 90-day read. |

## Skipped on this desk (cool, not stronger)

Live SKU/title crawl (PCD Level 1 — titles stay off OrderFacts). New sales-five tab. 5×5 RFM export, forecast, discount, share, goals.

## OUT (later chunks — do not start here)

Growth win-back · Overview forecast · Discount→LTV · Shareable cards · Goals.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + approved `read_all_orders`. RFM monetary is on-file lifetime from the stored book. Thin shops stay honest empties, never a fake year.
- Product titles: SAMPLE on file; live OrderFacts stay units-only (Level 1). Watchlist never guesses email or SKU.
- NO COGS, ads/pixels, Partner paste, cold push, Amazon, Recharge MRR, TW attribution / MTA / Meta-ROAS hero
- Overview stays order-first
- Spend Upload stays optional after sales-five; no ROAS hero there
- Pricing/claims untouched ($39 after 7-day)
- No feature removals — add RFM-lite + watchlist only. Existing ActionCards (Repurchase / Win-back / Save now) stay.
- Pills (#90), mobile (#92), chart-smooth (#91), densify, ActionCards, LTV flagship (#93), Product→LTV (#94), SAMPLE Snowdevil, sales-five IA stay
