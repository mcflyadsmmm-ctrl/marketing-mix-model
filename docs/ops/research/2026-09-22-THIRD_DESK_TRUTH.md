# Third desk truth — jobs the v423 book already holds

**Scout:** Desk-truth · **Date:** 2026-09-22  
**Branch:** `cursor/third-desk-truth-5bc6`  
**Base:** `origin/cursor/spend-trust-recurring` @ `d2017c1` (`docs: stamp Fly v423 and name whale ticket`)  
**Fly note:** v423 / tip `8938134` (merge of `#172` quiet-back dollars) · Live PARKED · ShopifyQL HOLD  
**#172:** merged. Quiet-then-back `$` and copyable first-time `$` are on the tip — not listed as missing. Rank 8 (whale ticket / RFM flow) is the named next ship — not a find.  
**IA:** Overview → Orders → Customers → Spend → Goals. Growth and LTV stay Customers chips. Settings is on public pills and Admin `s-app-nav`.

A $5M–$10M Shopify operator still has order-history jobs this desk does not ask, even though `OrderFact` already stores `unitCount`, `discountCode`, `sourceName`, `grossAmount`, `amount`, `lifetimeOrders`, `discountAmount`, `customerKey`, and `orderedAt`, and day totals already go five years. Ranks 8–12 of `docs/plans/2026-09-22-enterprise-next-queue.md` already own whale ticket, Orders step mix, guest `$`, compete rows 2–3, and compete 4/6/7/8 + launch-week class. This note does not restate those sentences.

Walked on this tip: Overview, Orders, Customers (Returning / Growth / LTV / Depth), Spend, Goals, Settings. Public `GET https://mcfly-analytics.fly.dev/demo` (200, tablist `aria-label="Desk pages"`, Settings in the pills). `/demo/growth` and `/demo/ltv` 302 to Customers chips. Bare `GET /app` is the recovery shell (no tablist). Hosted Customers paints “Quiet, then back” after `#172` — expected, not a find.

## How to read a row

| Verdict | Meaning |
| --- | --- |
| **PASS** | One cook. No new tab. No new product scope. Uses fields already stored. |
| **HOLD** | Needs a stored field that is not on the row, or a Marty call. |
| **REFUSE** | COGS, pixels, sessions, Amazon, Recharge, sixth tab, invented stars. |

## Floor — walked, not listed as finds

Already on the tip (v408–v423): starter / open-lane LTV · promo LTV · source LTV · spend paste · empty spend as — · deleted day as `$0` · morning sentence · period-total hero + phone year cards · live catalog empty · returning mix from the stored book · Orders intelligence on the picked period, code dollars, returns climbing · same-clock compare · third-order ticket / wait / reach · Goals honesty · phone Goals stack · Spend pair + Online line + copyable pair · book coverage 90 vs 24 · Goals year clock · DeskLane later `defaultOpen` · quiet-then-back `$` + copyable first-time `$` (v423 / `#172`).

Already ranked, not this quota: rank 8 whale ticket / RFM flow / “N more” (named next ship) · rank 9 Orders 1st/2nd/3rd/4th+ `$`, tickets, tax/shipping slice, concentration, new vs returning hour, discount `$` vs last September, kept share vs last year, first vs returning discount depth, dollars per unit, `$0` reship count · rank 10 guest `$`, Other source names, returns climbing POS vs online · rank 11 buyer age, new `$` vs returning `$` vs same quarter last year, annual installed-base retention · rank 12 compete 4/6/7/8, launch-week class, orders per month of life.

Named leftovers (file-level depth only, not the quota): Mix close also opening the weekday fold · payback day-0 `$0` · Unlock banner still Customers-only · YTD % look-ahead / typed `$0` as — · `loadLtvDepth` coercing missing `unitCount` to `1` · `cohortLtvCurves` already mounted in Depth (`CustomersLtvDepth`), which is rank 12’s grain.

## Gaps (new)

### 1. This month versus last month on Overview — PASS

**Merchant:** “I know last September. How does this month-to-date compare to last month-to-date — the month I just closed — without flipping the period pill and remembering the number?”

