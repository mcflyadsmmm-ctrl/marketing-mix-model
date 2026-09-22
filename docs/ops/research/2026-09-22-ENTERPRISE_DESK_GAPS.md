# Enterprise desk gaps — still untrue on the v409 tip

**Scout:** Desk-truth · **Date:** 2026-09-22  
**Base:** `cursor/spend-trust-recurring` @ `711ffa8`  
**Fly note:** v409 is the spend-honesty merge `f0fa935`. The two commits after it are docs only. v409 is not an enterprise desk and it is not finished.  
**Live:** PARKED. **Price:** $39 flat. **IA:** Overview → Orders → Customers → Spend → Goals. Growth and LTV stay Customers chips.

A store doing about $1M–$10M a year on Shopify still has order-history jobs this desk does not answer. This note is those jobs. It is not a new tab, a price ladder, or a claim that the niche is finished.

## What was on the tip

`docs/ops/research/2026-09-22-*.md` is **not** on this tip. The closest dated note is `docs/ops/ADD_BRIEFS_PROMO_LTV_SPEND_PASTE_20260922.md`. Both cooks in that note are already in the app: Light / Typical / Deep first-order discount bands on Customers → LTV, and the Spend paste preview for Total ROAS, Cash CPA, and payback. They are not gaps to rebuild.

Morning habit on `cursor/morning-habit-5bc6` (`890be56`) is in flight: one copyable order-history sentence, plus month close, who to save, and set a target on the book page. That work is not listed below.

## How to read a row

| Verdict | Meaning |
| --- | --- |
| **PASS** | One cook. No new tab. No new product scope. Uses fields already stored. |
| **HOLD** | Needs a stored field that is not on the row, or a Marty call (history length, opaque customer keys). |
| **REFUSE** | COGS, pixels, multi-touch, GMV or order-volume pricing, sessions, or a sixth analysis tab. |

## Walked, and already answering

These are true on the tip. They are not the cook list.

- **Overview.** This period’s sales, typical order, returning-dollar glance, month / quarter / year versus the same days last year, a sales chart versus the *previous* window, mix and month close, and a calendar-year board versus last year.
- **Orders.** Typical (median) versus average, full-price versus discounted ticket, 2+ items, weekday and hour, Online / POS / Shop mix, one period figure for returns and edits, and a 90-day intelligence board (orders, sales, average, discount depth, weekly ledger).
- **Customers.** Returning dollars versus new dollars, a 90-day mix chart of those dollars, days to a second order, 30 / 90 / first-year triangle, refund-aware dollars when the pre-refund total is on the order, first-order discount depth, Online / POS / Shop value, and a whale list of ranks.
- **Spend.** Optional paste. Empty spend stays a dash. A column name is a label on a typed dollar.
- **Goals.** A monthly sales plan, an observed first-window value line, and a year returning-dollar target. Zero spend still paints the order-history targets.
- **Phone.** Five pills wrap. Charts and the goals table keep their own horizontal scroll. Overview’s four first-lane tiles use a grid at 430px.

## Gaps

### 1. Which codes took a cut of this month — PASS

**Merchant:** “Which codes took a cut of this month, and were those orders from new buyers or people who already buy?”

**Tab:** Orders.

**Evidence:** `OrderFact.discountCode` is stored (`app/prisma/schema.prisma` around the discount-code field; crawl in `app/app/lib/order-facts.server.ts`, `firstDiscountCodeFromApplications` and the orders query). `loadOrderDepthRows` returns the code. The weekly order ledger uses discount *dollars* as a depth percent and never the code (`app/app/lib/orders-intelligence.ts`, `OrderIntelRow` and `buildOrdersWeeklyRows`). Named codes are only followed as a *first* order on Customers → LTV (`app/app/lib/ltv-depth-page.server.ts` passes `discountCode` into the promo board).

**Why a $1M–$10M store cares:** A month at this size is a stack of welcome codes, VIP codes, and influencer codes. Shopify’s discount report stops at orders and sales. The LTV board answers a different question (did that first code start a weaker path). It does not answer this month’s book.

### 2. Are returns climbing, or was it one week — PASS

**Merchant:** “Are returns climbing this month, or was it one bad week?”

**Tab:** Orders.

**Evidence:** Returns and edits is one number for the whole period: original checkout total minus what stands today (`app/app/lib/shopify-native-stats.ts`, `returnsDrag`; painted in `app/app/lib/orders-scoreboard.ts`). The weekly ledger has orders, sales, average order, and discount depth. It does not have returns (`buildOrdersWeeklyRows`). Each loaded row already carries `grossAmount` and `amount` (`loadOrderDepthRows`). The Customers value triangle can show refunds inside a first-order window. It is not a week-by-week returns line for the month being closed.

