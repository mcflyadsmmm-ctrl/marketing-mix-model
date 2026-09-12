# App IA — Shopify depth first, Marketing Spend second

**Status:** active · 2026-09-12  
**Companion:** `app/app/lib/shopify-depth-catalog.ts` (47 spend-free features)

## Top nav (core)

| Tab | Route | Contains |
| --- | --- | --- |
| **Sales** | `/app/sales` | Calendar, pace, order shape, day board — every `tab: "sales"` catalog chart |
| **Customers** | `/app/customers` | Repeat, cohorts, concentration, whales — every `tab: "customers"` chart |
| **Goals** | `/app/goals` | Sales targets only (no margin / no ROAS goal) |
| **Marketing Spend** | `/app/spend` | Spend entry + Total ROAS desk; subnav → Allocation, Advanced |
| **Settings** | `/app/settings` | Plan, SAMPLE, privacy — **margin UI hidden for now** |

**Removed:** Overview tab. `/app` redirects to `/app/sales`.

## Rules

1. Sales + Customers never require spend.
2. Line-item charts (discount / shipping / tax / units) may show an honest empty state until ingest lands — still listed on the page.
3. Margin / break-even UI stays out until Marty brings it back.
4. Merchant copy: Overview, Sales, Customers, Goals, Marketing Spend — no till / scoreboard jargon.

## Catalog coverage

Every id in `SHOPIFY_DEPTH_CATALOG` must render a `DepthChartCard` on its tab (live data or emptyReason).
