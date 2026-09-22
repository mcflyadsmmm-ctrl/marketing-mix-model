# Enterprise third-pass cook queue — 2026-09-22

> **For agentic workers:** Whale ticket **shipped** Fly **v424** (`#177` merge `3346136`). **Orders step mix** (this queue’s rank 9 / next-pass `#165` rank 9, `cursor/orders-step-mix-5bc6`) is the **only craft in flight**. Do not restart it. Do not put a second cook beside it. After that Reviewer PASS + Fly **v425**, stamp **this queue’s rank 1 (buyer-life honesty)** — not old rank 10. Rank 1 then is the only cook. One implementer. One Reviewer. One Fly only after PASS. Do not dispatch a craft agent per rank. Do not Fly this plan. **Do not list whale as a find.**

**Goal:** After Orders mix + Fly **v425**, a $5M–$10M Shopify operator keeps $39/store/month because unidentified lifetime is not stuffed into first-time `$`, till LTV does not drop the regulars whose Shopify life is longer than this book, Goals does not paint 0% / “ahead” from a null, trial copy does not sell a year on a 90-day unpaid book, and the next order-history question is still on a painted tab.

**Architecture:** Collapse the five third-pass notes plus remaining next-pass ranks 9–12 into one ranked list. When two pains share a surface, they are one cook. Rank 1 of this queue stops the buyer-life lie on Customers mix / till LTV / Cash CAC. Later ranks wait. Old ranks 9–12 of `#165` stay on this list (kept or absorbed into a bigger cook on the same writer).

**Tech stack:** The existing Remix desk (`app/`). Painted tabs only. No new stored field on any rank in this queue. No new tab. No ShopifyQL. Live stays PARKED. Do not change `LIVE_UNPAID_INGEST_DAYS = 90`.

**Base this plan is cut from:** `origin/cursor/spend-trust-recurring` at `e71ea55` (`docs: stamp Fly v424 and name Orders step mix`). Fly **v424** / merge `3346136` (`#177` whale ticket) is on the tip. Image `deployment-01M34QNHWPNPZF21MYB5SQH576`. Live **PARKED**. Quiet-back v423 and whale v424 are not listed as missing. The five notes scored `d2017c1`; none of their PASS rows was whale.

**Sources, and only these sources:**

| Note | Branch | Commit | File | PR |
| --- | --- | --- | --- | --- |
| Megaprompt | `origin/cursor/third-pass-megaprompt-5bc6` | `ec850f6` | `docs/ops/MEGAPROMPT_ENTERPRISE_THIRD.md` | #173 |
| Floor queue | `origin/cursor/next-cook-queue-5bc6` | `52cc358` | `docs/plans/2026-09-22-enterprise-next-queue.md` | #165 |
| Desk truth | `origin/cursor/third-desk-truth-5bc6` | `8c9c66e` | `docs/ops/research/2026-09-22-THIRD_DESK_TRUTH.md` | #176 |
| Craft holes | `origin/cursor/third-craft-holes-5bc6` | `91557e7` | `docs/ops/research/2026-09-22-THIRD_CRAFT_HOLES.md` | #179 |
| Compete | `origin/cursor/third-compete-5bc6` | `4d79848` | `docs/ops/research/2026-09-22-THIRD_COMPETE.md` | #174 |
| Operator | `origin/cursor/third-operator-5bc6` | `d5d13c7` | `docs/ops/research/2026-09-22-THIRD_OPERATOR.md` | #175 |
| Volume | `origin/cursor/third-volume-desk-5bc6` | `2a63033` | `docs/ops/research/2026-09-22-THIRD_VOLUME.md` | #178 |

Quotes below are copied from those notes. Figures below are copied from those notes. Nothing in quotation marks was written for this plan.

## Named next ship after Orders mix (SCOREBOARD stamp)

Orders mix is already the named current craft (`cursor/orders-step-mix-5bc6`). After that Reviewer PASS + merge + Fly **v425**, stamp the scoreboard with **this queue’s rank 1** only:

**Buyer-life honesty.** “Customers mix stuffed unidentified lifetime into first-time `$`. Shopify’s order count is today’s, so last January looks returning. Till LTV skipped the regulars whose Shopify life is longer than this book. The mix chart is still UTC.”

Branch `cursor/buyer-life-honesty-5bc6`. One implementer. One Reviewer. One Fly only after PASS. Do not fly this plan. Do not fly a SoT stamp. Do not start buyer-life while Orders mix is ungraded.

## Global constraints

- Painted IA: Overview, Orders, Customers, Spend, Goals. Growth and LTV are Customers chips, never a sixth tab.
- One plan, $39/store/month, after a 7-day trial. No Free plan. No GMV ladder.
- Total ROAS = Shopify Total Sales ÷ entered spend, or —. Never 0×. Never a fake $0.
- Live stays PARKED. No Partner Submit. No `read_all_orders` as shipped. ShopifyQL / `read_reports` stays HOLD.
- Product titles stay HOLD. SAMPLE must not invent a catalog Live cannot store.
- Country, subscription-checkout bit, refund processing date, gift-card product flag, automatic discount titles stay HOLD.
- Guests stay out of returning. A missing last year stays not on file, never $0. A window the notes seal only at 8 buyers stays — under that floor.
- `WELCOME10` stays a name, never 10%.
- Do not recook v408–v424, `#172` quiet-back, or `#177` whale. Do not recook Orders mix once it has merged.
- Do not execute `docs/plans/2026-09-22-shopifyql-wait-queue.md` or `#137` / `#145`. Do not unpark Live. Do not change the 90.
- One writer per surface. Do not open four cooks on `mcfly-desk.css`, `customers-analytics.ts`, `app.goals.tsx`, `app.spend.tsx`, `orders-intelligence.ts`, or `CustomersLtvSection.tsx`.
- Nits do not deploy. Do not Fly this plan.

## What collapsed

These looked like many cooks. They are fourteen surfaces. Nits did not make the list. Old next-pass ranks 9–12 are in the table so the floor sentence is not lost.

| Candidate | Surface | Where it went |
| --- | --- | --- |
| Craft 1 unknown lifetime stuffed into first-time `$` + Cash CAC; craft 2 mix UTC; operator 8 `numberOfOrders` is today; desk 7 till LTV skips `lifetimeOrders > stored` | `customers-analytics.ts` / `order-facts.server.ts` / mix chart | **Rank 1**, one buyer-life cook. Named next ship after whale. |
| Craft 5 `/demo/goals` not the year table; craft 7 0% bar on null actual; craft 13 YTD % look-ahead; craft 14 typed `$0` as —; desk 9 / volume 8 copy Goal vs Actual | `app.goals.tsx` / `sales-goals.server.ts` / `demo.goals.tsx` | **Rank 2**, one Goals leftover cook |
| Desk 10 / craft 6 / volume 6 Settings “whole desk is on”; volume 4 explorer This year / 1 year / All; volume 5 CPA YTD + Last 28 through today | Settings plan block + Spend explorer chips + CPA ranges | **Rank 3**, one unpaid-year leftover. v420 named Overview; these boards still sell a year. |
| Craft 8 / volume 12 truncated today on Orders typical + Customers returning `$`; volume 13 Customers first fold never says last year is missing; volume 14 copy returning vs new | Orders / Customers first folds | **Rank 4**. CPA truncated today stays rank 3 (CPA files). |
| Craft 3 import `todayKey` host calendar; volume 11 coverage host-local; craft 11 SAMPLE import 35% BE; craft 12 Online ROAS all-spend denominator; desk 13 weekday Total ROAS; operator 12 Spend compare-to `$` | `app.spend.import.tsx` / coverage / explorer / Online line | **Rank 5**, one Spend leftover. Payback day-0 waits for rank 8 (same `cash-payback.ts`). |
| Craft 4 Coverage hash opens Add-spend + nested `<details>`; Mix close still opens weekday (second wrap class) | Spend `DeskLane` + Overview mix wrap | **Rank 6** |
| Volume 1 LTV 30/90/365 still three-up at 36rem; volume 2 LTV triangle nowrap; volume 3 Orders weekly ledger eight columns | `mcfly-desk.css` | **Rank 7**, one phone leftover. Whale 430px grid is `#177` — do not recook it. |
| Volume 7 two first-90 numbers; craft 9 `cohortLtvCurves` in Depth; craft 10 SAMPLE estimate always open; craft 15 payback interpolates day-0 `$0`; volume 10 copy 30/90/first year | LTV chip + `till-ltv.server.ts` + `cash-payback.ts` | **Rank 8**, one first-90 honesty cook. Wait for whale (`CustomersLtvSection.tsx`). |
| `#165` rank 9 Orders 1st/2nd/3rd/4th+ `$`, tickets, tax/shipping, concentration, new vs returning hour, discount `$` vs last September, kept share, first vs returning discount depth, dollars per unit, `$0` reship count; compete 13 named-code YoY on the same `buildOrdersCodeMoney` | `orders-intelligence.ts` | **Rank 9**, old rank 9 kept and deepened on the same writer |
| Operator 1 paid typical; desk 4 / compete 15 one-item vs 2+ `$`; desk 5 discounted till share; operator 5 money-off named; operator 7 gross · discount · Total Sales; operator 2 same-day extra-order `$`; compete 6 typical by month vs last year; compete 7 7×24 grid; operator 9 POS hour `$`; operator 10 weekday `$`; desk 8 / volume 9 copy Orders; operator 12 Orders compare-to `$` | Orders first fold + timing + ledger numbers | **Rank 10**. Waits for rank 9 (`app.orders.tsx`). Ledger **wrap** already rank 7. |
| `#165` rank 10 guest `$` + Other names + POS vs online returns; desk 3 / compete 14 new vs returning `$` by source; desk 14 overlap people; operator 4 POS code `$`; operator 6 POS-first → this-period online `$` | Source bar / guest tile / `classifyOrderSource` | **Rank 11**, old rank 10 absorbed into a bigger omnichannel cook on the same writer |
| `#165` rank 11 compete rows 2–3 + annual installed-base; desk 1 MoM; desk 11 same-clock returning `$`; desk 12 typical week; operator 3 POS `$` vs online `$`; operator 11 web-only `$`; compete 5 new-buyer headcount; compete 8 same-clock hours; compete 11 7-day returning/new **order** ratio | Overview first fold + YoY + clock sentence | **Rank 12**, old rank 11 absorbed into a bigger Overview cook. Annual retention still the Growth peek. |
| `#165` rank 12 compete 4/6/7/8 + launch-week class + orders per month of life; compete 4 second-order offset by starter month | LTV chip / `ltv-depth.ts` | **Rank 13**, old rank 12 kept. Curves-on-lane already rank 8. |
| Compete 1–3, 9, 10, 12 wait / repurchase clocks; desk 2 last-month actives who came back; desk 6 wait by first-order source; compete 16 lifetime A/B/C | Customers → Growth | **Rank 14**. Waits for rank 1 then rank 12 (`customers-analytics.ts`). |

