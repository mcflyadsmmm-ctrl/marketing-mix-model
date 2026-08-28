# Billing — one paid plan, $39 after a 7-day trial (Shopify App Pricing)

**Founder lock (2026-08-26):** **one** plan. **7-day full-access trial, then $39/store/mo** for the whole desk. Flat — not a percent of sales, not a per-order fee. Shopify bills the app; **uninstall** in Admin stops the **next** 30-day cycle (the current cycle may still charge).

**Status:** Start 7-day trial opens Shopify's hosted plan page.
**Not** `appSubscriptionCreate` — this Public app is on **Shopify App Pricing** (Managed Pricing), which blocks the Billing API for creating charges.

**SoT:** [`STRATEGY.md`](../STRATEGY.md) · [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · launch [`ops/FOUNDER_DO_NOW.md`](./ops/FOUNDER_DO_NOW.md)

## There is no feature matrix

Billing is not a desk mode and **nothing is feature-gated**. Trial and paid both get Spend, Overview, Spend Allocation, Customer LTV, Goals, Advanced, and Settings, with every named platform plus typed extras (billboards, radio, retainers, …).

The only two desk views are **Sample data | Live data**.

Do **not** reintroduce a Free tier or a Pro gate in the app. `entitlements.server.ts` allows every channel and every surface on every plan; `desk-claims-guard.test.ts` fails the build if plan-gate vocabulary returns.

**Override (no charge):** `MCFLY_PRO_SHOPS=shop1.myshopify.com,...` — design partners / QA.

## Partner setup (once) — HUMAN, cannot be done from git

Managed Pricing plans live **only** in the Partner Dashboard. No `[[app.billing]]` block exists in `shopify.app.toml`, so nothing in this repo can change them.

Listing → **Pricing** → Shopify App Pricing:

1. **One** plan · **$39 USD** · every 30 days · **7-day free trial**
2. **Remove the Free plan.** A Free plan alongside the paid plan contradicts the
   app, the listing, and the testing instructions, all of which say one plan and
   no feature gate. As of the 2026-08-26 Admin smoke the live managed-pricing
   page still showed **Free + Pro $39** — that is the open item.

Plan picker URL pattern:
`https://admin.shopify.com/store/{store}/charges/mcfly-analytics-public/pricing_plans`

**Embed rule (App Store 2.1.1):** Never load that Admin URL inside the app iframe
(`admin.shopify.com refused to connect`). The plan picker must exit via App Bridge
`open(url, "_top")` or a `target="_top"` anchor — see `billing-navigate.ts` +
`ProUpgradeButton`.

## Flags

| Env | Meaning |
| --- | --- |
| `MCFLY_BILLING=1` | Allow Start 7-day trial → plan page |
| `SHOPIFY_APP_HANDLE` | Override handle (default `mcfly-analytics-public`) |

## Evidence

- `billing.server.ts` — `buildManagedPricingPlansUrl` + active-sub sync
- `billing-navigate.ts` — top-frame-only Admin navigation (no iframe fallback)
- `billing-iframe-guard.test.ts` — proves Admin URLs never same-frame assign
- `Shop.proBillingActive` — cache after sync / webhook
- `entitlements.server.ts` — every channel and surface on every plan
- `desk-claims-guard.test.ts` — fails on `pro_required`, "Free plan", "Pro only"
