# Next desk truth — jobs the v414 book already holds

**Scout:** Desk-truth · **Date:** 2026-09-22  
**Branch:** `cursor/next-desk-truth-5bc6`  
**Base:** `origin/cursor/spend-trust-recurring` @ `b6c4073` (`docs: stamp Fly v415 and name the third-order steps`)  
**Fly note:** v415 / tip `dd865c3` (same-clock `#157` merged) · Live PARKED · ShopifyQL HOLD  
**IA:** Overview → Orders → Customers → Spend → Goals. Growth and LTV stay Customers chips.

A $5M–$10M Shopify operator still has order-history jobs this desk does not ask, even though `OrderFact` already stores `unitCount`, `discountCode`, `sourceName`, `grossAmount`, `amount`, `lifetimeOrders`, and `discountAmount`, and day totals already go five years. Last wave lived on Overview, Orders, and the Customers mix. This note walks Spend, Goals, LTV, whales, phone, and copy.

This is not a recook of v410–v415. It is not `#152` still-PASS with new adjectives. Same-clock is on the tip — not listed as missing. Rank 6 (third-order ticket/wait on Growth) is the named next ship — not listed as a new find.

## How to read a row

| Verdict | Meaning |
| --- | --- |
| **PASS** | One cook. No new tab. No new product scope. Uses fields already stored. |
| **HOLD** | Needs a stored field that is not on the row, or a Marty call. |
| **REFUSE** | COGS, pixels, sessions, Amazon, Recharge, sixth tab, invented stars. |

## Floor — walked, not listed as finds

Already on the tip: morning sentence · period-total hero · live catalog empty · returning mix from the stored book · Orders intelligence on the picked period, code dollars, returns climbing · same-clock compare (v415).

Already named still-PASS in `#152` (file depth only, not this quota): phone chips + full-price vs discounted peek · DeskLane `defaultOpen` · payback day-0 `$0` · history banner 24 months vs unpaid 90 · source names inside Other · compete rows 2–8 · rank 6 ticket/wait (now the named next ship on `cursor/third-order-steps-5bc6` — do not list as a find, do not start it from this note).

## Gaps (new)

### 1. Guest checkout as dollars this month — PASS

**Merchant:** “How much of this month’s Shopify Total Sales is guest checkout, not a percent of orders — and why does Live look like I have none?”

**Tab:** Orders, and Customers (same guest tile).

**Evidence:** `OrderFact.customerKey` is `"guest"` on guest checkouts (`ORDER_FACT_GUEST_KEY` in `app/app/lib/order-facts.server.ts`). `shopifyDepthStats` already splits those rows and computes `guestAov` (`app/app/lib/shopify-depth-stats.ts`). The painted tile is **order share**: `guestShare = guestOrders / orderCount` in `app/app/lib/shopify-native-stats.ts`, shown in `ShopifyBookSection.tsx` / `CustomersScoreboard.tsx`. Live day facts write `guestOrders: 0` in `salesResultFromDayTotal` (`app/app/lib/sales-facts.server.ts`). There is no guest **sales** share. Summing `amount` where `customerKey === "guest"` is one pass over rows the Orders loader already has.

**Why a $5M store cares:** Guest checkout at this size is often a cheap one-item path next to identified $200+ tickets. A headcount percent (or a Live zero) sends the account-creation meeting after the wrong dollar. Shopify Analytics’ returning-customer rate also drops guests; this desk already knows that and still does not put guest **dollars** on the open lane.

**Why it is not a nit:** The book can name the dollar today. The tile names a different grain, and on Live it names a stored zero. That is a Saturday number a finance lead will distrust once.

### 2. Total ROAS still divides POS and Shop into the ads ratio — PASS

**Merchant:** “My typed ads spend is the online store. Why does Total ROAS still count POS and Shop as if I paid for them?”

**Tab:** Spend (open lane). Orders already has the source bar.

**Evidence:** Total ROAS is `Shopify Total Sales ÷ entered spend` (`NUMBER_HONESTY.formula` in `app/app/lib/number-honesty.ts`; Spend pair in `app/app/routes/app.spend.tsx`). The numerator is the period’s full till (`metrics.sales`), not `classifyOrderSource`. `OrderFact.sourceName` is stored. `shopifyDepthStats` already returns `sourceSalesShare` for Online / POS / Shop / Other (`app/app/lib/shopify-depth-stats.ts`). Customers → LTV already cohorts first-order source (`LtvBySourceRows.tsx`). Spend never offers a second labeled ratio that uses **Online** Shopify Total Sales as the numerator. Empty spend stays —. This is not pixel ROAS and not a POS drawer tape.