**Why a $1M–$10M store cares:** A sizing or quality miss moves tens of thousands of dollars in a week. One period total hides whether the rate is rising. The pre-refund total is already on the order, so this is not a new Shopify field.

### 3. This launch week versus the same dates last year — PASS

**Merchant:** “How did this launch week do against the same dates last year?”

**Tab:** Overview.

**Evidence:** The chart’s comparison window is the equal-length span *immediately before* the range (`overviewPriorWindow` in `app/app/lib/overview-sales-chart.ts`). The same-days-last-year cards are only this month, this quarter, and this year (`OVERVIEW_YOY_IDS` in `app/app/lib/overview-yoy.ts`). The year board is twelve calendar months (`buildYoyYearBoard` in `app/app/lib/yoy-workspace.ts`). Sales day totals go back five years (`DESK_HISTORY_YEARS_BACK` in `app/app/lib/desk-history.ts`). A custom from/to on the chart does not read those same dates one year earlier.

**Why a $1M–$10M store cares:** Launches, restocks, and the ten days around a holiday are not a calendar month. “Up versus the previous ten days” is a different sentence from “up versus last year’s ten days.” The day totals for that comparison are already on file when reports scope has filled them. A missing last year stays a dash, not $0.

### 4. Someone who bought last spring is called new — PASS

**Merchant:** “How many first-time buyers showed up each week — and why does someone who bought last spring count as new?”

**Tab:** Customers (Returning mix).

**Evidence:** The mix chart is dollars only (`MixDay` / `MixWeek` in `app/app/lib/customers-analytics.ts`). An order is “returning” only if it lands after that buyer’s first order *in the rows passed in* (comment and loop around the `firstByCustomer` map). The Customers loader loads the stored book, then throws away everything older than 90 days *before* that classifier runs (`CUSTOMERS_ANALYTICS_WINDOW_DAYS` and the `recent` filter in `app/app/lib/desk-customers-page.server.ts`). A buyer whose previous order is on the stored book, just outside those 90 days, is painted as new dollars. Live sales-day rows write `newCustomers: 0` (`salesResultFromDayTotal` and the period totals in `app/app/lib/sales-facts.server.ts`). `countNewBuyersInRange` already counts first orders from `OrderFact` plus `lifetimeOrders` (`app/app/lib/order-facts.server.ts`) and feeds value math, not this chart (`buildDashboardMetrics` still returns `honestSales.newCustomers`, which is that zero). The growth card prints a new-buyer count only when that zero is already above zero (`GrowthScoreboard`).

**Why a $1M–$10M store cares:** At this size, a large share of “new” dollars in a quarter are people who already bought and went quiet for a season. The acquisition meeting then chases a headcount the chart never shows, using a dollar mix that calls those people new. The older orders are already loaded in the same function for the whale list. The cook is to classify against that book, and to show the weekly count beside the dollars. Guests stay out of returning. A null lifetime count stays unknown, not a fake zero.

### 5. I picked this month. Intelligence is still 90 days — PASS

**Merchant:** “I picked this month. Why is order intelligence still the last 90 days?”

**Tab:** Orders.

**Evidence:** The page period comes from `resolvePeriod`. Order intelligence ignores it and always loads 90 days ending now, versus the 90 days before that (`ORDERS_INTEL_WINDOW_DAYS` in `app/app/lib/desk-sales-page.server.ts`). The board badge is hardcoded `90d` (`OrdersIntelligence`). Frequency counts orders inside that same slice (`buildOrdersFrequency`), not `lifetimeOrders`, which is already on the row. A buyer with one order in the slice and a long history looks like a one-order buyer. `y3` is not a merchant period: outside shot mode the sales loader redirects it to this year.

**Why a $1M–$10M store cares:** Month close is the meeting. A board that quietly answers a different 90 days will be trusted once and then doubted. The period control and the order rows for that period already exist. Frequency can use the lifetime count already stored, and say when that count was never crawled.

### 6. Draft invoices and subscription renewals sit in Other — PASS

**Merchant:** “How much of this month is draft invoices or subscription renewals, not the online store?”

**Tab:** Orders (the source bar already on the page).

**Evidence:** `classifyOrderSource` keeps web / online / iphone / android, POS, and Shop. Everything else, including an empty name, is `other` (`app/app/lib/shopify-depth-stats.ts`). The source bar labels that bucket “Other” and does not give it a typical order (`buildOrdersSourceBar` in `app/app/lib/orders-scoreboard.ts`; the median loop skips `other`). `sourceName` is already stored. It is not an ad click. Customers → LTV already splits Online / POS / Shop value (`LtvBySourceRows`). It does not name what fell into Other.

**Why a $1M–$10M store cares:** Wholesale drafts and subscribe-and-save renewals are often a large slice of the month. Buried in Other, they make the online store look like the whole company, and they make “came back” look like loyalty when it was a renewal the source name already identified. The cook names source names already on the row. It does not add subscription revenue, a billing app, or a sixth tab.

