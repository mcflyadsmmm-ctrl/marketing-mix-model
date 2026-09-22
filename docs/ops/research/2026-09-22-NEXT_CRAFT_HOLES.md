# Next craft holes — 2026-09-22

**Tip read:** `origin/cursor/spend-trust-recurring` at `b6c4073` (Fly v415 stamp after `#157` same-clock merge `dd865c3`). App tree is that commit. Rank 6 (third-order steps) is the named next ship — not a find.
**Verdict:** The desk still lies after v415. A $5M Saturday operator notices the holes below in week one. This is not a recitation of v410–v415, of `#152` still-PASS, or of the five named knowns (DeskLane `defaultOpen`, payback day-0 `$0`, UnlockFullHistoryBanner 24 vs 90, `demo.goals.tsx` profit-margin line, SAMPLE “Kept after margin.”).
**Locks held:** five painted tabs, flat $39, Live PARKED, no invented metrics, no sixth tab. This file does not patch `app/`, Fly, or open a PR.
**Same-clock `#157` has merged.** Do not list it as missing. Do not recook morning habit, period-total hero, catalog empty, new-buyer truth, the Orders month board, or the third-order steps cook.

## Top sentences a merchant would say

1. The public Goals demo is a margin card. The app Goals page is a year plan.
2. I turned SAMPLE on in Admin and Goals still told me I was covering break-even at 35% profit.
3. SAMPLE Goals says I am X% of the way to $800k returning. I never typed $800k.
4. I opened 2025 on Goals. The forecast is still next month from today, times 2025’s typical day.
5. I left February blank. Year-to-date now looks ahead because the blank was $0.
6. On my phone I cannot read this month versus the plan without swiping a 720px table.
7. Cash CPA cards hide the dates on a 390px iframe.
8. Public `/demo/spend` says first-90 LTV is still filling. SAMPLE Snowdevil already has the book.
9. Spend explorer printed 0× on a day with spend and sales not on file. The certified chips said —.
10. Goals month-close treats days not on the book as $0 in the daily average. The forecast above it does not.

## Ranked holes (new)

Ranked by what a multi-million-dollar operator notices. Each line is a file and the behavior on this tip. **PASS** = one cook can ship it without a new scope, a new tab, or a lie.

### 1. The public Goals demo is a margin card. The app Goals page is a year plan.

**Merchant sentence:** I tried Goals on mcflyads.com/demo/goals. I got this-month sales, optional Total ROAS, and break-even at a profit margin. In Admin the first board is a year plan.

**File / function:** `app/app/routes/demo.goals.tsx` (public page mounts `OrderHistoryForecast` then a 3-KPI well; lines 43–71). `app/app/routes/app.goals.tsx` leads with `<OrderHistoryGoalsBoard>` (line 805) then the year plan, MTD/QTD/YTD gauges, and the 12-month table. `app/app/lib/order-history-forecast-page.test.ts` already records that demo Goals has the forecast and not the year board.

**Wrong:** Public `/demo/goals` does not mount `OrderHistoryGoalsBoard`, `SalesGoalGauges`, or the year table Admin paints. The stranger’s first Goals numbers include break-even “At {n}% profit margin.” Admin Goals is a sales plan.

**Required:** Mount the same Goals stack on `/demo/goals` that Admin mounts — year habit board, Shopify Total Sales vs plan, empty spend as —. Delete the profit-margin KPI (that delete is the known REFUSE-COGS touch; this hole is the missing board).

**PASS.** One route. No new field. The known `demo.goals.tsx` profit-margin *sentence* is still there; the missing year board is the new mount gap.

**Why not a nit:** SAMPLE vs Live / demo vs Admin on the Goals tab. A $5M operator who bought from the public demo asks for profit. The installed app never showed them the year plan they were promised.

### 2. SAMPLE Goals and Spend still speak break-even from a 35% margin.

**Merchant sentence:** I turned SAMPLE on so the desk would fill. Goals and Spend told me I was covering break-even. I never confirmed a margin. Live Settings does not even ask for one.