**Tab:** Overview first fold (plain windows + YoY glance). Public `/demo` and Admin `/app`.

**Evidence:** Yesterday / this week / this month to date are the only sequential windows (`OVERVIEW_PLAIN_WINDOW_IDS` in `app/app/lib/overview-first-viewport.ts` ~473–493). YoY cards are this month / this quarter / this year versus last year (`OVERVIEW_YOY_IDS` in `app/app/lib/overview-yoy.ts` ~3–12). `PRODUCT_NOUN.vsLastMonth` is the unused string `"This month vs last month"` (`app/app/lib/product-labels.ts` ~217–218) — never imported on Overview. Spend mix already compares channels versus last month (`SpendMixPlan.tsx`). Hosted `/demo` paints **Copy YTD** on the year card and no “this month vs last month” card. Day totals go five years (`DESK_HISTORY_YEARS_BACK = 5`). Last month is on file for a shop that has been selling. Missing last month stays —. Never `$0`.

**Why a $5M store cares:** Saturday Slack is sequential: August closed at `$417,392`; is September through today ahead of August through this date? Last year is a different meeting. Switching the period pill to “Last month” throws away this month. Snowdevil `$68k` does not prove a six-figure MoM read.

**Why it is not a nit:** Same-clock (v415) is last year’s same weekday through this hour. Rank 11 is new `$` vs returning `$` versus the same **quarter** last year. Neither is last month. The label already exists and is unused. One extra certified card on the first fold, same stored days as yesterday / week / MTD.

### 2. Last month’s identified buyers who ordered again this month — PASS

**Merchant:** “Of the people who bought in August, how many came back in September, and how many dollars was that — not last year’s installed base, not RFM Champions who went cold?”

**Tab:** Customers → Returning (open lane) or Growth peek. Not Depth RFM.

**Evidence:** Returning mix is “any earlier stored order” in this window (`customers-analytics.ts` buyer kind / first-by-customer). Rank 11 (queued) is **annual** installed-base retention: of last year’s identified buyers, who ordered this year. Rank 8 (queued) is RFM **segment flow** (last month’s Champions who are At risk now). Rank 7 is this month’s `$` from buyers whose previous gap was already past wait. Nobody intersects last calendar month’s identified `customerKey` set with this month’s set and sums `amount`. `OrderFact` has `customerKey`, `orderedAt` / `shopLocalDate`, `amount`. Guests out. 8-buyer floor on last month’s base. Unpaid 90-day slice can seal when both months sit in the 90; else —. Never `0%`.

**Why a $5M store cares:** Monthly repurchase of last month’s book is the habit meeting. Annual retention waits for a year. RFM flow is four labels. Quiet-then-back `$` is people who had already gone quiet. These are last month’s actives who did or did not shop again.

**Why it is not a nit:** Different clock from ranks 7, 8, and 11. Same stored rows the Customers loader already has. One sealed headcount + their this-month Shopify Total Sales.

### 3. New versus returning dollars by source this month — PASS

**Merchant:** “Of POS this month, how much is regulars versus first-timers? Same question for the online store. The source bar is one blended typical.”

**Tab:** Orders clock lane (source bar). Not rank 10.

**Evidence:** `buildOrdersSourceBar` paints Online / POS / Shop / Other as **sales share + typical ticket** (`app/app/lib/orders-scoreboard.ts` ~467–487). `classifyOrderSource` is per **order** (`shopify-depth-stats.ts` ~197–217). Source LTV (v409) is **first-order** source → lifetime worth (`ltv-by-source.ts`). Rank 10 owns guest **dollars**, names inside Other, and returns drag by source. Nobody crosses `sourceName` × buyer kind (`lifetimeOrders` / first-in-book) into Shopify Total Sales for this period. Guests out of returning. Unknown lifetime is its own empty, never stuffed into first-time. Hosted `/demo/orders` shows Online and POS on the source bar with no new/returning split.

**Why a $5M store cares:** POS at this size is often staffed for regulars. If POS is 70% first-time tickets, Saturday is a different owner (retail vs lifecycle). Online first-time `$` is the ads meeting. One blended POS typical hides both.

