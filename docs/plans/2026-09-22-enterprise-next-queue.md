# Enterprise next-pass cook queue — 2026-09-22

> **For agentic workers:** This queue starts only after **rank 6** (third-order ticket / wait / reach on Customers → Growth, `#162`, `cursor/third-order-steps-5bc6`) lands, or Marty skips it. Until then the scoreboard stays rank 6. **Do not list rank 6 as a find. Do not restart ranks 1–6.** Rank 1 of **this** queue is the only cook once that gate opens. One implementer. One Reviewer. One Fly only after that Reviewer marks PASS. Ranks 2+ of this queue stay queued. Do not start them. Do not dispatch a craft agent per rank. Do not Fly this plan.

**Goal:** After the third-order steps ship, a $5M–$10M Shopify operator keeps $39/store/month because the next order-history question is on the open lane, SAMPLE/demo does not invent profit or an $800k target, a phone can read Goals and Spend, and a teammate can copy Shopify Total Sales ÷ typed spend without a Meta login.

**Architecture:** Collapse the five next-pass notes plus any `#152` still-PASS item that is now unblocked into one ranked list. When two pains share a surface, they are one cook. Rank 1 of this queue stops the Goals SAMPLE/demo lie. Later ranks wait, including Spend explorer 0×, the 720px Goals table, and compete rows 2–8.

**Tech stack:** The existing Remix desk (`app/`). Painted tabs only. No new stored field on any rank in this queue. No new tab. No ShopifyQL. Live stays PARKED.

**Base this plan is cut from:** `origin/cursor/spend-trust-recurring` at `b6c4073` (`docs: stamp Fly v415 and name the third-order steps`). The five notes scored that same tip. Fly **v415** / merge `dd865c3` (`#157` same-clock) is on the tip. Rank 6 is the named next craft and may still be in review. Same-clock is not listed as missing.

**Sources, and only these sources:**

| Note | Branch | Commit | File | PR |
| --- | --- | --- | --- | --- |
| Desk truth | `origin/cursor/next-desk-truth-5bc6` | `31c37a7` | `docs/ops/research/2026-09-22-NEXT_DESK_TRUTH.md` | #159 |
| Craft holes | `origin/cursor/next-craft-holes-5bc6` | `3428a37` | `docs/ops/research/2026-09-22-NEXT_CRAFT_HOLES.md` | #164 will be opened by conductor |
| Compete | `origin/cursor/next-compete-5bc6` | `7e9c963` | `docs/ops/research/2026-09-22-NEXT_COMPETE.md` | #160 |
| Operator | `origin/cursor/next-operator-5bc6` | `890304e` | `docs/ops/research/2026-09-22-NEXT_OPERATOR.md` | #161 |
| Volume | `origin/cursor/next-volume-desk-5bc6` | `543cd3e` | `docs/ops/research/2026-09-22-NEXT_VOLUME.md` | #163 |
| Old queue (`#152`) | `origin/cursor/enterprise-cook-queue-5bc6` | `16b9a18` | `docs/plans/2026-09-22-enterprise-cook-queue.md` | #152 |

Quotes below are copied from those notes. Figures below are copied from those notes. Nothing in quotation marks was written for this plan.

## Global constraints

- Painted IA: Overview, Orders, Customers, Spend, Goals. Growth and LTV are Customers chips, never a sixth tab.
- One plan, $39/store/month, after a 7-day trial. No Free plan. No GMV ladder.
- Total ROAS = Shopify Total Sales ÷ entered spend, or —. Never 0×. Never a fake $0.
- Live stays PARKED. No Partner Submit. No `read_all_orders` as shipped. ShopifyQL / `read_reports` stays HOLD.
- Product titles stay HOLD. SAMPLE must not invent a catalog Live cannot store.
- Country, subscription-checkout bit, refund processing date, gift-card product flag, automatic discount titles stay HOLD.
- Guests stay out of returning. A missing last year stays not on file, never $0. A window the compete notes seal only at 8 buyers stays — under that floor.
- `WELCOME10` stays a name, never 10%.
- Do not recook morning habit, period-total hero, live catalog empty, new-buyer truth, the Orders month board, same-clock, or rank 6.
- One writer per surface. Do not open four cooks on `mcfly-desk.css` or `app.goals.tsx`.
- Nits do not deploy. Do not Fly this plan.

## What collapsed

These looked like many cooks. They are twelve surfaces. Nits did not make the list.

| Candidate | Surface | Where it went |
| --- | --- | --- |
| Public Goals ≠ app Goals (craft hole 1), SAMPLE 35% break-even on Goals/Spend (craft hole 2), untyped $800k returning (craft hole 3), delete `demo.goals.tsx` “At {n}% profit margin” and SAMPLE “Kept after margin.” | `demo.goals.tsx` / Goals SAMPLE overlay / `goals-habit.ts` | **Rank 1**, one Goals honesty cook |
| Phone 720px year-vs-plan table (volume 1 + craft hole 7), `#152` phone chips + full-price vs discounted peek, Cash CPA `rangeLabel` hidden at 36rem (craft hole 8) | `mcfly-desk.css` | **Rank 2**, one phone cook |
| Explorer 0× (craft hole 10), partial-spend 6× pair (desk 7), copyable Spend Total ROAS (desk 8 + volume 5), Total ROAS counting POS/Shop against typed ads (desk 2), Cash CPA week buyersKnown (desk 6), public `/demo/spend` first-90 still filling (craft hole 9), `#152` payback day-0 `$0` | One Spend surface: `app.spend.tsx` / `demo.spend.tsx` / explorer / payback | **Rank 3**, one Spend honesty cook. Kept together because they share that surface. CPA **dates** stay rank 2 (CSS). |
| `#152` 24-vs-90 banner, every till still saying 24 months (volume 2 + craft sharper evidence), today ~100-order cap missing on Spend first fold (volume 8), “about 60 days” banner, pending Klarna unnamed (operator 1), plausible Shopify slice unlabeled (operator 5), copyable YTD Total Sales (operator 4, Overview year card) | Tills / `desk-history.ts` / Overview coverage / `CashTrustBanners` | **Rank 4**, one book-coverage cook. Goals MTD today-cap stays rank 5 (`app.goals.tsx`). |
| Goals 2025 forecast still next-month-from-today (craft hole 4), February blank stored as `$0` (craft hole 5), month-close missing days as `$0` vs Overview skipping quiet days (craft hole 6 + volume 4 + desk 4), spend pace through days they did not spend (desk 5), stub July Actual inside a 90-day slice (volume 3), unnamed Projected + `$80k` ceiling example (volume 9), month row is till not returning `$` (desk 10), buyer count to hit the plan (compete 21) | `app.goals.tsx` / `sales-goals.server.ts` / `order-history-forecast.ts` | **Rank 5**, one Goals year-board cook. Waits for rank 1. |
| `#152` DeskLane `defaultOpen` (Depth, `?panel=spend-add`, Overview weekday fold) | `DeskLane.tsx` | **Rank 6 of this queue**, not third-order steps |
| Quiet-then-back `$` (desk 9 + compete 11), Growth first-time `$` / 2nd vs 3rd copy (volume 10), reach-now copy (volume 6, without whale ticket), `#152` compete row 5 (next wait after they already came back), first→last lifetime (compete 16) | `customers-analytics.ts` / Growth scoreboard (free only after **old** rank 6) | **Rank 7** |
| Whale 1 ticket hidden (desk 3 + volume 7), `WATCHLIST_MAX = 8` with no “N more,” cold share uncopied, RFM flow not a still photo (compete 12) | `customers-rfm.ts` / whale watch | **Rank 8**. Waits for rank 6 of this queue so Depth opens. |
| This month `$` by 1st/2nd/3rd/4th+ (compete 9), first-time vs returning ticket (compete 10), typical labeled Total Sales per order + tax/shipping slice (operator 2), period concentration (compete 15), new vs returning hour (compete 17), discount `$` vs last September (desk 11), kept share vs last year (compete 19), first vs returning discount depth (compete 20), dollars per unit (operator 3), `$0` reship count (operator 6) | `orders-intelligence.ts` / Orders first viewport | **Rank 9**, one Orders mix cook |
| Guest checkout as **dollars** (desk 1), `#152` source names inside Other, returns climbing on POS vs online (desk 12) | Source bar / `classifyOrderSource` / guest tile | **Rank 10**. Not the intelligence board. Rank 9 already used `app.orders.tsx`; this waits. |
| `#152` compete rows 2–3, annual installed-base retention (compete 18) | Overview + Growth peek | **Rank 11**. Waits for rank 4 (Overview coverage line) and rank 7 (`customers-analytics.ts`). |
| `#152` compete rows 4, 6, 7, 8 plus launch-week class (compete 13) and orders per month of life (compete 14) | LTV chip / `ltv-depth.ts` | **Rank 12**. Waits for rank 8 (`CustomersLtvSection.tsx`). |