Not collapsed, on purpose:

- Rank 3 unpaid-year leftover vs rank 5 Spend leftover **would** have been one Spend tab. Rank 3 is the coverage-class leftover (chips that sell a year). Rank 5 is the clock / Online-denominator / SAMPLE-BE leftover. Same `spend-explorer.ts` so rank 5 waits.
- Rank 8 first-90 honesty vs rank 13 launch-week class share `CustomersLtvSection.tsx`. The lie ships first. Rank 13 waits.
- Rank 9 step mix vs rank 10 first-fold leftover share `app.orders.tsx`. The already-ranked sentence ships first. Rank 10 waits.
- Copy controls ride the cook that already paints the numbers (ranks 2, 4, 8, 10). A copy-only rank is a nit and did not make the list.

## Already on the tip — do not recook

Starter / open-lane LTV (v408) · promo LTV, source LTV, spend paste, empty spend as —, deleted day as `$0` (v409) · morning sentence (v410) · period-total hero + phone year cards (v411) · live catalog empty (v412) · returning mix from the stored book (v413) · Orders intelligence on the picked period, code dollars, returns climbing (v414) · same-clock compare (v415) · third-order ticket / wait / reach (v416) · Goals honesty (v417) · phone Goals stack (v418) · Spend pair + Online **sales** split + copyable pair (v419) · book coverage 90 vs 24 (v420) · Goals year clock (v421) · DeskLane later `defaultOpen` (v422) · quiet-then-back `$` + copyable first-time `$` (v423 / `#172`).

**On the tip, not a find:** whale ticket / RFM flow / watchlist “N more” (`#177` / v424). Typical ticket on the row. Cold share in the existing Slack line. Of last month’s Champions, how many are At risk or Hibernating now.

**Named current craft, not a find:** Orders step mix (`cursor/orders-step-mix-5bc6`). This queue’s rank 9. Do not restart it.

## Rank 1 — next cook (after Orders mix PASS + Fly v425)

**Sentence:** Customers mix stuffed unidentified lifetime into first-time `$`. Shopify’s order count is today’s, so last January looks returning. Till LTV skipped the regulars whose Shopify life is longer than this book. The mix chart is still UTC.

**Tab:** Customers first fold (mix) · Spend → CPA new-buyers · Customers → LTV till / depth. Public `/demo` and Admin `/app`.

**Verdict:** Merged **PASS**. Craft 1, craft 2, operator 8 (dunk, 18 Feb 2026), desk 7.

**Why it is not a nit:** `orderIsReturning` treats `lifetime === null` as not returning, so mix **dollars** go to `newD` while `firstTimeCount` withholds the headcount (`customers-analytics.ts`). Orders intelligence already labels `lifetime === null` as `"unknown"` and withholds `newSalesShare`. CPA `countNewBuyersInRange` still counts a null lifetime as new. dunk: “this customer will have a value of 2 in their `customer.order_count` field, making this field unreliable for almost every kind of cohort reporting.” Ingest writes `lifetimeOrders` from current `customer.numberOfOrders`. `computeCohortRollups` **skips** a customer when `lifetimeOrders > list.length` (`order-facts.server.ts`); `loadLtvDepth` maps stored rows with no `lifetimeOrders` and treats the truncated timeline as the life. Unpaid ingest is 90 closed days. Mix keys still `toISOString().slice(0, 10)` while Overview today is `shopLocalDayKey`. Craft: two painted tabs disagree on the same null; a 90-day slice of an eleven-order buyer looks like a one-order customer; evening POS after UTC midnight sits on tomorrow. That is the catalog-empty class of lie, on first-time `$` and on LTV.

**Branch:** `cursor/buyer-life-honesty-5bc6`, cut from `origin/cursor/spend-trust-recurring` after Orders mix merge (or Marty’s skip). One implementer. One Reviewer. One Fly only after PASS.

**Files:**

- `app/app/lib/customers-analytics.ts` — `orderIsReturning` ~775–780; mix dollars 960–965 / 993–1004; `unknownNew` 981–985; `utcDayStart` / `mondayUtc` / `toISOString().slice(0, 10)` 659–661, 955–976.
- `app/app/lib/orders-intelligence.ts` — `buyerKind` 571–579 (read the unknown withhold; do not start rank 9).
- `app/app/lib/order-facts.server.ts` — `computeCohortRollups` skip 424–431; `countNewBuyersInRange` 1194–1198; ingest `lifetimeOrders` ~711.
- `app/app/lib/order-facts.test.ts` ~571–582 (the skip is the unit test).
- `app/app/lib/ltv-depth-page.server.ts` — `loadLtvDepth` ~59–78.
- `app/app/lib/cpa-desk.server.ts` — calls `countNewBuyersInRange` 265–278. Change the counter; do not restyle CPA cards (rank 3).
- `app/app/lib/shop-local-day.ts` — mix days use `shopLocalDayKey` / `shopLocalDate` already on `OrderFact`.

**Done when:**

- Unknown `lifetimeOrders` is — on mix **dollars** and on CPA new-buyers, same as Orders already withholds the share. Never stuffed into first-time `$`. Guests stay out of returning.
- New vs returning **dollars** for a picked period come from `orderedAt` sequence on the stored book. When `lifetimeOrders > stored`, that is its own empty (“earlier orders exist off this till”), never silently stuffed into returning.
- Till LTV and depth name N identified buyers whose Shopify life is longer than this desk stored, and withhold those buyers as — (or say “orders on this desk only”). Do not skip them quietly. Do not lengthen the 90. Do not unpark Live. 8-buyer floor. No Admin door.
- Mix days bucket with `shopLocalDayKey`. Missing TZ stays —, never a host `Date`.
- Five analysis tabs stay five.

**Check:** from `app/`, customers-analytics + order-facts tests. SAMPLE mix and Live mix agree on unknown. A fixture with `lifetimeOrders: 5` and one stored order is not a finished first-time `$` and is not a silent skip.

**Not this cook:** rank 9’s 1st/2nd/3rd **bars** (they inherit the withhold). Rank 8’s first-90 formula. Rank 14’s wait histograms. Rank 4’s truncated-today disclosure. A ShopifyQL box. Unparking Live.

**Wait:** Orders mix (`cursor/orders-step-mix-5bc6`). `customers-analytics.ts` is then this writer’s until rank 12 / 14.

## Rank 2 — queued

**Sentence:** I planned January and March and left February blank — YTD still said I was ahead. I typed `$0` for a closed month and the phone stack showed —. Last year is not on file and Goals still filled 0% of the plan. Public `/demo/goals` said the same year plan as Admin; I got a habit board against a `$0` plan.