### 7. Phone: chips are small, and the ticket comparison is a third of a row — PASS

**Merchant:** “On my phone I miss Growth and LTV, and I can’t read full price versus discounted.”

**Tab:** Customers chips, and the Orders first lane. Same CSS file.

**Evidence:** In-page chips are `font-size: 0.72rem` and `padding: 0.18rem 0.5rem` with no 430px hit-area rule (`.mcfly-desk-panel-rail__chip` in `app/app/styles/mcfly-desk.css`). The five analysis pills at 430px are `min-height: 2.75rem`. Customers work lives on those chips (Returning, LTV, Growth, Depth in `app/app/lib/desk-panel-rail.ts`). Orders lead cards are a nowrap row, each capped at `33.333%`, and `.mcfly-desk` / `.mcfly-score` set `overflow-x: hidden`. At 430px the peek value grows to `clamp(1.45rem, 7vw, 2rem)`. The Orders value is two amounts joined by “ vs ” (`buildOrdersLeadPeeks`). Overview’s four tiles were given a real grid (`.mcfly-scoreboard--overview .mcfly-kpi-grid--peeks-4`). Orders, Customers, and Growth heroes were not. `app/app/lib/desk-phone-layout.test.ts` locks the 33% cap, so the cook wraps the words inside the card. It does not delete the three-up or add a tab.

**Why a $1M–$10M store cares:** The owner checks Shopify Admin on a phone between meetings. If LTV and Growth are a small chip, and the discounted-ticket comparison is the fact that does not fit, the desk they pay for is the desktop one.

### 8. Which first product starts the buyer who comes back — HOLD

**Merchant:** “Which first product starts a buyer who comes back?”

**Tab:** Customers → LTV. The board is already there.

**Evidence:** Live depth sets `product: null` on every row (`loadLtvDepth` in `app/app/lib/ltv-depth-page.server.ts`). `OrderFact` stores a unit count and the comment forbids SKU and title (`app/prisma/schema.prisma`). The orders query does not ask for line items. `LtvProductBoard` has an empty kind for missing titles. The path table stays empty on live (`ltv-depth-route` test: journeys paint only when titles are on file). SAMPLE Snowdevil has product names, so the canvas looks finished.

**Why a $1M–$10M store cares:** After “how much did we sell,” the standing question is which first product is worth the next order. The screen exists and stays empty on a real shop. Putting a title on the row is a new stored field and a change to the Level-1 order query. That is a Marty call, not a paint cook. Do not add a Products tab while this waits.

### 9. Day sales go back five years. Buyer history stops at 24 months — HOLD

**Merchant:** “Was a new buyer in 2023 worth more than a new buyer this year?”

**Tab:** Customers → LTV, and any order-level read (Growth, whales, codes).

**Evidence:** Order rows stop at 24 months (`ORDER_ROW_WINDOW_MONTHS` in `app/app/lib/live-ingest-depth.ts`). Day totals are a five-year floor (`DESK_HISTORY_YEARS_BACK` in `app/app/lib/desk-history.ts`; the file header says order detail stays at 24 months). Cohort math refuses to treat first-on-file as a lifetime first when Shopify’s order count is higher than the orders stored (`computeCohortRollups` in `app/app/lib/order-facts.server.ts`). Backfill still takes at most seven shop-local days per run (`ORDER_FACT_MAX_DAYS_PER_RUN`).

**Why a $1M–$10M store cares:** A four- or five-year brand compares starters across years. The year board can show 2023 *sales days*. It cannot show what those 2023 starters were worth, because those orders were never kept. Lengthening the book is storage, backfill, and a Shopify history-scope decision. Price stays $39. This is not a GMV cliff.

### 10. “What a buyer spent” still includes shipping and tax — HOLD

**Merchant:** “What did that buyer spend on product, not on tax and shipping?”

**Tab:** Customers → LTV. Orders can already show product-only for a *period*.

**Evidence:** `OrderFact.amount` is the current order total, chosen so it matches Total Sales (`order-facts.server.ts` comment above `ORDERS_FOR_FACTS_QUERY`). The query asks `currentTotalPriceSet` and `totalPriceSet`. It does not ask the product subtotal. Day facts do store net sales as product subtotal after returns, excluding shipping and tax (`SalesDayFact` in `app/prisma/schema.prisma`), but that number is per day, not per buyer. The value-table formula says “order revenue − refunds” (`cohortRevenueFormula` in `app/app/lib/ltv-flagship.ts`). It does not say shipping and tax are inside the dollar.

