# Third craft holes — 2026-09-22

**Tip read:** `origin/cursor/spend-trust-recurring` at `d2017c1` (Fly v423 stamp). App tree is that commit. Merge `8938134` / `#172` quiet-back dollars is **on the tip** — not a find. v422 was DeskLane open (`3608683` / merge `b80d263` / `#171`).
**Floor:** `docs/ops/SCOREBOARD.md` on this tip (next ship = rank 8 whale only) · `origin/cursor/third-pass-megaprompt-5bc6:docs/ops/MEGAPROMPT_ENTERPRISE_THIRD.md` · `origin/cursor/next-cook-queue-5bc6:docs/plans/2026-09-22-enterprise-next-queue.md` (#165 ranks 8–12; rank 7 is shipped).
**Verdict:** After v423 the desk still lies. A $5M Saturday operator notices the holes below in week one. This is not a recitation of v408–v423, of `#172`, or of ranks 8–12.
**Locks held:** five painted tabs, flat $39, Live PARKED, no invented metrics, no sixth tab, `LIVE_UNPAID_INGEST_DAYS = 90` unchanged, ShopifyQL HOLD. This file does not patch `app/`, Fly, or open a PR.

## Top sentences a merchant would say

1. Customers mix put unidentified lifetime buyers into first-time `$`. Orders intelligence left them unknown.
2. The returning-vs-new chart is on UTC days. Overview is shop-local. Tonight’s POS tickets sit on tomorrow.
3. Spend import thought today was the laptop’s calendar. Admin Spend used the shop clock.
4. I tapped Coverage. Add-a-day opened too. Mix close still opens weekday — that is a second wrap class, not the same chip.
5. Public `/demo/goals` said it was the same year plan as Admin. I got a habit board against a `$0` plan. In Admin I type twelve months.
6. Settings said the whole desk is already on. Nobody named the unpaid 90 versus paid 24.
7. Goals painted 0% of plan while this month’s Shopify Total Sales were not on file.
8. Orders typical and Customers returning `$` treated a capped today as a finished day. Overview named the cap.
9. I opened LTV. Cohort spend-build curves stayed inside Depth, folded.
10. SAMPLE LTV always opens the estimate disclosure. Live keeps it shut until the formula seals.
11. Spend import still drew a 35% break-even rail on SAMPLE. Goals and Spend mix no longer do.
12. Online Total ROAS divided Online sales by every dollar I typed, including retainers I will read as Meta.

## Already-ranked skips (not finds)

Do not recook. File-level depth on a leftover is allowed; restating the sentence is not.

| Rank | Why skipped here |
| --- | --- |
| 7 shipped `#172` | Quiet-then-back `$` + copyable first-time `$` landed in `0af283e` / merge `8938134`. Floor. Do not list as missing. |
| 8 **the only cook** | Whale ticket / RFM still photo / watchlist 8 with no “N more.” SCOREBOARD next ship. Not a find. |
| 9 queued | Orders `$` by 1st/2nd/3rd/4th+, tax/shipping, dollars per unit, `$0` reships, discount `$` vs last September. |
| 10 queued | Guest checkout as **dollars**; source names inside Other; POS vs online returns. Guest **percent** on the mix is a different job only if dollars are stuffed — see hole 1 (unknown **lifetime**, not guests). |
| 11 queued | Compete rows 2–3 (buyer age; new `$` vs returning `$` vs same quarter last year); annual installed-base retention. |
| 12 queued | Compete rows 4/6/7/8; launch-week **class**; orders per month of life. Hole 9 is month-offset **spend-build curves** already computed in `cohortLtvCurves` — different grain, not that list. |

Shipped v408–v423 (starter LTV, promo/source LTV, morning sentence, period-total hero, live catalog empty, returning mix, Orders intelligence, same-clock, third-order steps, Goals honesty, phone Goals, Spend pair, book coverage, Goals year clock, DeskLane open, quiet-back dollars) are floor, not finds.

## Named leftover deepens (not the quota)

Megaprompt leftovers. File-level depth only. Do not re-rank as the whole note.

| Leftover | Still true on `d2017c1` | Count toward ten? |
| --- | --- | --- |
| v421 YTD **percent** look-ahead | `sumMonths` still adds every on-file actual while skipping a null plan month (`sales-goals.server.ts` 960–980). `buildYearBoard` YTD 783–794 does the same. Gauges paint `progressPct` (`SalesGoalGauges.tsx` 76–83). The rail chip prints `YTD {board.ytd.pct}%` (`app.goals.tsx` 810–813). The v421 test **locks** Feb omitted from goal and never asserts actual/percent (`sales-goals.test.ts` 508–535: `ytd.goal === 600_000` with Feb `$10k` still in the map). | **Yes — hole 13.** Hunt Q1. New evidence is the test + the chip, not the megaprompt sentence. |
| v421 typed `$0` vs dash | Input `formatGoalInput(0) === "0"` (`sales-goals.ts` 35–38). `ThisMonthPlanStack` shows — unless `row.salesGoal > 0` (`app.goals.tsx` 1502–1505). `GoalRow` `hasGoal` is `salesGoal != null && salesGoal > 0` (1409). Gauges `hasGoal` is `period.goal > 0` (`SalesGoalGauges.tsx` 76). Typed `$0` January looks unset on the phone stack and still adds `0` to YTD goal — same denominator as a cleared month (`sales-goals.test.ts` 537–546: `withZero.ytd.goal === 600_000`). | **Yes — hole 14.** Hunt Q2. Lie, not a synonym. |
| v419 payback day-0 interpolation | `cashPaybackAnchors` still starts `{ day: 0, revenue: 0, earned: false }` (`cash-payback.ts` 20). Missing D30 interpolates `$0` at day 0 → D90 (`cash-payback.ts` 61–74). `CpaPaybackDesk` still prints `{paybackDays}d` (90–98) and Spend save-banner repeats it (`app.spend.tsx` 1004–1006). Anchors are a sentence, not a painted curve. | **Yes — hole 15.** Hunt Q7. `$5M` will pace media off a 19-day count. |
| v422 Mix close → weekday fold | `id={OVERVIEW_MIX_CLOSE_ID}` wraps Mix **and** the weekday more-fold; `defaultOpen={panel === "mix-close"}` (`app._index.tsx` 972–996, `demo._index.tsx` 260–283). Counted only because hole 4 proves a **second** wrap class (Spend HashDetails inside Add-spend). | Counted as the named leftover next to hole 4, not a 16th. |
| v420 Unlock banner Customers-only | Still `app.customers.tsx` 221. Overview coverage line already names 90. Settings copy is hole 6 (new surface). | Skip as the whole note. |
| v421 `demo.goals.tsx` `goals: Array.from({ length: 12 }, () => 0)` | Still line 63. Lede claims “Same year plan as Admin Goals” (97–99). `hasGoal` is `goal > 0`, so public gauges always “no goal set.” Hole 5 is the missing year **table** plus that lede lie. | Absorbed into hole 5. |
| `site/pricing.html` 24 months | Megaprompt: nit. | **Nit. Not a cook.** |
| `uninstall-friction.test.ts` still wants “24 months of orders” on the paid clause of the unlock banner | Paid clause is honest. Do not change the 90. | Skip. |

## Ranked holes (new)

Ranked by what a multi-million-dollar operator notices. **PASS** = one cook can ship it without a new scope, a new tab, or a lie.

### 1. Unknown lifetime is stuffed into first-time `$` and into Cash CAC new-buyers.

**Merchant sentence:** I opened Customers. The mix said first-time `$`. Those buyers have no `lifetimeOrders` on file. Orders intelligence called them unknown. Spend → CPA still counted them as new for Cash CAC.

**Tab:** Customers first fold (mix) · Spend → CPA.

**Files + lines:**

- `app/app/lib/customers-analytics.ts` `orderIsReturning` 775–780 — first stored order with `lifetime === null` is not returning (`typeof file.lifetime === "number" && file.lifetime > file.stored` is false), so 960–965 adds the dollars to `newD`. Buyer **counts** set `unknownNew` (981–985); **dollars do not**. `firstTimeCount` withholds the headcount (786–787) while `newDollars` still ship (993–1004).
- `app/app/lib/orders-intelligence.ts` `buyerKind` 571–579 — `lifetime === null` is `"unknown"`; `unknownOrders` 206–208; `newSalesShare` is null when `unknownOrders > 0` (235).
- `app/app/lib/order-facts.server.ts` `countNewBuyersInRange` 1194–1198 — null lifetime is not skipped; first-in-window counts as new. CPA windows call this (`cpa-desk.server.ts` 265–278).

**Why a $5M store cares:** A thin `read_customers` book at this volume has thousands of identified ids with a missing `numberOfOrders`. Stuffing them into first-time `$` and into Cash CAC changes Saturday budget. Orders already withholds the share.

**Why not a nit:** Two painted tabs disagree on the same `OrderFact.lifetimeOrders` null. Hunt Q11. Not rank 9’s step mix. Not rank 10’s guest **dollars**. Not `#172` quiet-back `$`.

**PASS.** Withhold unknown `$` and unknown new-buyers as — on mix and CPA. Do not invent a sixth tab. Guests stay out of returning.

### 2. Customers mix is UTC. Overview is shop-local.

**Merchant sentence:** Overview said today in America/Denver. The returning-vs-new chart put tonight’s POS tickets on tomorrow.

**Tab:** Customers first fold (mix chart).

**Files + lines:**

- `app/app/lib/customers-analytics.ts` `utcDayStart` 659–661, `mondayUtc` 664, mix keys `toISOString().slice(0, 10)` 955–956 and 975–976, labels `getUTCMonth` / `getUTCDate` 998 / 1018.
- Overview today is `shopLocalDayKey(now, deskTz)` (`app._index.tsx` 458). Shop-local helper exists (`shop-local-day.ts` 6–12) and is the Spend/Goals clock on this tip.

**Why a $5M store cares:** Evening POS and Shop Pay after UTC midnight are a real slice of a US/AU book. Saturday mix “today” is then the wrong civil day next to Overview.

**Why not a nit:** Hunt Q14 names Spend/Goals/CPA. This is the same clock class on Customers, which the last two waves barely finished. Not rank 10 POS-vs-online **returns**. Not v415 same-clock (Overview).

**PASS.** Bucket mix days with `shopLocalDayKey` / `shopLocalDate` already on `OrderFact`. Missing TZ stays —, never a host `Date`.

### 3. Spend import “today” is the host calendar. Admin Spend is the shop clock.

**Merchant sentence:** I pasted yesterday on Spend import from a Denver laptop. The shop is Asia/Tokyo. The row landed on the wrong closed day.

**Tab:** Spend import (`/app/spend/import`). Admin `/app/spend` already uses shop IANA when present.

**Files + lines:**

- `app/app/routes/app.spend.import.tsx` already resolves `timeZone = deskPeriodTimeZone(...)` (228) and uses it for the explorer window (271–275, 326–329). Then **ignores it** for the paste default: `todayKey: sampleDesk.enabled ? utcDayKey(now) : localDayKey(now)` (396) — Live is process TZ.
- `app/app/lib/sample-desk.server.ts` `localDayKey` 444–448 is `date.getFullYear()` / `getMonth()` / `getDate()` (host calendar).
- Contrast: `app.spend.tsx` 425–429 uses `shopLocalDayKey(now, timeZone)` when Live TZ is on; stop-recurring 579–581 uses shop IANA; `materializeRecurringSpendForShop` (`spend-recurring.server.ts` 244–246) does too.
- API already bans host-local `new Date(y, m, d)` (`mcfly-api.server.ts` 28–29). Import’s `todayKey` did not get that cook.

**Why a $5M store cares:** A Saturday paste of “yesterday” on the wrong civil day moves a five-figure invoice onto a quiet day and inflates Total ROAS on the real closed day.

**Why not a nit:** Hunt Q14. SAMPLE vs Live leftover: SAMPLE import is UTC; Live import is **laptop** today, not shop-local. Demo vs Admin after v419. The same loader already computed shop TZ and then threw it away.

**PASS.** Use `deskPeriodTimeZone` + `shopLocalDayKey` the same way `/app/spend` does. Empty TZ stays —, do not invent a zone.

### 4. Coverage hash opens Add-spend and the nested `<details>`. Mix close still opens weekday.

**Merchant sentence:** I tapped Coverage to fill an empty day. The Add-a-day fold opened too, and the coverage calendar also snapped open. On Overview, Mix close still opens weekday.

**Tab:** Spend (Add spend fold) · Overview (named leftover, second class).

**Files + lines:**

- **Second class (new):** Add-spend `DeskLane` fold (`app.spend.tsx` 1365–1372) contains `#mcfly-spend-add` **and** native `HashDetails` `#mcfly-spend-coverage` (1467–1471), `#mcfly-spend-ledger` (1606–1607), `#mcfly-spend-rates` (1701–1702), `#mcfly-spend-recurring` (1777–1778). `HashDetails` opens on exact hash (220–246). `deskLaneTargetOpensFold` treats `foldRoot.contains(target)` as open (`desk-lane.ts` 61–69; `DeskLane.tsx` 63–71). Coverage peek `nextHref` hashes `mcfly-spend-coverage` (912–916, 1428). Result: one chip/hash opens **two** disclosure widgets (parent DeskLane + nested `<details>`).
- **Named leftover (counted only because of the second class):** Overview `id={OVERVIEW_MIX_CLOSE_ID}` wraps Mix **and** weekday (`app._index.tsx` 972–996). Chip Mix close → `defaultOpen={panel === "mix-close"}` (995). Same wrap + `defaultOpen` on public Overview (`demo._index.tsx` 260–283).

**Why a $5M store cares:** They asked for the coverage strip. They got the add form, daily-rate editor, and ledger on a 390px iframe. Mix close → weekday is the same Saturday miss on Overview.

**Why not a nit:** Megaprompt: Mix-close-opens-weekday only counts with a **second** wrong-lane class. This is DeskLane + HashDetails double-open, not the same wrap id. Not a restatement of v422’s later-`defaultOpen` cook.

**PASS.** Coverage/recurring/ledger hashes should open only that `<details>` (or a dedicated fold). Mix close must not set `defaultOpen` on the weekday fold. Do not recook v422’s later-`defaultOpen` contract.

### 5. Public `/demo/goals` still is not the Admin year plan.

**Merchant sentence:** I tried Goals on mcflyads.com/demo/goals. The lede said the same year plan as Admin. I got a habit board, a forecast, and MTD gauges against a `$0` plan. In Admin I type twelve months.

**Tab:** Public `/demo/goals` vs Admin `/app/goals`.

**Files + lines:**

- `demo.goals.tsx` 61–71: `goals: Array.from({ length: 12 }, () => 0)` into `buildSalesGoalPeriods`. No year table, no `ThisMonthPlanStack`, no year picker, no `parseGoalInput`. Gauges `hasGoal` is `goal > 0` → always empty.
- Lede 97–99: “Read-only SAMPLE. Same year plan as Admin Goals.” That sentence is false on this mount.
- Hero treats `data.sales.totalSales === 0` as `Certified $0` (118–120) — SAMPLE quiet today looks finished.
- Admin `app.goals.tsx` 1186–1214 mounts `ThisMonthPlanStack` + the 12-month table after v417.

**Why a $5M store cares:** Hunt Q13 / Q24. They bought from `/demo`. Installed Admin Goals is a typed year plan. Public SAMPLE still cannot show that board, and a `$0` day is certified.

**Why not a nit:** v417 mounted the Goals **stack** (habit + forecast + gauges). The year **table** and typed plan never landed on `/demo/goals`. The lede now claims they did. Not a restatement of the 35% BE / `$800k` stretch (those are gone).

**PASS.** Mount the Admin year table read-only from the SAMPLE book’s typed-or-empty months. Empty plan stays —. Do not invent `$800k`. Do not paint certified `$0` unless the SAMPLE day is a closed zero. Fix or delete the “same year plan” lede until the table exists.

### 6. Settings says the whole desk is already on. Trial is still 90 closed days.

**Merchant sentence:** Settings told me the whole desk is already on and billing is not a view. Then year vs last year is a dash. Nobody said trial order rows stop at 90.

**Tab:** Settings · Goals rail (same `TRIAL_VS_VIEW`).

**Files + lines:**

- `sample-live-handoff.ts` 36–37: `TRIAL_VS_VIEW` = “The whole desk is already on. Start 7-day trial in Settings is Shopify billing — Sample | Live is a view, not a plan.”
- `app.settings.tsx` 589 paints `{BILLING_HONESTY.flat} {BILLING_HONESTY.cancel} {TRIAL_VS_VIEW}`. `PRO_UPSELL.includes` (`entitlements.ts` 33–34) “Whole desk… billing is not a view.” `DESK_FEATURE_BULLETS` 57–63 “7-day full-access trial.”
- Unlock banner (90 vs 24) is still Customers-only (`app.customers.tsx` 221). Overview first fold already names the 90 (v420 leftover — not this hole). Settings never does.
- `demo.settings.tsx` 33–54 is a stub well (SAMPLE Snowdevil, `$39`, no 90, no shop TZ, no billing). Hunt Q13 leftover after v417.

**Why a $5M store cares:** Hunt Q5 (copy other than Customers banner + Overview coverage) and Q17 (billing vs unpaid 90). They will think `$39` bought 24 months of order rows during trial.

**Why not a nit:** Different surface from v420’s banner. Do not change `LIVE_UNPAID_INGEST_DAYS`. Do not unpark Live.

**PASS.** Settings (and `TRIAL_VS_VIEW`) must name unpaid 90 closed days vs paid 24 months, one plan `$39`. Public `/demo/settings` should say the same sentence or stay clearly SAMPLE-only without “full-access.”

### 7. Goals paints 0% of plan when Shopify Total Sales are not on file.

**Merchant sentence:** Last year is not on file this month. Goals still filled 0% of the plan. The dollars said —.

**Tab:** Goals MTD/QTD/YTD gauges.

**Files + lines:**

- `SalesGoalGauges.tsx` 76–78: `progressPct = hasGoal ? Math.min(100, Math.max(0, period.progressPct ?? 0)) : 0`. Server `progressPct` is null when `actual == null` (`sales-goals.server.ts` 1139–1140, 1224–1226). The `?? 0` paints a 0% bar. Track `aria-valuenow` follows that (129). Meta still prints — / `$goal` (152).
- Quiet Saturday / thin last year: hunt Q9 on Goals.

**Why a $5M store cares:** A 0% bar is a finished miss. They will cut spend. Empty spend as — already shipped; this is the sales-side twin on the year-plan tab.

**Why not a nit:** `$0` vs — religion. Not v421’s cleared-month goal skip (that is hole 13). This is a painted zero from a null actual. Hunt Q16 / Q21 on a board other than Overview YoY.

**PASS.** Null actual + hasGoal → empty bar / —, never 0%. Certified closed-day `$0` may be 0%.

### 8. Orders typical and Customers returning `$` treat a capped today as a finished day.

**Merchant sentence:** Overview told me live today is capped at ~100 orders. Orders typical and Customers returning `$` still looked like a closed day.

**Tab:** Orders first fold · Customers first fold. Spend first-fold Sales KPI already names the cap (`spendFirstFoldSalesHint` at `app.spend.tsx` 1044).

**Files + lines:**

- `OrdersFirstViewport.tsx` 66–73 — props are `depth`, `salesPending`, `useSampleDesk`. No `todaySalesTruncated`. Typical / average / discount peeks paint from `depth` as finished.
- `CustomersFirstViewport` / `buildCustomersHero` (`customers-first-viewport.ts` 173–204) — returning/new `$` from the period book, no truncated-today argument. `CustomersFirstViewport` on Admin (`app.customers.tsx` 201–206) does not receive the flag.
- Page banners exist: `app.orders.tsx` 94, `app.customers.tsx` 172 pass `todaySalesTruncated` into `DeskBookPage` / `CashTrustBanners`. The **hero numbers** do not withhold or annotate. Overview + Goals MTD disclose on the number (v420/v421). Hunt Q23.

**Why a $5M store cares:** A high-volume Saturday today can be a six-figure slice. Typical order and returning `$` that include a capped open day will not match Shopify Analytics after close.

**Why not a nit:** Banner on the page, finished dollars in the first fold — same class as empty spend painted 0× with a footnote. Spend first fold already got the hint; Orders/Customers first folds did not.

**PASS.** Pass `todaySalesTruncated` into the first-fold heroes or withhold today’s slice from typical / returning `$` until the cap lifts. Never write `$0`.

### 9. Cohort spend-build curves exist. The LTV chip does not open them.

**Merchant sentence:** I tapped LTV. I saw first 30 / 90 / year. I did not see this year’s first-order months building versus last year’s. That chart is under Depth, folded.

**Tab:** Customers → LTV chip vs Depth fold.

**Files + lines:**

- `ltv-depth.ts` `cohortLtvCurves` 382–424; `buildLtvDepth` wires `curves: cohortLtvCurves(customers, asOf)` (833).
- Painted only in `CustomersLtvDepth` → `LtvBuildCurves` (`CustomersLtvSection.tsx` 409–443).
- LTV chip is `#mcfly-ltv` (windows + economics, `app.customers.tsx` 220–225). Depth fold `defaultOpen={shotMode || panel === "depth"}` (249–254) is a different chip. `?panel=ltv` does not open Depth. `CustomersLtvDepth` mounts inside the Depth fold (266).
- Rank 12 owns launch-week **class** and orders-per-month-of-life, not this already-built month-offset curve.

**Why a $5M store cares:** Hunt Q10. The stored book already answers “are this year’s cohorts building like last year’s?” The open LTV lane does not ask it. Depth is below the fold on a phone.

**Why not a nit:** Not a missing formula. Not rank 8 RFM / whale ticket. Not rank 12’s launch-week class (different grain: first-order **month** cumulative `$` per buyer, honest short tails).

**PASS.** Open the curves on the LTV lane (or `?panel=ltv` / LTV chip opens the fold that contains them). Thin book stays —. Do not add a sixth tab.

### 10. SAMPLE LTV always opens the estimate. Live keeps it shut until it seals.

**Merchant sentence:** I flipped SAMPLE on to learn LTV. The estimate disclosure was already open on a dash. Live with no sealed months stays closed.

**Tab:** Customers → LTV.

**Files + lines:**

- `LtvExpectedEstimate.tsx` 15–20: `showInputs = useSampleDesk || estimate.expected != null`; `<details open={showInputs}>`. SAMPLE always expanded, even when `expected` is null and `display` is — (`expected-ltv.ts` 123–138).
- Live opens only when the 8-buyer sealed window exists (`expected-ltv.ts` 180–196).

**Why a $5M store cares:** Hunt Q4 / Q24. SAMPLE never a blank board was the catalog-empty / `$800k` class. v417 killed margin and stretch. This overlay remains on the LTV chip they will compare to Admin Live.

**Why not a nit:** Same SAMPLE-vs-Live contract v412/v417 already used. The formula is honest; forcing it open on SAMPLE is the lie.

**PASS.** SAMPLE and Live use the same empty: collapsed until `expected != null`. Do not invent an estimate.

### 11. Spend import still draws SAMPLE break-even at 35%. Goals and Spend mix no longer do.

**Merchant sentence:** I opened Spend import with SAMPLE on. The explorer still had a break-even rail. Goals and Spend mix stopped speaking BE after I never confirmed a margin.

**Tab:** Spend import explorer.

**Files + lines:**

- `app.spend.import.tsx` 303–310: SAMPLE `SAMPLE_DESK_MARGIN_PCT` (0.35) → `breakEvenMer`; passed into explorer (339). Explorer also gets `newCustomers: 0`, `returningCustomers: 0`, `customerMetricsAvailable: false` (320–322).
- `SpendExplorer.tsx` 1025–1040 paints `Break-even {formatMer(breakEvenMer)}×` when `breakEvenMer != null`.
- v417 lock: `goals-honesty.test.ts` forbids SAMPLE-forced 0.35 on Goals/Spend mix. Import was not in that cook.
- `mcfly-api.server.ts` 78–81 still overlays SAMPLE 0.35 for API MER — not painted on the desk; listed under Refused as out of IA.

**Why a $5M store cares:** Hunt Q4 leftover SAMPLE overlay after v417. Import is how a high-volume operator pastes 90 days of invoices. A BE rail they never confirmed will be read as profit.

**Why not a nit:** Same 35% overlay v417 deleted on the painted Spend mix. Import explorer still has it.

**PASS.** SAMPLE import `breakEvenMer` is null unless Live Settings confirmed a margin (Settings still has no margin field — so null). Empty BE is —. Do not invent COGS. **REFUSE** a margin hero.

### 12. Online Total ROAS still divides Online sales by every dollar I typed.

**Merchant sentence:** The pair said Online `$` ÷ typed spend. I typed Meta plus an agency retainer. I read 2.1× as ads ROAS. POS sales were excluded. Retainer spend was not.

**Tab:** Spend first fold (second line under Total ROAS).

**Files + lines:**

- `number-honesty.ts` `formatOnlineRoasLine` 109–139: `onlineSales = totalSales * mix.online` then `onlineSales / spend` where `spend` is **all** typed spend. Copy says “POS and Shop **sales** are excluded… not from Total ROAS.” Spend channels are not split.
- Wired at `app.spend.tsx` 789 and `demo.spend.tsx` 148.

**Why a $5M store cares:** Hunt Q12. Omnichannel books at this size type retainers, retail media, and billboards into the same ledger v419 invited. Online sales ÷ that blend is not Meta. They will scale.

**Why not a nit:** v419 shipped the Online **sales** split on purpose. The leftover lie is POS/retainer **spend** still in an “Online” multiple. Not rank 10’s Other **names**.

**PASS.** Name that the denominator is every typed dollar, or withhold the Online multiple when non-online spend is on file. Do not claim attribution. Do not replace Total ROAS religion.

### 13. YTD percent still looks ahead after v421 (leftover, new evidence).

**Merchant sentence:** I planned January and March and left February blank. YTD still counted February’s Shopify Total Sales against a smaller plan. The chip said I was ahead.

**Tab:** Goals gauges + YTD chip.

**Files + lines:** `sales-goals.server.ts` `sumMonths` 960–980 (actual always added; null plan skipped); YTD 783–794 / 1224–1226; `app.goals.tsx` 810–813 chip; `sales-goals.test.ts` 508–535 locks goal skip and never asserts `ytd.actual` / `progressPct`. Calendar tick `calendarPctInMonthSpan` 1015–1039 still includes the omitted month’s days.

**Why a $5M store cares:** Hunt Q1. They will spend against a fake “ahead of plan.”

**Why not a nit:** v421 fixed empty → null and YTD **goal** skip. Percent still mixes unplanned actuals into the numerator. The test documents the leftover.

**PASS.** YTD/QTD actual should only sum months that have a plan (or withhold %). Calendar tick should match. Never `$0` a cleared month.

### 14. Typed `$0` is “0” in the field and — on the month stack (leftover).

**Merchant sentence:** I typed `$0` for a closed January. The input shows 0. The phone stack shows —. YTD treats it like a missing month.

**Tab:** Goals `ThisMonthPlanStack` + year table.

**Files + lines:** `formatGoalInput` (`sales-goals.ts` 35–38); `ThisMonthPlanStack` 1502–1505; `GoalRow` `hasGoal` 1409; gauges 76; typed `$0` YTD goal matches a skipped February (`sales-goals.test.ts` 537–546).

**Why a $5M store cares:** Hunt Q2. A renovation month typed as `$0` is a real plan. Painting — says they forgot to type. Same denominator as a cleared month (hole 13).

**Why not a nit:** Input and hero disagree on a dollar the merchant typed. Not padding.

**PASS.** Phone stack and gauges must show typed `$0` as `$0`, cleared as —. YTD must not treat them as the same unless the copy says so.

### 15. Payback still interpolates through day-0 `$0` and still prints a day count (leftover).

**Merchant sentence:** Cash CAC is `$40`. First order already covers it. The desk said 15 days because it started the curve at `$0` on day 0.

**Tab:** Spend → CPA payback · Customers LTV economics (same helper).

**Files + lines:** `cash-payback.ts` 20, 61–74; `CpaPaybackDesk.tsx` 57–59 (sentence) vs 90–98 (the number); `app.spend.tsx` 1004–1006 save banner; `CustomersLtvSection.tsx` 223–224.

**Why a $5M store cares:** Hunt Q7. They will pause a profitable offer because interpolated days look long. Anchors are not painted; the count is.

**Why not a nit:** `#152` still-PASS. v419 marked `earned: false` and left the interpolation. Refuse causal / ads-manager payback.

**PASS.** Paint D30/D90 anchors, or stop printing `Nd` until the first **earned** anchor exists. Day-0 `$0` is not earned LTV.

## Refused

| Item | Why |
| --- | --- |
| COGS / P&L / margin hero | Hole 11 deletes SAMPLE BE. Do not add a profit board. Settings still has no margin field. |
| Pixels, MTA, “true ROAS,” sessions | Religion. Hole 12 does not claim Meta. |
| ShopifyQL-wait / `#137` / `#145` | HOLD. Do not execute. Day totals vs order rows stay named, not unblocked. |
| Live unpark | PARKED. |
| Change `LIVE_UNPAID_INGEST_DAYS = 90` | Lock. Hole 6 names it. |
| Sixth tab / Whale → Admin door / million-order crawl as shipped | HOLD. Rank 8 owns the whale **ticket** sentence, not an Admin door. |
| Causal / ads-manager payback | Hole 15. Average cohort only. |
| `site/pricing.html` 24 months | Megaprompt nit. Marty Pages. |
| Reciting ranks 8–12, `#172`, v408–v423 merchant sentences | Scout FAIL if those are the note. |
| `mcfly-api.server.ts` SAMPLE 0.35 | Not a painted tab. Same overlay as hole 11; do not open an API cook beside a whale ticket. |
| Guest **percent** tile as rank 10 | Guest **dollars** are rank 10. Hole 1 is unknown **lifetime**, not guests. Mix comment still sends guests to first-time `$` (`customers-analytics.ts` 939–942, 1373) — do not re-rank as guest dollars. |
| `unitCount` / `grossAmount` / discount `$` vs last September | Rank 9. |
| Quiet-then-back `$` / copyable first-time `$` | `#172` shipped. Floor. |
| Overview YoY / Goals year six-figure nowrap | v411 / v418 shipped those surfaces. Remaining swipe on `.mcfly-yoy-board__table` `min-width: 36rem` (`mcfly-desk.css`) and `.mcfly-ltv-dive__table` `min-width: 420px` is phone leftover — significant on LTV dive, but not a new formula. Flag for the volume scout / synthesizer; do not pretend it is rank 8’s 430px whale grid. |
| `NUMBER_HONESTY.orderWindow` “about the last 60 days” | String still in `number-honesty.ts` 39–40. **Not painted** (comment-only on `MarketingSnapSection`). Dead copy. Nit until a helper prints it. |

## Hunt questions — short answers

1. YTD % look-ahead after v421 — **yes.** Hole 13. Saturday spend changes.
2. Typed `$0` vs dash — **lie, not a nit.** Hole 14.
3. 36rem leftover on LTV dive (`min-width: 420px`) and Overview year board (`min-width: 36rem`). Goals stack / CPA `rangeLabel` shipped in v418. Settings is a well, not a six-figure KPI. Volume scout owns the phone leftover; not nits if `$417,392` stays nowrap.
4. SAMPLE overlays leftover — holes 5, 10, 11. Catalog empty (v412) and margin on Goals/Spend mix (v417) stay gone.
5. 24 months / trial=paid leftover **other than** Customers banner + Overview coverage — hole 6 (Settings / `TRIAL_VS_VIEW`). `PRODUCT_NOUN.shopifyBookMuted` still “Up to 24 months of order detail” (`product-labels.ts` 105) used for **paid** tills via `shopifyBookMutedFor`. Unpaid lede is 90 (`desk-history.ts` 35–40). Pricing HTML is a nit.
6. Second wrong-lane class after v422 — hole 4 (HashDetails + Add-spend). Mix close → weekday counted only with that.
7. Payback day-0 — hole 15. Anchors not painted. Day count still printed.
8. Copy leftover Orders / LTV / Goals year — `CopySpendPair` / `CopyYtdSales` / Growth first-time `$` (`#172`) are taken. Orders intelligence, LTV windows, and the Goals year table still have no copy control. Teammate Slack for “this month’s typical vs last September” is rank 9’s numbers; the **missing copy control** is a craft hole the volume scout should own. Not duplicated as a 16th cook here.
9. Quiet Saturday `$0` / last year not on file — hole 7 (Goals 0% bar). Spend explorer `explorerMer` withholds 0× (v419). LTV year window already —.
10. `cohortLtvCurves` — computed and painted in Depth, not on the open LTV lane. Hole 9. Not rank 12 launch-week class.
11. Unknown `lifetimeOrders` stuffed into 1st — hole 1.
12. POS spend in an ads ROAS — hole 12 (all typed spend in the Online denominator).
13. `/demo/spend` vs Admin after v417/v419/v420 — public spend still `todaySalesTruncated: false` (`demo.spend.tsx` 246, 350) which is correct SAMPLE. Remaining mount gaps: hole 5 (Goals year table + false “same year plan” lede), hole 6 (`demo.settings` stub), hole 3 (import clock). Public spend still has no `#mcfly-spend-add` (intentional “does not save”).
14. Host Date vs shop-local — holes 2 and 3. CPA windows take `deskTz` (`cpa-desk.server.ts` 256). Live `loadBuyerDays` still keys `utcDayKey(row.day)` (`cpa-desk.server.ts` 94, 129) — honest iff `SalesDayFact.day` is UTC midnight of the shop-local date. Import `todayKey` is the proven host-Date lie (loader already has `timeZone` at 228).
15. `unitCount` / `grossAmount` / `discountAmount` — rank 9. Skip.
16. Six-figure + thin last year on Customers/LTV/Spend mix — LTV dive table 420px nowrap; mix chart UTC (hole 2). Overview glance shipped.
17. Billing vs unpaid 90 — hole 6.
18–20. Native Analytics / compete 2026 / new operator threads — compete and operator scouts. Not this file.
21. `$417,392` this month, last year not on file, **other than** Overview YoY and Goals year — hole 7 (0% bar), hole 8 (truncated today on Orders/Customers).
22. Company / B2B / draft / staff / Shop Cash dumped into Other — rank 10 names. Skip unless dollars/clock wrong (not proven here).
23. Truncated today as finished on Spend/Orders/Customers first-fold — Spend Sales KPI discloses (v420). Orders/Customers heroes do not. Hole 8.
24. Remaining SAMPLE vs Live after v417 Goals stack — holes 5, 10, 11.

## Locks this scout did not break

No `app/` edits. No Fly. No `gh pr create`. No Live unpark. Did not change the 90. Did not execute ShopifyQL-wait. Did not commit `.superpowers/` or leftover `NEXT_*.md`.
