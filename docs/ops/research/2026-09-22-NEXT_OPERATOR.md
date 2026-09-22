# Next operator pains — 2026-09-22

**Role:** Scout. Public complaints only (Shopify Community, Reddit, App Store reviews of native Analytics / Lifetimely / Peel / Triple Whale / TrueProfit). Order-history desk only.  
**Tip this note is about:** Fly **v415** / tip `dd865c3` (same-clock compare is on the tip). Live stays **PARKED**. Rank 6 (1st / 2nd / 3rd / 4th+ ticket and wait) is the named next ship — not a find.  
**Painted IA:** Overview · Orders · Customers · Spend · Goals. No sixth tab.  
**Price:** $39 flat. No GMV ladder.  
**Religion:** Shopify Total Sales. Empty spend is not 0×. No pixels, COGS, sessions-as-a-promise, MTA, or invented metrics.

Quotes below are copied from the page fetched on **2026-09-22**, except two Reddit self-texts taken from the public search index after `old.reddit.com` returned 403. Nothing in quotation marks was written for this file.

## Floor — reciting these names as the whole note is FAIL

Already scored in `docs/ops/research/2026-09-22-ENTERPRISE_OPERATOR.md` (`origin/cursor/enterprise-operator-5bc6`). Do not recook.

tonytapay · Kayleigh · Wing-roro · petgrocer · MagnumFonseca · SteveG79 · Tudirad · BrendanB-YLS · jbradley2319 · wilburnch · Jesse_G · lumine · Kove Footwear · CJackson770 · archit2001.

Same-clock vs a full prior day is on v415. Returning $. Cohort LTV. Promo / source LTV. Spend paste. Morning copy line. Dollars by discount **code**. Coverage honesty for a million-order pull. Do not list them as new.

## Stored Mcfly facts (so PASS / HOLD / REFUSE is not a wish)

| On the book | Not on the book |
| --- | --- |
| `OrderFact`: `shopifyOrderId`, opaque `customerKey`, `orderedAt`, `shopLocalDate`, `amount` (current total), `grossAmount`, `currency`, `discountAmount`, first `discountCode`, `sourceName`, `unitCount`, `lifetimeOrders` | Refund **processing** date · country / shipping country · product title / SKU · financial status · order tags · gift-card product flag · subscription-checkout bit · per-location timezone · presentment currency as a second sum · processor fees |
| `SalesDayFact`: Shopify Total Sales, net, gross, order count, new / returning $ (guests out of returning) | Sessions, conversion, checkout funnel |
| Spend paste | Ad-account OAuth, pixels, “true ROAS” |
| Ingest query (`formatPeriodQuery`): `created_at` in the shop-local day, `(status:open OR status:closed)`, `test:false`. **No** `financial_status:paid` filter. Shop money, not presentment. Cancelled and Bogus test orders are out. | Cancelled leftover dollars Shopify still paints · POS drawer tape · VAT-out · bank / payout |

Day totals go back five years. Order rows do not. SAMPLE must not invent a catalog Live cannot store.

## New pains a $5M store would still pay $39 to have answered

Ten clear the bar. Rank 6 threads are listed after the table so they are not counted as finds.

### 1. A paid-only app dropped a $123k book to $9,781 because Klarna was still pending