Not collapsed, on purpose:

- Partial-spend pair vs explorer 0× vs POS-in-ads **would** have been three Spend cooks. They are one Spend surface, so they are rank 3.
- Goals month-close vs Overview quiet-day typical share formula files (`sales-goals.server.ts` `buildMonthCloseForecast` vs `overview-mix-forecast.ts`). They are rank 5, not a second Overview cook. Do not recook `#157`.
- Guest dollars vs CPA week `newCustomers: 0` both sit near `salesResultFromDayTotal`. Different painted surfaces (Orders/Customers tile vs Spend explorer). Rank 3 wires the paste buyer index onto explorer days; rank 10 sums `OrderFact.amount` where `customerKey === "guest"`. Neither rank rewrites the other tab.

## Already on the tip — do not recook

Morning sentence (v410) · period-total hero + phone year cards (v411) · live catalog empty (v412) · returning mix from the stored book (v413) · Orders intelligence on the picked period, code dollars, returns climbing (v414) · same-clock compare (v415) · promo LTV, source LTV (web / POS / Shop), spend paste, empty spend as —, deleted day as `$0`, unique SAMPLE buyers on the paste book (v409) · starter / open-lane LTV (v408).

**Named next craft, not this queue:** 1st / 2nd / 3rd / 4th+ ticket, reach, and wait on Customers → Growth (`cursor/third-order-steps-5bc6`). Seal at ≥8 buyers. Guests out. Thin side —. That is old rank 6 / `#162`. Do not restart it. Do not list it as a find.

## Rank 1 — next cook (after old rank 6)

**Sentence:** I tried Goals on mcflyads.com/demo/goals and got break-even at a profit margin. In Admin the first board is a year plan. SAMPLE still says I am covering break-even at 35% and X% of the way to $800,000 I never typed.

**Tab:** Goals. Public `/demo/goals` and Admin `/app/goals`. SAMPLE overlay also leaks onto Spend mix (“Covering break-even.”) and SAMPLE Customers (“Kept after margin.”).

**Verdict:** Merged **PASS**. Craft holes 1, 2, and 3. Known REFUSE-COGS delete, not a cost cook.

**Why it is not a nit:** Public `/demo/goals` mounts `OrderHistoryForecast` then a 3-KPI well. Admin `/app/goals` leads with `OrderHistoryGoalsBoard`, the year plan, MTD/QTD/YTD gauges, and the 12-month table. `order-history-forecast-page.test.ts` already records that demo Goals has the forecast and not the year board. The stranger’s first Goals numbers include break-even “At {n}% profit margin.” SAMPLE Admin Goals and Spend still run contribution-margin math from `SAMPLE_DESK_MARGIN_PCT` (0.35) whenever SAMPLE is on (`mer-dashboard.server.ts` `effectiveMarginPct`; `breakEvenMer` when `marginIsConfirmed(settings) || useSampleDesk`). `SpendMixSection` `periodTakeaway` says “Covering break-even.” / “Below break-even.” `SalesGoalGauges` `formatCashMerLine` appends `vs BE`. Public `demo.settings.tsx` still prints “break-even {n}× at {pct}% margin.” Admin Settings already forbids a profit-margin field. `SAMPLE_HABIT_RETURNING_TARGET = 800_000`; `resolveHabitTarget` uses that fallback when `sample` is true and the merchant has not typed a target; `habitGoalTargetSourceLabel` calls it “Snowdevil stretch.” Live with `typedReturningTarget` null stays unset. The hedge is under the percent. The percent is what gets read. Craft: a $5M operator who bought from the public demo asks for profit; the installed app never showed them the year plan. Painting a finished percent against a fake target is the catalog-empty class of lie, on dollars.

**Branch:** `cursor/goals-honesty-5bc6`, cut from `origin/cursor/spend-trust-recurring` at `b6c4073` or a later tip that still contains v415 and the rank-6 merge (or Marty’s skip). One implementer. One Reviewer. One Fly only after PASS.

**Files:**

- `app/app/routes/demo.goals.tsx` — public page mounts forecast + 3-KPI well (lines 43–71). Profit-margin KPI still line 69.
- `app/app/routes/app.goals.tsx` — the Admin stack to mount (`OrderHistoryGoalsBoard` ~805, year plan, gauges, 12-month table).
- `app/app/lib/order-history-forecast-page.test.ts`
- `app/app/lib/mer-dashboard.server.ts` — `SAMPLE_DESK_MARGIN_PCT` / `effectiveMarginPct` ~1091–1093; `breakEvenMer` ~1217–1220.
- `app/app/lib/sales-goals.server.ts` — `buildYearBoard` SAMPLE overlay ~549–554.
- `app/app/lib/goals-habit.ts` — `SAMPLE_HABIT_RETURNING_TARGET = 800_000` (line 31); `resolveHabitTarget` ~129–137; `buildHabitGoals` ~334–338.
- `app/app/components/OrderHistoryGoalsBoard.tsx` — prints the $800k (~553).
- `app/app/components/SpendMixSection.tsx` — `periodTakeaway` ~115–124.
- `app/app/components/SalesGoalGauges.tsx` — `formatCashMerLine` ~32–36.
- `app/app/routes/demo.settings.tsx` — ~48–51.
- `app/app/components/CustomersLtvSection.tsx` — “Kept after margin.” still ~141, 228–233 (`showMarginKept = marginConfirmed || useSampleDesk`).
- `app/app/lib/settings-page.test.ts` — already forbids a profit-margin field on Admin Settings; keep that lock.

**Done when:**

- `/demo/goals` mounts the same Goals stack Admin mounts: year habit board, Shopify Total Sales vs plan, empty spend as —.
- SAMPLE does not paint break-even, “Covering break-even.”, `vs BE`, or a profit-margin KPI. Empty BE is —.
- SAMPLE with no typed returning target is the same unset empty Live uses. No invented $800,000 stretch percent.
- SAMPLE Customers does not paint “Kept after margin.” The later touch is **delete**, not a cost number.
- Five analysis tabs stay five. No COGS / P&L / margin hero. Live Settings still has no profit-margin field.