**Why it is not a nit:** Rank 10 naming `subscription_contract` inside Other does not split regulars vs first-timers. Rank 9’s 1st/2nd/3rd `$` is not by source. Four sealed dollar pairs on a bar that already exists.

### 4. One-item versus two-plus as dollars, not order share — PASS

**Merchant:** “Seventy percent of orders are one item. Is that forty percent of Shopify Total Sales or seventy percent of the till?”

**Tab:** Orders first fold.

**Evidence:** First-fold heroes are typical, full-price vs discounted **ticket**, 2+ **order share**, and mean items (`ORDERS_FIRST_FOLD_HEROES` in `orders-first-viewport.ts` ~39–44, `buildOrdersLeadPeeks` ~121–127). `multiUnitOrderShare` is crawled orders with `unitCount >= 2` divided by crawled orders (`shopify-depth-stats.ts` ~138–142, ~497–499). Rank 9 dollars-per-unit is a **blended** period ratio. Nobody sums `amount` where `unitCount === 1` versus `unitCount >= 2`. Missing `unitCount` stays off both sides, never coerced to `1` on this card (`loadLtvDepth` still does that for LTV basket tiers — craft leftover, not this cook). Hosted `/demo/orders` paints “Orders with 2+ items” as a percent.

**Why a $5M store cares:** Basket-building spend is justified by **dollars**, not order headcount. A one-item shop that is 70% of orders and 35% of the till is a different merchandising call from 70% of the till. Six-figure months make that gap tens of thousands of dollars.

**Why it is not a nit:** The field is stored. The first fold already asks the wrong grain of the same question. Rank 9’s `$` per unit does not split the till.

### 5. Share of Shopify Total Sales that landed on a discounted ticket — PASS

**Merchant:** “What share of this month’s Shopify Total Sales had a discount on the order — not how much we took off, not how many orders used a code?”

**Tab:** Orders first fold / clock facts.

**Evidence:** `discountedOrderShare` is discounted **orders** / crawled discount rows (`shopify-depth-stats.ts` ~132–133, ~456–465). Clock facts paint that percent (`orders-scoreboard.ts` `bookDiscountedOrders` ~236–245). `discountDepth` on intelligence is discount `$` / gross for the slice. Rank 9 is discount **dollars** versus last September and first vs returning **depth**. Full-price vs discounted **typical** is already a peek. The code already builds `discountedAmounts` (order `amount`s with `discountAmount > 0`) for the median (`shopify-depth-stats.ts` ~473–478) and never sums them as a till share. Hosted `/demo/orders` paints “Discounted orders” as a percent of orders.

**Why a $5M store cares:** “Discounts took 9% of gross” and “58% of Shopify Total Sales rang on a discounted ticket” are different Saturday calls. The first is margin-ish takeoff. The second is how much of the till was on promo. A `$5M` September with 58% discounted till is a merchandising emergency even when depth looks “only 9%.”

**Why it is not a nit:** Rank 9’s YoY discount `$` does not answer this grain. Codes stay names (`WELCOME10` is not 10%). Automatic titles stay HOLD. Missing discount field → —.

### 6. Days to a second order by first-order source — PASS

**Merchant:** “POS starters come back in two weeks. Online starters take six. Why is typical wait one shop-wide number next to source LTV that only says worth?”

**Tab:** Customers → Growth (open wait) and LTV source rows (open lane).

**Evidence:** Growth first fold is shop-wide typical / fast / slow wait (`GROWTH_FIRST_FOLD_HEROES` in `growth-first-viewport.ts` ~30–36; `growth-tt2.ts` has no `sourceName`). Open LTV source rows are **lifetime `$` per buyer** by first source (`SourceLtvRow.ltv` in `ltv-by-source.ts` ~25–31; `LtvBySourceRows.tsx` columns are source / buyers / LTV). Rank 12 is starter **week/month** worth and orders per month of life, not source wait. `OrderFact.sourceName` + `orderedAt` per `customerKey` already feed source LTV. Seal at 8 identified first→second gaps per source. Guests out. Thin source —.

