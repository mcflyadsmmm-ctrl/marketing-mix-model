# Enterprise cook queue — 2026-09-22

> **For agentic workers:** Rank 1 is the only cook. One implementer. One Reviewer. One Fly only after that Reviewer marks PASS. Ranks 2–6 stay queued. Do not start them. Do not dispatch a craft agent per rank.

**Goal:** A $1M–$10M Shopify operator keeps $39/store/month because an order-history question is answered on the open lane, empties tell the truth, a phone can read the primary number, and a teammate can copy one sentence.

**Architecture:** Collapse the four scout notes into one ranked list. When two pains share a surface, they are one cook. Rank 1 changes what a stranger sees on first open of Overview: the period’s Shopify Total Sales is the number the eye lands on, and a phone can read this month and last year. Later ranks wait, including cohort charts.

**Tech stack:** The existing Remix desk (`app/`). Painted tabs only. No new stored field on any rank in this queue. No new tab.

**Base this plan is cut from:** `origin/cursor/spend-trust-recurring` at `d01bdb7` (`docs: stamp Fly v410 after the morning habit merge`). The four notes scored the earlier tip `711ffa8` / Fly v409 / `f0fa935`. Morning habit merged after those notes (`23bb8f9`, PR #147) and is already on this base. It added the copyable sentence. It did not change the Overview hero peek or the year-over-year glance.

**Sources, and only these sources:**

| Note | Branch | Commit | File |
| --- | --- | --- | --- |
| Public operator pains | `origin/cursor/enterprise-operator-5bc6` | `d581e52` (PR #148) | `docs/ops/research/2026-09-22-ENTERPRISE_OPERATOR.md` |
| Holes in the v409 code | `origin/cursor/enterprise-craft-holes-5bc6` | `bbcc12d` (PR #149) | `docs/ops/research/2026-09-22-ENTERPRISE_CRAFT_HOLES.md` |
| Questions stored orders can answer | `origin/cursor/enterprise-desk-gaps-5bc6` | `a802511` (PR #150) | `docs/ops/research/2026-09-22-ENTERPRISE_DESK_GAPS.md` |
| Jobs other apps still sell from order history | `origin/cursor/enterprise-compete-5bc6` | `e4424c7` (PR #151) | `docs/ops/research/2026-09-22-ENTERPRISE_COMPETE.md` |

Quotes below are copied from those notes. Figures below are copied from those notes. Nothing in quotation marks was written for this plan.

## Global constraints

- Painted IA: Overview, Orders, Customers, Spend, Goals. Growth and LTV are Customers chips, never a sixth tab.
- One plan, $39/store/month, after a 7-day trial. No Free plan. No GMV ladder.
- Total ROAS = Shopify Total Sales ÷ entered spend, or —. Never 0×. Never a fake $0.
- Live stays PARKED. No Partner Submit. No `read_all_orders` as shipped. ShopifyQL / `read_reports` stays HOLD.
- Product titles stay HOLD. Do not store a title to win a board. SAMPLE must not invent a catalog Live cannot store.
- Country, subscription-checkout bit, refund processing date, and gift-card product flag stay HOLD until the fact is on the order. Do not guess.
- Discount titles (automatic discounts) stay HOLD. Dollars by discount code already stored are in bounds.
- Morning habit is on the tip. Do not put it in the cook list. Do not rebuild it. Do not edit `app/app/components/MorningHabitStrip.tsx`, `app/app/lib/morning-habit.ts`, or the `.mcfly-morning-*` rules appended in `app/app/styles/mcfly-desk.css`.
- Promo LTV, source LTV, spend paste, empty spend as —, and a deleted day as $0 are on the tip. Do not recook them.
- Guests stay out of returning. A missing last year stays not on file, never $0. A window the compete note seals only at 8 buyers stays — under that floor.
- Nits do not deploy.

## What collapsed

These five looked like five cooks. They are three surfaces, plus one HOLD.

| Candidate | Surface | Where it went |
| --- | --- | --- |
| Period total is not where the eye lands (craft hole 3) | Overview first fold | **Rank 1**, merged |
| Phone year-over-year squeeze (craft hole 1) and “Just show the total” (operator pain 1) | Same Overview first fold. Craft hole 3 says the period total sits in the glance, and on a phone that glance is hole 1 | **Rank 1**, merged |
| Name which Shopify total the card is (operator pain 3) | Same card | **Rank 1**, the label on that number |
| Same-clock compare (operator pain 4) and this launch week versus the same dates last year (desk gap 3) | Overview chart, compared with last year’s same dates. Same files as rank 1’s chart, different sentence | **Rank 5**, one merged cook, queued |
| Code income (operator pain 7, desk gap 1), returns climbing by week (desk gap 2), and intelligence ignoring the picked month (desk gap 5) | Orders weekly ledger and the intelligence board | **Rank 4**, one merged cook, queued |
| A return on the day it was processed (operator pain 2, compete row 11) | Needs a refund timestamp that is not stored | **HOLD.** Not rank 1. Not rank 4 |

Rank 4’s weekly returns use `grossAmount` and `amount` already on the row. That is not the processing-day clock.

## Already on the tip — do not recook

Returning dollars, cohort worth at 30/90/365, promo depth, source LTV (web / POS / Shop), spend paste, empty spend as —, a deleted day as $0, and the morning sentence (copy, month close, who to save, set a target). Operator pain 5, the copyable yesterday line, is that morning sentence. It is not a rank.

## Rank 1 — next cook

**Sentence:** I opened Overview to see what this period sold, and on my phone I cannot read this month or last year.

**Tab:** Overview.

**Verdict:** Merged **PASS**. Craft holes 1 and 3, operator pains 1 and 3.

**Why it is not a nit:** The first full-width number is the median ticket. The chart’s full-width number is the last bucket. Period Shopify Total Sales sits in the year-over-year glance under those peeks. At `max-width: 36rem` each glance card is `max-width: calc(33.333% - 0.24rem)`, last year (`.mcfly-yoy__prior`) is `display: none`, and the dollar is `white-space: nowrap`, inside an iframe about 390px wide. Craft’s note: a month in the hundreds of thousands no longer fits, and the comparison dollars are not in the card. Operator pain 1, tonytapay, 23 Jul 2026: “Just show the total.” The same post: “it only shows today’s sales and I can’t choose to look at the sales for yesterday or the week or the month.” The 17 Mar 2025 post on the sessions default is the refuse on this same surface, not a tile to add. SteveG79, 7 Mar 2025, asked for this month to date on that same phone check. Operator pain 3: the card has to name the total, because Tudirad’s dashboard, product report, and order export already disagreed ($5,958.06 versus $6,648.60, and 281 orders versus 251). A team that runs Saturday from a phone does not get the period it manages.

**Branch:** `cursor/period-phone-5bc6`, cut from `origin/cursor/spend-trust-recurring` at `d01bdb7` or a later tip that still contains the morning-habit merge. One implementer. One Reviewer. One Fly only after PASS.

**Files:**

- `app/app/components/OverviewFirstViewport.tsx` — the first `PeekCard` is `hero` on typical order. `windowSales` is already a prop (`metrics.sales` on `app/app/routes/app._index.tsx`, `data.sales.totalSales` on `app/app/routes/demo._index.tsx`).
- `app/app/lib/overview-first-viewport.ts` — `OVERVIEW_FIRST_LANE_LABEL` is “Typical order, returning $, weekends, typical day”.
- `app/app/lib/overview-first-viewport.test.ts`
- `app/app/components/OverviewYoyCards.tsx`
- `app/app/components/OverviewSalesChart.tsx` — `activeIndex` is the hover, or `points.length - 1`, and `.mcfly-chart__hero` prints that bucket. Leave that readout as the bucket.
- `app/app/styles/mcfly-desk.css` — glance rules near `max-width: 36rem`, the nowrap on `.mcfly-yoy--glance .mcfly-yoy__v`, and the later `@media (max-width: 430px)` block. Do not edit the morning-habit block at the end of the file.
- `app/app/lib/desk-phone-layout.test.ts` — the test “keeps a swipe rail in the phone block; Overview glance is a 3-up spine” locks `max-width: calc(33.333% - 0.24rem)`.

**Done when:**

- The hero peek is the selected period’s Shopify Total Sales, and the card says that name. Typical order, returning dollars, weekend, and typical day stay on the lane as smaller peeks.
- Yesterday, this week, and this month to date are plain Shopify Total Sales on that first fold, read from stored sales-day totals the chart and the year cards already use. No new order crawl. This month to date and the year-over-year “this month” card are one month number, with last year on that card.
- Pending or missing stays the desk’s existing “not $0” / not-on-file behavior. Never a fake $0. A missing last year says not on file.
- Under 36rem the three year-over-year windows stack. Last year’s dollars stay on the card. The dollar may wrap.
- The chart’s full-width number stays the hovered bucket, or the last bucket when nothing is hovered.
- No session tile. No gross profit. Five analysis tabs stay five. Admin Overview and demo Overview stay on the same components.
- The glance phone test locks the stack and a visible prior. The separate Orders lead lock `max-width: calc(33.333% - 0.32rem)` stays. That squeeze is the still-PASS phone row below, not this cook.

**Check:** from `app/`, `npx vitest run app/lib/overview-first-viewport.test.ts app/lib/desk-phone-layout.test.ts`.

**Not this cook:** the same-clock hour compare, code income, weekly returns, the processing-day return, product names, the morning sentence.

## Rank 2 — queued

**Sentence:** The demo names the first product. My shop says the names are coming. The stored orders never have them.

**Tab:** Customers → LTV (open lane). Not a Products tab.

**Verdict:** **PASS** for the empty. Storing a title is HOLD, not this rank.

**Why it is not a nit:** SAMPLE assigns a catalog name from the ticket size (`snowdevilProductForAmount`: goggles, wax, boards) and stores that string. Live sets `product: null` on every row and the empty says names wait for titled line items already in scope. `OrderFact` stores `unitCount` and the schema comment forbids SKU and title. The orders query does not ask for line items. A stranger on the demo thinks the catalog is real. A real shop is promised names the book will never have.

**Files a later cook would touch:** `app/app/lib/ltv-depth-sample.ts`, `app/app/lib/ltv-first-product.ts` (`FIRST_PRODUCT_TITLES_COPY`), `app/app/components/LtvFirstProductDrivers.tsx`, `app/app/components/CustomersLtvSection.tsx`, `app/app/lib/ltv-depth-page.server.ts`, `app/app/components/LtvProductBoard.tsx`. Do not add a column to `app/prisma/schema.prisma`. Do not invent a catalog from units.

**From:** craft hole 5. Desk gap 8 and compete’s product-title refuse are the same HOLD on the column.

## Rank 3 — queued

**Sentence:** How many first-time buyers showed up each week — and why does someone who bought last spring count as new?

**Tab:** Customers (Returning mix).

**Verdict:** **PASS.**

**Why it is not a nit:** The mix chart classifies “returning” only inside the rows it is given, and the loader throws away everything older than 90 days before that classifier runs (`CUSTOMERS_ANALYTICS_WINDOW_DAYS`). A buyer whose previous order is on the stored book, just outside those 90 days, is painted as new dollars. Live sales-day rows write `newCustomers: 0`. The desk note: at this size, a large share of “new” dollars in a quarter are people who already bought and went quiet for a season. The older orders are already loaded in the same function for the whale list.

**Files a later cook would touch:** `app/app/lib/customers-analytics.ts`, `app/app/lib/desk-customers-page.server.ts`, `app/app/lib/order-facts.server.ts` (`countNewBuyersInRange` already counts first orders from `OrderFact` plus `lifetimeOrders`). Do not paint the sales-day zero from `app/app/lib/sales-facts.server.ts` as the weekly count. Guests stay out. A null lifetime count stays unknown, never a fake zero.

**From:** desk gap 4.

## Rank 4 — queued

**Sentence:** I picked this month — which codes took the money, and are returns climbing, or is this board still the last 90 days?

**Tab:** Orders.

**Verdict:** Merged **PASS**. Operator pain 7, desk gaps 1, 2, and 5. One board. Do not split it across three agents.

**Why it is not a nit:** The page period comes from `resolvePeriod`. Order intelligence ignores it and always loads 90 days ending now (`ORDERS_INTEL_WINDOW_DAYS`). The board badge is hardcoded `90d`. The weekly ledger has orders, sales, average order, and discount depth, and never the code or returns. `OrderFact.discountCode` is already stored. Each loaded row already carries `grossAmount` and `amount`. Named codes on Customers → LTV are the first order’s later value, which is already on the tip, not this month’s income. Operator pain 7: a use count hides a large code that did little money and a small code that did the day’s sales. Desk gap 2: one period total hides whether returns are rising; a sizing or quality miss moves tens of thousands of dollars in a week. Desk gap 5: month close is the meeting, and a board that answers a different 90 days will be trusted once and then doubted. Frequency on that same board counts the slice, not `lifetimeOrders`, so a buyer with one order in the slice and a long history looks like a one-order buyer.

**Files a later cook would touch:** `app/app/lib/orders-intelligence.ts` (`buildOrdersWeeklyRows`), `app/app/lib/desk-sales-page.server.ts`, `app/app/lib/orders-scoreboard.ts`, `app/app/lib/shopify-native-stats.ts` (`returnsDrag`), `app/app/components/OrdersIntelligence.tsx`, `app/app/routes/app.orders.tsx`, `app/app/routes/demo.orders.tsx` (the public orders page omits this board; mount the same stack). `app/app/lib/order-facts.server.ts` already has the code. New versus already-bought on those codes uses the stored book from rank 3, not a second 90-day “new.”

**Out of this rank:** automatic discount titles, a ShopifyQL box, reading a code as a percent (`WELCOME10` is not 10%), and a return dated on the processing day.

**From:** operator pain 7, desk gaps 1, 2, and 5.

## Rank 5 — queued

**Sentence:** Are we on track through this hour versus the same weekday last year, and how did this launch week do against those dates?

**Tab:** Overview. The hour grain Orders already keeps. Not a new tab.

**Verdict:** Merged **PASS**. Operator pain 4 and desk gap 3. Same compare surface: this span versus the same dates last year.

**Why it is not a nit:** Kayleigh, 18 Jan 2025: at 2:55pm the compare is the full prior day, so a Saturday looks behind because last year’s evening has not happened, and the workaround is a hand spreadsheet during trading. Desk gap 3: the chart’s comparison window is the equal-length span immediately before the range (`overviewPriorWindow`). Same-days-last-year cards are only this month, this quarter, and this year. A custom from/to does not read those dates one year earlier. Launches, restocks, and the ten days around a holiday are not a calendar month. Weekday bars on Orders do not answer “up to now.”

**Files a later cook would touch:** `app/app/lib/overview-sales-chart.ts`, `app/app/components/OverviewSalesChart.tsx`, `app/app/lib/overview-yoy.ts`, `app/app/lib/yoy-workspace.ts`, `app/app/lib/desk-history.ts`. Sales day totals already go back five years (`DESK_HISTORY_YEARS_BACK`). Do not add an hour store. The written month close stays `so far + remaining days × typical day`. It is not this compare, and it is not Shopify’s forecast.

**Wait:** this rank edits `OverviewSalesChart.tsx`, which rank 1 also touches. It starts only after rank 1 has landed. A missing last year stays a dash / not on file, never $0.

**From:** operator pain 4, desk gap 3.

## Rank 6 — queued

**Sentence:** The third order is where they stick. Show me the ticket and the wait at each step, not only how long the second order took.

**Tab:** Customers → Growth, under the repurchase clock that is already there.

**Verdict:** **PASS.** This is the cohort chart. It is rank 6 because ranks 1–5 are the first open, a catalog that lies, a “new” dollar that lies, the month board, and the on-track compare.

**Why it is not a nit:** Repeat Customer Insights sells order sequencing as its own feature. The metrics named on that page are average order value, repeat purchase rate, and time since the previous order. Mcfly already has fast / typical / slow days to the second order, and a 2nd versus 3rd+ headcount. It does not have the ticket, the share who reached the step, and the wait at step 3 and step 4. Their article’s example store is not a number to paint, and the export into another system is refuse.

**Files a later cook would touch:** `app/app/lib/customers-analytics.ts`, `app/app/components/GrowthScoreboard.tsx`, `app/app/components/CustomersGrowthSection.tsx`. Rows are 1st, 2nd, 3rd, and 4th and later. Each sealed row shows average ticket, the share of the previous step who reached this step, and the typical days since the previous order. Seal a step only when at least 8 buyers have taken it. Guests out. A step the book has not lived is —. No industry norm beside it.

**Wait:** `customers-analytics.ts` is also rank 3. This rank starts only after rank 3 has landed.

**From:** compete row 1.

## Still PASS — not in the six, do not start

The niche is not owned. These stay uncooked until this queue moves. They are not a second wave to open beside rank 1.

- **Phone chips and the full-price-versus-discounted peek** (desk gap 7). Customers chips are `font-size: 0.72rem`. Orders lead cards are a nowrap row capped at a third, and the value is two amounts joined by “ vs ”. Same CSS file as rank 1 (`app/app/styles/mcfly-desk.css`). The cook wraps the words inside the card. It does not delete the three-up (`calc(33.333% - 0.32rem)` stays the lock until that cook) and it does not add a tab. It waits until rank 1 has landed so two agents are not in that file.
- **The chip opens the lane** (craft holes 4, 7, and 9). One `DeskLane` bug: `open` is `useState(fold ? defaultOpen : true)` and never follows a later `defaultOpen`. Depth, Add spend (`?panel=spend-add`), and Overview’s weekday fold all stay shut after the tap. One cook, one component (`app/app/components/DeskLane.tsx`), not three agents. Opening Depth is not the morning “who to save” sentence. Overview’s weekday fold also sits on `app/app/routes/app._index.tsx`, which rank 1 may touch, so this waits.
- **Payback prints a day count** (craft hole 6). Anchors begin `{ day: 0, revenue: 0 }`, then day 30 / 90 / 365 averages, and both This month and Last 28 share one historical base. Show the anchors, or stop printing a day count. The day-0 anchor is a fake $0. Refuse a causal or ads-manager payback. Files: `app/app/lib/cash-payback.ts`, `app/app/lib/cpa-desk.server.ts`, `app/app/components/CpaPaybackDesk.tsx`, the day count repeated on `app/app/routes/app.spend.tsx`.
- **The history banner disagrees with the crawl** (craft hole 2). Copy says “24 months of orders are already on this desk. Trial and paid use the same book.” Unpaid Live ingest stops at 90 closed days (`LIVE_UNPAID_INGEST_DAYS`). The sentence has to match the 90-day unpaid slice. Do not unpark Live. Do not add a history SKU. Flat $39 stays one plan. Files: `app/app/components/UnlockFullHistoryBanner.tsx`, `app/app/lib/uninstall-friction.test.ts` (it currently requires “24 months of orders” and rejects “~90 days”).
- **Name the source names already inside Other** (desk gap 6). `classifyOrderSource` keeps web, POS, and Shop. Everything else, including an empty name, is `other`, and that bucket has no typical order. The cook names source names already on the row (draft invoices, subscription renewals). It does not recook source LTV, and it does not claim the POS drawer tape. Operator pain 8 stays HOLD.
- **Compete rows 2–8**, same PASS standard, not started: this month’s sales by how old the buyer is; new dollars and returning dollars versus the same quarter last year; later orders still on a discount, by starter class; the next wait after they have already come back; this year’s class beside last year’s at day 90; ticket size by month of life; which starter month gave the most back by day 90. Rows 2 and 3 share Overview with ranks 1 and 5. The 8-buyer floor, guests out, and a thin side as — are the compete note’s rules. Do not paint any example-store figure from that note.

## HOLD

Short. Do not cook these until the fact is on the order, or until Marty takes the call named in the note.

- **Refund processing date.** Operator pain 2 and compete row 11. Shopify’s total sales puts a return on the day it was processed. Mcfly stores the current net on the placed date. Wing-roro, 30 Nov 2024, watched one day move from about 49,600.00 to 47k to 45,716.00. Missing refund dates stay —, not a silent net presented as that clock. Rank 4’s weekly gross-versus-net line does not close this.
- **Country.** Compete row 9. A country code on the order. Not an address, not a city, not inferred from currency.
- **Subscription checkout bit.** Compete row 10. One bit: this order’s purchase option was a subscription checkout, or it was not. Not MRR, not a Recharge login.
- **Gift-card product flag.** Compete row 12. Mark the order without storing a product title. Unknown stays in the month, labeled unknown.
- **Automatic discount titles.** Operator pain 7 HOLD and desk gap 11. petgrocer, 3 May 2026, still walks the sales for a discount used 79 times, and on 4 May 2026 needs the dollar amount given off retail. Dollars by code already stored are rank 4. The title is not.
- **Product title or SKU column.** Rank 2 may only change the empty. Do not store a title to win a board.
- **Order rows past 24 months.** Desk gap 9. Day totals already go back five years. Lengthening order rows is storage, backfill, and a Shopify history-scope decision. Price stays $39.
- **Product subtotal on the buyer dollar.** Desk gap 10. `OrderFact.amount` matches Total Sales and includes shipping and tax. A per-order product subtotal is a new field. Not cost of goods.
- **A door from Whale 1 into Shopify Admin.** Desk gap 12. The label is `Whale ${i + 1}`. Using the stored customer id as an Admin link puts that id on the desk. Marty call. Do not paint a name or an email. Morning habit’s “who to save” is not this door.
- **The million-order crawl.** Operator pain 6. MagnumFonseca, 27 Jun 2022, on a book of over 1 million orders, and staff Alan_19 on 4 Jul 2022: the query timed out. Do not promise a morning read of that book. Do not treat `read_all_orders` as shipped. Coverage honesty on ranks 1 and 5 is the not-on-file line, not a new pull.
- **POS drawer tape.** Operator pain 8. A copyable POS line is only in bounds if it is labeled Shopify Total Sales for that source and does not claim to tie the drawer. Not this queue.
- **VAT-out or a bank match.** Operator pain 2 HOLD. Kove Footwear, Triple Whale review edited 6 Jul 2026, wants VAT left out of revenue. Mcfly keeps Shopify’s total and says so.
- **Stripe and PayPal time zones.** Operator pain 3 HOLD. Payments, not the order desk.
- **ShopifyQL / `read_reports`.** Live stays PARKED. No Partner Submit.

## REFUSE

Do not put these on a tab, a chip, or a listing line.

- COGS, P&L, gross profit, contribution, gross margin. SteveG79 also asked the phone widget for gross profit. That is not rank 1. Craft hole 8: `app/app/routes/demo.goals.tsx` already prints a profit-margin line next to break-even Total ROAS, and SAMPLE Customers paints “Kept after margin.” The only later touch is to delete that sentence. Do not replace it with an invented cost.
- Pixels, multi-touch, UTM path credit, “true ROAS,” ad-account CAC. A pasted channel name stays a label on a dollar. Total ROAS stays Shopify Total Sales ÷ entered spend, or —.
- Sessions, visitors, conversion rate, search-with-no-results. Tonytapay’s sessions default is the thing rank 1 does not copy.
- Amazon.
- Recharge, Skio, Bold, Smartrr, Stay.ai MRR and churn. Active and canceled subscription counts over time.
- Slack or email product, a sixth Reports tab, Flow, Zapier. The morning line is already the copy. BrendanB-YLS’s definition of total sales is the label, not a sender.
- Inventory and reorder forecasts.
- VAT-stripped revenue.
- Person exports, name, email, city, customer tags and order tags as stored strings.
- Industry benchmarks, and any example-store figure from the compete note (including the sequencing article’s store, and Triple Whale’s and TrueProfit’s illustrations).
- Invented Mcfly stars, installs, or metrics. Lifetimely’s “45,000+ stores” and “$100B+ in GMV” are their claims.
- A Free plan, or a price that rises with orders or GMV.
- Outstanding gift-card liability, and adding gift-card sales into a profit number.
- Post-purchase surveys, a profit agent, Snowflake, custom-report credits.

## Kill list

- Do not report the niche is owned. Ranks 2–6 are queued. The still-PASS list is real and uncooked.
- Do not stop because morning habit exists. The sentence is on the tip. The period total, the phone glance, the fake catalog, the 90-day “new” buyer, and the 90-day intelligence board are not that sentence.
- Do not open four craft agents on the same components. Rank 1 is one implementer. Do not start ranks 2–6. Do not run a second agent on `OverviewSalesChart.tsx` (rank 5), `mcfly-desk.css` (the phone-chip pass), `customers-analytics.ts` (ranks 3 and 6), or the Orders intelligence board (rank 4 is one cook).
- Do not Fly rank 1 on a nit. A stylesheet tweak that leaves typical order as the hero, or leaves last year hidden under 36rem, is not PASS and does not deploy.
- Do not recook promo LTV, source LTV, spend paste, empty spend as —, or a deleted day as $0.
