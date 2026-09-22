# Next compete — past rows 1–8

**Lane:** Research only. One file. No `app/` edits, no Fly, no PR, no cook.  
**Fetched:** 2026-09-22.  
**Tip this memo is scored against:** `origin/cursor/spend-trust-recurring` @ `b6c4073` (scoreboard Fly note: v415 / merge `dd865c3` of #157 same-clock / Live **PARKED**). Rank 6 (third-order ticket / wait / reach) is the named next ship. Same-clock is on the tip.  
**Floor:** `origin/cursor/enterprise-compete-5bc6` `docs/ops/research/2026-09-22-ENTERPRISE_COMPETE.md`. Rows 1–8 there are **known**. Reciting them as discoveries is FAIL.  
**Locks:** Overview → Orders → Customers → Spend → Goals. Growth and LTV stay chips. Flat **$39**. Empty is **—**. Order history only. Guests out of returning. Thin side (<8 identified buyers) is **—**. Do not paint example-store figures, install counts, or GMV claims as Mcfly numbers. Do not invent Mcfly stars.

A $5M–$10M operator still pays Lifetimely, Peel, Triple Whale (order-history half), TrueProfit (order-history half), Putler, Repeat Customer Insights, and native Shopify Analytics for jobs the stored book can already answer. This memo is those jobs **after** the known eight.

---

## Known — do not recook, do not re-number

| Floor | Merchant sentence (already named) | State |
| ---: | --- | --- |
| 1 | Ticket and wait at 1st / 2nd / 3rd / 4th+ | Rank 6, queued. Not a find. |
| 2 | This month’s sales by buyer age (first bought this quarter vs a year) | Still-PASS. Not a find. |
| 3 | New $ vs returning $ vs the same quarter last year | Still-PASS. Not a find. |
| 4 | Later orders still on a discount, by starter class | Still-PASS. Not a find. |
| 5 | Next wait after they already came back | Still-PASS. Not a find. |
| 6 | This year’s class beside last year’s at day 90 | Still-PASS. Not a find. |
| 7 | Ticket by month of life | Still-PASS. Not a find. |
| 8 | Which starter **month** gave the most back by day 90 | Still-PASS. Not a find. |

HOLD already named on that floor (country, subscription-checkout bit, refund processing date, gift-card product flag): still HOLD. Not rediscovered below.

On this tip, already painted from orders: promo LTV, source LTV (web / POS / Shop), first-order discount depth, 30/90/365 worth, still-ordering heat, returning **dollars** for the open window, days to second, 2nd vs 3rd+ **headcount**, first-product / first-ticket / first-basket **tiers**, path journeys when a name is on file, whale **lifetime** share + recency, RFM-lite **snapshot**, refund-honest net on the LTV card, predictive line, Goals sales/returning/LTV targets, next-month **sales** forecast from typical day, Slack-ready lines on some boards, Orders new-sales-share + blended AOV + code dollars + weekly returns, items/order, 2+ items, Online vs POS mix, weekday/hour **blended** sales.

`OrderFact` stores `customerKey`, `orderedAt`, `amount`, `grossAmount`, `discountAmount`, `discountCode`, `sourceName`, `unitCount`, `lifetimeOrders`. It does not store country, a selling-plan bit, a refund timestamp, a gift-card flag, a title, or a POS location.

---

## How to read a row

| Mark | Meaning |
| --- | --- |
| **PASS** | Computable from orders already stored. Lands on a painted tab. No new field, no sixth tab. |
| **HOLD** | Inside the niche, and they sell it, and it needs a fact we do not store. |
| **REFUSE** | They only win by leaving order history. |

Same-clock compare is on the tip. Rank 6 is in flight. Neither is listed as a steal.

---

## STEAL (new — past the floor)

| # | Merchant sentence | Who sells it (2026 public page) | Mcfly tab | Verdict |
| ---: | --- | --- | --- | --- |
| 9 | Of this month’s Shopify Total Sales, how much was a first order, a second, a third, or a fourth-or-later — not how old the buyer is. | Lifetimely repeat-purchasing `$` / “customers who purchased X times”; Peel “Customers per Count of Days with Order” | Orders | **PASS** |
| 10 | This month the first-time ticket and the returning ticket are not the same number. Show both, not one blended AOV. | Shopify Average order value + New vs returning; Triple Whale 1st-order cell vs later LTV; TrueProfit AOV = Revenue / Orders | Orders | **PASS** |
| 11 | People who had gone quiet spent how much of this month when they came back? Win-back on Growth is a one-order **count**. | Putler “haven’t ordered in 60+ days who used to buy”; Shopify RFM “Previously loyal” | Customers → Growth | **PASS** |
| 12 | Last month these people were Champions. This month they are At risk. The RFM board is a snapshot. | Repeat Customer Insights Customer Grid historic snapshots; Shopify 2026 cohort+RFM note | Customers (RFM-lite already there) | **PASS** |
| 13 | Launch week’s first buyers — worth and come-back at day 90 — versus the week after. Starter **month** is floor row 8. | Peel weekly cohorts; Triple Whale week timeframe; Shopify 2026 weekly increments | Customers → LTV | **PASS** |
| 14 | In month four after the first order, how **often** did they order — not how big the ticket was. Ticket-by-age is floor row 7. | Peel “Orders per Customer” (cumulative) and “Number of Orders per Month”; Lifetimely “Cohort Transactions %” | Customers → LTV | **PASS** |
| 15 | How many identified buyers made half of **this month’s** sales? Whale watch is lifetime share. | Putler Home “top 20% customers by revenue”; Putler 2026 ecommerce guide 80/20 customers | Orders (period) + Customers whale stays lifetime | **PASS** |
| 16 | How long does a customer last here — first order to last order — not only first to second. | Repeat Customer Insights Average Lifetime + Average Latency | Customers → Growth | **PASS** |
| 17 | Returning buyers order at a different hour than first-time buyers. The weekday/hour chart is one blended mix. | Shopify New vs returning grouped by hour of day / day of week; Putler sales heatmap (total, they still sell the grain) | Orders | **PASS** |
| 18 | Of last year’s identified buyers, what share ordered again this year? That is the installed base, not new-vs-returning **dollars** this quarter. | Shopify yearly cohort intervals; Lifetimely existing-base repurchase | Overview + Customers → Growth | **PASS** |
| 19 | This month we kept what share of gross versus last September? Weekly returns climbing is not that close. Refunds **by starter month** is floor row 8. | Shopify sales reports (gross / reversals / Total sales); Peel Gross Sales by Cohort | Orders | **PASS** |
| 20 | This month, first orders took more off than returning orders — or they didn’t. Overall full-price vs discounted is a craft peek, not this split. Floor row 4 is later codes **by starter class**. | Shopify Discounts on sales reports; Lifetimely discount-code filters on repurchase | Orders | **PASS** |
| 21 | To hit the sales plan at this typical order I need this many identified buyers. Goals already forecasts **dollars**. | Putler Customer Forecast (2026 features); TrueProfit Purchase Frequency = Orders / Unique customers | Goals | **PASS** |

Thirteen **PASS** rows. None is floor 1–8. None needs a new scope.

---

### 9. This month’s dollars by order number — PASS

Lifetimely, last updated 2026-04-03 on [Retention vs Repeat Purchasing](https://help.useamp.com/article/1288-understanding-retention-vs-repeat-purchasing-in-lifetimely):

> Repeat purchasing tells you how far they go.

They sell “Customers who purchased X times” as `$` or `#` — 2nd, 3rd, 4th, up to 8+. Peel’s [Customers per Count of Days with Order](https://help.peelinsights.com/docs/cohort-customers-per-count-of-days-with-order) (fetched 2026-09-22) is the same grain: columns are 1 order, 2 orders, 3 orders, “regardless of the time.”

Floor **row 1 / rank 6** is the **career ladder**: typical ticket, reach, and wait at each step for the shop as a whole. Floor **row 2** is **buyer age** (first bought this quarter vs a year ago). A year-old customer placing a second order is old on row 2 and “2nd” here. A Saturday operator closing a six-figure month asks: of the money that **hit this month**, how much was a first checkout versus a fifth. Those are different sentences.

Mcfly today: `aggregateOrderRows` (`app/app/lib/orders-intelligence.ts`) splits **new vs returning orders** and a **new sales share**. Returning is one bucket. `buildOrdersFrequency` buckets **buyers** by lifetime, not **this window’s dollars** by the rank of the order. Rank 6 will paint ticket/wait/reach, not this month’s cash mix.

**Files:** `app/app/lib/orders-intelligence.ts` (`aggregateOrderRows`, `buildOrdersIntelKpis`, `assembleOrdersIntelligence`); `app/app/components/OrdersIntelligence.tsx`; loader already sends `lifetimeOrders` + the stored book. Optional copy line on `SlackInsightCard`.

**Done when:** four sealed bars (1st / 2nd / 3rd / 4th+) for the picked period, Shopify Total Sales dollars, guests out, unknown lifetime as its own bar or —, never stuffed into 1st. Under 8 identified buyers in a step stays —. Public `/demo` and Admin `/app` mount it. Not a sixth tab. Not rank 6’s wait column.

---

### 10. First-time ticket vs returning ticket this period — PASS

Shopify’s [sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) (fetched 2026-09-22) define Average order value as its own report, next to Orders. [New vs returning customers](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports) is a **headcount**. Triple Whale’s [Customer Cohorts](https://kb.triplewhale.com/en/articles/5725663-customer-cohorts) (page dated July 26, 2026) paints a **1st order** LTV cell (first-order AOV of the class) beside later months. TrueProfit’s [dashboard glossary](https://helpdesk.trueprofit.io/en/articles/11324705-dashboard-metric-glossary) (updated August 6, 2026) states `Average Order Value = Revenue / Total Orders` — one blended number, which is why operators still open a second view for new vs returning.

Mcfly paints one AOV KPI and a new **sales share**. `OrdersIntelAgg` already has `newOrders`, `returningOrders`, and `newSales`. It does **not** keep returning sales or the two tickets. Overview’s returning peek is **dollars**, not ticket. LTV first-ticket **tiers** (`aovTiers` in `ltv-depth.ts`) answer “did a bigger first order come back,” not “what did this month’s returning checkouts ticket.”

**Files:** `app/app/lib/orders-intelligence.ts`; `app/app/components/OrdersIntelligence.tsx`; `app/app/components/OrdersFirstViewport.tsx` (lead peek next to typical order). Label both as Shopify Total Sales per order, not Shopify’s “gross − discounts / orders” formula (that needs product subtotal — already HOLD).

**Why a $5M store cares:** a blended $92 AOV can hide first-time $68 and returning $140. Promo weeks move the blend. The operator changes the offer, not the chart color.

---

### 11. Reactivation dollars this window — PASS

Putler’s 2026 [features guide](https://www.putler.com/putler-features/) (updated March 17, 2026) asks, as a merchant question: “How many customers haven’t ordered in 60+ days who used to buy monthly?” Shopify’s [RFM groups](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports) name Previously loyal and At risk as people with a strong history who went quiet.

Mcfly Growth win-back (`saveNowOneOrder` in `customers-analytics.ts`) is a **count of one-order buyers** past typical-days-to-second + 15. RFM-lite hibernating/at-risk shows **lifetime dollars sitting quiet**, not how much of **this month** came from people whose previous order was already past that shop’s wait. Floor row 5 is the **next wait after a second order**, not this month’s win-back cash.

**Files:** `app/app/lib/customers-analytics.ts` (`buildReturningMixPlays` already has a `winback` play — wrong grain); `app/app/components/CustomersGrowthSection.tsx`; `app/app/components/GrowthScoreboard.tsx`. Seal at 8 identified reactivated buyers. Gap vs that buyer’s own median wait when they have 3+ orders; else vs shop typical days-to-second. Guests out.

---

### 12. RFM flow, not a still photo — PASS

Repeat Customer Insights [Customer Grids](https://www.littlestreamsoftware.com/articles/customer-grids/): “Every month, a snapshot of your current Customer Grids is taken and saved… see how your customers are flowing between the different segments.” Shopify’s 2026 [cohort retention article](https://www.shopify.com/blog/cohort-retention-analysis) (May 22, 2026) tells merchants to combine RFM with a first-order month: track how many of a class have moved into Champions.

`buildCustomerRfm` (`app/app/lib/customers-rfm.ts`) scores **one** `windowEnd`. Four labels (Champions / At risk / New / Hibernating). No prior-month score, no flow. Shopify’s 11 groups and RCI’s 25-cell grids are more labels, not the job. The job is: of last month’s Champions, how many are At risk or Hibernating now, and what lifetime dollars moved. Export to Klaviyo / tags is REFUSE. Expanding to 11 names without flow is a nit.

**Files:** `app/app/lib/customers-rfm.ts` (score at as-of T and T−1 month from the same book); `app/app/components/CustomerRfmBoard.tsx`; `app/app/lib/desk-customers-page.server.ts`. Headcount + lifetime dollars. Opaque keys stay off the desk. 8-buyer floor.

---

### 13. Weekly first-order class at day 90 — PASS

Peel [Weekly & Quarterly Cohorts](https://help.peelinsights.com/docs/weekly-quarterly-cohorts.md): “find out what week brought in your most valuable customers or see if it was the weeks leading up to a promotional time of year… more valuable than the actual week of the promotion.” Triple Whale cohorts support a **Week** timeframe (weeks begin Monday). Shopify’s 2026 cohort article: high-frequency brands use **weekly** increments.

Floor **row 8** is which starter **month**. Floor **row 6** is this year vs last year at day 90, monthly. A launch week and the week after sit in the same calendar month. `ltv-depth.ts` groups only `cohortMonth` (`monthKey(first.orderedAt)`). Flagship windows are 30/90/365 on monthly classes.

**Files:** `app/app/lib/ltv-depth.ts` (`rollUpCustomers`, `monthKey`); `app/app/lib/ltv-flagship.ts` (`windowRevenue`, `windowRetention`); `app/app/components/CustomersLtvSection.tsx`. ISO week of first identified order. Worth and come-back at day 90. Seal a week at 8 buyers who have lived 90 days. Young week is —. Not SKU, not geo, not UTM (Peel offers those as add-ons — refuse).

---

### 14. Orders per customer by month of life — PASS

Peel [Orders per Customer](https://help.peelinsights.com/docs/orders-per-customer): “average number of orders per customer for each cohort. This report is cumulative.” Lifetimely’s retention article: **Cohort Transactions %** = “How frequently are active customers ordering?” Distinct from customer-level % retention.

Floor **row 7** is **ticket** (AOV) by month of life. Rank 6 is reach/wait/ticket **by order number**, not by calendar age. Mcfly `LtvBuildCurves` is **cumulative dollars**. `LtvRetentionHeat` is **share who ordered in that month offset**. Neither is “June starters averaged 0.3 orders in month 4.” High retention + low repeat (Lifetimely’s own matrix) is the $5M diagnosis: they came back once and stopped.

**Files:** `app/app/lib/ltv-depth.ts` (offsets already on `CustomerDepth.activeOffsets` / order list); `app/app/components/LtvBuildCurves.tsx` or a sister grain on the same LTV chip; `app/app/lib/ltv-flagship.ts`. Cumulative orders per buyer at elapsed offsets. Un-elapsed stays —. 8-buyer floor.

---

### 15. This month’s concentration — PASS

Putler Home (same 2026 features page): “Your top 20% customers and top 20% products by revenue” next to this month’s sales. [eCommerce analytics 2026](https://www.putler.com/ecommerce-analytics/): “the 20% of customers responsible for 80% of sales.” Product 80/20 needs titles — HOLD/refuse for Live. **Buyer** 80/20 of the **picked period** does not.

`whaleRecency` (`ltv-depth.ts`) is top **decile of lifetime dollars** across the depth book. A six-figure month can be many new buyers or three whales. Lifetime share does not say which. Period concentration is the close.

**Files:** `app/app/lib/orders-intelligence.ts` (period rows + `customerKey`); `app/app/components/OrdersIntelligence.tsx`; keep `LtvWhaleRecency.tsx` as lifetime. Report: identified buyers who made 50% of period Shopify Total Sales, and the top-decile share of the period. Guests out. Under 8 identified buyers in the window: —.

---

### 16. Average lifetime (first → last), not only first → second — PASS

Repeat Customer Insights [Average Customer](https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/average-customer/): Average Order Value, Average Orders per Customer, Average Lifetime Value, **Average Latency**, **Average Lifetime**.

Mcfly Growth paints typical **days to second**. Floor row 5 is wait **after** they already came back (2nd→3rd), queued as still-PASS. Neither is shop-wide **span from first order to last order** on file, nor mean/median gap across **all** consecutive pairs. RCI uses that latency to time holiday asks ([holiday marketing](https://www.littlestreamsoftware.com/articles/using-customer-behavior-data-to-decide-when-to-start-your-holiday-marketing/)). Industry-norm benchmarks on that page are REFUSE.

**Files:** `app/app/lib/customers-analytics.ts`; `app/app/components/GrowthScoreboard.tsx`; `app/app/components/CustomersGrowthSection.tsx`. Median days first→last among buyers with 2+ orders; median inter-order gap across all steps. Seal at 8 such buyers. Book shorter than the span stays honest (history-limited line), not a fake short life.

---

### 17. New vs returning hour and weekday — PASS

Shopify [New vs returning customers](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports) Group by: **hour of day**, **day of week**. Putler’s [sales heatmap](https://www.putler.com/putler-features/) is day × hour of **total** revenue — Mcfly already has a blended weekday/hour chart (`OrdersTimingChart`, `shopify-depth-stats.ts` `weekdaySalesShare` / `hourlySalesShare`). The missing job is the **split**: first-time vs already-bought.

A $5M POS+web shop staffs Saturday differently if returning buyers hit 10am and first-time hits 8pm. Blended peak hour lies.

**Files:** `app/app/lib/shopify-depth-stats.ts` (`shopifyDepthStats` already has `customerKey` + `orderedAt` + tz); `app/app/lib/orders-scoreboard.ts`; `app/app/components/OrdersTimingChart.tsx`. Two shares or a stacked bar. Same 5-day / hour gates. Guests out of the returning series. Unknown lifetime not painted as new.

---

### 18. Annual installed-base retention — PASS

Shopify customer cohort analysis: Intervals can be **year**; Comparison includes previous year. Lifetimely [Repurchase Rate walkthrough](https://help.useamp.com/article/675-repurchase-rate-report-walkthrough) (updated April 14, 2026) splits **new-customer** repurchase from **returning-customer** repurchase — the second chart is people who already had a repeat, but the merchant question underneath is “is the old base still buying.”

Floor **row 3** is new **dollars** vs returning **dollars** versus the same **quarter** last year. Floor **row 6** is first-order **classes** at **day 90**. This job: identified buyers whose first stored order is in the prior year, what share have an order in the current year. Headcount of the base, plus their dollars this year. A store can grow returning **dollars** from a shrinking loyal set if tickets inflate.

**Files:** `app/app/lib/customers-analytics.ts`; `app/app/components/OverviewYoyCards.tsx` or a Growth peek; `app/app/lib/overview-yoy.ts`. Need two years of identified first orders on file — unpaid 90-day slice stays — / not on file, never 0%. Paid 24-month book can seal. 8-buyer floor on last year’s base.

---

### 19. Period kept share (net vs gross) vs last year — PASS

Shopify [sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report): Total sales, gross sales, sales reversals. Reversals land on the **processing** day in Shopify — that clock is already HOLD (floor row 11). What we **can** say from stored `grossAmount` vs `amount` on the **placed** day: of orders placed this month, what share of gross is still on the net. Peel [Gross Sales by Cohort](https://help.peelinsights.com/docs/gross-sales-by-cohort): gross by months since first order, “does not include tax, shipping, discounts, or returns.” Floor **row 8** is which **starter month** refunded. v414 weekly `returnsClimbing` is week-over-week drag, not “this September vs last September we kept 94% vs 97%.”

**Files:** `app/app/lib/orders-intelligence.ts` (`ordersReturnDrag` already sums gross−net when every row has a gross); `app/app/components/OrdersIntelligence.tsx`; Overview year cards only if the sentence stays “placed-day net vs placed-day gross,” never “Shopify Total Sales clock.” Any missing gross → — , never a partial 0%.

---

### 20. First vs returning discount depth this period — PASS

Shopify sales reports: Discounts as a term on the collection of sales. Lifetimely repurchase filters by discount code. Floor **row 4** is whether a **starter class** still needs a code on **later** orders at the same age. Known still-PASS **phone chips** are overall full-price vs discounted typicals (`fullPriceMedianAov` / `discountedMedianAov` in `shopify-depth-stats.ts`). Neither answers: this month, first checkouts took X% off gross, returning checkouts took Y%.

`aggregateOrderRows` already walks `discountAmount` for a **blended** `discountDepth`. Split by `buyerKind` using the stored book.

**Files:** `app/app/lib/orders-intelligence.ts`; `app/app/components/OrdersIntelligence.tsx`. Codes stay names (`WELCOME10` is not 10%). Automatic titles stay HOLD. Missing discount field → —.

---

### 21. Buyer count to hit the Goals plan — PASS

Putler 2026 features: **Customer Forecast** beside revenue forecast. TrueProfit: `Purchase Frequency = Total Orders / Total Unique Customers` for a period ([glossary](https://helpdesk.trueprofit.io/en/articles/11324705-dashboard-metric-glossary), August 6, 2026). Mcfly Goals (`order-history-forecast.ts`, `OrderHistoryGoalsBoard.tsx`) forecasts **sales dollars** as typical day × days in next month, and tracks typed sales / returning-$ / LTV targets. It does not say: at this period’s typical order, the sales plan implies **N identified buyers**, or this period’s orders ÷ unique buyers (purchase frequency).

Spend/pixel CAC per new buyer stays REFUSE. This is order-history arithmetic on a painted Goals tab.

**Files:** `app/app/lib/order-history-forecast.ts`; `app/app/lib/sales-goals.ts`; `app/app/components/OrderHistoryGoalsBoard.tsx`; `app/app/routes/app.goals.tsx` + `demo.goals.tsx` (same board). Typical order from stored orders, not a fake $0. Empty spend stays off this sentence. Implied buyers = sales goal ÷ typical order when both exist; else —. Purchase frequency for the open Goals period next to it. 8-order floor already used on that board.

---

## HOLD (new — not floor 9–12 restated as finds)

| Merchant sentence | Who sells it | Missing fact |
| --- | --- | --- |
| Predicted spend tier / Shopify’s own future-amount-spent projection | [Predicted spend tier](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports); cohort “Show projections” (24 months of **their** model) | We have a written predictive LTV line from **this shop’s** 30/90/365. Copying Shopify’s tier scores is not on the order. Person-level predicted-spend **list** is refuse (name/email). |
| Which POS **location** tickets higher | Shopify retail / sales by POS location; Peel location segments | `sourceName` is web/pos/shop, not location. POS drawer tape stays HOLD from the cook queue. |
| B2B company vs D2C ticket | Shopify B2B sales explorations | Company id is not on `OrderFact`. |
| Reversed **quantity** and return **reason** | Shopify sales reports terminology update through 2026-05-01 | We store dollar gross vs net, not line reasons. |
| Bundle as a first-order class | Shopify Bundle reports | Needs line identity, not a title-free flag we store. |

Floor HOLDs remain HOLD: country, subscription-checkout bit, refund **processing** date, gift-card **product** flag, automatic discount titles, product title/SKU, order rows past 24 months, product subtotal vs Total Sales, Whale→Admin door, million-order crawl as shipped, VAT-out, Stripe/PayPal time zones, ShopifyQL.

---

## REFUSE

They win these by leaving the niche. Do not put them on a tab.

| They sell it | Where fetched 2026-09-22 | Why it is out |
| --- | --- | --- |
| Returning revenue by **UTM / ads channel**, MTA, NCPA, ncROAS | Peel [Returning Revenue by Channel](https://help.peelinsights.com/docs/revenue-by-channel-returning.md) (“only available if you connect your ad spend”); Triple Whale cohorts intro (CAC / NCPA); TrueProfit ncROAS | Path credit. Spend on Mcfly stays typed or pasted. |
| Daily P&L, COGS, gross profit, average order **cost** | TrueProfit glossary (Net Profit formula, Average Order Cost, Average Order Profit); Peel Gross Margin Amount/Rate; Lifetimely daily P&L on paid plans (floor memo) | Cost book. Goals “At {n}% profit margin” is a craft delete, not a steal. |
| Recharge / Skio / Bold MRR, churn, active subscribers | Peel subscription cohort list on [cohort-analysis](https://help.peelinsights.com/docs/cohort-analysis); Putler Home “subscription health / MRR” | Subscription-app census. Checkout bit is HOLD. |
| Amazon, Etsy, eBay, PayPal/Stripe as a second ledger | Putler 17+ sources, Amazon; Lifetimely Amazon add-on (floor) | Off Shopify. Stripe/PayPal TZ already HOLD. |
| Person profiles, name, email, city, Mailchimp/CSV of people, RFM **customer list** | Putler [customer profiles](https://www.putler.com/customer-profiles/); Shopify Returning customers / RFM customer list / One-time customers (name + email); RCI “export”; Peel Audiences → Klaviyo | Opaque keys. No CRM export. |
| Sessions, conversion, GA4, Search Console, Putler web analytics | Putler features § traffic; Shopify referrer/session reports (floor) | Not order history. |
| Industry benchmarks | RCI sequencing “Adobe, Shopify…” (floor); Lifetimely benchmarks | A number we did not compute from this shop. |
| Sixth tab, Snowflake, custom-report credits, Copilot as a product | Peel pricing/Snowflake (floor); Putler Copilot beta | Five painted tabs stay. |
| Product-title / SKU journeys, product 80/20, market basket of named SKUs | Lifetimely [Product Journey](https://help.useamp.com/article/669-product-journey) (Apr 3, 2026); Peel Market Basket; Putler product leaderboard | Titles stay off Live. SAMPLE must not invent a catalog. |
| Gift-card **liability** / adding gift card sales into profit | TrueProfit net profit (floor) | Liability book. Gift-card **product** flag is HOLD. |
| Order-volume / extra-order pricing ladders | Floor memo | Flat $39. |
| Post-purchase surveys, Fairing/Kno | Peel connectors (floor) | Not on the order. |
| Profit Agent that executes | Lifetimely journey (floor) | Agent, not a desk line. |

Customer tags / order tags stay a **note**, not a row (PII risk). Same as the floor memo.

---

## Surfaces walked (so this is not only Customers)

| Surface | What competitors still sell from orders that this tip does not paint | Outcome |
| --- | --- | --- |
| Overview | Annual base retention (row 18); not same-clock (shipped) | PASS on Overview + Growth |
| Orders | Rows 9, 10, 15, 17, 19, 20 | PASS |
| Customers Growth | Rows 11, 16, 18; rank 6 stays the ladder | PASS |
| Customers LTV / RFM | Rows 12–14; promo/source/first-ticket already on tip | PASS |
| Spend | Pixel CAC, ncROAS, NCPA payback | **REFUSE**. Cash CPA / payback already on tip. No new Spend steal. |
| Goals | Buyer count + purchase frequency next to the dollar forecast (row 21) | PASS |
| Phone / copy | New sentences need a copyable line on the same board. Not a separate steal. | Ship with the cook |
| `/demo` vs `/app` | Mount the same board. Craft scout owns demo-only holes. | Constraint, not a steal |

---

## Top merchant sentences (new)

1. Of this month’s Shopify Total Sales, how much was a first order, a second, a third, or a fourth-or-later.
2. Show this month’s first-time ticket and returning ticket — not one blended AOV.
3. Quiet buyers who came back: how much of this month is that cash?
4. Last month’s Champions who are At risk this month — dollars, not a still photo.
5. Launch week’s first buyers at day 90 versus the week after.
6. In month four, how often did they order — not how big the ticket was.
7. How many buyers made half of **this month**.
8. First order to last order: how long does a customer last here.
9. Returning buyers’ hour is not first-time buyers’ hour.
10. Of last year’s buyers, what share ordered this year.
11. This month we kept what share of gross versus last year.
12. First orders vs returning orders: who still needs the code **this month**.
13. To hit the sales plan at this typical order I need this many buyers.

---

## Sources fetched 2026-09-22

- https://help.useamp.com/article/1288-understanding-retention-vs-repeat-purchasing-in-lifetimely (updated Apr 3, 2026)
- https://help.useamp.com/article/675-repurchase-rate-report-walkthrough (updated Apr 14, 2026)
- https://help.useamp.com/article/699-ltv-drivers-walkthrough
- https://help.useamp.com/article/669-product-journey
- https://useamp.com/products/analytics/lifetime-value/
- https://kb.triplewhale.com/en/articles/5725663-customer-cohorts (July 26, 2026)
- https://www.triplewhale.com/blog/customer-retention-analytics
- https://www.triplewhale.com/university/cohorts-cltv
- https://helpdesk.trueprofit.io/en/articles/11330264-customer-lifetime-value-report
- https://helpdesk.trueprofit.io/en/articles/11324705-dashboard-metric-glossary (August 6, 2026)
- https://help.peelinsights.com/docs/cohort-analysis
- https://help.peelinsights.com/docs/cohort-customers-per-count-of-days-with-order
- https://help.peelinsights.com/docs/orders-per-customer
- https://help.peelinsights.com/docs/weekly-quarterly-cohorts.md
- https://help.peelinsights.com/docs/gross-sales-by-cohort
- https://help.peelinsights.com/docs/revenue-by-channel-returning.md
- https://help.peelinsights.com/docs/repurchase-rate-1.md
- https://www.putler.com/putler-features/ (updated Mar 17, 2026)
- https://www.putler.com/ecommerce-analytics/
- https://www.putler.com/customer-profiles/
- https://apps.shopify.com/repeat-customer-insights
- https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/
- https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/average-customer/
- https://www.littlestreamsoftware.com/articles/customer-grids/
- https://www.littlestreamsoftware.com/articles/using-customer-behavior-data-to-decide-when-to-start-your-holiday-marketing/
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report
- https://www.shopify.com/blog/cohort-retention-analysis (May 22, 2026)

**Not edited:** app code, site, listing paste. Research doc only.  
**Not claimed:** competitor example-store figures, their install counts, their GMV, Mcfly stars, Mcfly installs.