**Check:** from `app/`, the Goals forecast-page test plus Settings page test. Public `/demo/goals` and Admin SAMPLE Goals show the year plan, not a margin card.

**Not this cook:** February blank as `$0`, 2025-year forecast clock, month-close pace, the 720px table, Spend explorer 0×, payback day-0, a ShopifyQL box, unparking Live.

**Wait:** old rank 6. `sales-goals.server.ts` / `mer-dashboard.server.ts` / `app.goals.tsx` are then this writer’s until rank 5.

## Rank 2 — queued

**Sentence:** On my phone I cannot read this month versus the plan without swiping a 720px table.

**Tab:** Goals year board (Admin `/app/goals`). Also Orders / Customers chips and Spend → CPA window cards at `max-width: 36rem`.

**Verdict:** Merged **PASS**. Volume 1, craft hole 7, `#152` phone chips + full-price vs discounted peek, craft hole 8.

**Why it is not a nit:** `.mcfly-goals-table` is `min-width: 720px` with `th, td { white-space: nowrap }`; wrap is `overflow-x: auto`; parent `.mcfly-desk` sets `overflow-x: hidden`. Overview glance stacked in v411; this table did not. Volume: a `$417,392` Actual stays nowrap on a rail almost twice the iframe; the 390px fixture is Snowdevil `$68,457`, not hundreds of thousands. `#152` still-PASS: Customers chips are `font-size: 0.72rem`; Orders lead cards are a nowrap row capped at `calc(33.333% - 0.32rem)`, value two amounts joined by “ vs ”. Craft hole 8: `CpaWindowCards` reuses `mcfly-yoy--glance`; `@media (max-width: 36rem)` sets `.mcfly-yoy--glance .mcfly-yoy__range { display: none }`. The number can fit; the window disappears. One writer in `mcfly-desk.css`. Not four.

**Branch:** `cursor/phone-goals-chips-5bc6`.

**Files:**

- `app/app/styles/mcfly-desk.css` — `.mcfly-goals-table` ~7251–7264; wrap ~7243–7249; overflow hidden ~13562–13567; glance `range` hide ~13750–13753; `.mcfly-cpa__window-grid` ~17674–17678; Orders `peeks-lead` / chip type. Do not edit the morning-habit block at the end of the file.
- `app/app/lib/desk-phone-layout.test.ts` — locks Overview stack + Orders `33.333%`. Does not yet lock a Goals stack. The Orders lock stays until **this** cook changes it.
- `app/app/routes/app.goals.tsx` — year board columns (Month · Goal · Actual · Spend · Ceiling · MER · Prior · YoY · Pace). Markup only if a stack class is required. No formula change.
- `app/app/components/CpaWindowCards.tsx` — split the glance class so CPA keeps `rangeLabel` at 36rem.
- Orders lead cards / Customers chips — wrap the words inside the card. Do not add a tab.

**Done when:** Under 36rem, this month’s Goal / Actual / Prior are on screen. The dollar may wrap. Last year missing stays —. Orders three-up may change in **this** cook only; the peek text wraps. Customers chips are readable. CPA cards keep `rangeLabel`. Public `/demo/goals` stacks the same table once rank 1 has mounted it. Never a fake `$0`.

**Not this cook:** whale 430px four-column grid (rank 8), Goals formula (rank 5), Spend pair copy (rank 3).

**Wait:** rank 1 so demo Goals has the year table. Do not start a second agent in this CSS file.

## Rank 3 — queued

**Sentence:** I added yesterday’s spend before closed sales landed. The explorer bar said 0×. I cannot copy Shopify Total Sales, typed spend, and Total ROAS. Weekday-only paste still makes the pair look like 6×.

**Tab:** Spend, first lane (Sales · Spend · Total ROAS) and the explorer. Payback desk on the same tab.

**Verdict:** Merged **PASS**. Craft holes 10 and 9, desk 2, 6, 7, 8, volume 5, `#152` payback day-0 `$0`. One Spend surface.

**Why it is not a nit:** Certified chips already fail-closed (`certifyDailyRows` sets `unpaired` when `spend > 0 && !(sales > 0)` and `mer: unpaired ? null : merOf(...)`). Explorer `merOf` returns `sales / spend` when spend > 0 — “`$0 / $spend` is `0`, not null.” `buildDailyRowsForWindow` does `sales = row?.sales ?? 0`. Public `demo.spend.tsx` `publicExplorerSeries` does `sales: salesByDay.get(day.dateKey) ?? 0`. Craft: fake 0× is a fireable lie; empty spend as — already shipped. `formatTotalRoasEquation` is already painted as `.mcfly-book__kpi-hint`; Spend does not call `copyDeskText` / `CopyMorningSentence` / `SlackInsightCard`. Morning habit is “no spend, no ad login.” Volume: Saturday Slack is “what did we spend and what did Shopify Total Sales do.” Desk 7: coverage is a filled/empty strip of spend days only; it does not overlay `SalesDayFact` days with sales; partial spend + full sales inflates the multiple. Desk 2: the numerator is the period’s full till, not `classifyOrderSource`; omnichannel books at this size often run 15–40% POS or Shop; a 3.5× on the pair card is then a blended till. Desk 6: window cards overlay unique `OrderFact` counts; Live explorer grain reads `SalesDayFact.newCustomers` with `buyersKnown: false`; `salesResultFromDayTotal` writes `newCustomers: 0`; SAMPLE looks finished. Craft hole 9: public `buildCpaPaybackView` passes `avgRevenueD30: null`, `avgRevenueD90: null`, `paybackDays: null` and forces `historyLimited`; Admin SAMPLE passes the Snowdevil book; `CpaPaybackDesk` then says “First-90 value is still filling from the Shopify order window — not $0 LTV.” `#152` payback anchors still begin `{ day: 0, revenue: 0 }` in `cash-payback.ts`. Public demo currently avoids printing a day count by passing `paybackDays: null` — that is a different lie, not a fix.

**Branch:** `cursor/spend-pair-honesty-5bc6`.

**Files:**

- `app/app/lib/spend-explorer.ts` — `merOf` ~191–196; `bucketExplorerRows` ~612–619.
- `app/app/lib/mer-dashboard.server.ts` — `buildDailyRowsForWindow` ~728–732. Rank 1 also touches this file for SAMPLE margin; **wait for rank 1**.
- `app/app/lib/mer-control.ts` — certified path already honest; match it.
- `app/app/lib/number-honesty.ts` — `formatTotalRoasEquation`; `NUMBER_HONESTY.isLine` (“every dollar you typed”).
- `app/app/lib/spend-coverage.server.ts` — `SpendDayCoverageCell.filled`.
- `app/app/lib/shopify-depth-stats.ts` — `sourceSalesShare` already Online / POS / Shop / Other.
- `app/app/routes/app.spend.tsx` / `app/app/routes/demo.spend.tsx` — pair, explorer, `buildCpaPaybackView` ~122–127, `historyLimited` ~308–313.
- `app/app/lib/cash-payback.ts` — day-0 `{ day: 0, revenue: 0 }` ~17–18.
- `app/app/components/CpaPaybackDesk.tsx`
- `app/app/lib/cpa-desk.server.ts` / `app/app/lib/cpa-desk.ts` — `bucketCpaDays`, `buyersKnown`.
- `app/app/lib/desk-spend-stack.server.ts` / `app/app/lib/spend-paste-buyers.server.ts` — `buildLivePasteBuyerIndex`.
- `app/app/lib/shareable-insights.ts` — kinds are `returning` · `typicalOrder` · `daysToSecond` · `ltvPeek` · `whale`. Not Total ROAS.
- `app/app/components/SlackInsightCard.tsx` — `copyDeskText` exists. Spend does not call it.

