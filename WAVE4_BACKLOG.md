# Wave 4 backlog — accuracy first

**Kind:** Audit + backlog only. No product code in this PR.  
**Tree:** `cursor/wave3-uninstall-risk-3723` @ `62f36c3` (Wave 3 tip; includes Wave 2).  
**Not:** `main`, PR #19, `suite/`, `.env`, Fly deploy, invented reviews / smoke / metrics.  
**Reviews stay 0.** Ads stay off. Pricing stays 7-day then $39/store/mo. 11-tab lock intact.

**Founder override (this run):** any number mistake is kill-risk #0 — ahead of UX polish and competitive gaps.

**Assumptions:** Wave 1–3 land as written (Overview spend wall gone, SAMPLE handoff honest, 410 recovery, recurring $X/day default, Spend first fold = yesterday). Live Fly is still **v323 @ 6c08d2a** until a founder deploys. This audit is **this tip’s code + existing tests**, not a live Admin pass.

Granola was unavailable (MCP needs auth). Prior product religion is from `docs/LIVING_BOARD.md`, `docs/plans/2026-09-15-TAB_LOCK.md`, and Wave 2/3 PR bodies.

---

## Overall desk trust score (after Wave 3)

**Fair — shaky on numbers, calmer on chrome.**

Wave 1–3 fixed the greeting lies (blank ROAS wall, SAMPLE-as-live, Handling response, LTV First year as a sealed 365). The Shopify five can look useful at $0 spend. The remaining kill risk is **not** “the form is hard.” It is **a merchant reading a real-looking $0 / 0% / 3.50× that is not Shopify’s number.**

| Layer | After Wave 3 |
| --- | --- |
| Session / 410 chrome | Fair (Spend + book pages; leftovers on Goals / YoY / ROAS / Settings) |
| SAMPLE vs Live labeling | Fair–solid (DataModeBar + Settings; `SampleDeskBanner` still a no-op) |
| Formula (sales ÷ spend) | **Solid** in mer-core / mer-engine |
| Empty spend → no 0× ROAS | **Solid** on Overview; **fair** on Total ROAS (spend paints `$0`) |
| Missing Shopify history → not $0 | **Shaky** (SalesDayFact + Goals year board) |
| First-session order book complete | Fair (APIs wired; ingest is timid) |

---

## Accuracy / formula audit (mandatory)

Verdicts: **PASS** / **FAIL** / **UNKNOWN**.  
UNKNOWN only when a live Admin session is required — exact demcflyads check listed.

No live Admin numbers were invented. Harbor site dollars below are **from repo copy**, not a new smoke.

### 1. Total ROAS / Harbor ROAS formula

| Check | Verdict | Evidence |
| --- | --- | --- |
| Desk Total ROAS is **sales ÷ spend**, never sales+spend, never inverted | **PASS** | `packages/mer-core/src/mer.ts` `calculateMer` = `totalSales / totalSpend`, null when `totalSpend <= 0`. Twin in `packages/mer-engine/src/index.ts` `computeMer`. Tests: `packages/mer-core/tests/mer.test.ts` (“never inverted”; null on 0 spend; 0 sales + spend → `0`; refund-heavy negative sales allowed). Dashboard uses `computeMer(action.sales, totalSpend)` in `app/app/lib/mer-dashboard.server.ts`. Explorer `merOf` same guards (`app/app/lib/spend-explorer.ts`). |
| Copy states the same formula | **PASS** | `PRODUCT_NOUN.definition` = `"Shopify Total Sales ÷ ad spend"`; `notTrueRoas` = `"Sales ÷ spend. Not platform ROAS."` (`app/app/lib/product-labels.ts`). Allocation snap: `"Total ROAS = sales ÷ spend"`. No `sales + spend` formula in app or packages. |
| Empty spend is not 0× | **PASS** (Overview) / residual on Total ROAS | `calculateMer` returns `null`. Overview omits the ROAS tile when `totalSpend <= 0` (`OverviewFirstViewport.tsx`). `resolveSalesReadiness` suppresses the ratio when no closed sales day has landed (`app/app/lib/sales-pending.ts` + `sales-pending.test.ts` — the 2026-08-26 `$0 ÷ $650 = 0.00×` smoke). Total ROAS page still paints **Spend `$0`** via `formatCurrency(metrics.totalSpend)` while ROAS is **—** (`app/app/routes/app.roas.tsx`). |
| Harbor 3.51× is sales ÷ spend | **PASS** on arithmetic / **UNKNOWN** on desk paint | Site lock: spend `$23,414` · sales `$82,068` · **3.51×** (`docs/LIVING_BOARD.md`; `site/index.html`). Precise book in `site/sample/brands.json`: sales `82068.37` / spend `23414.19` = **3.505… → 3.51×** at two decimals. Stored `mer: 3.512` in the same JSON is a **0.007** marketing-file drift — not a desk formula. Desk SAMPLE seed targets `SAMPLE_DESK_TARGET_MER = 3.5` and **generates** a ~400-day book (`app/app/lib/sample-desk.server.ts`, `demo-sample-desk.server.ts`) — it is **not** guaranteed to print Harbor’s exact dollars. |

