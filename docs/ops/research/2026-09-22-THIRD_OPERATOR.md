# Third-pass operator pains — 2026-09-22

**Role:** Scout. Public complaints only (Shopify Community, Reddit, App Store). Order-history desk only.  
**Tip this note is about:** Fly **v422** / `3608683` at research start. `#172` quiet-back **merged** before this commit; the branch sits on Fly **v423** / `d2017c1`. Quiet-back does not close any row below. Live stays **PARKED**.  
**Painted IA:** Overview · Orders · Customers · Spend · Goals. No sixth tab.  
**Price:** $39 flat. No GMV ladder.  
**Religion:** Shopify Total Sales. Empty spend is not 0×. No pixels, COGS, sessions-as-a-promise, MTA, Amazon, Recharge, PII, or Admin door.

Quotes below are copied from the page fetched on **2026-09-22**, except two Reddit self-texts taken from the public search index after `reddit.com` returned a bot wall (same method as `NEXT_OPERATOR.md`). Nothing in quotation marks was written for this file.

## Floor — reciting these names as the whole note is FAIL

Already scored in `docs/ops/research/2026-09-22-ENTERPRISE_OPERATOR.md` and `docs/ops/research/2026-09-22-NEXT_OPERATOR.md`. Do not recook.

tonytapay · Kayleigh · Wing-roro · petgrocer · MagnumFonseca · SteveG79 · Tudirad · BrendanB-YLS · jbradley2319 · wilburnch · Jesse_G · lumine · Kove Footwear · CJackson770 · archit2001 · RomanRevenome · Losbsbbans · richjeff · bemo2 · Ohlala-equestrian · southdownsclay · Almathani · Adab01 · joshroban · Skengdo · maximilllllian · wilkius · ghayes54b · 74anders · cclumpner · LeonAndrew · WesQ · WUC444 · LukeRotherfield · SallyG · Ronan.Cian · Sarah568473 · WillowAndVine · LB2022 · koncz.szabi · rippedlazarus · rshrivastava63.

Ranks 8–12 of `docs/plans/2026-09-22-enterprise-next-queue.md` are already owned: whale ticket / RFM; Orders mix (1st/2nd/3rd/4th+ $, first vs returning ticket, tax/shipping slice, period concentration, new vs returning hour, discount $ vs last September, kept share vs last year, first vs returning discount depth, dollars per unit, $0 reship **count**); guest $ + Other **names** + returns climbing POS vs online; compete rows 2–3 + annual base; compete 4/6/7/8 + launch-week class. A new thread is allowed only when the **grain** is different.

## Stored Mcfly facts (so PASS / HOLD / REFUSE is not a wish)

| On the book | Not on the book |
| --- | --- |
| `OrderFact`: `amount`, `grossAmount`, `unitCount`, `sourceName`, first `discountCode`, `discountAmount`, `lifetimeOrders` (snapshotted from current `customer.numberOfOrders` at crawl), opaque `customerKey`, `orderedAt`, `shopLocalDate` | Refund **processing** date · country · product title / SKU · order tags · gift-card flag · subscription-checkout bit · per-location timezone · checkout.`source_name` · staff member · presentment as a second sum |
| `SalesDayFact`: Shopify Total Sales, net, gross, order count, new / returning $ | Sessions, conversion, checkout funnel |
| Spend paste | Ad-account OAuth, pixels, “true ROAS” |

Day totals go back five years. Order rows do not. SAMPLE must not invent a catalog Live cannot store.

## Already painted — do not list as finds

Median typical (`shopify-depth-stats.ts` `medianAov`, Overview / Orders greeting). Online vs POS vs Shop **typical** (`sourceMedianAov` on `orders-scoreboard.ts`). All-channel hour **share** and busiest hour. Weekday **share** (not dollars). AOV tiers (`buildOrdersAovTiers`). Full-price vs discounted median. All-channel code dollars (`buildOrdersCodeMoney`). Returns drag $ with the fact line “returns and edits.” Rank 7 quiet-back `$`.

## New pains a $5M store would still pay $39 to have answered

Twelve clear the bar. Threads below are not the floor cast.

### 1. Plus sample checkout is an “order,” so typical is Revenue ÷ Orders, not Revenue ÷ Purchases

