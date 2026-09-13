# Acquisition readiness — Mcfly Analytics

**Date:** 2026-09-13  
**Branch:** `cursor/shopify-depth-ia-3706`  
**Live app:** https://mcfly-analytics.fly.dev  
**Pricing (product truth):** trial → $39/store/mo  

This is an engineering readiness checklist for diligence. It does **not** invent LOIs, reviews, install counts, or third-party interest.

---

## Money truth (must match Shopify Analytics grain)

| Gate | Status | Notes |
|------|--------|-------|
| Day totals prefer ShopifyQL Analytics (`total_sales` / orders / net / gross) | Shipped | Overlay on crawl in reconcile + backfill batch |
| Refunds dated on refund event day (not only order day) | Shipped | `extractOrderDirtyDayKeys` + multi-day webhook enqueue |
| `refunds/create` subscribed in app toml | Code ready | **Partner gate:** run `shopify app deploy` so Partner registers the topic |
| Refund-only payload does not clear wrong OrderFact day seal | Shipped | Seal clear skipped for refund resource; waits for `orders/updated` |
| Open shop-local day excluded from closed aggregates / Goals pace | Shipped | Sales/Customers/Goals + fact coverage/totals closed-day filter |
| Goals day-1 (0 closed days) does not show Miss | Shipped | `paceStatus` → Starting when `expectedPct === 0` |
| Goals MTD uses shop IANA (not host TZ) for open-day cut | Shipped | `app.goals` passes `now` + `ianaTimezone` into month/pace helpers |
| Goals spend capped to closed days (same cut as sales) | Shipped | `spendByMonthMap` ends at yesterday shop-local |
| ShopifyQL omitted day must not seal $0 | Shipped | `fetchShopifyQlSalesDay` returns null; empty TIMESERIES → null |
| Spot-check missing QL row ≠ live $0 | Shipped | Skip absent targets; do not invent mismatch |
| `refreshExisting` must not recent_scan-wipe history | Shipped | Day search only; refuse page-capped $0 upserts |
| Desk live “today” top-up cannot double-count a stored open-day fact | Shipped | `salesFactsClosedDayFilter` on coverage + period totals |
| Admin spot-check reseals on mismatch | Shipped | Newest/oldest/mid closed days; clears OrderFact seals on mismatch |
| Analytics $0 days allowed to upsert when QL trusted | Shipped | `analyticsTrusted` on zero upsert gate |

## Product / ops honesty

| Gate | Status | Notes |
|------|--------|-------|
| Fresh start north star (`docs/FRESH_START.md`) | Active | Shopify truth first; spend later |
| No invented social proof | Active | Account rule |
| Webhook topics registered in Partner | **Human** | After toml change: `shopify app deploy` |
| Fly deploy of this branch | In progress | After each accuracy slice |

## Known residual risks (not “100%” until closed)

1. **Partner webhook deploy** — code listens for `refunds/create`; Partner must register it.
2. **ShopifyQL availability** — crawl fallback can still diverge from Analytics until QL succeeds; spot-check surfaces mismatch.
3. **Overview vs Sales intentional difference** — Overview may include live today top-up; Sales depth aggregates closed days only (labeled).
4. **Spend / platform ROAS** — not claimed as Shopify Analytics identity; keep platform vs store spend distinct when spend ships deeper.
5. **Fleet audit follow-ups** — parallel reviews may still surface P0/P1 after this checklist; treat findings as blockers until fixed.

## Diligence demo script (short)

1. Pick a store with refunds spanning days; compare Mcfly day chart to Shopify Analytics day chart for the refund day and order day.
2. Confirm open today is labeled / excluded from closed pace on Goals.
3. Trigger a refund; confirm refund day reconcile job enqueues (and after Partner deploy, `refunds/create` delivery appears).
4. Force a sealed-day mismatch (or wait for spot-check); confirm honesty strip + reseal.

---

Update this file when a gate flips. Do not mark “acquisition ready” while Partner webhook registration or open P0 money bugs remain.
