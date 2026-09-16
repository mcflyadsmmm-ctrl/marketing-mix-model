# Tab uninstall audit — 2026-09-15

**Lane:** Tab uninstall audit. Read-only on `app/**`. Did not patch Desk-owned files (`CashTrustBanners`, order-facts, job-queue). Did not edit `site/**`, listing paste, or `LIVING_BOARD.md`. Mcfly reviews stay **0**.

**Tree:** `marketing-mix-model/` on `cursor/spend-trust-recurring` (working tree dirty; Desk busy-shop backfill may still be writing). Nav and routes are the 11 analysis tabs + Settings from `DESK_PRIMARY_NAV`. Fly **318** is production; this audit is **this tree’s paint**, not Admin smoke PASS.

**Listing:** [https://apps.shopify.com/mcfly-analytics-public](https://apps.shopify.com/mcfly-analytics-public) · 7-day then **$39**. Formula: Total ROAS = Shopify Total Sales ÷ entered spend. Empty spend is **—** not 0×. No pixels / MTA / OAuth / Klaviyo / `read_all_orders`.

**Walked first-session path in code:** Install → Admin at **$0 typed spend** → Overview → Customers → Growth → Orders → LTV → then Spend Upload → Total ROAS → Allocation → CPA. Grounded in `docs/plans/2026-09-15-TAB_LOCK.md` and the 2026-09-15 research matrix.

**Score axes (1–5):** (1) first 10 seconds · (2) useful at $0 spend · (3) accuracy / honesty · (4) depth vs native Shopify Analytics · (5) click-for-detail / charts / icon chips · (6) next action without a spend wall on Shopify five.

Marks: **P0** uninstall this trial · **P1** week-one disappointment · **later** · **Refuse** (out of religion — do not build).

---

## Ranked P0 uninstall list (max 7)

Grounded in `2026-09-15-tab-vs-complaints.md` ranks 1–7 and native/competitor citations. Do **not** treat Spend Upload form easiness as #1.

| Rank | P0 | Why they uninstall | Evidence in this tree | Ground |
| ---: | --- | --- | --- | --- |
| 1 | **Overview paints Total ROAS + Ad spend on first open at $0 spend** | “This is an ads app. I have to connect spend before it is useful.” Same motion as Triple Whale pixel + Polar login walls — even though ROAS is an em dash, not 0×. | `OverviewFirstViewport` 2×2: Total Sales · **Total ROAS —** · **Ad spend —** (“Add spend to see Total ROAS”) · typical/EOM. Decision actions include **Spend Upload →** next to Open Orders. Copy says “Overview works without it” **under** the blank ROAS tile. | TW5 / TW1 analog; tab-vs-complaints **#1**; TAB_LOCK Overview = three YoY **sales** cards only |
| 2 | **Overview first viewport is not the locked job** | Merchant came for “am I up or down vs last year.” They get a KPI wall + sales bars Shopify Analytics already has. YoY cards exist **below** the chart. Tile wall = bounce to Analytics (or uninstall). | `app._index.tsx` mounts `OverviewFirstViewport` + `OverviewSalesChart` + `PeriodControl` **then** `OverviewYoyCards`. TAB_LOCK: three YoY cards, **chart none this pass**, no page-level period, no typical-order / explorer / ROAS hero. CSS: `.mcfly-score .mcfly-kpi-grid` is 2×2 / 4-up, plus 4 compact cells — not three sales cards. | S8 / S9 / TW8 / Polar YoY 1-star; TAB_LOCK Overview; tab-vs-complaints Overview **Gap (P0 spend wall)** |
| 3 | **Customers / Growth / Orders seal incomplete sales as “live”** | “The number is not Shopify’s number” / truncated today looks finished. Overview + LTV show truncated / 60-day banners; the three book routes do not. | `loadDeskSalesPage` returns `todaySalesTruncated` / `todaySalesUnavailable`; **Customers, Growth, Orders ignore both**. No `CashTrustBanners`. Till label is `{period} · live sales` with **no ~60-day line**. Ledes override `shopifyBookMuted` (which *does* say last ~60 days). Pick **This year / Last 12 months** on `PeriodControl` and there is no `shopifyOrderWindowLimited` banner. | S11 / TW3 / NB1 / PO3; research audit #2 “every Shopify tab: 60-day coverage visible” |
| 4 | **YTD / “This year” overclaims a ~60-day `read_orders` pull** | Sidekick-class distrust: a card named This year that is really ~60 days, or Last 12 months painted as a year of this shop. | Default period is **MTD** (honest-ish in September). Compact `PeriodControl` still offers **YTD / Last mo**; full control offers **Last 12 months**. YoY cards always title **This year**. `OVERVIEW_YOY_SAME_WINDOW` saves the case when MTD=QTD=YTD collapse; if 60 days spans last month, YTD > MTD and the card still says This year with no missing-year-of-life note. | S9 / S11 / Polar “no YoY line”; TAB_LOCK missing last year ≠ $0 **and** do not look like a full year |
| 5 | **LTV “First year” can still be a dollar figure inside 60 days** | “$0 LTV” is already handled. The remaining lie is a **real-looking 365** that is only the orders Shopify shared. | `app.ltv.tsx` pushes **First year** whenever `avgRevenueD365` is numeric. `historyLimited` adds a lede *below* the grid. `till-ltv.server.ts` still averages `revenueD365` when `historyLimited` is true. Empty-only path uses `history_limited` → “not $0 LTV” — good. The **painted** 365 is the gap. | S10 / S11 / Lifetimely analog; tab-vs-complaints LTV **Gap if 365 is implied complete** |
| 6 | **Overview “Returning” compact cell can fall back to headcount** | “This is just Shopify’s returning-customer rate with extra clicks.” | `OverviewFirstViewport` `returningValue`: dollars if present, else **returning customer count**, else **share %**. Native Overview already is a headcount rate (Staff Ivy_4). Customers tab itself is dollars-first — Overview first viewport can contradict it. | S2 / S3; TAB_LOCK returning $ is **Customers**, not Overview |
| 7 | **Period chips still live in Overview chrome (and on Shopify-five book pages)** | First 10 seconds: merchant thinks the job is a global slicer, not three YoY cards. Clicking YTD/L12M triggers #4 without the book pages even warning. | `app._index.tsx` `PeriodControl compact` in `mcfly-ctx`. `DeskBookPage` defaults `showPeriod={true}` for Customers / Growth / Orders / LTV / CPA. TAB_LOCK: clocks on the card; Overview has **no page-level period**. YoY page correctly sets `showPeriod={false}`. | TAB_LOCK chrome law; S11 |

**Not P0 (this wave):** Spend Upload form friction · CPA empty dashes · Allocation margin/spend empty cockpit · Goals needing last-year to one-click Grow 10% · 11-tab nav intimidation *if* Overview is fixed. Those are P1.

**Refuse (do not “fix” P0s with):** pixels, Meta/Google OAuth, Klaviyo, P&L, AI analyst / Sidekick clone, `read_all_orders`, 12th tab, GMV pricing.

---

## Shopify five — retain vs native Analytics **in this tree**

Spend six cannot substitute. Verdict is **whether the tab, at $0 spend, compresses a native pain in the first minutes**.

| Tab | Retains vs native? | Why |
| --- | --- | --- |
| **Overview** | **No — not as locked.** Sales and YoY math exist, but first open looks like an ads scoreboard. Native Analytics already shows this period’s sales + a chart. Our unique job (same days last year, honest missing ≠ $0) is **below the fold**. | Must ship P0 #1–2 before Overview retains. |
| **Customers** | **Yes, retain** | Returning **dollars** hero, new vs returning **$** bars, guests, one-order buyers, top 10% of **customers**, $ per buyer. Native is a headcount **rate** and a plan-gated sales report. **P1:** no 60-day / truncated banners. |
| **Growth** | **Yes, retain** | First-time **$** hero, days to second, 2nd in 30 days, 2nd vs 3rd+, 2nd vs 1st $, first-order-month bars, Open LTV. That is CSV / Repeat Customer Insights territory, not Overview. **P1:** same honesty hole. |
| **Orders** | **Yes, retain — strongest moat** | Typical **median** hero + “Shopify Analytics uses the average,” sales clocks, p25–p75, discounts, 2+ items, biggest 10% of **orders**, weekend / hour / POS mix, **clickable weekday chart**. This is the native median + buried Group-by hour complaint. **P1:** honesty hole; no footer next-link. |
| **LTV** | **Yes, retain with asterisk** | First 90 days hero from orders; 30 / orders-in-90; Cash CAC **only if spend typed**; truncated-today banners; `history_limited` empty copy is honest. Asterisk = P0 #5 if First year looks complete. |

**Bottom line:** Customers, Growth, and Orders are already the retention moat at $0 spend **if the merchant reaches them**. Overview is the greeting and currently **fails** the greeting. LTV retains if 365 stays honest.

---

## Spend Upload easiness vs Overview spend wall

**Overview spend wall is first.** Spend Upload is **not** the door-uninstall in this tree.

- First open never requires Spend Upload to see sales, typical order, returning $, or YoY cards. The failure is **visual**: blank Total ROAS + Ad spend + **Spend Upload →** on the home 2×2 (P0 #1).
- `/app/spend` is **input-only** in the route JSX: three doors (Add a day · Daily amount until I change it · Import/CSV), add-a-day form on the page, recurring in `<details>`, coverage strip only after there are rows, recent edit/delete. **No** `SpendExplorer` on `app.spend.tsx` (import loader still *builds* explorer series but does not mount the chart).
- Honest empty: “Shopify sales are already here. Empty spend is $0, never 0×.” That is the right door copy.
- After save: banner points to Total ROAS. Recurring + CSV exist. Friction is **form density**, not an OAuth wall.

Task 4 in `uninstall-retention.md` (Spend Upload easiness) should **wait** until Overview P0s land. Making the door prettier will not save a trial that already bounced from a blank ROAS tile.

---

## Scoreboard (every analysis tab + Settings)

| Tab | 1 First 10s | 2 $0 spend | 3 Honesty | 4 vs native | 5 Click/charts | 6 Next | Spend wall | Lie risk | Priority |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Overview | 2 | 2 | 4 | 3 | 4 | 3 | **Y** (visual) | 0× **N**; YTD overclaim; returning headcount fallback | **P0** |
| Customers | 4 | **5** | 3 | **5** | 4 | 5 | **N** | Sealed incomplete | **P1** honesty |
| Growth | 4 | **5** | 3 | **5** | 4 | 5 | **N** | Sealed incomplete | **P1** honesty |
| Orders | **5** | **5** | 3 | **5** | **5** | 4 | **N** | Sealed incomplete | **P1** honesty |
| LTV | 4 | 4 | 4 | 4 | 3 | 4 | **N** | 365 looks complete | **P0** #5 |
| Spend Upload | 4 | n/a (input) | 4 | n/a | 3 | 4 | n/a | Empty day = $0 spend (intentional) | later (after Overview) |
| Total ROAS | 3 | 3 | 4 | 4 | 4 | 4 | n/a (spend tab) | Spend KPI `$0` not —; explorer copy still says “Marketing” | **P1** |
| Channel Allocation | 2 | 2 | 3 | 3 | 3 | 3 | n/a | `$0` spend snap; margin warn before mix | **P1** |
| YoY | 4 | 4 | 4 | 4 | 4 | 4 | **N** | Missing 12-month board vs lock | **P1** lock gap |
| CPA | 3 | 2 (correctly empty) | 4 | 3 | 3 | 4 | n/a | Three `keepDash` — tiles look broken, not $0 CPA | **P1** |
| Goals | 4 | 4 | 3 | 4 | 4 | 4 | **N** | Error banner “actuals stay $0”; Grow 10% needs last year | **P1** |
| Settings | 4 | 4 | **5** | n/a | n/a | 3 | n/a | SAMPLE vs Live labeled; save CTA pushes Spend Upload | later |

Shopify five **must** score 4–5 on axis 2 or it is P0. Overview **2** → P0. The other four pass axis 2.

---

## Per tab

### 1. Overview `/app`

**Job (lock):** One glance — up or down vs last year. Three YoY **sales** cards (This month / quarter / year). Coverage line. Missing last year ≠ $0. No typical-order, explorer, pacing, ROAS hero, spend.

**What paints (this tree)**

- Context: shop · `{period} · live sales` · **PeriodControl** (MTD/QTD/YTD/Last mo) · SAMPLE chip · share.
- `OverviewFirstViewport`: “What to notice” (typical order + returning **share** — not AI) · 2×2 KPIs **Total Sales / Total ROAS / Ad spend / typical-or-EOM-ROAS** · compact Orders / New customers / Returning / Typical order · weekend pipe · Open Orders + **Spend Upload →**.
- `OverviewSalesChart`: day/week sales bars, click for detail. TAB_LOCK: **none this pass**. Native Analytics already has sales-over-time.
- `OverviewYoyCards`: three cards, last year **—** + `OVERVIEW_YOY_MISSING`, collapse note `OVERVIEW_YOY_SAME_WINDOW`. Click → YoY.
- `CashTrustBanners` (Desk may still be editing): 60-day period, incomplete facts, truncated today. Incomplete copy is **spend-centric** (“Your spend is already counted…”) even at $0 spend.
- Explorer **not** remounted (good).

**Missing vs TAB_LOCK:** First viewport should *be* the three YoY cards. Period chips, ROAS/spend KPIs, typical order, sales chart all contradict lock.

**Spend wall:** **Y** — visual, not a hard gate. Sales still paint. ROAS is **—**, not 0× (`computeMer` null when spend ≤ 0). Subcopy on Ad spend: “Add spend to see Total ROAS.”

**Lie risk:** 0× **no**. Pending sales: “still loading — not $0.” Last year: **—** when `priorSales == null` (`priorMtd.length` empty → null, not $0). Compact Returning may show **headcount**. YTD KPI follows PeriodControl (P0 #4).

**Density:** KPI wall + compact row + chart + YoY — **wrong** density for the greeting (TW8). Founder craft unlock still wants density **on the Shopify book**, not a ROAS cockpit on home.

**Next:** Open Orders is right; Spend Upload as equal verb is the wall.

**Priority:** **P0**.

---

### 2. Customers `/app/customers`

**Job:** Who already buys — **dollars**, not headcount.

**What paints:** Contrast lede vs native **rate**. Hero **Sales from returning customers $**. `ShareBarsChart` new vs returning dollars. Rows: new vs returning %, $ per buyer, repeat sales %, guests + typical guest vs account, one-order buyers, top 10% of customers, orders per buyer. Footer: Growth · LTV. `DeskIcon` + click-for-detail. **No spend CTA.**

**Missing vs lock:** Coverage line / as-of of facts on file (lede does not say ~60 days). No clocks (correct — clocks are Orders).

**Spend wall:** **N**.

**Lie risk:** Sealed incomplete (P0 #3). If `customerMetricsAvailable` is false: “Returning dollars need identified buyers — not $0” (good). Hero can fall back to share % or identified-buyer count if no returning $ — weaker than the dollar hero, not a spend wall.

**vs native:** **Retains.** Compresses plan-gated first-time vs returning **sales** + Staff headcount-rate confusion.

**Priority:** **P1** honesty (banners + 60-day line). Do not add Klaviyo lists (**Refuse**).

---

### 3. Growth `/app/growth`

**Job:** New dollars and who came back.

**What paints:** First-time **$** hero. Rows: new customers, days to 2nd, 2nd in 30d, 2nd vs 3rd+, 2nd vs 1st $. Repeat rate from `tillLtv` (first-90 extra orders — close to lock). First-order-month `CountBarsChart`. Open LTV. **No spend.**

**Missing vs lock:** Coverage line. Repeat rate is 90-day LTV extra-orders, not strictly “in this window.”

**Spend wall:** **N**.

**Lie risk:** Sealed incomplete (P0 #3). 2nd-in-30d already caveats “full 30 days to come back.”

**vs native:** **Retains.** Days-to-second / 2nd in 30 days is CSV or another app.

**Priority:** **P1** honesty. **Refuse** email/SMS/subscribe counts.

---

### 4. Orders `/app/orders`

**Job:** Typical (median) order + when/where it lands.

**What paints:** Median hero + average as Shopify hint. Clocks: original · after returns · product only. Rows: most-orders band, typical day, discounted share, full vs discounted typical, items, 2+ items, returns/edits $, shipping+tax, biggest 10% of **orders**. Timing: weekend %, busiest weekday + breakdown in drill, busiest hour + top hours, biggest three days, Online/POS/Shop + typical $. `WeekdaySalesChart` clickable. **No spend / ROAS.**

**Missing vs lock:** Coverage line. Hour is a row + drill (not only “click for detail” with no weekday chart — weekday chart **is** there). No footer next-action.

**Spend wall:** **N**.

**Lie risk:** Sealed incomplete (P0 #3). `$0` returns omitted (good). Weekend 0% omitted (good).

**vs native:** **Retains — strongest.** Median request 2023–2025 + buried hour Group-by.

**Priority:** **P1** honesty. **Refuse** Timing as a 12th tab, SKU reports.

---

### 5. LTV `/app/ltv`

**Job:** What a new buyer is worth over 30 / 90 / 365 from **orders**. Cash CAC only if spend typed.

**What paints:** 90-day hero + def. Rows 30 / orders-in-90 / First year / kept-after-margin / repeat. Cash CAC + value-vs-cost **only when `hasSpend`**. First-order-month grid. `historyLimited` lede. Truncated / unavailable today banners. Empty: “not $0 LTV.” SAMPLE banner. Footer: CPA if spend else **Spend Upload** (optional door, not a hero wall). `ReviewAsk` present (reviews still **0** — do not invent).

**Missing vs lock:** 365 can paint while limited (P0 #5). No chart (lock: none v1).

**Spend wall:** **N**.

**Lie risk:** First year dollars inside 60-day. Margin “kept after” uses default margin until Settings confirm — labeled. Do not turn this into P&L (**Refuse**).

**vs native:** **Retains** 90-day order LTV that Overview does not show.

**Priority:** **P0** #5 then P1 polish (omit or relabel 365 when `historyLimited`).

---

### 6. Spend Upload `/app/spend`

**Job:** Get spend on file. Input only. Honest empty: sales already here; empty ≠ 0×.

**What paints:** Contrast lede (not Ads Manager login). Three `SPEND_DOORS`. Helper: never 0×. Add-a-day form. Recurring in details. Coverage strip + recent rows **after** first entry. No explorer, no mix pie, no Total ROAS hero.

**Missing vs lock:** Import route still **computes** explorer in the loader (dead weight, not painted). Helper says empty spend is **$0** (day honesty) vs ROAS **—** — consistent if Overview stops competing.

**Spend wall:** n/a (this *is* the door).

**Lie risk:** Unfilled days = $0 spend (correct for the ledger). Not 0×.

**Priority:** **later** (Task 4 only after Overview P0). Do not add OAuth (**Refuse**).

---

### 7. Total ROAS `/app/roas`

**Job:** Sales next to spend + explorer. Empty = blank ROAS, never 0×.

**What paints:** Trio Sales | Spend | Total ROAS. Sales pending → —. ROAS **—** + Upload Spend link when empty. `CertifiedScoreboard` (Yesterday / last N / MTD / QTD / YTD chips; zone “No spend”). `SpendExplorer` (range/grain **on the chart**). Dual-close **hidden** at $0 spend (`dualCloseLineModel` requires MTD spend > 0). Monthly pacing **only if `hasSpend`**. `MarketingSpendRoom` if `cashControl`.

**Missing vs lock:** Spend KPI uses `formatCurrency(totalSpend)` → **$0.00** at empty (Overview uses —). Explorer empty copy still says add spend in **Marketing**. Certified chip row at $0 is a cockpit (TW8) — sales still show, ROAS —. Intel L7/L28 is inside the room, not a labeled table.

**Spend wall:** Expected for this tab. Sales still show (lock).

**Lie risk:** 0× **no**. Explorer empty title “No spend in …” is honest.

**Priority:** **P1** (dash the spend KPI; rename Marketing → Spend Upload; consider hiding certified ROAS chips until a day is typed — keep sales). **Refuse** platform ROAS / MTA.

---

### 8. Channel Allocation `/app/allocation`

**Job:** Where typed dollars went + daily cap. Mix table/pie; windows on the mix, not the nav.

**What paints:** Contrast lede. `PeriodSnapshotSection` Sales / Spend / Total ROAS / Top channel — Spend is **$0.00**, ROAS **—**. Takeaway: “Add spend to see where the money went.” Mix, best windows, rolling, `SpendMixPlan` if board exists. Empty state **below** the empty sections. If margin unconfirmed: **“Set profit margin”** warn (`zeroMargin`) — a **margin wall** on a spend-mix page.

**Missing vs lock:** Mix window buttons should sit **on the mix table**; page still has a large v2 cockpit. Empty mix should be one honest empty, not four hollow sections then a CTA.

**Spend wall:** Expected. First paint is still a cockpit + Settings CTA.

**Lie risk:** Empty mix is not a fake 100% share (good). `$0` spend snap. Do not invent channel ROAS from pixels (**Refuse**).

**Priority:** **P1**. Not first-session P0.

---

### 9. YoY `/app/yoy`

**Job:** This year vs last for **sales and spend**; ROAS columns only when spend exists. Not the Overview three cards.

**What paints:** This month / last month / this month last year cards. Spend + Total ROAS **only if any spend in the board**. Last 7 vs prior 7 facts (sales always). `OVERVIEW_YOY_MISSING` when last year sales null. `showPeriod={false}`. Click → Overview. No explorer (good).

**Missing vs lock:** 12-month actual vs prior vs YoY % board. Channel vs last year. Optional monthly bars.

**Spend wall:** **N**.

**Lie risk:** Last year **—** not $0. Last 7 empty **—**.

**vs native:** Operating compare + last 7; Overview keeps the three glance cards. Polar “no YoY line” is **Overview’s** job; this page is the deeper table.

**Priority:** **P1** lock completeness. Honesty strings already exist.

---

### 10. CPA `/app/cpa`

**Job:** Cash CPA/CAC from **typed spend**, not Ads Manager. Empty = add spend, never $0 CPA.

**What paints:** Contrast lede. Empty: “Add spend in Spend Upload to calculate…” Three `keepDash` tiles Cash CPA / Cash CAC / New sales ÷ spend as **—**. Identified buyers / payback only when they exist. Footer LTV · Spend Upload. Window is **page PeriodControl**, not on-card This month / last 28 (lock miss).

**Spend wall:** Expected. Does not block Shopify five.

**Lie risk:** Not $0 CPA. Three dashes can look like a **broken product** (tab-vs-complaints CPA audit).

**Priority:** **P1** (one empty lede + one CTA; hide dash tiles until spend). **Refuse** platform CPA / pixels.

---

### 11. Goals `/app/goals`

**Job:** Sales plan vs actual. Target Total ROAS in Settings. Works as sales vs plan at $0 spend.

**What paints:** Year dropdown **on the page**. Sales hero for the period (pending → —). Spend/ROAS/ceiling **only if period has spend**. Lede mentions Spend Upload for ROAS **as extra**, not a gate. `SalesGoalGauges` MTD/QTD/YTD; muted “Spend optional.” Grow 10% YoY + extra %; needs prior-year sales on file (60-day live will say so). Monthly board hides spend columns when `yearHasSpend` is false.

**Missing vs lock:** Error banner: “goals still save; **actuals stay $0** until the sales pull works” — language paints pending as $0 (**P1**). YTD gauge can overclaim 60-day year (same as P0 #4).

**Spend wall:** **N**.

**Priority:** **P1**. **Refuse** SpendExplorer / ad-budget writeback.

---

### 12. Settings `/app/settings` (not a 13th analysis tab)

**Job:** Target Total ROAS, optional margin, Sample | Live, billing. Not reports.

**What paints:** Lede: not reports; margin optional. Target required. SAMPLE banner when sample on. Plan: **$39** / 7-day (no GMV tax). Sample | Live switch with Harbor vs this shop’s orders. “Right now: Sample data | Live data.” DataModeBar on analysis pages is SAMPLE **status only** (switch lives here) — Polar extra-login analog **does not apply**.

**Spend wall:** Save-success CTA is Spend Upload if no live spend — fine for Settings, wrong if Overview already pushed spend.

**Lie risk:** SAMPLE labeled. Billing copy is flat $39.

**Priority:** later. **Refuse** GMV tiers.

---

## Chrome / density / first-session path

**Nav (`app.tsx` + `desk-nav.ts`):** Overview · Customers · Growth · Orders · LTV · Spend Upload · Total ROAS · Channel Allocation · YoY · CPA · Goals · Settings. Order matches lock. Redirects (`/app/buyers` → Customers, etc.) not re-audited as tabs. `/app/advanced` stays unlinked.

**First 10 seconds on Overview:** Job is **not** obvious. Merchant sees Total Sales + blank ROAS + Ad spend, then a sales chart native already has, then (if they scroll) the actual YoY job.

**If they skip Overview and open Customers / Orders:** The desk **does** beat Analytics at $0 spend. Retention depends on **not** bouncing at home.

**`mcfly-desk.css`:** Book KPI grids and YoY cards are dense (founder unlock). Overview `.mcfly-score .mcfly-kpi-grid` 4-up + `.mcfly-compact` 4-up is a **second scoreboard**, not three thin YoY stats. Shopify-five book heroes (`.mcfly-book__hero-v`) are the impressive pattern to copy onto Overview YoY.

**`CashTrustBanners`:** Read only. New `orderFactsTruncated` prop exists; **Overview does not pass it** yet (Desk in flight). Incomplete-facts body still talks about spend on a $0-spend Overview.

---

## Recommended P0 desk fixes (for Conductor Task 3 — do not implement in this lane)

Exclusive `app/app/**` after Desk releases file locks. No new tabs. No connectors.

1. **OverviewFirstViewport:** At `spendEmpty`, do **not** paint Total ROAS / Ad spend KPIs. First viewport = three YoY sales cards (`OverviewYoyCards` up). Keep “Overview works without spend” as a quiet line, not a Spend Upload verb competing with Open Orders.
2. **Remove or demote `OverviewSalesChart` on Overview** (lock: none this pass; native already has it). Explorer stays on Total ROAS.
3. **Drop Overview `PeriodControl`.** MTD/QTD/YTD **are** the three cards. Book pages: either as-of-only or keep period **on the card** with the same 60-day banner Overview has.
4. **Customers / Growth / Orders:** Paint 60-day coverage + truncated/unavailable/incomplete — same honesty as Overview/LTV. Never label incomplete as “live sales.”
5. **LTV:** If `historyLimited`, omit or relabel First year (“on file in this ~60-day window — not a calendar year”), never a sealed 365.
6. **Overview Returning compact:** Dollars or omit — never headcount as the value.
7. **YTD / This year copy** when windows collapse or period > 60 days: reuse `OVERVIEW_YOY_SAME_WINDOW` / `OVERVIEW_YOY_MISSING` on the card face, not only in a footnote.

**Do not do in Task 3:** Spend Upload redesign, pixels, OAuth, Klaviyo, P&L, AI analyst, `read_all_orders`, 12th tab, Allocation cockpit, CPA polish (P1).

---

## Files written

- `docs/ops/research/2026-09-15-tab-uninstall-audit.md` (this file)

Read, not written: `docs/LIVING_BOARD.md`, `docs/plans/2026-09-15-TAB_LOCK.md`, `docs/ops/research/2026-09-15-competitor-uninstall-signals.md`, `docs/ops/research/2026-09-15-shopify-analytics-gaps.md`, `docs/ops/research/2026-09-15-tab-vs-complaints.md`, `docs/plans/2026-09-15-uninstall-retention.md`, plus the routes/components listed in the prompt.
