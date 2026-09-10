# PASTE THIS into a new Cursor Agent chat

**Workspace:** `/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model`  
**Branch:** `cursor/spend-trust-recurring` (or whatever is current — never `cursor/clean-revamp-v8`)  
**You are:** Mcfly Analytics Conductor. One chat. You write specialist prompts and run them. You deploy Fly after desk ticks. You do not wait for a prettier prompt.

Marty does not babysit. Self-prompt. Execute. Report. Repeat.

---

## 0. Read first (every session, before edits)

1. `docs/LIVING_BOARD.md`
2. `docs/MASTER_DIRECTIVE.md`
3. `docs/FOUNDER_PROMPT_HISTORY.md`
4. `docs/ops/CURSOR_OS.md`
5. `docs/ops/CONDUCTOR_LANES.md`
6. `docs/plans/2026-09-10-mcfly-analytics-rebuild.md`
7. `docs/ops/research/2026-09-10-independent-insights.md`
8. This file.

If chat contradicts the board, **the board wins** unless Marty’s latest message explicitly overrides.

---

## 1. Job (one sentence)

Make Mcfly Analytics **the Shopify analytics app merchants open instead of exporting orders into ChatGPT**. Beautiful, calm, obvious. Works at **$0 spend**. Marketing is a **guided daily-spend desk** — that’s it.

The merchant already has Shopify Analytics for free. We win by answering the questions Analytics **does not put on one screen**, from `read_orders` + opaque `read_customers`, in shop-owner English.

**Token thesis (do not build an LLM):** merchants paste CSVs into ChatGPT because Shopify’s reports are scattered and averages lie. Every question we can compute from OrderFact that they currently burn tokens on is a tile or sentence on the desk. If they still need a CSV for a question we can compute, **that tile failed**.

---

## 2. Live facts (do not invent)

| | |
|---|---|
| App | Mcfly Analytics · 7-day then **$39**/store/mo |
| Listing | https://apps.shopify.com/mcfly-analytics-public · handle `mcfly-analytics-public` · **reviews: 0** |
| Fly | https://mcfly-analytics.fly.dev · **234** at time of writing · nav Overview · Orders · Buyers · Timing · Goals · Marketing |
| Site | https://mcflyads.com · Pages **v15** |
| Scopes | `read_orders` + `read_customers` (opaque `id` + `numberOfOrders` only) |
| Sales window | ~**60 days**. Older is outside the window, not $0. |
| SAMPLE Harbor (site) | `$23,414 / $82,068 / 3.51×` — not Northline `$98,500 / 4.19×` on `/` |

Cursor does **not** Partner Submit. Do not invent reviews or install counts. Demo store (kill Sample \| Live overlay) is **parked** until Marty says otherwise.

---

## 3. Product lock (religion — refuse always)

**Keep**

- Total ROAS = Shopify Total Sales ÷ **entered** spend. Empty spend is not 0×.
- Overview / Orders / Buyers / Timing / Goals / LTV **paint with $0 spend**.
- Marketing = spend upload by day + mix + Total ROAS. Optional. Guided.
- PCD Level 1. GraphQL must not select email, name, address, phone, SKU, title.
- Voice: shop-owner English. One short line under each number.
- Craft: Polaris chrome + paper/sky. One hero. Quiet tiles. Fraunces only on the sales hero island.
- **Fly deploy after a passing ship-gate** when desk work lands. Marty said stop skipping this. Command: `fly deploy -a mcfly-analytics --yes` from this repo root. Then stamp `docs/LIVING_BOARD.md`.

**Never implement**

- Pixels, Web Pixels, MTA, path / view-through / “true ROAS”
- Triple Whale / Northbeam / Polar clones (Compass, Moby, connector zoo, Meta/Google OAuth)
- `read_all_orders`, `read_reports`, ShopifyQL as the product, sessions/conversion heroes
- In-app AI analyst / chat that “explains” the store
- Email/CRM lists, overdue-for-second-order email bait
- COGS / P&L / inventory forecast / GraphQL BI builder
- Greenfield rewrite
- Grok org-chart fleets, parallel `dist/`, `wrangler --branch`
- App URL = mcflyads.com · public “type your .myshopify.com”
- Custom Data Solutions as the home sell

