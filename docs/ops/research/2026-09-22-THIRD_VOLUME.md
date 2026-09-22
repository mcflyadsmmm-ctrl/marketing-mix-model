# Volume desk — enterprise third pass — 2026-09-22

**Role:** Saturday operator of a **$5M–$10M** Shopify store. Phone Admin iframe ~390px / `max-width: 36rem`. Six-figure months. Quiet day at $0. Last year not on file. Unpaid 90 closed days vs a till that already named Overview (v420) — this hunt is **other boards**. A second seat on buyer ops, not the founder morning strip.

**Tip this note is about:** `origin/cursor/spend-trust-recurring` at `d2017c1` (docs stamp). Fly **v423** / merge `8938134` (`#172` quiet-back dollars). Live **PARKED**. Rank 8 of `docs/plans/2026-09-22-enterprise-next-queue.md` (whale ticket / RFM) is the named next ship. Do not recook it. Do not recook `#172`. Snowdevil `$68,457` does not prove a six-figure number fits.

**Painted IA:** Overview · Orders · Customers (Growth / LTV chips) · Spend · Goals.

**This note is not a finish.** Reciting v408–v423, or ranks 8–12, as enterprise-ready is FAIL.

## Floor — recycling these is FAIL

File-level depth on a leftover is allowed. Restating the merchant sentence is not.

| Already named | Why it is not a new find |
| --- | --- |
| v408–v417 (open-lane LTV through Goals honesty) | Tip. Do not recook. |
| v418 phone Goals stack + 36rem wrap of Goals / Orders / Customers / Growth heroes + CPA `rangeLabel` | Phone hunt is **leftover** boards: LTV, Spend explorer, CPA windows’ **today**, Settings, Orders **ledger**. |
| v419 Spend pair / `CopySpendPair` / explorer 0× / Online sales split | Copy hunt is Orders / LTV / Goals year. |
| v420 Overview till 90 vs 24 + Spend first-fold today cap | Hunt **other** boards. Unlock banner still Customers-only — named leftover, not a find. |
| v421 Goals year clock + Goals MTD truncated today | Thin last year on **Goals year** is owned. Hunt other boards. |
| v422 DeskLane `defaultOpen` / hash | Mix-close → weekday fold is a named leftover nit. |
| `#172` / v423 quiet-back `$` + copyable first-time `$` | Merged. `firstTimeSlackInsight` exists. Rank 7 is not missing. |
| Rank 8 whale ticket / 430px four-column watchlist | Queued. Skip unless a **different** board. |
| Rank 9 Orders mix (1st/2nd/3rd/4th+ `$`, tax/shipping, hour, `$0` reship) | Skip. Weekly **ledger** is a different grain. |
| Rank 10 guest `$` + Other source names | Skip. |
| Rank 11 Overview buyer-age + new vs returning vs last quarter | Skip. Customers first fold is a different tab. |
| Rank 12 compete 4/6/7/8 + launch-week **class** | Skip. Open-lane triangle heat is a different grain. |
| NEXT_VOLUME 1–10 (Goals 720px table, till 24 vs 90, stub July, two month closes, copy Total ROAS, reach-now copy, whale ticket, Spend/Goals today cap, `$80k` ceiling, Growth first-time copy) | Cooked or queued. Do not restated. |
| Compact `PeriodControl` YTD on live Orders / Customers | Live mounts `showPeriod={false}`. Not a live-admin hole. |
| Payback day-0 `{ revenue: 0 }` as the whole find | Named leftover. This note is till D90 vs flagship 8-mature. |
| `site/pricing.html` 24 months | Nit per megaprompt. |

## How to read a row

**PASS** = one cook, stored book, no new tab, no new scope, no lie.  
**HOLD** = needs a field or a Marty call.  
**REFUSE** = do not ship.

---

## Gaps

### 1. On my phone I cannot read first 30 / 90 / first year — LTV still three-up at 36rem — PASS

**Merchant:** “I opened Customers → LTV on my phone. First 30, first 90, and first year sit three across. A six-figure first year is a sliver. Goals and Orders already stack. This board does not.”

**Tab:** Customers → LTV, Depth pack (`LtvFlagshipBoard`). Open after v422 hash / `?panel=depth`. Not Overview glance. Not the v418 Goals / Orders / Customers / Growth heroes.

**Files:**