**Why a $1M–$10M store cares:** Tax and shipping are often a large share of the checkout on a $40–$120 ticket. The Orders clock can separate product from shipping and tax for the month. The buyer-value number cannot, so a high-tax state looks like a more valuable customer. A per-order product subtotal is a new stored field. Do not turn the fix into cost of goods.

### 11. The sitewide sale has no code, so it has no name — HOLD

**Merchant:** “The sitewide 20% off has no code. What did it do to this month?”

**Tab:** Orders for the month, and Customers → LTV for the first order.

**Evidence:** The orders query only reads `DiscountCodeApplication.code` (`ORDERS_FOR_FACTS_QUERY`). Automatic discounts usually have a title and no code. Discount *dollars* are stored, so Light / Typical / Deep can still seal, and an unnamed promo stays “Promo first.” The name of the automatic discount is not on the row. Combinable discounts keep only the first code (`firstDiscountCodeFromApplications`).

**Why a $1M–$10M store cares:** The biggest promotion of the month is often automatic, not a typed code. Gap 1 can still list codes that were stored. Naming the automatic discount means storing a title the query does not save today.

### 12. Whale 1 is a rank, not someone you can open — HOLD

**Merchant:** “Open the best buyer in Shopify. Whale 1 is not a person I can find.”

**Tab:** Customers.

**Evidence:** The watchlist label is `Whale ${i + 1}` (`app/app/lib/customers-rfm.ts`). The file header says opaque keys stay off the desk. The list stops at eight buyers. `customerKey` is the Shopify customer id (`order-facts` ingest). Nothing on the row links to that buyer in Admin. Morning habit’s “who to save” is a sentence already in flight. This row is the missing door, not that sentence.

**Why a $1M–$10M store cares:** The top buyers are a short list someone should actually open. A rank without a door is a statistic. Using the stored id as an Admin link puts that id on the desk, which the current rule forbids. That is a Marty call. Do not paint a name or an email on the card.

### 13. Which product made money after cost — REFUSE

**Merchant:** “Which product actually made money after what it cost me?”

**Tab:** Would land on Customers → LTV, next to the empty product board.

**Evidence:** Cost of goods is not on `OrderFact`. Settings still has optional cost percents for an old margin stack. The product board is titles and order dollars only, and live titles are already a hold.

**Why a $1M–$10M store cares:** Margin by product is how a buyer meeting ends. It is also the profit-app job. Mcfly does not cook cost of goods, shipping cost, or contribution on a product row.

### 14. Conversion this week — REFUSE

**Merchant:** “What’s my conversion rate this week?”

**Tab:** None. Sessions are not an order-history fact.

**Evidence:** The desk’s order and sales queries do not read sessions or visitors. Orders copy says the page is orders, not a platform pixel.

**Why a $1M–$10M store cares:** They ask it every week. Shopify sessions stay in Shopify. This desk does not promise to repair them.

### 15. Which ad got the second order — REFUSE

**Merchant:** “Which ad got the second order?”

**Tab:** Would be pressed onto Customers → LTV or Spend.

**Evidence:** `sourceName` is documented as web / POS / Shop, not ad attribution (`schema` and `classifyOrderSource`). Spend labels are dollars the merchant typed. Total ROAS is Shopify sales divided by entered spend. There is no path from an ad click to an order.

**Why a $1M–$10M store cares:** The media buyer wants path credit. That is a pixel product. A pasted “Meta” column stays a label on a dollar.

### 16. A products tab, or a price that rises with sales — REFUSE

**Merchant:** “We’re at $6M. Either give us a products tab or charge us like a suite.”

**Tab:** A sixth tab, or pricing.

**Evidence:** Admin nav is five analysis pills (`DESK_IFRAME_NAV` in `app/app/lib/desk-nav.ts`). The phone test asserts there is no sixth analysis tab. Price copy is $39. `live-ingest-depth.ts` says price does not rise with sales.

**Why a $1M–$10M store cares:** Suites they are leaving already did both. The product question in gap 8 stays on Customers → LTV if a title is ever stored. The bill stays $39.

## Top 5 to cook

All five are **PASS**. One cook each. No new tab. No new stored field. Do not start with the holds, and do not rebuild morning habit.

1. **Orders.** “Which codes took a cut of this month, and were those orders from new buyers or people who already buy?”
2. **Overview.** “How did this launch week do against the same dates last year?”
3. **Customers.** “How many first-time buyers showed up each week — and why does someone who bought last spring count as new?”
4. **Orders.** “Are returns climbing this month, or was it one bad week?”
5. **Orders.** “I picked this month. Why is order intelligence still the last 90 days?”

Next, still a pass, not in the five: name draft and subscription source names that are already inside Other, and make the phone chips and the full-price-versus-discounted value readable at 390–430px.

Holds waiting on a field or on Marty: product title, order rows past 24 months, product subtotal on the buyer dollar, automatic-discount title, and a door from Whale 1 into Shopify Admin.
