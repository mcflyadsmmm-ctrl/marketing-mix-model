# Shopify-only compete — Growth days-to-second + win-back clock (chunk #4)

**North star:** best $39 order-history sales desk. LTV is the signature. Full value with **zero spend upload**.

Compete features only if they **strengthen that desk** — not a kitchen-sink dump of every Lifetimely/Peel checkbox.

**Base:** tip of `cursor/spend-trust-recurring` (Fly v359 / Customers RFM #95 + Product→LTV #94 + LTV flagship #93).

## IN (this PR)

| Surface | What ships |
| --- | --- |
| Days-to-second (TT2) | Fast / typical / slow wait from first→second gaps on the stored book. Habit span = slow minus fast. Cadence histogram. Weekends stay where they already live (Overview / Orders) — not added here. |
| Win-back clock | Fall-off buckets: one-order buyers by days since first. Win-back day = typical + 15. Reach-now = already past that day. |
| Empty | Syncing / thin / young — floor 8 buyers × 30 days. Clock empty when second orders are missing. Fall-off empty when everyone already came back. No blank charts. Not $0. |
| Full history | TT2 + win-back read the full stored book. Year-scale fall-off withheld when history is limited. Come-back explorer stays the trailing 90-day read. |

## Skipped on this desk (cool, not stronger)

New sales-five tab. Weekend mix on Growth (already on Overview / Orders). Customers ActionCard rewrite. Forecast, discount, share, goals.

## OUT (later chunks — do not start here)

Overview forecast · Discount→LTV · Shareable cards · Goals · Spend.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + approved `read_all_orders`. Thin shops stay honest empties, never a fake year.
- Product titles: SAMPLE on file; live OrderFacts stay units-only (Level 1). Growth never guesses email or SKU.
- NO COGS, ads/pixels, Partner paste, cold push, Amazon, Recharge MRR, TW attribution / MTA / Meta-ROAS hero
- Overview stays order-first
- Spend Upload stays optional after sales-five; no ROAS hero there
- Pricing/claims untouched ($39 after 7-day)
- No feature removals — add TT2 + win-back only. Existing explorer, scoreboard, and Customers ActionCards stay.
- Pills (#90), mobile (#92), chart-smooth (#91), densify, ActionCards, LTV flagship (#93), Product→LTV (#94), Customers RFM (#95), SAMPLE Snowdevil, sales-five IA stay
