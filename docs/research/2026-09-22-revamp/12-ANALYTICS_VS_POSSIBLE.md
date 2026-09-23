# Analytics vs possible — order book today (no ShopifyQL fiction)

**Date:** 2026-09-22  
**Ship tree:** `marketing-mix-model/`  
**Gate:** PCD Level 2 (name, email, phone, address) = **PENDING** → Admin `shopifyqlQuery` needs `read_reports` **and** L2. Until then Mcfly must not pretend day totals or New/Returning $ are ShopifyQL-certified.  
**What works without L2:** Order GraphQL with `read_orders` / `read_all_orders` / `read_customers` (opaque id + `numberOfOrders`) → `OrderFact`.  
**Do not invent reviews or install counts.** Reviews remain **0**.

Hostile audit (`05-HOSTILE_VISUAL_AUDIT.md`) already killed: dual nav, `LOOK HERE FIRST`, card soup, essay under every KPI, ROAS on first fold, `Live is parked until launch` on a published product, SAMPLE as the brand moment. This note only answers **what numbers are honest before L2** — not another collage to paint.

Sources: `app/app/lib/sales-facts.server.ts`, `shopify-depth-stats.ts`, `shopify-native-stats.ts`, `order-facts.server.ts`, `customers-analytics.ts`, `sales-pending.ts`, `live-ingest-depth.ts`, `live-unpark.ts`, `docs/BILLING_TIERS.md`, desk routes `app._index.tsx` / `app.orders.tsx` / `app.customers.tsx`.

---

## 1. Matrix

| Merchant question | Native Shopify Analytics | Mcfly from **orders** now (`OrderFact`) | Mcfly only **after L2** (`shopifyqlQuery`) | On the **first screen**? |
| --- | --- | --- | --- | --- |
| How much did I sell this period? | Overview Total sales (Analytics definition) | Sum of `OrderFact.amount` (net after returns) — **label as order-book sum, not Analytics Total Sales** | `FROM sales` day totals → `SalesDayFact` (`shopifyql_sales_day_v1`) | **No** as a certified “Shopify Total Sales” clock until L2; optional order-sum only if clearly labeled |
| What’s my average order? | Mean AOV | Mean = Σ amount / count from orders (foil) | Same from QL aggregates | **No** as hero — Analytics already owns mean |
| What’s my *typical* ticket? | Not a first-class Overview KPI | **Median** of `OrderFact.amount` | QL won’t beat this wedge | **Yes** — Overview + Orders hero |
| Am I up vs last year? | Overview compare / QL `COMPARE TO` | Rebuild from order history windows (honest gaps when crawl thin) | Day/month series matching Analytics | Structure yes; **dollar clocks stay —** until L2 or disclosed order-sum |
| What’s my returning-*customer rate*? | Overview returning rate (headcount) | Share of buyers with 2+ lifetime / in-window orders | QL customer splits | **No** — native owns rate; don’t clone |
| How many **dollars** came from returning buyers? | Reports / ShopifyQL returning sales $ | **Yes** — order-book: post–first-on-file $ (`customers-analytics`) or `lifetimeOrders > 1` at order time | ShopifyQL New/Returning Total Sales $ (`customerMetricsAvailable`) | **Yes** — Customers hero; Overview support strip |
| Weekend vs weekday mix? | Reports can group by day of week | **Yes** — Sat+Sun $ / window $ (≥5 sales days) | QL group dimensions | **Yes** — Overview support; Orders timing below fold |
| Sessions / conversion? | Analytics + sessions schema | **No** | Yes via QL | **Never** |
| Attribution / which ad? | Some marketing surfaces | **No** (religion) | Possible in QL; refuse | **Never** |
| Median days to 2nd order? | Not the same one-desk story | **Yes** — median gap first→second per identified buyer | Enrichment later | **Yes** on Growth / Customers depth — **not** Overview first fold (audit: Overview already overfolds peeks) |
| Opaque LTV 30/90/365? | Not this desk story | **Yes** from order history (trial depth = 90d; paid up to 24mo) | Enrichment | **Customers** panel, not Overview first fold |
| Total ROAS = sales ÷ typed spend? | Not native as one desk | Sales side needs a sales number; empty spend = **—** | Certified SalesDayFact ÷ spend | **Spend only** — never Overview first screen |

---

## 2. Lies the UI can tell today

| Lie | How it happens | Honest fix |
| --- | --- | --- |
| **$0 sales** when sales are unknown | `SalesDayFact` empty / legacy poison / QL denied → period sales resolve to 0; without `salesPending` a merchant reads “ads made nothing.” `resolveSalesReadiness` exists to suppress ratios when `factDays ≤ 0` and sales ≤ 0 — but any path that still paints a sealed `$0` Total Sales clock is a lie. | Paint **—**, banner “still loading — not $0”; never 0.00× Total ROAS |
| **`Live is parked until launch`** | `DataModeBar`, Spend routes, Settings copy while `MCFLY_SAMPLE_ONLY` freeze (or stale strings after unpark). App is **published**. | Kill on Live hosts; SAMPLE label only under freeze/shot |
| **SAMPLE = this shop** | Freeze forces `getSampleDeskEnabled` → Snowdevil `SampleSalesDay` / sample `OrderFact`; Customers even says SAMPLE when sample on — good — but yellow “parked” + SAMPLE hero still reads as the product. | SAMPLE only on `/demo` + freeze; Live = this shop’s orders |
| **ShopifyQL wording** | Site / overview coverage line (“day totals when reports are on”) and “next to ShopifyQL returning $” while L2 **PENDING** and ingest skips on `reports_scope_missing` | Say **order book now**; Analytics-aligned totals **when L2 approved** |
| **Trial = 24 months** | Listing/FAQ drift vs `BILLING_TIERS.md` + `LIVE_UNPAID_INGEST_DAYS = 90`. Paid order rows cap at **24 months**; unpaid/trial Live ingest stops at **90 closed days**. | One history sentence everywhere: trial **90 days**; paid **up to 24 months** |

