# Billing — one plan $39 after 7-day whole-desk trial

**Status:** Start 7-day trial / Manage plan opens Shopify’s hosted plan page.  
**Not** `appSubscriptionCreate` — this Public app is on **Shopify App Pricing** (Managed Pricing), which blocks the Billing API for creating charges.  
**Founder lock (2026-08-26):** One paid plan — **$39/store/mo** flat after a **7-day full-access trial** of the **whole desk**. Not a percent of sales. Not a per-order fee. Shopify bills the app; **uninstall** stops the next 30-day cycle (the current cycle may still charge).  
**Desk modes (not billing):** Sample data | Live data only. Billing is not a desk mode.  
**SoT:** [`STRATEGY.md`](../STRATEGY.md) · [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · launch [`ops/FOUNDER_DO_NOW.md`](./ops/FOUNDER_DO_NOW.md)

## Product (one plan)

| Included on trial and after $39 | Notes |
| --- | --- |
| Whole desk | Overview, Spend, Allocation, LTV, Goals, Advanced, Settings |
| Spend channels | Every named platform + typed extras (billboards, radio, …) |
| Core desk | Shopify sales ÷ that spend, break-even, Allocation |
| LTV | Live opaque cohorts + payback (Sample data uses example cohorts) |
| Goals | This period vs Total ROAS goal + full-year board |
| History | January 1 of (current year − 5) through today — label: *Daily spend by channel, back to January 2021* |

There is **no Free vs Pro feature matrix**. Leftover Partner **Free** plans must be **deleted**.

**Override (no charge):** `MCFLY_PRO_SHOPS=shop1.myshopify.com,...`

## Partner setup (once)

Listing → **Pricing** → Shopify App Pricing:

1. **DELETE** any leftover **Free** plan (required — do not leave Free + paid)
2. **One** paid plan · **$39 USD** · every 30 days · **7-day trial**  
   Plan name: **Mcfly Analytics**

Upgrade URL pattern:  
`https://admin.shopify.com/store/{store}/charges/mcfly-analytics-public/pricing_plans`

**Embed rule (App Store 2.1.1):** Never load that Admin URL inside the app iframe
(`admin.shopify.com refused to connect`). **Start 7-day trial** must exit via App Bridge
`redirect(..., { target: "_top" })` (GET `/app/billing`) or `window.open(url, "_top")`
after the POST action — see `billing-navigate.ts` + `ProUpgradeButton`. Smoke path =
Settings → **Start 7-day trial** → plan picker in the **TOP** Admin frame (not a
feature-gate “Upgrade to Pro for LTV”).

## Flags

| Env | Meaning |
| --- | --- |
| `MCFLY_BILLING=1` | Allow Start 7-day trial / Manage plan → plan page |
| `MCFLY_BILLING_TEST=1` | Dev-store testing note — $0 test charge path when Shopify offers it |
| `SHOPIFY_APP_HANDLE` | Override handle (default `mcfly-analytics-public`) |

## Evidence

- `billing-flag.server.ts` — `PRO_PLAN` name **Mcfly Analytics**, `$39`, `trialDays: 7`
- `billing.server.ts` — `buildManagedPricingPlansUrl` + active-sub sync  
- `billing-navigate.ts` — top-frame-only Admin navigation (no iframe fallback)  
- `Shop.proBillingActive` — cache after sync / webhook  
- Settings → **Start 7-day trial** / Manage plan → top-frame plan picker  
- `entitlements.ts` — whole desk on trial and paid; Sample data | Live data is the view toggle  