**Done when:**

- Explorer MER is — when sales are not on file. `$0` sales is only a certified closed-day zero. Never 0× from `?? 0`.
- The pair names coverage (sales days vs spend days) or withholds until the merchant says the holes are real zeros. Do not write `$0` spend onto missing days.
- One copy control on the Spend first fold, using `formatTotalRoasEquation`. Empty spend copies nothing. Pending copies the loading line, not `$0`. Do not copy 0×. Do not invent a Slack product.
- A second labeled line uses **Online** Shopify Total Sales ÷ typed spend, with POS/Shop named as excluded. Do not replace the Total ROAS religion. Do not claim attribution. Do not claim POS drawer tape.
- Live explorer week grain uses unique buyers already in the Spend loader (paste index), or stays —. Unknown buyers stay —, never spend ÷ 0.
- Public `/demo/spend` mounts the same payback inputs Admin SAMPLE uses from the Snowdevil book. Do not force `historyLimited` on a finished SAMPLE book.
- Payback shows the anchors or stops printing a day count. The day-0 `{ revenue: 0 }` is not a finished zero. Refuse causal / ads-manager payback.

**Not this cook:** CPA date chrome (rank 2), DeskLane add-spend fold (rank 6 of this queue), pixels / MTA / “true ROAS.”

**Wait:** rank 1 (`mer-dashboard.server.ts`).

## Rank 4 — queued

**Sentence:** Trial and paid use the same book, and 24 months are already on this desk. Then this year vs last year is a dash. Nobody told me the crawl stopped at 90 closed days — or that pending Klarna sits in this Shopify Total Sales.

**Tab:** Overview first fold and every book till (Orders, Customers, Spend). Not a history SKU.

**Verdict:** Merged **PASS**. Volume 2 and 8 (Spend first-fold today-cap + “about 60 days”), `#152` banner, craft sharper evidence on every till, operator 1, operator 5, operator 4 (copyable YTD on the Overview year card).

**Why it is not a nit:** `LIVE_UNPAID_INGEST_DAYS = 90`. `deskHistoryCaption` / `deskPeriodTillLabel` with `includeShopifyOrderWindow` always “live sales · up to 24 months of orders.” `OVERVIEW_COVERAGE_LINE` and `PRODUCT_NOUN.shopifyBookMuted` say 24 months. `orderHistoryProgressMessage` returns **null** once `remainingDays <= 0`; a sealed 90/90 unpaid book goes quiet; then the till says 24 months. `UnlockFullHistoryBanner` still “24 months of orders are already on this desk. Trial and paid use the same book,” mounted only from `app.customers.tsx` when `liveHistoryLocked`. `uninstall-friction.test.ts` currently **requires** “24 months of orders” and **rejects** “~90 days.” Volume: a Saturday operator on Overview never sees the Customers banner. Operator 1, RomanRevenome, 7 Sep 2026: “On a real store I tested, the app showed $9,781 where the store had actually done $123,656.” Pending / authorized / COD / Klarna. Ingest already takes open or closed, not paid-only; the card does not say so. Operator 5, Adab01, 17 Sep 2026: “The dashboard looks healthy. … They’re just describing a slice of the business, and nothing on that screen indicates it.” Roughly a fifth of that wholesale book originated on the website. Operator 4, southdownsclay, revived 3 Aug 2026: “I am going into analytics > filtering by Finances and then have 36 different reports!” Almathani, 5 Apr 2026: “A simple year-to-date sales total for tax purposes should be a 10-second answer.” Volume 8: `CashTrustBanners` already says “Live today is capped at ~100 orders for a fast desk load” on Overview / Orders / Customers; Spend first Sales KPI does not; a closed-day truncate still says “Shopify shares about 60 days of orders on this install” while unpaid is 90 and paid order rows are 24 months.

**Branch:** `cursor/book-coverage-5bc6`.

**Files:**

- `app/app/lib/live-unpark.ts` — read `LIVE_UNPAID_INGEST_DAYS = 90`. Do not unpark. Do not change the 90.
- `app/app/lib/live-ingest-depth.ts`
- `app/app/lib/desk-history.ts` — `deskHistoryCaption`, `deskPeriodTillLabel`, `deskBookHonestyNotices`.
- `app/app/lib/overview-first-viewport.ts` — `OVERVIEW_COVERAGE_LINE`.
- `app/app/lib/product-labels.ts` — `shopifyBookMuted`, `bookSecondWithin30Def`.
- `app/app/lib/cash-trust-copy.ts` — `orderHistoryProgressMessage`.
- `app/app/components/UnlockFullHistoryBanner.tsx`
- `app/app/lib/uninstall-friction.test.ts` / `app/app/lib/desk-history.test.ts`
- `app/app/components/CashTrustBanners.tsx` — ~100-order today line; 60-day clause.
- `app/app/routes/app.spend.tsx` — `todaySalesTruncated` already loads and is passed into `SpendMixSection`, not the first Sales · Spend · Total ROAS glance.
- Overview year card — copyable YTD Shopify Total Sales. Fees / bank stay REFUSE.
- `site/pricing.html` is locked by `site-go-live.test.ts` to “24 months of order history.” Only if the public sentence still disagrees after the till is honest. Pages deploy is Marty. Not a site rebuild.

**Done when:**

- Unpaid till = 90 closed days of order rows. Paid till = up to 24 months of order rows. Day totals may go further when reports are on. Flat $39. One plan.
- Overview names that pending / authorized / COD sit in this Shopify Total Sales — the same way Shopify Total Sales does. Do not add a paid-only toggle (`$9,781` lie).
- Overview names that this is Shopify Total Sales for orders on this shop — not the company book. Do not ingest ERP / Amazon / phone orders Mcfly never received.
- Spend first fold discloses `todaySalesTruncated` / unavailable. Do not raise the live page cap. Do not promise a million-order pull.
- The truncated-closed-day banner does not say “about 60 days” while unpaid is 90 and paid order rows are 24 months.
- YTD Shopify Total Sales is named and copyable on the Overview year card. Shopify fees, payout date, and bank match stay REFUSE.

**Not this cook:** stub July on the Goals year board (rank 5), Goals MTD today-cap (rank 5), unparking Live, a history SKU, `read_all_orders` as shipped.

## Rank 5 — queued

**Sentence:** I left February blank and year-to-date now looks ahead because the blank was $0. I picked 2025 and the forecast is still next month from today. Goals month-close treats missing and quiet days as $0. Overview does not.

**Tab:** Goals year board / month-close / order-history forecast. Admin `/app/goals` (and `/demo/goals` once rank 1 mounted the stack).

**Verdict:** Merged **PASS**. Craft holes 4, 5, 6; volume 3, 4, 9; desk 4, 5, 10; compete 21.