**Tab:** Goals year board / gauges / `ThisMonthPlanStack`. Public `/demo/goals` and Admin `/app/goals`.

**Verdict:** Merged **PASS**. Craft 5, 7, 13, 14; desk 9; volume 8.

**Why it is not a nit:** `sumMonths` still adds every on-file actual while skipping a null plan month (`sales-goals.server.ts` 960–980). The v421 test **locks** Feb omitted from goal and never asserts actual/percent (`sales-goals.test.ts` 508–535). `SalesGoalGauges` does `progressPct ?? 0` when server actual is null — a 0% bar next to — dollars. `ThisMonthPlanStack` shows — unless `salesGoal > 0` while the input shows `"0"`. `demo.goals.tsx` still `goals: Array.from({ length: 12 }, () => 0)` and the lede still says “Same year plan as Admin Goals.” Volume: Saturday finance Slack is “we are `$X` versus `$Y` plan.” Overview copies YTD **without** a plan. Goals copies the habit morning line, not Goal / Actual / Prior.

**Branch:** `cursor/goals-leftover-honesty-5bc6`.

**Files:**

- `app/app/lib/sales-goals.server.ts` — `sumMonths` 960–980; YTD 783–794; `progressPct` 1139–1140, 1224–1226; `calendarPctInMonthSpan` 1015–1039.
- `app/app/lib/sales-goals.ts` — `formatGoalInput` 35–38.
- `app/app/lib/sales-goals.test.ts` 508–546.
- `app/app/components/SalesGoalGauges.tsx` 76–83, 129, 152.
- `app/app/routes/app.goals.tsx` — YTD chip 810–813; `ThisMonthPlanStack` 1490–1558; `GoalRow.hasGoal` 1409.
- `app/app/routes/demo.goals.tsx` 61–71, 97–99, 118–120.
- `app/app/components/OrderHistoryGoalsBoard.tsx` — habit copy 318–323 (keep; add the stack copy).

**Done when:**

- YTD/QTD actual (and %) only sum months that have a plan, or withhold %. Calendar tick matches. Never `$0` a cleared month.
- Phone stack and gauges show typed `$0` as `$0`, cleared as —. YTD does not treat them as the same unless the copy says so.
- Null actual + hasGoal → empty bar / —, never 0%. Certified closed-day `$0` may be 0%.
- `/demo/goals` mounts the Admin year table read-only from the SAMPLE book’s typed-or-empty months. Empty plan stays —. Fix or delete the “same year plan” lede until the table exists. Do not invent `$800k`. Do not paint certified `$0` unless the SAMPLE day is a closed zero.
- One copy control on `ThisMonthPlanStack`: Goal, Shopify Total Sales Actual, Prior when on file. Missing last year copies nothing (or “not on file”) — never `$0`. Empty goal copies nothing. Do not invent a Slack product.

**Not this cook:** SAMPLE 35% / `$800k` (v417). 720px stack (v418). Rank 3’s `TRIAL_VS_VIEW` sentence (Goals paints it; rank 3 owns the words). Refund processing date.

**Wait:** whale. `app.goals.tsx` / `sales-goals.server.ts` / `demo.goals.tsx` are then this writer’s.

## Rank 3 — queued

**Sentence:** Settings told me the whole desk is already on and the trial is full-access. I tapped This year on Spend. CPA offered YTD. Overview already said order rows stop at 90 closed days until I pay.

**Tab:** Settings plan block · Goals muted `TRIAL_VS_VIEW` · Spend explorer chips · Spend → CPA ranges. Not the Customers Unlock banner. Not Overview coverage.

**Verdict:** Merged **PASS**. Desk 10, craft 6, volume 4, 5, 6.

**Why it is not a nit:** `TRIAL_VS_VIEW` = “The whole desk is already on.” `DESK_FEATURE_BULLETS` still “7-day full-access trial.” Unlock banner (90 vs 24) is still Customers-only. Explorer `RANGE_PRESETS` still includes `YTD`, `1y`, `All` (~3 years) with no `orderBookDepth` disable. CPA `CPA_EXPLORER_RANGES` includes `ytd`; `resolveLastNDays` is through **today inclusive**. Spend explorer **excludes** today (`closedDayEnd`). Two clocks on one tab, and both still sell a year on a 90-day unpaid book. Volume: they will read This-month CPA off a partial Saturday and a 90-day YTD, then change spend.

**Branch:** `cursor/unpaid-year-leftover-5bc6`.

**Files:**

- `app/app/lib/sample-live-handoff.ts` — `TRIAL_VS_VIEW` 36–37.
- `app/app/lib/entitlements.ts` — `PRO_UPSELL.includes` / `DESK_FEATURE_BULLETS` 29–64.
- `app/app/routes/app.settings.tsx` 580–589.
- `app/app/routes/demo.settings.tsx` 33–54.
- `app/app/lib/billing-flag.server.ts` 60–62.
- `app/app/routes/app.goals.tsx` — `{TRIAL_VS_VIEW}` when `showStartTrial` 839–843. Rank 2 already shipped the year table; this rank only changes the muted trial sentence.
- `app/app/lib/spend-explorer.ts` — `RANGE_PRESETS` 100–107; `EXPLORER_RANGE_OPTIONS` 119–127.
- `app/app/components/SpendExplorer.tsx` 745–758.
- `app/app/lib/cpa-desk.ts` — `CPA_EXPLORER_RANGES` 29–33; `resolveLastNDays` 140–157.
- `app/app/lib/cpa-desk.server.ts` — `explorerRanges.ytd` 313–318; `todaySalesTruncated` 217, 332 (pass it; rank 4 does Orders/Customers).
- `app/app/components/CpaExplorer.tsx` / `CpaWindowCards.tsx`.
- `app/app/lib/live-unpark.ts` — read `LIVE_UNPAID_INGEST_DAYS = 90`. Do not change it.

**Done when:**

- Unpaid / trial copy: 90 closed days of order rows, paid = up to 24 months, `$39` after 7 days, one plan. Sample | Live stays a view. Public `/demo/settings` says SAMPLE is the paid-shaped book, Live trial is 90 closed days — or stays clearly SAMPLE-only without “full-access.”
- Unpaid explorer does not offer a finished This year / 1 year / All, or the chip names 90 closed days / day totals vs order rows. Never a fake `$0` year.
- Unpaid CPA YTD names 90 closed days or stays off. Last 28 / This month either exclude incomplete today or say so. Empty spend stays —. Never `0×`.
- Do not add a history SKU. Do not unpark Live. Do not change the 90.

**Not this cook:** Unlock banner still Customers-only (named leftover; do not re-rank as the whole cook). Rank 5 import clock / Online denominator. Rank 4 Orders/Customers first-fold truncated line.

**Wait:** rank 2 if `app.goals.tsx` is still that writer. `spend-explorer.ts` / `cpa-desk.ts` are then this writer’s until rank 5.

## Rank 4 — queued

**Sentence:** Overview told me live today is capped at ~100 orders. Orders typical and Customers returning `$` still looked like a closed day. Returning dollars this month are `$417,392` and last September is not on this book — Customers never said so.

**Tab:** Orders first fold · Customers first fold. Spend first-fold Sales KPI already names the cap (v420). Goals MTD already discloses (v421).

**Verdict:** Merged **PASS**. Craft 8, volume 12, 13, 14.

**Why it is not a nit:** `OrdersFirstViewport` props are `depth`, `salesPending`, `useSampleDesk` — no `todaySalesTruncated`. `buildCustomersHero` returns returning `$` when `> 0` with no truncated bit and no prior period. Page banners exist; the **hero numbers** do not withhold. `$417,392` returning with a thin last year looks like a finished mix. Overview YoY can dash last year. Rank 11 / this queue rank 12 owns Overview new `$` vs returning `$` vs same **quarter** last year — this tab never mounts that pair. `returningCard` already builds the copy string and lives inside Depth `DeskLane`. Buyer ops on Customers screenshots.

**Branch:** `cursor/truncated-today-leftover-5bc6`.

**Files:**

- `app/app/components/OrdersFirstViewport.tsx` 66–73, 87–128.
- `app/app/routes/app.orders.tsx` — `todaySalesTruncated` already to `DeskBookPage` ~94.
- `app/app/lib/customers-first-viewport.ts` — `buildCustomersHero` 173–204; `customersOperatorGreeting` 140–167.
- `app/app/components/CustomersFirstViewport.tsx` 144–157.
- `app/app/routes/app.customers.tsx` — banner 172; first viewport 201–206; `ShareableInsightCards` still inside Depth 249–267.
- `app/app/lib/shareable-insights.ts` — `returningCard` 209–236 (mount on the first fold; do not recook rank 7 / `#172`).