- `app/app/components/LtvFlagshipBoard.tsx` — windows grid is `mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead` (line 217). Outer section is `mcfly-book mcfly-depth-flag` (94–96), **not** `mcfly-score--orders-hero` / `--customers-hero` / `--growth-hero`.
- `app/app/components/CustomersLtvSection.tsx` — `<LtvFlagshipBoard` mounts inside `CustomersLtvDepth` (432–437). `app/app/routes/app.customers.tsx` puts that pack in the Depth fold (249–266).
- `app/app/styles/mcfly-desk.css` — `.mcfly-kpi-grid` is always `repeat(3, minmax(0, 1fr))` (3213–3216). Stack to one column is `@media (max-width: 430px)` (13061–13071). The v418 `@media (max-width: 36rem)` wrap (21830–21878) lists Goals table + month stack + **orders / customers / growth** peeks only. LTV is absent.
- `app/app/lib/desk-phone-layout.test.ts` — 36rem lock names Goals stack, Orders / Customers / Growth heroes, CPA `rangeLabel` (110–151). It does not lock an LTV wrap.

**Today:** At the named iframe (`max-width: 36rem` = 576px) the three LTV tiles stay 3-up until 430px. A `$417,392` first-year cell is one-third of that rail. Snowdevil `$68k` fits. The 430px stack is not the v418 36rem cook.

**Why a $5M Saturday cares:** Buyer ops on a phone is the LTV stand-up. Unreadable first-year dollars is a desktop product.

**Why it is not a nit:** Not padding. v418 named the wrap list. This board was not on it. Rank 8 is the whale **four-column** row, a different grid.

**PASS.** Wrap 30 / 90 / first year under 36rem the way Goals / Orders / Growth already wrap. Dollar may wrap. Missing window stays —. Never a fake `$0`. Do not recook whale 430px.

---

### 2. The open LTV triangle is a nowrap heat table — six-figure first year is off-screen — PASS

**Merchant:** “Customers → LTV shows first-order months by 30 / 90 / first year. On my phone I swipe sideways before I can read this year’s first-year dollars. A blank cell is honest. The dollars I can act on are off the iframe.”

**Tab:** Customers → LTV open lane (`CustomersLtvWindows`), not rank 12 launch-week class, not the whale watch.

**Files:**

- `app/app/components/CustomersLtvSection.tsx` — `CustomersLtvWindows` (326–392) mounts `<LtvWindowTriangle` on the open LTV lane (388–392). `app.customers.tsx` 220–225: DeskLane rank `next`, not the Depth fold.
- `app/app/components/LtvWindowTriangle.tsx` — `RevenueTable` (209–266) and the come-back table use `mcfly-depth-tablewrap` + `mcfly-depth-table`. Headers: First order · 30 days · 90 days · First year (226–231). Cells `formatCurrency(money)` when sealed.
- `app/app/styles/mcfly-desk.css` — `.mcfly-depth-table th, td { white-space: nowrap }` (16766–16772). Wrap is `overflow-x: auto` (16751–16757). Parent `.mcfly-desk` keeps `overflow-x: hidden`. The 36rem wrap block does not name `.mcfly-depth-table`.

**Today:** Overview year cards and Goals month stack wrap at 36rem. This heat table does not. `FLAGSHIP_MAX_MONTH_ROWS = 14` (`ltv-flagship.ts` 39–40) is a 14×4 six-figure grid on a 390px iframe.

**Why a $5M Saturday cares:** They compare first-order months on Saturday. A swipe table is a screenshot, not a desk.

**Why it is not a nit:** Not rank 12 (launch-week **class**). Not whale 430px. The primary LTV grain on the open lane is unreadable at the iframe the megaprompt named.

**PASS.** Stack or wrap 30 / 90 / first year under 36rem. Sealed six-figure dollars stay on screen. Unsealed stays — / hatch, never `$0` / `0%`. Do not add a sixth tab.

---

### 3. The Orders weekly ledger is eight nowrap columns — this period’s six-figure week is off-screen — PASS

**Merchant:** “I opened Orders to see this period week by week. Sales, AOV, discount, codes, and returns are a sideways rail. I cannot read a six-figure week without swiping. Mix by 1st/2nd/3rd is a different question.”

**Tab:** Orders, weekly ledger below the typical-order first fold. Not rank 9 mix.

**Files:**

- `app/app/components/OrdersIntelligence.tsx` — `OrdersLedgerTable` (417–439): eight columns Week · Orders · vs prior · Sales · AOV · Discount · Codes · Returns. `formatCurrency(week.sales)` / `week.aov` (483–487).
- `app/app/styles/mcfly-desk.css` — `.mcfly-orders-ledger__table th, td { white-space: nowrap }` (15178–15184). Wrap is `overflow-x: auto` (15166–15170). Not in the v418 36rem list.

**Today:** Orders **peeks** wrap at 36rem (v418). The ledger did not. Rank 9 is 1st/2nd/3rd/4th+ **dollars** and tax/shipping — not this Monday-start table.

**Why a $5M Saturday cares:** Week-close on a phone is “did this week hold.” A six-figure Sales cell off-screen is not that close.