**File / function:** `app/app/lib/mer-dashboard.server.ts` `buildDashboardMetrics` — `effectiveMarginPct` is `SAMPLE_DESK_MARGIN_PCT` (0.35) whenever SAMPLE is on (1091–1093); `breakEvenMer` is painted when `marginIsConfirmed(settings) || useSampleDesk` (1217–1220). `app/app/lib/sales-goals.server.ts` `buildYearBoard` (549–554) does the same SAMPLE overlay. `app/app/components/SpendMixSection.tsx` `periodTakeaway` (115–124) says “Covering break-even.” / “Below break-even.” when `breakEvenMer` is set. `app/app/components/SalesGoalGauges.tsx` `formatCashMerLine` (32–36) appends `vs BE`. Public `app/app/routes/demo.settings.tsx` (48–51) still prints “break-even {n}× at {pct}% margin.” Admin `app/app/lib/settings-page.test.ts` already forbids a profit-margin field on Admin Settings.

**Wrong:** SAMPLE Admin Goals and Spend still run contribution-margin math from an invented 35%. Live Settings parked the form. SAMPLE Customers “Kept after margin.” is the known sentence; this is the Goals/Spend BE rail on the same overlay.

**Required:** SAMPLE must not paint break-even, “covering break-even,” or `vs BE`. Empty BE is —. Do not invent COGS.

**PASS** to stop the sentence. **REFUSE** a COGS / P&L / margin hero.

**Why not a nit:** A $5M operator who flipped SAMPLE to learn the desk will distrust every later “sales ÷ spend” number after the desk already answered “what’s my profit?”

### 3. SAMPLE Goals paints progress against an $800k returning stretch I never typed.

**Merchant sentence:** SAMPLE Goals says returning dollars are X% of the way to $800,000. Live Goals with no target is empty. I did not type $800k.

**File / function:** `app/app/lib/goals-habit.ts` — `SAMPLE_HABIT_RETURNING_TARGET = 800_000` (line 31). `resolveHabitTarget` (129–137) uses that fallback when `sample` is true and the merchant has not typed a target. `buildHabitGoals` (334–338) wires it. `habitGoalTargetSourceLabel` calls it “Snowdevil stretch.” `OrderHistoryGoalsBoard` (553) prints the $800k on the card. Settings already discloses the stretch (`app.settings.tsx`); the lie is the finished percent, not a missing hedge. Live with `typedReturningTarget` null stays unset.

**Wrong:** SAMPLE never a blank board, so the desk invents an $800k returning target. Live cannot show that progress unless the merchant types a number. The hedge (“Snowdevil stretch”) is under the percent. The percent is what gets read.

**Required:** SAMPLE with no typed returning target is the same unset empty Live uses. Do not invent a stretch so the board looks finished.

**PASS.** One helper. No new field.

**Why not a nit:** SAMPLE vs Live on the first Goals board. Painting a finished percent against a fake target is the catalog-empty class of lie, on dollars.

### 4. I picked 2025 on Goals. The forecast is still next month from today.

**Merchant sentence:** I opened the 2025 year on Goals to plan last year vs this year. The next-month forecast is still October-from-today, multiplied by 2025’s typical day.

**File / function:** `app/app/routes/app.goals.tsx` loader (203–350). `year` comes from `parseGoalsYear`. `salesByDay` is that year’s map (255–257). `buildOrderHistoryForecast` is called with `dailySales: [...salesByDay.values()]` (the selected year) and `todayYear: shopNow.y, todayMonth: shopNow.m` (always the shop’s current month) (340–345). `currentGoalRow` is null when `year !== shopNow.y` (335–338), so the sales-goal plug is blank, but `periodLabel` is still next calendar month from today. `app/app/lib/order-history-forecast.ts` `nextCalendarMonth(input.todayYear, input.todayMonth)` (266).

**Wrong:** A custom Goals year and “this month” are two clocks. The forecast names next month from the live calendar and multiplies a typical day taken from the other year. Hunt question 10 on the megaprompt.

**Required:** When the year picker is not the live year, do not print a next-month close from today × that year’s days. Name Shopify Total Sales. Missing last year stays not on file, never $0.

**PASS.** Same component, honest clock.

**Why not a nit:** A $5M operator uses Goals to manage a year. A forecast that names the wrong month is a number they will act on.

### 5. I left February blank. Year-to-date now looks ahead because the blank was $0.

**Merchant sentence:** I set January’s plan and left February empty. YTD now says I beat the year because February counted as a $0 goal.

