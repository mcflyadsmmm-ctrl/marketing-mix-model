# Save the desk — one Shopify app building plan

> **For agentic workers:** Execute this file only. Do **not** spawn a four-lane omit fleet. Do **not** treat punch lists, “no tiles,” or “one hero” as law. REQUIRED: stay in **this** chat; ship-gate; Conductor `fly deploy`.

**Goal:** Make Mcfly Analytics a desk a brand would screenshot and pay $39 for — order intelligence they currently dump into ChatGPT, plus optional sales ÷ entered spend.

**Architecture:** Keep the live React Router + Prisma + Fly app. Restore **density** (KPI cards, Sales beside Total ROAS when spend exists, chart visible). Do not greenfield. Do not add pixels.

**Tech stack:** React Router 7, Polaris web components for chrome/forms, `mcfly-desk.css` for the scoreboard island, Prisma/Postgres, Admin GraphQL 2026-07, Fly `https://mcfly-analytics.fly.dev`.

## Global constraints

- Public mark **Mcfly Analytics**. Firm **Mcfly Ads**. Price: 7-day then **$39**/store/mo.
- Listing URL: `https://apps.shopify.com/mcfly-analytics-public` only. Cursor does not Partner Submit. Do not invent reviews or install counts.
- Scopes stay `read_orders,read_customers`. PCD Level 1: opaque customer id + `numberOfOrders` only.
- **Formula lock:** Total ROAS = Shopify Total Sales ÷ **entered** spend. Empty spend is not 0×. No pixels, MTA, true ROAS, Meta/Google OAuth, in-app AI.
- **Craft unlock (founder 2026-09-10):** density is the product. KPI cards are allowed. Chart is open. Spend sits next to sales **when spend exists**. “Omit until Polar-quiet” is **retired**.
- Voice in chrome: shop-owner English. Ban aMER / till / cohort / ARPU as **labels**. Do not ban numbers, cards, or charts.
- One cook: this Cursor Agent chat. Max one helper Task if a file is huge. Workers never `fly deploy`.
- Research is **absorb-only**. Do not write another 22-row idea table.

### Absorb (do not re-research)

- `docs/ops/research/2026-09-10-independent-insights.md` — thesis: replace export→ChatGPT; works at $0 spend; Marketing optional.
- Catalog already in `shopify-depth-stats.ts` (typical day, 2+ items, promo vs full-price, top 10% customers, source AOV). Surface them as **visible cards**, not collapsed FAQ rows.
- Live public demo on mcflyads.com still shows the **old dense scoreboard**. Steal that **craft** (cards, pair KPIs, coverage chips). Do not steal Mix/Close/Monday theater as primary nav.

### Retired as law (keep files, ignore as craft)

`docs/ops/research/2026-09-10-world-class-punch.md` omit/no-tile ticks. `docs/plans/2026-09-10-favorite-analytics-conductor.md` “no tile zoo / explorer closed.” Those starved the download.

---

## What the merchant gets (one screen each)

Nav stays: **Overview · Orders · Buyers · Timing · Goals · Marketing · Settings**.

| Tab | Job a $39 brand can say in one breath |
| --- | --- |
| **Overview** | This window’s Shopify Total Sales. If they typed spend: Total ROAS beside it. Four+ KPI cards. Chart visible. One notice sentence. |
| **Orders** | Typical (median) vs mean, discounts, 2+ items, returns, shipping+tax — as cards you can read without opening `<details>`. |
| **Buyers** | Returning **dollars**, days to second, top 10% of customers, LTV 30/90/365. |
| **Timing** | Weekends, busiest hour, Online/POS/Shop typical. |
| **Goals** | Pace vs a sales number they typed. Spend tiles only if spend exists. |
| **Marketing** | Three ways to add a day of spend. Then mix + Total ROAS + coverage. Not a broken 0×. |
| **Settings** | Polaris: margin, Sample \| Live, billing. |

**Screenshot test:** Sample **on**, ~60 days of SAMPLE orders, with SAMPLE spend: Overview looks like the public demo’s KPI row (big numbers, cards, chart) — not a pamphlet with one serif number and a collapsed accordion.

---