**Why a $5M store cares:** Omnichannel wait is two playbooks. POS regulars get a floor greeting; online first-timers get a 30-day email. One blended 28-day typical wait sends both teams after the wrong clock.

**Why it is not a nit:** Source LTV (v409) answers “POS starters are worth more.” It does not answer “they also come back faster.” Third-order wait (v416) is still shop-wide. Not compete row 2 (buyer age).

### 7. Shopify lifetime is longer than this book — LTV drops the regulars — PASS

**Merchant:** “Shopify says this buyer has eleven orders. Why does day-90 LTV ignore them — or pretend the two orders in the 90-day trial book are their whole life?”

**Tab:** Customers → LTV (open 30/90/365). Settings copy is the same lie in words (gap 10).

**Evidence:** `computeCohortRollups` **skips** a customer when `lifetimeOrders > list.length` (`order-facts.server.ts` ~424–431). The unit test is explicit: a row with `lifetimeOrders: 5` and one stored order is **not** a new 90-day cohort (`order-facts.test.ts` ~571–582). Open LTV depth does the opposite lie: `loadLtvDepth` maps stored rows with **no** `lifetimeOrders` and treats the truncated timeline as the life (`ltv-depth-page.server.ts` ~59–78). Unpaid ingest is 90 closed days (`LIVE_UNPAID_INGEST_DAYS` in `live-unpark.ts` ~23). Paid order rows cap at 24 months. The skip quietly removes the shop’s regulars from till LTV on a trial book. The depth pack undercounts them. Neither paints “N identified buyers have a longer Shopify life than this desk stored.”

**Why a $5M store cares:** Trial week is when they decide to keep `$39`. A 90-day slice of a 24-month buyer looks like a one- or two-order customer. Day-90 worth then describes **new and short-life buyers**, not the book they paid for. That is the catalog-empty class of lie, on LTV.

**Why it is not a nit:** v420 named the **shop-level** till (90 vs 24) on Overview / Unlock. This is the **buyer-level** hole that till LTV still has. Do not change the 90. Do not unpark Live. Paint the count and withhold those buyers as —, or say the LTV is “orders on this desk only” when `lifetimeOrders` exceeds stored rows. 8-buyer floor. Guests out. No Admin door.

### 8. A teammate still cannot copy the Orders sentence — PASS

**Merchant:** “Paste me this month’s typical order, which codes took the cut, and whether returns are climbing — named as Shopify Total Sales — without a screenshot of Order intelligence.”

**Tab:** Orders clock lane. Public `/demo/orders` and Admin `/app/orders`.

**Evidence:** `ordersMonthBoardSentence` is already painted under Order intelligence (`orders-intelligence.ts` ~754–761; `OrdersIntelligence.tsx` ~47–66). Hosted `/demo/orders` shows that sentence and **no** copy control (no `CopyMorningSentence`, no `CopySpendPair`, no Slack card). Copy already exists on Overview (morning + **Copy YTD**), Spend (**Copy pair**), Growth / LTV (Slack cards), Goals habit (**Copy morning**). Rank 7 owns Growth first-time `$` copy. Hunt 8 asked Orders / LTV / Goals year. LTV already has a Slack card for the worth peek. Orders does not. `shareable-insights.ts` kinds are still `returning` · `typicalOrder` · `daysToSecond` · `ltvPeek` — not the intelligence sentence.

**Why a $5M store cares:** The merchandising lead is not in Admin. They get one paste. Today that paste is YTD Total Sales or the morning returning `$` line — the wrong meeting.

**Why it is not a nit:** A Fly still needs a merchant sentence. This is that sentence, on a tab that already writes it. Do not invent a Slack product. Do not copy `$0`. Do not copy pending as finished. Do not copy rank 9’s uncooked 1st/2nd/3rd `$` as if it existed.

### 9. A teammate still cannot copy this month versus the year plan — PASS

**Merchant:** “Paste me September Shopify Total Sales versus the typed plan, and YTD versus the year plan — not the habit returning-`$` target, not Overview YTD without a plan.”

**Tab:** Goals year board / `ThisMonthPlanStack`. Public `/demo/goals` (same stack after v417) and Admin `/app/goals`.