**Their words:** “Pending orders. Klarna, bank transfer, cash on delivery — these sit in pending for days. Apps that filter by financial_status = paid drop them entirely. On a real store I tested, the app showed $9,781 where the store had actually done $123,656. Check: compare order counts, not just revenue.” — RomanRevenome, 7 Sep 2026. [Why your analytics app's revenue never matches Shopify admin](https://community.shopify.com/t/why-your-analytics-apps-revenue-never-matches-shopify-admin-three-reasons-and-a-2-minute-check/678999)

Same class, store operator: “I am getting sales and orders I am fulfilling them yet not updating the total sales page.” — Losbsbbans, 26 May 2025. [Getting order but total of sales not update](https://community.shopify.com/t/getting-order-but-total-of-sales-not-update/416308). Community reply names Pending / Authorized / Manual (COD) as the usual miss.

**Tab:** Overview.  
**Stored fact:** Order ingest already takes open or closed, not paid-only. Pending Klarna is on the row if Shopify still has the order.  
**PASS.** Name on the open Total Sales card that pending / authorized / COD sit in this number — the same way Shopify Total Sales does — so a Saturday operator does not “fix” $123,656 down to $9,781 by matching a paid-only export.  
**Why it is not a nit:** The quoted miss is more than a hundred thousand dollars on a real store. A $5M book that takes Klarna or bank transfer will fire the analyst who cannot say whether pending is in.  
**HOLD:** Do not add a paid-only toggle that recreates the $9,781 lie. Do not invent a capture-date clock.

### 2. Total Sales ÷ orders is 20% above Shopify’s AOV because tax and shipping are in the numerator

**Their words:** “I’ve just noticed that my AOV looks wrong - if I divide the ‘total sales’ by ‘total orders’ I get an AOV much higher than the dashboard is showing on my store (like 20%+ higher)!” — richjeff, 25 Jul 2023. Follow-up, 29 May 2024: “I’ve just noticed the same issue - it says it’s gross sales - discounts … but its not … its out by 20%.” Then: “Total sales … includes taxes and shipping. Average order value uses gross sales … which is total sales - taxes and shipping … Ta daaa” — bemo2. [Is my average order value calculation incorrect?](https://community.shopify.com/t/is-my-average-order-value-calculation-incorrect/235485)

**Tab:** Orders (typical / median), with Overview’s period total named so the two cards do not fight.  
**Stored fact:** `OrderFact.amount` is current Total Sales (tax and shipping in). `SalesDayFact.netSales` is the product subtotal. `shippingTaxFees` is already computed as Total − Net. Shopify’s AOV is a different formula.  
**PASS.** Label typical order as Shopify Total Sales per order (tax and shipping in). Put the already-computed shipping + tax dollars next to it so a 20% gap is a named slice, not a finance argument. Do not paint Mcfly typical as Shopify’s AOV.  
**Why it is not a nit:** Twenty percent on a multi-million book is the Saturday fight with the accountant. Rank 1 named Total Sales on the period. It did not name why typical ≠ Shopify AOV.  
**REFUSE:** VAT-out as a second revenue (Kove Footwear is the floor HOLD). Shipping + tax sitting above the product subtotal is already on file; stripping VAT is not.

### 3. A Plus retailer still exports CSV to get dollars per unit

**Their words:** “As a Shopify Plus retailer, I’m missing two basic retail KPIs in Analytics: Average item price = Net sales ÷ Net quantity. Average items per order = Net quantity ÷ Number of orders. ShopifyQL doesn’t support custom calculated columns, forcing merchants to export CSVs for basic math.” — Ohlala-equestrian, 24 Jun 2026. [Native calculated metrics in ShopifyQL / Analytics](https://community.shopify.com/t/feature-request-native-calculated-metrics-in-shopifyql-analytics-retail-fundamentals-missing/639503)

Staff (NickPresta, 29 Jun 2026) pointed at Exploration formulas. That is still a query, not the Saturday desk.

**Tab:** Orders.  
**Stored fact:** `unitCount` and `amount` are on the order. Mean items per order and 2+ item share already sit in the Orders book. **Average item price is not asked.**  
**PASS.** Period dollars per unit = Shopify Total Sales ÷ units on file (or Net ÷ units when `netSales` is on the day). Dash when `unitCount` is not crawled. Not a product title. Not a ShopifyQL box.  
**Why it is not a nit:** Plus, still CSV, for a retail fundamental. Items-per-order is already on the book; dollars-per-unit is the job no open lane asks.  
**REFUSE:** ShopifyQL explorer. Product title / SKU column.

### 4. Year-to-date Total Sales is buried in 36 Finance reports, and they still want the fee column

**Their words:** “I just want a simple total sales report to see what my store has sold to date by transaction so that I can export and for my tax spreadsheets. … I don’t need to individual items within an order, just order totals throughout out the year with date. Ideally with customer paid total and minus shopify fees too so I can match against my bank account records.” — southdownsclay, 1 Mar 2026. Revived 3 Aug 2026: “I am going into analytics > filtering by Finances and then have 36 different reports! … I just want a spreadsheet that shows, order number, sale total and Shopify fee paid (if Shopify Pay used) IS THAT TOO MUCH TO ASK SHOPIFY!!!” [Simple sales report year to date](https://community.shopify.com/t/simple-sales-report-year-to-date/590320)

Almathani, 5 Apr 2026, same thread: “A simple year-to-date sales total for tax purposes should be a 10-second answer, not a maze of report options.”

**Tab:** Goals (year board) and Overview’s year card — same Shopify Total Sales, one copyable sentence. Not a sixth Reports tab.  
**Stored fact:** Sales-day totals already go back five years. Order rows do not have processor fees.  
**PASS** the 10-second YTD Shopify Total Sales, named, copyable for the tax pack.  
**REFUSE** Shopify fees, payout date, and bank match. That is the payout CSV, not this desk. BrendanB-YLS’s yesterday line is already the morning copy; this is the **year**.  
**Why it is not a nit:** UK tax, still unanswered in August, 36 Finance reports. A $5M operator’s accountant does not hunt Finance filters on a Saturday.

### 5. The dashboard looks healthy because it is silently a slice of the company

**Their words:** “Wholesale operation, Shopify storefront, ERP holds the actual order book. Roughly a fifth of orders originate on the website — the rest come in by phone, rep, or manual invoice and live only in the ERP. Shopify Analytics is therefore reporting on a subset and not saying so. The dashboard looks healthy. Total sales, AOV, conversion rate all render normally. They’re just describing a slice of the business, and nothing on that screen indicates it. The failure mode isn’t that the numbers are wrong. It’s that they’re plausible.” — Adab01, 17 Sep 2026. [How do you report sales when most orders never touch Shopify?](https://community.shopify.com/t/how-do-you-report-sales-when-most-orders-never-touch-shopify/683141)

**Tab:** Overview.  
**Stored fact:** Mcfly only ever has orders Shopify sent. There is no ERP connector and there must not be one.  
**PASS.** A coverage line that this is Shopify Total Sales for orders on this shop — not the company book — so a plausible six-figure month is not treated as the wholesale total. Missing last year stays not on file, never $0.  
**Why it is not a nit:** A $5M–$10M wholesale operator will cancel $39 in week two if the open lane looks like “the business.” MagnumFonseca is the million-order **pull**. This is the million-dollar **slice that never enters Shopify**.  
**REFUSE:** Ingesting ERP, Amazon, or phone orders Mcfly never received. Sessions / conversion on that same post.

### 6. $0 reship and test orders jam units and AOV because cancel is gone

**Their words:** “I create a $0 order to reship items for a customer or to ship a package internally within my company. … now that I’m unable to cancel these types of orders, my total order counts are completely off. More importantly, sales quantities are COMPLETELY off now because I can no longer cancel these orders and remove those quantities from the units sold report and CSV exports. In addition, if I follow what the bot says - to ‘return’ these orders instead, then my ‘return’ statistics will be WAY higher than what they should be!!!” — joshroban, 30 Sep 2025. [Can't Cancel Orders Anymore?](https://community.shopify.com/t/cant-cancel-orders-anymore/568400)

Same post: “this also means all ‘test’ orders can’t be cancelled. … all of these orders jam up the system and throws off all of the order statistic and exports.”

**Tab:** Orders.  
**Stored fact:** `amount` and `unitCount` are on the row. Order tags are not. Ingest already drops `test:true` (Bogus). Front-end tests paid with a real card are ordinary orders with $0 or a real total.  
**PASS.** Period count of $0-amount orders, and the units on those rows, so AOV and units-sold are not silently inflated. Do not pretend to know they are “internal.”  
**HOLD:** Order tags, a “exclude internal” filter, or storing a person.  
**Why it is not a nit:** They named accounting, marketing, and fundraising as the surfaces the $0 orders now pollute. A $5M operator closing a board pack cannot use units-sold that include reships.

### 7. Admin exchanges duplicate ~$300 of gross, and Triple Whale inherits it

**Their words:** “Whenever an unfulfilled order is changed based on a customer’s request, the new product in the order is considered a sale, even if there is no price difference ($0 payable by the customer). … After this change, the gross sales and total sales increase by the amount of the product, effectively duplicating the revenue for that order. … the issue persists when I use third-party analytics trackers like Triple Whale. … I have to manually input each order’s value into a spreadsheet.” Edit: “removing the original product should offset the sale by -$299.99 rather than $0.” — Skengdo, 4 Jan 2025. [Order changes register as a sale in reports & analytics](https://community.shopify.com/t/order-changes-register-as-a-sale-in-reports-analytics/384596)

CloudlabSam, same day: POS exchanges write the refund; Admin exchanges do not. Shopify is aware.

**Tab:** Orders.  
**Stored fact:** `grossAmount` vs `amount` is the current net vs original checkout. Rank 4’s returns-climbing line uses that. It does **not** reconstruct a missing Admin refund line Shopify never wrote.  
**HOLD.** Do not cook a “true gross” that Shopify’s own Admin exchange does not store. Missing refund step stays —, not a silent net presented as fixed.  
**REFUSE:** P&L / COGS on the spreadsheet they fell back to.  
**Why it is not a nit:** $299.99 duplicated per swap, Triple Whale inherits, live profit tracking abandoned for a hand sheet. A high-volume variant shop does this all day.

TrueProfit, same family: Loma Linda, 19 Jun 2026, App Store (via AppNavigator): “Any time you have a substitution order where a customer orders (SKU: A), and then post-purchase, but before fulfillment, they request a substitution for (SKU: B), the system records that as part of 'Returns and Refunds' expense, even though the dollar amount was never captured … Now I am stuck downloading the data into spreadsheets and reconciling everything myself costing me hours of time.” [Loma Linda / TrueProfit review 2181628](https://appnavigator.io/app/trueprofit/reviews/2181628). **HOLD** the substitution clock. **REFUSE** the PayPal fee and COGS parts of that same review.

### 8. Cancelling an old order distorts **today**, not the day it sold

**Their words:** “Currently, when an order is canceled, it impacts the data, but it would be much more accurate and helpful for store owners if canceled orders were reflected retroactively on their original order creation date, rather than just reducing overall metrics on the day of cancellation.” — Amin_Elmlegy, 29 Jul 2026. [Reflect canceled orders back on their original creation date](https://community.shopify.com/t/feature-request-reflect-canceled-orders-back-on-their-original-creation-date-in-reports-dashboard/658398)

jennifeergordonn, 30 Jul 2026, same thread: “The original sales period may still include revenue from an order that was eventually cancelled, while the later period reflects an adjustment for a sale that did not actually occur during that period.”

**Tab:** Overview / Orders.  
**Stored fact:** Ingest is `status:open OR status:closed` — cancelled rows never enter `OrderFact`. Day totals from `SalesDayFact` still follow whatever Shopify put on the day. There is no cancel-processed-at on the row.  
**HOLD.** Same family as Wing-roro’s refund clock, **new operator, cancel not refund**. Do not invent a cancel date. A coverage line that cancelled orders are not in this order book is the honest paint; restating history the way Amin asked needs a timestamp Mcfly does not store.  
**Why it is not a nit:** A $5M Saturday that cancels last week’s wholesale PO will watch **today** drop while last Saturday still looks like a win.

Related, not the same clock: Jwalsh1, 17 Apr 2024 — unpaid POS cancel left the dollars in: “I have gone in and done this for all my cancelled orders in 2024 and I’m actually £624 down on what I thought I was. … I have ended up paying more VAT than I should have because there figures said I over £600 extra in orders.” [Cancelled Orders - Not Deducting From Totals](https://community.shopify.com/t/cancelled-orders-not-deducting-from-totals/315260). **PASS** the honesty that Mcfly’s order book drops cancelled (`status:open OR closed`) so that leftover amount is **not** in this Total Sales; do not re-ingest cancelled leftovers to “match Admin.” **HOLD** matching Shopify’s broken remaining total.

### 9. A country filter silently dropped Net Sales vs the channel report

**Their words:** “I’m trying to generate a report that provides data on online sales by shipping country. I successfully created this report, but the total net sales in my online sales report differs from the net sales reported in the pre-built ‘Net Sales by Channel’ report. … these reports should show the exact same total net sales when the reporting period is identical.” Their ShopifyQL: `WHERE sales_channel IS NOT NULL AND shipping_country IS NOT NULL` vs channel-only. — TS1122, 6 Mar 2025. [Discrepancy in Net Sales Between Custom and Pre-Built Reports](https://community.shopify.com/t/discrepancy-in-net-sales-between-custom-and-pre-built-reports/398842)

BetterReports-C (Claudia), 19 Mar 2025: the first query “excludes all sales without a shipping_country.”

**Tab:** Orders / Overview.  
**Stored fact:** No country code on `OrderFact`. Digital, POS, and some drafts have no ship-to.  
**HOLD.** Country stays HOLD (not an address, not inferred from currency). Do not ship a “sales by country” board. The cook that **is** in bounds: never filter the named Total Sales on a field that is not on the order.  
**Why it is not a nit:** They were comparing last month to previous year in the same query. A Plus custom report that drops POS and no-ship digital will lie about the year.

### 10. Multi-unit retail cannot close a location day because Analytics is one shop timezone

**Their words:** “We’re a multi-unit retailer with shops in multiple time zones. We currently have no way to set up Analytics to show store reports/transactions/refunds by the local time zone. While users can set their time zone, all analytics are shown in our global time zone rather than the specific store. This is extremely problematic when looking for a transaction, or running reports for specific stores. Times just never match the time of the actual store location.” — FERALGR, 15 Feb 2025. [Shopify Analytics - Ability to Set Time Zone for each Physical Store](https://community.shopify.com/t/shopify-analytics-ability-to-set-time-zone-for-each-physical-store-for-analytics-transactions/394859)

**Tab:** Orders (POS dollars already split by `sourceName`).  
**Stored fact:** One `Shop.ianaTimezone`. `shopLocalDate` is that clock. No location id.  
**HOLD.** Per-location timezone is not on the order. Do not fake a second clock from currency or POS. A copyable POS Total Sales line remains the floor’s POS HOLD (drawer tape is still out).  
**Why it is not a nit:** Multi-unit, refunds included, times never match the store that actually closed.

## Verdicts in one place

| # | Pain | Tab | Verdict |
| --- | --- | --- | --- |
| 1 | Paid-only apps drop pending Klarna / COD ($9,781 vs $123,656) | Overview | **PASS** name pending-in. **HOLD** paid-only toggle |
| 2 | Total÷orders is 20% above Shopify AOV (tax + shipping) | Orders, Overview | **PASS** label typical as Total Sales per order. **REFUSE** VAT-out |
| 3 | Plus still CSV for dollars per unit | Orders | **PASS** Total (or Net) ÷ `unitCount`. **REFUSE** ShopifyQL / titles |
| 4 | YTD Total Sales lost in 36 Finance reports | Goals, Overview | **PASS** copyable year Total Sales. **REFUSE** fees / bank |
| 5 | Healthy dashboard is 20% of the wholesale book | Overview | **PASS** “Shopify’s book, not the company.” **REFUSE** ERP ingest |
| 6 | $0 reship / test orders jam units and AOV | Orders | **PASS** $0 order count + units. **HOLD** tags |
| 7 | Admin exchange duplicates ~$299.99; Triple Whale inherits | Orders | **HOLD** missing refund line. **REFUSE** P&L |
| 8 | Cancel hits today, not the sale day | Overview | **HOLD** cancel timestamp. **PASS** cancelled-out-of-book honesty (Jwalsh1 £624) |
| 9 | Shipping-country filter drops Net vs channel | Overview | **HOLD** country |
| 10 | Multi-unit timezone | Orders | **HOLD** per-location tz |

## Top merchant sentences (new threads)

1. “On a real store I tested, the app showed $9,781 where the store had actually done $123,656.” — [RomanRevenome](https://community.shopify.com/t/why-your-analytics-apps-revenue-never-matches-shopify-admin-three-reasons-and-a-2-minute-check/678999)
2. “The dashboard looks healthy. … They’re just describing a slice of the business, and nothing on that screen indicates it.” — [Adab01](https://community.shopify.com/t/how-do-you-report-sales-when-most-orders-never-touch-shopify/683141)
3. “I just want a spreadsheet that shows, order number, sale total and Shopify fee paid … IS THAT TOO MUCH TO ASK SHOPIFY!!!” — [southdownsclay](https://community.shopify.com/t/simple-sales-report-year-to-date/590320)
4. “sales quantities are COMPLETELY off now because I can no longer cancel these orders and remove those quantities from the units sold report.” — [joshroban](https://community.shopify.com/t/cant-cancel-orders-anymore/568400)
5. “removing the original product should offset the sale by -$299.99 rather than $0.” — [Skengdo](https://community.shopify.com/t/order-changes-register-as-a-sale-in-reports-analytics/384596)

## Rank 6 evidence — not a find

These are real 2024–2026 operators. They are the named next ship (`cursor/third-order-steps-5bc6`). Counting them here is recycling.

- maximilllllian, 14 Dec 2025: “One metric that’s important for us is to see how many customers are returning for their second order. However, I’ve only been able to find ‘returning customers’ and the ‘customer order number’ filter which only checks the customers current number of orders, not whether a particular order was their second order.” [Help with sales data for 2nd time orders](https://community.shopify.com/t/help-with-sales-data-for-2nd-time-orders/579590). Product titles in that ask stay HOLD.
- wilkius, 26 Jul 2024: “I want to trigger a workflow when a customer makes an order and it’s their 2nd (or 3rd) order. Specifically I am trying to figure out if the first order is above $X amount and the second order is below $X amount.” Threshold they typed: **$728**. [Compare order value vs that customer's previous order](https://community.shopify.com/t/compare-order-value-vs-that-customers-previous-order/343070). **REFUSE** a Flow / Slack product; the desk job is the sealed 1st / 2nd / 3rd ticket already queued. `lifetimeOrders` + `amount` are on the row.

ghayes54b, 20–27 Jul 2026, Home vs Orders list for **yesterday**, “Orders and total are overstated and understated on the home dash board,” screenshot of six orders. [Total Sales Not correct on multiple devices](https://community.shopify.com/t/total-sales-not-correct-on-multiple-devices/653334). Same class as Tudirad. Corroboration, not a new cook.

## App Store (order-history complaints only)

Peel’s public reviews on fetch were 38× 5-star. No 1-star order-history body to quote. Canopy, 2 Dec 2024, praised a **Skio** connection ([Peel reviews](https://apps.shopify.com/peel-insights/reviews)) — **REFUSE** Recharge / Skio MRR.

Lifetimely 1-stars that are **not** order-history desk:

- Twitter Bikes, 8 Jul 2025: “We’ve been getting inaccurate data from our Google Ads and Amazon ad spend. Honestly, I can’t trust this app for our daily numbers anymore. … I’m paying them $600/month because of their volume-based pricing.” [taranker 1-star index](https://taranker.com/shopify-lifetimely-lifetime-value-and-profit-analytics-app-customer-reviews?filter-by=1). **REFUSE** ads OAuth, Amazon, GMV tax. Mcfly stays $39 and spend paste.
- Chef Preserve, 9 Jul 2025, same index: Amazon add-on “just buggy.” **REFUSE** Amazon.
- Koss Design, 27 Nov 2024, same index: “App is not working properly when you are using a post purchase upsell, I would be VERY VERY VERY cautious when looking at the numbers as they are not relevant at all.” **HOLD** with Skengdo — post-purchase edits Shopify does not refund on Admin. Not a pixel.

KOAN Pocket Elixirs™, 8 Sep 2026, Lifetimely 5-star: “Our CEO recently needed an integration with our subscription app which was not supported. The Lifetimely team got right on the project and did a tight integration.” ([Lifetimely reviews](https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics/reviews)). **HOLD** subscription-checkout bit. **REFUSE** building Recharge.

VocaSpark, 4 Jul 2026, TrueProfit: “Also, it doesn't track VAT collection which is useless for EU businesses.” ([TrueProfit reviews](https://apps.shopify.com/trueprofit/reviews)). **REFUSE** VAT-out. Kove Footwear remains the floor HOLD.

## Reddit (index text; direct fetch 403)

u/Substantial-Cycle527, 6 Jan 2026: “I need to create a report that shows all the products returned during a date range, with the product listed, the sale price, and then the DATE it was originally ordered. This date is important because of how we report our inventory.” [r/shopify Report for returns](https://www.reddit.com/r/shopify/comments/1q5k04o/report_for_returns/). **HOLD** product title + refund processing date.

u/Rare_Requirement_699, 23 Feb 2025: “I need a report showing all of 2024 both online ans POS gross sales, refunds, return, processing fee, as well as cash sales from POS.” [r/shopify How to create report from 2024](https://www.reddit.com/r/shopify/comments/1iwj9rp/how_to_create_report_from_2024/). **PASS** 2024 Online / POS Shopify Total Sales + gross + returns drag already on stored days / `sourceName`. **REFUSE** processing fee. **HOLD** POS cash / drawer.

## Also HOLD or REFUSE (new threads, not the quota)

| Operator | Date | Ask | Verdict |
| --- | --- | --- | --- |
| 74anders | 22 May 2025 | Tax print: date, order id, **product name**, sale ex-VAT, VAT, total. [New analytics tax report](https://community.shopify.com/t/howto-create-report-in-the-new-analytics-it-was-so-easy-before-help/415713) | **HOLD** titles. **REFUSE** VAT-out as hero |
| cclumpner | 20 May 2026 | “Our bookkeeper is quite frustrated with how many steps it takes” for gift cards. [Gift card sales reports](https://community.shopify.com/t/why-arent-gift-card-sales-appearing-in-my-sales-reports/28298) | **HOLD** gift-card flag (compete row 12). **REFUSE** outstanding liability / adding gift-card sales into Total Sales |
| LeonAndrew | 18 Nov 2024 | Count gift cards as revenue at POS “and also include the sales taxes and COGS.” Same URL | **HOLD** flag. **REFUSE** COGS |
| WesQ | 27 Aug 2024 | Item returned in period vs refund filter on Orders for the same product. [Returns and Refunds Discrepancies](https://community.shopify.com/t/returns-and-refunds-discrepancies/352591) | **HOLD** title + refund date |
| WUC444 | 2 Jul 2024 | Line-by-line daily orders lower than Analytics because of “anonymous payouts/credits/refunds.” [Returnzapp vs Financial Summary](https://community.shopify.com/t/large-variance-in-returns-values-between-shopify-financial-summary-report-returnzapp/336359) | **HOLD** refund processing date (Wing-roro family, new operator) |
| LukeRotherfield | 25 Jul 2024 | Migration refunds graph on `created_at` not `processed_at`; “massive dip on the day we run our import.” [Use processed_at date for refunds](https://community.shopify.com/t/use-processed-at-date-for-refunds-in-admin-gui-total-sales-graphs/342672) | **HOLD** refund `processed_at` |
| SallyG | 12 Jun 2024 | Unpaid drafts in daily sales; 50/50 service + retail. [Sales Report](https://community.shopify.com/t/sales-report/331173) | Still-PASS: name `sourceName` already inside Other. Not a new find |
| Ronan.Cian | 26 Jul 2026 | “splitting recurring revenue from one-time purchases usually means exporting raw CSVs and manually pivoting data every month.” [Recharge/subscription reconciliation](https://community.shopify.com/t/inquiry-about-recharge-subscription-reconciliation/657462) | **HOLD** subscription bit. **REFUSE** Recharge MRR / dunning Slack |
| Sarah568473 | 11 Sep 2026 | Orders vs completed checkouts dropped to 50% since 19 Aug. [Orders vs Completed Checkout Rates](https://community.shopify.com/t/has-anyone-else-seen-orders-vs-completed-checkout-rates-drop-by-over-half/680024) | **REFUSE** sessions / checkout funnel. Source mix in Other is still-PASS |
| WillowAndVine | 5 May 2025 | Online metrics “skewed by transactions passing through my two (bricks and morter) locations.” [Metrics and reporting](https://community.shopify.com/t/metrics-and-reporting/412586) | Floor POS HOLD / source LTV already on the tip |
| LB2022 | 8 Sep 2025 | August 2025 Payouts Over Time: gross − tax − discount − refund ≠ net; CC fees $0.00. [Payouts report](https://community.shopify.com/t/payouts-report-gross-sales-less-expenses-doesnt-equal-net-sales/564069) | **REFUSE** payouts / fees / bank |
| koncz.szabi | 8 Sep 2026 | “Open a second market and one half stops agreeing with the admin.” Shop money vs presentment; UTC vs shop clock. [Same analytics-app thread as #1](https://community.shopify.com/t/why-your-analytics-apps-revenue-never-matches-shopify-admin-three-reasons-and-a-2-minute-check/678999) | Shop-local day and shop money are how the book is written. **PASS** a mixed-`OrderFact.currency` window as — , never a summed fake. Not a second presentment book |
| rippedlazarus / rshrivastava63 | Aug 2026 | Month-end: “Refunds processed in one payout but reflected in another.” [Month-end financial close 2026](https://community.shopify.com/t/how-are-you-handling-month-end-financial-close-in-2026-finance-summary-reconciliation-exports/659995) | **REFUSE** payout reconciliation product. Refund **order** clock stays HOLD |

## Do not ship from this note

Pixels, MTA, sessions, COGS / gross profit, VAT-stripped revenue, inventory, `read_all_orders` as Live, a sixth tab, a ShopifyQL explorer, discount-title crawl, country, gift-card liability, Recharge / Skio / Amazon, Slack / Flow / email product, payout fees, ERP ingest, recooking same-clock, recooking rank 6, recooking spend paste, recooking returning $, recooking dollars-by-code.

The desk does not already cover these operators. Pending-in is unnamed. Typical still fights Shopify AOV by ~20%. Dollars per unit are unasked. YTD is still 36 Finance reports. A plausible Shopify slice is unlabeled. $0 reships still poison units. Admin exchanges and cancels still need timestamps Mcfly does not have.