**Why it is not a nit:** `parseGoalInput` empty string returns `0`; `upsertYearSalesGoals` writes that `0`; `sumPeriod` does `goal += goals[m - 1] ?? 0`. The table treats `salesGoal > 0` as “has a plan,” so February looks blank in the row and still shrinks the YTD denominator, while copy says “Missing months stay blank” / “Missing months are not $0.” Loader `year` comes from `parseGoalsYear`; `buildOrderHistoryForecast` gets that year’s `dailySales` and `todayYear: shopNow.y, todayMonth: shopNow.m` (always the shop’s current month); `nextCalendarMonth` is from today. Hunt 10 on the megaprompt. `buildMonthCloseForecast`: `avgDailySales = mtdSales / daysElapsed` then `projSales = mtdSales + avgDailySales * remainingDays`; `daysElapsed` is calendar (`calendarDaysElapsedInMonth`); `mtdSales` sums keys actually in `salesByDay` — missing days omitted from the sum, then divided by the full calendar elapsed count. `overviewTypicalDayFromBook` keeps `n > 0` then needs 8; Overview close is `so far + remaining days × typical day`; a certified `$0` Saturday is in so-far and **not** in the typical-day rail. `avgDailySpend = mtdSpend / daysElapsed` then `projSpend = mtdSpend + avgDailySpend * remainingDays` — a `$0`-spend Sunday still lowers the average and still gets spend projected onto remaining Sundays. `loadSalesByDayForGoalsRange`: if `periodExceedsFactWindow`, it skips the fail-closed incomplete error and returns the days it has; a month with eight days on file is a finished Actual. Volume’s merchant: “Goals says July did $48,200 against a $420,000 plan. That month is not on this book.” Forecast takeaway is `Projected {formatCurrency} vs {formatCurrency}` — period hero already uses `PRODUCT_NOUN.salesBasisShort`; the takeaway does not. `impliedSpendCeilingCaption("period_sales")` includes `Example: $80k sales at {n}×`. `GoalMonthRow` actual is till `salesByMonthFromDayMap`, not returning dollars. Compete 21: Goals forecasts **dollars**; it does not say the sales plan implies N identified buyers at this typical order.

**Branch:** `cursor/goals-year-clock-5bc6`.

**Files:**

- `app/app/routes/app.goals.tsx` — `parseGoalInput` ~111–118; loader ~203–350; `currentGoalRow` ~335–338; forecast call ~340–345; “Missing months…” ~911–913; `formatSalesOrDash`; forecast takeaway ~1004–1031; `SalesLoadError`.
- `app/app/lib/sales-goals.server.ts` — `upsertYearSalesGoals` ~444–466; `buildMonthCloseForecast` ~505–507; `calendarDaysElapsedInMonth` ~320–344; `salesByMonthFromDayMap` ~227–233; `sumPeriod` ~794–807; `loadSalesByDayForGoalsRange`; `GoalMonthRow`.
- `app/app/lib/order-history-forecast.ts` — `nextCalendarMonth` ~266; `dailySales.filter((n) => n > 0)` ~267; `ORDER_HISTORY_FORECAST_FORMULA`.
- `app/app/lib/overview-mix-forecast.ts` — read the Overview close. Do not recook `#157`. Do not paint Goals’ mean as Shopify’s forecast.
- `app/app/lib/implied-spend-ceiling.ts` — `$80k` example.
- `app/app/components/OrderHistoryForecast.tsx` / `app/app/components/OrderHistoryGoalsBoard.tsx`
- `app/app/lib/sales-goals.ts` — compete 21 arithmetic.
- `app/app/routes/demo.goals.tsx` — same board after rank 1.
- `app/app/lib/sales-goals.test.ts` — months with no days stay absent (not `$0`). Lock a **partial** month as “not the month.”
- Goals MTD / period hero: take `todaySalesTruncated` / `todaySalesUnavailable` / `orderBackfillProgress` (volume 8 on this tab).

**Done when:**

- A cleared month is null / not on file in MTD/QTD/YTD sums. Empty input must not save a certified `$0` plan unless the merchant typed 0.
- When the year picker is not the live year, do not print a next-month close from today × that year’s days. Missing last year stays not on file, never `$0`.
- Month-close pace uses days with sales (same typical-day idea as Overview), or withholds while the book is incomplete. Quiet certified `$0` sits in so-far, not in the rail. Never a remaining-day count through missing days. Name Shopify Total Sales.
- Next-month forecast counts selling days (or includes stored `$0` days in the median) and says so. Missing last year stays —. Never a fake `$0` day invented where the book has no row.
- Remaining spend is paced on days that already have spend, or `projSpend` / `projMer` stop printing.
- Stub months inside a 90-day unpaid slice are not on file / still filling, same as a missing month. Do not paint the stub as `$0` and do not paint it as the month. Do not lengthen the crawl.
- Projected / Actual / Prior name Shopify Total Sales. Drop or scale the `$80k` ceiling example. Empty spend stays —.
- Month row can show identified returning `$` for that calendar month from `OrderFact` (24-month book), or —. Not a five-year day-level returning split (ShopifyQL HOLD).
- Implied identified buyers = sales goal ÷ typical order when both exist and the 8-order floor seals; else —. Empty spend stays off that sentence. No pixel CAC.
- Goals MTD discloses a truncated today. No million-order crawl.

**Not this cook:** SAMPLE `$800k` / 35% (rank 1), 720px stack (rank 2), refund processing date, five-year returning `$` from `read_reports`.

**Wait:** rank 1 (`app.goals.tsx`, `sales-goals.server.ts`, `demo.goals.tsx`). Rank 2 already stacked the table; adding a returning-`$` column keeps that stack.

## Rank 6 of this queue — queued

**Sentence:** I tapped Depth / Add spend / the weekday fold and the lane stayed shut.

**Tab:** Customers Depth, Spend `?panel=spend-add`, Overview weekday fold. One component.

**Verdict:** **PASS.** `#152` still-PASS, now unblocked (old rank 1 Overview CSS has landed; old rank 6 does not own `DeskLane.tsx`).

**Why it is not a nit:** `open` is `useState(fold ? defaultOpen : true)` and never follows a later `defaultOpen` (`DeskLane.tsx:29`). Depth, Add spend, and Overview’s weekday fold all stay shut after the tap. `HashDetails` on Spend **does** follow a later `defaultOpen` and hash — the add form behind `DeskLane` does not. Opening Depth is not the morning “who to save” sentence. Whale rank 8 lives in that Depth pack; a shut fold hides it.

**Branch:** `cursor/desk-lane-open-5bc6`.

**Files:** `app/app/components/DeskLane.tsx`. Call sites: Depth, `app/app/routes/app.spend.tsx` add form, Overview weekday fold on `app/app/routes/app._index.tsx`. One cook, one component, not three agents.

**Done when:** A later `defaultOpen` / `?panel=spend-add` / chip tap opens the fold. Public `/demo` and Admin `/app` match.

**Not this cook:** whale ticket columns (rank 8), Spend pair copy (rank 3).

## Rank 7 — queued

**Sentence:** How much of this month came from buyers who had gone quiet — not everyone who ever bought before? I can copy days to a second order. I cannot copy the first-time dollars.

**Tab:** Customers → Growth (open lane). Not old rank 6’s step tickets. Not compete row 2 (buyer age).

**Verdict:** Merged **PASS**. Desk 9 + compete 11, volume 10, volume 6 (reach-now copy only), `#152` compete row 5, compete 16.