**Evidence:** Overview copies YTD Total Sales **without** a plan (`overviewYtdCopyText` in `overview-yoy.ts` ~183–191; hosted `/demo` button **Copy YTD**). Goals copies the **habit** morning line (`CopyMorningSentence` on `OrderHistoryGoalsBoard.tsx` ~318–323). `ThisMonthPlanStack` already paints Goal · Actual · Returning `$` · Prior · implied buyers (`app.goals.tsx` ~1490–1558) and has **no** copy control. `app.goals.tsx` does not import `CopyYtdSales` / `copyDeskText`. Hosted `/demo/goals` has **Copy morning** only. Prior on that stack is last year, not last month (gap 1). Empty plan copies nothing. Missing actual stays —. Never copy `$0` for a stub unpaid month.

**Why a $5M store cares:** Saturday finance Slack is “we are `$X` versus `$Y` plan.” Returning-`$` year target is a different sentence (already copyable). Overview YTD does not name the plan they typed on Goals.

**Why it is not a nit:** Hunt 8 named Goals **year**. The numbers are on the first Goals fold. One copy control. Do not copy implied buyers when the 8-order floor fails.

### 10. Settings still sells “the whole desk is on” while trial order rows are 90 days — PASS

**Merchant:** “I started the 7-day trial. Is this the 24-month book I pay `$39` for, or 90 closed days? Settings says the whole desk is already on.”

**Tab:** Settings (Admin `/app/settings` plan block). Public `/demo/settings` plan line. Not the Customers Unlock banner.

**Evidence:** `TRIAL_VS_VIEW` = `"The whole desk is already on. Start 7-day trial in Settings is Shopify billing — Sample | Live is a view, not a plan."` (`sample-live-handoff.ts` ~36–37). Admin Settings prints `BILLING_HONESTY.flat` + `TRIAL_VS_VIEW` (`app.settings.tsx` ~581–589). `PRO_UPSELL.includes` / `DESK_FEATURE_BULLETS` say “Whole desk” (`entitlements.ts` ~29–64). Unpaid order rows stop at 90 closed days (`live-unpark.ts` ~13–23, `deskOrderWindowPhrase` `trial_slice` in `desk-history.ts` ~21–24). Unlock banner **does** name 90 vs 24 and is still **Customers-only** (`UnlockFullHistoryBanner.tsx`; mount `app.customers.tsx` ~221). Hosted `/demo/settings` says “7-day trial, then `$39`/store/month” and **never** 90 closed days or 24 months (`demo.settings.tsx` ~46–51; `orderBookDepth="paid_full"` because SAMPLE). A stranger who buys from `/demo` then sits on trial Live never sees the Customers banner on Settings.

**Why a $5M store cares:** They install, see a 90-day LTV (gap 7), and think the product is thin. The till caption on Overview is easy to miss. Settings is where they tap Start trial. v420 told Overview the truth and left the plan page selling a book the crawl does not keep.

**Why it is not a nit:** File-level leftover of v420 on a **different surface** than the Unlock banner. One Settings paragraph. Flat `$39`. Do not change `LIVE_UNPAID_INGEST_DAYS`. Do not add a history SKU. Public demo should say SAMPLE is the paid-shaped book, Live trial is 90 closed days of order rows.

### 11. Same-clock is the blended till — not returning `$` through this hour — PASS

**Merchant:** “Through 2:55pm, are returning dollars ahead of the same weekday last year, or is this morning all first-time discounting?”

**Tab:** Overview first fold clock sentence.

**Evidence:** `overviewClockSentence` is **Shopify Total Sales** through this clock versus last year’s same weekday (`overview-sales-chart.ts` ~696–715). The payload slims each order to `{ orderedAt, amount }` (`OverviewClockOrder` ~417–420; `overviewClockPayloadFromOrders` ~771–774) and **drops** `customerKey` / `lifetimeOrders` even though the loader already had the rows. Rank 11 is new `$` vs returning `$` versus the same **quarter** last year — not through this hour. Rank 9 new vs returning **hour** is the picked period’s mix, not versus last year through now. v415 must not be recooked; this is a second labeled line on the same sentence. 8-buyer floor. Guests out. Unknown lifetime not painted as new. Missing last year —.

