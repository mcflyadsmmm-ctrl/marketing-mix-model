# Current desk layout — inventory only

**Superseded 2026-09-15.** Live desk is Fly **310** Pass B. Spec: [`2026-09-15-TAB_LOCK.md`](./2026-09-15-TAB_LOCK.md). Ship plan: [`2026-09-15-desk-ia-live.md`](./2026-09-15-desk-ia-live.md). The inventory below is the **pre-IA** Fly 307 million-store desk (Buyers / Timing / Marketing). Do not implement from this file.

**Date:** 2026-09-15  
**Source:** `marketing-mix-model/` working tree (the Fly **307** million-store desk).  
**Job of this file:** list what paints today, top to bottom, including charts. **Do not implement from this file until Marty marks keep / move / kill.**

Formula (not layout): Total ROAS = Shopify Total Sales ÷ entered spend. Empty spend is not 0×.

---

## Always-on chrome (every Admin page)

1. Shopify Admin **left nav** (`s-app-nav`) — seven items, no hashes:
   1. Overview → `/app`
   2. Orders → `/app/orders`
   3. Buyers → `/app/buyers`
   4. Timing → `/app/timing`
   5. Goals → `/app/goals`
   6. Marketing → `/app/spend`
   7. Settings → `/app/settings`
2. **Sample | Live** bar (`DataModeBar`) above page content.
3. Live desk has **no period slicer** except Goals year. Overview **forces MTD**. Period query still exists for listing shots (`?shot=1`).
4. Overview in-page tabs (`DESK_OVERVIEW_TABS`) = **empty**. As-of + freshness + Share only. Retired hashes `#mcfly-compare` `#mcfly-ledger` `#mcfly-mix` `#mcfly-plan` all land on Overview home.

---

## 1. Overview `/app`

Heading: **Overview**. Live window: **this month (MTD)** even if the URL asked for something else.

### Paint order

| # | Block | What is on it | Chart? |
| --- | --- | --- | --- |
| 1 | Sample banner | Only if Sample on | No |
| 2 | Trust banners | **Top** if cold/empty; otherwise deferred to bottom | No |
| 3 | Loading / sales error | Retry | No |
| 4 | Chrome | As-of chip · freshness chip · Share Overview | No |
| 5 | Hero | Shopify Total Sales (always). Total ROAS sibling **only if spend > 0**. Hint: ~60-day coverage, day span, vs-prior % | No |
| 6 | Glance cards (same block) | Typical order (median; average as hint) · Returning sales $ · Second order days · Weekend % · Discounted orders % · Returns $ — omit zeros | No |
| 7 | One sentence | Returning-sales % / second-order / discounts / “sales from orders” + “Spend not added…” if empty | No |
| 8 | Window **table** | Rows: Yesterday · Last 7 (or Last N) · This month · This quarter · This year. Cols: Sales · Spend · Total ROAS · vs goal · vs last year. Spend/ROAS/vs-goal columns **hidden** until any row has spend | No |
| 9 | Dual-close sentence | Hidden at $0 spend or month-end. MTD-flat close vs last-7 close vs goal | No |
| 10 | Explorer block | Lede: “Total ROAS Explorer” or “Sales explorer” · default **14-day** window | **Yes — primary Overview chart** |
| 11 | Monthly pacing | Nested **under the same explorer section**. Semi-gauge of Total ROAS + 6 tiles (Sales, Spend, Days elapsed, Avg daily sales, Projected period spend, Daily sales needed) + two pace bars | **Yes — gauge** |
| 12 | Trust banners | Coverage, recon, incomplete facts, today truncated, below-BE, margin stale, onboarding | No |

### Overview chart (SpendExplorer, `quiet`)

**Location:** after glance cards + window table + dual-close. **Not** next to the hero.

**Layers on one SVG:**

- Stacked **channel spend bars**
- **Sales** polyline (left $ axis) — on by default
- **Total ROAS** line + dots (right axis)
- Horizontal **target** rail
- Horizontal **break-even** rail (if margin set)

**Controls on Overview:** `quiet` **hides** range / grain / mode rails. Chip clicks still can set dates via URL. Default range **14d**, grain **Day**.

**Not on Overview:** Compare table, Ledger, Channels mix, month plan, Orders/Buyers/Timing book, Goals gauges, add-spend form.

**$0 spend:** Sales hero only (no ROAS). Window table is sales + vs last year only. Dual-close hidden. Chart still paints as **Sales explorer**. Pacing only if month-pace + cash-control exist.

---

## 2. Orders `/app/orders`

Heading: **Orders**. As-of line. No chart.