**Why it is not a nit:** Eight-column nowrap of Shopify Total Sales. Snowdevil weeks hide it. Not the mix cook.

**PASS.** Under 36rem, keep Week + Sales (+ AOV) on screen; park Codes / Returns in the existing drill. Missing prior stays —. Never a fake `$0`. Do not recook rank 9.

---

### 4. Spend explorer still offers This year / 1 year / All on a 90-day unpaid book — PASS

**Merchant:** “I tapped This year on Spend. The till on Overview already said 90 closed days. The explorer still offers 1 year and All (~3 years). The chart is a 90-day slice labeled as the year.”

**Tab:** Spend explorer chips. Not Overview coverage. Not the Customers unlock banner.

**Files:**

- `app/app/lib/spend-explorer.ts` — `RANGE_PRESETS` includes `YTD`, `1y`, `All` (100–107). `EXPLORER_RANGE_OPTIONS` labels them “This year” / “1 year” / “All” (119–127). Host path: YTD = Jan 1 of `endStart.getFullYear()` (403–406); `1y` = −364 days labeled “Last 365 closed days” (407–409); `All` = −1094 days labeled “All closed days” (411–414). Shop-TZ path: `1y` takes 365 closed days, `All` takes 1095 (484–487).
- `app/app/lib/desk-spend-stack.server.ts` — `resolveExplorerWindow(..., { timeZone: deskTz })` (481–485). Control union also loads prior-YTD → YTD (487–498).
- `app/app/components/SpendExplorer.tsx` — paints every `EXPLORER_RANGE_OPTIONS` chip (745–758). No `orderBookDepth` / unpaid-90 disable.
- `app/app/lib/live-unpark.ts` — `LIVE_UNPAID_INGEST_DAYS = 90` (23). Do not change.

**Today:** v420 named Overview / book tills. Explorer chips still sell a year and ~3 years. Unpaid ingest stays 90 closed **order rows**. Day totals may go further when reports are on — the chips do not say which.

**Why a $5M Saturday cares:** They will judge YTD Total ROAS off a 90-day slice, then dump `$39` when Shopify Admin’s year disagrees.

**Why it is not a nit:** Not a synonym on the Overview till. These chips are the window they pick. Tests still ship “1 year” / “All” as first-class ranges.

**PASS.** Unpaid: name 90 closed days on YTD / 1y / All, or hide 1y / All until paid. Paid: keep up to 24 months of order rows. Empty last year stays not on file, never `$0`. Do not lengthen the crawl. Do not change the 90.

---

### 5. CPA still sells YTD and Last 28 through today on that same 90-day book — PASS

**Merchant:** “Spend → CPA has a YTD chip. Last 28 is through this incomplete Saturday. Overview already told me the unpaid book is 90 closed days. CPA did not.”

**Tab:** Spend → Cash CPA cards + explorer. Not Spend first-fold Sales (v420).

**Files:**

- `app/app/lib/cpa-desk.ts` — `CPA_EXPLORER_RANGES` = `this_month`, `last_28`, `90d`, `ytd` (29–33). Labels include `YTD` (44–49). Comment: explorer lookback is **YTD ∪ last 90** (193). `resolveCpaDeskWindows` sets `explorerStart = min(ytd, last90)` (202–213). `resolveLastNDays` is “Rolling last-N calendar days **through today (inclusive)**” (140–157).
- `app/app/lib/cpa-desk.server.ts` — always builds `explorerRanges.ytd` (313–318). Loads `todaySalesTruncated` (217, 332) and does **not** pass it into `CpaWindowCards` / `CpaExplorer`.
- `app/app/components/CpaExplorer.tsx` — paints every range including `ytd` (283–300).
- `app/app/components/CpaWindowCards.tsx` — props are windows / selectedId / onSelect only (17–25). No truncated-today line.

**Today:** v418 kept CPA `rangeLabel` visible at 36rem. It did not name the unpaid 90, and it did not stop Last 28 from including incomplete today. Spend explorer **excludes** today (`closedDayEnd`, `spend-explorer.ts` 167–168). CPA **includes** it. Two clocks on one tab.

**Why a $5M Saturday cares:** They will read This-month CPA off a partial Saturday and a 90-day YTD, then change spend.

**Why it is not a nit:** Not the v418 date chrome. A year chip plus through-today Last 28 on an unpaid 90 is a coverage lie the Overview till already stopped telling.

**PASS.** Unpaid YTD names 90 closed days or stays off. Last 28 / This month either exclude incomplete today or say so. Empty spend stays —. Never `0×`. Do not change the 90.

---

### 6. Settings and Goals still say full-access trial / “the whole desk is already on” — the unpaid book is 90 days — PASS