**File / function:** `app/app/routes/app.goals.tsx` `parseGoalInput` (111–118) — empty string returns `0`. `upsertYearSalesGoals` (`app/app/lib/sales-goals.server.ts` 444–466) writes that `0`. `sumPeriod` (794–807) does `goal += goals[m - 1] ?? 0`. The year table treats `salesGoal > 0` as “has a plan” (`app.goals.tsx` 1257), so February looks blank in the row and still shrinks the YTD denominator. Copy on the year plan says “Missing months stay blank” / “Missing months are not $0” (`app.goals.tsx` 911–913).

**Wrong:** Blank is stored and summed as $0. Progress % is actual ÷ a smaller goal. The table and the gauges disagree.

**Required:** A cleared month is null / not on file in MTD/QTD/YTD sums, matching the “missing months are not $0” sentence. Empty input must not save a certified $0 plan unless the merchant typed 0.

**PASS.** Same table. No new tab.

**Why not a nit:** A $5M operator who plans Q1 and not the rest of the year will think they are ahead. That changes Saturday spend.

### 6. Goals month-close treats days not on the book as $0. The forecast above it does not.

**Merchant sentence:** Goals says September will close at X because it divided MTD sales by 15 calendar days. Five of those days are not on file yet. The order-history forecast on the same page used only days with sales.

**File / function:** `app/app/lib/sales-goals.server.ts` `buildMonthCloseForecast` (505–507): `avgDailySales = mtdSales / daysElapsed` then `projSales = mtdSales + avgDailySales * remainingDays`. `daysElapsed` is calendar days in the month (`calendarDaysElapsedInMonth`, 320–344). `mtdSales` is the sum of keys actually in `salesByDay` (`salesByMonthFromDayMap`, 227–233) — missing days are omitted from the sum, then divided by the full calendar elapsed count. Painted at `app.goals.tsx` 1004–1031 when `forecast.monthGoal > 0`. `app/app/lib/order-history-forecast.ts` `buildOrderHistoryForecast` (267) keeps `dailySales.filter((n) => n > 0)` and needs eight days with sales.

**Wrong:** Two forecasts on Goals. One interpolates through a fake $0 for days not on the book (quiet pending, unpaid 90-day hole, thin last year). The other refuses a typical day until days *with sales* exist. Spend empty does not fake 0× here (`ForecastMerLine` only when `mtdSpend > 0`), but the sales close still does.

**Required:** Month-close pace uses days with sales, or withholds the number while the book is incomplete. Never a remaining-day count through missing days. Name Shopify Total Sales.

**PASS.** Same Goals cook as holes 4–5 if collapsed. Honest empty.

**Why not a nit:** Interpolating a close through days that are not on file is the payback-day-0 class of lie, on the year-plan tab the last wave barely touched.

### 7. On my phone I cannot read this month versus the plan without swiping.

**Merchant sentence:** I opened Goals in Admin on my phone. This month’s goal and actual are in a table I have to swipe. The primary number is off the iframe.

**File / function:** `app/app/styles/mcfly-desk.css` `.mcfly-goals-table` `min-width: 720px` and `th, td { white-space: nowrap }` (7251–7264). Wrap is `.mcfly-goals-table-wrap { overflow-x: auto }` (7243–7249). Parent `.mcfly-desk-anchor` / `.mcfly-desk` set `overflow-x: hidden` (13562–13567). Overview glance was stacked in v411; this table was not. Goals has no panel rail (`app/app/lib/desk-panel-rail.ts` has no `/app/goals` chips). `SalesGoalGauges` sit in the same first fold with no 36rem stack for six-figure actual / goal pairs beyond the table.

**Wrong:** A 390px Admin iframe cannot show January’s six-figure Shopify Total Sales next to the plan without a horizontal swipe inside a page that forbids page scroll. Overview year cards were this class of hole. Goals still has it.

**Required:** Stack month / goal / actual on a 36rem iframe so the primary number is on screen. The dollar may wrap. Last year missing stays —.

**PASS.** CSS + the year table. Do not start a second agent in `mcfly-desk.css` beside the still-PASS Orders `calc(33.333% - 0.32rem)` cook — collapse with that phone pass or wait until it lands.

