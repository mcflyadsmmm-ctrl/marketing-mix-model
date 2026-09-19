# ShopifyQL overkill audit — 2026-09-18

**Lane:** Ops / research. Branch `cursor/spend-trust-recurring` @ `83f2281`.  
**Read-only on app code.** This file only. Reviews stay **0**. Listing [https://apps.shopify.com/mcfly-analytics-public](https://apps.shopify.com/mcfly-analytics-public). Flat **$39**.  
**Religion:** Total ROAS = Shopify sales ÷ entered spend; no pixels / MTA; no inventing installs.

ShopifyQL docs consulted via Shopify Dev MCP (`learn_shopify_api` + `search_docs_chunks`, api_name `shopifyql`, conversation `b97963a7-c228-422b-8ce7-6825aadf2ed1`). Schema refs: [sales](https://shopify.dev/docs/api/shopifyql/2026-07/schemas/sales_revenue/sales), [customers](https://shopify.dev/docs/api/shopifyql/2026-07/schemas/customers/customers). Gate: [`shopifyqlQuery` needs `read_reports` + Level 2 protected customer data](https://shopify.dev/docs/apps/build/shopifyql/graphql-admin-api).

---

## 1. Verdict

Day **totals** (Total / Net / Gross / order count) no longer need `orders(first:100)` — ingest and desk paint already use ShopifyQL (`shopifyql_sales_day_v1` / `fetchShopifySalesDayTotals`). The remaining crawl tax is **OrderFact** (opaque customerKey + amounts + times) for median, repurchase, RFM, and LTV cohorts — keep that, but stop pretending every period KPI needs it. Live ShopifyQL day rows **zero** new/returning/guest, so Customers / Growth dollar splits stay dark until OrderFact lands or ShopifyQL fills those fields. Stale **~60d** UX copy is now false given 24mo order policy + multi-year sales ask (still blocked live by missing Partner `read_reports`).

---

## 2. Metric map

| Metric | Current source | Shopify native alternative | Keep OrderFact? | Priority | Est. cost win |
| --- | --- | --- | --- | --- | --- |
| Period Total / Net / Gross sales | `SalesDayFact` via ShopifyQL day totals (`shopify-sales-totals.server.ts`); desk `loadDeskSalesForPeriod` | `FROM sales SHOW total_sales, net_sales, gross_sales, orders TIMESERIES day` (already shipped) | No | Done | Avoids 100-order pages × days × shops for closed history |
| Open-day (today) sales top-up | ShopifyQL single-day query in `loadDeskSalesForPeriod` | Same | No | Done | Replaces capped `fetchShopifySales` / `LIVE_TODAY_MAX_PAGES` crawl |
| Mean AOV (sales ÷ orders) | `shopifyNativePeriodStats` / depth `meanAov` from facts or OrderFact | Period `total_sales / orders` from day facts, or ShopifyQL period aggregate | No (for mean) | P1 | Free from day facts; drop OrderFact scan for mean-only tiles |
| Median / typical order | `shopifyDepthStats` ← `loadOrderDepthRows` | **None** (Shopify shows mean only; community median gap still open) | **Yes** | Keep | — |
| Order count | SalesDayFact `orders` | ShopifyQL `orders` | No | Done | — |
| New vs returning **sales $** | Intended: SalesDayFact columns; **live ShopifyQL path writes 0** and `customerMetricsAvailable: false` | `FROM sales SHOW total_sales GROUP BY new_or_returning_customer` (dimension documented on sales schema) | Prefer no for period split | **P0** | Restores Customers/Growth heroes without waiting for OrderFact |
| New / returning **order counts** | Legacy order crawl mix; now blank on facts spine | ShopifyQL `orders_first_time`, `orders_returning` | No for counts | P1 | One query vs opaque lifetimeOrders heuristic |
| Unique new buyers (Cash CAC denom) | `countNewBuyersInRange` scans **all** live OrderFacts | Customers schema `new_customer_records` (acquisition headcount) — definition may differ from till “first on file”; validate before swap | Yes until validated | P1 | Kill full-table OrderFact scans on every CPA / Overview paint |
| Guest order share | OrderFact / legacy crawl; facts path zeros | Not a first-class ShopifyQL metric found this pass | Yes for now | P2 | Low until guest dimension confirmed |
| Weekday / weekend sales share | Depth from OrderFact amounts by shop-local day | ShopifyQL `TIMESERIES day` + local rollup (already have SalesDayFact) | No for weekday $ | P1 | Use day facts; stop OrderFact for Overview weekend tile |
| Peak hour / hourly mix | OrderFact `orderedAt` + tz | Shopify Analytics Group by hour; ShopifyQL day grain only in our ingest | **Yes** for Mcfly hour clock | Keep | Hour needs order timestamps or a future hour TIMESERIES |
| Basket size / 2+ unit share | OrderFact `unitCount` | ShopifyQL `quantity_ordered_per_order` (mean); multi-unit **share** still needs rows | Partial | P2 | Mean basket from QL; keep OrderFact for multi-unit share |
| Discount vs full-price typical | OrderFact `discountAmount` | Order-level discounts exist in sales schema; median still needs rows | Yes for medians | Keep | — |
| Source mix (Online/POS/Shop) | OrderFact `sourceName` | Possible sales dimensions; not wired | Yes until QL path proven | P3 | — |
| Days to 2nd / 2nd-in-30 / TT2 | OrderFact customer timelines (`growth-tt2`, depth) | Shopify cohort reports (group cells, not our opaque keys) | **Yes** | Keep | — |
| RFM-lite / whale watchlist | Full OrderFact book (`customers-rfm`) | Shopify RFM report exists; we refuse cloning as hero | **Yes** | Keep | — |
| LTV 30 / 90 / 365 + cohorts | `CohortFact` from OrderFact (`recomputeCohortFacts`) | Shopify cohort analysis (different product) | **Yes** | Keep | — |
| Top-decile / top-customer concentration | OrderFact amounts | No native Overview card | **Yes** | Keep | — |
| YoY / YTD / multi-year sales chart | SalesDayFact (10y ask) when `read_reports` live | ShopifyQL long `SINCE`/`UNTIL` | No | P0 (gate) | Years of sales without order crawl |
| Total ROAS / aMER | SalesDayFact ÷ entered spend | N/A (spend is ours) | No | — | Religion intact |

### Dead / legacy crawl surface (still in tree)

| Symbol | Role today | Action |
| --- | --- | --- |
| `fetchShopifySales` / `fetchShopifySalesByDay` / `ORDERS_SALES_QUERY` / `ORDERS_FULL_QUERY` | Implemented in `shopify-sales.server.ts`; desk HARD-STOP forbids multi-day use; today top-up moved to ShopifyQL | Treat as **legacy**. Do not re-enable for period paint. Desk may delete or quarantine after tests green (Desk lane). |
| `ORDERS_FOR_FACTS_QUERY` | Sole live `orders(first:100)` producer for OrderFact backfill | **Keep** (chunked, page-capped via `ORDER_FACT_PAGES_COST_SAFE_CAP`) |
| `runOrderFactsBackfill` | Day-chunked OrderFact fill, 24mo cap (`ORDER_ROW_WINDOW_MONTHS`) | Keep; do not use for day sales totals |
| `loadOrderDepthRows` | Up to 20k OrderFact rows per desk depth call | Keep for depth pages; stop using for metrics ShopifyQL/day facts already cover |
| `countNewBuyersInRange` | Full OrderFact scan for first-order-in-range | Optimize or replace (P1) |

---

## 3. Must KEEP OrderFact (why)

OrderFact is the only Level-1 store of **opaque customerKey + orderedAt + amount (+ discount / source / units)** under `read_orders` / `read_customers`. ShopifyQL aggregates cannot answer Mcfly’s uninstall moat:

1. **Median / typical ticket** — Shopify Analytics mean AOV hides whales; community still asks for median.
2. **Repurchase timing** — days-to-second, second-within-30, TT2 / win-back fall-off need per-buyer order sequences.
3. **In-window repeat $ share** — not Shopify’s returning-customer **headcount** rate.
4. **LTV / CohortFact** — 30/90/365 revenue and orders after first visible order; promo/product first-order boards.
5. **RFM-lite / concentration** — top 10% buyers, one-and-done share, orders-per-buyer.
6. **Hour-of-day clock** — needs timestamps; our ShopifyQL ingest is day grain only.
7. **Cash CAC “new on file”** — till definition uses first OrderFact (+ lifetimeOrders heuristic), not necessarily Shopify’s `new_customer_records`.

Hard cap stays **24 months** (`live-ingest-depth.ts`). Religion challenge same day: all-time order rows are overkill; day aggregates past 24 months are fine.

---

## 4. Must KILL order-paging (why)

| Job | Why kill crawl |
| --- | --- |
| Closed-day Total / Net / Gross / orders | Already ShopifyQL. Re-introducing `fetchShopifySalesByDay` would re-throttle high-volume shops for numbers Shopify already totals. |
| Period sales on desk paint / API (`loadDeskSalesForPeriod`, `fetchShopifySalesForShop`) | Facts + QL today only. HARD-STOP comments in Overview / Allocation / LTV. |
| Mean AOV when order count known | Division, not pagination. |
| Weekday / weekend **sales $** shares | Roll up `SalesDayFact` by weekday; OrderFact is redundant for Overview weekend tile. |
| New / returning **sales $** (period) | ShopifyQL `GROUP BY new_or_returning_customer` — one aggregate vs crawling every order for opaque mix. |
| First-time / returning **order counts** | ShopifyQL `orders_first_time` / `orders_returning`. Note: these are **orders**, not unique buyers. |
| Multi-year sales spine / YoY | Day facts from QL (10y ask in `shopify-sales-totals.ts`); never page years of orders. |

Do **not** kill OrderFact paging used to **build** OrderFact. Kill using that crawl (or scanning every OrderFact) as a substitute for aggregates Shopify already exposes.

---

## 5. Features / timeframes we under-offered because of order crawl

Honest list of what the product delayed, narrowed, or lied about while order paging was the sales path — and what still hurts after the ShopifyQL sales move:

1. **Live new/returning $ heroes** — ShopifyQL day ingest zeros customer columns; `salesResultFromFactsTotals` forces `customerMetricsAvailable: false`. Customers / Growth dollar contrast goes blank on live until OrderFact or a QL split lands.
2. **YoY / last-year cards** — still UX-framed as “~60 days of orders” (`overview-yoy.ts`, `desk-history.ts`) even though sales facts ask up to **10 years** and orders policy is **24 months** (when `read_all_orders` + history not limited). Merchants see under-promise and may think YTD is fake.
3. **Multi-year sales explorer** — Overview chart presets (90d / 6mo / YTD / 1y) depend on SalesDayFact fill; without Partner `read_reports`, live shops get empty facts and “still loading” honesty instead of Shopify-true long charts.
4. **Mean basket size from Analytics** — `quantity_ordered_per_order` available in ShopifyQL; we only surface mean units after OrderFact unit crawl seals.
5. **Fast Cash CAC** — `countNewBuyersInRange` loads every identified OrderFact to find firsts; CPA / Overview pay for that on each paint while backfill is incomplete.
6. **Stale coverage copy** — `OVERVIEW_COVERAGE_LINE`, `product-labels.ts` (“Last ~60 days”), `shopify-native-stats.ts` header comment still describe ~60-day order windows as the product contract.
7. **Trial clamp ghost** — trial 90-day sales cut is removed in code; any remaining “trial = thin book” messaging that implies 90d sales (not OrderFact fill progress) would under-offer vs policy. (OrderFact still fills in chunks — that delay is real, not a 90d religion.)

---

## 6. Ranked fix plan for Desk lane

No Partner Submit from Cursor. File hints only. Exclusive Desk files under Conductor lanes.

| Rank | Fix | File hints | Notes |
| ---: | --- | --- | --- |
| **P0** | Restore period new/returning **sales $** via ShopifyQL (or stop zeroing when OrderFact depth can supply dollars for the same window) | `shopify-sales-totals.ts` / `.server.ts`, `sales-facts.server.ts` (`salesResultFromDayTotal`, `salesResultFromFactsTotals`), Consumers: `shopify-native-stats.ts`, Customers/Growth routes | Prefer `GROUP BY new_or_returning_customer` day or period query. Label carefully: order-based New/Returning ≠ unique headcount. |
| **P0** | Honesty pass: replace false **~60d** coverage strings with policy that matches 24mo OrderFact + ShopifyQL sales window (and “waiting on reports scope” when facts empty) | `overview-first-viewport.ts`, `overview-yoy.ts`, `desk-history.ts`, `product-labels.ts`, `shopify-native-stats.ts` comments; tests that assert `/60 days/` | Do not invent Partner approval. When `historyLimited` or missing `read_reports`, say that — not a blanket 60d forever. |
| **P0** | Surface SalesDayFact empty state as **reports-scope / ingest pending**, not as “orders still crawling for totals” | `sales-facts.server.ts`, CashTrust / Overview pending copy | Sales totals path no longer pages orders; copy must not say it does. |
| **P1** | Weekday / weekend Overview tiles from **SalesDayFact** day keys, not OrderFact | `mer-dashboard.server.ts`, `shopify-depth-stats.ts` call sites, `overview-first-viewport` | Keep OrderFact for median / hour / repurchase. |
| **P1** | Replace or index `countNewBuyersInRange` full-table scan | `order-facts.server.ts`, `cpa-desk.server.ts`, `mer-dashboard.server.ts` | First-order SQL / materialized firsts; optional later ShopifyQL `new_customer_records` with definition diff documented. |
| **P1** | Quarantine / delete unused `fetchShopifySales*` period crawl once tests only mock ShopifyQL | `shopify-sales.server.ts`, `sales-facts.server.test.ts`, API tests | Reduces footgun of re-enabling unbounded crawl. |
| **P2** | Add ShopifyQL `quantity_ordered_per_order` (and optional `orders_first_time` / `orders_returning`) into day or period facts | `shopify-sales-totals.ts` | Mean basket without waiting for unitCount crawl. |
| **P2** | Cap / narrow `loadOrderDepthRows` callers so period scoreboards do not pull 20k rows when only SalesDayFact metrics are needed | `desk-sales-page.server.ts`, `desk-customers-page.server.ts`, `desk-growth-page.server.ts` | Growth/Customers still need OrderFact for TT2/RFM — load once, reuse. |
| **P3** | Source / discount medians stay OrderFact; only revisit if ShopifyQL dimensions cover Mcfly’s Online/POS/Shop map without PII | `order-facts.server.ts`, depth stats | Low EV vs median/LTV moat. |

Conductor still owns Fly deploy after Desk lands. Workers do not `fly deploy`.

---

## 7. `read_reports` Partner gate (Marty)

**Fact:** `shopifyqlQuery` requires the **`read_reports`** access scope (and Shopify docs also require **Level 2 protected customer data** for that field).  
**Repo today:** `app/shopify.app.toml` (and public/custom variants) scopes are:

`read_orders,read_customers,read_all_orders`

— **no `read_reports`.**

**Consequence:** Code path for SalesDayFact is ShopifyQL (`source = shopifyql_sales_day_v1`). Without Partner-approved `read_reports` on the published app and merchant re-grant, live shops will hit `ShopifyReportsScopeError` / empty facts; ingest **does not** fall back to order paging for day totals (`live-ingest-depth.ts` product lock).

**Ask Marty (human only):**

1. Partner Dashboard → request / approve **`read_reports`** for Mcfly Analytics (public listing app).
2. Confirm protected customer data **Level 2** status for ShopifyQL (Shopify: approval can take time — request early).
3. After approval: add `read_reports` to TOML scopes and ship a version that triggers merchant scope update — **Marty clicks Submit / scope publish**; Cursor does not.
4. Smoke one live shop: SalesDayFact rows appear; Overview long ranges leave “pending” for real dollars, not crawl.

Until that gate clears, treat multi-year ShopifyQL sales as **code-ready, Partner-blocked**. Do not invent approval or live fill rates.

---

## Appendix — consumer map (quick)

| Consumer | Uses |
| --- | --- |
| Overview (`app._index.tsx`) | `loadDeskSalesForPeriod` + `shopifyNativePeriodStats` + depth via `mer-dashboard` OrderFact |
| Orders / Customers / Growth loaders | `desk-sales-page` / `desk-customers-page` / `desk-growth-page` → sales facts + `loadOrderDepthRows` |
| LTV | Sales spine facts-only; cohorts / flagship from OrderFact |
| CPA | Spend + `countNewBuyersInRange` / identified counts from OrderFact |
| API `v1.mer` / `v1.allocation` | `fetchShopifySalesForShop` → same desk facts hard-stop |
| Jobs / first session | `runOrderFactsBackfill` + SalesDayFact ShopifyQL resume |

**Native vs depth contract:** `shopify-native-stats.ts` = period sales/AOV/new-returning from SalesResult (now mostly empty customer split on live). `shopify-depth-stats.ts` = OrderFact book stats Shopify Overview does not hero. Keep both; feed native from QL aggregates, depth from OrderFact only.

---

## Desk P0 landed (2026-09-18)

Desk lane on `cursor/spend-trust-recurring`:

1. **P0-1** — Second ShopifyQL query per year chunk: `FROM sales SHOW total_sales TIMESERIES day GROUP BY new_or_returning_customer …`. Merges New/Returning Total Sales $ into `SalesDayTotal`; `salesResultFromDayTotal` / `salesResultFromFactsTotals` set `customerMetricsAvailable` when every fact day has the split. Still order-based New/Returning, not unique headcount. No `orders(first:100)` fallback.
2. **P0-2** — Replaced blanket ~60d coverage copy in overview YoY / first viewport / desk-history / product-labels / native-stats comments with 24mo orders + multi-year sales-day-totals policy. `shopifyOrderWindowLimited` / `historyLimited` still says ~60d.
3. **P0-3** — Empty / pending sales facts copy → reports scope / sales totals ingest (Overview pending, factsIncompleteSuffix, CashTrust incomplete banner). Not “orders crawling for totals.”

**Still blocked on Marty:** Partner `read_reports` (+ Level 2 PCD). Live shops stay empty facts until that gate. Do not add scope to TOML from Desk.
