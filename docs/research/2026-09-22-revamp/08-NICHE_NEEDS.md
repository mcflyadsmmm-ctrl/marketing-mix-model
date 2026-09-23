# 08 — Niche needs (what still fails; one publish without L2)

**Lane:** Wave 2 · NICHE NEEDS  
**Date:** 2026-09-22  
**Ship tree:** `marketing-mix-model/`  
**May contradict:** `01`–`04` and superseded `REVAMP_SPEC.md` (those were too kind — they treated densify + honesty banners as a revamp).  
**Religion:** Total ROAS = Shopify sales ÷ merchant-entered spend · **$39** after 7-day · no pixels / MTA.  
**Scopes (intent):** `read_orders`, `read_customers`, `read_all_orders`, `read_reports`.  
**L2:** `shopifyqlQuery` is **ACCESS_DENIED** until PCD Level 2 fields (name, email, phone, address) are approved. **Order GraphQL works.**  
**History truth (`docs/BILLING_TIERS.md`):** trial / unpaid Live ingest = **90 closed days**; paid order rows still cap at **24 months**. Do **not** repeat “trial includes 24 months.”  
**Reviews / installs:** **0** reviews on listing — not invented.

---

## 1. Niche need statement

Native Shopify Analytics still fails the **operator morning job**: get a trustworthy read of *sales quality and repeat dollars* without exporting to Sheets, without trusting Sidekick, and without hunting Group-by / plan-gated reports for median ticket, weekend mix, and returning **dollars** (not headcount rate). Community evidence is durable — median AOV still missing as a first-class Overview KPI ([Community 254046](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046)); returning customer rate is headcount ([Ivy_4 formula thread](https://community.shopify.com/t/how-is-the-returning-customer-rate-calculated-in-analytics/217973)); redesign / “reports disagree / NO DATA” complaints persist ([r/shopify Analytics redesign](https://www.reddit.com/r/shopify/comments/1i2jh0a/what_the_fuck_happened_to_shopify_analytics/), [Community revert Analytics](https://community.shopify.com/t/shopify-needs-to-revert-back-to-old-analytics/418200)); Sidekick hallucinates sales ([r/shopify Sidekick caution](https://www.reddit.com/r/shopify/comments/1m4169l/be_extremely_careful_with_sidekick/)). Paid suites fill the gap with the wrong product: Triple Whale / Polar / TrueROAS sell pixels and path ROAS that disagree with Shopify; Lifetimely / Peel sell deep LTV/P&L at order-volume or ~$149–$499+ cliffs. **What the niche still lacks at $39:** one calm Admin desk that paints **from the order book on day one**, stays honest when spend is empty and when Analytics-aligned day totals are blocked, and only then offers cash Total ROAS — without pretending to be Analytics parity or an attribution suite.

**Contradiction of prior kindness:** `01`/`03`/`04` imply Mcfly already *owns* that desk and just needs poison filters + copy. Live reality: Overview/Orders/Customers **blank OrderFact depth when `salesPending`** (`OverviewFirstViewport.tsx` ~158–166; `orders-first-viewport.ts` / `customers-first-viewport.ts` gate on `salesPending`), SalesDayFact is QL-blocked or poisonable (`sales-facts.server.ts`), and the App Store card still sells **ad spend first**. The niche need is unmet **inside our own first folds**, not just in Shopify.

---

## 2. Need table

| Need | Who fails it | Can Mcfly do it NOW from orders? | Blocked on L2? |
| --- | --- | --- | --- |
| Morning “up/down vs last year” from **Analytics-aligned Total Sales** | Native compare is painful / Sidekick-untrusted; apps that invent revenue lose trust | **No** as certified ShopifyQL totals | **Yes** for parity clocks |
| Morning **sales-quality** read (median ticket, weekend mix, order timing) without export | Native: mean AOV only; hour/DOW buried in Reports | **Yes** — OrderFact (`order-facts.server.ts`, `desk-sales-page.server.ts`) | **No** |
| Returning **dollars** vs new (not rate) on one screen | Native Overview = rate; returning-$ report plan-gated / export | **Yes** from opaque order history + `numberOfOrders` heuristics | **No** for order-book $; **Yes** for QL New/Returning Total Sales $ (`customerMetricsAvailable`) |
| Early observed LTV (30/90) + days-to-second | Lifetimely/Peel/RCI own it at higher ASP / tax; native isn’t an LTV desk | **Yes** inside trial **90d** / paid **≤24mo** windows — label the window | **No** |
| Cash Total ROAS / MER = Shopify sales ÷ **typed** spend | Native has no spend ledger; TW/Polar sell path ROAS | **Partial** — Spend ledger + — not 0× exists; **sales denom honest only when day totals aren’t poison/QL-dark** | Sales denom parity **Yes**; entered-spend UX **No** |
| “Matches Analytics This month $X” | Every connector suite that ships a second book | **No** until QL-certified facts | **Yes** |
| Sessions / conversion / traffic | Native owns it | **No** (orders ≠ sessions) | N/A — **refuse** even post-L2 as hero |
| Path / MTA / “true ROAS” | TW / Northbeam / TrueROAS | **No** by religion | N/A — **refuse** |
| Full COGS / P&L / Amazon | Lifetimely Profit / Polar warehouse | **No** | N/A — **refuse** |
| AI analyst answers sales questions | Sidekick / Profit Agent | **No** | N/A — **refuse** |

---

## 3. Five needs worth a rebuild (not microcopy)

Each is a **user-visible outcome** on Overview or Customers (Orders feeds Overview peeks). These are rebuild ships — new first-fold composition and data wiring — not banner text.

### Need A — Order-book morning desk when day totals are dark

**Outcome (Overview):** At $0 spend and with ShopifyQL denied / SalesDayFact incomplete, the first viewport still shows **typical (median) order**, **weekend mix**, and **days-to-second** (or calm empties with reason) — never a wall of **—** that implies “the app has no data.” Sales YoY / period Total Sales stay **—** until certified; they do not silence OrderFact.

**Why rebuild:** Code already loads `metrics.shopifyDepth` then **forces peeks to — when `salesPending`** (`app/app/components/OverviewFirstViewport.tsx`). Prior research called this “buildable in 7 days”; shipping it means **uncoupling** depth from the QL pending flag, not another honesty strip.

### Need B — Typical order economics as the Orders hero

**Outcome (Orders → peeks on Overview):** First thing on Orders: **median ticket vs Shopify average**, discount share, 2+ item basket, weekend/hour — one composition, not a scoreboard soup below the fold.

**Why rebuild:** Native gap is real (Community median threads). We compute depth (`loadOrderDepthRows` / `ShopifyDepthStats`) but Live first fold still collapses to pending copy (`ORDERS_PENDING_LINE` in `orders-first-viewport.ts`) when sales facts lag.

### Need C — Returning dollars as the Customers hero (order-book, not QL theater)

**Outcome (Customers):** First viewport hero = **returning $ vs new $** from orders on file, with coverage line (90d trial / ≤24mo paid). No headcount rate as home hero. No implication that numbers are ShopifyQL New/Returning Total Sales until L2.

**Why rebuild:** `customers-first-viewport.ts` still keys greeting/hero off `salesPending` and book splits that go dark without `customerMetricsAvailable` (QL). Order-derived returning $ must be the Live path; QL becomes enrichment later.

### Need D — 90-day LTV flagship (honest window), not 365 theater

**Outcome (Customers → LTV panel):** One “Today’s read”: first-**90** worth + come-back + written formula from orders on file. First-year / 365 stays **—** or history-limited when the commercial window cannot support it (trial = 90 closed days per `BILLING_TIERS.md` / `live-ingest-depth.ts`).

**Why rebuild:** We densified Product→LTV, Promo→LTV, RFM, whales, shareables (`CustomersLtvSection`, `CustomerRfmBoard`, `ShareableInsightCards` on `app.customers.tsx`) while trial history and listing paste **lied** about 24 months on trial (`docs/ops/LISTING_LIVE_PASTE.md`). Niche pays for a clear 90-day habit, not panel count.

### Need E — Cash Total ROAS as chapter two only

**Outcome (Overview stays spend-free; Spend owns formula):** Overview never shows blank ROAS / 0.00×. Spend: sales ÷ entered spend over Yesterday / 7 / 28 / MTD; empty = **—**. Kill “Live is parked” strings if Live is unparked.

**Why rebuild:** Listing still sells spend first (`04` live listing audit); Spend routes still say Live is parked (`app.spend.tsx` ~555, ~1504; `app.spend.import.tsx`). Religion is correct; **IA and lying copy** make the niche think we are a thin ROAS widget.

---

## 4. Capabilities already coded but buried or lying

| Capability | Status | Cite |
| --- | --- | --- |
| OrderFact median / weekend / hour / basket / days-to-second | **Computed**, then often **blanked** behind `salesPending` on Overview/Orders | `order-facts.server.ts`; `desk-sales-page.server.ts`; `OverviewFirstViewport.tsx` ~158–166; `orders-first-viewport.ts` |
| Returning $ / LTV / Growth / RFM / whales / Product·Promo→LTV | **On Customers** under a densify scroll; redirects from `app.ltv` / `app.growth` | `app.customers.tsx`; `CustomersLtvSection*`; `CustomerRfmBoard`; `app.ltv.tsx` → redirect |
| Shareable insight cards | Wired on Overview + Customers; habit buried under tile soup | `ShareableInsightCards`; `shareable-insights.ts`; `app._index.tsx` / `app.customers.tsx` |
| `flagshipDailyRead` LTV morning line | Lib exists; not a stranger-visible flagship | `ltv-flagship` via `app.customers.tsx` |
| Spend paste / empty = — / salesPending blocks 0.00× MER | Religion mostly correct | `app.spend.tsx`; `mer-dashboard.server.ts`; `mer-format.ts` |
| “Live is parked until launch” | **Lying** if Live is unparked | `app.spend.tsx` ~555, ~1504; `app.spend.import.tsx` ~492, ~1998 |
| Trial = 90d / paid order rows ≤24mo | **True in code/docs**; **false in listing paste** (“trial includes 24 months”) | `docs/BILLING_TIERS.md`; `live-ingest-depth.ts` (`LIVE_UNPAID_INGEST_DAYS`, `ORDER_ROW_WINDOW_MONTHS`); `docs/ops/LISTING_LIVE_PASTE.md` refresh blurb + long copy |
| SalesDayFact ShopifyQL path | Coded; **ACCESS_DENIED** until L2; poison legacy zeros can still certify | `sales-facts.server.ts`; `shopify-sales-totals.server.ts`; `01` audit |
| No order-sum fallback for day totals | Product lock — correct — but leaves Overview hollow until L2 **unless** OrderFact heroes ship | `live-ingest-depth.ts` 11–13 |
| Fold redirects (roas/cpa/allocation/yoy/buyers/timing) | Bookmark safety; agent cognitive load / fake “tabs” | `app.roas.tsx`, `app.ltv.tsx`, … |

---

## 5. Capabilities we should NOT build

| Refuse | Why |
| --- | --- |
| **Attribution / MTA / “true ROAS” / path credit** | Theater; never converges with Shopify; TW/Northbeam uninstall engine; breaks religion |
| **Sessions / conversion / traffic hero** | Needs QL sessions schema; native already owns it; not order-book wedge |
| **COGS / shipping / OpEx P&L OS** | Lifetimely/Polar gravity; not the $39 morning desk |
| **AI chat / Sidekick / Profit Agent clone** | Hallucination scar tissue; support liability; not a number merchants can audit |
| Also refuse this publish: pixel/OAuth zoo, GMV pricing, inventing reviews/installs, claiming Analytics/ShopifyQL parity, claiming “replaces Triple Whale” |

---

## 6. One-publish scope — smallest set that feels new, not patched

**Feel-new bar:** a stranger opening Admin Live (and mcflyads.com) sees a **different product** — order-book morning desk at $0 spend — not the same five tabs with new banners.

### In (smallest ship set)

| Screen | What changes |
| --- | --- |
| **Overview first viewport** | Rebuild: OrderFact heroes live when QL/day totals are dark; period sales / YoY stay — with explicit “reports access” reason; **zero** spend/ROAS on fold |
| **Orders first viewport** | Rebuild: median vs average + weekend/hour as the composition; pending sales must not zero out OrderFact |
| **Customers first viewport + LTV panel** | Rebuild: returning $ from orders; 90-day LTV flagship; bury RFM/shareable/whale densify below or freeze; honest 90d / 24mo coverage |
| **Spend (verify only)** | Remove “Live parked” lies; keep formula + — ; do not densify new panels |
| **Poison / coverage (data truth)** | Read-path ignore non-`shopifyql_sales_day_v1` (or treat as gap) so we don’t paint hollow $0 as complete — required so Overview clocks aren’t silent lies when L2 later fills |
| **Site first fold + history sentence** | Same product story; trial **90 closed days** / paid **≤24 months**; de-QL; no “trial includes 24 months” |
| **Listing paste pack** | Sales-first; fix 24mo-on-trial lie — **Marty Save** (not this publish’s code) |

### Out (next publish or never)

Goals densify · Advanced · shareable-card packs · Product/Promo→LTV densify · chart easing · CSS dead-code · ShopifyQL parity claims · Partner Submit · ads · inventing social proof.

### Not “one publish” if omitted

If Overview still blanks median/weekend when `salesPending`, the ship is a **patch**. If Customers still leads with rate-adjacent emptiness waiting for QL, the ship is a **patch**. If listing/site still say trial = 24 months, the ship is a **lie**.

---

## Return packet

**Path:** `marketing-mix-model/docs/research/2026-09-22-revamp/08-NICHE_NEEDS.md`

**The 5 needs:**

1. **Order-book morning desk** on Overview when day totals are dark (uncouple from `salesPending`).  
2. **Typical order economics** as Orders hero (median vs mean + timing).  
3. **Returning dollars** as Customers hero from orders (not QL theater).  
4. **90-day LTV flagship** with honest commercial window (not 365 / 24mo-on-trial lie).  
5. **Cash Total ROAS as chapter two** — Spend formula + — ; Overview spend-free; kill parked/spend-first mismatch.

*End of niche needs. No app/site code edits in this lane.*