**Why a $5M store cares:** Omnichannel books at this size often run 15–40% POS or Shop. A 3.5× on the pair card is then a blended till, not the ads meeting. The operator already typed spend. The source dollars are already on the order.

**Why it is not a nit:** One extra labeled line on Spend (Online sales ÷ typed spend, with POS/Shop named as excluded) changes whether they scale ads on Saturday. Do not replace the Total ROAS religion. Do not claim attribution.

### 3. Whale 1’s ticket is on the rollup and off the list — PASS

**Merchant:** “Is Whale 1 a VIP who keeps coming back, or one huge first order? I see rank, lifetime, repeat, and days-since — not the ticket.”

**Tab:** Customers (whale watchlist on the open lane). Not the Admin door.

**Evidence:** `BuyerRollup` already has `total`, `orders`, `firstAmount`, `last` (`app/app/lib/customers-rfm.ts`). `repeatRevenueOf` is `total - firstAmount`. `WhaleWatchRow` stores `lifetime`, `repeatRevenue`, `orders`, `daysSince` — not typical ticket (`lifetime / orders`), not first ticket, not later ticket (`repeatRevenue / (orders - 1)`). `CustomerWhaleWatch.tsx` paints Order LTV · Repeat · Last. The drill repeats those three. Hunt 11 in the megaprompt: the Admin link stays HOLD; this is what the stored lifetime and ticket can already say. Guests stay out. Floor stays 8 buyers.

**Why a $5M store cares:** Wholesale drafts and one wedding order create false whales. A $12k lifetime from 40 $300 orders is a different Saturday call from $12k once. The rank without a ticket is a statistic they cannot act on without opening Shopify (the door they are not allowed to have yet).

**Why it is not a nit:** The numbers are already computed per row. The list hides the one that changes the call. Not a new crawl. Not PII.

### 4. Next month assumes I sell every calendar day — PASS

**Merchant:** “I am closed Sundays / my volume sits on 20 selling days. Why does next month equal my busy-day median times 30?”

**Tab:** Goals (`OrderHistoryForecast`). Same typical-day helper as Overview month close.

**Evidence:** `overviewTypicalDayFromBook` keeps only `n > 0` days, then needs 8 of them (`app/app/lib/overview-mix-forecast.ts`). `buildOrderHistoryForecast` multiplies that median by `clock.days` — every day in the next calendar month (`app/app/lib/order-history-forecast.ts`, `ORDER_HISTORY_FORECAST_FORMULA = "Next month = typical day × days in that month"`). Quiet days are dropped from the median and then added back as if they will sell. Goals month-close does the opposite: `avgDailySales = mtdSales / daysElapsed` includes quiet days (`buildMonthCloseForecast` in `app/app/lib/sales-goals.server.ts`). Two paces on the same tab. Day totals are already on file, including certified $0 days.

**Why a $5M store cares:** A mid-seven-figure shop with a weekend pattern, a wholesale calendar, or promo clustering will overstate next month by the silent days. They will staff and buy inventory on that line. The formula is on the page; the operator still reads it as “what we will sell.”

**Why it is not a nit:** The cook is to count selling days in the next month (or include stored $0 days in the median), and to say so. Missing last year stays —. Never a fake $0 day invented where the book has no row.

### 5. Month-close spend pace walks through days I did not spend — PASS

**Merchant:** “I paste ads on weekdays. Why does the Goals close assume I will spend the same amount on Saturday and Sunday?”

**Tab:** Goals year board / month-close forecast.

**Evidence:** Hunt 5 asked where else a day count is interpolated through a fake $0 after payback. Payback is still-PASS (`cash-payback.ts` day-0 `{ revenue: 0 }`) — not this row. `buildMonthCloseForecast` sets `avgDailySpend = mtdSpend / daysElapsed` then `projSpend = mtdSpend + avgDailySpend * remainingDays` (`app/app/lib/sales-goals.server.ts`). `daysElapsed` is the calendar clock, not days with typed spend. A $0-spend Sunday still lowers the average and still gets spend projected onto remaining Sundays. `calculateMer(projSales, projSpend)` then paints a close Total ROAS. Spend coverage already knows which days are filled (`loadSpendDayCoverage`, 90 days). The year board still uses that blended pace. Empty **month** spend stays a dash on the MER cell (`calculateMer` returns null when `totalSpend <= 0`). Partial-month spend does not.

