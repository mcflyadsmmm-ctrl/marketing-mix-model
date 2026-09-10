# Mcfly Analytics rebuild (deeper than Shopify Analytics)

**Date:** 2026-09-10 · America/Denver  
**Status:** P7 unfrozen 2026-09-10. Desk + site H1 ship together. Marty still Submits the listing paste.  
**App URL:** https://mcfly-analytics.fly.dev  
**Listing:** https://apps.shopify.com/mcfly-analytics-public (reviews: 0 — do not invent)

Founder lock: **evolve this Fly app**, **app-first**. Marketing metrics stay; they live on spend surfaces. Overview / Goals / LTV work at $0 spend.

## Goal

Replace the weekly “export orders → paste into ChatGPT” loop with a calm Overview that already answers those questions in plain English. Same `read_orders` + opaque `read_customers`. Spend / Total ROAS remains honest and optional.

## Architecture

Same React Router embedded app, Prisma, Fly URL, billing, and OAuth. Rebuild **information architecture + OrderFact contract**, not a greenfield. Keep spend write paths. Split the Overview kitchen sink. Enrich OrderFact with Level-1 money/ops fields (discounts, source, units) — never email/address/line-item SKUs.

**Stack:** React Router 7 + Polaris web components, Prisma/Postgres, Shopify Admin GraphQL 2026-07 (TOML webhooks still `2025-10`), Fly `https://mcfly-analytics.fly.dev`.

## Product lock (outranks chat)

- Public mark: Mcfly Analytics. Price: 7-day then $39. Listing URL unchanged.
- Scopes stay `read_orders,read_customers` in `app/shopify.app.toml`. No `read_reports`, `read_all_orders`, Meta/Google OAuth, pixels, MTA, “true ROAS.”
- PCD Level 1: opaque customer `id` + `numberOfOrders` only. GraphQL must not select email/name/address.
- Total ROAS formula when spend exists: Shopify Total Sales ÷ entered spend. Empty spend is not 0×.
- Live sales window remains ~60 days. Older years are outside the window, not $0. Do not imply full-lifetime CRM LTV.
- Harbor SAMPLE on home stays `$23,414 / $82,068 / 3.51×` for marketing/site until the listing phase. Do not put Northline `$98,500 / 4.19×` on `/`.
- Do not Fly-deploy from a dirty tree unless Marty asks. Do not invent reviews or install counts. Cursor does not Partner Submit.
- **Voice:** merchant English, not analyst jargon. One short line under each number. Ban in chrome: aMER, MER, till, cohort, ARPU, p25/p75, “one-and-done” without a gloss, Monday/cash-desk slang, attribution sermon.
- **Craft:** paper/sky, Polaris chrome, one hero number, quiet tiles. Scoreboard craft (Fraunces) only on the sales hero island.
- **Token job:** the desk is the deep dive. If they still need a CSV for a question we can compute, we failed that tile.

## Target desk IA

Nav: Overview · Orders · Buyers · Timing · Goals · Marketing (`/app/spend`) · Settings.

Spend Allocation and Advanced stay as routes, linked from Marketing. LTV 30/90/365 lives on Buyers (and `/app/ltv`).

Overview body, top to bottom:

1. Period rail + Shopify Total Sales hero (no empty spend column)
2. Deeper-than-Analytics book in shop-owner words
3. Customer value snap in 30 / 90 / 365 days (orders only; spend-per-new-customer blank until spend)
4. Goals vs calendar
5. Sales explorer always (sales line on when spend is $0)
6. Marketing section: optional Upload Spend / Total ROAS / mix
7. 60-day window honesty — even with $0 spend

## Phases

| Phase | Job |
| --- | --- |
| P0 | Religion docs (this file + Living Board / MASTER / founder history). Site H1 frozen. |
| P1 | Extract Overview sections; plain-English labels; tests green; no Fly |
| P2 | `shopify-depth-stats` + `shopify-native-stats` as product API; shop-local hour-of-day |
| P3 | OrderFact v2: `discountAmount`, `sourceName`, `unitCount`; recrawl; PCD still bans email/address |
| P4 | SAMPLE sales-first OrderFacts so Overview Sample is a shop book |
| P5 | 60-day honesty on Live with $0 spend; `NUMBER_HONESTY.empty` only on Marketing/Spend |
| P6 | Ship-gate + compliance spotcheck. Fly only if Marty asks from a clean branch |
| P7 | Draft listing + site copy. Marty Submits. Do not paste until Fly Overview matches |

## Definition of done (desk)

A stranger install, Sample off, $0 spend, ~60 days of orders:

- Overview answers typical order, new vs returning dollars, weekends, days to second, sales over time without export
- Labels readable without a glossary; one line under each number
- First viewport is calm: Total Sales + four cards + one sentence; spend is an invitation, not a broken 0×
- No primary CTA that says the app is broken until they Upload Spend
- Adding spend still yields Total ROAS on Marketing
- Compliance spotcheck still green

## Independent research (2026-09-10)

Absorb: [`../ops/research/2026-09-10-independent-insights.md`](../ops/research/2026-09-10-independent-insights.md). Price is one row. The thesis is: **works at $0 spend**, compress native reports + the export loop, do not add a tile wall.

**Next desk craft (not a new phase number):** first viewport = Total Sales hero + 4 cards (orders, AOV, returning $, days to second) + one “what to notice” sentence. The rest of the book stays below. Listing/demo still spend-first until P7.

## Human leftover

Partner Submit, listing screenshots, ads budget, Fly production deploy. Ads remain off until a funnel week exists.