**demcflyads UNKNOWN:** Settings → Sample data. Read Overview / Total ROAS Sales, Spend, Total ROAS. Confirm Sales ÷ Spend = the painted × (two decimals). Confirm those dollars are the generated SAMPLE book, not necessarily site Harbor `$23,414` / `$82,068`. Then Switch to Live. Confirm SAMPLE spend did **not** move into Live Total ROAS.

---

### 2. Spend aggregation (channels, timezone, SAMPLE vs Live)

| Check | Verdict | Evidence |
| --- | --- | --- |
| Meta + Google + email + other **sum** into the Total ROAS **denominator** | **PASS** | `channelSpendFromEntries` totals every known channel plus named `other` extras; unlabeled `other` still counts (`app/app/lib/mer-dashboard.server.ts`). `sumSpend` adds non-negative finite amounts (`packages/mer-engine/src/index.ts`). Numerator is Shopify Total Sales for the **same** `DateRange`, not spend+sales. |
| SAMPLE spend never enters Live ROAS | **PASS** (code + tests) | Live loads use `{ excludeSample: true }` / `NOT: { source: "sample" }` in `buildDashboardMetrics`, Goals `spendByMonthMap`, YoY `buildDailyRowsForWindow`, ROAS explorer. SAMPLE loads use `sampleOnly: true`. `materializeRecurringSpendForShop` returns `{ written: 0 }` when `sampleOn` (`spend-recurring.server.ts` + `spend-recurring.test.ts` “Harbor dollars stay the sample book”). Saving a live day while SAMPLE is on **turns SAMPLE off first** (`app.spend.tsx` `setSampleDeskEnabled(shop.id, false)`). `resolveHonestSales` zeros `source: "mock"` when sample is off (`mer-trust.ts`). |
| Day boundaries | **PASS** with a documented convention | Spend rows stamp **UTC midnight of the YYYY-MM-DD key** (`utcMidnightFromDayKey`). Sales bucket `createdAt` with **shop IANA** (`shopLocalDayKey`). Month boards use UTC Y/M of `periodStart` on purpose so Denver does not shift `2026-07-01T00:00Z` into June (`sales-goals.server.ts` comment). Recurring “through yesterday” is shop-local (`shopLocalDayKey` then `previousSpendYmd`). Join is **calendar key**, not instant-overlap. |
| Recurring fill vs SAMPLE | **PASS** | Skipped on SAMPLE desks (above). |

**demcflyads UNKNOWN:** Live desk, shop timezone not UTC (demcflyads is America/Denver if still). Type yesterday Meta $40. Confirm the row’s date is **shop-local yesterday**, and Total ROAS denominator moves by $40 for that shop-local day — not UTC yesterday if they differ.

---

### 3. Recurring $X/day materialize

| Behavior | What the code does | Verdict |
| --- | --- | --- |
| Which days are written | Open rules, from `max(rule.start, floorYmd)` through **yesterday** (shop-local). Floor = SalesDayFact window start (Jan 1 × 5 years). Caps at 2000 days. | **PASS** (bounded, yesterday not today) |
| Overwrite vs fill-empty | **Manual / csv / meta / google / sample** rows are blocked (corrections). **Existing `recurring` rows are upserted** to the current rule amount. Comment: “Missing days and existing `recurring` rows are filled/updated.” | **FAIL** vs Wave 3 / preview copy |
| Copy vs code | `recurringFillPreviewCopy`: “Fills empty days… Typed or uploaded days stay.” Does **not** say previously auto-filled days will be rewritten if the rate changes. | **FAIL** |
| Edit a single day | `shouldContinueDailyAmount` is false when `editing`. Save writes `source: "manual"`. Does not start a new rate. | **PASS** (Wave 3 lock) |
| Delete | `deleteSpendEntry` deletes the row. Next Overview / Spend / ROAS load calls `materializeRecurringSpendForShop`. An open rate **refills** that empty day unless Stop or a `$0` manual correction remains. | **FAIL** as durable delete |
| Stop | Sets `endDate` through yesterday. Does **not** erase days already written. | **PASS** (rate ends; history stays) |
| Long fill | >31 days requires checkbox; server rejects without it (`recurring-fill-preview.ts`, Wave 2). | **PASS** |