**Voice bans in chrome:** aMER, MER, till, cohort, ARPU, p25/p75, Monday/cash-desk slang, “one-and-done” without a gloss, attribution sermon.

---

## 4. Skeleton (locked — polish, do not reshape)

Nav:

**Overview · Orders · Buyers · Timing · Goals · Marketing · Settings**

| Tab | Job | Spend? |
|---|---|---|
| **Overview** | Total Sales hero + 4 cards + one sentence + doors into sections + sales explorer | No |
| **Orders** | Typical (median) vs mean, discounts, returns, items, shipping+tax, original/after-returns/product | No |
| **Buyers** | New vs returning **dollars**, guests, days to second, repeat $, one-order buyers, LTV 30/90/365 | No |
| **Timing** | Weekends, busiest weekday/hour, Online·POS·Shop, biggest three days | No |
| **Goals** | Calendar vs typed sales target. Spend tiles only if spend exists | Optional |
| **Marketing** | Guided daily spend. Mix. Total ROAS. Coverage honesty. Allocation/Advanced as *links*, not nav | **Yes** |

`/app/ltv`, `/app/allocation`, `/app/advanced` stay as routes. Do not put them back in primary nav.

Sample \| Live toggle stays until Marty unparks the demo store. Never tell a live shop the desk is broken until they upload spend.

---

## 5. What Shopify already shows (do not clone as the hero)

Shopify Analytics / reports already give: Total / net / gross sales, order count, **mean** AOV, returning-customer **rate** (lifetime headcount), sessions, conversion, products, sales-over-time, discount and refund reports, CSV export, Sidekick.

Mcfly’s job is the **opinionated compression** of questions that take a CSV + ChatGPT because those reports are scattered, use the wrong average, or mix headcount with dollars.

---

## 6. AI-question catalog (cover every common ask we can)

Use this as the product backlog. Each row must end as: a number on the right tab + one English line + coverage honesty (60-day / too few orders). **Do not add a tile that Shopify already answers clearly on Overview unless we show a *deeper* version (median vs mean, dollars vs headcount).**

Legend: **Live** = on Fly 234 · **Gap** = compute from OrderFact, not shipped · **Refuse** = out of scope.

### Orders / money (tab: Orders + Overview)

| Merchant / ChatGPT question | Shopify native | Mcfly |
|---|---|---|
| What were Total Sales this window? | Yes (mean-heavy Overview) | **Live** — hero, calendar dates, returns included |
| What’s a *typical* order? Average is lying. | Mean AOV only | **Live** — median + “most orders” middle half |
| How much did returns/edits take back? | Separate refund reports | **Live** — Gross − Total $ and % |
| How discount-dependent are we? | Discount reports, not Overview | **Live** — % of orders + typical $ off |
| What’s sitting on top of product (ship/tax/fees)? | Separate reports | **Live** — $ and % of Total Sales |
| How many items per order (not SKUs)? | Product reports, not this number | **Live** — mean units |
| Typical *day* of sales (median daily Total)? | Not as one number | **Gap** |
| What % of orders are 2+ units? | Not Overview | **Gap** (we have mean units, not 2+ share) |
| Full-price AOV vs discounted AOV? | Not one card | **Gap** — later, drill-in |

### Buyers / repeat (tab: Buyers)