**Done when:**

- Pass `todaySalesTruncated` into Orders typical / average and Customers returning `$`, or withhold today’s slice until the cap lifts. Never write `$0`.
- When last year is not on file, say so next to returning vs new (dash / not on file). Never paint `0%` YoY. Guests out. Do not recook Overview YoY.
- Copy returning vs new on the Customers first fold when both dollars seal. Never copy `$0`. Never copy pending. Do not move the Overview posters.

**Not this cook:** Rank 3 CPA truncated / explorer “today not in this chart.” Rank 10 copy of the Orders **intelligence** sentence (this rank may copy the existing typical-vs-average greeting if it is already sealed; the mix sentence waits for rank 9). Million-order crawl as shipped.

**Wait:** whale. `OrdersFirstViewport` markup stays this writer’s until rank 9 / 10.

## Rank 5 — queued

**Sentence:** I pasted yesterday on Spend import from a Denver laptop; the shop is Asia/Tokyo; the row landed on the wrong closed day. Coverage is still the host calendar. SAMPLE import still drew a 35% break-even rail. The pair said Online `$` ÷ typed spend — I typed Meta plus a retainer and read 2.1× as ads ROAS. Monday is 2.1× and Sunday looks like 8× because we do not buy ads; the explorer has no weekday grain.

**Tab:** Spend import · coverage strip · first-fold Online line · explorer.

**Verdict:** Merged **PASS**. Craft 3, 11, 12; volume 11; desk 13; operator 12 (Spend half).

**Why it is not a nit:** Import already resolves `timeZone = deskPeriodTimeZone(...)` then ignores it for `todayKey: sampleDesk.enabled ? utcDayKey(now) : localDayKey(now)` — Live is process TZ (`app.spend.import.tsx` 396). Coverage `startOfLocalDay` is `new Date(d.getFullYear(), d.getMonth(), d.getDate())` (`spend-coverage.server.ts` 22–24). SAMPLE import still sets `breakEvenMer` from `SAMPLE_DESK_MARGIN_PCT` 0.35; v417 forbade that on Goals/Spend mix. `formatOnlineRoasLine` does `onlineSales / spend` where `spend` is **all** typed spend. `ExplorerGranularity` is Day / Week / Month / Quarter — no weekday. Operator Southpaw1 burned an hour for compare-to **`$`**; Spend `compareExplorerBuckets` compares the previous bucket inside the window, not last year’s same week, and hides the figure behind a %.

**Branch:** `cursor/spend-leftover-honesty-5bc6`.

**Files:**

- `app/app/routes/app.spend.import.tsx` 228, 303–310, 339, 396.
- `app/app/lib/sample-desk.server.ts` — `localDayKey` 444–448.
- `app/app/lib/spend-coverage.server.ts` 5, 22–24, 50–77, 96–131.
- `app/app/routes/app.spend.tsx` — `todayKey` 425–429; coverage filter 866–882; Online line 789.
- `app/app/lib/number-honesty.ts` — `formatOnlineRoasLine` 109–139.
- `app/app/lib/spend-explorer.ts` — `ExplorerGranularity` 16, 108; `bucketExplorerRows` 592–594; `compareExplorerBuckets`. Rank 3 already named the year chips.
- `app/app/components/SpendExplorer.tsx`.
- `app/app/lib/goals-honesty.test.ts` — keep the v417 SAMPLE-BE lock; extend it to import.

**Done when:**

- Import `todayKey` uses `deskPeriodTimeZone` + `shopLocalDayKey` the same way `/app/spend` does. Empty TZ stays —, do not invent a zone.
- Coverage, explorer, and closed-day keys use the same shop IANA. Incomplete today stays out of “closed days,” or is named open. SAMPLE UTC vs live host is one clock. Empty spend stays empty, never `$0`.
- SAMPLE import `breakEvenMer` is null unless Live Settings confirmed a margin (Settings still has no margin field — so null). Empty BE is —. Do not invent COGS.
- Name that the Online multiple’s denominator is every typed dollar, or withhold the Online multiple when non-online spend is on file. Do not claim attribution. Do not replace Total ROAS religion.
- Explorer weekday grain: shop-local weekday sales paired with typed spend on those weekdays. Empty spend stays —. A weekday with spend and sales not on file stays —. Never `0×`.
- Copyable this-week / this-month Shopify Total Sales **and** the same weekday-shifted last year `$` (or previous week `$` when last year is not on file — never a fake `$0`). A percent-only chip is not enough.

**Not this cook:** Rank 3 year chips / CPA YTD. Rank 8 payback day-0 / which D90. Pixels / MTA / “true ROAS.”

**Wait:** rank 3 (`spend-explorer.ts`).

## Rank 6 — queued

**Sentence:** I tapped Coverage to fill an empty day. The Add-a-day fold opened too, and the coverage calendar also snapped open. On Overview, Mix close still opens weekday.

**Tab:** Spend Add-spend fold · Overview mix close. Public `/demo` and Admin `/app`.

**Verdict:** **PASS.** Craft 4 (second wrong-lane class after v422). Mix-close → weekday counted only because of that second class.

**Why it is not a nit:** Add-spend `DeskLane` contains `#mcfly-spend-add` **and** native `HashDetails` `#mcfly-spend-coverage` / ledger / rates / recurring. `deskLaneTargetOpensFold` treats `foldRoot.contains(target)` as open. Coverage peek hashes `mcfly-spend-coverage`. One chip opens two disclosure widgets on a 390px iframe. Overview `id={OVERVIEW_MIX_CLOSE_ID}` still wraps Mix **and** the weekday more-fold (`app._index.tsx` 972–996; `demo._index.tsx` 260–283). Megaprompt: Mix-close-opens-weekday only counts with a second wrap class. This is that class. Not a restatement of v422’s later-`defaultOpen` cook.

**Branch:** `cursor/wrong-lane-leftover-5bc6`.

**Files:**

- `app/app/routes/app.spend.tsx` — Add-spend `DeskLane` 1365–1372; HashDetails 1467–1471, 1606–1607, 1701–1702, 1777–1778; coverage peek `nextHref` 912–916, 1428.
- `app/app/lib/desk-lane.ts` 61–69; `app/app/components/DeskLane.tsx` 63–71.
- `app/app/components/HashDetails.tsx` 220–246 (exact hash).
- `app/app/routes/app._index.tsx` 972–996; `app/app/routes/demo._index.tsx` 260–283.

**Done when:** Coverage / recurring / ledger hashes open only that `<details>` (or a dedicated fold), not the parent Add-spend `DeskLane`. Mix close must not set `defaultOpen` on the weekday fold. Do not recook v422’s later-`defaultOpen` contract. Public `/demo` and Admin `/app` match.

**Not this cook:** whale Depth columns (rank 8 of `#165`, in review). Rank 8 of **this** queue opening LTV curves (`?panel=ltv`). Spend pair copy (v419).

**Wait:** rank 5 if `app.spend.tsx` is still that writer. Overview wrap can ship in the same cook (one implementer, two call sites).

## Rank 7 — queued

**Sentence:** On my phone I cannot read first 30 / 90 / first year — they sit three across. The LTV triangle is a nowrap heat table. The Orders weekly ledger is eight nowrap columns. A six-figure first year / six-figure week is off the iframe.

**Tab:** Customers → LTV (flagship tiles + open-lane triangle) · Orders weekly ledger. Not whale 430px four-column. Not v418 Goals / Orders / Customers / Growth peeks.

**Verdict:** Merged **PASS**. Volume 1, 2, 3.

**Why it is not a nit:** `.mcfly-kpi-grid` is always `repeat(3, minmax(0, 1fr))`; stack to one column is `@media (max-width: 430px)`. The v418 `@media (max-width: 36rem)` wrap lists Goals + Orders / Customers / Growth peeks only — LTV is absent. `.mcfly-depth-table th, td { white-space: nowrap }` with parent `.mcfly-desk { overflow-x: hidden }`. `.mcfly-orders-ledger__table` is eight nowrap columns. `desk-phone-layout.test.ts` does not lock an LTV wrap or the ledger. Snowdevil `$68k` fits; `$417,392` does not. Rank 8 of `#165` is the whale **four-column** row, a different grid.

**Branch:** `cursor/phone-six-figure-wrap-5bc6`.

**Files:**

- `app/app/styles/mcfly-desk.css` — `.mcfly-kpi-grid` 3213–3216; 430px stack 13061–13071; v418 36rem wrap 21830–21878; `.mcfly-depth-table` 16751–16772; `.mcfly-orders-ledger__table` 15166–15184. Do not edit the morning-habit block. Do not recook whale 430px.
- `app/app/components/LtvFlagshipBoard.tsx` 217.
- `app/app/components/LtvWindowTriangle.tsx` 209–266.
- `app/app/components/OrdersIntelligence.tsx` — `OrdersLedgerTable` 417–439, 483–487.
- `app/app/lib/desk-phone-layout.test.ts` — extend the 36rem lock to LTV wrap + ledger Week + Sales on screen.

