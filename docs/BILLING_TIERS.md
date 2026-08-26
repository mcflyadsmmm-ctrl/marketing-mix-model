# Billing tiers — Free + Pro $39 (Shopify App Pricing)

**Status:** Upgrade opens Shopify’s hosted plan page (Free / Pro $39).  
**Not** `appSubscriptionCreate` — this Public app is on **Shopify App Pricing** (Managed Pricing), which blocks the Billing API for creating charges.  
**Founder lock:** Pro **$39/store/mo** flat. Not a percent of sales. Not a per-order fee. Shopify bills the app; switch to Free or uninstall to stop the **next** 30-day cycle (the current cycle may still charge).  
**SoT:** [`STRATEGY.md`](../STRATEGY.md) · [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · launch [`ops/FOUNDER_DO_NOW.md`](./ops/FOUNDER_DO_NOW.md)

## Product matrix

| | **Free** | **Pro ($39 flat / store / mo)** |
| --- | --- | --- |
| Spend channels | **Every** named platform + typed extras (billboards, radio, …) | Same — channels are not a Pro gate |
| Core desk | Shopify sales ÷ that spend, break-even, Allocation | Same |
| LTV | Teaser / Practice preview | Live opaque cohorts + payback |
| Goals | This period vs Total ROAS goal | Full-year board + YoY |

**Override (no charge):** `MCFLY_PRO_SHOPS=shop1.myshopify.com,...`

## Partner setup (once)

Listing → **Pricing** → Shopify App Pricing:

1. **Free** plan (default)
2. **Pro** plan · **$39 USD** · every 30 days  
   Name the plan **Pro** (or “Mcfly Analytics Pro”)

Upgrade URL pattern:  
`https://admin.shopify.com/store/{store}/charges/mcfly-analytics-public/pricing_plans`

**Embed rule (App Store 2.1.1):** Never load that Admin URL inside the app iframe
(`admin.shopify.com refused to connect`). Upgrade must exit via App Bridge
`redirect(..., { target: "_top" })` (GET `/app/billing`) or `window.open(url, "_top")`
after the POST action — see `billing-navigate.ts` + `ProUpgradeButton`.

## Flags

| Env | Meaning |
| --- | --- |
| `MCFLY_BILLING=1` | Allow Upgrade → plan page |
| `SHOPIFY_APP_HANDLE` | Override handle (default `mcfly-analytics-public`) |

## Evidence

- `billing.server.ts` — `buildManagedPricingPlansUrl` + active-sub sync  
- `billing-navigate.ts` — top-frame-only Admin navigation (no iframe fallback)  
- `Shop.proBillingActive` — cache after sync / webhook  
- Settings / Spend upsell → top-frame plan picker  
- `entitlements.ts` — Free = all `SPEND_CHANNELS`; Pro = LTV + full Goals  
