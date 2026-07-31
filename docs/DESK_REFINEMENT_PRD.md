# Desk refinement PRD — Total Sales + UI simplify

**Status:** Founder-confirmed 2026-07-30  
**SoT:** This file + [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4 (religion updated to match)

## Goals

1. **Action Total ROAS** uses Shopify **Total Sales** by default (shipping, taxes, duties, fees included; after returns).
2. **Net Sales** view toggle (product subtotal after discounts/returns, excl. shipping/tax).
3. Settings: Total ROAS Target primary; margin advanced; cost waterfall hidden by default.
4. Spend: linear channel → template → CSV; compact platform spend; clear CSV errors.
5. Remove “not Platform ROAS” / sales-basis info banner; keep fail-closed trust banners.
6. Polish Explorer, Goals, LTV (not-in-Shopify emphasis).

## Field mapping

| Merchant label | Shopify field | Storage |
| --- | --- | --- |
| Total Sales (action default) | `currentTotalPriceSet` | `SalesDayFact.sales` |
| Net Sales (toggle) | `currentSubtotalPriceSet` | `SalesDayFact.netSales` (nullable until reconcile) |
| Order totals (Ads Mgr secondary) | `totalPriceSet` | `SalesDayFact.grossSales` |

## Refuse

Pixels, MTA, TW clones, SyncWith zoo, App URL = mcflyads.com.

## CSV-first Free desk (addendum)

- Spend SoT = CSV / paste / template on Spend.
- `/app/connections` redirects to `/app/spend` (**ads OAuth UI retired**).
- `/app/close` redirects to `/app` (**Monday Close lock UI retired**).
- Merchant copy: "Logged Spend via CSV".
- Overview: compact hero row → Total ROAS Explorer as primary interactive; Share Overview (mailto) on Home.
- See [`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md).
