# Enterprise compete — the layer after v409

**Lane:** Research only. One file. No app edits, no Fly, no merge.  
**Fetched:** 2026-09-22.  
**Tip this memo is scored against:** `cursor/spend-trust-recurring` @ `711ffa8` (Fly note on the scoreboard: v409 / `f0fa935` / Live **PARKED**).  
**Locks:** Painted IA is Overview → Orders → Customers → Spend → Goals. Growth and LTV are Customers chips, not a sixth tab. Flat **$39**. Empty is **—**, never $0 and never 0×. Order history only. No invented metrics, no invented Mcfly installs, no invented Mcfly stars.

**Job:** v409 is a morning desk. A multi-million-dollar operator still pays Lifetimely, Triple Whale, TrueProfit, Peel, or Repeat Customer Insights for the next questions, the ones that need the whole book of orders. This memo is that next layer. It is not a recap of work already on the tip.

A store’s annual revenue in dollars is **not claimed** on any pricing page fetched here. What is claimed is the order-volume bill those apps charge once volume is high. Mcfly stays $39 either way.

---

## Already on the tip — do not cook again

These 2026-09-22 steals are merged. Listing them as gaps would be the old memo.

| On the tip | Where |
| --- | --- |
| Open-lane starter value: promo LTV, source LTV (web / POS / Shop), named discount codes | `52f884b` on Customers → LTV |
| First-order discount depth (light / typical / deep) | `d00cf5b` inside the promo board |
| Spend paste cash trio: Total ROAS, Cash CPA, payback. Blank paste stays **—** | `c30d821` on Spend |

Also already on this tip, from the waves before that: cohort worth at 30 / 90 / 365, the still-ordering grid, returning dollars for the open window, days from first order to second, 2nd vs 3rd+ **buyer** mix, first-product worth, path journeys where a product name is already on the row, whale watch, refund-honest net on the LTV card, the written-out predictive line, Goals targets, next-month forecast, Slack-ready lines.

`OrderFact` today stores the order time, shop-currency amounts (current net and, when crawled, pre-refund gross), discount dollars, a discount code when Shopify sent one, `sourceName`, and unit count. It does not store country, a selling-plan bit, a refund timestamp, or a gift-card flag.

---

## What a large store is billed

Order count for “a $1M store” or “a multi-million store” is **not claimed**. The ladders below are what the public pages charge as monthly orders rise.