**Why not a nit:** A $5M Saturday operator runs Goals from the phone. If this month vs plan is off-screen, they will not keep $39.

### 8. Cash CPA cards hide the dates on a 390px iframe.

**Merchant sentence:** I tapped Spend → CPA on my phone. I see “This month” and a dollar. I cannot see which dates that is.

**File / function:** `app/app/components/CpaWindowCards.tsx` (32–33, 107–113) — the windows are `mcfly-yoy mcfly-yoy--glance`; the date span is `<span className="mcfly-yoy__range"> · {window.rangeLabel}</span>`. `app/app/styles/mcfly-desk.css` `@media (max-width: 36rem)` (13725–13753) sets `.mcfly-yoy--glance .mcfly-yoy__range { display: none }` (13750–13753). That rule was written for Overview glance chrome (zone / range), then CPA reused the class. `.mcfly-cpa__window-grid` stacks at 36rem (17674–17678) — the *number* can fit; the *window* disappears.

**Wrong:** Overview’s 36rem pass hid zone/range on purpose for year cards. CPA’s primary identity is the date window. This month vs last 28 vs a custom period is unreadable on the phone. Not the known Orders 33.333% peek lock.

**Required:** Keep `rangeLabel` on the CPA card at 36rem. Do not reuse a hide rule that was for Overview chrome.

**PASS.** One class split. No new metric.

**Why not a nit:** Cash CPA without dates is a number the operator cannot defend in Slack. Same-clock `#157` already failed a quiet day painted as “still loading”; hiding the window is the same honesty bar on Spend.

### 9. Public `/demo/spend` says first-90 LTV is still filling. SAMPLE already has the book.

**Merchant sentence:** The public Spend demo showed payback as not on file / still filling. Admin SAMPLE Spend shows first-90 from Snowdevil.

**File / function:** `app/app/routes/demo.spend.tsx` `buildCpaPaybackView` (122–127) passes `avgRevenueD30: null`, `avgRevenueD90: null`, `paybackDays: null`. The desk is mounted with `historyLimited` (308–313). `app/app/components/CpaPaybackDesk.tsx` (68–71) then says “First-90 value is still filling from the Shopify order window — not $0 LTV.” Admin `app/app/routes/app.spend.tsx` (1307–1311) passes `cpa.paybackBase.historyLimited` from the real SAMPLE book (`loadSpendCpa` in `desk-spend-stack.server.ts`). Public SAMPLE page (`loadPublicSamplePage`) already has `ltv.revenue30 / revenue90`.

**Wrong:** Demo vs Admin on the same SAMPLE ledger. Public Spend withholds LTV the generator already stamped. Admin SAMPLE paints it. A stranger who compared the two thinks Live is broken or the demo is.

**Required:** Public `/demo/spend` mounts the same payback inputs Admin SAMPLE uses from the Snowdevil book. Do not force `historyLimited` on a finished SAMPLE book. Do not recook the day-0 interpolation (known still-PASS).

**PASS.** Wire the existing SAMPLE LTV into the existing view.

**Why not a nit:** SAMPLE vs Live / demo vs Admin on Spend, the tab the last wave barely opened.

### 10. Spend explorer printed 0× on a day with spend and sales not on file.

**Merchant sentence:** I added yesterday’s spend before closed sales landed. The explorer bar said 0×. The certified chips said empty / —. I do not know which to believe.

**File / function:** `app/app/lib/mer-dashboard.server.ts` `buildDailyRowsForWindow` (728–732): `sales = row?.sales ?? 0`; a spend-only day is kept (`if (sales <= 0 && spend <= 0) continue`). `app/app/lib/spend-explorer.ts` `merOf` (191–196) returns `sales / spend` when spend > 0 — **`$0 / $spend` is `0`, not null**. Explorer buckets (`bucketExplorerRows`, 612–619) paint that 0. `app/app/routes/demo.spend.tsx` `publicExplorerSeries` (70) does `sales: salesByDay.get(day.dateKey) ?? 0`. Certified chips already fail-closed: `app/app/lib/mer-control.ts` `certifyDailyRows` (359–370) sets `unpaired = spend > 0 && !(sales > 0)` and `mer: unpaired ? null : merOf(...)`. `desk-spend-stack.server.ts` (537–540) also passes `newCustomers: 0, returningCustomers: 0` into `summarizeExplorer` (gated by `customerMetricsAvailable: false`, so CPA in the summary stays null — the 0× leak is the explorer MER, not that summary).