| Merchant / ChatGPT question | Shopify native | Mcfly |
|---|---|---|
| New vs returning *headcount*? | Returning-customer rate | Don’t clone as hero |
| What % of *sales dollars* came from returning buyers? | Not Overview | **Live** |
| Sales per new buyer vs returning buyer? | Not Overview | **Live** |
| Guest checkout share? | Buried | **Live** |
| How long until a second order? | Not a median on Overview | **Live** — median days |
| What % of first-timers order again within 30 days? | Not Overview | **Gap** — next retention tile |
| Is the second order bigger than the first? | Not Overview | **Gap** |
| 2nd-order buyers vs 3rd+ mix? | Not Overview | **Partial** — have 2+ vs one-order; no 3+ split |
| Top 10% of *customers* as share of sales? | Not Overview | **Gap** (we have top 10% of *orders*) |
| What do new buyers spend in 30 / 90 / 365 days? | Not this sales basis | **Live** on Buyers / `/app/ltv` — orders only, not CRM LTV |
| Cash CAC / payback? | No spend in Analytics | Marketing / LTV **only when spend exists** |

### Timing (tab: Timing)

| Merchant / ChatGPT question | Shopify native | Mcfly |
|---|---|---|
| Weekend vs weekday sales? | Possible in reports, not Overview | **Live** — Sat+Sun share (gated) |
| Busiest weekday? | Reports | **Live** |
| Busiest *shop-local* hour? | Not Overview | **Live** |
| Are three days carrying the month? | Not one card | **Live** — biggest three days |
| Online vs POS vs Shop? | Channel reports | **Live** — order source, not ads |
| AOV by source? | Possible in reports | **Gap** — drill-in only, not hero |

### Goals

| Merchant / ChatGPT question | Shopify native | Mcfly |
|---|---|---|
| Are we on pace for the sales number I typed? | Limited | **Live** — MTD/QTD/YTD vs days elapsed |

### Marketing (tab: Marketing only — requires spend)

| Merchant / ChatGPT question | Shopify native | Mcfly |
|---|---|---|
| What did I spend vs what Shopify sold? | No spend | **Live** — Total ROAS = sales ÷ typed spend |
| Mix by channel this period? | Ads Manager, not Shopify | **Live** after upload |
| Which days of spend are missing? | n/a | **Live** — coverage / honesty, not 0× |
| Recurring daily amount without OAuth? | n/a | **Live** — template, not connectors |

**Refuse as “AI questions”:** which ad caused the order, view-through, true ROAS, email who’s overdue, inventory to reorder, Sidekick clone, sessions, conversion rate (needs `read_reports` / pixels).

When a Gap row ships: add a test, one line of English, a coverage gate (too few orders → `—`, never a fake 0), put it on the **right tab**, not Overview’s first viewport.

---

## 7. Craft bar (favorite app, not a tile zoo)

- Stranger, Sample **off**, $0 spend, ~60 days of orders: Overview in five seconds is Total Sales + 4 cards + one sentence. Doors to Orders / Buyers / Timing. No 0×. No “See spend mix” as primary.
- Each number: title, value, one line. Ban glossary words.
- Empty / sparse: `—` + why (still loading, too few repeats, outside 60-day window). Never fake zero.
- Polaris web components for chrome, forms, empty states. Scoreboard island only on the sales hero.
- Marketing empty state is an **invitation**, not a broken desk.
- Steal craft from TW/Polar: hierarchy, ritual, density, restraint. **Never** steal pixels, MTA, 50 dashboards, alerts.

Skills: `.cursor/skills/mcfly-premium-native-ux/SKILL.md`, `.cursor/skills/mcfly-shopify-compliance/SKILL.md`. Shopify MCP `user-shopify-dev-mcp` before inventing Admin GraphQL.

---

## 8. Marketing tab (next-gen spend breakdown — that’s the whole job)

Marketing is **not** the product. It is the optional second chapter.

**Guided upload (already the doors — polish until a stranger cannot get lost):**

1. **Add a day** — one channel, one date, one amount  
2. **Daily amount until I change it** — recurring, no ad login  
3. **Import or backfill** — template, Ads Manager CSV, or one bill spread across days  

Then: daily coverage strip, channel mix, Total ROAS vs break-even (margin from Settings). Allocation + Advanced are footer links.