1. Lede (order-book muted copy)
2. Hero: **Typical order** (median $; average as sub)
3. Sales clock (if period group): Original · After returns · Product only
4. Drill rows (`<details>`): Most orders $ band (p25–p75) · Typical day $ · Discounted orders % · Full price vs discounted typical · Items per order · Orders with 2+ items · Returns/edits $ · Shipping + tax $

---

## 3. Buyers `/app/buyers`

Heading: **Buyers**. As-of line. No chart.

1. Hero: **Sales from returning customers** ($ or %)
2. Drill rows: New vs returning dollars · Sales per buyer · Repeat sales · Days to second · Second within 30 · 2nd vs 3rd+ · Second vs first order $ · Guest checkouts · One-order buyers · Biggest orders · Top 10% of customers · Orders per buyer
3. **LTV snapshot** on the same page:
   - Hero: First 90 days $
   - Rows: First 30 · First year · Repeat rate
   - If spend: Cash CAC · Cash CPA · Value vs cost
   - Link: open full LTV page

---

## 4. Timing `/app/timing`

Heading: **Timing**. As-of line. No chart.

1. Hero: **Weekend sales %** (or busiest weekday / hour)
2. Drill rows: Weekend % · Busiest weekday (+ weekday breakdown) · Busiest hour (+ top hours) · Biggest three days % · Channel mix Online/POS/Shop (+ typical $ by source)

---

## 5. Goals `/app/goals`

Heading: **Goals**. Year selector (not MTD slicer).

### Paint order

1. As-of · YTD % of goal chip · Year dropdown
2. Trial note (if shown)
3. Sample banner
4. **Sales hero** for the loaded period (Overview still forced MTD; this page uses its own period from URL/defaults)
5. If spend: Spend · Total ROAS · Spend ceiling (sales ÷ target) as drill rows
6. **Chart:** MTD · QTD · YTD **progress bars** (`SalesGoalGauges`) — sales vs plan, calendar tick, optional ROAS vs BE/target
7. Year plan: Grow 10% YoY + extra % buttons
8. Open `<details>` **Monthly board**:
   - Plan On/Off
   - If On: current-month close forecast sentence · **12-month table** (Month, Goal, Actual, Spend/Ceiling/MER if spend, Prior, YoY, Pace) with editable goals
   - If Off: YoY sales table (Month, Actual, Spend/MER if spend, Prior, YoY)

No SpendExplorer on Goals.

---

## 6. Marketing `/app/spend`

Heading: **Marketing**. This is the spend room + input, not a second Overview.

### Empty Live (no spend yet)

1. Primary action: Add a day
2. Three doors: Add a day · Daily amount until I change it · Import or backfill
3. Helper: Shopify sales already here; empty spend is $0 never 0×
4. **Add a day** form (date, channel, amount, optional name)
5. **Daily amount** `<details>` (first day, channel, $/day)
6. Status: no spend yet
7. **No** period hero, coverage strip, explorer, mix/plan/ledger, recent list, allocation/advanced footer

### After one typed day (or Sample)

1. Saved banner (optional)
2. **Period pair:** Sales | Total ROAS + Total Spend drill (channel drills omitted once spend room mounts)
3. Three doors
4. Helper line
5. Add a day form
6. Daily amount `<details>`
7. **Coverage strip** (last N closed days, filled vs empty = $0)
8. **Chart (collapsed `<details>`, open if period spend > 0):** “Daily spend by channel” — **same SpendExplorer** as Overview, compact, **with** range/grain/mode/compare. Own date range, not locked to Overview 14d quiet.
9. **Spend room** (one long vertical stack, no subtabs):
   1. Intel table: Last 7 / Last 28 Total ROAS vs prior window + hit-rate sentence + alerts
   2. Compare table: This month vs last month vs last year (sales, spend, ROAS)
   3. Mix window buttons: This month / Last 7 / This quarter
   4. Mix **table** (Channel, Spend, Share, Days, vs last month, vs last year) — click channel for day list. **No mix pie here.**
   5. Plan sentence + daily cap **table** (Last 7 /day vs Plan /day). Email locked.
   6. **Every day** collapsed ledger (Day/Month/Quarter/Year · All/Hit/Miss · Download CSV)
10. Status line (up to date / holes)
11. Recent entries list (edit/delete)
12. Footer links (only if entries): **Spend Allocation** · **Advanced Metrics** (not in left nav)

---

## 7. Import `/app/spend/import` (not in left nav)

Reached from Marketing door 3.

