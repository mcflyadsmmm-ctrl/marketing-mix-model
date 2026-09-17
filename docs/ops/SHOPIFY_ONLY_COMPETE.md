# Shopify-only compete — LTV flagship (chunk #1)

**Base:** tip of `cursor/spend-trust-recurring` (Fly v356 / mobile #92 + chart-smooth #91 + nav pills #90).  
**This wave:** LTV tab only. Order-history LTV that feels worth $39 with **zero spend upload**.

Lifetimely / Peel Shopify-half analog: 30/90/365 come-back + revenue, whale recency, path LTV, a **written-out** first-year estimate, refund honesty. Not a black-box model. Not COGS P&L.

## IN (this PR)

| Surface | What ships |
| --- | --- |
| 30 / 90 / 365 windows | Come-back share + net $ per buyer, blended and by first-order month. Honest dashes until a window has matured. |
| Whales / path | Existing recency + journeys, plus lift vs shop, same-product-again, whale vs everyone, quiet 180+ days. |
| Predictive LTV | `first order + extra orders × later order` among buyers who have lived the window. Formula on the card. Year stays — without a year of orders. |
| Refunds | Net of refunds. SAMPLE may break out a known gross haircut. Live uses Shopify current total and does **not** invent a refund dollar. |
| Craft | Soft dense cards. Existing LTV explorers / hover / pills untouched. |

## OUT (later chunks — do not start here)

Product→LTV · Customers RFM-lite · Growth win-back · Overview forecast · Discount→LTV · Shareable cards · Goals.

## Hard locks

- SAMPLE Snowdevil craft canvas; Live pulls parked
- Scopes: `read_orders` + `read_customers` + PCD only (~60d Live without `read_all_orders`)
- NO COGS, ad OAuth, pixels, Amazon, Recharge MRR, TW attribution / path credit / MTA / Meta-ROAS hero
- Overview stays order-first
- Spend Upload stays optional after sales-five; no ROAS hero there
- Pricing/claims untouched ($39 after 7-day)
- No feature removals — add / deepen LTV only