**Done when:** Under 36rem, 30 / 90 / first year stack the way Goals / Orders / Growth already wrap. Triangle sealed six-figure dollars stay on screen; unsealed stays — / hatch, never `$0` / `0%`. Ledger keeps Week + Sales (+ AOV) on screen; park Codes / Returns in the existing drill. Missing prior stays —. Dollar may wrap. Never a fake `$0`. Public `/demo` matches.

**Not this cook:** whale 430px (in review). Rank 9 adding mix bars. Rank 13 launch-week class.

**Wait:** whale (CSS file). Do not start a second agent in `mcfly-desk.css`.

## Rank 8 — queued

**Sentence:** Customers → LTV says first 90 is `$X` from the till. The 30/90/first-year tiles wait until eight buyers have lived the window. Spend payback interpolates the till through day-0 `$0`. The spend-build curves are under Depth. SAMPLE always opens the estimate. I cannot copy first 30, first 90, and first year.

**Tab:** Customers → LTV open lane + Spend CPA payback. Not rank 13 launch-week class.

**Verdict:** Merged **PASS**. Volume 7, 10; craft 9, 10, 15.

**Why it is not a nit:** `customerWeightedAvgRevenue` averages every `customers > 0` cohort with **no** `matureForWindow`. Flagship `FLAGSHIP_MIN_MATURE = 8`. CPA payback uses the till anchors. `cashPaybackAnchors` still starts `{ day: 0, revenue: 0, earned: false }` and missing D30 interpolates `$0` at day 0 → D90; `CpaPaybackDesk` still prints `{paybackDays}d`. `cohortLtvCurves` is computed and painted only in `CustomersLtvDepth` → `LtvBuildCurves`. `?panel=ltv` does not open Depth. `LtvExpectedEstimate` does `open={useSampleDesk || estimate.expected != null}` — SAMPLE always expanded on a dash. Slack is still “a new buyer is worth `$X` in the window.” Two first-90 formulas on the painted desk. A $5M Saturday will scale a channel off a payback day that LTV’s own tiles would still dash.

**Branch:** `cursor/ltv-first90-honesty-5bc6`.

**Files:**

- `app/app/lib/till-ltv.server.ts` 69–82, 123–134, 162–167.
- `app/app/lib/ltv-flagship.ts` — `FLAGSHIP_MIN_MATURE` 38; `matureForWindow` 172–178; `windowRevenue` 250–258.
- `app/app/lib/ltv-depth.ts` — `cohortLtvCurves` 382–424; `buildLtvDepth` 833.
- `app/app/components/CustomersLtvSection.tsx` 223–224, 297, 346–357, 363, 388–443.
- `app/app/components/LtvExpectedEstimate.tsx` 15–20.
- `app/app/lib/expected-ltv.ts` 123–138, 180–196.
- `app/app/lib/cash-payback.ts` 20, 61–74.
- `app/app/components/CpaPaybackDesk.tsx` 57–59, 90–98.
- `app/app/lib/cpa-desk.server.ts` — `cpaPaybackForWindow` 162–176.
- `app/app/routes/app.spend.tsx` 1004–1006 save banner.
- `app/app/lib/shareable-insights.ts` — `ltvPeekSlackInsight` 474–482.
- `app/app/components/LtvFlagshipBoard.tsx` — copy the three windows (rank 7 already stacked them).
- `app/app/routes/app.customers.tsx` — LTV chip `#mcfly-ltv` 220–225 vs Depth 249–266.

**Done when:**

- One first-90: mature-for-window, 8-buyer floor, guests out. Till hero, flagship tiles, and CPA payback read it. Young months stay —, never `$0`.
- Paint D30/D90 anchors, or stop printing `Nd` until the first **earned** anchor exists. Day-0 `$0` is not earned LTV. Refuse causal / ads-manager payback.
- Open the spend-build curves on the LTV lane (or `?panel=ltv` / LTV chip opens the fold that contains them). Thin book stays —.
- SAMPLE and Live use the same empty: collapsed until `expected != null`. Do not invent an estimate.
- Copy first 30 / first 90 / first year when those windows seal. Never copy `$0`. Never copy pending.

**Not this cook:** Rank 13 launch-week class / ticket by month of life / starter-month refunds. Rank 1’s “Shopify life longer than this book” empty (already shipped). Whale ticket (in review). Product titles.

**Wait:** whale (`CustomersLtvSection.tsx` / `ltv-depth.ts`). Rank 1 if `loadLtvDepth` is still that writer. Rank 3 if `cpa-desk.server.ts` is still that writer. Rank 7 stacked the tiles.

## Rank 9 — queued (old `#165` rank 9, kept)

**Sentence:** Of this month’s Shopify Total Sales, how much was a first order, a second, a third, or a fourth-or-later — not how old the buyer is. Show this month’s first-time ticket and returning ticket, not one blended AOV. `WELCOME10` this September versus last September — the named code, not only blended depth.

**Tab:** Orders (intelligence + first viewport).

**Verdict:** Merged **PASS**. `#165` rank 9 unchanged, plus compete 13 (named-code YoY) on the same `buildOrdersCodeMoney` writer. Rank 1 already withholds unknown lifetime; this cook inherits that.

**Why it is not a nit:** Lifetimely sells “Customers who purchased X times” as `$`. Floor row 1 / v416 is the career ladder. Floor row 2 is buyer age. A year-old customer placing a second order is old on row 2 and “2nd” here. `OrdersIntelAgg` does not keep returning sales or the two tickets. v414 ranks named codes for **this slice**; there is no `WELCOME10` this September vs last September. Rank 1 proved `lifetimeOrders` is today’s snapshot — unknown stays its own bar, never stuffed into 1st.

**Branch:** `cursor/orders-step-mix-5bc6`.

**Files:** (same as `#165` rank 9, plus named-code YoY)

- `app/app/lib/orders-intelligence.ts` — `aggregateOrderRows`, `buildOrdersIntelKpis`, `assembleOrdersIntelligence`, `buildOrdersWeeklyRows`, `ordersReturnDrag`, `buildOrdersCodeMoney` ~661–721.
- `app/app/components/OrdersIntelligence.tsx` / `OrdersFirstViewport.tsx` / `OrdersTimingChart.tsx`
- `app/app/lib/orders-scoreboard.ts` / `app/app/lib/shopify-depth-stats.ts`
- `app/app/lib/desk-sales-page.server.ts`
- `app/app/routes/app.orders.tsx` / `demo.orders.tsx`

**Done when:** (`#165` rank 9 done-when, plus named codes)

- Four sealed bars (1st / 2nd / 3rd / 4th+) for the picked period, Shopify Total Sales dollars. Guests out. Unknown lifetime as its own bar or —, never stuffed into 1st. Under 8 identified buyers in a step stays —. Sequence is stored-book order, not today’s `numberOfOrders` (rank 1).
- First-time ticket and returning ticket, both labeled Shopify Total Sales per order. Shipping + tax dollars sit next to typical so a ~20% gap is a named slice. Do not paint Mcfly typical as Shopify’s AOV. VAT-out stays REFUSE.
- Identified buyers who made 50% of period Shopify Total Sales, and top-decile share of the period. Guests out. Under 8 identified buyers: —.
- First-time vs already-bought hour / weekday shares or a stacked bar. Same 5-day / hour gates. Guests out of the returning series. Unknown lifetime not painted as new.
- Same-month-last-year **blended** discount dollars (and depth), **and** top sealed named codes this month vs same month last year. Codes still names. Automatic titles HOLD. Missing last year —. Combinable-code double-count: say so or keep first named code only.
- Placed-day kept share (net vs gross) this month vs last year. Any missing gross → —, never a partial 0%.
- This month, first checkouts vs returning checkouts: share of gross taken off. Missing discount field → —.
- Period dollars per unit = Shopify Total Sales ÷ units on file (or Net ÷ units when `netSales` is on the day). Dash when `unitCount` is not crawled.
- Period count of `$0`-amount orders and the units on those rows. Do not pretend to know they are “internal.” Order tags stay HOLD.

**Not this cook:** Rank 10 paid typical / 1 vs 2+ `$` / 7×24 / weekday `$`. Rank 11 Other **strings** / guest `$`. Refund `processed_at`. Admin exchange “true gross.”

**Wait:** rank 4 (`OrdersFirstViewport`). Rank 1 already shipped the unknown withhold.

## Rank 10 — queued