**Why it is not a nit:** Returning mix is “any earlier stored order.” RFM hibernating is last order **more than** 90 days ago, so they have not come back; dollars on that card are lifetime, not this month. Win-back play is a **count** of one-order buyers past typical + 15 (`buildReturningMixPlays` id `"winback"`). Putler (features guide updated 17 Mar 2026) asks: “How many customers haven’t ordered in 60+ days who used to buy monthly?” Nobody sums **this month’s** `amount` for identified buyers whose previous `orderedAt` was ≥ 90 days before this order. `GrowthScoreboard` already paints `Sales from first-time buyers` and `2nd {pct} · 3rd+ {pct}`; Slack card is days-to-second only. Volume’s merchant cannot copy “the first-time $187,000 or ‘2nd 18% · 3rd+ 11%.’” `buildGrowthLeadPeeks` already paints Reach now; `CopyMorningSentence` wraps the typical-wait sentence. `#152` compete row 5 (next wait after they already came back) is still uncooked on this same scoreboard. Compete 16: Repeat Customer Insights sells Average Lifetime + Average Latency; Mcfly paints typical days to second, not first→last span.

**Branch:** `cursor/quiet-back-dollars-5bc6`.

**Files:**

- `app/app/lib/customers-analytics.ts` — `buildReturningMixPlays`, repurchase clock already being extended by **old** rank 6. **This rank starts only after that merge.**
- `app/app/components/GrowthScoreboard.tsx` / `app/app/components/CustomersGrowthSection.tsx` / `app/app/components/GrowthTt2Board.tsx`
- `app/app/lib/growth-first-viewport.ts`
- `app/app/lib/shareable-insights.ts` / `app/app/components/ShareableInsightCards.tsx`
- `app/app/lib/customers-rfm.ts` — read `segmentFor` / hibernating so this job is not that snapshot.

**Done when:**

- This month’s Shopify Total Sales from identified buyers whose previous order was already past that shop’s wait (gap vs own median wait when they have 3+ orders; else vs typical days-to-second). Seal at 8 identified reactivated buyers. Guests out. Thin side —.
- Copy first-time Shopify Total Sales for the picked period when `newSales > 0`, plus 2nd vs 3rd when both shares seal, plus reach-now count. Never copy `$0`. Never copy a pending as finished.
- Compete row 5: next wait after they already came back, on this board, 8-buyer floor, guests out, — when thin. Not old rank 6’s 1st/2nd/3rd ticket column.
- Median days first→last among buyers with 2+ orders, and median inter-order gap, sealed at 8 such buyers. History-limited line stays honest, not a fake short life.

**Not this cook:** old rank 6 ticket/wait/reach, whale ticket in the copy line (rank 8), compete row 2, Admin door, name/email, Flow / Slack product.

## Rank 8 — queued

**Sentence:** Is Whale 1 a VIP who keeps coming back, or one huge first order? The watchlist stops at Whale 8 and does not say ticket.

**Tab:** Customers whale watchlist (Depth pack) + LTV whale recency. Admin door stays HOLD.

**Verdict:** Merged **PASS**. Desk 3, volume 7, compete 12 (RFM flow on the same `customers-rfm.ts` writer).

**Why it is not a nit:** `BuyerRollup` already has `total`, `orders`, `firstAmount`, `last`. `repeatRevenueOf` is `total - firstAmount`. `WhaleWatchRow` stores lifetime, repeat, orders, daysSince — not typical ticket (`lifetime / orders`), not first ticket, not later ticket. `WATCHLIST_MAX = 8` is both the floor to **show** a list and the **ceiling**. Volume: “We have 80 people with five or more orders.” `WhaleRecency` already has `coldShare`; KPIs omit it; Slack uses count + share + median lifetime. At 430px the row is still four columns; a `$148,392 · 42 orders` cell is the six-figure nowrap on this board. Repeat Customer Insights Customer Grids: “Every month, a snapshot of your current Customer Grids is taken and saved… see how your customers are flowing between the different segments.” `buildCustomerRfm` scores **one** `windowEnd`. Four labels. No prior-month score, no flow. Expanding to 11 names without flow is a nit; flow of last month’s Champions who are At risk now is the job. Export to Klaviyo / tags is REFUSE.

**Branch:** `cursor/whale-ticket-5bc6`.

**Files:**

- `app/app/lib/customers-rfm.ts` — `WATCHLIST_MAX`, `buildWatchlist`, `firstAmount`, score at as-of T and T−1 month.
- `app/app/components/CustomerWhaleWatch.tsx`
- `app/app/lib/ltv-depth.ts` — `WhaleRecency.coldShare`; `WHALE_MIN_ORDERS = 5` lives in `customers-analytics.ts`.
- `app/app/components/LtvWhaleRecency.tsx` / `app/app/components/CustomerRfmBoard.tsx` / `app/app/lib/desk-customers-page.server.ts`
- `app/app/lib/shareable-insights.ts` — `whaleSlackInsight`
- `app/app/styles/mcfly-desk.css` — whale grid only, after rank 2.

**Done when:** Typical ticket (lifetime ÷ orders; blank if orders < 1) is on the row. “Whale 8 of N” or “N more with 5+ orders.” Cold share in the existing Slack line when it is > 0. Seal under the 8-buyer floor. Guests out. No PII. No Admin door. RFM board: of last month’s Champions, how many are At risk or Hibernating now, and what lifetime dollars moved. Headcount + lifetime dollars. Opaque keys stay off the desk.

**Not this cook:** Whale → Admin door (HOLD, Marty). Name, email, city. Period concentration of **this month** (rank 9). Rank 7’s reactivation `$`.

**Wait:** rank 6 of this queue (Depth opens). Rank 2 (CSS file). Rank 7 if `customers-analytics.ts` is still that writer.

## Rank 9 — queued

**Sentence:** Of this month’s Shopify Total Sales, how much was a first order, a second, a third, or a fourth-or-later — not how old the buyer is. Show this month’s first-time ticket and returning ticket, not one blended AOV.

**Tab:** Orders (intelligence + first viewport).

**Verdict:** Merged **PASS**. Compete 9, 10, 15, 17, 19, 20; desk 11; operator 2, 3, 6.

**Why it is not a nit:** Lifetimely (updated 3 Apr 2026): “Repeat purchasing tells you how far they go.” They sell “Customers who purchased X times” as `$` or `#`. Floor row 1 / **old rank 6** is the career ladder (ticket, reach, wait for the shop). Floor row 2 is buyer age. A year-old customer placing a second order is old on row 2 and “2nd” here. `aggregateOrderRows` splits new vs returning orders and a new sales share; returning is one bucket. `OrdersIntelAgg` has `newOrders`, `returningOrders`, and `newSales`; it does not keep returning sales or the two tickets. Operator 2, richjeff, 25 Jul 2023: “I’ve just noticed that my AOV looks wrong - if I divide the ‘total sales’ by ‘total orders’ I get an AOV much higher than the dashboard is showing on my store (like 20%+ higher)!” bemo2: Total sales includes taxes and shipping; Shopify AOV uses gross minus tax and shipping. `OrderFact.amount` is current Total Sales; `shippingTaxFees` is already computed. Operator 3, Ohlala-equestrian, 24 Jun 2026, Plus: still CSV for average item price = Net ÷ quantity; mean items per order is already on the book; dollars per unit is not asked. Operator 6, joshroban, 30 Sep 2025: “sales quantities are COMPLETELY off now because I can no longer cancel these types of orders and remove those quantities from the units sold report.” `$0` reships; ingest already drops `test:true`; front-end tests paid with a real card remain ordinary orders. Compete 15: whale watch is lifetime share; Putler Home sells top 20% by **this** revenue. Compete 17: weekday/hour chart is one blended mix; Shopify groups new vs returning by hour of day / day of week. Desk 11: weekly `discountDepth` is inside the current window; there is no same-month-last-year discount-dollar line; “A 4% discount share last September vs 11% this September is tens of thousands of dollars.” Compete 19: v414 weekly `returnsClimbing` is not “this September vs last September we kept 94% vs 97%” (placed-day gross vs net; processing-day clock stays HOLD). Compete 20: blended `discountDepth` is not first vs returning this month; floor row 4 is later codes **by starter class**.