## Files this plan owns

| Slice | Files |
| --- | --- |
| 1 Overview density | `app/app/components/OverviewFirstViewport.tsx`, `app/app/routes/app._index.tsx`, `app/app/styles/mcfly-desk.css`, `app/app/lib/overview-first-viewport.test.ts`, `app/app/lib/desk-sample-ux.test.ts` |
| 2 Book cards | `app/app/components/ShopifyBookSection.tsx`, `mcfly-desk.css` (KPI grid on Orders/Buyers/Timing) |
| 3 Marketing payoff | `app/app/routes/app.spend.tsx` — after one day, Total ROAS + mix **on this page**, chart/coverage visible |
| 4 Demo match | `site/demo.html` + `site/assets/demo-desk.js` so `/demo` shows the **same** Overview (sales + optional ROAS), not Mix/Close/Monday as home |
| 5 Ship | `bash scripts/agent-ship-gate.sh` then `fly deploy -a mcfly-analytics --yes`; stamp `docs/LIVING_BOARD.md` |

Do not edit `site/**` for slice 1–3. Slice 4 is site only. Pages Direct Upload still needs Marty.

---

### Task 1: Overview is a scoreboard again

**Files:**
- Modify: `app/app/components/OverviewFirstViewport.tsx`
- Modify: `app/app/routes/app._index.tsx`
- Modify: `app/app/styles/mcfly-desk.css` (append craft-unlock block)
- Modify: `app/app/lib/overview-first-viewport.test.ts`
- Modify: `app/app/lib/desk-sample-ux.test.ts`

**Produces:** Sales hero always. Total ROAS sibling when `totalSpend > 0` (never `0.00×`). KPI cards. Explorer **visible** (not a closed `<details>`).

- [ ] **Step 1:** CSS at end of `mcfly-desk.css` — `.mcfly-book__pair`, `.mcfly-book__kpi`, `.mcfly-book__rows--kpis` (2-column cards, 1 column on phone).
- [ ] **Step 2:** Tests lock the unlock: viewport contains `mcfly-book__kpi` and `formatMer`; explorer is **not** wrapped in collapsed details; still **no** `0.00×`.
- [ ] **Step 3:** `cd app && npx vitest run app/lib/overview-first-viewport.test.ts app/lib/desk-sample-ux.test.ts`
- [ ] **Step 4:** Visual: SAMPLE on — Overview has two big numbers when spend exists, cards with borders, chart on screen without a click.

### Task 2: Orders / Buyers / Timing are cards, not a FAQ

**Files:** `ShopifyBookSection.tsx` + CSS `.mcfly-book__rows--kpis`

- [ ] Keep `<details>` for definitions. Style summary as a KPI card (big value, label, border).
- [ ] Do not hide catalog rows behind a wall of identical accordion chrome.

### Task 3: Marketing payoff looks finished after one typed day

**Files:** `app.spend.tsx`

- [ ] Empty: three doors + one honesty line (keep).
- [ ] After spend: Total ROAS hero + channel mix **visible**, coverage strip, not a footer to Allocation.

### Task 4: Public demo matches the app

**Files:** `site/demo.html`, `site/assets/demo-desk.js` (and CSS as needed)

- [ ] Home of the widget = Overview (sales + ROAS on SAMPLE). Kill Mix / Close / Monday as primary tabs.
- [ ] Do not Pages-deploy until Marty approves. Copy can land in git.

### Task 5: Ship-gate + Fly

```bash
bash scripts/agent-ship-gate.sh
fly deploy -a mcfly-analytics --yes
```

Stamp Living Board with version + image. Probe `/health` 200 and `/app` 200.

---

## Definition of done

A stranger, **Sample on**, then **Live data**:

1. They can explain Overview in one screenshot (sales, optional ROAS, cards, chart).
2. They can answer typical order, returning dollars, weekends **without** exporting CSV.
3. Empty spend is not 0×. Adding one day of spend shows Total ROAS on Marketing **and** Overview.
4. They would not say “I don’t understand why anyone would download this.”

## Human leftover (never this plan)

Partner Submit · listing stills · ads budget · MX for `support@` · widening scopes.