**Merchant:** “Settings says 7-day full-access trial, Customer LTV and payback, Full-year Goals board. Goals says the whole desk is already on. Overview already told me order rows stop at 90 closed days until I pay.”

**Tab:** Settings billing block + Goals muted line. Not Customers `UnlockFullHistoryBanner`. Not Overview till.

**Files:**

- `app/app/lib/entitlements.ts` — `DESK_FEATURE_BULLETS` (56–64): “Customer LTV and payback on your store”; “Full-year Goals board”; “7-day full-access trial, then $39 per store / month”.
- `app/app/routes/app.settings.tsx` — hero “$39 per store / month after a 7-day full-access trial” (580–581); bullets map (583–587); `{BILLING_HONESTY.flat} {BILLING_HONESTY.cancel} {TRIAL_VS_VIEW}` (588–589).
- `app/app/lib/sample-live-handoff.ts` — `TRIAL_VS_VIEW` = “The whole desk is already on. Start 7-day trial in Settings is Shopify billing — Sample | Live is a view, not a plan.” (36–37).
- `app/app/routes/app.goals.tsx` — paints `{TRIAL_VS_VIEW}` when `showStartTrial` (839–843).
- `app/app/lib/billing-flag.server.ts` — detail “7-day full-access trial, then $39 … for the **whole desk**” (60–62).
- `app/app/lib/mer-dashboard.server.ts` — “Trial and paid both compute it.” (1271) before `buildTillLtvSummary`.

**Today:** v420 fixed tills / Overview coverage. Settings, Goals, and the Shopify plan picker still describe a paid book during the 7-day trial. Unpaid ingest stays 90 (`LIVE_UNPAID_INGEST_DAYS`). One plan `$39` is correct. “Full-access” / “whole desk already on” is the leftover.

**Why a $5M Saturday cares:** They install, run Goals YTD and LTV first year, then learn the crawl stopped at 90. That is a billing lie, not a copy nit.

**Why it is not a nit:** Megaprompt named Settings / upgrade bounce vs the 90. The Customers banner is the known leftover. These lines never mount it.

**PASS.** Unpaid / trial copy: 90 closed days of order rows, paid = up to 24 months, `$39` after 7 days, one plan. Keep Sample | Live as a view. Do not add a history SKU. Do not unpark Live. Do not change the 90.

---

### 7. First 90 on LTV is two numbers — till averages young months; flagship waits for 8 mature; CPA payback uses the till — PASS

**Merchant:** “Customers → LTV says first 90 is `$X` from the till. The 30/90/first-year tiles wait until eight buyers have lived the window. Spend payback interpolates the till. I cannot tell which first 90 I should buy against.”

**Tab:** Customers → LTV open lane + Spend CPA payback. Not payback day-0 as the whole find.

**Files:**

- `app/app/lib/till-ltv.server.ts` — `customerWeightedAvgRevenue` sums every `customers > 0` cohort (69–82). `summarizeTillLtvFromCohorts` averages `revenueD90` with **no** `matureForWindow` (123–130). `historyLimited` only nulls **D365** (131–134). `paybackDays = cashPaybackDays(cashCac, avgRevenueD30, avgRevenueD90, avgRevenueD365)` (162–167).
- `app/app/components/CustomersLtvSection.tsx` — open-lane hero is `ltv.avgRevenueD90` “First 90 days on file” (346–357). Slack is `ltvPeekSlackInsight` (297). Triangle cells wait for `FLAGSHIP_MIN_MATURE`.
- `app/app/lib/ltv-flagship.ts` — `FLAGSHIP_MIN_MATURE = 8` (38). `matureForWindow` keeps buyers with `daysBetween(firstOrderedAt, asOf) >= days` (172–178). `windowRevenue` returns null under that floor (250–258).
- `app/app/lib/cpa-desk.server.ts` — `cpaPaybackForWindow` passes `base.avgRevenueD30` / `D90` (till) into `cashPaybackDays` (162–176).
- `app/app/lib/cash-payback.ts` — interpolates those anchors (45–74). Day-0 `$0` is already named; the leftover is **which D90**.

**Today:** A trial shop’s newest month is inside the till D90 average. Flagship withholds that month until eight buyers have lived 90 days. Spend prints a payback day from the young average. SAMPLE Snowdevil seals both — not this store.

**Why a $5M Saturday cares:** They will scale a channel off a payback day that LTV’s own tiles would still dash.

**Why it is not a nit:** Two first-90 formulas on the painted desk. Not a tooltip. Not recooking day-0 interpolation.

**PASS.** One first-90: mature-for-window, 8-buyer floor, guests out. Till hero, flagship tiles, and CPA payback read it. Young months stay — , never `$0`. Refuse causal / ads-manager payback. Do not change the 90.

---

### 8. A second seat cannot copy this month’s Goal / Actual / Prior — Goals still copies the habit line — PASS