**Sentence:** Typical still divides by every `$0` sample checkout. Seventy percent of orders are one item — is that forty percent of Shopify Total Sales? What share of this month landed on a discounted ticket? Gross is the list price we never collected. Which weekday×hour cells carried this month? I cannot copy typical vs Shopify’s average.

**Tab:** Orders first fold + timing chart + week board.

**Verdict:** Merged **PASS**. Operator 1, 2, 5, 7, 9, 10, 12 (Orders half); desk 4, 5, 8; compete 6, 7, 15; volume 9.

**Why it is not a nit:** CharlesUK (Plus, 9 Sep 2025): AOV as REVENUE / ORDERS when it should be REVENUE / PURCHASES — `$0` samples share checkout. Rank 9’s `$0` **count** does not change the typical the open lane already prints. `multiUnitOrderShare` is order **headcount**; nobody sums `amount` where `unitCount === 1` vs `>= 2`. `discountedOrderShare` is discounted **orders**; `discountedAmounts` is already built for the median and never summed as a till share. YC3 (16 Jun 2026): “My Shopify-reported return rate is ~25%. My actual return rate is ~3%.” Painted drag is “returns and edits” under a returns heading. Thermal_arc: gross includes markdowns they never collected. `OrdersTimingChart` is weekday **or** hour, shares not `$`. Putler sells the 7×24 dollar grid. TSAvi / metric_nerd: split checkout drops AOV — count identified buyers with 2+ orders on the same shop-local day. `ordersOperatorGreeting` already writes typical vs average and has no copy control.

**Branch:** `cursor/orders-fold-leftover-5bc6`.

**Files:**

- `app/app/lib/shopify-depth-stats.ts` — `medianAov` / `meanAov`; `multiUnitOrderShare` ~138–142, 492–501; `discountedOrderShare` / `discountedAmounts` ~132–133, 456–478; `weekdayTotals` / `hourTotals`; `shopLocalHour`.
- `app/app/lib/orders-scoreboard.ts` — `bookDiscountedOrders` 236–245; `buildOrdersChartBars`; `ordersHourBreakdown`.
- `app/app/lib/orders-first-viewport.ts` — `ORDERS_FIRST_FOLD_HEROES` 39–44; `ordersOperatorGreeting` 79–98; `buildOrdersLeadPeeks` 121–127.
- `app/app/components/OrdersFirstViewport.tsx` / `OrdersTimingChart.tsx` / `OrdersIntelligence.tsx` (week `$` vs last year; do not restyle the wrap rank 7 shipped).
- `app/app/lib/orders-intelligence.ts` — weekly `aov` / `ordersDelta` (order **count** today). Rank 9 already used this file; **wait**.
- `app/app/lib/shareable-insights.ts` — `typicalOrderCard` 239–249 is on Overview / Depth, not Orders.

**Done when:**

- Period typical among orders with `amount > 0`, next to all-order typical, plus the `$0` row count rank 9 already paints. Dash when paid orders < 8. Do not invent a “Sample” tag. Mixed paid+sample line items stay one paid order.
- Period Shopify Total Sales on rows with `unitCount === 1` vs `unitCount >= 2` (unknown unitCount its own bar or —). 8-order floor. Not rank 9’s dollars-per-unit.
- Share of this month’s Shopify Total Sales that had a discount on the order. Codes stay names. Automatic titles HOLD. Missing discount field → —.
- Period **list (gross) · discount `$` · Shopify Total Sales (`amount`)** as three named numbers. Missing gross stays —, never a fake `$0`. Name the painted drag **money off the original checkout** (edits + refunds), never a return **rate**. HOLD a true parcel-back rate.
- Period count of identified buyers with 2+ orders on the same shop-local day, and the Shopify Total Sales on those extra rows. Guests out. Do not claim a parent checkout id.
- 7×24 Shopify Total Sales cells for the picked period, shop-local, hour gates. Guests included in till (this is a till heatmap). Rank 9’s new vs returning hour stays that cook. No sessions.
- Weekday Shopify Total Sales as `$`, not only %. POS-only hour `$` for the picked period (dash when POS rows < 8; unpaid 90 cannot claim six months — say so). HOLD per-location.
- Monthly typical Shopify Total Sales per order for this year and last year (— if missing), 8-order floor, labeled Total Sales per order.
- Copyable this-week / this-month Shopify Total Sales **and** last year’s same weekday-shifted `$` on the week board. Copy `ordersOperatorGreeting` when typical is on file. Copy the intelligence sentence rank 9 already paints when it seals. Never copy `$0`. Never copy pending.

**Not this cook:** Rank 9 step bars. Rank 11 guest `$` / Other names / new vs returning **by source**. Rank 7 ledger wrap. ShopifyQL explorer.

**Wait:** rank 9 (`orders-intelligence.ts` / `app.orders.tsx` / `OrdersFirstViewport`). Rank 7 stacked the ledger.

## Rank 11 — queued (old `#165` rank 10, absorbed)

**Sentence:** How much of this month’s Shopify Total Sales is guest checkout, not a percent of orders — and why does Live look like I have none? Of POS this month, how much is regulars versus first-timers? How many people shopped both the site and the floor? The discount report no longer pulls POS donation / trade codes. Did this customer find us online after they already bought at POS?

**Tab:** Orders source bar + Customers guest tile.

**Verdict:** Merged **PASS**. `#165` rank 10 kept, plus desk 3 / compete 14, desk 14, operator 4, operator 6. Same `classifyOrderSource` writer.

**Why it is not a nit:** Guest tile is **order share**; Live day facts write `guestOrders: 0`; there is no guest **sales** share. Source bar is blended typical. Source LTV is first-order source → lifetime worth. LisaNM (20 Apr 2024): POS donation / trade codes disappeared from Shopify’s discount report. u/whyanalyze: Shopify calls them new online after they already bought at POS. Rank 9’s 1st/2nd/3rd `$` is not by source. A buyer with a web order and a POS order this month is two bars, never “N identified buyers used both.”

**Branch:** `cursor/guest-source-returns-5bc6`.

**Files:**

- `app/app/lib/shopify-native-stats.ts` — `guestShare`.
- `app/app/lib/shopify-depth-stats.ts` — `guestAov`, `sourceSalesShare`, `classifyOrderSource` ~197–217.
- `app/app/lib/sales-facts.server.ts` — `guestOrders: 0` on Live day facts (do not paint that zero as guest dollars).
- `app/app/lib/orders-scoreboard.ts` — `buildOrdersSourceBar`.
- `app/app/lib/orders-intelligence.ts` — `buildOrdersCodeMoney` POS filter (rank 9 already used this file; **wait**).
- `app/app/lib/ltv-by-source.ts` — read first-order source; this cook is **this period**.
- `app/app/components/ShopifyBookSection.tsx` / `CustomersScoreboard.tsx`
- `app/app/lib/desk-sales-page.server.ts`

**Done when:** (`#165` rank 10 done-when, plus omnichannel)

- Guest **dollars** this month on the open lane, from `OrderFact` rows. Live does not name a stored zero as “none.”
- Returns drag by Online / POS / Shop / Other on the source bar; missing gross stays unknown, never a partial `$0`.
- Other bucket names source names already on the row (draft invoices, subscription renewals) and gets a typical order when the floor seals.
- Four sources × new/returning `$` for the picked period, 8-order floor per cell or —. Guests out of returning. Unknown lifetime its own empty (rank 1).
- N identified buyers who used both Online and POS this month. 8-buyer floor. Thin side —. Do not claim POS drawer tape. Do not ingest a location.
- Period Shopify Total Sales by discount **code** where `classifyOrderSource === "pos"`, named as POS code dollars, not a use count, not `WELCOME10` = 10%. Dash when POS code rows < 8. Automatic titles HOLD.
- This period Shopify Total Sales where this order is online and the buyer’s first stored order is POS. Guests out. Seal at 8 buyers. Thin side —. HOLD matching POS guests who never gave an identity.
- Do not recook source LTV. Do not claim POS drawer tape. No refund processing date.

**Not this cook:** Rank 9’s order-number mix. Rank 10’s 7×24 / paid typical. Subscription-checkout bit (HOLD). ERP ingest (REFUSE).

**Wait:** rank 9 and rank 10 (`app.orders.tsx` / `orders-intelligence.ts` / `orders-scoreboard.ts`).

## Rank 12 — queued (old `#165` rank 11, absorbed)

**Sentence:** This month’s sales by how old the buyer is — first bought this quarter vs a year — and new dollars vs returning dollars versus the same quarter last year. I also need this month versus last month, POS `$` next to online `$`, this week versus a typical week, how many new identified buyers versus last year, and through 2:55pm whether returning dollars are ahead of last year’s same weekday.

**Tab:** Overview first fold (plain windows + YoY + clock sentence), with a Growth peek for installed-base retention.