1. Three import doors (template, Ads Manager CSV, add one bill)
2. Template builder (platforms, extra channels, date span) → download `/app/spend/template`
3. Paste / upload CSV
4. Add-one-bill helper
5. Calculators (sales, spend, margin)
6. Day/week/month spend helper
7. **SpendExplorer** again (compact)
8. Recent entries
9. Optional spend automation aside

CSV download route `/app/spend/template` is file-only, not a page.

---

## 8. Settings `/app/settings`

No chart.

1. Definition lede
2. **Desk targets:** Target Total ROAS · optional profit margin (BE preview)
3. **Your plan:** $39 / 7-day trial copy · upgrade/manage
4. More `<details>`: Sample data controls · Privacy JSON exports

---

## Not in left nav (still live URLs)

| URL | What it is |
| --- | --- |
| `/app/allocation` | **Spend Allocation** — period snapshot (sales/spend/ROAS) · takeaway · mix **table + spend-share pie** · **SpendExplorer** (compact, compare) · Best windows · Rolling windows |
| `/app/advanced` | **Advanced Metrics** tile lab — Portfolio efficiency · Affordability control · Acquisition & payback (Shopify + LTV/CAC tiles) · Spend structure · Allocation tiles · Prior period. Links to Allocation / LTV / Spend. No explorer chart. |
| `/app/ltv` | Full LTV: First 90 days hero · 30/365 rows · first-order months list · ReviewAsk footnote. No chart. |
| `/app/demo` | Sample preview on/off (not merchant scoreboard) |
| `/app/billing` | Opens Shopify plans (`_top`) |
| `/app/data-mode` | POST only (Sample/Live) |
| `/app/connections` | Redirect → Marketing |
| `/app/close` | Redirect → Overview |

---

## Chart index (every drawn chart)

| Chart | Where it paints | Layers | Controls |
| --- | --- | --- | --- |
| SpendExplorer | Overview (quiet, open) | Spend bars + sales line + ROAS line + target + BE | Hidden rails; default 14d / Day |
| SpendExplorer | Marketing `<details>` | Same | Range, grain, mode, sales toggle, channel toggles, compare |
| SpendExplorer | Import | Same | Same as Marketing |
| SpendExplorer | Allocation | Same | Same; labeled “Spend and sales drill-down” |
| Monthly pacing gauge | Overview, under explorer | Semi-circle Total ROAS + 6 tiles + 2 bars | None |
| SalesGoalGauges | Goals | 3 horizontal progress bars (MTD/QTD/YTD) | Year select only |
| Spend-share **pie** | Allocation only | Channel % of spend | Click slice |
| Coverage **strip** | Marketing | Filled vs empty days | Click empty → Add a day |

Components that exist but are **not** mounted on Overview: `TotalRoasGauge`, `AllocMixChart`, `GoalsSnapSection`, `MarketingSnapSection`.

---

## Duplicates (same info, more than one place)

- **Total Sales + Total ROAS pair:** Overview hero, Marketing period hero, Goals hero, Allocation snapshot.
- **SpendExplorer:** Overview + Marketing + Import + Allocation.
- **Yesterday / L7 / MTD / QTD / YTD:** Overview window table (sales always; ROAS when spend). Marketing intel is L7/L28 only. Goals gauges are MTD/QTD/YTD vs **sales plan**, not the same chips.
- **Channel mix:** Marketing table, Allocation table+pie, explorer stacked bars (four surfaces).
- **Ledger / every day:** Marketing collapsed table only (not Overview).
- **Compare:** Marketing table (this month / last month / last year). Not an Overview tab.
- **Month plan / remaining spend:** Marketing plan table. Overview dual-close sentence + pacing tiles overlap the same idea.
- **Typical order / returning / weekend:** Overview glance **and** Orders / Buyers / Timing pages.
- **LTV 90/30/365:** Buyers snapshot **and** `/app/ltv` **and** Advanced tiles.
- **Target MER:** Settings form **and** Goals (same field).

---

## Black Clover BCUSA subtabs (reference only — not current Mcfly)

Overview · Compare · Ledger · CPA · Channels · 4.0 plan · YoY · Goals · Customers · Growth · LTV · Returns & honesty · Click Allocation · Email & promo · Klaviyo · Audit.

Mcfly currently: **no Overview subtabs**. Compare/Ledger/Channels/Plan live as **one scroll on Marketing**. CPA / Klaviyo / Click Allocation / Email / Growth / Audit are not product tabs.

---

## Markup legend (for the next pass)

On each row: **K** keep here · **M** move to (page) · **X** kill · **C** chart stays / chart moves.

Do not code until this file is marked.