**Merchant:** “Buyer ops asked for this month’s plan vs Shopify Total Sales vs last year. I can copy ‘typical order around $84. Returning buyers carry 61%.’ I cannot copy Goal / Actual / Prior off the year stack.”

**Tab:** Goals, `ThisMonthPlanStack` on the first fold. Not the founder morning strip. Rank 7 owns Growth first-time `$`.

**Files:**

- `app/app/routes/app.goals.tsx` — `ThisMonthPlanStack` (1490–1558) paints Goal, Shopify Total Sales, Returning `$`, Prior. No `CopyMorningSentence` / `copyDeskText` / `SlackInsightCard`.
- `app/app/components/OrderHistoryGoalsBoard.tsx` — `CopyMorningSentence` wraps `morningSentence({ history: "ready", goalLine })` (318–323) — habit typical + returning share + optional goal **line**, not the stack.
- `app/app/lib/morning-habit.ts` — `composeReadySentence` is typical + returning share + `safeGoalLine` (101–112). Unsafe `$0` / last-year lines are stripped.
- `app/app/components/MorningHabitStrip.tsx` — `CopyYtdSales` exists (76+). Only Overview year cards call it (`OverviewYoyCards.tsx`). Goals year does not.

**Today:** v418 put Goal / Actual / Prior on the phone. v420 made YTD copyable on Overview. The year stack still has no clipboard.

**Why a $5M Saturday cares:** Planning Slack is “goal vs this month vs last September.” They currently screenshot a stack. Last year missing must copy as not on file, not `$0`.

**Why it is not a nit:** The numbers are already on screen. Rank 7 is first-time `$` on Growth. This is Goals year.

**PASS.** One copy control on `ThisMonthPlanStack`: Goal, Shopify Total Sales Actual, Prior when on file. Missing last year copies nothing (or “not on file”) — never `$0`. Empty goal copies nothing. Do not invent a Slack product.

---

### 9. Orders already writes typical vs Shopify’s average. Nobody on that tab can copy it — PASS

**Merchant:** “Stand-up is ‘typical order around `$X`. Average is `$Y`.’ That sentence is the Orders greeting. There is no copy. Overview’s typical-order poster is a different tab.”

**Tab:** Orders first fold. Second seat, not the founder strip.

**Files:**

- `app/app/lib/orders-first-viewport.ts` — `ordersOperatorGreeting` (79–98) already returns `Typical order around {median}. Average is {mean}. Shopify Analytics Orders is the average order.`
- `app/app/components/OrdersFirstViewport.tsx` — paints `{greeting}` (87–128). No `copyDeskText`.
- `app/app/lib/shareable-insights.ts` — `typicalOrderCard` (239–249) is “Typical order is `$X` — the middle order, not Shopify’s average.” Mounted on Overview (`app._index.tsx`) and inside Customers **Depth** fold (`app.customers.tsx` 267), not on Orders.

**Today:** A teammate without a Meta login still screenshots Orders. Quiet Saturday with no orders already greets “No orders in this window yet.” The missing clipboard is the hole.

**Why a $5M Saturday cares:** Typical vs average is why they left Shopify Analytics. The sentence is the product.

**Why it is not a nit:** Not rank 9 mix. Not the morning founder line. One sealed copy from a string the board already built.

**PASS.** Copy `ordersOperatorGreeting` when typical is on file. Never copy `$0`. Never copy pending as finished. Do not copy last year that is not on this tab.

---

### 10. LTV already paints 30 / 90 / first year. The Slack line is still “a new buyer is worth `$X` in the window” — PASS

**Merchant:** “I need to paste first 30, first 90, and first year. I can copy ‘a new buyer is worth `$187` in the first 90 days.’ I cannot copy the three windows.”

**Tab:** Customers → LTV. Rank 7 owns Growth first-time `$`. Whale Slack is rank 8.

**Files:**

- `app/app/components/LtvFlagshipBoard.tsx` — three window tiles (216–268) with `formatCurrency(point.revenue)` / come-back. No copy control.
- `app/app/components/CustomersLtvSection.tsx` — `SlackInsightCard insight={worthSlack}` (363) from `ltvPeekSlackInsight` (297). Open-lane hero is till D90 only (346–357).
- `app/app/lib/shareable-insights.ts` — `ltvPeekSlackInsight` (474–482) copies one peek (90 then 30; year off when `historyLimited`). `buildShareableInsights` kinds are returning · typicalOrder · daysToSecond · ltvPeek (307–312). No 30/90/365 trio.

**Today:** Depth fold has the three tiles. Open lane has one till number + one Slack peek. A six-figure first year never reaches the clipboard.

**Why a $5M Saturday cares:** Buyer ops Slack is the three windows. One peek trains a Snowdevil first-90.