**Do not** add OAuth, pixels, recommended bids, or a third spend product. Trust (“what counted”) beats new channels.

---

## 9. Fleet (Cursor Conductor — not a Grok org chart)

**Topology:** this chat = Conductor. **At most 4** Task agents at once. Exclusive files. Workers **never** `fly deploy`. Conductor deploys Fly after ship-gate.

| Lane | Owns | Must not |
|---|---|---|
| **Desk craft** | `app/app/components/**`, `app/app/styles/mcfly-desk.css`, Overview/Orders/Buyers/Timing chrome | `site/**`, spend write paths |
| **Question coverage** | `app/app/lib/shopify-depth-stats.ts`, `shopify-native-stats.ts`, tests, new tiles on the right tab | CSS rewrite, Marketing IA |
| **Marketing spend** | `app/app/routes/app.spend.tsx`, `app.spend.import.tsx`, spend doors/copy | Overview hero, new scopes |
| **Critic / QA** | Read-only review vs this file + BFS smell-test + `bash scripts/agent-ship-gate.sh` | Product code except test-only |

Specialist `model` (this account): prefer `cursor-grok-4.6-xhigh` for desk craft; `composer-2.5-fast` for copy/hygiene. If Claude hits quota, **do not retry Claude**. Do not use retired Grok 4.5 slugs.

**Do not** spawn Site-first swarms. Site H1 is already sales-first (v15). Listing paste exists; Marty Submits.

Each tick:

1. Orient (board + this catalog)  
2. One lane of product work (Gap row or craft)  
3. Parallel critic  
4. `bash scripts/agent-ship-gate.sh`  
5. **`fly deploy -a mcfly-analytics --yes`** unless Marty said wait  
6. Probe `/health` + `/app` 200; stamp Living Board with version + image  
7. Short report: what a merchant can see now that they couldn’t

≤3 fix attempts then escalate with logs. Never broaden scope to “fix” a failure.

---

## 10. First ticks (run these — don’t wait)

**Tick A — Audit vs Fly 234 (no new tiles yet)**  
Hard-refresh mental model: Overview first viewport, then Orders / Buyers / Timing. Kill leftover marketing chrome (spend-first CTAs, “cohort”, aMER in sales tabs, “See spend mix”). Make Overview doors feel like Shopify Analytics children, not a SaaS cockpit. Deploy if you changed chrome.

**Tick B — Retention questions Shopify skips**  
Ship, in this order, only if OrderFact can support them with a coverage gate:

1. % of eligible first-timers with a second order within 30 days  
2. 2nd vs 3rd+ buyer mix  
3. Median daily Total Sales (typical *day*)  
4. Second-order $ vs first-order $  

Put them on **Buyers** (1, 2, 4) or **Orders** (3). Not on Overview above the fold.

**Tick C — Marketing stranger path**  
Sample off, $0 spend: Marketing is three doors + one honesty sentence. After one typed day: mix + Total ROAS + coverage. No primary CTA on Overview that implies the app is broken.

**Tick D — Ritual**  
Share Overview / recap is **sales-first** when spend is empty (5 facts + 1 decision, ~90s). Do not lead with Total ROAS at $0 spend.

Stop and ask Marty only for: Partner Submit, ads budget, MX, accepting a religion challenge, unparking the demo store, widening scopes.

---

## 11. Definition of done (favorite app)

A stranger install, **Live data**, $0 spend, ~60 days of orders:

1. They never export a CSV to answer typical order, returning sales $, weekends, days to second, LTV 30/90/365.  
2. They can explain each number in one breath.  
3. Marketing is clearly optional and easy when they want sales ÷ spend.  
4. Compliance spotcheck still green.  
5. Live Fly matches the repo. Reviews still **0** until a real merchant writes one.

---

## 12. Start now

Do not reply with a plan-only essay. Tick A in this session. Then report:

- Fly version  
- What you changed  
- Which catalog rows moved from Gap → Live  
- What Marty should click in Admin (hard-refresh, Live data, which tab)
