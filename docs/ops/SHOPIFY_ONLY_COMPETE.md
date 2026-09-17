# Shopify-only compete — Promo / discount → LTV (chunk #6)

**North star:** best $39 order-history sales desk. LTV is the signature. Full value with **zero spend upload**.

Compete features only if they **strengthen that desk** — not a kitchen-sink dump of every Lifetimely/Peel checkbox.

**Base:** tip of `cursor/spend-trust-recurring` (Fly v361 / Overview #97 + Growth #96 + Customers #95 + Product→LTV #94 + LTV #93).

## IN (this PR)

| Surface | What ships |
| --- | --- |
| Promo → LTV | First-order discount $ / real codes → observed 30/90/365 + lift vs full-price first. Named codes only when they are on the order. |
| Formula | Same written-out first + extra × later among those promo starters. Observed vs estimate. |
| Empty | Syncing / discounts / thin / young — floor 8 promo-first buyers × 30 days. Names what’s needed for titles/codes. No blank charts. Not $0. |
| Placement | **LTV tab, after Product→LTV, before spend-build explorers.** Sales-five IA untouched. |

## Skipped on this desk (cool, not stronger)

New Discount tab. Invented codes from discount $. Recrawl / schema for Shopify discountApplications. Share, Goals, Spend polish.

## OUT (later chunks — do not start here)

Shareable cards · Goals · Spend polish · COGS · pixels · TW.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + approved `read_all_orders` + PCD. Thin shops stay honest empties, never a fake year.
- Live OrderFacts store `discountAmount` only — Promo first vs Full price first. Codes are not stored; we never invent them.
- NO spend / ROAS / upload / Edit-spend hero on Overview — order-history only
- Soft dense Black Clover; low cognitive load; pills/mobile/chart-smooth preserved
- NO COGS, ads/pixels, Partner paste, cold push, Amazon, Recharge MRR, TW attribution / MTA / Meta-ROAS hero
- Pricing/claims untouched ($39 after 7-day)
- No feature removals — add Promo→LTV only
- Pills (#90), mobile (#92), chart-smooth (#91), densify, ActionCards, LTV (#93), Product→LTV (#94), Customers RFM (#95), Growth TT2 (#96), Overview mix (#97), SAMPLE Snowdevil, sales-five IA stay