**Why it is not a nit:** Numbers are already on the flagship board. The job is the clipboard, not a new metric.

**PASS.** Copy sealed 30 / 90 / first year when each window has mature buyers. Unsealed window omitted, never `$0`. History-limited year omitted. Guests out. 8-buyer floor. Do not copy payback.

---

### 11. Spend coverage is host-local days; the shop clock and explorer are not — PASS

**Merchant:** “Saturday evening here is already Sunday on the coverage strip. Explorer ended yesterday on this shop’s clock. CPA Last 28 still includes today. I cannot tell which day is missing spend.”

**Tab:** Spend coverage strip + explorer + CPA. Overview clock is shop-local (v415) — do not recook it.

**Files:**

- `app/app/lib/spend-coverage.server.ts` — `startOfLocalDay` = `new Date(d.getFullYear(), d.getMonth(), d.getDate())` (22–24). Live path `windowEnd = startOfLocalDay(now)` (96–97) walks host calendar keys (124–131). SAMPLE path is **UTC** (`startOfUtcDay` / `utcDayKey`, 50–77). `SPEND_COVERAGE_DAYS = 90` (5).
- `app/app/routes/app.spend.tsx` — `todayKey` is shop IANA when set (425–429). Strip filters `d.dateKey !== todayKey` (866–875, 873–882). Host Sunday vs Denver Saturday: the filter misses the host cell, and a closed shop-local day can drop.
- `app/app/lib/spend-explorer.ts` — `closedDayEnd` excludes incomplete today (167–168). TZ path uses `listRecentClosedShopLocalDays` (434–436).
- `app/app/lib/cpa-desk.ts` — `resolveLastNDays` through **today inclusive** (140–157).

**Today:** Three Spend clocks. Overview already learned shop-local. Coverage still uses Fly host `Date` (and UTC on SAMPLE). A quiet Saturday empty cell is the wrong day.

**Why a $5M Saturday cares:** They will paste Sunday spend into Saturday, or think they missed a day that is still open.

**Why it is not a nit:** Not a color on the strip. v415 named Overview. This is Spend’s leftover host `Date` (megaprompt Q14).

**PASS.** Coverage, explorer, and CPA last-N use the same shop IANA closed-day keys. Incomplete today stays out of “closed days,” or is named open. SAMPLE UTC vs live host is one clock, not two. Empty spend stays empty, never `$0`. Do not change the 90.

---

### 12. Overview and Goals MTD name the ~100-order today cap. Orders typical, Customers returning `$`, and CPA do not — PASS (line) / HOLD (crawl)

**Merchant:** “It is 2:55pm. Shopify Admin is still ringing. Overview warns live today capped at ~100 orders. I am on Orders, Customers, and CPA. Those first numbers look finished.”

**Tab:** Orders first fold, Customers first fold, Spend CPA This month / Last 28. Spend first fold already discloses (`spendFirstFoldSalesHint`, v420). Goals MTD already discloses (v421).

**Files:**

- `app/app/routes/app.orders.tsx` — `todaySalesTruncated` goes to `DeskBookPage` banners (94–95). `OrdersFirstViewport` (see 103+) does not take the flag. Greeting / typical / average treat the window as sealed.
- `app/app/routes/app.customers.tsx` — same banner pass (172–173). `CustomersFirstViewport` paints `hero.amount` returning / new dollars (147–157) with no incomplete-today hedge.
- `app/app/lib/customers-first-viewport.ts` — `buildCustomersHero` (173–189) returns returning `$` when `> 0`. No truncated bit.
- `app/app/lib/cpa-desk.server.ts` — loads `todaySalesTruncated` (217, 332). `CpaWindowCards` / `CpaExplorer` never receive it (`app.spend.tsx` 1338–1360).
- `app/app/components/SpendExplorer.tsx` — no `todaySalesTruncated`. Explorer ends yesterday (`closedDayEnd`) with no “today not in this chart” line, so the last bar reads as the current day.

**Today:** Quiet certified `$0` Saturday is honest on Overview’s clock. A **busy** six-figure Saturday is hundreds of orders before close. The live top-up is a page cap. Million-order **history** stays HOLD.

**Why a $5M Saturday cares:** They will believe typical ticket, returning `$`, and This-month CPA off an undercounted today, then watch the number jump when the day seals.

**Why it is not a nit:** Overview already wrote the sentence. These first-fold / CPA numbers still sell the short today as the period.

**PASS** the disclosure on Orders typical, Customers returning `$`, and CPA This month / Last 28 when `todaySalesTruncated`. Explorer should say today is not in the closed-day chart. **HOLD** raising the live page cap. Do not unpark Live.

---

### 13. Customers first fold is this window’s returning vs new. Last year is not on file and never said — PASS