**Verdict:** Merged **PASS**. `#165` rank 11 kept, plus desk 1, 11, 12; operator 3, 11; compete 5, 8, 11.

**Why it is not a nit:** Compete rows 2–3 were still-PASS in `#152` and never cooked. `PRODUCT_NOUN.vsLastMonth` is the unused string `"This month vs last month"` — never imported on Overview. Spend mix already compares channels versus last month. Nik_Hawks (29 Jun 2026): “The new dashboard made it much more difficult to easily see my daily sales on the PoS and online store.” Overview’s four peeks are period total, typical, returning `$`, weekend **share** — no POS `$` · online `$` pair. Mix close is remaining calendar days × typical **day**; there is no median of complete Monday–Sunday weeks. `overviewClockSentence` slims each order to `{ orderedAt, amount }` and **drops** `customerKey` / `lifetimeOrders`. Shopify New customers over time is a **headcount**, not rank 11’s quarter **`$`**. Peel Home “Returning orders weekly (to New)” is a **count** ratio, last 7 days. v415 same-clock is the **day**; Saturday 2–3pm vs last year’s 2–3pm can hide inside a held day.

**Branch:** `cursor/overview-buyer-age-5bc6`.

**Files:**

- `app/app/lib/overview-yoy.ts` / `app/app/components/OverviewYoyCards.tsx`
- `app/app/lib/overview-first-viewport.ts` — `OVERVIEW_PLAIN_WINDOW_IDS` 473–493.
- `app/app/lib/product-labels.ts` — `vsLastMonth` 217–218.
- `app/app/lib/overview-sales-chart.ts` — `overviewClockSentence` 696–715; `OverviewClockOrder` 417–420; `shopLocalClockSeconds` ~479–492.
- `app/app/lib/overview-mix-forecast.ts` — typical day; do not recook `#157` / v415 day compare.
- `app/app/lib/customers-analytics.ts` — annual retention peek + first-time headcount. **Wait for rank 1.** Rank 14 waits for this rank.
- `app/app/lib/shopify-depth-stats.ts` — `classifyOrderSource` for the POS / online pair (rank 11 may still own the source bar; Overview only paints the dollar pair).
- Growth peek mount.

**Done when:** (`#165` rank 11 done-when, plus Saturday fold)

- Rows 2 and 3 paint, 8-buyer floor, guests out, thin side —. Annual base retention as headcount + their dollars this year, or — when the book is a 90-day slice. Do not paint example-store figures.
- One extra certified card: this month-to-date versus last month-to-date. Missing last month stays —. Never `$0`. Day totals already go five years.
- Named Shopify Total Sales for POS and for online on the Overview first fold of the picked period (today / this week / this month). Share % is not the dollar pair. A second labeled line may be **online-store** `$` + typical for the ads seat. Other **names** stay rank 11. HOLD per-location tape. REFUSE pixels.
- This week versus a typical week from complete Monday–Sunday weeks in the day book. Seal at 8 complete weeks. Certified `$0` days stay inside a week that has a row. A week with missing days is not on file, never a fake `$0` week. Typical **day** × 7 is not that object.
- Month (and week) first-identified-order headcount for the open Overview year, vs last year when the book has it, — when last year is not on file, never `$0` / `0`. 8-buyer floor on a thin month. Guests out.
- Last-7-shop-days returning-order **count** versus new-order **count** (and a short spark vs prior weeks), 8-order floor, guests out of returning counts, unknown lifetime not stuffed into new (rank 1). Missing days —.
- Clock sentence: a second labeled line for returning `$` through this clock versus last year’s same weekday, 8-buyer floor, guests out, unknown lifetime not painted as new, missing last year —. For the open period, 24 shop-local hours this year vs last year (same-clock rule as Overview days). Never `$0`. Do not recook the day compare.

**Not this cook:** same-clock **day** (v415). Rank 2 Goals month returning `$`. Rank 14 wait histograms. Rank 11 source-bar split.

**Wait:** rank 1 (`customers-analytics.ts`). Rank 3 if Overview coverage copy still moves (it should not). Do not recook `OverviewSalesChart.tsx` day compare.

## Rank 13 — queued (old `#165` rank 12, kept)

**Sentence:** Which starter month — and which launch week — gave the most back by day 90, and in month four how often did they order, not how big the ticket was. For January’s class, when did the second order actually land — month 0, 1, or 2.

**Tab:** Customers → LTV.

**Verdict:** Merged **PASS**. `#165` rank 12 unchanged, plus compete 4 (second-order offset by starter month) on the same `ltv-depth.ts` writer.

**Why it is not a nit:** Still-PASS rows 4/6/7/8 were never started. Peel weekly cohorts: “find out what week brought in your most valuable customers.” `ltv-depth.ts` groups only `cohortMonth`. Floor row 7 is ticket by month of life; Peel “Orders per Customer” is frequency, not ticket. Triple Whale “2nd order only” is a distribution **by class**, not the shop’s blended 1st→2nd histogram. Rank 8 of this queue already opened the spend-build curves; this cook does not re-open them.

**Branch:** `cursor/ltv-starter-week-5bc6`.

**Files:** `app/app/lib/ltv-depth.ts` (`rollUpCustomers`, `monthKey`, `CustomerDepth.activeOffsets`, `retentionHeat`); `app/app/lib/ltv-flagship.ts`; `app/app/components/CustomersLtvSection.tsx`; `app/app/components/LtvBuildCurves.tsx`; `app/app/lib/growth-tt2.ts` / `daysToSecond` (blended — read; do not replace).

**Done when:** (`#165` rank 12 done-when, plus second-order offset)

- Starter **month** jobs (later orders still on a discount by class; this year vs last year at day 90; ticket by month of life; which starter month gave the most back by day 90) plus ISO week of first identified order (worth and come-back at day 90) plus cumulative orders per buyer at elapsed offsets. Un-elapsed stays —. 8-buyer floor. Guests out. No industry norm. SAMPLE must not invent a catalog.
- For each starter month with 8 identified seconds, share of those seconds in elapsed month 0 / 1 / 2 (unelapsed —). Guests out. Not rank 14’s shop-wide 2nd→3rd histogram.

**Not this cook:** product titles, UTM / ads channel, v416 wait column, rank 8’s one first-90 / curves-on-lane.

**Wait:** rank 8 (`CustomersLtvSection.tsx` / `ltv-depth.ts` / `ltv-flagship.ts`).

## Rank 14 — queued

**Sentence:** Show the wait to the third order as a spread and a cumulative %, not one median. Days from first checkout to the third — not 2nd→3rd. Of people who reordered in June, what share ordered again inside 90 days. Of August’s buyers, who came back in September. POS starters come back in two weeks and online starters take six. How many 2+ buyers are late against this shop’s wait. Of everyone on this book, what share ever came back — and this book is 90 days or 24 months. How many identified buyers are A / B / C of the lifetime file.

**Tab:** Customers → Growth (open lane), with LTV source rows for wait-by-source.

**Verdict:** Merged **PASS**. Compete 1, 2, 3, 9, 10, 12, 16; desk 2, 6.

**Why it is not a nit:** Growth already paints a 1st→2nd cadence and v416 one median wait per step. `#172` adds one median first→last and one median inter-order gap. Lifetimely Time Between Orders (updated 3 Apr 2026) is 2nd→3rd / 3rd→4th **buckets** + cumulative %. Peel Days since First Order is elapsed-from-first, not previous→next. Lifetimely repurchase second chart cohorts the month of a **repeat**, not the first order. Desk 2 is last calendar month’s identified set ∩ this month — not rank 12’s annual base, not `#172` quiet-then-back `$`, not rank 8 RFM flow. Source LTV (v409) is worth, not wait. Win-back today counts **one-order** buyers; RCI defection-via-latency is 2+ late against this shop’s wait. Growth “Repeat rate” is `everRepeatShare` inside a rolling ~90-day window, not the stored book with 90 vs 24 named. Spend bands are fixed dollar cuts; whale is 8 people; rank 9 is this month’s 50% — nobody asks 80/15/5 of the **lifetime file**.

**Branch:** `cursor/growth-repeat-clocks-5bc6`.

**Files:**

- `app/app/lib/customers-analytics.ts` — `DAYS_BUCKETS`, `daysToSecond`, `buildOrderSteps`, `saveNowOneOrder` ~810–816, `everRepeatShare` ~819–821, `SPEND_BANDS` ~440–447, mix / first-by-customer.
- `app/app/lib/growth-tt2.ts` / `app/app/lib/growth-first-viewport.ts`
- `app/app/components/GrowthScoreboard.tsx` / `CustomerRetentionBoard.tsx` / `GrowthTt2Board.tsx` / `CustomersGrowthSection.tsx`
- `app/app/lib/ltv-by-source.ts` / `LtvBySourceRows.tsx` — wait column next to LTV.
- `app/app/lib/shareable-insights.ts` — `daysToSecondSlackInsight` (BFCM-minus-wait line).
- `app/app/lib/ltv-flagship.ts` — `windowRetention` is first-order mature; do not recook rank 8 / 13.
- `app/app/lib/customers-rfm.ts` — read hibernate 90 so this job is not rank 8 flow.

