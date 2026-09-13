# Mcfly desk IA skeleton

**Status:** working draft for Marty + agent — react before we rebuild chrome.  
**Craft bar:** Black Clover MER Dashboard smoothness (decision → dense KPI rail → composed sections).  
**Not a wall of charts.** Each section = one job, one headline, one visual.

---

## Why it feels “closer but not smooth”

Today each Shopify depth tab is roughly:

1. Period control  
2. Ops desk island (decision + 4 KPIs)  
3. **Flat grid** of every core catalog card, then “more”

Black Clover feels organized because the **page is a sequence of named sections**, not a progressive dump of 10–20 widgets. Same data can live in a calmer composition.

---

## Global chrome (every Shopify tab)

| Zone | What | Notes |
| --- | --- | --- |
| **Top nav** | Sales · Customers · Goals · Marketing Spend · Settings | Keep. Allocation / Advanced stay under Spend subnav. |
| **Period** | Single period control | Same control on Sales / Customers / Goals. |
| **Honesty strip** | Day-accuracy / open-day / Admin mismatch | One quiet line under period — never a second hero. |
| **Decision strip** | One takeaway + why + 1–2 actions | Black Clover “banner” equivalent. |
| **KPI rail** | Exactly 3–4 numbers | Sales · Orders · AOV (+ one context KPI). No 6-up. |

**Overview (`/app`)** stays a redirect into Sales (or later a thin “today” till). No competing home dashboard.

---

## Tab 1 — Sales (`/app/sales`)

**Job:** “How did the till move this period — and what day pattern should I act on?”

### Viewport 1 (first screen)

| Order | Block | Type | Source / notes |
| --- | --- | --- | --- |
| 1 | Period + honesty | chrome | SalesDayAccuracy |
| 2 | Decision strip | callout | `buildSalesDepthDecision` |
| 3 | KPI rail | kpi_row | Sales · Orders · AOV · (+ volatility or prior delta) |
| 4 | **Day board** | **table** | `day_board` — primary visual, full width |
| 5 | Strongest / softest | callout | one line under the table |

No other charts above the fold.

### Section A — Rhythm (scroll)

| Block | Type | Catalog id | Keep? |
| --- | --- | --- | --- |
| Weekday rhythm | bars | `weekday_rhythm` | **Yes — core** |
| Weekend vs weekday | share | `weekend_vs_weekday` | **Yes — core** |
| New vs returning $ | share | `new_vs_returning_sales` | **Yes — core** |

### Section B — What changed (scroll)

| Block | Type | Catalog id | Keep? |
| --- | --- | --- | --- |
| Pace vs prior | kpi_row | `pace_vs_prior` | Yes |
| What changed | callout | `what_changed` | Yes |
| WoW / MoM / YoY | kpi_row | `wow_mom_yoy` | Later / More |

### Section C — Order shape (More / expand)

| Block | Type | Catalog id |
| --- | --- | --- |
| AOV distribution | histogram | `aov_distribution` |
| Gross vs net vs total | share | `sales_basis_compare` |
| Discount / shipping / tax shares | kpi_row | `discount_dependency`, `shipping_share`, `tax_duty_share` |
| Guest vs logged-in | share | `guest_vs_logged_in` |
| Hour-of-day | bars | `hour_of_day` |
| Day-of-month | bars | `day_of_month` |

### Park / cut from first Sales pass

- `sales_streaks`, `seasonality_dow`, `same_day_multi`, `units_per_order`, `refund_haircut`, `sales_export` → More drawer or Settings export  
- Heavy route `/app/sales/heavy` = full catalog for listing shots only

---

## Tab 2 — Customers (`/app/customers`)

**Job:** “Who is carrying revenue — and is repeat healthy?”

### Viewport 1

| Order | Block | Type | Notes |
| --- | --- | --- | --- |
| 1 | Period + honesty | chrome | Same strip family as Sales |
| 2 | Decision strip | callout | `buildCustomersDepthDecision` |
| 3 | KPI rail | kpi_row | Returning share · 2nd-order 90d · Median days to 2nd · (+ concentration) |
| 4 | **Buyer concentration** | **bars** | Primary visual |
| 5 | Returning sales share | share | Sibling, not a third hero |