**Merchant:** “Returning dollars this month are `$417,392`. Last September is not on this book. Overview YoY can say that. Customers just prints this window.”

**Tab:** Customers first fold (default chip). Not Overview YoY. Not Goals year. Not rank 11 Overview buyer-age.

**Files:**

- `app/app/lib/customers-first-viewport.ts` — `CUSTOMERS_FIRST_LANE_LABEL` = “Returning dollars vs new” (24). `customersOperatorGreeting` (140–167) is this-window percents only. `buildCustomersHero` (173–189) returns `amount: book.returningSales` with `counterpartAmount` = new `$` this window. No prior period.
- `app/app/components/CustomersFirstViewport.tsx` — hero + “New {money}” sub (147–157). No last-year pair. No “not on file.”
- Rank 11 owns Overview new `$` vs returning `$` vs **same quarter last year**. This tab never mounts that pair.

**Today:** `$417,392` returning with a thin last year looks like a finished mix. Overview can dash last year. Customers cannot.

**Why a $5M Saturday cares:** They will brief “returning is fine” off a 90-day unpaid window with no last September.

**Why it is not a nit:** Six-figure returning `$` without last year is the thin-last-year leftover the megaprompt named on boards **other than** Overview YoY and Goals year.

**PASS.** When last year is not on file, say so next to returning vs new (dash / not on file). Never paint `0%` YoY. Guests out. Do not recook rank 11 on Overview.

---

### 14. Buyer ops cannot copy returning vs new on the Customers first fold — the posters live in Depth — PASS

**Merchant:** “I am on Customers, not Overview, not the Depth fold. Returning vs new is the first sentence. There is no copy. The shareable cards are behind Who the dollars sit with.”

**Tab:** Customers first fold. Rank 7 owns Growth first-time `$`.

**Files:**

- `app/app/components/CustomersFirstViewport.tsx` — greeting + hero (144–157). No copy control.
- `app/app/routes/app.customers.tsx` — `<ShareableInsightCards` sits inside Depth `DeskLane` `fold` `rank="more"` (249–267). `defaultOpen={shotMode || panel === "depth"}`.
- `app/app/lib/shareable-insights.ts` — `returningCard` already builds `Returning buyers carry {pct}% of sales ({money})` (209–236). That string is not on the first fold.

**Today:** Founder Overview posters can copy returning `$`. The second seat on buyer ops works Customers. They screenshot.

**Why a $5M Saturday cares:** Returning vs new is the Monday mix. Clipboard on a fold they do not open is not the job.

**Why it is not a nit:** The sentence already exists. The mount is the wrong lane after v422 taught hash/defaultOpen.

**PASS.** Copy returning vs new on the Customers first fold when both dollars seal. Never copy `$0`. Never copy pending. Do not move the Overview posters. Do not recook rank 7.

---

## Quiet Saturday (other boards, after v415 / v421)

Overview’s clock: quiet day is `$0`, last year not on file is not loading. **Do not recook.**

| Board | Quiet `$0` today | Last year missing |
| --- | --- | --- |
| Spend explorer | Ends yesterday (`closedDayEnd`). Last bar reads as the current day (gap 12). | YTD / 1y / All chips still offered on a 90-day book (gap 4). |
| Spend coverage | Host-local cell vs shop `todayKey` (gap 11). | N/A (90-day strip). |
| CPA This month / Last 28 | Through **today inclusive** with no truncated line (gaps 5, 12). | YTD chip (gap 5). |
| LTV till D90 | Young current month in the average (gap 7). | First year dashed only when `historyLimited`, not when unpaid is 90. |
| LTV triangle | Unsealed hatch (honest). | No last-year pair (not this hunt’s YoY). |
| Customers first fold | Returning `$` includes a short today (gap 12). | No last-year sentence (gap 13). |
| Orders typical | Includes a short today (gap 12). | N/A. |
| Goals year stack | v421 named stub months / certified `$0`. | Prior — (honest). Copy missing (gap 8). |

---

## Phone leftover (after v418)

| Surface | 36rem / ~390px | Verdict |
| --- | --- | --- |
| Goals month stack + year table | Wrapped at 36rem | Tip. Not this note. |
| Orders / Customers / Growth peeks | Wrap at 36rem | Tip. |
| CPA window `rangeLabel` | Kept visible | Tip. |
| LTV flagship 30/90/365 | 3-up until 430px; no 36rem wrap | Gap 1. |
| LTV triangle / depth table | `nowrap` + swipe | Gap 2. |
| Orders weekly ledger | 8-col `nowrap` | Gap 3. |
| Whale watch 4-col at 430px | Rank 8 | Skip. |
| Spend explorer chips | Wrap at 36rem (CSS 19337–19346) | Readable; the **labels** YTD / 1y / All are gap 4. |
| Settings billing bullets | No 36rem wrap named | Fold into gap 6 (copy vs 90), not a separate pad cook. |

