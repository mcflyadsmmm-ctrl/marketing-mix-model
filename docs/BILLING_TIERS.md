# Billing — one $39 desk (7-day trial)

**Status:** Listing sells **one plan**: 7-day trial, then **$39/store/mo** flat.  
**Not** a Free App Store plan. **Not** `appSubscriptionCreate` — this Public app is on **Shopify App Pricing** (Managed Pricing).  
**Founder lock:** **$39/store/mo** flat. Trial + paid = the **full desk**.  
**SoT:** [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · listing [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)

## Product matrix

| | **$39 desk (trial included)** |
| --- | --- |
| Spend channels | All named platforms (Meta, Google, TikTok CSV, Microsoft, Amazon, …) |
| Core desk | Total Sales ÷ spend you added, break-even, Allocation |
| LTV | Live opaque cohorts (`read_all_orders` is in scopes) |
| Goals | Full-year board + YoY + pace |
| SAMPLE | Preview data only — not a feature unlock |

**Override (no charge):** `MCFLY_PRO_SHOPS=shop1.myshopify.com,...`

Unpaid / first session must **not** wall TikTok, LTV, or Goals behind `proBillingActive`. Shopify Billing collects after trial; the desk stays complete.

## Partner setup (once)

Listing → **Pricing** → Shopify App Pricing:

1. **One paid plan** · **$39 USD** · every 30 days · **7-day trial**  
   Do **not** invent a Free App Store plan.

Upgrade URL pattern:  
`https://admin.shopify.com/store/{store}/charges/mcfly-analytics-public/pricing_plans`

## Flags

| Env | Meaning |
| --- | --- |
| `MCFLY_BILLING=1` | Allow Settings → Shopify plan page |
| `SHOPIFY_APP_HANDLE` | Override handle (default `mcfly-analytics-public`) |

## Evidence

- `billing.server.ts` — `buildManagedPricingPlansUrl` + active-sub sync  
- `Shop.proBillingActive` — cache after sync / webhook (billing status, not a feature wall)  
- Settings copy: trial + $39 = full desk; SAMPLE labeled preview only  