Also: tying Overview depth tiles to `salesPending` (QL facts) blanks **median / weekend** even when `OrderFact` rows exist — that hides the order book behind a reports failure. Orders copy already admits “board still paints from orders on file”; Overview must not contradict that after rebuild.

---

## 3. Six numbers the rebuilt Overview / Orders / Customers may show **before L2**

All six are **OrderFact** (or OrderFact-derived). No `shopifyqlQuery`. Formulas in one line each.

1. **Typical order (median)** — `median(OrderFact.amount)` over paid orders in the selected window (`shopifyDepthStats.medianAov`).
2. **Weekend mix** — `Σ amount where shop-local dow ∈ {Sat,Sun} / Σ amount` when ≥5 days have sales (`weekendSalesShare`).
3. **Returning dollars (order book)** — `Σ amount` on orders after that `customerKey`’s first order on file (guests never returning) — `customers-analytics` mix; **not** ShopifyQL New/Returning $.
4. **New dollars (order book)** — window `Σ amount − returning dollars` (same first-on-file rule).
5. **Days to second** — `median(days between first and second order)` per identified buyer with ≥2 orders (`medianDaysToSecond`).
6. **2+ items share** — `count(unitCount ≥ 2) / count(orders with unitCount known)` when enough crawled rows (`multiUnitOrderShare`).

**Placement (audit-safe):** Overview first screen = typical + weekend + returning $ as a **support strip**, not eight soft cards. Orders hero = typical (median) vs mean foil. Customers hero = returning $ vs new. Days-to-second and 2+ items live on Orders/Customers — not a second Overview peek farm.

---

## 4. Numbers that must stay **—** until L2

| Number | Why |
| --- | --- |
| Analytics-matched **Total / Net / Gross** period clocks | Need `shopifyqlQuery` + L2; `runSalesFactsBackfill` skips on `reports_scope_missing`; product lock = **no order-sum fallback** into `SalesDayFact` |
| ShopifyQL **New/Returning sales $** / `customerMetricsAvailable` split | Written only by QL lane (`salesResultFromDayTotal`); headcount stays 0 on that path |
| “Matches Shopify Overview Total Sales” claims | Parity audit **HOLD** until L2 + accuracy F |
| Sessions, conversion, traffic | Orders API ≠ sessions; out of religion |
| Certified **SalesDayFact** completeness for multi-month Overview sales explorer | Same QL ingest; explorer must not fake a full year of $0 days |

Until L2: empty sales clocks = **—** + short honesty line. Order-book six above may still paint when OrderFact has rows.

---

## 5. File-level: where the order book is hidden

| Mechanism | Where | Effect |
| --- | --- | --- |
| **`salesPending`** | `sales-pending.ts` → `mer-dashboard.server.ts` → Overview / Orders / Customers / Spend | Suppresses ratios and often blanks first-viewport values (`OverviewFirstViewport`, Orders peeks) when **SalesDayFact** coverage is empty — even if OrderFact depth exists |
| **SAMPLE / freeze** | `sample-desk.server.ts` `getSampleDeskEnabled` ← `MCFLY_SAMPLE_ONLY`; `hydrateSampleOnlyFreeze`; `DataModeBar` | Live shop never reads; Snowdevil book + “Live is parked until launch” |
| **Live ingest none** | `live-unpark.ts` `liveIngestPolicy` → `kind: "none"` when freeze or `stage === "parked"` | First-session window **not** scheduled; OrderFact / SalesDayFact stay empty |
| **QL sales path only** | `sales-facts.server.ts` `loadDeskSalesForPeriod` / `fetchShopifySalesDayTotals`; `live-ingest-depth.ts` “does not fall back to reading orders” | Period **sales clocks** stay dark without L2; must not be mistaken for “no orders” |
| **Spend parked copy** | `app.spend.tsx`, `app.spend.import.tsx` | Strings claim Live parked; does not delete OrderFact but teaches merchants the desk is fake |

**Orders route honesty already correct in spirit:** `app.orders.tsx` — pending banner + “board still paints from orders on file.” Rebuild Overview/Customers to the same rule: **pending SalesDayFact ≠ blank OrderFact depth.**

---

## Return

**Path:** `docs/research/2026-09-22-revamp/12-ANALYTICS_VS_POSSIBLE.md`

**Six numbers (pre-L2):** typical (median) · weekend mix · returning $ · new $ · days to second · 2+ items share
