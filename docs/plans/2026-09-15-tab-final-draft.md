# Tab final draft — Shopify-gap polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each of the 11 locked analysis tabs (plus Settings) clearly worth $39 versus free Shopify Analytics, without a 12th tab, new scopes, or pixels.

**Architecture:** One Conductor. **Max four** tab agents at a time with exclusive files. Each agent inventories its tab against TAB_LOCK + Shopify Analytics + uninstall friction, then ships copy, empty/pending/error honesty, and already-computed numbers that are not painted. Shared files stay with Conductor.

**Tech Stack:** Shopify embedded Remix (`s-page`), React Router 7 file routes, Vitest source tests, Prisma order/sales facts, Fly `mcfly-analytics`.

## Improved founder prompt (use this, not the raw chat)

You are finishing Mcfly Analytics as a **final-draft Shopify Admin app** on Fly 311 (`cursor/spend-trust-recurring` in `marketing-mix-model/`).

**One subagent per tab.** Waves of four. Exclusive files. No overlapping ShopifyBookSection / desk-nav / CSS / product-labels edits (Conductor owns those).

For YOUR tab only:

1. **Inventory** what the route paints today (hero, rows, charts, empty, pending, error).
2. **Shopify Analytics gap** — one merchant sentence: what Analytics Overview/Customers/Reports already show vs what this tab uniquely computes from `read_orders` + `read_customers` (~60-day pull). Never invent sessions, conversion, SKU, pixels, Klaviyo, or `read_all_orders`.
3. **Uninstall friction** — loading that looks like $0, empty spend as 0× / $0 CPA, “Marketing” leftover names, dead links, duplicate numbers from another tab, non-native chrome (`mcfly-page` without `s-page`), sample vs live confusion.
4. **Ship** only: contrast lede, pending/empty/error honesty, sibling links, and TAB_LOCK rows that are already in `shopifyDepth` / loaders but not painted. No new tabs. No explorer on Overview / Spend Upload / Allocation. Time windows stay on the card/chart, not the top bar.
5. **TDD** a source test on the route (and any lib you own). `npx vitest run` for those files, then commit **only your exclusive files**.

Religion: Total ROAS = Shopify Total Sales ÷ entered spend. Empty spend is not 0×. Missing last year is not $0. Reviews stay 0 — do not invent them. Workers do not `fly deploy`.

---

## Global Constraints

- Public mark **Mcfly Analytics**. Firm **Mcfly Ads**. Line **Spend next to sales**.
- Listing: https://apps.shopify.com/mcfly-analytics-public · 7-day then **$39**/store/month · reviews **0**.
- Spec SoT: `docs/plans/2026-09-15-TAB_LOCK.md`.
- Approved pull: `read_orders` + `read_customers`. ~60 days at install. Never paint missing last year as $0.
- Ban in chrome: Monday / cash desk / beats SaaS / aMER / till / cohort / ARPU / p25–p75 as merchant labels.
- No 12th analysis tab. `/app/advanced` stays unlinked.
- Do not `git add -A`. Do not stage `site/**`.
- Voice: short, shop-owner English. “Shopify Analytics shows X. This page shows Y.”

## Uninstall-friction checklist (every tab)

- [ ] Pending sales never look like $0
- [ ] Empty spend never looks like 0× / $0 CPA / $0 CAC
- [ ] Page heading matches nav label
- [ ] `s-page` via `DeskBookPage` (or equivalent) — not a stray `mcfly-page` only
- [ ] One job; no duplicate hero from a sibling tab
- [ ] Sample vs Live is obvious (existing Sample banner is enough)
- [ ] 60-day / returns honesty where last-year or deep order stats appear
- [ ] Next step is one link (Spend Upload, Total ROAS, LTV) — not a zoo

## Exclusive file map

| Task | Tab | May edit | Must not |
| --- | --- | --- | --- |
| 1 | Overview | `app/app/routes/app._index.tsx`, `app/app/components/OverviewYoyCards.tsx`, `app/app/lib/overview-yoy.ts`, `app/app/lib/overview-yoy.test.ts` | SpendExplorer, ShopifyBookSection |
| 2 | Customers | `app/app/routes/app.customers.tsx`, `app/app/lib/customers-page.test.ts` (create) | ShopifyBookSection |
| 3 | Growth | `app/app/routes/app.growth.tsx`, `app/app/lib/growth-page.test.ts` (create) | ShopifyBookSection, app.ltv.tsx |
| 4 | Orders | `app/app/routes/app.orders.tsx`, `app/app/lib/orders-page.test.ts` (create) | ShopifyBookSection |
| 5 | LTV | `app/app/routes/app.ltv.tsx`, `app/app/lib/ltv-sales-spine.test.ts` | app.cpa.tsx |
| 6 | Spend Upload | `app/app/routes/app.spend.tsx`, `app/app/lib/easy-add-spend-tab.test.ts` | app.roas.tsx, SpendExplorer |
| 7 | Total ROAS | `app/app/routes/app.roas.tsx`, `app/app/lib/marketing-spend-room.test.ts` | app.spend.tsx, app.allocation.tsx |
| 8 | Channel Allocation | `app/app/routes/app.allocation.tsx`, `app/app/lib/allocation-honesty.test.ts` | SpendExplorer, MarketingSpendRoom |
| 9 | YoY | `app/app/routes/app.yoy.tsx`, `app/app/lib/yoy-workspace.ts`, `app/app/lib/yoy-workspace.test.ts` | mer-control.ts (report if needed) |
| 10 | CPA | `app/app/routes/app.cpa.tsx`, `app/app/lib/cpa-page.test.ts` | app.ltv.tsx |
| 11 | Goals | `app/app/routes/app.goals.tsx` + existing Goals tests | SpendExplorer |
| 12 | Settings | `app/app/routes/app.settings.tsx` | billing mutations beyond copy |