**Why a $5M store cares:** Weekend organic and weekday paid is the normal pattern. Projected spend (and the implied remaining ceiling) is the number they take to the ads meeting. Interpolating through days they never buy ads is the same class of fake zero as payback, on a tab last wave did not cook.

**Why it is not a nit:** Recooking payback would not fix this file. One cook: pace remaining spend on days that already have spend, or stop printing `projSpend` / `projMer`.

### 6. Cash CPA by week is blank on Live because the day spine still uses a stored zero — PASS

**Merchant:** “This month’s Cash CPA card has a number. I switched the explorer to week. Why is every bar spend with no buyers?”

**Tab:** Spend → Cash CPA explorer.

**Evidence:** Window cards overlay unique `OrderFact` counts (`applyUniqueBuyerCounts` + `countNewBuyersInRange` / `countIdentifiedBuyersInRange` in `app/app/lib/cpa-desk.server.ts` and `desk-spend-stack.server.ts`). The explorer grain does not. Live `loadBuyerDays` / `loadSpendCpa` reads `SalesDayFact.newCustomers` and sets `buyersKnown: false`. `salesResultFromDayTotal` writes `newCustomers: 0`. `bucketCpaDays` then returns `buyers: null` and `cashCpa: null` whenever `buyersKnown` is false (`app/app/lib/cpa-desk.ts`). SAMPLE sets `buyersKnown: true` from `SampleSalesDay`. Paste already interned unique buyers by shop-local day (`buildLivePasteBuyerIndex` in `app/app/lib/spend-paste-buyers.server.ts`) and the paste preview refuses to invent CPA from `buyersKnown: false` points. The explorer never joins that index.

**Why a $5M store cares:** Month and Last-28 CPA are the meeting. Weekday vs weekend CPA is how they cut the daily rate. On Live the grain they tap is empty while SAMPLE looks finished. Unique buyers for those days are already in the same Spend loader.

**Why it is not a nit:** This is not the payback `$0` anchor. It is not “add a tooltip.” One cook wires the existing paste index onto explorer days. Empty spend stays —. Unknown buyers stay —, never spend ÷ 0.

### 7. Total ROAS keeps full-month sales when spend only covers some of the days — PASS

**Merchant:** “I sold every day. I only pasted weekday invoices. Why is Total ROAS 6×?”

**Tab:** Spend first pair.

**Evidence:** `formatTotalRoasEquation` is `sales ÷ spend` for the whole period (`app/app/lib/number-honesty.ts`). `NUMBER_HONESTY.isLine` says “every dollar you typed.” It does not say the numerator still includes Shopify Total Sales on days with no spend row. Coverage is a filled/empty strip of spend days only (`SpendDayCoverageCell.filled` in `app/app/lib/spend-coverage.server.ts`) — it does not overlay `SalesDayFact` days with sales. Empty **all** spend correctly paints —. Partial spend + full sales inflates the multiple. Spend explorer already has per-day `sales` and `spend` (`ExplorerDailyRow` in `app/app/lib/spend-explorer.ts`) and is not the pair card the eye lands on.

**Why a $5M store cares:** A seven-figure month with a missed weekend paste, an agency retainer typed on one day, or a mid-month start will show a hero Total ROAS nobody can defend in Slack. They will either over-spend to “bring it down” or distrust the desk.

**Why it is not a nit:** Do not write $0 spend onto missing days (that would crash the ratio the other way). Name the coverage: sales days vs spend days, or withhold the pair until the merchant says the holes are real zeros. Same religion: never 0×.

### 8. A teammate still cannot copy the Spend sentence — PASS

**Merchant:** “Paste me Shopify Total Sales, typed spend, and Total ROAS for this month, named as Shopify Total Sales — not a screenshot of the pair card.”

