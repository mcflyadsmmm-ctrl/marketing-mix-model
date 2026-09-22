# Volume desk — 2026-09-22

**Role:** Read-only Saturday operator of a **$5M–$10M** Shopify store. Phone Admin iframe ~390px / `max-width: 36rem`. Six-figure months. Quiet day at $0. Last year not on file. Unpaid 90 closed days vs a till that says 24 months. A second seat on buyer ops, not the founder morning strip.

**Tip this note is about:** `origin/cursor/spend-trust-recurring` at `b6c4073` (docs stamp). Fly **v415** / merge `dd865c3` (#157 same-clock). Live **PARKED**. Rank 6 (third-order ticket and wait) is the named next ship. Do not recook it. Do not recook #157.

**Painted IA:** Overview · Orders · Customers (Growth / LTV chips) · Spend · Goals.

**This note is not a finish.** Reciting v411–v415 as enterprise-ready is FAIL. Snowdevil fixture dollars (`$68,457` this month) are not this store.

## Floor — recycling these is FAIL

Already on the tip, or named still-PASS / in-flight. File-level depth is allowed. Restating the same merchant sentence is not.

| Already named | Why it is not a new find |
| --- | --- |
| Overview year cards stack under 36rem (v411) | Phone hunt is the **other** tabs. |
| Morning sentence (v410) | Founder copy exists. Ops copy is the hole. |
| Same-clock compare (#157 / v415) | Quiet day as $0 vs last year not on file is **fixed on Overview’s clock**. Other boards still lie. |
| Rank 6 — 1st / 2nd / 3rd / 4th+ ticket and wait | Queued / named. Growth scoreboard steps are that cook. |
| Phone chips 0.72rem + Orders `calc(33.333% - 0.32rem)` + “ vs ” peek | Still-PASS `#152`. Orders / Customers / Growth `peeks-lead` stay that cook. |
| DeskLane `defaultOpen` | Still-PASS. Depth / Add spend / weekday fold. |
| Payback day-0 `$0` | Still-PASS. Refuse causal payback. |
| `UnlockFullHistoryBanner` 24 months vs `LIVE_UNPAID_INGEST_DAYS = 90` | Still-PASS as **that banner**. This note is the **till and year board** that never mount it. |
| Source names inside Other | Still-PASS. Do not recook source LTV. |
| Compete rows 2–8 | Still-PASS. |
| Whale → Admin door | HOLD. Marty. |
| Million-order crawl as shipped | HOLD. Coverage **line** is in bounds. |
| `demo.goals.tsx` “At {n}% profit margin” | REFUSE COGS. Delete later. Not a volume find. |

## How to read a row

**PASS** = one cook, stored book, no new tab, no new scope, no lie.  
**HOLD** = needs a field or a Marty call.  
**REFUSE** = do not ship.

---

## Gaps

### 1. On my phone I cannot read this month vs plan — the year board is a 720px nowrap table — PASS

**Merchant:** “I opened Goals on my phone to see this month against the plan. I have to swipe sideways before I can read a six-figure Actual next to the Goal.”

**Tab:** Goals (admin `/app/goals`). Not Overview glance. Public `/demo/goals` does not mount this table.

**Files:**

- `app/app/styles/mcfly-desk.css` — `.mcfly-goals-table-wrap` is `overflow-x: auto`. `.mcfly-goals-table` is `min-width: 720px`. `th, td` are `white-space: nowrap` (the wrap near the table, not the Overview glance).
- `app/app/routes/app.goals.tsx` — year board columns: Month · Goal · Actual · Spend · Ceiling · MER · Prior · YoY · Pace (plan On). Plan Off still has Actual · Spend · MER · Prior · YoY.
- `app/app/lib/desk-phone-layout.test.ts` — locks Overview stack + Orders `33.333%`. Does **not** lock a Goals stack. The 390px fixture is Snowdevil `$68,457`, not hundreds of thousands.

**Today:** Overview this-month / last-year cards stack under 36rem (v411). Spend Sales / Spend / Total ROAS stacks to one column under 720px (`.mcfly-roas-book--soft .mcfly-book__glance--kpis`). Goals does not. A `$417,392` Actual stays nowrap on a rail that is almost twice the iframe. Saturday from Shopify Admin on a phone is the plan meeting. They see the month label and a bar; the dollars are off-screen.

**Why a $5M store cares:** Month close is the meeting. A six-figure month that only fits on desktop is a desktop product. Snowdevil’s `$68k` hides it.

**Why it is not a nit:** Not padding. The primary number on the year board is unreadable at the iframe the megaprompt named. Overview already had this cook. Goals was not in that cook.

**PASS.** Stack or wrap Actual / Goal / Prior under 36rem. Keep Shopify Total Sales. Missing last year stays —. Never a fake $0. Do not add a sixth tab. Do not delete the three-up Orders lock in the same PR (that is the still-PASS chip cook).

---

### 2. The till says 24 months. The unpaid crawl sealed at 90 days. Last year is a dash with no sentence — PASS

**Merchant:** “Trial and paid use the same book, and 24 months are already on this desk. Then this year vs last year is a dash. Nobody told me the crawl stopped at 90 closed days.”

**Tab:** Overview, Orders, Spend, Goals tills and ledes. The Customers banner is the known hole. These lines never mount that banner.

**Files:**

- `app/app/lib/live-unpark.ts` — `LIVE_UNPAID_INGEST_DAYS = 90`. Unpaid / trial → `unpaid_slice`. Paid order rows still cap at 24 months.
- `app/app/lib/live-ingest-depth.ts` — unpaid window is `min(90, granted)`.
- `app/app/lib/desk-history.ts` — `deskHistoryCaption` always “up to 24 months of orders.” `deskPeriodTillLabel` with `includeShopifyOrderWindow` always “live sales · up to 24 months of orders.” `deskBookHonestyNotices` has ~60-day Shopify window, truncated today, unavailable today. **No 90-day unpaid slice.**
- `app/app/lib/overview-first-viewport.ts` — `OVERVIEW_COVERAGE_LINE` is the same 24-month sentence.
- `app/app/lib/product-labels.ts` — `shopifyBookMuted` and `bookSecondWithin30Def` say “Up to 24 months.”
- `app/app/lib/cash-trust-copy.ts` — `orderHistoryProgressMessage` returns **null** once `remainingDays <= 0`. A sealed 90/90 unpaid book goes quiet. Then the till says 24 months.
- `app/app/components/UnlockFullHistoryBanner.tsx` — still “24 months of orders are already on this desk. Trial and paid use the same book.” Mounted only from `app/app/routes/app.customers.tsx` when `liveHistoryLocked`.
- `app/app/lib/uninstall-friction.test.ts` — **requires** “24 months of orders” and **rejects** “~90 days.”
- `app/app/lib/desk-history.test.ts` — requires the 24-month till.

**Today:** A Saturday operator on Overview never sees the Customers banner. After the unpaid crawl seals, progress is silent. Last year is not on file (honest dash). The coverage **line** still says the long book is already loaded. Million-order timeout stays HOLD as a crawl. This is the line.

**Why a $5M store cares:** They install, wait, then judge YoY on a 90-day slice labeled as 24 months. They will not keep $39 if the first year card is empty for a reason the till denies.

**Why it is not a nit:** Not a synonym on the banner. Every book page’s till is the sentence they read before they distrust the dash. Tests currently forbid the honest 90-day line.

**PASS** the copy: unpaid = 90 closed days on the till; paid = up to 24 months of order rows; day totals may go further when reports are on. Flat $39. One plan. Do not unpark Live. Do not add a history SKU. Do not treat `read_all_orders` as shipped.

---

### 3. I picked the year. July looks like a dead month. It is the 90-day slice, painted as Actual — PASS

**Merchant:** “Goals says July did $48,200 against a $420,000 plan. That month is not on this book. The year gauge is a dash. The till still says 24 months.”

**Tab:** Goals year board + MTD / QTD / YTD gauges. Admin only.

**Files:**

- `app/app/lib/sales-goals.server.ts` — `loadSalesByDayForGoalsRange`: if `periodExceedsFactWindow`, it **skips** the fail-closed incomplete error and returns the days it has. A year range vs a 90-day fact window is that case. `salesByMonthFromDayMap` sums whatever day keys exist (`months.set(month, (months.get(month) ?? 0) + sales)`). A month with eight days on file is a finished Actual. `ytdActual` becomes `null` if **any** YTD month is missing (Jan empty → the year gauge is —).
- `app/app/routes/app.goals.tsx` — `formatSalesOrDash` prints that Actual. No `DeskBookPage`. No `CashTrustBanners`. No `orderBackfillProgress`. No unpaid-90 notice. `SalesLoadError` only when `salesError` is set — the exceed-window path does not set it.
- `app/app/lib/sales-goals.test.ts` — months with no days stay absent (not $0). It does not lock a **partial** month as “not the month.”

**Today:** Overview / Orders / Customers can show “X of Y days ready.” Admin Goals does not. Public `/demo/goals` never mounts the year board, so SAMPLE does not teach this lie. Quiet Saturday this month can be certified $0 (honest on the period hero). Last year’s Prior column is — when missing (honest). The **oldest month inside the 90-day window** is the lie: a stub sum next to a six-figure goal.

**Why a $5M store cares:** They will cut spend or fire a channel off a stub July. YTD as — while July looks real is two different stories on one page.

**Why it is not a nit:** Not a tooltip. The year board’s job is month Actual vs plan. A truncated ingest month is not that Actual. Coverage honesty, not a new crawl.

**PASS.** Mark stub months as not on file / still filling, same as a missing month. Name the unpaid 90-day slice on this tab. Do not paint the stub as $0 and do not paint it as the month. Do not lengthen the crawl here.

---

### 4. Overview’s month close skips quiet days. Goals’ month close divides by them — PASS

**Merchant:** “Overview says month close is so far plus remaining days times the typical day. Goals says we are behind. Saturday did $0. That $0 is in Goals’ average. It is not in Overview’s typical day.”

**Tab:** Goals forecast vs Overview mix close. Same Saturday. Two formulas.

**Files:**

- `app/app/lib/overview-mix-forecast.ts` — `overviewTypicalDayFromBook` keeps days `n > 0`, then median. Formula: `so far + remaining days × typical day`. Quiet Saturday is in so-far as $0 and **not** in the typical-day rail.
- `app/app/lib/sales-goals.server.ts` — `buildMonthCloseForecast`: `avgDailySales = daysElapsed > 0 ? mtdSales / daysElapsed : 0`, then `projSales = mtdSales + avgDailySales * remainingDays`. `daysElapsed` is **calendar** (`calendarDaysElapsedInMonth`), including today. A certified $0 Saturday pulls the mean.
- `app/app/routes/app.goals.tsx` — forecast takeaway: `Projected {dollars} vs {goal}` plus pace. Does not say Shopify Total Sales. Does not say which typical.
- `app/app/components/OverviewMixForecast.tsx` — Copy morning pastes the Overview formula.

**Today:** #157 taught Overview to keep a quiet day at $0 without calling it loading. Goals still treats that $0 as a full elapsed day in the pace. The founder pastes Overview. The planner opens Goals. The two closes disagree on a six-figure month because the store actually has quiet Sundays.

**Why a $5M store cares:** They run Saturday from two tabs. A formula fight during trading is why they dump $39.

**Why it is not a nit:** Not a synonym. Two written-out month closes from the same sales-day book. Overview already named the formula. Goals uses a different one and does not say so.

**PASS.** One close: median of days with sales, leftover days after today, Shopify Total Sales, quiet day in so-far as $0, never a fake last year. Empty spend stays —. Do not paint Goals’ mean as Shopify’s forecast.

---

### 5. Spend already writes the Total ROAS sentence. Nobody can copy it — PASS

**Merchant:** “I need to paste Shopify Total Sales, entered spend, and Total ROAS to finance. The morning copy is typical order and returning share. Spend has the equation as a hint. There is no copy.”

**Tab:** Spend, first lane (Sales · Spend · Total ROAS).

**Files:**

- `app/app/lib/number-honesty.ts` — `formatTotalRoasEquation` already returns `{sales} sales ÷ {spend} spend = {mer}×`, or `{spend} spend saved · sales still loading` when pending. Null when spend is missing (never 0×).
- `app/app/routes/app.spend.tsx` — paints that string as `.mcfly-book__kpi-hint`. No `copyDeskText`. No `CopyMorningSentence`. No `SlackInsightCard`.
- `app/app/components/MorningHabitStrip.tsx` / `app/app/lib/morning-habit.ts` — founder sentence is typical order + returning share + optional Goals line. `isUnsafeDeskText` **strips** a goal line that mentions last year or `$0`.
- `app/app/lib/shareable-insights.ts` — share cards are returning $, typical order, days-to-second, LTV peek. Not Total ROAS.
- `app/app/components/SlackInsightCard.tsx` — `copyDeskText` exists. Spend does not call it.

**Today:** A teammate without a Meta login still cannot hand finance the pair the Spend tab already computed. Overview share cards are the wrong numbers. Goals copy is returning $ / new-buyer worth.

**Why a $5M store cares:** Saturday Slack is “what did we spend and what did Shopify Total Sales do.” Flow summing orders dies at a few hundred orders a day (operator pain 5). The line is the product. A Slack **sender** is refuse.

**Why it is not a nit:** The sentence is already on screen. The job is the clipboard, not a new metric.

**PASS.** One copy control on the Spend first fold, using `formatTotalRoasEquation`. Empty spend copies nothing (no 0×). Pending copies the loading line, not $0. Do not add Slack as a product. Do not copy a last-year compare that is not on file.

---

### 6. Ops needs who to reach today. The founder strip copies the wait, not the list — PASS

**Merchant:** “The morning copy is ‘typical order around $84. Returning buyers carry 61%.’ Buyer ops asked how many one-order buyers are past win-back, and whether Whale 3 is a $800 ticket gone quiet or an $80 weekly. That sentence is not copyable.”

**Tab:** Customers → Growth (open lane) and the whale watch (depth pack). Second seat, not the founder strip.

**Files:**

- `app/app/lib/growth-first-viewport.ts` — `buildGrowthLeadPeeks` already paints **Reach now** = `tt2.reachNow` (“one-order buyers past win-back”) and **Win-back by**.
- `app/app/components/GrowthTt2Board.tsx` — `CopyMorningSentence` wraps `growthCopyLine(read.line)`: the typical-wait sentence. Reach now is an ActionCard only.
- `app/app/components/CustomersGrowthSection.tsx` — `SlackInsightCard` is `daysToSecondSlackInsight` only.
- `app/app/lib/shareable-insights.ts` — `whaleSlackInsight` copies share of identified sales + median **lifetime**. Not ticket, not last-seen, not a rank.
- `app/app/lib/customers-rfm.ts` — `BuyerRollup` has `total`, `orders`, `firstAmount`, `daysSince`. `buildWatchlist` drops `firstAmount`. Typical ticket = lifetime / orders is computable and hidden. Repeat revenue is painted; first-order ticket is not.
- `app/app/components/GrowthScoreboard.tsx` — first-time dollars and `2nd {pct} · 3rd+ {pct}` and `$second vs $first` are tiles. No copy.

**Today:** Founder morning strip links Month close / Who to save / Set a target. Who to save opens Growth. The copyable line is still the wait. Ops works a list: reach-now headcount + slipping whales by recency and ticket. Admin door is HOLD. Name / email is REFUSE.

**Why a $5M store cares:** The second Shopify staff seat is buyer ops, not the founder. They will not log into Meta. They will paste one line into the morning channel. Headcount without ticket sends them after the wrong whales.

**Why it is not a nit:** The numbers are already on the open Growth peeks and in the whale rollup. Rank 6 is ticket **by order step** for the cohort. This is **this morning’s list**, a different sentence.

**PASS.** One copyable ops line: reach-now count + (when sealed) whale ranks with typical ticket and days since last order, guests out, 8-buyer floor. No name, no email, no Admin URL. Do not recook rank 6.

---

### 7. The whale board can already say ticket and “N more.” It shows Whale 1…8 and a lifetime — PASS

**Merchant:** “We have 80 people with five or more orders. The watchlist stops at Whale 8. I cannot see whether Whale 3 is a high ticket or a frequent small ticket. The Slack line is share and median lifetime. Cold share is already computed and not in that line.”

**Tab:** Customers → Depth whale watch + LTV whale recency. Admin door stays HOLD.

**Files:**

- `app/app/lib/customers-rfm.ts` — `WATCHLIST_MAX = 8`. `.slice(0, WATCHLIST_MAX)` after ranking every positive lifetime. `RFM_MIN_BUYERS = 8` is the floor to **show** a list; 8 is also the **ceiling**. `firstAmount` is rolled up and discarded.
- `app/app/components/CustomerWhaleWatch.tsx` — columns: rank label, lifetime + order count, repeat, last seen. No typical ticket. At 430px the row is still four columns (`minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 0.7fr) 2.4rem`). A `$148,392 · 42 orders` cell is the six-figure nowrap on this board.
- `app/app/lib/ltv-depth.ts` — `WhaleRecency` has `medianLifetime`, `avgLifetime`, `activeShare`, `medianDaysSinceLast`, `ltvMultiple`, **`coldShare`**.
- `app/app/components/LtvWhaleRecency.tsx` — KPIs omit `coldShare`. Slack uses count + share + median lifetime.
- `app/app/lib/customers-analytics.ts` — `WHALE_MIN_ORDERS = 5` for recency buckets (counts only, no ticket).

**Today:** Snowdevil’s eight whales look like the whole book. A $5M store’s watchlist is a slice with no “and 72 more.” Ticket is lifetime/orders from fields already on the row. Cold share is `coldCount / whaleCount` and never copied. Using the stored customer id as an Admin link stays HOLD. Invented names stay REFUSE.

**Why a $5M store cares:** They run win-back off the people who can move the month. Eight ranks with no ticket is a toy list. Concentration % without who is cold is a poster.

**Why it is not a nit:** Not a new field. Not the Admin door. The board hides math it already ran.

**PASS.** Paint typical ticket (lifetime ÷ orders; blank if orders < 1). Paint “Whale 8 of N” or “N more with 5+ orders.” Put cold share in the existing Slack line when it is > 0. Seal under the 8-buyer floor. Guests out. No PII. No Admin door.

---

### 8. Today is capped at about 100 live orders. Spend’s first number and Goals MTD do not say so — PASS (line) / HOLD (crawl)

**Merchant:** “It is 2:55pm on a busy Saturday. Shopify Admin is still ringing. Mcfly’s today looks light. Overview warns the live top-up capped at ~100 orders. I am on Spend and Goals. Those pages do not.”

**Tab:** Spend first fold (Sales KPI) and admin Goals MTD / period hero. Overview / Orders / Customers already disclose via `CashTrustBanners` / `DeskBookPage`.

**Files:**

- `app/app/components/CashTrustBanners.tsx` — “Live today is capped at ~100 orders for a fast desk load. High-volume shops can undercount today until the day closes.” Also, when a **closed** day truncates: “Shopify shares about 60 days of orders on this install” — that 60-day clause is the wrong coverage line on a 90-day unpaid or 24-month paid book.
- `app/app/lib/desk-history.ts` — truncated-today notice for `DeskBookPage`.
- `app/app/routes/app.spend.tsx` — loads `todaySalesTruncated` and passes it into `SpendMixSection` (next lane), not the first Sales · Spend · Total ROAS glance.
- `app/app/routes/app.goals.tsx` — does not take `todaySalesTruncated` / `todaySalesUnavailable` / `orderBackfillProgress`. Period hero can include a short today with no banner.
- `app/app/lib/shopify-sales-api.server.ts` — machine warning: “Today sales truncated by page cap.”

**Today:** Quiet Saturday with $0 and a complete closed book is honest $0 on Overview’s clock (#157). A **busy** Saturday at this GMV is hundreds of orders before close. The live top-up is a page cap, not the day. Million-order **history** crawl stays HOLD. This is today’s **line** on the tabs the operator actually uses after Overview.

**Why a $5M store cares:** They will believe Spend Total ROAS and Goals pace off an undercounted today, then watch the number jump tomorrow when the day seals. Wing-roro’s moving yesterday is this feeling.

**Why it is not a nit:** Overview already wrote the sentence. Spend and Goals still sell the short today as the period.

**PASS** the disclosure on Spend’s first fold and admin Goals when `todaySalesTruncated` / unavailable. **HOLD** raising the live page cap or promising a million-order pull. Fix the truncated-closed-day banner that still says “about 60 days” while unpaid is 90 and paid order rows are 24 months (same coverage-honesty cook as gap 2).

---

### 9. Goals’ projected dollars do not name Shopify Total Sales. The ceiling example is an $80k month — PASS

**Merchant:** “Goals says Projected $412,000 vs $400,000. Is that Shopify Total Sales? The spend ceiling caption still talks about $80k.”

**Tab:** Goals forecast + year board + implied spend ceiling.

**Files:**

- `app/app/routes/app.goals.tsx` — period hero **does** use `PRODUCT_NOUN.salesBasisShort` (“Shopify Total Sales”). Forecast takeaway is `Projected {formatCurrency} vs {formatCurrency}`. Year table headers are Goal / Actual / Prior. Empty spend hides MER and ceiling (honest —). Certified $0 is named on the period hero only.
- `app/app/lib/implied-spend-ceiling.ts` — `impliedSpendCeilingCaption("period_sales")` includes `Example: $80k sales at {n}×`.
- `app/app/components/OrderHistoryForecast.tsx` — “Next month · order history only.” `moneyOrDash` treats `amount <= 0` as —. Formula does not say Shopify Total Sales.
- `app/app/routes/demo.goals.tsx` — “This month sales” + optional Total ROAS + **“At {n}% profit margin.”** Public demo is not the admin year board. Margin line stays REFUSE (delete, do not replace with COGS).

**Today:** Rank 1 made Overview name the total because two Shopify screens already disagreed. Goals is where they type the plan. Unnamed projected dollars plus an $80k ceiling example train a Snowdevil month. A $5M MTD is hundreds of thousands.

**Why a $5M store cares:** They will reconcile Goals to the export. Tudirad’s ~$690 gap was “which Shopify total.” Unnamed plus a toy example is that fight again.

**Why it is not a nit:** Naming the total on Overview was a rank-1 ship. Goals forecast is a different surface that still omits the name. The $80k example is the wrong grain for this scout, not a color pass.

**PASS.** Name Shopify Total Sales on Projected / Actual / Prior. Drop or scale the ceiling example (or delete the example). Empty spend stays —. Missing last year stays —. Do not invent profit.

---

### 10. Growth’s first-time dollars and 2nd vs 3rd are the ops stand-up. Only days-to-second copies — PASS

**Merchant:** “Stand-up is first-time dollars this month and how many already came back. I can copy days to a second order. I cannot copy the first-time $187,000 or ‘2nd 18% · 3rd+ 11%.’”

**Tab:** Customers → Growth. `GrowthScoreboard` + mix. Not rank 6’s step tickets.

**Files:**

- `app/app/components/GrowthScoreboard.tsx` — hero `Sales from first-time buyers` (six-figure month on this store). Tiles: days to second, `$second vs $first`, `2nd {pct} · 3rd+ {pct}`, repeat rate. Drill only.
- `app/app/components/CustomersGrowthSection.tsx` — Slack card = days-to-second.
- `app/app/lib/customers-scoreboard.ts` — `customerConcentrationHeadline` already returns `Top 10% of customers drive {n}% of sales.` `CustomerConcentrationChart` paints it; no copy. (Depth fold is the known DeskLane hole — do not recook the fold. The sentence is still not copyable when the fold is open.)
- `app/app/components/ShareableInsightCards.tsx` — Overview / Customers posters: returning $, typical order, days-to-second, LTV peek. Not first-time $ for the picked period.

**Today:** A six-figure first-time month is the acquisition stand-up. Rank 6 will add step ticket and wait **after** they already came back. This gap is the **window’s** first-time dollars and 2nd vs 3rd mix, already on `GrowthScoreboard`, not on the clipboard. Quiet Saturday: `firstTime` paints “—” when `newSales` is 0 (`&& book.newSales > 0`), so a window with only returning dollars does not copy a fake $0. Pending still says loading. That empty is honest; the missing copy is the hole.

**Why a $5M store cares:** Acquisition vs retention is the Monday meeting. They currently screenshot a tile.

**Why it is not a nit:** Not rank 6. Not the morning founder line. One extra sealed Slack card from numbers already on the board.

**PASS.** Copy first-time Shopify Total Sales for the picked period when `newSales > 0`, plus 2nd vs 3rd when both shares seal, guests out, 8-buyer floor. Never copy $0. Never copy a pending as finished.

---

## Quiet Saturday (other boards, after #157)

Overview’s clock: quiet day is $0, last year not on file is not loading. **Do not recook.**

| Board | Quiet $0 today | Last year missing |
| --- | --- | --- |
| Spend first Sales KPI | Pending → “Still loading — not $0.” Certified month with a $0 Saturday stays the month total. No today-cap banner on this fold (gap 8). | No last-year pair on this fold. |
| Goals period hero | Pending → “Still loading — not $0.” `sales === 0` → “Certified $0 · {period}.” | Prior column —. YoY —. Honest. |
| Goals year Actual | Stub month inside a 90-day slice looks finished (gap 3). | Prior —. Honest. |
| Goals month close | $0 Saturday in the **mean** (gap 4). | N/A. |
| Growth first-time $ | $0 new dollars → “—” (not a copied $0). | N/A. |
| Whale list | Unchanged (lifetime). | Recency truncation note if history limited. |

---

## Phone (other tabs, after v411 Overview stack)

| Surface | 36rem / ~390px | Verdict |
| --- | --- | --- |
| Overview year cards | Stack; last year visible | Tip. Not this note. |
| Spend Sales / Spend / ROAS | Stacks to 1 column under 720px | Readable. Copy is gap 5. |
| Goals year table | `min-width: 720px` + nowrap | Gap 1. |
| Whale watch | 4 columns at 430px, six-figure lifetime + count | Gap 7. |
| Orders / Customers / Growth `peeks-lead` 33% + 0.72rem chips | Known still-PASS | Do not recook here. |

`desk-phone-layout.test.ts` still goldens Snowdevil `$68,457`. It will not catch a six-figure Goals cell.

---

## Refused

- **Whale → Admin door.** Stored customer id on the desk. Marty. HOLD, not a find to cook.
- **Name, email, city.** REFUSE. Rank labels stay `Whale N`.
- **Million-order crawl as shipped.** HOLD. `ORDER_FACT_MAX_DAYS_PER_RUN = 7` and the ~100-order today cap stay. Coverage **lines** are gaps 2 and 8.
- **COGS / P&L / “Kept after margin.”** REFUSE. `demo.goals.tsx` still prints profit margin — delete later, do not replace.
- **Slack / email product, Flow, a sixth Reports tab.** REFUSE. Copy the line (gaps 5, 6, 10).
- **Sessions, pixels, MTA, “true ROAS,” Amazon, Recharge MRR.** REFUSE.
- **Recooking #157, rank 6, Orders 33% peeks, DeskLane, payback $0, Other-source names, compete rows 2–8.** FAIL if listed as new.

---

## Walked

Overview first viewport + mix close + YoY (read-only). Orders greeting / intelligence (no recook of the month board). Customers Growth + LTV whales + RFM watchlist + concentration headline. Spend first fold + Mix `CashTrustBanners` placement + `formatTotalRoasEquation`. Admin Goals year board, gauges, forecast, ceiling. Public `/demo/goals` vs `/app/goals`. `mcfly-desk.css` 36rem / 430px / Goals table / whale grid. `desk-phone-layout.test.ts`. `UnlockFullHistoryBanner`, `live-unpark.ts`, `desk-history.ts`, `cash-trust-copy.ts`. Copy: `MorningHabitStrip`, `SlackInsightCard`, `shareable-insights.ts`, Goals / Growth `CopyMorningSentence`.

Did not Fly. Did not edit `app/`. Did not open a PR. Did not start a cook.

---

## Ten new sentences (quota)

1. On my phone I cannot read this month vs plan — the year board is a 720px nowrap table.
2. The till says 24 months. The unpaid crawl sealed at 90 days. Last year is a dash with no sentence.
3. I picked the year. July looks like a dead month. It is the 90-day slice, painted as Actual.
4. Overview’s month close skips quiet days. Goals’ month close divides by them.
5. Spend already writes the Total ROAS sentence. Nobody can copy it.
6. Ops needs who to reach today. The founder strip copies the wait, not the list.
7. The whale board can already say ticket and “N more.” It shows Whale 1…8 and a lifetime.
8. Today is capped at about 100 live orders. Spend’s first number and Goals MTD do not say so.
9. Goals’ projected dollars do not name Shopify Total Sales. The ceiling example is an $80k month.
10. Growth’s first-time dollars and 2nd vs 3rd are the ops stand-up. Only days-to-second copies.

The desk is not enterprise-ready. Rank 6 stays the named next ship. This list is what a $5M Saturday still cannot do after that.
