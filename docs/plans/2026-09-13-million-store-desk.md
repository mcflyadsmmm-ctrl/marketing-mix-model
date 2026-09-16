# Million-store desk — one refinement plan

> Execute this file. Do not spawn another research fleet. Formula locked. Density stays. Homework tabs go.

**Why:** Founder: clunky, useless, uninstallable. Frontier consensus (GPT Sol keep/uninstall, Grok teardown, Opus architecture) + Shopify Help + onboarding research (first 72h = first insight they could not see in Analytics).

**Activation moment (week one):** Open Overview on Live data and see a store-specific insight Shopify Analytics Overview does not put on one screen — without setup homework.

Shopify Analytics Overview already has: total sales, sessions, conversion, **mean** AOV, returning-customer **rate**. Mcfly keeps: median order, returning **dollars**, days to second, weekend mix, Total ROAS = sales ÷ entered spend (never 0×).

## Decision (one IA)

Overview is **one vertical stack, no in-page tabs**. Compare / Ledger / Channels / Plan leave Overview. Spend tools belong on Marketing (tick 2). Sidebar stays: Overview · Orders · Buyers · Timing · Goals · Marketing · Settings.

| Band | Home |
| --- | --- |
| 1 Money | Shopify Total Sales. Pair with Total ROAS only when spend > 0. |
| 2 Windows | One table: Yesterday · Last 7 · This month · This quarter · This year. Spend / ROAS columns only when that row has spend. |
| 3 Signals | Typical order, returning $, second order, weekend — not a second Shopify Overview. |
| 4 Trend | Open chart. Trust banners after numbers. |

Old hashes `#mcfly-compare` `#mcfly-ledger` `#mcfly-mix` `#mcfly-plan` land on Overview home (2.1.1: no iframe throw).

## Ticks

### Tick 1 (this commit) — The pair always paints

Files: `OverviewFirstViewport.tsx`, `DeskWindowRail.tsx` (new), `app._index.tsx`, `desk-nav.ts`, `DeskOverviewTabs.tsx`, `mcfly-desk.css` (append), tests.

- Delete `hideHero`. CashControlBoard is **not mounted** on Overview.
- Empty `DESK_OVERVIEW_TABS`. Chrome keeps as-of + share only.
- Window rail from `buildCashControlBoard().chips`. Never print `0.00×`.

**Done:** Sample on = Sales \| Total ROAS + rail + cards + chart, heading Overview. Live $0 = sales hero, no ratio, no Compare tease. Ship-gate green.

### Tick 2 — Marketing is the spend room

Port mix / plan / ledger out of `CashControlBoard` onto `app.spend.tsx` **after one typed day**. Empty Marketing stays three doors + honesty (no 0×).

Overnight paste: [`2026-09-14-overnight-PROMPT.md`](./2026-09-14-overnight-PROMPT.md). Exclusive files listed there. Compare is a **vs last month** column on mix, not an Overview tab.

**Done:** one typed day makes Marketing show mix + vs-last-month, daily-cap plan, collapsed Every day table. Empty state unchanged.

### Tick 3 — Demolish leftover Overview lab

`rg 'CashControlBoard' app/app/routes` empty. Rewrite `mer-control.test.ts` chrome asserts onto the Marketing room. Merchant chrome: no `aMER` (label → “New sales ÷ spend”). Update `docs/PARTNER_TESTING_INSTRUCTIONS.md`. Conductor `fly deploy`; workers do not.

**Done:** leftover Overview lab gone; Partner paste matches; ship-gate green.

## Refuse

Pixels / MTA / true ROAS / TW clones / connector zoo / AI analyst / more nav / copying sessions & conversion.

## Ads

Off until Fly matches this desk, listing shots match, 3 honest reviews, one organic funnel week.