**Lifetimely** ([pricing.md](https://useamp.com/pricing.md), last updated 2026-09-22 on the page): paid plans are $49 (up to 500 orders), $149 (up to 3,000), $299 (up to 7,000), $499 (up to 15,000), $749 (up to 25,000), $999 (25,000+). Every paid plan includes “Customer journey tracking — repurchase rate, time between orders, buying patterns” and “CAC and payback period,” plus attribution and daily profit and loss. Amazon is an add-on at **+$75/month**. A 14-day trial is on the paid plans. Their marketing line “45,000+ stores” on the journey page is **their claim**, not a Mcfly fact.

**Peel** ([pricing](https://www.peelinsights.com/pricing), fetched 2026-09-22): Core starts at **$179/mo** on the annual rate (billed monthly) or **$199/mo** month-to-month. Essentials starts at **$449/mo** or **$499/mo**. The next starting price on the page is **$809/mo** or **$899/mo**, in the Accelerate slot of a table that names Core, Essentials, Accelerate, and Tailored. Tailored is “for business with more than 62,000 monthly store orders” and is sales-built; a dollar figure for Tailored is **not claimed**. The same fetch also rendered a slider line, “For 9000 orders billed monthly at $100,” next to “Your recommended plan is Tailored.” Those two lines disagree. This memo does not treat $100 as Peel’s price for 9,000 orders. Every plan on that page includes Shopify and Amazon, ad networks, Klaviyo, subscription connectors, and “30+ Cohort KPIs.”

**Repeat Customer Insights** ([Shopify listing](https://apps.shopify.com/repeat-customer-insights), fetched 2026-09-22): from **$59/month**. The Entrepreneur block is **$59/month** and includes “Order Sequencing (2 years)” and “Customer Cohorts (12 mo).” The listing then shows **$99/month** (order sequencing “all, 5 years,” cohorts “full history”) and **$249/month**. The plan switcher on the page reads “Entrepreneur Growth Peak.” Listing rating on that fetch: **5.0 (14)**. That is their listing, not a Mcfly number.

**TrueProfit** ([pricing](https://trueprofit.io/pricing), fetched 2026-09-22): Basic **$35/month** (300 orders, then $0.30 per extra order, maximum surcharge $300) includes Customer Lifetime Value. Advanced **$60/month** (600 orders, $0.20 per extra, maximum surcharge $500). The page also lists extra-order rates of $0.10 (Ultimate) and $0.07 (Enterprise) and order caps 1,500 and 3,500, and maximum surcharges $700 and $1,000. The monthly price of Ultimate and of Enterprise did not render as a clean figure on this fetch. **Not claimed.**

**Triple Whale** price on this pass: **not claimed**. This fetch used their cohort article, not a pricing page. Do not reuse a dollar from an older memo as if it were re-fetched today.

**Shopify Analytics:** $0. The reports below are the native jobs. Several of them are a configuration panel, a name-and-email list, or a session report. Those last two are refuse, not a tab.

---

## How to read a row

| Mark | Meaning |
| --- | --- |
| **PASS** | Computable from orders already stored (`customerKey`, time, net, gross when on file, discount dollars). Lands on a painted tab. No new field. |
| **HOLD** | Inside the niche, and a large store pays for it, and it needs one new non-PII fact on the order before it can be honest. Not a cook until that fact exists. |
| **REFUSE** | They only win by leaving order history: pixels, path credit, COGS, subscription-app MRR, sessions, a sixth tab, a person-level export. |

Guests stay out. A window with fewer than 8 buyers stays **—**. A year that has not been lived stays **—**. Dollars are net of refunds when gross is on file, and a missing gross is not “$0 refunds.”

---

## STEAL

| # | Merchant sentence | Who does it today | Mcfly tab | Verdict |
| ---: | --- | --- | --- | --- |
| 1 | The third order is where they stick. Show me the ticket and the wait at each step, not only how long the second order took. | Repeat Customer Insights | Customers → Growth | **PASS** |
| 2 | Of this month’s sales, how much came from people who first bought this quarter versus people who have been customers for a year? | Triple Whale cohorts | Overview | **PASS** |
| 3 | Returning dollars this quarter versus the same quarter last year — did we grow because people came back, or because we found new buyers? | Shopify (blog sales report; cohort compare) | Overview | **PASS** |
| 4 | This year’s new buyers still need a code on later orders. Last year’s class was mostly full price by the same age. | Peel, Discounts by Cohort | Customers → LTV | **PASS** |
| 5 | People who already came back — what share order again inside 90 days, and how long do they usually wait the next time? | Lifetimely journey | Customers → Growth | **PASS** |
| 6 | Put this year’s starters next to last year’s starters at the same age: worth, and the share who had ordered again. | Repeat Customer Insights; Triple Whale year cohorts | Customers → LTV | **PASS** |
| 7 | In month four after their first order, is the ticket bigger or smaller than the first order? | TrueProfit LTV chart; Peel Cohort AOV per Month | Customers → LTV | **PASS** |
| 8 | Which first-order month gave the most back by day 90? I can see the shop’s refund total. I cannot see which class refunded. | Peel, Refunds by Cohort | Customers → LTV | **PASS** |
| 9 | Which country starts buyers who are worth more by day 90? | Lifetimely; TrueProfit country filter; Shopify cohort locations | Customers → LTV | **HOLD** |
| 10 | What share of orders are subscription checkouts versus one-time, and are those starters worth more — without a subscription-app login? | Shopify Subscription vs one-time sales, plus cohort “one-time vs subscription” | Customers → LTV | **HOLD** |
| 11 | Shopify puts a return on the day I processed it. The month I close needs that date, beside what the order was worth when it was placed. | Shopify sales reports (total sales) | Orders | **HOLD** |
| 12 | A gift card I sell is not a sale on Shopify’s sales reports. The month should not count it as demand. | Shopify sales reports, gift card section | Orders | **HOLD** |

Eight **PASS** rows. Four **HOLD** rows. The PASS rows do not need a schema change.

### 1. Order-sequence ladder — PASS

Repeat Customer Insights sells this as its own feature. Their page ([order sequencing](https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/order-sequencing-analysis/), fetched 2026-09-22):

> Compare how behavior changes from the first to second to 100th order.

The metrics they name on that page are average order value, repeat purchase rate, and “Time since previous order (Customer Purchase Latency).” The Entrepreneur plan caps sequencing at 2 years; the $99 plan says “Order Sequencing (all, 5 years).”

Their walkthrough of one store ([latency article](https://www.littlestreamsoftware.com/articles/data-driven-gems-that-can-be-mined-from-a-customer-purchase-latency-analysis-on-shopify-store/), fetched 2026-09-22) says: “Of the 58 customers who placed their 2nd order (from the row before) 53 customers placed a 3rd order, which is a 91% Repeat purchase rate.” The same paragraph gives that store’s 3rd-order average as $144.44 and “about 63 days after their second order.” Those figures are **their example store**, not a Mcfly benchmark and not a number to paint. The same article’s last move is an export “into other systems (e.g. Facebook for a custom audience).” That export is Refuse.

Mcfly already has the first gap (fast / typical / slow days to the second order) and a 2nd vs 3rd+ **headcount**. It does not have the ticket, the come-back rate, and the wait at step 3 and step 4.

**Cook:** On Customers → Growth, under the existing repurchase clock, one ladder. Rows are 1st, 2nd, 3rd, 4th and later. Each sealed row shows the average ticket, the share of the previous step who reached this step, and the typical days since the previous order. Seal a step only when at least 8 buyers have taken it. Guests out. A step the book has not lived is **—**. No industry norm beside it (see Refuse).

### 2. This month’s sales by how old the customer is — PASS

Triple Whale’s cohort article ([Customer Cohorts](https://kb.triplewhale.com/en/articles/5725663-customer-cohorts), updated on their page July 26, 2026, fetched 2026-09-22) asks, in the list of decisions the report is for:

> How much of your revenue comes from new vs long-time customers?

That article also defines NCPA as “total ad spend divided by number of new customers” and a payback against that ad cost. The ad-cost half is Refuse. The revenue question is not. It is answerable from order dates alone: each order this month belongs to the quarter (or year) of that buyer’s first stored order.

Mcfly’s returning-dollar mix says new versus returning **inside the open window**. It does not say how much of this month came from the class acquired last year.

**Cook:** On Overview, one line under the month: dollars from buyers whose first order is in this quarter, dollars from buyers whose first order is older than a year, and the remainder (first order in between). Fewer than 8 identified buyers: the line stays **—**. Guests are their own remainder, named, not folded into “old.” This is not a CAC payback.

### 3. New dollars and returning dollars versus last year — PASS

Shopify’s own blog, updated July 17, 2026 ([New Customers: Find More With Shopify Analytics](https://www.shopify.com/blog/build-relationships-shopify-analytics)):

> The New vs returning customer sales report lets you dive deeper by comparing sales from new and returning customers.

The same page:

> Distinguishing between the two shows whether growth is coming from expanding the customer base or from repeat purchases, and lets you compare how much each group contributes to overall sales.

The Help Center customers report fetched the same day is a **count** report, not that sales report. Quote ([Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports)):

> The New vs returning customers report displays the number of first-time and returning customers for a given period of time.

The cohort report on that same Help page can “display comparative data, such as comparisons to the previous period, the previous year.” Whether the sales version is plan-gated is **not claimed** on this fetch. A dollar figure for how many shops open it is **not claimed**.

Mcfly Overview already compares **total** sales to last year. Returning dollars are the open window, not the same quarter last year.

**Cook:** On the Overview year board, two pairs: new-buyer dollars this quarter and the same quarter last year; returning dollars this quarter and the same quarter last year. If last year is not on file, that side is **—**, not zero. Headcount rate stays off the card.

### 4. Later orders still on a discount, by starter class — PASS

Peel’s Shopify-sourced cohort list ([Cohort Analysis Metrics](https://help.peelinsights.com/docs/cohort-analysis), fetched 2026-09-22) includes, under Cohorts Revenue:

> Discounts by Cohort

The same page says 17 of the metrics “are directly from the data provided by the Shopify datasets.” Gross margin on that list is Refuse. Discounts by cohort are order dollars.

Mcfly already answers a different question: whether a **first** order on a code, or a deeper first-order discount, starts a higher or lower path. `discountAmount` is stored on later orders too. Nothing ranks “share of orders after the first whose discount dollars are above zero,” for this year’s starters versus last year’s starters at the same age.

**Cook:** On Customers → LTV, one line on the existing promo board, not a new chip. For a sealed 90-day class (at least 8 starters who have lived 90 days): the share of **later** orders with a known discount above zero, versus the same age last year when that class has lived it. Unknown discount field stays out of the share. It is not a code name and not a percent read off the code (`WELCOME10` is not 10% — that rule already exists).

### 5. The next wait, after they have already come back — PASS

Lifetimely’s journey page ([customer journey](https://useamp.com/products/analytics/customer-journey/), fetched 2026-09-22):

> Use the 30, 90, 180 and 365 day repurchase rate reports in Lifetimely for both new and existing customers to inform your retention and loyalty programs.

Their pricing file puts “time between orders” on every paid plan. The same journey page also sells Recharge subscription metrics and “acquisition sources.” Those two are Refuse. The repurchase-rate sentence is order dates.

Mcfly seals come-back inside 30 / 90 / 365 of the **first** order, and the typical wait to the **second** order. It does not seal 180 days. It does not answer the existing-customer half: among buyers who already have a second order, what share place another inside 90 days, and what is the typical gap from that second order to the next.

**Cook:** On Customers → Growth, beside the current clock. Two numbers when each has 8 buyers who have lived the window: share of already-returned buyers who order again inside 90 days, and the typical days from order 2 to order 3. The 180-day share for **new** buyers is the third number, and only once those starters have lived 180 days. Otherwise **—**.

### 6. This year’s class beside last year’s, at the same age — PASS

Repeat Customer Insights cohorts ([cohort analysis](https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/cohort-analysis/)):

> Track the important metrics for each cohort (Revenue, Average Order Value, Repeat Purchase Rate).

Their sequencing page adds: “Compare your store performance across different years and quarters” and “Benchmark your metrics against your own store's history.” The other bullet on that page, industry norms from “Adobe, Shopify, and other trusted commerce sources,” is Refuse.

Triple Whale’s article says the time frame can be “Year ie: all customers who bought in 2022,” and tells the reader to compare cohorts. Their example ($69.73 after 12 months) is **their illustration**. Do not paint it.

Mcfly has a monthly still-ordering grid and 30 / 90 / 365 worth. It does not put the class of this year next to the class of last year at day 90.

**Cook:** On Customers → LTV, one comparison. Starters whose first order is in the last 12 months the book has fully aged to 90 days, versus starters from the prior 12 months, at day 90: average net dollars and the share who had ordered again. Day 180 only when both sides have lived it. Thin side stays **—**. This is the shop’s own history. No outside benchmark.

### 7. Ticket size by month of life — PASS

TrueProfit’s LTV article ([Customer Lifetime Value Report](https://helpdesk.trueprofit.io/en/articles/11330264-customer-lifetime-value-report), dated May 11, 2025 on the page):

> Value: Average order value made by these cohorts in the following months since their first orders.

Their example on that page ($36.30, then $42.12, 61 customers, Sep 2020) is **their example**. Not a target. The same article defines CAC as “Total Ad Spend + Total Custom Cost … / Number of First Customers.” Leave that ratio off the card.

Peel lists “Cohort AOV per Month” in the Shopify half of the cohort doc. Repeat Customer Insights lists “Average Order Value” as a month-to-month cohort metric.

Mcfly’s 30 / 90 / 365 figures are **cumulative** dollars per starter, not the average ticket of the orders that landed in month four.

**Cook:** On Customers → LTV, a short strip beside the existing curves: average net ticket of orders in month 0, month 1, month 2, month 3 of life, for starters who have lived that month, 8-buyer floor. Month 0 is the first-order month. A month with no orders is **—**, not a $0 ticket.

### 8. Which starter month gave the most back — PASS

Peel lists “Refunds by Cohort” next to “Discounts by Cohort” in the Shopify-sourced metrics.

Mcfly already shows shop-level refund dollars when gross is on file, and the cohort triangle can sit on net or on gross. It does not rank starter months by the share of gross that came back inside 90 days.

**Cook:** On Customers → LTV, one line when at least one starter month has 8 buyers who have lived 90 days **and** every order in that window has a known gross: the month with the highest refund share, the share, and the net. A missing gross skips that month. The line does not invent “$0 refunds.” It does not become a margin.

### 9. Country worth — HOLD

Lifetimely’s LTV page ([lifetime value](https://useamp.com/products/analytics/lifetime-value/)):

> See details on the specific CAC & LTV for different countries to learn where your best customers are.

Their drivers article ([LTV Drivers](https://help.useamp.com/article/699-ltv-drivers-walkthrough), last updated April 3, 2026 on the page) lists Country in the breakdown table, beside customer tag, first-order tag, and first-order discount code. The CAC column and the Profit Agent on that product page are Refuse. Country is a billing or shipping country, which Shopify already uses as a sales dimension.

TrueProfit, same LTV article:

> In particular, the country filter allows you to see from which country your customers are generating more value.

Shopify’s cohort details include “the top geographic locations of customers in this cohort,” and the cohort filters include “Customer country.” The sales report [Total sales by billing location](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) is “Country or region of billing address.” That report is sales, not what those buyers are worth later.

**HOLD** until a country code is on the order. It is not an address, not a city, not a name. City is Refuse. Do not cook a country card from a field that is not stored. Do not infer country from currency.

### 10. Subscription checkout versus one-time, then worth — HOLD

Shopify Help, sales reports, fetched 2026-09-22:

> The Subscription vs one-time sales report displays the total sales value (including taxes, shipping, sales reversals, discounts, and fees) and number of orders of all products over time, grouped by whether the sales were for subscription products or one-time purchases.

The same page: those subscription reports show data “when you sell subscriptions using the Shopify Subscriptions app.” The cohort details page includes “a ratio of orders containing one-time vs subscription purchases,” and “Subscription” is a first-order filter. If there were no subscription sales, “the subscription versus one-time metric won’t display.”

Peel’s other 17 cohort metrics come from “Recharge Payments, Bold, Rodeo, etc.” and include MRR, active subscribers, and churn-style subscription counts. Lifetimely’s journey page says “integrating Lifetimely with Recharge.” That connector half is Refuse.

**HOLD** for a single bit already on the Shopify order: this order’s purchase option was a subscription checkout, or it was not. Then the same 30 / 90 / 365 worth and come-back as any other starter class, 8-buyer floor. **Not** active-subscriber census, **not** MRR, **not** a Recharge login. Until the bit is stored, the card would be a guess. Do not guess.

### 11. Return dated on the day it was processed — HOLD

Shopify’s total-sales definition, same sales-report page:

> Total sales will be a positive number for a sale on the date that an order was placed, and a negative number for a return on the date that an order was returned.

Mcfly stores the current net on the order’s placed date. A refund that lands next month changes that order’s amount. It does not land on the processing day, because the refund timestamp is not stored. A finance lead closing a large month against Shopify total sales will see the two clocks disagree, and the disagreement is real.

**HOLD** for refund date and refund dollars on that date, still from the order, not from a P&L. Orders tab: orders placed this month at their current net, and returns processed this month as their own line. Missing refund dates stay **—**, not a silent net on the placed day presented as Shopify’s total-sales clock. This does not replace the cohort net already on LTV.

### 12. Gift-card product sales kept out of demand — HOLD

Same Shopify sales-report page:

> When you sell a gift card product: It isn't included in any sales reports, nor the total sales number in the Home analytics card.

And: “Gift card sales amounts aren't included in other sales reports.” A gift card **tender** on a real product is different: the item’s full value stays in sales, and the gift card is a payment. That second case is the Payments finance report. Rebuilding outstanding gift-card liability is Refuse.

The order library has no gift-card handling. A gift-card product order can sit in the month as if it were demand. **HOLD** until an order can be marked “gift card product” without storing a product title. Then Orders (and the Overview month) leave those orders out of demand and say they were left out. Unknown stays in the month, labeled unknown, not silently dropped.

---

## REFUSE

They win these by leaving the niche. Do not put them on a tab, a chip, or a listing line.

| They sell it | Where it was fetched | Why it is out |
| --- | --- | --- |
| Daily profit and loss, contribution, COGS, gross margin | Lifetimely pricing.md includes “Daily profit & loss” on paid plans. Peel lists “Gross Margin Amount” and “Gross Margin Rate” in the same cohort doc as the discounts row, and the pricing page includes “COGS (RefN).” TrueProfit ([How TrueProfit calculates your Net Profit](https://helpdesk.trueprofit.io/en/articles/15561827-how-trueprofit-calculates-your-net-profit), fetched 2026-09-22; the page said “Updated yesterday”): “Net Profit = Revenue + Tips + Gift Card Sales − Total Costs - Taxes Collected - Chargeback Loss - Chargeback Fee” and “Total Costs = COGS + Shipping Costs + Handling Fees + Transaction Fees + Ad Spend + Custom Costs.” | A cost book. Not a recommendation. |
| Pixels, multi-touch, UTM path credit, ad-account CAC | Triple Whale cohort article: NCPA is “total ad spend divided by number of new customers,” and the intro says cohorts are “vital” for “marketing channels.” Lifetimely paid plans include “Attribution — ad spend, ROAS, and CPC.” Peel pricing includes “multi-touch attribution with UTM” and ad-network connectors. Shopify’s [Total sales by referrer](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) is “the last interaction referrer,” and the page points at “attribution models.” The blog’s Sessions by referrer, Sessions by device, and first-click versus last-click section is the same exit. | Path credit. Spend on Mcfly stays typed or pasted. A pasted channel name is a label on a dollar. |
| Recharge, Skio, Bold, Smartrr, Stay.ai MRR and churn | Peel cohort doc: 17 metrics “from data provided by the subscription platforms,” including “Cumulative MRR per Subscriber” and “Active Subscribers per Cohort.” Peel pricing FAQ: integrations with those apps “to provide drill-down insights on what’s working and not working on your subscription business.” Lifetimely journey page: “integrating Lifetimely with Recharge.” | Subscription-app census. The order’s own one-time versus subscription **checkout** is the Hold above. |
| Amazon | Lifetimely +$75/month add-on. Peel “Shopify & Amazon” on every plan. | Off Shopify. |
| Klaviyo, Attentive, tagging the person, email lists | Peel: “RFM & custom segments exportable for email and ad campaigns,” and Klaviyo / Attentive connectors. Repeat Customer Insights listing: “Works with Customer tags, Klaviyo,” and “Sync segments to Shopify tags.” Shopify’s Returning customers report lists “their name” and “their email address.” | A person export. Mcfly keeps opaque keys. |
| Sessions, conversion rate, search-with-no-results | Shopify blog sections Sessions by referrer, Sessions by location, Sessions by device, Searches by search query, “Examine Your Conversion Rates by Channel.” | Not order history. |
| Cohort “top marketing channels,” marketing-type filters | Shopify cohort details: “the top marketing channels responsible for directing the cohort’s customers to your business,” and filters for Marketing channel and Marketing type. | Session attribution inside a cohort drill. Sales channel (web / POS / Shop) is already the source row on the tip. |
| Industry benchmarks | Repeat Customer Insights sequencing page: “Automatically benchmark your metrics against industry norms” using “study data released by Adobe, Shopify, and other trusted commerce sources.” Lifetimely pricing.md includes “Benchmarks” on paid plans. | A number we did not compute from this shop. Comparing this shop to its own prior year is the Pass in row 6. |
| Profit Agent that proposes and executes | Lifetimely journey page: “When it spots something worth acting on … You approve. It gets done.” Their claim “Powered by $100B+ in GMV across 45,000+ stores” sits on that page. | An agent, and a marketing claim. Not a desk line. |
| Order-volume or per-extra-order pricing | Ladders quoted above. | Flat $39. |
| Sixth analysis tab, Snowflake, custom report credits | Peel pricing: “Snowflake data (web or programmatic) for SQL queries,” custom dashboards, and custom-report credits by plan. | Painted five stay. |
| Post-purchase surveys | Peel connectors list Fairing and Kno. | Not on the order. |
| Live product-title or SKU journeys | Lifetimely drivers rank “Product” and “SKU.” Peel pricing says “Product Metrics.” Shopify cohort first-order filters include “Product name.” | Titles stay off the live row. The path table already paints only where a name is on file. Do not store a title to win this. |
| City, email, name | Shopify cohort filters include “Customer city.” Customers-by-location is “most recent shipping location.” | Finer than a country code. Country is the Hold. City is not. |
| Outstanding gift-card liability, and TrueProfit’s choice to add gift card sales into profit | TrueProfit net-profit article, same fetch: “Tips, Gift Card Sales — Added to what you keep. Gift card sales are not product revenue yet — revenue is recognized when customers use the gift card.” The formula still adds Gift Card Sales into Net Profit. Shopify’s outstanding gift card balance is a finance report. | A liability book. Excluding a gift-card **product** from demand is the Hold in row 12. Adding gift card sales into a profit number is this row. |
| Active and canceled subscription counts over time | Shopify sales reports: “Active subscriptions over time” and “Canceled subscriptions over time,” shown when the Shopify Subscriptions app is in use. | Contract status. Not the order’s purchase option. |

Customer tags and order tags stay a **note**, not a row. Lifetimely’s drivers article ranks “customer tags” and “order tags,” and the example is a tag “Active Subscriber.” A raw tag string can be an email a merchant typed into the tag. Do not store the string. A later non-PII flag, if the shop already has one that is not a person, can reopen row 9’s pattern. It is not this cook.

---

## Top 5 merchant sentences

1. The third order is where they stick. Show me the ticket and the wait at each step, not only how long the second order took.
2. Of this month’s sales, how much came from people who first bought this quarter versus people who have been customers for a year?
3. Returning dollars this quarter versus the same quarter last year — did we grow because people came back, or because we found new buyers?
4. This year’s new buyers still need a code on later orders. Last year’s class was mostly full price by the same age.
5. People who already came back — what share order again inside 90 days, and how long do they usually wait the next time?

Rows 6, 7, and 8 are the same PASS standard (year-class at day 90, ticket by month of life, refund share by starter month). They are the next sentences after these five. Rows 9–12 wait on a field.

---

## Sources fetched 2026-09-22

- https://useamp.com/pricing.md
- https://useamp.com/products/analytics/lifetime-value/
- https://useamp.com/products/analytics/customer-journey/
- https://help.useamp.com/article/699-ltv-drivers-walkthrough
- https://kb.triplewhale.com/en/articles/5725663-customer-cohorts
- https://trueprofit.io/pricing
- https://helpdesk.trueprofit.io/en/articles/11330264-customer-lifetime-value-report
- https://helpdesk.trueprofit.io/en/articles/15561827-how-trueprofit-calculates-your-net-profit
- https://www.peelinsights.com/pricing
- https://help.peelinsights.com/docs/cohort-analysis
- https://apps.shopify.com/repeat-customer-insights
- https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/order-sequencing-analysis/
- https://www.littlestreamsoftware.com/shopify-apps/repeat-customer-insights/features/cohort-analysis/
- https://www.littlestreamsoftware.com/articles/data-driven-gems-that-can-be-mined-from-a-customer-purchase-latency-analysis-on-shopify-store/
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report
- https://www.shopify.com/blog/build-relationships-shopify-analytics

**Not edited:** app code, site, listing paste. Research doc only.