`desk-phone-layout.test.ts` still does not lock LTV or the Orders ledger. Snowdevil `$68,457` will not catch a six-figure LTV / ledger cell.

---

## Refused

- **Whale → Admin door.** Stored customer id. Marty. HOLD, not a cook.
- **Name, email, city.** REFUSE.
- **Million-order crawl as shipped.** HOLD. Coverage **lines** are gaps 4–6 and 12. Do not change `LIVE_UNPAID_INGEST_DAYS = 90`.
- **COGS / P&L / “Kept after margin.”** REFUSE.
- **Slack / email product, Flow, a sixth tab.** REFUSE. Copy the line (gaps 8–10, 14).
- **Sessions, pixels, MTA, “true ROAS,” Amazon, Recharge MRR.** REFUSE.
- **Unpark Live. Partner Submit. ShopifyQL wait queue.** REFUSE.
- **Recooking v408–v423, `#172`, ranks 8–12, NEXT_VOLUME 1–10, Unlock-banner-only, whale 430px, Mix-close weekday, YTD % look-ahead, typed `$0` as —.** FAIL if listed as new.
- **Compact `PeriodControl` on live Orders / Customers.** Not mounted (`showPeriod={false}`).
- **Online ROAS denominator still all typed spend.** v419 leftover (`formatOnlineRoasLine` 109–139). File-level; not a new volume sentence here.
- **`site/pricing.html` 24 months.** Nit.

---

## Already-ranked skips (do not re-queue as this note’s top)

| Rank / ship | Sentence skipped |
| --- | --- |
| 8 | Whale 1 ticket hidden; watchlist stops at 8; 430px four-column; RFM still photo |
| 9 | This month `$` by 1st/2nd/3rd/4th+; tax/shipping; hour; `$0` reship |
| 10 | Guest checkout as dollars; Other source names; POS vs online returns |
| 11 | Overview buyer age; new `$` vs returning `$` vs same quarter last year |
| 12 | Compete rows 4/6/7/8; launch-week **class** |
| `#172` / v423 | Quiet-then-back `$` + copyable first-time `$` |

---

## Walked (read-only)

Overview first viewport + YoY copy (floor). Orders first fold + weekly ledger. Customers first fold, LTV windows, LTV depth flagship / triangle, Growth copy (shipped). Spend explorer chips + compare line + coverage strip + CPA cards / explorer / payback. Admin Goals year stack + `TRIAL_VS_VIEW`. Settings billing bullets. `mcfly-desk.css` 36rem / 430px / depth table / ledger. `desk-phone-layout.test.ts`. `till-ltv.server.ts` vs `ltv-flagship.ts`. `spend-coverage.server.ts` host `Date` vs shop IANA. `LIVE_UNPAID_INGEST_DAYS`. Copy: `CopyMorningSentence`, `CopySpendPair`, `CopyYtdSales`, `SlackInsightCard`, `shareable-insights.ts`.

Did not edit `app/`. Did not Fly. Did not unpark Live. Did not change the 90. Did not open a PR.

---

## Fourteen new sentences (quota ≥ 10)

1. On my phone I cannot read first 30 / 90 / first year — LTV still three-up at 36rem.
2. The open LTV triangle is a nowrap heat table — six-figure first year is off-screen.
3. The Orders weekly ledger is eight nowrap columns — this period’s six-figure week is off-screen.
4. Spend explorer still offers This year / 1 year / All on a 90-day unpaid book.
5. CPA still sells YTD and Last 28 through today on that same 90-day book.
6. Settings and Goals still say full-access trial / “the whole desk is already on” — the unpaid book is 90 days.
7. First 90 on LTV is two numbers — till averages young months; flagship waits for 8 mature; CPA payback uses the till.
8. A second seat cannot copy this month’s Goal / Actual / Prior — Goals still copies the habit line.
9. Orders already writes typical vs Shopify’s average. Nobody on that tab can copy it.
10. LTV already paints 30 / 90 / first year. The Slack line is still “a new buyer is worth `$X` in the window.”
11. Spend coverage is host-local days; the shop clock and explorer are not.
12. Overview and Goals MTD name the ~100-order today cap. Orders typical, Customers returning `$`, and CPA do not.
13. Customers first fold is this window’s returning vs new. Last year is not on file and never said.
14. Buyer ops cannot copy returning vs new on the Customers first fold — the posters live in Depth.

The desk is not enterprise-ready. Rank 8 (whale ticket) stays the named next ship until the third-pass synthesizer re-ranks. This list is what a `$5M` Saturday still cannot do after v423.