**Wrong:** Two Spend boards. Certified Total ROAS withholds unpaired days (never 0×). The explorer interpolates missing sales as `$0` and prints `0×`. A quiet Saturday with last year not on file, or a trial shop with sales still syncing, gets the ads-made-nothing reading the 2026-08-26 Overview smoke was written to stop.

**Required:** Explorer MER is — when sales are not on file. `$0` sales is only certified closed-day zero. Never 0× from `?? 0`.

**PASS.** Same `merOf` guard the certified path already has. No pixel, no MTA.

**Why not a nit:** Fake 0× is a fireable lie. Empty spend as — already shipped. This is the remaining hole on the explorer the certified chips do not cover.

## Sharper evidence on known still-PASS (not quota)

Do not cook these as “new.” File depth only.

| Known | Sharper evidence on this tip |
| --- | --- |
| History banner 24 vs unpaid 90 | Every book till chip: `deskPeriodTillLabel` (`desk-history.ts` 79–80) says “live sales · up to 24 months of orders” whenever `includeShopifyOrderWindow` is on (Orders, Customers). `OVERVIEW_COVERAGE_LINE` and `PRODUCT_NOUN.shopifyBookMuted` say 24 months on Overview/Orders/Customers ledes. Public `site/pricing.html` is locked by `site-go-live.test.ts` to “24 months of order history.” The banner is not the only sentence. |
| DeskLane `defaultOpen` | Still `useState(fold ? defaultOpen : true)` in `DeskLane.tsx:29`. Depth, `?panel=spend-add`, Overview weekday fold unchanged. `HashDetails` on Spend (`app.spend.tsx` 217–248) *does* follow a later `defaultOpen` and hash — the add form behind `DeskLane` does not. |
| Payback day-0 `$0` | Still `{ day: 0, revenue: 0 }` in `cash-payback.ts` 17–18. Public demo Spend currently *avoids* printing a day count by passing `paybackDays: null` (hole 9) — that is a different lie, not a fix. |
| `demo.goals.tsx` profit margin | Still line 69. Hole 1 is the missing Admin board, not this sentence. |
| SAMPLE “Kept after margin.” | Still `CustomersLtvSection.tsx` 141, 228–233 (`showMarginKept = marginConfirmed \|\| useSampleDesk`). Hole 2 is Goals/Spend BE from the same 35%. |

## Already honest on these surfaces (do not “fix” into new numbers)

- Empty spend on the Spend hero is `—`, never `0×`. A deleted day stays `$0`.
- Goals period hero is `—` while `salesPending`; certified `$0` only when `periodMetrics.sales === 0` (`app.goals.tsx` 844–853). Implied spend ceiling is hidden when spend is empty (`periodHasSpend` gate, 856–888).
- `calculateMer` returns null when spend ≤ 0 (`packages/mer-core/src/mer.ts`). Year-board MER is not 0× from empty spend.
- Orders intelligence does not read `WELCOME10` as 10% (`orders-intelligence.ts` 641). Promo depth says a code name is not a percent (`ltv-promo.ts` 16). Do not recook that.
- Five analysis tabs stay five. `/demo/growth`, `/demo/ltv`, `/demo/cpa`, `/demo/allocation` redirect onto Customers/Spend chips.

## Refused / not this note

- Reciting morning habit, period-total hero, live catalog empty, returning mix, Orders month intelligence as new finds.
- Listing same-clock `#157` as missing.
- Recooking DeskLane, payback day-0, UnlockFullHistoryBanner, compete rows 2–8, rank 6 (1st/2nd/3rd/4th+ ticket).
- COGS / P&L / gross profit as a Goals or Customers hero. The cook is *delete* SAMPLE/demo profit sentences (holes 1–3), not replace them.
- Unpark Live. History SKU. GMV ladder. Sixth tab. ShopifyQL / `read_reports`. Partner Submit.
- Whale → Admin door (HOLD until Marty). Product titles. Refund processing date. Country. Sessions. Pixels. MTA.

## What this file is not

Not a Fly. Not an `app/` patch. Not a cook. Not “the desk is solid.”
