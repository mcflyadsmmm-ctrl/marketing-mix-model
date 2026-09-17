# Shopify-only compete — Overview mix + month-close peek (chunk #5)

**North star:** best $39 order-history sales desk. LTV is the signature. Full value with **zero spend upload**.

Compete features only if they **strengthen that desk** — not a kitchen-sink dump of every Lifetimely/Peel checkbox.

**Base:** tip of `cursor/spend-trust-recurring` (Fly v360 / Growth #96 + Customers #95 + Product→LTV #94 + LTV #93).

## IN (this PR)

| Surface | What ships |
| --- | --- |
| New vs returning $ mix | Window dollars, not Shopify’s returning-customer rate. Returning $ + new $ labeled. Glance peek stays; this board makes the split habit-worthy. |
| Order-based month close | Written out: so far + remaining days × typical day. Typical day = median of stored days with sales. No spend inputs. No black box. |
| Empty | Syncing / thin / young — floor 8 orders, then 8 days with sales. Forecast empty when typical day is missing. No blank charts. Not $0. |
| Full history | Typical day reads the stored book. Year-of-pace withheld when history is limited (`read_all_orders` fills the longer book). |

## Skipped on this desk (cool, not stronger)

New sales-five tab. Spend / ROAS / upload on Overview. Discount, Share, Goals. Customers / Growth / LTV rewrites.

## OUT (later chunks — do not start here)

Discount→LTV · Shareable cards · Goals · Spend polish.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + approved `read_all_orders`. Thin shops stay honest empties, never a fake year of pace.
- NO spend / ROAS / upload / Edit-spend hero on Overview — order-history only
- Keep typical order / weekends / existing explorers
- Soft dense Black Clover; low cognitive load; pills/mobile/chart-smooth preserved
- NO COGS, ads/pixels, Partner paste, cold push, Amazon, Recharge MRR, TW attribution / MTA / Meta-ROAS hero
- Pricing/claims untouched ($39 after 7-day)
- No feature removals — add mix + month close only
- Pills (#90), mobile (#92), chart-smooth (#91), densify, ActionCards, LTV (#93), Product→LTV (#94), Customers RFM (#95), Growth TT2 (#96), SAMPLE Snowdevil, sales-five IA stay