Evidence: `app/app/lib/spend-recurring.server.ts`, `spend-continue-daily.ts`, `app/app/routes/app.spend.tsx`, `app/app/lib/spend-write.server.ts`, tests in `spend-recurring.test.ts`, `spend-continue-daily.test.ts`.

**demcflyads UNKNOWN:** (1) Save yesterday $40 with Continue checked. Change Daily amount to $55 → Save. Did **past** auto-filled days become $55 or stay $40? (2) Delete yesterday’s row, refresh Spend. Did it come back?

---

### 4. Empty vs zero vs missing

| Case | Verdict | Evidence |
| --- | --- | --- |
| Pending sales ≠ $0 | **PASS** on Overview / book pending copy | `overviewNoticeSentence` + tests: “still loading — not $0.” Goals hero: “Still loading — not $0.” LTV empty: “Orders still syncing — not $0.” |
| Empty spend ≠ 0× ROAS | **PASS** (core) | `calculateMer` null; Overview tile omitted. |
| Empty spend KPI | **FAIL** (Total ROAS / Allocation) | Spend paints `formatCurrency(0)` → `$0`, not —. Allocation snapshot same. Merchant can read “I have $0 spend on file” vs “spend unknown.” |
| Goals Actual / Prior for months with no facts | **FAIL** | `mapGetMonth` returns `0` when the month is absent (`sales-goals.server.ts`). `GoalRow` always `formatCurrency(row.actual)` and `formatCurrency(priorActual)` (`app.goals.tsx`). Banner says “Nothing was written as $0” while the table writes `$0`. `priorYearMonthly[row.month - 1] ?? 0` same lie on Prior. |
| SalesDayFact success with 0 orders | **FAIL** | `upsertSalesDayFact` comment: “a zero-sales day is a legitimate fact (written as sales: 0).” `fetchShopifySales` does **not** mark Shopify’s ~60-day hide as an error — older days typically return **empty edges**. Those days become stored $0 and make YTD / Goals look finished. OrderFact has `isHistoryWindowError`; SalesDayFact does **not**. Window comment even says YTD/L12M “can complete once facts are filled (requires `read_all_orders`)” (`sales-facts.server.ts`) — public scopes omit that. |
| `resolveSalesReadiness` when period exceeds fact window or coverage is null | **FAIL** | `periodExceedsFactWindow` + `sales: 0` → **not** pending (`sales-pending.test.ts`). Null coverage + `sales: 0` → **not** pending (“shows a number when coverage is unknown”). Capped / unknown windows can paint **$0 sales** as real. |
| Customers new vs returning **bar share** | **FAIL** | `ShareBarsChart` uses `share: book.returningSalesShare ?? 0` (`app.customers.tsx`). Missing share becomes a **0%** bar. `shopifyNativePeriodStats` can also form a 0% share when `customerMetricsAvailable` is false but `sales > 0` (net fields default to 0, `hasSalesSplit` still true). |
| Overview “No orders in this window yet.” | **PASS** if `salesPending` is true first; **risk** if pending is false and facts are empty | Tests lock the pending sentence. First-session ingest (`maxDays: 2` on Overview) can still look like a dead shop. |

**demcflyads UNKNOWN:** Live (not SAMPLE). Open Goals for the current year. For a month **before** the last ~60 days of orders: is Actual `$0` or `—`? Open Overview “This year”: does it match Shopify Analytics YTD or only ~60 days labeled as a year?

---

### 5. Shopify-sourced tabs — fields, fallbacks, placeholders

**Scopes in this tree:** `read_orders,read_customers` (`app/shopify.app.toml`, `fly.toml`). No `read_all_orders`, `read_products`, `read_reports`.

