# Shopify-only compete — Goals LTV / returning-$ (chunk #8)

**North star:** best $39 order-history sales desk. LTV is the signature. Full value with **zero spend upload**.

Compete features only if they **strengthen that desk** — not a kitchen-sink dump of every Lifetimely/Peel checkbox.

**Base:** tip of `cursor/spend-trust-recurring` after shareables #99 (Promo→LTV #98 + Overview #97 + Growth #96 + Customers #95 + Product→LTV #94 + LTV #93).

## IN (this PR)

| Surface | What ships |
| --- | --- |
| Soft Goals board | Set/track an LTV target and a year returning-$ target from order-history progress. |
| Placement | **Existing `/app/goals`**, above the sales-plan hero. Same two fields in **Settings**. Sales-five IA untouched — no new Shopify-five tab. |
| Empty | Syncing / thin / young / unset — floor 8 paid orders. No blank board. Not $0. |
| SAMPLE | Snowdevil paints stretch targets ($400 first-90 · $800k year returning $) when unset so the canvas is dense. |

## Skipped on this desk (cool, not stronger)

Spend / CPA / ROAS goals. New Goals tab in the Shopify five. Partner/listing paste.

## OUT (later chunks — do not start here)

Spend polish · Partner paste · Live unpark · sync-law · COGS · pixels · TW.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + approved `read_all_orders` + PCD. Thin shops stay honest empties, never a fake year.
- NO spend / CPA / ROAS goals in this PR — order-history only
- Soft dense Black Clover; low cognitive load; pills/mobile/chart-smooth preserved
- NO COGS, ads/pixels, Partner paste, cold push, Amazon, Recharge MRR, TW attribution / MTA / Meta-ROAS hero
- Pricing/claims untouched ($39 after 7-day)
- No feature removals — add LTV + returning-$ targets only
- Pills (#90), mobile (#92), chart-smooth (#91), densify, ActionCards, LTV (#93), Product→LTV (#94), Customers RFM (#95), Growth TT2 (#96), Overview mix (#97), Promo→LTV (#98), shareables (#99), SAMPLE Snowdevil, sales-five IA stay