### Section A — Repeat health

| Block | Type | Catalog id | Keep? |
| --- | --- | --- | --- |
| 2nd-order 30/60/90 | bars | `second_order_30_60_90` | **Yes** |
| Median days to 2nd | kpi_row | `median_days_to_second` | Yes |
| One-and-done | kpi_row | `one_and_done` | Yes |
| First vs subsequent $ | share | `first_vs_subsequent` | Yes |

### Section B — Cohorts & whales (More)

| Block | Type | Catalog id |
| --- | --- | --- |
| Cohort LTV 30/90/365 | bars | `cohort_ltv_30_90_365` |
| Cohort month quality | ranked | `cohort_quality_rank` |
| Whale board | ranked | `whale_board` |
| RFM-lite | share | `rfm_lite` |
| Lapsing / reactivation | kpi_row | `lapsing_risk`, `reactivation_share` |

### Park

- Deep LTV (`/app/ltv`) stays a **later** wing linked from Section B — not a 5th top nav  
- `/app/customers/heavy` = listing / full catalog only

---

## Tab 3 — Goals (`/app/goals`)

**Job:** “Am I on pace for the month — closed days only?”

### Viewport 1

| Order | Block | Type | Notes |
| --- | --- | --- | --- |
| 1 | Period (month-aware) | chrome | |
| 2 | Decision / pace strip | callout | Starting on day-1 — never Miss at 0% |
| 3 | KPI rail | kpi_row | MTD sales · Goal · Pace % · Spend (if entered) |
| 4 | **Monthly goal board** | **table** | `sales_goal_board` — primary |
| 5 | YoY grow presets | callout | `yoy_grow` — secondary |

No depth-chart dump on Goals. Keep it a pacing desk.

---

## Tab 4 — Marketing Spend (`/app/spend`)

**Job:** “Enter honest spend; see MER against Shopify sales.”

### Viewport 1

| Order | Block | Type |
| --- | --- | --- |
| 1 | Period | chrome |
| 2 | MER / spend decision strip | callout — incomplete coverage honesty |
| 3 | KPI rail | Sales · Spend · MER · Coverage % |
| 4 | **Spend entry table** | **table** — day × channel (primary work surface) |
| 5 | Channel mix | share/bars — one chart under the table |

### Subnav (not top nav)

| Route | Job |
| --- | --- |
| `/app/allocation` | What-if / cut suggestion — after spend exists |
| `/app/advanced` | Explorer / recon — power users |

Spend never steals first-run from Sales.

---

## Tab 5 — Settings (`/app/settings`)

**Job:** margin, sample desk, currency/timezone honesty, exports, billing link.

No charts. Short form + status.

---

## Composition rules (steal from Black Clover)

1. **One hero visual per tab** — Sales = day table; Customers = concentration; Goals = goal board; Spend = entry table.  
2. **Decision strip never competes with a chart** — text first, then KPIs, then one visual.  
3. **Max ~3 sections below the fold on core** — everything else behind More / Heavy.  
4. **No cards-for-decoration** — card only if it is the interaction (entry, goal edit).  
5. **Same left edge, same period, same honesty language** across Sales / Customers / Goals.  
6. **Depth catalog stays the engine** — IA only re-homes features into named sections; we do not invent a second metrics layer.

---

## Proposed build order (after Marty signs the skeleton)

1. Lock this doc (edits welcome).  
2. Sales: recompose route into sections (no new metrics).  
3. Customers: same.  
4. Goals: strip anything that isn’t pace + board.  
5. Shared section chrome (title + one line + slot).  
6. Only then touch motion / Fraunces / paper craft.

---

## Open questions for Marty

1. **Sales hero:** Day board table (current lean) or weekday rhythm bars?  
2. **Customers hero:** Concentration bars or 2nd-order 30/60/90?  
3. **Overview:** Keep redirect to Sales, or a thin “today only” till?  
4. **LTV:** Stay linked under Customers More, or promote later?  
5. Anything in the catalog you want **deleted** (not just parked)?