**Admin GraphQL actually called:** `McflyShopMetadata` (timezone, currency) · `McflyOrdersSales` / `McflyOrdersFull` / `McflyOrdersCustomers` · `McflyOrdersForFacts` · `McflyActiveAppSubscriptions`. Money fields: `shopMoney.amount` on `currentTotalPriceSet` (Total Sales numerator), `totalPriceSet` (gross / returns drag), `currentSubtotalPriceSet` (net / new-returning $). Customer: opaque `id` + `numberOfOrders` only. OrderFact also: `sourceName`, `currentSubtotalLineItemsQuantity`, `currentTotalDiscountsSet`, `createdAt`.

| Tab | What feeds it | Silent fallback / estimate that can look like truth | Verdict |
| --- | --- | --- | --- |
| **Overview** | SalesDayFact + capped today GraphQL + OrderFact depth. YoY cards from certified chips. | Missing last year → `OVERVIEW_YOY_MISSING` (**PASS**). Returning compact is dollars or — (**PASS** vs old headcount). **This year** label on a ~60-day pull (**FAIL** if facts filled with $0). Till can say “live sales” without ~60 days. | **FAIL** on year completeness |
| **Customers** | Same spine. Hero = returning **$** from `returningCustomerNetSales`. | New/returning **classification** uses `numberOfOrders` vs in-window count (**PASS** — lifetime, not in-window-only). **Dollar split is net**; Overview sales hero is **Total Sales**. Shares = net ÷ total (`shopifyNativePeriodStats`) — mixed basis, can look like “% of sales.” Bar `?? 0` (**FAIL**). Guest sales sit in Total Sales but not in the split. | **FAIL** (share / basis) |
| **Growth** | First-time **$** (same net split) + OrderFact timing (days to 2nd, 2nd in 30d). | Timing only among orders **on file**. A buyer whose true first order is older than ~60 days is a “first-timer” here if `numberOfOrders` says new, but cohort timing is in-window only. Depth stats **withhold** until min N (honest null — **PASS**). | **FAIL** (first-in-file vs lifetime) with honest empty floors |
| **Orders** | Median / clocks / discounts / units / source / weekday from OrderFact + period sales. | Median withheld until enough orders. Missing hour → omit, not $0. **PASS** if facts exist. Incomplete facts without banner = sealed “live.” Book pages now pass truncated / window notices. | **PASS** with ingest caveat |
| **LTV** | CohortFact from first **non-guest order in the crawled set**. | `computeCohortRollups`: first order **in the array** starts 30/90/365 (`order-facts.server.ts`). Not Shopify lifetime first order. First year **—** when `historyLimited` (**PASS** vs Wave 3). Empty sync copy honest. | **FAIL** (cohort start) / **PASS** (365 paint when limited) |
| **YoY** | `getSalesFactsByDay` over prior-YTD→MTD. `yoyDisplayValue` null → —. | No `shopifyOrderWindowLimited` on the page. Last year **—** when missing (**PASS**). This month / last month can be **partial 60-day facts** under a full-month label. | **FAIL** (window label) / **PASS** (null last year) |
| **CPA** | Typed spend ÷ identified buyers (`cashCostPerCustomer` null unless spend > 0 and buyers > 0). | Empty tiles are **—**, not $0 CPA (**PASS**). Three dashes can look broken (UX). `shopifyOrderWindowLimited` computed in loader, **not passed** to `DeskBookPage`. | **PASS** (no fake $0 CPA) |
| **Goals** | Year board from `salesByMonthFromDayMap` + `mapGetMonth` → 0. Period hero from desk sales. | **FAIL** — see §4. Grow 10% uses prior-year monthly; zeros yield $0 goals (`goalsAtYoyGrowth`). YTD chip `% of goal` can treat missing months as $0 actual. | **FAIL** |

**demcflyads UNKNOWN:** Live Customers — compare returning **$** + % to Shopify Analytics “First-time vs returning customer sales” (same dates). If Mcfly % ≠ Shopify sales split, this FAIL is confirmed. Live LTV — a buyer you know is returning: are they a new cohort month?

---

### 6. Rounding / currency / multi-currency