**Their words:** “Our business offers both free Samples (£0 value) and full, paid purchases (>£0) via our website. … Both Samples and Purchases use the same checkout process, so come in to Shopify as “Orders”. This screws up AOV etc, as its trying to calulcate AOV as REVENUE / ORDERS, when it should actually be REVENUE / PURCHASES. … NB - we’re on Shopify Plus.” — CharlesUK, 9 Sep 2025. [£0 Sample vs >£0 purchase?](https://community.shopify.com/t/0-sample-vs-0-purchase/564366)

Same post, mixed carts: “where a single order has a purchase of 1 item, AND a sample of another item as line items on the same order.”

**Tab:** Orders first fold (typical), not a sample-tag filter.  
**Stored fact:** `amount` and `unitCount` are on the row. Order tags are not. Rank 9 owns **count** of `$0` reships (joshroban). That count is not “typical among paid checkouts.” `aggregateOrderRows` and `medianAov` still divide by every finite `amount`, including `0`.  
**PASS.** Period typical among orders with `amount > 0`, next to all-order typical, and the `$0` row count already queued as rank 9. Dash when paid orders < 8. Do not invent a “Sample” tag. Mixed paid+sample line items stay one paid order.  
**Why a $5M store cares:** Plus, same checkout, sample → purchase funnel. A Saturday operator who staffs ads or packs against typical will undershoot paid ticket by the free-sample order count.  
**Why it is not a nit:** Rank 9’s `$0` count does not change the typical the open lane already prints. CharlesUK’s job is the **denominator of typical**, not a reship tally.  
**REFUSE:** Pixel “Sample vs Purchase” events, Flow tags, ShopifyQL notebooks.

### 2. One checkout split into two Shopify orders drops AOV and inflates order count

**Their words:** “We’re evaluating splitting Shopify orders (e.g., separating pre-order and in-stock items into separate orders) and want to understand how this impacts Shopify’s native analytics, including order count, AOV, conversion rate, revenue reporting, and marketing attribution.” — TSAvi, 22 Jan 2026. [How order-splitting apps affect Shopify analytics and reportin](https://community.shopify.com/t/how-order-splitting-apps-affect-shopify-analytics-and-reportin/585308)

metric_nerd, 26 May 2026, same thread: “i’ve run into this before … for AOV specifically you want to calculate it off unique checkout IDs not order IDs.”

**Tab:** Orders.  
**Stored fact:** Opaque `customerKey` + `shopLocalDate` + `amount`. Checkout / parent order id is not stored.  
**PASS.** Period count of identified buyers with **2+ orders on the same shop-local day**, and the Shopify Total Sales on those extra rows, so typical is not silently the split. Guests out. Do not claim a parent checkout id.  
**Why a $5M store cares:** Pre-order + in-stock split is a Plus ops pattern. Same revenue, more orders, smaller typical — the operator fires the analyst who “fixed” AOV by changing the checkout.  
**Why it is not a nit:** Not whale ticket (rank 8). Not `$0` reship count (rank 9). Not guest `$` (rank 10). It is **same-day extra orders on an identified buyer**.  
**HOLD:** Order tags / parent id. **REFUSE:** Sessions / conversion on that same post.

### 3. The morning dashboard no longer puts POS `$` next to online `$`

**Their words:** “The new dashboard made it much more difficult to easily see my daily sales on the PoS and online store. I have to hover over an icon, then see a graph, then hover over a bar in the graph to see daily sales. Seems like a waste of time.” — Nik_Hawks, 29 Jun 2026. [Lost dashboard stats for PoS sales vs online](https://community.shopify.com/t/lost-dashboard-stats-for-pos-sales-vs-online/643823)

Follow-up, 1 Jul 2026: “Still surprising that Shopify doesn’t let you just configure your Dashboard the way you want it. I can’t imagine all stores do the same thing, the same way.”

**Tab:** Overview first fold. Orders already paints Online / POS / Shop **typical** and a **share** mix (`orders-scoreboard.ts` `sourceMedianAov`, `sourceSalesShare`). Overview’s four peeks are period total, typical, returning `$`, weekend **share**. There is no POS `$` · online `$` pair.  
**Stored fact:** `sourceName` → `classifyOrderSource`.  
**PASS.** Named Shopify Total Sales for POS and for online on the Overview first fold of the picked period (today / this week / this month), so a floor+site operator does not hover. Share % is not the dollar pair. Other **names** stay rank 10.  
**Why a $5M store cares:** Two books in one shop. The person opening at 9am needs both numbers, not a percent of a mix and not a typical. wilburnch (floor) wanted POS-only tape; this is the **pair**, not the drawer.  
**Why it is not a nit:** Rank 10 is guest `$`, names inside Other, returns climbing POS vs online. This is the morning **dollar pair** Overview still withholds.  
**HOLD:** Per-location POS tape (FERALGR family). **REFUSE:** Sessions on that dashboard.

### 4. POS donation / trade codes disappeared from the discount report

**Their words:** “Each year, I have run a Shopify report to determine the discounts we gave at our POS locations according to discount code. For instance, we have “donation” and “trade” code. This is important to reconcile what we have to damage out as well as our trade accounts. This year, the report is no longer working. I spoke with Shopify and they stated that the discount report doesn’t work because it is no longer pulling data from our POS.” — LisaNM, 20 Apr 2024. [How can I report POS discounts based on discount codes?](https://community.shopify.com/t/how-can-i-report-pos-discounts-based-on-discount-codes/316136)

**Tab:** Orders.  
**Stored fact:** First `discountCode` + `sourceName` + `amount`. v414 / rank 9 already paint **all-channel** code dollars and first vs returning discount depth. `buildOrdersCodeMoney` never filters `sourceName === "pos"`.  
**PASS.** Period Shopify Total Sales by discount **code** where `classifyOrderSource(sourceName) === "pos"`, named as POS code dollars, not a use count, not `WELCOME10` = 10%. Dash when POS code rows < 8.  
**Why a $5M store cares:** Multi-location POS, yearly trade and donation recon. A missing POS code book is a vendor / damage argument, not a chart preference.  
**Why it is not a nit:** jbradley2319 (floor) is all-channel code income. petgrocer is automatic **titles** (HOLD). This is **POS-only code `$`**.  
**HOLD:** Automatic discount titles. **REFUSE:** Damage-out inventory, a sixth Reports tab.

### 5. Shopify “returns” is 25% when parcels back are 3% — size swaps never left the building

**Their words:** “Shopify’s “Returns” metric counts every refund event — including pre-shipment order edits for size adjustments — as a return. This is wildly inaccurate. My Shopify-reported return rate is ~25%. My actual return rate is ~3%.” — YC3 (Evan, Yoga Crow; premium men’s activewear), 16 Jun 2026. [“Returns” metric in Analytics is misleading](https://community.shopify.com/t/returns-metric-in-analytics-is-misleading-should-reflect-actual-returns-not-all-refund-events/637409)

Same merchant, 16 Jun 2026: “I had zero actual physical returns in the last 7 days. Shopify reported -$572. Every single line item driving that number was a pre-shipment size swap.”

**Tab:** Orders.  
**Stored fact:** `grossAmount` vs `amount` is money off the order. Return status / “returned to inventory” is not on the row. `orders-scoreboard.ts` already defines drag as “returns and edits.” `OrdersIntelligence.tsx` still paints the week cell as “climbing” under a returns heading. Rank 10 owns POS vs online climbing, not this definition.  
**PASS.** Name the painted drag **money off the original checkout** (edits + refunds), never a return **rate**. Do not print 25% as parcels.  
**HOLD** a true parcel-back rate (no return status). Skengdo’s missing Admin refund line stays HOLD.  
**Why a $5M store cares:** Apparel. A 25% “return rate” triggers a fit recall; 3% with -$572 of size swaps is a different Saturday.  
**Why it is not a nit:** Rank 10 is which **source** is climbing. This is what the number **is**. A $5M operator who cuts SKUs off a 25% lie will cancel $39.

### 6. Shopify calls them “new” online after they already bought at POS

**Their words:** “Has anyone successfully exported their full order data over the span of 2+ years and analyzed to get their own accurate count of new customers vs. returning customers? … Did this customer actually find us and order from us for the first time online last year? - categorizing them a new customer OR did this customer order from us for the first time online after purchasing something in-person through POS a few years ago?” — u/whyanalyze, 12 Feb 2025 (Reddit search index; direct fetch 403). [New vs. Returning Customers](https://www.reddit.com/r/shopify/comments/1inkto2/new_vs_returning_customers/)

u/Downbadge69, same thread (index): “POS orders will be considered as well, but they will often not be associated with any customer record.”

**Tab:** Customers / Orders. Not compete row 2 (buyer age). Not rank 9 first-time vs returning **ticket**.  
**Stored fact:** Same opaque `customerKey` across `sourceName`. `ltv-by-source.ts` cohorts **lifetime** on first source. No open lane asks: this period’s **online** `$` from identified buyers whose **first stored order** was POS.  
**PASS.** This period Shopify Total Sales where `classifyOrderSource(this.sourceName) === "online"` and the buyer’s first stored order is POS. Guests out. Seal at 8 buyers. Thin side —.  
**Why a $5M store cares:** Omnichannel, 2+ years of orders. Paid acquisition that “finds” a POS regular looks like a new online buyer. Rank 11’s new `$` vs returning `$` vs last year does not split **new-to-web**.  
**Why it is not a nit:** Different grain from source LTV (already on the tip) and from new vs returning ticket (rank 9).  
**HOLD:** Matching POS guests who never gave an identity (they stay `guest`). **REFUSE:** PII / email / phone to stitch them.

### 7. Finance Summary “gross” is the list price they never collected

**Their words:** “The gross sales, and refunds to customers data on the finance summary page is a mess. The gross sales number seems to be inflated. I've specifically noted that it includes 'discounts.' If I mark an item down for a specific customer, it tallies the original cost in the gross sales, then subtracts the discount on a different line. But that shouldn't be in gross sales - that's money that I never received or was ever going to receive.” — u/Thermal_arc, 9 Jun 2026 (Reddit search index). [Basic sales report](https://www.reddit.com/r/shopify/comments/1u1b4ng/basic_sales_report/)

Corroboration, warehouse grain: mattread6, 21 Feb 2024: “Our shop modifies a lot of orders after order creation dates which result in additional sales and refunds.” [Replicating Shopify Analytics Reports with REST API](https://community.shopify.com/t/replicating-shopify-analytics-reports-with-rest-api/291676)

**Tab:** Orders / Overview.  
**Stored fact:** `grossAmount`, `discountAmount`, `amount`. Rank 9’s tax/shipping slice is Total − Net, not list vs collected. Discount **depth** (`Σ |discounts| ÷ gross`) is a percent, not the three named dollars.  
**PASS.** Period **list (gross) · discount `$` · Shopify Total Sales (current `amount`)** as three named numbers, so a markdown at the till is not “inflated sales.” Missing gross stays —, never a fake `$0`.  
**Why a $5M store cares:** The accountant reads Gross on Finance Summary. A $5M book that marks down trade / wholesale will fight the Saturday pack until the three lines sit together.  
**Why it is not a nit:** Not tax/shipping (rank 9). Not dollars-per-unit. Not code income.  
**REFUSE:** Payout CSV, processor fees, bank match (Thermal_arc’s own workaround).

### 8. `numberOfOrders` is today’s lifetime, so last January is silently “returning”

**Their words:** “Shopify returns the current order count of the customer…. say you have a customer who has ordered for their first time in January and then again in February, if you run a report for orders in Jan and Feb this customer will have a value of 2 in their `customer.order_count` field, making this field unreliable for almost every kind of cohort reporting.” — dunk, 18 Feb 2026. [New vs retuning customers using API](https://community.shopify.com/t/new-vs-retuning-customers-using-api/417580)

developerAnna, 3 Jun 2025, same thread: totals from `orders_count` “do not match the New vs. Returning Customers report shown in the Shopify Admin Analytics dashboard.” lhmass, 7 Aug 2025: “Both under-report new customers as shown in Shopify analytics.”

OMAFood / Léa, 15 Apr 2025, merchant-facing cousin: “in March, we had 225 customers : 191 new customers and 45 returning customers. … 191 + 45 = 236 and not 225.” [New VS Returning customer](https://community.shopify.com/t/new-vs-returning-customer/408807)

**Tab:** Customers (returning `$` / first-time counts), Orders mix.  
**Stored fact:** Ingest writes `lifetimeOrders: parseLifetimeOrders(node.customer?.numberOfOrders)` (`order-facts.server.ts` ~711) — **current** lifetime at crawl / recrawl. `orderIsReturning` / `buyerKind` treat `lifetime > stored` as returning, so a 90-day unpaid till (or a recrawled January row) can paint a first-on-this-book order as returning because Shopify’s counter already moved. Rank 9’s 1st/2nd/3rd **ticket** uses that same field.  
**PASS.** New vs returning **dollars** for a picked period from `orderedAt` sequence on the stored book only. When `lifetimeOrders > stored`, that is its own empty (“earlier orders exist off this till”), never silently stuffed into returning. Guests out. Unknown lifetime stays unknown.  
**Why a $5M store cares:** Unpaid 90 vs paid 24. A January cohort cooked off today’s `numberOfOrders` is the dunk lie. OMAFood’s 191+45≠225 is unique **people** vs returning **orders** — name both.  
**Why it is not a nit:** Rank 9 assumes the step field is as-of-order. This thread proves the snapshot is **now**.  
**HOLD:** Reconstructing lifetime for orders that never entered the till. Do not lengthen the 90.

### 9. Opening hours need POS `$` by hour of day for six months, not a new-vs-returning hour

**Their words:** “I currently have a physical store and we use Shopify. I am considering altering our opening hours and would like to see how many sales we get for specific times. I am wondering if anyone knows how I can create a sales report by time for the past 6 months?” — u/fatcats94, 24 Sep 2024 (Reddit search index). [Sales records by time?](https://www.reddit.com/r/shopify/comments/1fo619a/sales_records_by_time/)

**Tab:** Orders.  
**Stored fact:** `orderedAt` + shop IANA tz + `sourceName`. `shopify-depth-stats.ts` hour totals sum **every** source. `ordersHourBreakdown` prints the top three hours as **share %**. Rank 9 owns **new vs returning hour**, not POS-only hour **dollars**.  
**PASS.** Picked-period Shopify Total Sales by shop-local hour where `classifyOrderSource === "pos"`. Name `$`, not only %. Dash when POS rows < 8. Unpaid 90 cannot claim six months of order rows — say so.  
**Why a $5M store cares:** Floor labor. A 6-month hour book decides whether 8pm stays open. All-channel hour share mixes the website night shift into the register.  
**Why it is not a nit:** Different grain from rank 9’s new vs returning hour and from Overview’s busiest-hour peek (all sources, share).  
**HOLD:** Per-location hour (no location id). **REFUSE:** Sessions-over-time as the staffing clock.

### 10. “Which days are busy” is still a percent, so Saturday keep-open is a spreadsheet

**Their words:** “Hi - need a report to show which days of the week are busy/least busy. There must be one but I can’t find it! Not bothered about times of the day, just need to know which days are doing what over certain time periods.” — MightyMelee (Phil), 30 May 2024. [POS sales by day](https://community.shopify.com/t/pos-sales-by-day/327343)

**Tab:** Orders / Overview weekday peek.  
**Stored fact:** `shopLocalDate`. `weekdaySalesShare` and Overview weekend peek are **percents**. `ordersWeekdayBreakdown` prints `Thu 19% · Wed 19%`. No open lane names **Shopify Total Sales by weekday** for the picked period (or POS-only). CrossFit Mayhem 2022 asked Saturday POS for the year — too old to count; the 2024 grain is the same job still unasked.  
**PASS.** Period Shopify Total Sales for Mon…Sun (shop-local), optional POS filter via `sourceName`. Copyable “Saturday did `$` of this window.” Share % can stay as the sub.  
**Why a $5M store cares:** Keep Saturday staffed or close it. 19% of an unnamed total is not a labor decision.  
**Why it is not a nit:** Same-clock (v415) is today-through-this-hour vs last year. Rank 9 period concentration is best days as a **share**. This is the **dollar** by weekday.  
**HOLD:** Per-location Saturday. **REFUSE:** Inventory / reorder.

### 11. Ads operators compare Meta to the whole shop, then hunt a pixel that never fired on POS / drafts

**Their words:** “A while back I realised my conversion tracking had been under-reporting for a stretch — pixel/CAPI just wasn’t sending everything it should — and I only noticed when the numbers in my ad platform stopped matching my actual Shopify orders. By then I’d been optimising (and spending) on bad data for a while.” — tilal, 15 Aug 2026. [How do you catch it when your Meta Pixel / GA4 / CAPI quietly stops firing?](https://community.shopify.com/t/how-do-you-catch-it-when-your-meta-pixel-ga4-capi-quietly-stops-firing/666988)

MayraApps, 17 Aug 2026, same thread: “For values rather than counts, dont track revenue directly, track revenue divided by purchase events and compare that to your Shopify AOV.”

A reply on that thread names the mix (subscription / POS / Shop / drafts as half the monthly order count). That poster is already on the floor HOLD table — **do not recook them**. The merchant here is tilal.

**Tab:** Overview / Orders.  
**Stored fact:** `sourceName`, `amount`, spend paste. Pixels are refused.  
**PASS.** Named **online-store** Shopify Total Sales and online typical for the picked period (web / iphone / android via `classifyOrderSource`), so the ads Saturday compares Meta to the book that could have had a session — not POS + Shop + draft. Copyable. Spend stays typed paste ÷ that online `$` only when mix says so (v419 leftover is POS-in-ads ROAS — this is the **sales numerator** for the ads check, not a new ROAS).  
**Why a $5M store cares:** tilal already spent into a gap. A $5M paid program that diffs Meta against POS+draft will “fix” tracking every December mix shift.  
**Why it is not a nit:** Rank 10 names Other. Nik_Hawks (#3) wants the POS **and** online pair for the floor. This is the **web-only** number the ads seat needs.  
**REFUSE:** Pixels, CAPI, GA4, MTA, “true ROAS.” **HOLD:** Subscription-checkout bit (renewals without a session).

### 12. Analytics hid the compare-to **dollars**; retail still needs last year’s figure, not a percent

**Their words:** “It’s incredibly frustrating to only see a percentage difference in Analytics, with no actual data/figures/amounts for the ‘Compare to’ date range. … if we drill into the ‘Sales over time’ report YOU CAN’T COMPARE TO THE PREVIOUS YEAR??!!” — Ben31, 29 Nov 2024. [REQUEST: Bring back ‘Compare to’ figures and dates in Analytics](https://community.shopify.com/t/request-bring-back-compare-to-figures-and-dates-in-analytics/377695)

Southpaw1, 2 Jan 2025, same thread: “I’ve been sitting here for nearly an hour trying to return the settings to the views and analytics I’ve had previously … I was reliant on this feature for instant insights into my retail business.”

DBnSF, 12 Feb 2025, seasonal cousin: “Who has shifting trends by month? It should always be YoY as default.” [Reports compare annually](https://community.shopify.com/t/reports-compare-annually/321472)

**Tab:** Spend explorer + Orders week board. Overview already has year-card `$` and same-clock `$`. Spend `compareExplorerBuckets` compares the **previous bucket inside the window** (this month vs last month), not the same week last year. Orders weekly `ordersDelta` is **order count**, not last year’s `$`. Rank 7 owns Growth first-time `$` copy.  
**PASS.** Copyable this-week / this-month Shopify Total Sales **and** the same weekday-shifted last year `$` (or previous week `$` when last year is not on file — never a fake `$0`). Name both dollars. A percent-only chip is not enough. Missing last year stays not on file.  
**Why a $5M store cares:** Seasonal retail. A −12% with no compare-to `$` is not a board pack. Southpaw1 burned an hour for the number Overview already knows how to name.  
**Why it is not a nit:** Not same-clock through-this-hour (v415). Not Overview year cards. The leftover is **Orders / Spend** still hiding the compare-to figure.  
**REFUSE:** Sessions compare. **HOLD:** ShopifyQL explorer.

## Verdicts in one place

| # | Pain | Tab | Verdict |
| --- | --- | --- | --- |
| 1 | Plus sample orders in typical’s denominator | Orders | **PASS** paid typical. **REFUSE** pixels / tags |
| 2 | Split checkout inflates orders / drops AOV | Orders | **PASS** same-day extra-order `$`. **HOLD** parent id |
| 3 | Morning POS `$` vs online `$` | Overview | **PASS** dollar pair. **HOLD** location tape |
| 4 | POS donation / trade code `$` | Orders | **PASS** POS-filtered code `$`. **HOLD** automatic titles |
| 5 | 25% “returns” vs 3% parcels | Orders | **PASS** name money-off. **HOLD** parcel rate |
| 6 | New-to-web after POS | Customers / Orders | **PASS** POS-first → this-period online `$`. **HOLD** guest stitch |
| 7 | Gross is list price they never collected | Orders | **PASS** gross · discount `$` · Total Sales. **REFUSE** payouts |
| 8 | `numberOfOrders` is today, not as-of | Customers | **PASS** sequence on the till; off-till empty. **HOLD** unstored history |
| 9 | POS hour `$` for opening hours | Orders | **PASS** POS hour `$`. **HOLD** per-location |
| 10 | Weekday busy as `$`, not % | Orders | **PASS** weekday `$`. **HOLD** per-location Saturday |
| 11 | Ads seat needs web-only `$` | Overview / Orders | **PASS** online-store `$` + typical. **REFUSE** pixels |
| 12 | Compare-to `$` hidden behind a % | Spend / Orders | **PASS** copyable prior `$`. **HOLD** ShopifyQL |

## Top merchant sentences (new threads)

1. “This screws up AOV etc, as its trying to calulcate AOV as REVENUE / ORDERS, when it should actually be REVENUE / PURCHASES. … NB - we’re on Shopify Plus.” — [CharlesUK](https://community.shopify.com/t/0-sample-vs-0-purchase/564366)
2. “The new dashboard made it much more difficult to easily see my daily sales on the PoS and online store.” — [Nik_Hawks](https://community.shopify.com/t/lost-dashboard-stats-for-pos-sales-vs-online/643823)
3. “My Shopify-reported return rate is ~25%. My actual return rate is ~3%.” — [YC3 / Yoga Crow](https://community.shopify.com/t/returns-metric-in-analytics-is-misleading-should-reflect-actual-returns-not-all-refund-events/637409)
4. “Did this customer actually find us and order from us for the first time online last year? … after purchasing something in-person through POS a few years ago?” — [u/whyanalyze](https://www.reddit.com/r/shopify/comments/1inkto2/new_vs_returning_customers/)
5. “If I mark an item down for a specific customer, it tallies the original cost in the gross sales, then subtracts the discount on a different line. But that shouldn't be in gross sales.” — [u/Thermal_arc](https://www.reddit.com/r/shopify/comments/1u1b4ng/basic_sales_report/)
6. “this customer will have a value of 2 in their `customer.order_count` field, making this field unreliable for almost every kind of cohort reporting.” — [dunk](https://community.shopify.com/t/new-vs-retuning-customers-using-api/417580)
7. “the discount report doesn’t work because it is no longer pulling data from our POS.” — [LisaNM](https://community.shopify.com/t/how-can-i-report-pos-discounts-based-on-discount-codes/316136)
8. “I only noticed when the numbers in my ad platform stopped matching my actual Shopify orders. By then I’d been optimising (and spending) on bad data for a while.” — [tilal](https://community.shopify.com/t/how-do-you-catch-it-when-your-meta-pixel-ga4-capi-quietly-stops-firing/666988)

## Also HOLD or REFUSE (new threads, not the quota)

| Operator | Date | Ask | Verdict |
| --- | --- | --- | --- |
| Thethief / Ontopofthehill | 18 Mar / 22 May 2026 | Wine bar / cellar door: API drafts never appear on POS Pro. “I don’t want to move to toast or lightspeed.” [API-created draft orders](https://community.shopify.com/t/api-created-draft-orders-should-be-visible-in-pos-like-admin-created-ones/592477) | **REFUSE** Admin door / POS UI extension. Honesty that invoice-paid drafts can land as `sourceName = web` is already inside #11 |
| twoplusone / supportlocal / HeatherTX | Dec 2024 – Apr 2025 | POS Pro custom sale / consignment vendor “None”; Q4 pay. [Report of Custom Sales](https://community.shopify.com/t/report-of-custom-sales/383830) | **HOLD** product title / vendor. **REFUSE** ShopifyQL box |
| Karla_Robinson (High Desert Milk) | 29 Jun 2026 | Farmer-owned dairy; shipping baked into price; want label **cost** in profit. “50+ orders a week” in a later reply. [Cost paid for shipping labels](https://community.shopify.com/t/cost-paid-for-shipping-labels-is-needed-in-analytics/644164) | **REFUSE** COGS / label cost. `multiUnitOrderShare` is already an order-count % — 1-unit vs 2+ **`$`** would be a leftover cook only if a later note proves the dollar grain; not counted here |
| fpdev | 8 Jan 2025 | POS sales by **staff** report broken; 9 staff results. [POS total sales by staff](https://community.shopify.com/t/pos-total-sales-by-staff-member-report-is-completely-bugged-broken/385544) | **REFUSE** staff PII |
| rpamiral | 9 Apr 2025 | Net sales > Gross because returns added. [Total Sales Breakdown](https://community.shopify.com/t/an-apparent-error-in-the-total-sales-breakdown/407529) | Same family as #5 / #7. Corroboration, not a 13th cook |
| bindraft / MichaelMHahn | Jun 2026 | Lifetime one-per-customer checkout limit. [True lifetime limits](https://community.shopify.com/t/true-lifetime-one-per-customer-ever-limits-is-this-still-a-real-pain-in-2026/631523) | **REFUSE** checkout Functions / Admin door. Same-day double order is #2 |
| watches1 / Syed_Noor | 11 May / 25 Jun 2026 | Automate GA4; “Do not treat GA4 revenue as your books.” [Automate GA4 reporting](https://community.shopify.com/t/looking-for-ways-to-automate-ga4-reporting/622028) | **REFUSE** sessions / GA4. Shopify-as-books is already the religion; not a new lane |
| jsp_ecommerce / shockseals / LeonaMM | 2023–23 Jan 2025 | Median order value as a front-page metric. [Median order value](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046) | **Already painted** (typical = median). Not a find |
| YC3 (home widget) | 16 Jun 2026 | Home stats bar lost the date range. [Home page stats widget](https://community.shopify.com/t/home-page-stats-widget-no-longer-shows-time-period-or-date-selector/637406) | Volume / craft leftover if Mcfly still prints a number without a window. Not this scout’s quota — Overview already names the period |
| Polar / Lifetimely 1-stars 2025–2026 | — | Support, VAT, Amazon, GMV tax, billing after cancel | Floor REFUSE. No new order-history 1-star body to quote beyond Kove / Twitter Bikes / VocaSpark |

## Already-ranked skips (restated only to prove they were not recycled as the list)

| Rank | Sentence this note did **not** re-rank |
| --- | --- |
| 8 | Whale 1 ticket / RFM flow / watchlist 8 |
| 9 | 1st/2nd/3rd/4th+ `$`, first vs returning ticket, tax/shipping, period concentration, new vs returning **hour**, discount `$` vs last September, kept share vs last year, first vs returning discount depth, dollars per unit, `$0` reship **count** |
| 10 | Guest `$`, Other **names**, returns climbing POS vs online |
| 11 | Buyer age; new `$` vs returning `$` vs same quarter last year; annual base |
| 12 | Compete 4/6/7/8; launch-week class; orders per month of life |
| 7 in flight | Quiet-then-back `$` + copyable first-time `$` (`#172`) |

## Do not ship from this note

Pixels, MTA, sessions, COGS / label cost / gross profit as hero, VAT-out, inventory, `read_all_orders` as Live, a sixth tab, a ShopifyQL explorer, discount-title crawl, country, gift-card liability, Recharge / Skio / Amazon, Slack / Flow / email product, payout fees, ERP ingest, staff names, Admin door / POS extensions, recooking same-clock, recooking ranks 8–12, recooking the floor cast.

The desk does not already cover these operators. Paid typical still includes `£0` sample orders. Split checkouts still shrink typical. Overview still withholds the POS vs online **dollar** pair. POS code `$` is not filtered. “Returns climbing” still reads as parcels. New-to-web after POS is unasked. Gross vs discount vs Total Sales are not three named dollars. `lifetimeOrders` is still today’s counter. POS hour `$` and weekday `$` are still shares. The ads seat still lacks a web-only Total Sales. Spend / Orders still hide the compare-to **figure**.