**Tab:** Spend. (Goals already copies the order-history target line via `CopyMorningSentence` on `OrderHistoryGoalsBoard.tsx`. Growth / LTV / whales already have `SlackInsightCard`. Spend has none.)

**Evidence:** `pairEquation` is painted on `app.spend.tsx` / `demo.spend.tsx` from `formatTotalRoasEquation`. `app/app/lib/shareable-insights.ts` kinds are `returning` · `typicalOrder` · `daysToSecond` · `ltvPeek` · `whale`. `SlackInsightCard` is not imported on Spend. Morning habit is Overview and explicitly “no spend, no ad login” (`morning-habit.ts`). Hunt 7: what a second seat can copy besides the morning strip. A $5M operator Slack is the Total ROAS line with the window named.

**Why a $5M store cares:** The ads lead is not in Admin. They get one paste. Today that paste is the morning returning-$ sentence, which is the wrong meeting.

**Why it is not a nit:** A Fly still needs a merchant sentence. This is that sentence, on a tab last wave did not copy. Do not invent a Slack product. Do not copy 0×. Do not copy a fake $0.

### 9. This month’s dollars from people who were quiet 90+ days — PASS

**Merchant:** “How much of this month came from buyers who had gone quiet — not everyone who ever bought before?”

**Tab:** Customers (Returning mix and/or RFM). Not rank 6. Not compete row 2.

**Evidence:** Returning mix is “any earlier stored order” (`buyerKind` / `firstByCustomer` in `app/app/lib/customers-analytics.ts` and `orders-intelligence.ts`). RFM **hibernating** is the opposite clock: last order **more than** 90 days ago, so they have not come back (`segmentFor` in `app/app/lib/customers-rfm.ts`; dollars on the segment card are lifetime, not this month). Win-back play is a **count** of one-order buyers past typical + 15 (`buildReturningMixPlays` id `"winback"`). Nobody sums **this month’s** `amount` for identified buyers whose previous `orderedAt` was ≥ 90 days before this order. `OrderFact` has `customerKey`, `orderedAt`, `amount`. Guests out. Floor 8 buyers. Thin side —.

**Why a $5M store cares:** Win-back spend is a real line at this size. “Returning $” mixes last week’s regulars with last year’s quiet list. RFM says who is still asleep. The open lane never says who woke up this month and how many dollars that was.

**Why it is not a nit:** Compete row 2 is this month’s sales by **lifetime age** (`lifetimeOrders`). This is recency-before-this-order. Different job, same stored book. Do not recook rank 6 ticket/wait.

### 10. This month of the year plan is a till total — not returning dollars — PASS

**Merchant:** “I set a year returning-$ target. For September, how much of the plan actual was returning dollars?”

**Tab:** Goals year board. Habit board is year-to-date returning vs a year target, not the month row.

**Evidence:** `GoalMonthRow` is `salesGoal`, `actual`, `spend`, `mer` (`app/app/lib/sales-goals.server.ts`). `actual` comes from `salesByMonthFromDayMap` (day-total Shopify Total Sales). `buildHabitGoals` / `OrderHistoryGoalsBoard` compare **year** returning $ to a typed year target. `OrderHistoryForecast` repeating that year number under a “Returning $” label next to “This month sales” mixes grains on the same list (`app/app/lib/order-history-forecast.ts`). Identified returning $ for a calendar month is already how Customers mix classifies `OrderFact` (v413). Day totals go five years for the till; order rows cover the 24-month buyer split. Missing last year on a month stays not on file, never $0.

**Why a $5M store cares:** The year returning target is the brand goal. The Saturday close is a month. A month that hit the sales plan on new-buyer discounting is a different call from a month the regulars carried. They already typed both targets. The year table only answers one.

**Why it is not a nit:** Compete row 3 (new $ vs returning $ vs the same **quarter** last year) is Overview, still-PASS, not this Goals row. Do not start that Overview cook here. This is the plan table.

### 11. Discount dollars this September vs last September — PASS

**Merchant:** “Was this month deeper on promo than the same month last year, in dollars — not which code, not a weekly climb?”

**Tab:** Orders (intelligence already names codes and weekly returns for the **picked** period).