**Why a $5M store cares:** Kayleigh’s 2:55pm spreadsheet is still the blended till. A launch morning that is first-time `$` looking “ahead” of last year is a different call from regulars carrying the day. They will scale ads on the blended line.

**Why it is not a nit:** Same-clock already walks `OrderFact` for today and the 364-day shift. The slim throws away the field that answers the next question. Not a new crawl. Not compete row 2 (lifetime age).

### 12. This week versus a typical week from the day book — PASS

**Merchant:** “This week is `$182,000`. Is that a busy week for us, or a normal week? Typical **day** times seven is not a week.”

**Tab:** Overview first fold (plain “This week” card) + mix close.

**Evidence:** Plain windows include this week (Monday through latest stored day) with **no** typical-week foil (`overview-first-viewport.ts` ~473–493, ~546–630). Mix close is `so far + remaining calendar days × typical day` (`OVERVIEW_MIX_FORMULA_EQ` in `overview-mix-forecast.ts` ~23–24, ~105–119, ~250–252). Typical day needs 8 days **with sales** (`FORECAST_MIN_DAYS`). Remaining days are calendar, including days the shop does not sell. There is no median of complete Monday–Sunday weeks from `SalesDayFact`. Day totals go five years. Seal at 8 complete weeks. Certified `$0` days stay inside a week that has a row. A week with missing days is not on file, never a fake `$0` week. Hosted `/demo` Overview has This week as a dollar with no typical-week compare.

**Why a $5M store cares:** Staffing and inventory are weekly. A typical **day** of `$28k` × 7 = `$196k` overstates a shop that sells five days. Last year’s same week (launch-week class, rank 12 / v415 custom range) is a different compare. This is “are we ahead of ourselves.”

**Why it is not a nit:** The This week card already exists. Typical day already exists. The missing object is a typical **week** from the same day book. Do not recook same-clock. Do not invent Shopify’s forecast.

### 13. Weekday Total ROAS from days already on Spend — PASS

**Merchant:** “Monday is 2.1×. Sunday looks like 8× because we do not buy ads. Why does the explorer only give me day / week / month / quarter buckets?”

**Tab:** Spend explorer.

**Evidence:** `ExplorerGranularity` is `"Day" | "Week" | "Month" | "Quarter"` (`spend-explorer.ts` ~16, ~108). `bucketExplorerRows` aggregates those four (`~592–594`). Certified explorer MER is already — when sales are not on file or spend is unpaired (`explorerMer` ~205–213). Coverage knows filled spend days. Weekday sales share is already on Overview / Orders (`weekdaySalesShare`). Nobody pairs **shop-local weekday** sales with typed spend on those weekdays. Empty spend stays —. A weekday with spend and sales not on file stays —. Never `0×`. Online-labeled Total ROAS (v419) is still a period blend, not a weekday.

**Why a $5M store cares:** Weekend organic + weekday paid is the normal pattern. They will cut Monday because the month pair is “fine” and Sunday looks like a miracle multiple. That is a fireable ads meeting.

**Why it is not a nit:** Rank 3 shipped the pair / explorer `0×` / copy. It did not add a weekday grain. Same daily rows. Same religion: never `0×`, never fake `$0` spend.

### 14. Identified buyers who used both Online and POS this month — PASS

**Merchant:** “How many of our people shopped both the site and the floor this month? The source bar counts orders, not people.”

**Tab:** Orders source bar or Customers returning.

**Evidence:** `classifyOrderSource` buckets **each order** (`shopify-depth-stats.ts` ~197–217). `sourceSalesShare` is order `$` in exclusive buckets (`shopify-depth-stats.ts` ~147–148). A buyer with a web order and a POS order this month is two orders in two bars, never “N identified buyers used both.” Rank 10 Other **names** and POS **returns** do not answer overlap. `OrderFact` has `customerKey` + `sourceName`. Guests out. 8-buyer floor. Thin side —. Do not claim POS drawer tape. Do not ingest a location.

