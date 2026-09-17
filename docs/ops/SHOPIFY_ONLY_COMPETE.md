# Shopify-only compete — LTV flagship (chunk #1)

**North star:** best $39 order-history sales desk. LTV is the signature. Full value with **zero spend upload**.

Compete features only if they **strengthen that desk** — not a kitchen-sink dump of every Lifetimely/Peel checkbox.

**Base:** tip of `cursor/spend-trust-recurring` (Fly v356 / mobile #92 + chart-smooth #91 + nav pills #90).

## IN (this PR)

| Surface | What ships |
| --- | --- |
| One flagship board | 30 / 90 / 365 come-back + net $ (blended). Honest dashes until a window has matured. |
| The math | `first order + extra orders × later order` on the same board. Year stays — without a year of orders. |
| Refunds | One honesty line on that board. SAMPLE may break out a known gross. Live does **not** invent a refund dollar. |
| Whales / path | Existing recency + journeys, plus lift vs shop, same-product-again, whale vs everyone. |
| Craft | Soft dense Black Clover board. Existing explorers / hover / pills untouched. |

## Skipped on this desk (cool, not stronger)

First-order-month 8-column grid (heat + value-build already cover months). Quiet-180 win-back chip (Growth later). Separate refund / estimate sections.

## OUT (later chunks — do not start here)

Product→LTV · Customers RFM-lite · Growth win-back · Overview forecast · Discount→LTV · Shareable cards · Goals.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + PCD only (~60d Live without `read_all_orders`)
- NO COGS, ads/pixels, Partner paste, cold push, Amazon, Recharge MRR, TW attribution / MTA / Meta-ROAS hero
- Overview stays order-first
- Spend Upload stays optional after sales-five; no ROAS hero there
- Pricing/claims untouched ($39 after 7-day)
- No feature removals of the existing explorers — add / deepen LTV only
