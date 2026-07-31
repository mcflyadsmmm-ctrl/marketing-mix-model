# Billing tiers — Free + Pro $39 (Shopify App Pricing)

**Status:** Upgrade opens Shopify’s hosted plan page (Free / Pro $39).  
**Not** `appSubscriptionCreate` — this Public app is on **Shopify App Pricing** (Managed Pricing), which blocks the Billing API for creating charges.  
**Founder lock:** Pro **$39/store/mo** flat.  
**SoT:** [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · launch [`ops/FOUNDER_DO_NOW.md`](./ops/FOUNDER_DO_NOW.md)

## Product matrix

| | **Free** | **Pro ($39 flat / store / mo)** |
| --- | --- | --- |
| Spend channels | Meta + Google + custom Other (CSV) | All named platforms |
| Core desk | Total Sales ÷ spend, break-even, Allocation | Same + richer mix |
| LTV | Teaser / SAMPLE | Live opaque cohorts |
| Goals | Pace + Share Overview | Full-year board + YoY |

**Override (no charge):** `MCFLY_PRO_SHOPS=shop1.myshopify.com,...`

## Partner setup (once)

Listing → **Pricing** → Shopify App Pricing:

1. **Free** plan (default)
2. **Pro** plan · **$39 USD** · every 30 days  
   Name the plan **Pro** (or “Mcfly Analytics Pro”)

Upgrade URL pattern:  
`https://admin.shopify.com/store/{store}/charges/mcfly-analytics-public/pricing_plans`

## Flags

| Env | Meaning |
| --- | --- |
| `MCFLY_BILLING=1` | Allow Upgrade → plan page |
| `SHOPIFY_APP_HANDLE` | Override handle (default `mcfly-analytics-public`) |

## Evidence

- `billing.server.ts` — `buildManagedPricingPlansUrl` + active-sub sync  
- `Shop.proBillingActive` — cache after sync / webhook  
- Settings / upsell → top-frame plan picker  