| Check | Verdict | Evidence |
| --- | --- | --- |
| Shopify money is **shop** currency | **PASS** | All order queries read `shopMoney.amount`, not `presentmentMoney`. Shopify converts presentment → shop. |
| Spend writes | **PASS** | `roundMoney` = cents; `shopCurrencyCode` persists ISO on the row (`spend-money.ts`, `spend-repository.server.ts`). |
| Merchant-facing `$` | **FAIL** | `formatCurrency(amount, currency = "USD")` (`mer-format.ts`). Route call sites pass **one** argument — Overview, Customers, Growth, Orders, LTV, Goals, CPA, ROAS, Allocation all default **USD**. A CAD shop’s numbers can wear a `$` USD locale. Unknown / missing shop code also collapses to USD (`shopCurrencyCode`). |
| Sales vs spend precision | **FAIL** (display) | `formatCurrency` uses `maximumFractionDigits: 0`. `formatSpendAmount` keeps cents. Sales `$1,235` next to spend `$1,234.56` can make a hand-checked ROAS look “off” by a dollar. |
| Summing mixed ISO on one shop | **UNKNOWN** | `sumSpend` adds amounts with **no FX**. Should not happen if every write uses `Shop.currencyCode`. No test locks mixed-currency rows. |
| Zero-decimal currencies (JPY, etc.) | **UNKNOWN** | `roundMoney` always `* 100`. No JPY fixture. |

**demcflyads UNKNOWN:** If the shop is USD, display FAIL is latent. Confirm Settings / shop currency. If CAD (or any non-USD), every tab’s `$` prefix is the human check.

---

### Accuracy scoreboard (for ranking)

| ID | Finding | Verdict | Kill? |
| --- | --- | --- | --- |
| A1 | Total ROAS = sales ÷ spend; empty spend → no 0× | **PASS** | — |
| A2 | SAMPLE spend excluded from Live ROAS | **PASS** | — |
| A3 | SalesDayFact can store Shopify-hidden days as **$0 sales** | **FAIL** | **Yes** |
| A4 | Goals Actual / Prior / YTD treat missing months as **$0** | **FAIL** | **Yes** |
| A5 | Recurring rematerialize **overwrites** auto-filled days; Delete refills | **FAIL** | **Yes** (spend ledger) |
| A6 | Returning/new **$ share** = net ÷ total; missing share → **0%** bar | **FAIL** | **Yes** |
| A7 | LTV/Growth cohort = first order **on file**, not lifetime first | **FAIL** | **Yes** (LTV) |
| A8 | `formatCurrency` defaults **USD**; sales rounded to whole dollars | **FAIL** | Week-1 if non-USD |
| A9 | Harbor desk dollars vs site `$23,414` / `3.51×` | **UNKNOWN** | Listing vs desk |
| A10 | Empty-spend Spend KPI `$0` on Total ROAS / Allocation | **FAIL** | Lower than A3–A7 |

---

## Top remaining uninstall risks (after Wave 3)

Accuracy first, then session / first-experience.

1. **A merchant believes a year (or a month) of $0 sales.** SalesDayFact + Goals table. Sidekick-class distrust (native complaint S9 / S11). Wave 3 did not touch this.
2. **Returning-dollar % that is not Shopify’s sales split** (net/total mix or a 0% bar). “Numbers don’t match Shopify” — the attribution-suite uninstall engine.
3. **Spend ledger that undeletes or rewrites days** the merchant just edited. Wave 3 made yesterday easy; the rate can fight Edit/Delete.
4. **LTV that looks like lifetime** from a 60-day crawl.
5. **Deep-link 410 / Handling response** still possible on Goals, YoY, ROAS, Settings, LTV (Wave 3 `requireAdmin` is Spend + `loadDeskSalesPage` only).
6. **First session still thin** while OrderFact/SalesFact crawl `maxDays: 2` per Overview load — “no orders” / empty book before the wired APIs finish.

---

## Shopify-API first-experience completeness (no CSV)

Already wired, already in scopes, **do not need upload**:

| Available now | First-experience gap |
| --- | --- |
| `read_orders` Total Sales / gross / net / returns | YTD / Goals can seal a short pull as a year of $0 |
| `numberOfOrders` | Used for new vs returning **counts**; **not** used to refuse a fake LTV first-order |
| OrderFact discounts, units, `sourceName`, weekday/hour | Computed; first session may not have the days yet (`maxDays: 2`) |
| Shop timezone + currency | Timezone used for day keys; **currency rarely passed into `$` paint** |
| Billing `McflyActiveAppSubscriptions` | Trial CTA is Managed Pricing; `MCFLY_BILLING` not in committed Fly `[env]` (ops, not Wave 4) |