Conductor-only: `ShopifyBookSection.tsx`, `desk-nav.ts`, `product-labels.ts`, `mcfly-desk.css`, `DeskBookPage.tsx`, `mer-control.ts`, Fly.

---

### Task 1: Overview — YoY glance vs Analytics

**Files:** Overview exclusive set.

Shopify Analytics Overview is **this period’s sales** (and average order). This tab is **three year-over-year sales cards** (MTD / QTD / YTD) with last year **null, not $0**.

- [ ] Source test: Overview route contains a contrast sentence naming Shopify Analytics vs last-year cards; still no SpendExplorer / DualCloseLine / PeriodControl on live (shot-only OK).
- [ ] Implement lede on `OverviewYoyCards` (or index) using that sentence. Keep three cards only. Pending still “not $0”.
- [ ] `npx vitest run app/lib/overview-yoy.test.ts app/lib/overview-first-viewport.test.ts`
- [ ] Commit only exclusive files.

### Task 2: Customers — dollars, not Shopify’s returning rate

**Files:** `app.customers.tsx`, `app/lib/customers-page.test.ts`.

Shopify Analytics returning-customer **rate is headcount**. This tab is **returning dollars**, guests, top 10% of customers, in-window repeat sales.

- [ ] Failing test: contrast lede + links to `/app/growth` and `/app/ltv`; no CPA/CAC; pending not $0.
- [ ] Implement. Do not remount LTV snap or spend.
- [ ] Vitest that file. Commit.

### Task 3: Growth — who came back from orders

**Files:** `app.growth.tsx`, `app/lib/growth-page.test.ts`.

Shopify does not put **days-to-second** or **2nd-in-30 from order history** on Overview. This tab is first-time $ + those rows. Repeat rate is order history, not email.

- [ ] Test: contrast lede; Open LTV; no Klaviyo; pending not $0; first-order months stay.
- [ ] Implement. Do not copy Customers returning-$ hero.
- [ ] Vitest. Commit.

### Task 4: Orders — median typical + timing

**Files:** `app.orders.tsx`, `app/lib/orders-page.test.ts`.

Shopify Analytics **average** order lies. This tab is **median typical**, full vs discounted typical, biggest 10% of **orders**, then weekend / hour / Online-POS.

- [ ] Test: contrast lede naming average vs typical; groups period+timing; pending not $0; no spend/ROAS.
- [ ] Implement.
- [ ] Vitest. Commit.

### Task 5: LTV — 30/90/365 from orders

Cash CAC only if spend exists. Avg orders in first 90 days named. Contrast vs Shopify LTV reports if any. Link CPA only when spend exists.

### Task 6: Spend Upload — input only, name match

Heading **Spend Upload**. Empty days are $0 on the ledger; Total ROAS is never 0× because of an empty day. After save → Total ROAS. No explorer.

### Task 7: Total ROAS — scoreboard Shopify does not have

Sales | spend | Total ROAS. Empty = —. Explorer + dual-close + pacing + L7/L28 intel only. Formula visible once.

### Task 8: Channel Allocation — mix + cap, no fourth explorer

Lock copy says Spend Upload. Mix windows on the mix table. No explorer.

### Task 9: YoY — operating compare, not Overview’s three cards

This month / last month / last year always show **this month’s sales**. Missing last year uses OVERVIEW_YOY_MISSING. Last 7 empty is —. If 12-month board is already in loaders, paint it; otherwise do not invent a new facts pull.

### Task 10: CPA — cash, not ads-manager CPA

Window on the cards if `loadDeskSalesPage` already supports preset (this month / last 28). Empty spend: Spend Upload sentence, never $0.

### Task 11: Goals — sales plan vs actual

Year control on the page. Gauges are MTD/QTD/YTD. No explorer. Target ROAS from Settings.

### Task 12: Settings — plumbing, not an analysis tab

Sample vs Live, target Total ROAS, billing. “Add spend on Spend Upload” not Marketing. Uninstall: plan name, trial honesty, no surprise scopes.

---

## Self-review

| Spec item | Task |
| --- | --- |
| Contrast vs Shopify Analytics on Shopify five | 1–5 |
| Empty spend honesty | 6, 7, 10 |
| No 12th tab / no extra scopes | all |
| Uninstall chrome (s-page, names, pending) | all |
| Fly after all 12 land | Conductor |