**Why a $5M store cares:** Omnichannel overlap is the reason they keep POS and the site on one till. Zero overlap means two businesses. High overlap means the floor is a pickup desk for online regulars. Neither number is on the open lane.

**Why it is not a nit:** Source LTV is first-order source, one bucket per life. This is **this period**, both sources, identified buyers. Different job, same rows.

## HOLD (still true, not a cook)

- **Refund processing date.** Gap 5/3 use placed-day gross vs net and source `$`. Shopify’s processed-day clock stays HOLD.
- **Country / subscription-checkout bit / gift-card product flag / automatic discount titles / product title or SKU.** Not on `OrderFact`.
- **Order rows past 24 months.** Day totals already go five years. 2023 **starters** stay HOLD. Gap 7 does not lengthen the crawl.
- **Whale → Admin door.** Gap 7 does not put the customer id on the desk.
- **Product subtotal on the buyer dollar.** Period product-only exists on Orders. Per-buyer still includes shipping and tax.
- **ShopifyQL / `read_reports`.** Five-year day-level returning `$` stays HOLD. Gap 1 MoM uses day totals already on file.
- **Million-order crawl as shipped.** Do not raise the live page cap.

## REFUSE

- COGS / P&L / “Kept after margin” as a number.
- Pixels, MTA, “true ROAS,” ad-account CAC. Gap 13 is weekday till ÷ typed spend, not path credit.
- Sessions, conversion, visitors.
- Amazon, Recharge / Skio MRR, a sixth tab, a GMV ladder, invented stars or installs.
- Slack as a product. Gaps 8 and 9 are copy buttons on sentences already painted.
- A paid-only toggle that recreates a `$9,781` paid-only till.

## Skipped because already ranked or already on the tip

- Quiet-then-back `$` / copyable first-time `$` (v423 / `#172`). On the tip. Hosted `/demo` paints “Quiet, then back.” Not a find.
- Whale ticket / watchlist “N more” / RFM flow (rank 8 — named next ship).
- This month `$` by 1st/2nd/3rd/4th+, tickets, tax/shipping slice, concentration, new vs returning hour, discount `$` vs last September, kept share vs last year, first vs returning discount depth, `$` per unit, `$0` reships (rank 9).
- Guest checkout as **dollars**, Other source **names**, returns climbing POS vs online (rank 10).
- Buyer age; new `$` vs returning `$` vs same quarter last year; annual installed-base (rank 11). Gap 2 is **monthly** last-month→this-month, not annual.
- Compete 4/6/7/8, launch-week **class**, orders per month of life, `cohortLtvCurves` in Depth (rank 12).
- Mix-close also opening weekday (v422 leftover) — craft, unless a second wrong-lane class is proved.
- Payback day-0 `$0` (craft).
- Unlock banner still Customers-only (named leftover; gap 10 is Settings / plan copy).
- YTD % look-ahead, typed `$0` shown as — (v421 leftovers, craft).
- `unitCount` coerced to `1` in `loadLtvDepth` (craft lie).
- Online Total ROAS denominator still including every typed channel (rank 3 leftover).

## Top of this note (for the synthesizer)

Fourteen PASS rows. None restate ranks 7–12. Surfaces last queue barely asked as **jobs** (copy aside) are 1, 2, 4, 5, 7, 11, 12, 13, 14.

If the third queue must collapse: Overview (1 + 11 + 12) is one first-fold cook if the writer will not fan three agents onto `overview-first-viewport.ts` / `overview-sales-chart.ts`. Orders (3 + 4 + 5 + 8 + 14) is one Orders mix-adjacent cook — **after** rank 9 if that writer still owns `orders-intelligence.ts` / `app.orders.tsx`; 4, 5, and 14 do not need rank 9’s step bars. Customers (2 + 6 + 7) can stay with LTV/Growth; 7 should lead if trial LTV is dropping regulars. Spend (13) is one explorer grain. Goals (9) is a copy control on `ThisMonthPlanStack`. Settings (10) is copy on the plan block — do not Fly a Settings-only stamp unless Marty wants the trial sentence live.

Do not report the niche is owned.