**Do not add for Wave 4:** `read_all_orders`, pixels, Meta/Google OAuth, Klaviyo, `read_reports`, CSV upload redesign.

---

## Competitive / Shopify best-practice gaps (actionable on this desk)

Only gaps that unblock **paid-install week 1** *after* the number is honest:

- Native Analytics already answers “this period’s sales.” Our job is **same days last year** and **median / returning $ / second-order** — all must stay Shopify-true, not a second book (Polar/Northbeam 1-star pattern).
- Empty spend tabs (CPA three dashes, Allocation `$0` cockpit) look like a broken ads app if the merchant clicks them early. Honesty of empty, not CSV easiness.
- Embedded session recovery is a Shopify app-store hygiene item Wave 3 started; finish the remaining routes so a token drop is not “Gone.”

---

## Ranked Wave 4 implement list (≤6)

Accuracy FAILs first. UX / API completeness only after the number is solid.

### 1. Seal SalesDayFact against Shopify-hidden history — never store or serve $0 for unseen days

**Outcome:** A day Shopify did not share is **missing**, not a certified $0. Overview “This year,” YoY, and any fact-sum stop treating empty GraphQL as “the shop made nothing.”

**Why uninstall / EV:** Kill-risk #0. Sidekick / Polar “the number is not Shopify’s.” A finished-looking YTD that is ~60 days of real sales plus months of stored $0 is worse than a coverage banner.

**Files:** `app/app/lib/sales-facts.server.ts` (`upsertSalesDayFact`, `runSalesFactsBackfill`, `getSalesFactsCoverage`); `app/app/lib/shopify-sales.server.ts` (empty vs denied); mirror OrderFact `isHistoryWindowError` / `historyLimited`; `app/app/lib/sales-pending.ts`; Overview YoY cards (`overview-yoy.ts`, `app._index.tsx`).

**Verify:** Unit tests: successful 0-edge fetch **outside** the known window does not upsert a $0 fact (or upserts with an explicit `historyLimited` / omitted flag that paint treats as —). Existing `sales-facts.server.test.ts` / `sales-pending.test.ts` updated so `periodExceedsFactWindow` + 0 sales is **not** a real $0. **demcflyads:** Live, month before the 60-day horizon is — or “not on file,” never `$0`.

### 2. Goals year board: missing Actual / Prior / YTD ≠ $0

**Outcome:** `mapGetMonth` / `GoalRow` paint **—** (and withhold Grow 10% / YTD % ) when the month has no certified facts. Banner and table agree.

**Why uninstall / EV:** Same kill as #1, on the plan page. Banner already claims “Nothing was written as $0” (`app.goals.tsx`) while `formatCurrency(row.actual)` writes `$0`.

**Files:** `app/app/lib/sales-goals.server.ts` (`mapGetMonth`, `loadSalesByDayForGoalsRange`, `buildYearBoard`, `goalsAtYoyGrowth`); `app/app/routes/app.goals.tsx` (`GoalRow`, YTD chip); `app/app/lib/goals-page.test.ts`.

**Verify:** Tests: empty `salesByDay` → Actual/Prior are null/—, not `0`. Incomplete year does not emit a YTD % of goal from $0 months. **demcflyads:** current-year Goals table for January (if today is after the 60-day window) is not `$0`.

### 3. Recurring ledger matches the copy: fill empty only; Edit/Delete stay

**Outcome:** Materialize writes **missing** days only. Changing the daily rate does **not** rewrite past `recurring` rows. Delete of a day stays deleted (or Stop is required and said before Delete). Preview copy matches the server.

**Why uninstall / EV:** Wave 3 made yesterday the first fold. If $40 becomes $55 retroactively, or a deleted day comes back, the merchant cannot trust the denominator of Total ROAS.

**Files:** `app/app/lib/spend-recurring.server.ts` (stop updating existing `recurring` rows, or treat a deleted day as a correction); `app/app/lib/recurring-fill-preview.ts`; `app/app/routes/app.spend.tsx`; `app/app/lib/spend-recurring.test.ts`; `app/app/lib/spend-write.server.ts`.

**Verify:** Tests: rematerialize does not change an existing recurring $40 when the rule is now $55 (or explicitly documents and paints “rewrites open-rate days”). Delete + materialize → row still gone. **demcflyads:** the two checks in §3 UNKNOWN.