**Branch:** `cursor/orders-step-mix-5bc6`.

**Files:**

- `app/app/lib/orders-intelligence.ts` — `aggregateOrderRows`, `buildOrdersIntelKpis`, `assembleOrdersIntelligence`, `buildOrdersWeeklyRows`, `ordersReturnDrag`.
- `app/app/components/OrdersIntelligence.tsx` / `app/app/components/OrdersFirstViewport.tsx` / `app/app/components/OrdersTimingChart.tsx`
- `app/app/lib/orders-scoreboard.ts` / `app/app/lib/shopify-depth-stats.ts` — weekday/hour already have `customerKey` + `orderedAt`.
- `app/app/lib/desk-sales-page.server.ts` — loader already sends `lifetimeOrders`.
- `app/app/routes/app.orders.tsx` / `app/app/routes/demo.orders.tsx` — mount the same stack.

**Done when:**

- Four sealed bars (1st / 2nd / 3rd / 4th+) for the picked period, Shopify Total Sales dollars. Guests out. Unknown lifetime as its own bar or —, never stuffed into 1st. Under 8 identified buyers in a step stays —. Not old rank 6’s wait column.
- First-time ticket and returning ticket, both labeled Shopify Total Sales per order. Shipping + tax dollars sit next to typical so a ~20% gap is a named slice. Do not paint Mcfly typical as Shopify’s AOV. VAT-out stays REFUSE.
- Identified buyers who made 50% of period Shopify Total Sales, and top-decile share of the period. Guests out. Under 8 identified buyers: —.
- First-time vs already-bought hour / weekday shares or a stacked bar. Same 5-day / hour gates. Guests out of the returning series. Unknown lifetime not painted as new.
- Same-month-last-year discount dollars (and depth), codes still names, automatic titles HOLD, missing last year —.
- Placed-day kept share (net vs gross) this month vs last year. Any missing gross → —, never a partial 0%. Never “Shopify Total Sales clock.”
- This month, first checkouts vs returning checkouts: share of gross taken off. Missing discount field → —.
- Period dollars per unit = Shopify Total Sales ÷ units on file (or Net ÷ units when `netSales` is on the day). Dash when `unitCount` is not crawled. Not a title. Not a ShopifyQL box.
- Period count of `$0`-amount orders and the units on those rows. Do not pretend to know they are “internal.” Order tags stay HOLD.

**Not this cook:** old rank 6, compete row 2, Other source **strings** (rank 10), refund `processed_at`, Admin exchange “true gross” (operator 7 HOLD).

**Wait:** old rank 4 already landed (v414), so `orders-intelligence.ts` is free after old rank 6’s gate. Rank 10 waits for this rank (`app.orders.tsx`).

## Rank 10 — queued

**Sentence:** How much of this month’s Shopify Total Sales is guest checkout, not a percent of orders — and why does Live look like I have none? Are the returns coming from the online store or from POS?

**Tab:** Orders source bar + Customers guest tile.

**Verdict:** Merged **PASS**. Desk 1, desk 12, `#152` Other source names.

**Why it is not a nit:** The painted tile is **order share**: `guestShare = guestOrders / orderCount`. Live day facts write `guestOrders: 0` in `salesResultFromDayTotal`. There is no guest **sales** share. Summing `amount` where `customerKey === "guest"` is one pass over rows the Orders loader already has. Desk: a headcount percent (or a Live zero) sends the account-creation meeting after the wrong dollar. v414 weekly returns use `grossAmount - amount` for the whole slice; `buildOrdersSourceBar` gives Other no typical order and does not give any source a returns drag. POS returns and online sizing returns are different owners. `#152`: `classifyOrderSource` keeps web, POS, and Shop; everything else, including an empty name, is `other`. SallyG unpaid drafts remain this cook, not a new find. Operator Reddit 2024 Online / POS gross + returns drag is already on stored days / `sourceName` as Total Sales; processing fee stays REFUSE; POS drawer stays HOLD.

**Branch:** `cursor/guest-source-returns-5bc6`.

**Files:**

- `app/app/lib/shopify-native-stats.ts` — `guestShare`.
- `app/app/lib/shopify-depth-stats.ts` — `guestAov`, `sourceSalesShare`.
- `app/app/lib/sales-facts.server.ts` — `guestOrders: 0` on Live day facts (do not paint that zero as guest dollars).
- `app/app/lib/orders-scoreboard.ts` — `buildOrdersSourceBar`, `classifyOrderSource`.
- `app/app/components/ShopifyBookSection.tsx` / `app/app/components/CustomersScoreboard.tsx`
- `app/app/lib/desk-sales-page.server.ts`

**Done when:** Guest **dollars** this month on the open lane, from `OrderFact` rows. Live does not name a stored zero as “none.” Returns drag by Online / POS / Shop / Other on the source bar; missing gross stays unknown, never a partial `$0`. Other bucket names source names already on the row (draft invoices, subscription renewals) and gets a typical order when the floor seals. Do not recook source LTV. Do not claim POS drawer tape. No refund processing date.

**Not this cook:** rank 9’s order-number mix, subscription-checkout bit (HOLD), ERP ingest (REFUSE).

**Wait:** rank 9 (`app.orders.tsx` / `demo.orders.tsx`).

## Rank 11 — queued

**Sentence:** This month’s sales by how old the buyer is — first bought this quarter vs a year — and new dollars vs returning dollars versus the same quarter last year.

**Tab:** Overview, with a Growth peek for installed-base retention (compete 18).

**Verdict:** Merged **PASS**. `#152` compete rows 2 and 3, plus compete 18.

**Why it is not a nit:** These were named still-PASS in `#152` and never cooked. Row 2 is lifetime age, not rank 7’s recency-before-this-order, not rank 9’s order-number mix. Row 3 is new `$` vs returning `$` vs the same **quarter** last year — not the Goals month row (rank 5). Compete 18: of last year’s identified buyers, what share ordered again this year — installed base, not new-vs-returning **dollars** this quarter. Unpaid 90-day slice stays — / not on file, never 0%. Paid 24-month book can seal. 8-buyer floor on last year’s base.

**Branch:** `cursor/overview-buyer-age-5bc6`.

**Files:** `app/app/lib/overview-yoy.ts` / `app/app/components/OverviewYoyCards.tsx` / `app/app/lib/customers-analytics.ts` / Growth peek. Do not recook same-clock (`OverviewSalesChart.tsx`).

**Done when:** Rows 2 and 3 paint, 8-buyer floor, guests out, thin side —. Annual base retention as headcount + their dollars this year, or — when the book is a 90-day slice. Do not paint example-store figures.