**Done when:**

- Sealed 2nd→3rd and 3rd→4th (and optional all-repeat) buckets + cumulative %, 8-gap floor, guests out, history-limited buckets withheld not `$0`. Not v416’s one wait column. Not `#172`’s one median gap. Do not paint Lifetimely’s “most brands see 80%…” as this shop.
- First→2nd (already), first→3rd, first→4th as **elapsed-from-first** medians, labeled as such, next to (not replacing) consecutive waits. Seal at 8 buyers who have lived that nth order. Young nth stays —.
- For each month that sealed ≥8 identified repeat-orders, 30/60/90/180/365 to the next (or — when unelapsed). Guests out. Unpaid 90-day book stays — for 180/365. Not compete 5’s one wait (`#172`).
- Last calendar month’s identified `customerKey` set ∩ this month: headcount + their this-month Shopify Total Sales. 8-buyer floor on last month’s base. Unpaid 90 can seal when both months sit in the 90; else —. Never `0%`. Guests out.
- Days to second by first-order source (Online / POS / Shop / Other). Seal at 8 identified first→second gaps per source. Guests out. Thin source —. Source LTV stays worth.
- Sealed 8 late 2+ buyers: count + their stored `$` (lifetime or trailing-12 when the book covers it). Unpaid 90: — for “trailing-12.” Buffer labeled as this shop’s wait, not an industry 50-day. Opaque keys off the desk. Rank 8 still owns RFM **flow**.
- Copyable sentence on Growth when wait seals: first→second wait is N days; holiday outreach that wants a second order by BFCM starts about … before. Use Shopify’s BFCM window as the named date, shop-local. — when wait does not seal. No Slack product. No industry 14-day example as this shop.
- One sealed book-wide repurchase % labeled as this book (90 closed days vs up to 24 months), never a fake all-time on a 90-day till. 8-buyer floor. Guests out. Unknown lifetime not in the denominator as one-time.
- A/B/C headcount + `$` + share of identified lifetime sales (cumulative ~80 / 15 / 5 of identified lifetime `$`). 8-buyer floor. Guests out. Unpaid 90 labeled as this book not all-time. No names. No product ABC. No industry 80/20 as a benchmark — compute this shop.

**Not this cook:** v416 ticket/wait/reach column. `#172` quiet-back `$`. Rank 8 whale / RFM flow. Rank 12 annual base (already shipped on the Growth peek). Rank 13 launch-week class. Admin door, name/email, Flow / Klaviyo export.

**Wait:** rank 1 then rank 12 (`customers-analytics.ts`). Rank 8 if LTV source rows still share `LtvBySourceRows.tsx`. Rank 13 if `ltv-flagship.ts` is still that writer.

## HOLD

Do not cook these until the fact is on the order, or until Marty takes the call named in the note.

- **Refund processing date.** Old `#152` / Wing-roro family. New: WUC444, LukeRotherfield (`processed_at`), Amin_Elmlegy (cancel hits today). Rank 10’s money-off name does not close this.
- **Admin exchange missing refund line.** Skengdo, 4 Jan 2025. Do not cook a “true gross” Shopify’s Admin exchange does not store.
- **Country.** Compete floor row 9. TS1122 shipping-country filter. Not an address, not inferred from currency.
- **Subscription checkout bit.** Not MRR. KOAN / Ronan.Cian stay HOLD. **REFUSE** Recharge / Skio.
- **Gift-card product flag.** cclumpner / LeonAndrew. **REFUSE** outstanding liability / adding gift-card sales into Total Sales / COGS.
- **Automatic discount titles.** Named **code** YoY is rank 9. The title is not.
- **Product title / SKU.** Live first-product empty stays. Native ABC **product** grade stays REFUSE.
- **Order rows past 24 months.** Day totals already go five years. 2023 **starters** stay HOLD. Rank 1 does not lengthen the crawl.
- **Product subtotal on the buyer dollar.** Period product-only exists on Orders. Per-buyer still includes shipping and tax.
- **Whale → Admin door.** `Whale ${i + 1}`. Marty. `#177` does not use the customer id on the desk.
- **Million-order crawl as shipped.** MagnumFonseca. Coverage **lines** are rank 3. `ORDER_FACT_MAX_DAYS_PER_RUN` and the ~100-order today cap stay.
- **POS drawer tape / per-location timezone / per-location hour.** FERALGR. `sourceName` is web/pos/shop, not location. One `Shop.ianaTimezone`.
- **VAT-out, Stripe/PayPal time zones, payout fees, bank match.**
- **Predicted spend tier / Shopify’s model.** Copying their scores is not on the order.
- **B2B company vs D2C, reversed quantity / return reason, bundle as a first-order class, parent checkout id.** Missing facts.
- **ShopifyQL / `read_reports`.** Live PARKED. Five-year day-level returning `$` on Goals stays HOLD.
- **Checkout / parent order id** for split orders. Rank 10’s same-day extra-order `$` does not invent it.
- **Matching POS guests who never gave an identity.** Operator 6 HOLD.

## REFUSE

Do not put these on a tab, a chip, or a listing line.

- COGS, P&L, gross profit, contribution, “Kept after margin” as a number, shipping-label cost (Karla_Robinson). Rank 5 **deletes** SAMPLE import BE. Do not replace it with an invented cost.
- Pixels, MTA, UTM path credit, “true ROAS,” ad-account CAC, NCPA, ncROAS. Rank 5’s Online-labeled ratio is a till split, not path credit. tilal’s Meta pixel is not a Mcfly OAuth.
- Sessions, visitors, conversion, checkout funnel, GA4 (watches1 / Syed_Noor).
- Amazon, Etsy, eBay, PayPal/Stripe as a second ledger.
- Recharge, Skio, Bold, Smartrr, Stay.ai MRR and churn.
- Slack or email product, Flow, Zapier, a sixth Reports tab. Copy the line (ranks 2, 4, 8, 10).
- Inventory, gift-card liability, VAT-stripped revenue, POS staff names (fpdev), Admin door / POS UI extensions (Thethief).
- Person exports, name, email, city, customer tags / order tags as stored strings, RFM customer list to Klaviyo.
- Industry benchmarks, and any example-store figure from the compete notes.
- Invented Mcfly stars, installs, or metrics.
- A Free plan, or a price that rises with orders or GMV.
- Post-purchase surveys, a profit agent, Snowflake, custom-report credits, ERP ingest.
- A paid-only toggle that recreates RomanRevenome’s `$9,781` lie.
- Native ABC **product** inventory (titles + cost). Customer 80/15/5 of the lifetime book is rank 14.

## Kill list

- Do not report the niche is owned. Do not write “enterprise-ready,” “only nits remain,” or “the last queue covered it.”
- Do not restart v408–v423, `#172` quiet-back, or `#177` whale. Do not list whale as a find. Do not put a new cook ahead of whale as the current craft.
- Do not recook old ranks 9–12 as if they were missing; they sit on this list as ranks 9, 11, 12, 13 (10 is the new Orders leftover that waits for 9).
- Do not open four craft agents on `mcfly-desk.css`, `app.goals.tsx`, `app.spend.tsx`, `customers-analytics.ts`, `orders-intelligence.ts`, `CustomersLtvSection.tsx`, or `DeskLane.tsx`. Rank 1 of this queue is one implementer. Do not start ranks 2+.
- Do not propose COGS, pixels, sessions, Amazon, Recharge, Slack product, a sixth tab, ShopifyQL, or Live unpark as the enterprise leap.
- Do not Fly this plan. Do not Fly a nit. A stylesheet tweak that leaves unknown lifetime in first-time `$`, or leaves Settings selling “the whole desk is already on,” is not PASS and does not deploy.
- Do not start this rank 1 while whale is the named next ship.

## How to run rank 1 (when the gate opens)

1. Wait for Reviewer PASS + merge + Fly of `cursor/whale-ticket-5bc6` (`#177`, `fad2924`), **or** a Marty skip. That Fly is **v424**.
2. Stamp the scoreboard: next significant ship is **this** rank 1 sentence — **Buyer-life honesty.** One Fly after **this** Reviewer PASS.
3. Cut `cursor/buyer-life-honesty-5bc6` from the then-current `origin/cursor/spend-trust-recurring`.
4. One implementer. One Reviewer. Do not start rank 2.

A Fly requires a new merchant sentence. Copy nits, SoT stamps, and re-audits of a hole already on the tip do not deploy.