**Evidence:** Rank 4 (on the tip) is code dollars and returns vs the prior slice of the same board. `discountAmount` is on `OrderFact`. Weekly `discountDepth` is `discount / gross` inside the current window (`buildOrdersWeeklyRows` in `app/app/lib/orders-intelligence.ts`). There is no same-month-last-year discount-dollar line. Same-clock (v415) is Shopify Total Sales through this hour / those dates last year — not discount $. Day totals do not store discount. Order rows go 24 months (`ORDER_ROW_WINDOW_MONTHS`), which covers last September for a shop that has been on the desk. Missing last year stays —. `WELCOME10` stays a name, never 10%. Automatic titles stay HOLD.

**Why a $5M store cares:** Year-over-year promo intensity is the merchandising close. A 4% discount share last September vs 11% this September is tens of thousands of dollars and a different read than “WELCOME10 took $X this month.”

**Why it is not a nit:** The field is stored. The compare window is the same shape as day totals last year. It is not a recook of code income.

### 12. Returns climbing on POS vs online — PASS

**Merchant:** “Are the returns this month coming from the online store or from POS?”

**Tab:** Orders (source bar + intelligence).

**Evidence:** Rank 4 weekly returns use `grossAmount - amount` for the whole slice. `classifyOrderSource(sourceName)` already buckets Online / POS / Shop / Other. `buildOrdersSourceBar` gives Other no typical order and does not give any source a returns drag (`app/app/lib/orders-scoreboard.ts`). Intelligence code money splits new vs returning vs guest, not returns by source (`buildOrdersCodeMoney`). Both `grossAmount` and `sourceName` are on the row the Orders loader already passes (`desk-sales-page.server.ts`). Naming Other’s **source strings** is still-PASS (desk gap 6) — this row does not recook that. A missing gross still makes the drag unknown, never a partial $0.

**Why a $5M store cares:** POS returns and online sizing returns are different owners (store vs CX). One weekly climbing flag sends both meetings after the same number.

**Why it is not a nit:** One extra column on a bar that already exists. No refund **processing** date (that HOLD remains). Placed-date gross-vs-net by source is what the book has.

## HOLD (new, or still true and not a cook)

- **Whale → Admin door.** Still HOLD. Gap 3 does not use the customer id on the desk.
- **Order rows past 24 months** for buyer-level year classes older than the stored book. Day totals already show 2023 **sales**. 2023 **starters** stay HOLD.
- **Product title / SKU.** First-product LTV stays empty on Live. Basket tiers already use `unitCount` (and Live currently coerces a missing `unitCount` to `1` in `loadLtvDepth` — a craft lie for the holes scout, not a new board).
- **Automatic discount titles.** Dollars by code stay in bounds (gap 11). The sitewide sale with no code stays HOLD.
- **Refund processing date.** Gap 12 is placed-date gross vs net by source. Shopify’s processed-day clock stays HOLD.
- **ShopifyQL / `read_reports`.** Five-year returning $ on the Goals year board from a trustworthy day-level split stays HOLD until that fact is on the day without writing a fake $0. 24-month returning $ from `OrderFact` is gap 10 (PASS).
- **Product subtotal on the buyer dollar.** Period product-only already exists on Orders. Per-buyer still includes shipping and tax.

## REFUSE

- COGS / P&L / “Kept after margin.” `demo.goals.tsx` still prints `At {n}% profit margin` next to break-even Total ROAS. The later touch is **delete that sentence**, not a cost cook. SAMPLE Customers “Kept after margin” same rule.
- Pixels, MTA, “true ROAS,” ad-account CAC. Gap 2 is a labeled till split, not path credit.
- Sessions, conversion, visitors.
- Amazon, Recharge / Skio MRR, a sixth tab, a GMV ladder, invented stars or installs.
- Slack as a product. Gap 8 is a copy button on a sentence already painted.

## Top of this note (for the synthesizer)

All twelve PASS rows are new vs v410–v414 and vs `#152` still-PASS. Surfaces last wave barely touched are 2, 4, 5, 6, 7, 8, 10.

If the next queue must collapse: Spend (2 + 6 + 7 + 8) is one cook if the writer will not fan four agents onto `app.spend.tsx`. Goals (4 + 5 + 10) is one cook on the year board + forecast. Customers (1 + 3 + 9) can stay three ranks; guest dollars and whale ticket are smaller than reactivation. Orders (11 + 12) wait until after rank 6 if `orders-intelligence.ts` is still hot.

Do not report the niche is owned.
