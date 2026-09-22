# Third compete — past rows 2–8 and ranks 8–12

**Lane:** Research only. One file. No `app/` edits, no Fly, no PR, no cook.  
**Fetched:** 2026-09-22.  
**Tip this memo is scored against:** `origin/cursor/spend-trust-recurring` @ `d2017c1` (scoreboard Fly note: **v423** / `#172` merged `8938134` / Live **PARKED**). Quiet-then-back `$`, copyable first-time `$`, next wait after they came back, and median first→last + inter-order gap are **on the tip**. Do not list them as missing. Rank 8 (whale ticket / RFM flow) is the named next cook — not a find.  
**Floor:** `docs/ops/MEGAPROMPT_ENTERPRISE_THIRD.md` · `origin/cursor/next-cook-queue-5bc6` `docs/plans/2026-09-22-enterprise-next-queue.md` (#165) · `origin/cursor/next-compete-5bc6` `docs/ops/research/2026-09-22-NEXT_COMPETE.md`. Rows 2–8 and next-queue ranks 8–12 are **known**. Reciting them as discoveries is FAIL.  
**Locks:** Overview → Orders → Customers → Spend → Goals. Growth and LTV stay chips. Flat **$39**. Empty is **—**. Order history only. Guests out of returning. Thin side (<8 identified buyers) is **—**. Do not paint competitor example-store figures. Do not invent Mcfly stars, installs, or review counts.

A $5M–$10M operator still pays Lifetimely, Peel, Triple Whale (order-history half), TrueProfit (order-history half), Putler, Repeat Customer Insights, and native Shopify Analytics for jobs the stored book can already answer. This memo is those jobs **after** compete rows 2–8 and ranks 8–12.

`OrderFact` stores `customerKey`, `orderedAt`, `amount`, `grossAmount`, `discountAmount`, `discountCode`, `sourceName`, `unitCount`, `lifetimeOrders`. It does not store country, a selling-plan bit, a refund timestamp, a gift-card flag, a title, or a POS location.

---

## Already ranked — do not recook, do not re-number

| Floor | Merchant sentence (already named) | State |
| ---: | --- | --- |
| Compete 2 | This month’s sales by buyer age (first bought this quarter vs a year) | Rank 11 queued |
| Compete 3 | New $ vs returning $ vs the same quarter last year | Rank 11 queued |
| Compete 4 | Later orders still on a discount, by starter class | Rank 12 queued |
| Compete 5 | Next wait after they already came back | `#172` merged on tip |
| Compete 6 | This year’s class beside last year’s at day 90 | Rank 12 queued |
| Compete 7 | Ticket by month of life | Rank 12 queued |
| Compete 8 | Which starter **month** gave the most back by day 90 | Rank 12 queued |
| Rank 8 | Whale 1 ticket; watchlist “N more”; RFM **flow** (Customer Grids snapshots) | Queued |
| Rank 9 | This month `$` by 1st/2nd/3rd/4th+ (“purchased X times as `$`”); first vs returning ticket; tax/shipping slice; period concentration; new vs returning hour; discount `$` vs last September; kept share vs last year; first vs returning discount depth; dollars per unit; `$0` reship count | Queued |
| Rank 10 | Guest checkout as **dollars**; source names inside Other; returns climbing on POS vs online | Queued |
| Rank 11 | Compete 2–3 + annual installed-base retention | Queued |
| Rank 12 | Compete 4/6/7/8 + launch-week **class** + orders per month of life | Queued |

**On the tip with `#172` (not a find):** quiet-then-back `$` of this period; copyable first-time `$`; next wait after they came back; median first→last + inter-order gap. Rank 8 whale ticket is the named next craft — not a find.

**On the tip, from orders (not a find):** promo LTV; source LTV (web / POS / Shop career); first-order discount depth; 30/90/365 worth + come-back; still-ordering heat; returning `$` for the open window; days to second; 1st→2nd **histogram**; 2nd vs 3rd+ **headcount**; first-ticket / first-basket tiers; path journeys when a name is on file; whale **lifetime** share + recency; RFM-lite **snapshot** (four labels); refund-honest net; predictive line; Goals sales/returning/LTV targets + implied identified buyers; next-month sales forecast; Slack-ready lines on some boards; Orders new-sales-share + blended AOV + **this-slice** code dollars + weekly returns; items/order; 2+ items **share**; Online vs POS mix; weekday **or** hour **blended** sales; same-clock **day** compare; spend-build `$` curves + retention **heat** in LTV depth.

HOLD already named (country, subscription-checkout bit, refund processing date, gift-card product flag, automatic discount titles, predicted spend tier, POS location, B2B company id): still HOLD. Not rediscovered below.

---

## How to read a row

| Mark | Meaning |
| --- | --- |
| **PASS** | Computable from orders already stored. Lands on a painted tab. No new field, no sixth tab. |
| **HOLD** | Inside the niche, and they sell it, and it needs a fact we do not store. |
| **REFUSE** | They only win by leaving order history. |

---

## STEAL (new — past the floor)

| # | Merchant sentence | Who sells it (2026 public page) | Mcfly tab | Verdict |
| ---: | --- | --- | --- | --- |
| 1 | Of people who reached a second order, how is the wait to the **third** spread — not one median. Same for 3rd→4th, and for every repeat. Draw the cumulative % so I can see when most repeats have already landed. | Lifetimely Time Between Orders (updated **2026-04-03**) | Customers → Growth | **PASS** |
| 2 | How many days from the **first checkout** to the third order — not the 2nd→3rd gap. | Peel Days since First Order (fetched 2026-09-22) | Customers → Growth | **PASS** |
| 3 | Of buyers who placed a **repeat** in June, what share placed another inside 30 / 60 / 90 / 180 / 365 days? That class is the month of the repeat, not the month of the first order. | Lifetimely Returning Customer Repurchase Rate (updated **2026-04-14**) | Customers → Growth | **PASS** |
| 4 | For each starter month, when does the second order actually land — month 0, 1, or 2 — not one shop histogram. | Triple Whale Customer Cohorts “2nd order only” (KB dated **2026-07-26**; university fetched 2026-09-22) | Customers → LTV | **PASS** |
| 5 | How many identified buyers placed their **first** order this month, versus the same month last year — a headcount, not new `$`. | Shopify **New customers over time** (customers reports, fetched 2026-09-22) | Overview | **PASS** |
| 6 | What was typical Shopify Total Sales **per order** in March, and in March last year — a 12-month AOV line, not this period’s two tickets. | Shopify **Average order value over time** (sales reports, fetched 2026-09-22) | Orders | **PASS** |
| 7 | Which **weekday × clock hour** cells carry this month’s dollars — a 7×24 grid, not a weekday bar **or** an hour bar. | Putler Sales Heatmap (features guide updated **2026-03-17**) | Orders | **PASS** |
| 8 | Saturday 2–3pm this month versus Saturday 2–3pm last year, shop-local. Same-clock today is a **day**. | Shopify Total sales over time **Group by hour / hour of day** + compare date ranges (sales reports + time-ranges, fetched 2026-09-22) | Orders + Overview | **PASS** |
| 9 | Identified buyers with **2+** orders who are late against this shop’s wait (plus a buffer) — headcount and their trailing dollars. Win-back today counts **one-order** buyers. | Repeat Customer Insights defection-via-latency (fetched 2026-09-22) | Customers → Growth | **PASS** |
| 10 | At this shop’s first→second wait, start holiday outreach this many days **before BFCM** — a named calendar minus the stored wait. | RCI holiday-latency article (fetched 2026-09-22); Shopify predefined **BFCM** range | Customers → Growth / Goals | **PASS** |
| 11 | Last 7 days: returning **orders** versus new **orders** (a ratio of counts), tracked week to week. Returning `$` mix is not that ratio. | Peel Home “Returning orders weekly (to New)” (RFM / Home, fetched 2026-09-22) | Overview | **PASS** |
| 12 | Of every identified buyer on the **stored book**, what share ever came back — not the 90-day Customers window, not last-year’s class ordering this year. | TrueProfit all-time Repurchase Rate (CLTV glossary, **2026-08-06**) | Customers → Growth | **PASS** |
| 13 | `WELCOME10` took how much of this September versus last September — the **named code**, not blended discount depth. | Shopify **Sales by discount codes** (sales reports, fetched 2026-09-22) | Orders | **PASS** |
| 14 | Of this month’s new `$` and returning `$`, how much was Online vs POS vs Shop. Source LTV is a career. Other **names** are rank 10. | Shopify Total sales by sales channel + New vs returning (fetched 2026-09-22) | Orders | **PASS** |
| 15 | This month, how much Shopify Total Sales sat on **one-unit** checkouts versus 2+ units — not items/order, not dollars per unit. | Shopify units-per-transaction / ordered quantity (sales reports, fetched 2026-09-22) | Orders | **PASS** |
| 16 | Of the identified lifetime book, how many buyers are A (carry ~80% of lifetime `$`), B (~15%), C (~5%) — not `$0–250` bands, not this month’s 50% count, not Whale 8. | Native Shopify **ABC** is product inventory (REFUSE titles). Customer 80/15/5 analog: RCI overall grade A–F (pricing, fetched 2026-09-22); Putler 80/20 language (features **2026-03-17**) | Customers | **PASS** |

Sixteen **PASS** rows. None is compete 2–8. None is ranks 8–12. None needs a new scope.

---

### 1. Wait histogram past the second order — PASS

Lifetimely, last updated **2026-04-03**, [Time Between Orders](https://help.useamp.com/article/645-time-lag-between-orders-report-walkthrough):

> Blue bars showing the % of repeat orders made within each time window  
> Pink line showing the cumulative % of repeat orders over time

The **Order frequency** dropdown is 1st→2nd, **2nd→3rd**, **3rd→4th**, and **all repeat orders**. Granularity 5 / 10 / 30 days. One-time buyers excluded.

Mcfly already paints a 1st→2nd cadence (`DAYS_BUCKETS` in `customers-analytics.ts`; `CustomerRetentionBoard`; Growth `growth-tt2.ts`). v416 `buildOrderSteps` stores **one median** `waitDays` per step (2nd→3rd consecutive; 4th+ is 3rd→4th only). `#172` adds median first→last and median inter-order gap — still one number. There is no bucketed 2nd→3rd (or all-repeat) histogram, and no cumulative “this is the day by which most repeats have already landed.”

A $5M Saturday operator times the second win-back from the 1st→2nd clock and then **stops**. The third order is where they stick (old rank 6). Without the 2nd→3rd spread they send the third-order note on the second-order cadence.

**Files:** `app/app/lib/customers-analytics.ts` (`DAYS_BUCKETS`, `daysToSecond`, `buildOrderSteps` waits); `app/app/lib/growth-tt2.ts`; `app/app/components/CustomerRetentionBoard.tsx`; `app/app/components/GrowthTt2Board.tsx`. Loader already has the book.

**Done when:** sealed 2nd→3rd and 3rd→4th (and optional all-repeat) buckets + cumulative %, 8-gap floor, guests out, history-limited buckets withheld not `$0`. Not v416’s one wait column. Not `#172`’s one median gap. Do not paint Lifetimely’s “most brands see 80%…” as this shop.

---

### 2. Days since first order to the nth — PASS

Peel [Days since First Order](https://help.peelinsights.com/docs/days-since-first-order) (fetched 2026-09-22):

> It's always from the first order, not from the previous order (that'd be interesting too)

They sell average days to the 2nd, 3rd, … **from checkout one**. Mcfly’s step wait is previous→next (`waitThird` = `sorted[2].t - sorted[1].t` in `buildOrderSteps`). A buyer who waited 40 days then 10 days is “10 days to the third” on the desk and “50 days from first to third” on Peel. Those are different Saturday sentences: “nudge before the **next** gap” vs “they are usually a three-order customer by day N after we met them.”

**Files:** `app/app/lib/customers-analytics.ts` `buildOrderSteps` (~310–318); Growth scoreboard wait column. Same book. Seal at 8 buyers who have lived that nth order. Young nth stays —.

**Done when:** first→2nd (already), first→3rd, first→4th as **elapsed-from-first** medians, labeled as such, next to (not replacing) consecutive waits. Not rank 12’s orders-per-month-of-life.

---

### 3. Repeat-month repurchase clocks — PASS

Lifetimely [Repurchase Rate Report](https://help.useamp.com/article/675-repurchase-rate-report-walkthrough), updated **2026-04-14**. New-customer lines (30/60/90/180/365 from **first** order) overlap the flagship 30/90/365 come-back (`ltv-flagship.ts` `windowRetention`) plus Growth 30/60. **Do not recook those.**

The second chart is a different grain:

> Of all the customers who repurchased in a specific month, what percentage came back to buy yet another time?

Cohort = month of a **2nd/3rd/4th** order. Then 30/60/90/180/365 to the **next**. Incomplete windows dashed. `#172` / compete 5 is the **wait** after they already came back (one shop number). Flagship retain is from the **first** order. Rank 12 day-90 is starter-month come-back.

A $5M store that ran a June sale of **existing** buyers needs: of the people who reordered in June, did they reorder again by September — or was June a one-and-done return.

**Files:** `app/app/lib/ltv-flagship.ts` `windowRetention` (first-order mature); `app/app/lib/customers-analytics.ts` (no repeat-month cohort); Growth `#172` wait. Compute from stored `orderedAt` sequence. Unpaid 90-day book stays — for 180/365.

**Done when:** for each month that sealed ≥8 identified repeat-orders, five clocks (or — when unelapsed). Guests out. Not compete 5’s one wait. Do not print Lifetimely’s consumable 20–25% “aim” as this shop.

---

### 4. Second-order offset by starter month — PASS

Triple Whale Customer Cohorts ([KB](https://kb.triplewhale.com/en/articles/5725663-customer-cohorts), dated **26 Jul 2026** on the next-compete fetch; [university](https://www.triplewhale.com/university/cohorts-cltv) fetched 2026-09-22). This pass: KB Cloudflare-blocked; university + search snippet confirm the **2nd order only** toggle:

> Analyze the most common 2nd purchase point for each cohort.

NCPA / Pixel stay REFUSE. Rank 12 is launch-week **worth** and **orders per month of life** (frequency), plus ticket by month of life. The missing sentence is: of January’s first buyers who reached a second order, did that second land in January, February, or March — a distribution **by class**, not the shop’s blended 1st→2nd histogram.

**Files:** `app/app/lib/growth-tt2.ts` / `daysToSecond` (blended); `app/app/lib/ltv-depth.ts` `monthKey` / `retentionHeat` (ordered **in** month offset, which is not “the second order’s offset”); `app/app/components/LtvRetentionHeat.tsx` (depth pack).

**Done when:** for each starter month with 8 identified seconds, share of those seconds in elapsed month 0 / 1 / 2 (unelapsed —). Guests out. Not rank 12’s cumulative orders-per-customer. Not UTM.

---

### 5. New-buyer headcount over time — PASS

Shopify [Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports) (fetched 2026-09-22):

> The New customers over time report displays how many new customers placed orders with your store.  
> You can select a unit of time in the Group by drop-down menu…

Compete 3 / rank 11 is **dollars** new vs returning vs the same **quarter**. `CustomerMixChart` already stacks new `$` / returning `$` and can show `firstTimeBuyers` inside the **Customers trailing window** (`mixDaily` / `mixWeekly` in `customers-analytics.ts`). Overview YoY (`overview-yoy.ts`) is Total Sales, not first-order headcount. Goals implied buyers (v421 / compete 21) is a **plan** ÷ typical order.

A $5M operator closing the year asks: did we **meet** fewer new buyers this September than last September, even if new `$` held because the ticket rose. That is a different Saturday than rank 11’s quarter-dollar compare.

**Files:** `app/app/lib/overview-yoy.ts`; `app/app/lib/customers-analytics.ts` `firstTimeBuyers` (window only); `app/app/components/CustomerMixChart.tsx`; Overview chart grain is `day | week | month | quarter` (`overview-sales-chart.ts`) with **sales**, not first-order counts.

**Done when:** month (and week) first-identified-order headcount for the open Overview year, vs last year when the book has it, — when last year is not on file, never `$0` / `0`. 8-buyer floor on a thin month. Guests out. Unpaid 90 stays honest. Not compete 3’s `$`.

---

### 6. AOV over time vs last year — PASS

Shopify [Average order value over time](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) (fetched 2026-09-22): Group by hour, day, week, month, quarter, year, hour of day, day of week, or month of year; compare date ranges. Their AOV formula is gross−discounts over orders (product revenue at placement). Rank 9 already names Mcfly typical as Shopify Total Sales per order and the tax/shipping slice — **do not rebuild Shopify’s AOV**. Rank 9’s two tickets are **this period**.

Mcfly paints one blended AOV for the picked window (`shopify-depth-stats.ts` `meanAov` / `medianAov`) and Goals year **sales** (`sales-goals.server.ts`), not a 12-month typical-order line vs last year.

A $5M store whose September Total Sales is flat with last September still changed the business if typical order fell and order count rose. They currently open native AOV over time to see it.

**Files:** `app/app/lib/shopify-depth-stats.ts`; `app/app/lib/orders-intelligence.ts` weekly `aov` (this period’s weeks, no prior year); `app/app/lib/sales-goals.server.ts` month sales not ticket. Same `OrderFact.amount` + order count.

**Done when:** monthly typical Shopify Total Sales per order for this year and last year (— if missing), labeled Total Sales per order, tax/shipping not stuffed into a fake Shopify AOV. 8-order floor. Not rank 9’s first vs returning **this month**.

---

### 7. Weekday × hour dollar grid — PASS

Putler [features 2026](https://www.putler.com/putler-features/) (posted 2026-02-25, **updated 2026-03-17**):

> Picture a grid. Days of the week down the left. Hours across the top. Every cell color-coded by revenue.

Shopify Total sales over time can Group by **hour of day** or **day of week**, one dimension at a time. Rank 9 is new vs returning **hour shares**. Mcfly `OrdersTimingChart` is a **toggle**: weekday bars **or** hour bars (`OrdersChartGrain`), with dollars = share × `windowSales` (`orders-scoreboard.ts` `buildOrdersChartBars`). There is no 7×24 cell.

A $5M POS+online Saturday operator staffs 2pm Tuesday and 7pm Saturday as different rooms. A 1D peak hour (blended across days) hides that.

**Files:** `app/app/lib/shopify-depth-stats.ts` `weekdayTotals` vs `hourTotals` (separate); `app/app/components/OrdersTimingChart.tsx` grain toggle; `shopLocalHour` already on the row.

**Done when:** 7×24 Shopify Total Sales cells for the picked period, shop-local, gate like hour stats, guests included in till (this is a till heatmap, not a returning split). Rank 9’s new vs returning hour stays that cook. No sessions. City stays HOLD.

---

### 8. Same-clock **hours** — PASS

Shopify sales reports: Total sales over time Group by **hour** / **hour of day**, “You can also compare data from different date ranges.” Time-ranges help (fetched via search 2026-09-22): compare visualization as dotted prior vs solid current; predefined ranges include **BFCM**.

v415 same-clock is the **day** (364-day weekday shift, shop-local clock, custom from/to). `overview-sales-chart.ts` uses `shopLocalHour` only to match **clock seconds** for that day compare (`shopLocalClockSeconds`). Orders hour mix has **no** last-year series.

A $5M store whose Saturday 2–3pm is half of last year’s 2–3pm has a staffing and promo problem that the daily same-clock total can hide (the rest of Saturday held).

**Files:** `app/app/lib/overview-sales-chart.ts` (~479–492); `app/app/lib/shopify-depth-stats.ts` `hourlySalesShare` (this window); `app/app/components/OrdersTimingChart.tsx`. Hour totals already summed; pair last year’s same weekday-hours when those days are on file, else —.

**Done when:** for the open period, 24 shop-local hours this year vs last year (same-clock rule as Overview days). Missing last year —. Never `$0`. Not rank 9’s new vs returning hour **shares**. ShopifyQL stays HOLD — this is `OrderFact.orderedAt`.

---

### 9. Late 2+ buyers vs this shop’s wait — PASS

Repeat Customer Insights [Detecting customer defection with Customer Purchase Latency](https://www.littlestreamsoftware.com/articles/defection-latency/) (fetched 2026-09-22): RFM recency can lag because a buyer must fall into the lower recency band of the **whole base**. Latency + a **10%–50% buffer** past average wait is the earlier signal. Their example-store day counts are **not** copied here.

Mcfly win-back (`saveNowOneOrder`) **continues** only `rec.times.length !== 1` (`customers-analytics.ts` ~810–816). RFM hibernating is last order **>90 days** (`customers-rfm.ts` `RFM_HIBERNATE_DAYS = 90`) — rank 8 is flow of that snapshot, not this grain. `#172` is people who **already spent this month** after going quiet.

The missing stock: identified **2+** buyers whose days-since-last > this shop’s typical inter-order wait (or their own median gap when they have 3+), plus a small buffer; **headcount + trailing-12 (or book) `$`**, opaque keys off the desk. A $5M operator’s “who is late this Saturday” is not the one-order fall-off count and not last month’s Champions who are At risk (rank 8).

**Files:** `app/app/lib/customers-analytics.ts` `saveNowOneOrder`; `app/app/lib/customers-rfm.ts` hibernate 90; `#172` quiet-back `$` (on the tip, different). No name/email. No Klaviyo export.

**Done when:** sealed 8 such late 2+ buyers: count + their stored `$` (lifetime or trailing-12 when the book covers it). Unpaid 90: — for “trailing-12.” Guests out. Buffer labeled as this shop’s wait, not an industry 50-day. Rank 8 still owns RFM **flow**.

---

### 10. Holiday start from first→second wait — PASS

RCI [Using customer behavior data to decide when to start your holiday marketing](https://www.littlestreamsoftware.com/articles/using-customer-behavior-data-to-decide-when-to-start-your-holiday-marketing/) (fetched 2026-09-22): use **1st→2nd** latency; a range of about 100%–150% of that wait **before** the event (they name Black Friday). Shopify’s compare UI documents **BFCM** as a predefined range (time-ranges help, search fetch 2026-09-22).

Mcfly already has typical days-to-second and copy (`daysToSecondSlackInsight`). It never names **BFCM (or the shop’s next named peak) minus that wait**. Goals forecasts next **calendar** month from typical day. Rank 12 launch-week is a **starter class**, not “start talking this many days before the event.”

A $5M operator who opens RCI every August for this one sentence will not keep $39 if Growth only says “typical wait is N days.”

**Files:** `app/app/lib/growth-tt2.ts`; `app/app/lib/shareable-insights.ts` `daysToSecond`; Goals forecast (`order-history-forecast.ts`) has no BFCM. Copy one Growth/Goals line when typical wait seals: “First→second wait is N days. Holiday outreach that wants a second order by BFCM starts about … before.” Use Shopify’s BFCM window as the named date, shop-local. No Slack product. No industry 14-day example as this shop.

**Done when:** copyable sentence on Growth (and Goals if the year board is the holiday plan) when wait seals; — when it does not. Public `/demo` and Admin match.

---

### 11. Returning-order count vs new-order count (7-day) — PASS

Peel [RFM Analysis & Home Page](https://help.peelinsights.com/docs/rfm-analysis) (fetched 2026-09-22):

> Returning orders weekly (to New) — This is the percentage of orders from returning customers compared to the number of orders from new customers. The value is based on the average of the past 7 days.

v413 returning **`$`** mix (`mixDaily` / `mixWeekly`) is dollars. Compete 3 is quarter **`$`**. Rank 9 is this month’s `$` by order number. Peel’s north star is a **count ratio** of returning orders ÷ new orders, last 7 days, as a trend.

A $5M store can grow returning **dollars** while returning **order count** vs new collapses (bigger returning tickets, fewer coming back). They currently open Peel Home for that mix.

**Files:** `app/app/lib/customers-analytics.ts` mix is `$` + `firstTimeBuyers`, not returning-order **count** / new-order **count**; Overview glance is Total Sales. Same `buyerKind` / `orderIsReturning` already used.

**Done when:** last-7-shop-days ratio (and a short spark vs prior weeks), 8-order floor, guests out of returning counts, unknown lifetime not stuffed into new. Missing days —. Not compete 3. Not rank 9’s 1st/2nd/3rd `$`.

---

### 12. Book-wide repurchase rate — PASS

TrueProfit [CLTV metric glossary](https://helpdesk.trueprofit.io/en/articles/15173499-customer-lifetime-value-metric-glossary) (**6 Aug 2026**):

> Repurchase Rate = (Number of Repeat Customers / All-time Customers) × 100  
> A repeat customer is someone who has placed 2 or more paid orders.

They also define a **period-censored** rate for new customers inside the selected range — different, and easy to lie with on a 90-day unpaid book.

Mcfly `everRepeatShare` is `repeatBuyers / identifiedBuyers` inside `buildCustomerAnalytics`’s **rolling window** (file header: ~90 days SAMPLE / ~60 fresh live). Growth “Repeat rate” reads that. Rank 11 annual base is: of **last year’s** identified buyers, who ordered **this year**. TrueProfit’s all-time rate is: of everyone on the stored book, who ever has 2+.

A $5M paid 24-month book and a trial 90-day book must not share one “repeat rate” that looks finished. That is the coverage class of lie, on loyalty.

**Files:** `app/app/lib/customers-analytics.ts` ~1–8, ~819–821; `app/app/components/GrowthScoreboard.tsx` “Repeat rate”; `LIVE_UNPAID_INGEST_DAYS = 90`. Use the **order book** passed into Growth/LTV, disclose 90 vs 24, 8-buyer floor, guests out, unknown lifetime not in the denominator as one-time.

**Done when:** one sealed % labeled as this book (90 closed days vs up to 24 months), never a fake all-time on a 90-day till. Not rank 11’s year-class retention. Pixel CAC off this sentence.

---

### 13. Named-code dollars vs last September — PASS

Shopify [Sales by discount codes](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) (fetched 2026-09-22): sales grouped by discount **name** / **code**; automatic discount **title** is its own field. Rank 9 is **blended** discount `$` / depth vs last September. v414 `buildOrdersCodeMoney` ranks named codes for **this slice** (`orders-intelligence.ts` ~661–721) with new vs returning `$` **inside the slice**. There is no `WELCOME10` this September vs `WELCOME10` last September.

Compete 4 / rank 12 is later orders still on a discount **by starter class**. Different sentence.

**Files:** `app/app/lib/orders-intelligence.ts` `buildOrdersCodeMoney`; weekly `codeDollars` this period only. Codes stay names (`WELCOME10` is not 10%). Automatic titles HOLD. Missing last year —. Combinable-code double-count: say so or keep first named code only (what we store).

**Done when:** top sealed named codes, this month vs same month last year, Shopify Total Sales on those orders (or —). 8-order floor per code to paint a YoY. Not rank 9’s blended depth.

---

### 14. This month’s new vs returning `$` by source — PASS

Shopify Total sales **by sales channel** sits next to New vs returning customers. Mcfly `sourceSalesShare` is blended period mix (`shopify-depth-stats.ts`). `buildLtvBySource` (`ltv-by-source.ts`) is **first-order** source → **career** LTV. Rank 10 is guest **`$`**, Other **names**, returns drag by source.

Missing: this month’s new `$` and returning `$` split Online / POS / Shop / Other. A $5M omnichannel book whose POS is almost all returning and whose online is almost all first-time will fire the wrong team if they only have career source LTV and a blended source bar.

**Files:** `app/app/lib/ltv-by-source.ts`; `app/app/lib/shopify-depth-stats.ts` `classifyOrderSource` / `sourceSalesShare`; rank 10 source bar. `OrderFact.sourceName` + stored book for returning.

**Done when:** four sources × new/returning `$` for the picked period, 8-order floor per cell or —. Guests out of returning. Draft/staff strings stay Other (names = rank 10) unless the **clock** is wrong — not this steal. No POS drawer tape. No UTM.

---

### 15. One-unit vs 2+ unit **dollars** this month — PASS

Shopify sales reports define **Units per transaction** = net quantity / orders, and **Ordered quantity**. Rank 9 is **dollars per unit** and `$0` reship **count**. Mcfly `meanUnitCount` and `multiUnitOrderShare` (`shopify-depth-stats.ts` ~492–501) are **order share**, painted as “Orders with 2+ items” (`orders-scoreboard.ts`). `unitCount` is on `OrderFact`.

A $5M shop can have a healthy 2+ **order** share while almost all **dollars** still sit on one-unit checkouts (cheap add-on units). They currently CSV for that.

**Files:** `app/app/lib/shopify-depth-stats.ts` `multiUnitOrderShare`; `app/prisma/schema.prisma` `OrderFact.unitCount`. Dash when `unitCount` not crawled. Not a title. Not ShopifyQL.

**Done when:** period Shopify Total Sales on rows with `unitCount === 1` vs `unitCount >= 2` (unknown unitCount its own bar or —). 8-order floor. Not rank 9’s dollars-per-unit.

---

### 16. Lifetime A / B / C of identified buyers — PASS

Native Shopify [ABC inventory analysis](https://help.shopify.com/en/manual/products/inventory/abc-analysis) (search fetch 2026-09-22) grades **product variants** on last-28-day revenue (A ~80%, B ~15%, C ~5%), with **title / SKU / cost**. That report is **REFUSE** (titles + inventory + COGS). The megaprompt named ABC because operators still open it; the steal is the **80/15/5 grain on identified buyers**, which Repeat Customer Insights sells as overall grade **A–F** ([pricing](https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/pricing/), fetched 2026-09-22) and Putler describes as 80/20 on customers ([features](https://www.putler.com/putler-features/), 2026-03-17). Putler **this-period** top 20% is rank 9 — do not recook.

Mcfly spend bands are **fixed dollar cuts** (`$0–250` … `$5k+` in `customers-analytics.ts` ~440–447). Whale watch is **8 people with 5+ orders** (rank 8 adds ticket). Rank 9 is how many buyers made **50% of this month**. Nobody asks: of the **lifetime book**, how many opaque buyers are A (cumulative ~80% of identified lifetime `$`), B, C.

A $5M operator’s board meeting is “how concentrated is the **file**,” not “how concentrated was September” and not “name the eight whales.”

**Files:** `app/app/lib/customers-analytics.ts` `SPEND_BANDS`; `app/app/lib/customers-rfm.ts` `WATCHLIST_MAX`; `app/app/lib/shopify-depth-stats.ts` `topCustomerSalesShare` (this **window**, 10% share — rank 9). Sort identified lifetime `$` on the stored book.

**Done when:** A/B/C headcount + `$` + share of identified lifetime sales, 8-buyer floor, guests out, unpaid 90 labeled as this book not all-time. No names. No product ABC. No industry 80/20 as a benchmark — compute this shop.

---

## HOLD (new — not floor HOLDs restated as finds)

| Merchant sentence | Who sells it | Missing fact |
| --- | --- | --- |
| Native ABC **product** grade (title, SKU, ending qty, cost) | [ABC inventory analysis](https://help.shopify.com/en/manual/products/inventory/abc-analysis); inventory reports last 28 days | Titles + inventory + cost. Customer 80/15/5 is PASS 16. |
| Sales by customer **name / email** list | [Sales by customer name](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report); Returning / One-time customers reports | Person list. Anonymous period rank is too close to rank 9’s 50%/top-decile **share**; do not add a named list. |
| Predicted spend tier / cohort “Show projections” | [Predicted spend tier](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports) | Their model, not a stored order fact. Person-level list REFUSE. |
| Subscription vs one-time **checkout** `$` | Shopify Subscription vs one-time sales; Peel subscription cohort list | Checkout bit not on `OrderFact`. Recharge MRR REFUSE. |
| Which POS **location** hour is the open register | Shopify retail / sales by POS location | `sourceName` is web/pos/shop, not location. |
| Automatic discount **title** YoY | Sales by discount codes “Automatic discount title” | We store code, not title. Named **code** YoY is PASS 13. |
| Bundle as a first-order class | Shopify Bundle reports | Line identity / bundle flag. |
| Return **reason** / reversed **quantity** | Sales reports terminology through **2026-05-01** (reversals vs physical returns) | We store dollar gross vs net, not line reasons. |
| First-order **weekday** as a come-back class | Shopify New vs returning Group by day of week (that grouping on **this month’s orders** is rank 9) | Computable (`orderedAt` of first) — only HOLD if we refuse to split a second weekday chart from rank 9. Prefer PASS as file-level on Growth, not a 17th steal, if the synthesizer wants fewer ranks: first-order weekday → 90-day come-back. Not listed in the steal table to avoid colliding with rank 9’s hour/weekday **of this month’s orders**. |

Floor HOLDs remain HOLD: country, subscription-checkout bit, refund **processing** date, gift-card **product** flag, automatic discount titles, product title/SKU, order rows past 24 months, product subtotal vs Total Sales, Whale→Admin door, million-order crawl as shipped, VAT-out, Stripe/PayPal time zones, ShopifyQL, POS drawer tape, B2B company id.

---

## REFUSE

They win these by leaving the niche. Do not put them on a tab.

| They sell it | Where fetched 2026-09-22 | Why it is out |
| --- | --- | --- |
| Pixels, MTA, UTM path credit, NCPA, ncROAS, ad CAC | Triple Whale cohorts intro (NCPA); TrueProfit glossary CAC / LTV:CAC (6 Aug 2026); Peel returning revenue **by channel** (“only if you connect your ad spend”); Shopify Total sales by **referrer** | Path credit. Spend on Mcfly stays typed or pasted. |
| Daily P&L, COGS, gross profit, ABC **cost** column | TrueProfit Net Profit formula; Peel Gross Margin; Shopify ABC “Total value (cost)” | Cost book. |
| Recharge / Skio / Bold MRR, churn, active subscribers | Peel subscription cohort list; Triple Whale Recharge integration; Shopify Active/Canceled subscriptions over time | Subscription-app census. Checkout bit is HOLD. |
| Amazon, Etsy, eBay, PayPal/Stripe as a second ledger | Putler 17+ sources (features 2026-03-17); Lifetimely Amazon add-on (floor) | Off Shopify. |
| Sessions, conversion, GA4, Search Console, Live View “customer behavior” | Putler web analytics; Shopify Live View; Shopify referrer reports | Not order history. |
| Person profiles, name, email, city, RFM **customer list**, Klaviyo/CSV | Shopify Returning / One-time / RFM customer list; Putler customer profiles; Peel Audiences → Klaviyo; RCI export | Opaque keys. |
| Product-title / SKU journeys, product 80/20, market basket of named SKUs | Lifetimely Product Journey (3 Apr 2026); Shopify Total sales by product; Peel Market Basket | Titles stay off Live. SAMPLE must not invent a catalog. |
| Industry benchmarks (“aim 20–25% 90-day RPR”, “30% LTV by month three”) | Lifetimely repurchase walkthrough; Triple Whale university cohorts | A number we did not compute from this shop. |
| Gift-card **liability** / adding gift card sales into profit | TrueProfit Net Profit; Shopify outstanding gift card finance report | Liability book. |
| Order-volume / extra-order pricing ladders | Floor memo | Flat $39. |
| Sixth tab, Snowflake, Copilot-as-product, Profit Agent | Peel / Putler / Lifetimely floor | Five painted tabs stay. |
| Example-store figures from any of the above pages | — | Not a Mcfly number. Not a painted benchmark. |

Customer tags / order tags stay a **note**, not a row (PII risk).

---

## Surfaces walked (so this is not only Customers)

| Surface | What they still sell from orders that this tip + ranks 8–12 do not paint | Outcome |
| --- | --- | --- |
| Overview | New-buyer **headcount** vs last year (5); 7-day returning/new **order** ratio (11); same-clock is a day not an hour (8) | PASS |
| Orders | AOV over time (6); 7×24 heatmap (7); hourly same-clock (8); named-code YoY (13); new vs returning `$` by source (14); 1-unit vs 2+ `$` (15) | PASS |
| Customers Growth | 2nd→3rd wait histogram (1); days-from-first to nth (2); repeat-month RPR clocks (3); late 2+ stock (9); BFCM-minus-wait copy (10); book-wide RPR (12) | PASS |
| Customers LTV / RFM | Second-order offset by starter month (4); lifetime A/B/C (16). Rank 8 still owns RFM **flow**. Rank 12 still owns launch-week class / ticket-by-age / starter-month refunds. | PASS |
| Spend | Pixel CAC, ncROAS | **REFUSE**. No new Spend steal. |
| Goals | Holiday-start copy may mount here (10). Implied buyers already on v421. | With 10 |
| Phone / copy | New sentences need a copyable line on the same board. | Ship with the cook |
| `/demo` vs `/app` | Mount the same board. | Constraint |

Native reports named in the megaprompt:

| Native report | This memo |
| --- | --- |
| Hourly sales (Total sales over time Group by hour / hour of day) | PASS 7 (grid) + PASS 8 (vs last year). This-window hour **mix** is already on Orders; rank 9 owns new vs returning hour. |
| Sales by customer | **REFUSE** names/email. Period **share** to 50% / top decile is rank 9. Not a named list. |
| ABC | Native = **product inventory** → REFUSE. Customer 80/15/5 of the **lifetime book** → PASS 16. |
| Customers who purchased X times | Rank 9 as **`$`**. Headcount frequency already on `OrdersFrequencyChart` + Customers value bands. Reciting it is FAIL. |

---

## Top merchant sentences (new)

1. Show the wait to the **third** order as a spread and a cumulative %, not one median.
2. Days from first checkout to the third order — not 2nd→3rd.
3. Of people who reordered in June, what share ordered again inside 90 days.
4. For January’s class, when did the second order actually land.
5. How many new identified buyers this month versus last year — a headcount.
6. Typical order by month this year versus last year.
7. Which weekday×hour cells carried this month.
8. This Saturday 2pm versus last year’s Saturday 2pm.
9. How many 2+ buyers are late against this shop’s wait, and what they spent.
10. At this wait, holiday outreach that wants a second order by BFCM starts on this day.
11. Last 7 days, returning orders versus new orders.
12. Of everyone on this book, what share ever came back — and this book is 90 days or 24 months.
13. `WELCOME10` this September versus last September.
14. This month’s new `$` and returning `$` by Online / POS / Shop.
15. This month’s dollars on one-unit checkouts versus 2+.
16. How many identified buyers are A / B / C of the lifetime file.

---

## Why these are not nits

Each one is a Saturday sentence a $5M operator currently leaves the desk to answer. File evidence above. None is padding, none restates ranks 7–12, none is Mix-close opening weekday.

---

## Sources fetched 2026-09-22

- https://help.useamp.com/article/645-time-lag-between-orders-report-walkthrough (updated 3 Apr 2026)
- https://help.useamp.com/article/675-repurchase-rate-report-walkthrough (updated 14 Apr 2026)
- https://help.useamp.com/article/1288-understanding-retention-vs-repeat-purchasing-in-lifetimely (updated 3 Apr 2026) — **skip** “purchased X times as `$`” (rank 9)
- https://help.useamp.com/article/669-product-journey (updated 3 Apr 2026) — REFUSE titles
- https://help.peelinsights.com/docs/days-since-first-order
- https://help.peelinsights.com/docs/cohorts-retention-definitions-1
- https://help.peelinsights.com/docs/repurchase-rate-1.md
- https://help.peelinsights.com/docs/rfm-analysis
- https://help.peelinsights.com/docs/weekly-quarterly-cohorts — launch-week is rank 12
- https://kb.triplewhale.com/en/articles/5725663-customer-cohorts (dated 26 Jul 2026 on prior fetch; Cloudflare-blocked this pass)
- https://www.triplewhale.com/university/cohorts-cltv
- https://www.triplewhale.com/blog/customer-retention-analytics (listed; NCPA REFUSE)
- https://helpdesk.trueprofit.io/en/articles/15173499-customer-lifetime-value-metric-glossary (6 Aug 2026)
- https://helpdesk.trueprofit.io/en/articles/11324705-dashboard-metric-glossary (6 Aug 2026) — Purchase Frequency / period RPR; pixel CAC REFUSE
- https://www.putler.com/putler-features/ (updated 17 Mar 2026)
- https://www.putler.com/ecommerce-analytics/ (updated 21 Sep 2026)
- https://www.littlestreamsoftware.com/articles/defection-latency/
- https://www.littlestreamsoftware.com/articles/using-customer-behavior-data-to-decide-when-to-start-your-holiday-marketing/
- https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/average-customer/ — Average Lifetime is `#172`
- https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/pricing/
- https://www.littlestreamsoftware.com/articles/customer-grids/ — **skip** (rank 8)
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report (reversals terminology through 1 May 2026)
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/time-ranges
- https://help.shopify.com/en/manual/products/inventory/abc-analysis
- https://www.shopify.com/blog/cohort-retention-analysis (22 May 2026) — retention **curve** vs blended average; Mcfly heat + `$` curves already in LTV depth; weekly increments are rank 12

**Not edited:** app code, site, listing paste. Research doc only.  
**Not claimed:** competitor example-store figures, their install counts, their GMV, Mcfly stars, Mcfly installs.