### 4. Returning / new dollars: one sales basis, never a fake 0%

**Outcome:** Customers / Overview returning $ and % use the **same** sales basis as the Total Sales hero (Total Sales, not net÷total). Missing customer split is **—**, not a 0% bar. Guest remainder is named or omitted, not stuffed into 0%.

**Why uninstall / EV:** “Doesn’t match Shopify” on the tab that is supposed to beat Analytics’ headcount rate.

**Files:** `app/app/lib/shopify-native-stats.ts` (`hasSalesSplit`, shares); `app/app/routes/app.customers.tsx` (`?? 0`); Overview compact returning; tests around `shopify-native-stats` / Customers page.

**Verify:** Tests: `customerMetricsAvailable: false` → shares null, bar not 0. Net-only fields do not divide by Total Sales. **demcflyads:** Customers returning % vs Shopify first-time vs returning **sales** for the same window.

### 5. LTV / Growth: first-on-file is not lifetime first

**Outcome:** Cohort start and “first-time $” stay honest when `numberOfOrders` says the buyer had a life before this 60-day crawl. First year already **—** when `historyLimited`; 90-day hero must not imply birth-to-now. Optional: withhold or relabel cohorts for buyers with `numberOfOrders` > in-window orders.

**Why uninstall / EV:** Lifetimely-class expectation. A “first 90 days” built from a returning buyer’s first **visible** order is a made-up LTV.

**Files:** `app/app/lib/order-facts.server.ts` (`computeCohortRollups`); `app/app/lib/till-ltv.server.ts`; `app/app/lib/shopify-sales.server.ts` (`mixFromCustomerMap` — keep count logic, don’t reuse it as cohort zero); `app/app/routes/app.ltv.tsx`, `app.growth.tsx`.

**Verify:** Tests: a customer with `numberOfOrders: 5` and one in-window order is **not** a new 90-day cohort at that order’s amount. **demcflyads:** known repeat buyer is not a new LTV month.

### 6. Shop currency on every painted dollar (only after 1–5)

**Outcome:** `formatCurrency` / spend paint use `Shop.currencyCode`. No silent USD. Sales and spend use the same rounding story (or the formula footnote says whole dollars).

**Why uninstall / EV:** A CAD shop reading USD `$` is a number mistake. Latent on USD-only demcflyads; kill on the first non-USD install.

**Files:** `app/app/lib/mer-format.ts`; route/component call sites listed in §6; `spend-money.ts` `shopCurrencyCode`.

**Verify:** Tests: passing `CAD` changes the formatted prefix. A default-less or shop-threaded helper so a missed argument cannot go USD. **demcflyads:** USD shop — confirm no regression. Non-USD remains UNKNOWN until a real shop exists.

---

## Out of scope (do not put in Wave 4)

- App Store listing screenshots, listing paste, Partner Submit  
- Ads, inventing smoke / reviews / install counts / metrics  
- CSV / Ads Manager upload friction, template redesign, Spend explorer on Overview  
- `read_all_orders` as the product (Challenge Gate — honesty stays ~60 days)  
- Pixels, Meta/Google OAuth, Klaviyo, P&L, AI analyst, 12th tab  
- Polaris restyle, Fly deploy, `main`, PR #19, `suite/`, `.env`  
- Namecheap MX / `support@`  
- Re-doing Wave 2 SAMPLE handoff or Wave 3 410 / yesterday fold unless an accuracy FAIL forces a touch  

---

## Suggested Wave 4 verify note (human, after implement)

Not this run. When an implement lane ships 1–5: one **Live** pass on demcflyads — Goals year, Overview This year, Customers split vs Shopify, Spend delete+rate, LTV known repeat buyer. SAMPLE Harbor ÷ check from §1 UNKNOWN. No invented PASS.

---

## What Wave 1–3 already closed (do not re-file as Wave 4 product)

- Overview blank Total ROAS / Ad spend wall at $0 spend  
- SAMPLE spend labeled example-only; `guide=real` Live handoff  
- LTV First year **—** when `historyLimited`  
- Book-page 60-day / truncated banners on Customers · Growth · Orders  
- Goals pending/error copy “not $0” (table Actual still fails — Wave 4 #2)  
- 410 → recovery on `/app` + Spend; book `DeskRouteErrorBoundary`  
- Spend first fold = yesterday; Continue $X/day default; Edit does not start a rate  