**Not this cook:** same-clock hour compare (v415), rank 5 Goals month returning `$`.

**Wait:** rank 4 (Overview coverage line). Rank 7 (`customers-analytics.ts`).

## Rank 12 — queued

**Sentence:** Which starter month — and which launch week — gave the most back by day 90, and in month four how often did they order, not how big the ticket was.

**Tab:** Customers → LTV.

**Verdict:** Merged **PASS**. `#152` compete rows 4, 6, 7, 8 plus compete 13 and 14.

**Why it is not a nit:** Still-PASS rows 4/6/7/8 were never started. Peel weekly cohorts: “find out what week brought in your most valuable customers or see if it was the weeks leading up to a promotional time of year.” `ltv-depth.ts` groups only `cohortMonth`. Floor row 7 is ticket by month of life; Peel “Orders per Customer” / Lifetimely “Cohort Transactions %” is frequency, not ticket. High retention + low repeat is the $5M diagnosis: they came back once and stopped. Seal a week at 8 buyers who have lived 90 days. Young week is —. Not SKU, not geo, not UTM.

**Branch:** `cursor/ltv-starter-week-5bc6`.

**Files:** `app/app/lib/ltv-depth.ts` (`rollUpCustomers`, `monthKey`, `CustomerDepth.activeOffsets`); `app/app/lib/ltv-flagship.ts`; `app/app/components/CustomersLtvSection.tsx`; `app/app/components/LtvBuildCurves.tsx`.

**Done when:** Starter **month** jobs (later orders still on a discount by class; this year vs last year at day 90; ticket by month of life; which starter month gave the most back by day 90) plus ISO week of first identified order (worth and come-back at day 90) plus cumulative orders per buyer at elapsed offsets. Un-elapsed stays —. 8-buyer floor. Guests out. No industry norm. SAMPLE must not invent a catalog.

**Not this cook:** product titles, UTM / ads channel, old rank 6 wait column.

**Wait:** rank 8 (`CustomersLtvSection.tsx` / `ltv-depth.ts`).

## HOLD

Do not cook these until the fact is on the order, or until Marty takes the call named in the note.

- **Refund processing date.** Old `#152` / Wing-roro family. New operators: WUC444, LukeRotherfield (`processed_at`), Amin_Elmlegy (cancel hits today). Rank 9’s placed-day kept share does not close this.
- **Admin exchange missing refund line.** Skengdo, 4 Jan 2025: “removing the original product should offset the sale by -$299.99 rather than $0.” Triple Whale inherits. Do not cook a “true gross” Shopify’s Admin exchange does not store.
- **Country.** Compete floor row 9. TS1122 shipping-country filter. Not an address, not inferred from currency.
- **Subscription checkout bit.** Not MRR. KOAN / Ronan.Cian stay HOLD. **REFUSE** Recharge / Skio.
- **Gift-card product flag.** cclumpner / LeonAndrew. **REFUSE** outstanding liability / adding gift-card sales into Total Sales / COGS.
- **Automatic discount titles.** Dollars by code are on the tip (v414). The title is not.
- **Product title / SKU.** Live first-product empty stays. u/Substantial-Cycle527 returns-by-product stays HOLD.
- **Order rows past 24 months.** Day totals already go five years. 2023 **starters** stay HOLD.
- **Product subtotal on the buyer dollar.** Period product-only exists on Orders. Per-buyer still includes shipping and tax. Shopify’s AOV formula stays unlabeled, not rebuilt (rank 9 names the slice).
- **Whale → Admin door.** `Whale ${i + 1}`. Marty. Rank 8 does not use the customer id on the desk.
- **Million-order crawl as shipped.** MagnumFonseca. Coverage **lines** are rank 4. `ORDER_FACT_MAX_DAYS_PER_RUN` and the ~100-order today cap stay.
- **POS drawer tape / per-location timezone.** FERALGR. `sourceName` is web/pos/shop, not location. One `Shop.ianaTimezone`.
- **VAT-out, Stripe/PayPal time zones, payout fees, bank match.** Kove Footwear / VocaSpark / southdownsclay fees / LB2022. Mcfly keeps Shopify Total Sales and says so.
- **Predicted spend tier / Shopify’s model.** Copying their scores is not on the order. Person-level predicted-spend list is refuse.
- **B2B company vs D2C, reversed quantity / return reason, bundle as a first-order class.** Missing facts.
- **ShopifyQL / `read_reports`.** Live PARKED. Five-year day-level returning `$` on Goals stays HOLD.

## REFUSE

Do not put these on a tab, a chip, or a listing line.

- COGS, P&L, gross profit, contribution, “Kept after margin” as a number. Rank 1 **deletes** the SAMPLE/demo sentences. Do not replace them with an invented cost.
- Pixels, MTA, UTM path credit, “true ROAS,” ad-account CAC, NCPA, ncROAS. Rank 3’s Online-labeled ratio is a till split, not path credit.
- Sessions, visitors, conversion, checkout funnel (Sarah568473).
- Amazon, Etsy, eBay, PayPal/Stripe as a second ledger.
- Recharge, Skio, Bold, Smartrr, Stay.ai MRR and churn.
- Slack or email product, Flow, Zapier, a sixth Reports tab. Copy the line (ranks 3, 4, 7).
- Inventory, gift-card liability, VAT-stripped revenue.
- Person exports, name, email, city, customer tags / order tags as stored strings, RFM customer list to Klaviyo.
- Industry benchmarks, and any example-store figure from the compete notes.
- Invented Mcfly stars, installs, or metrics. Lifetimely’s store-count / GMV claims are theirs.
- A Free plan, or a price that rises with orders or GMV.
- Post-purchase surveys, a profit agent, Snowflake, custom-report credits, ERP ingest.
- A paid-only toggle that recreates RomanRevenome’s `$9,781` lie.

## Kill list

- Do not report the niche is owned. Ranks 2–12 of this queue are queued. Still-PASS from `#152` is inside those ranks, not an appendix.
- Do not restart ranks 1–6 of `#152`. Do not list third-order ticket/wait as a find. Do not recook morning habit, period total, catalog empty, new-buyer truth, the Orders month board, or same-clock.
- Do not open four craft agents on `mcfly-desk.css`, `app.goals.tsx`, `app.spend.tsx`, `customers-analytics.ts`, `orders-intelligence.ts`, or `DeskLane.tsx`. Rank 1 of this queue is one implementer. Do not start ranks 2+.
- Do not propose COGS, pixels, sessions, Amazon, Recharge, Slack product, a sixth tab, ShopifyQL, or Live unpark as the enterprise leap.
- Do not Fly this plan. Do not Fly a nit. A stylesheet tweak that leaves SAMPLE covering break-even at 35%, or leaves explorer 0×, is not PASS and does not deploy.
- Do not start this rank 1 while old rank 6 is the named next ship.

## How to run rank 1 (when the gate opens)

1. Wait for Reviewer PASS + merge + Fly of `cursor/third-order-steps-5bc6`, **or** a Marty skip.
2. Stamp the scoreboard: next significant ship is **this** rank 1 sentence. One Fly after **this** Reviewer PASS.
3. Cut `cursor/goals-honesty-5bc6` from the then-current `origin/cursor/spend-trust-recurring`.
4. One implementer. One Reviewer. Do not start rank 2.

A Fly requires a new merchant sentence. Copy nits, SoT stamps, and re-audits of a hole already on the tip do not deploy.
