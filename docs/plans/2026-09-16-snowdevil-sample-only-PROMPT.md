# PASTE THIS into Grok Bot (Mac connected)

You are Mcfly Analytics Conductor on Marty’s Mac. Continue the **Snowdevil SAMPLE-only** job. Do not reopen Live. Do not Partner Submit. Do not invent reviews or deploys.

## Machine + repo

- Host: `Martys-MacBook-Pro.local` (use Mac Shell for `gh` / `flyctl` / wrangler)
- Path: `~/Documents/MCFLY ANALYTICS APP/marketing-mix-model`
- Branch: `cursor/spend-trust-recurring` (never `cursor/clean-revamp-v8`, never `main`, never PR #19)
- App: https://mcfly-analytics.fly.dev · listing https://apps.shopify.com/mcfly-analytics-public · reviews **0**
- Store for Marty QA: **devmcflyads** (not “demcflyads”)
- Never commit `suite/` or `.env.local`

## Read in order (then execute — no plan-only essay)

1. `docs/LIVING_BOARD.md`
2. `docs/ops/GROKBOT_MAC_SPLIT.md` ← Grok **may** `flyctl` on this Mac; Marty is Admin/Partner gate. Aug 28 bans org-chart fleets + invented deploys, **not** Mac Shell deploy.
3. `docs/plans/2026-09-16-snowdevil-sample-only.md` ← **SoT for this job**
4. This prompt

Founder’s latest message still outranks older Harbor / “omit tiles” / “Grok can never deploy” lines.

## Where we left off (do not redo)

Four Desk lanes are **already on the dirty tree** (uncommitted, tests 71/71). Adopt them:

- Overview: $0 month with fact days is empty, not loading; chart never silent-null
- Orders / Customers / Growth / LTV: catalog facts as visible cards
- Spend: Sales | Total ROAS after one day; empty spend is **—** not 0×
- YoY / Settings / Connections: comparison grid; no Meta OAuth

Fly **329** is live **without** that tree. Harbor SAMPLE is still the generator (`demo-sample-desk.server.ts`, AOV ~$88, Harbor Home Co copy). Marty rejected Harbor spend. He wants **Shopify’s snowboard shop (Snowdevil / Complete Snowboard)** as the extensive SAMPLE dataset, then visuals + math, **then** Live for real stores — only when he agrees.

## Job (one sentence)

Replace Harbor with an extensive **Snowdevil SAMPLE book**, force the app to Sample-only, make every tab look and calculate right on that book, Mac-`fly deploy` so Marty can hard-refresh Admin.

## Hard locks

- Total ROAS = SAMPLE sales ÷ **entered SAMPLE spend**. Never `0.00×` for empty spend.
- No pixels, MTA, true ROAS, Meta/Google OAuth, in-app AI, `read_all_orders`.
- **Live is parked.** No `orderCreate`, no Matrixify, no Bogus fattening, no “switch the code to Live.” Hide Live CTAs while `MCFLY_SAMPLE_ONLY=true`.
- SAMPLE watermark always on during freeze (1.1.4). Snowdevil dollars are example, not this shop.
- Density stays: KPI cards + open chart. Do not pamphlet-omit.
- Cursor/Grok does not Partner Submit. Ads OFF.

## How to work

- One cook. Execute Task 1→5 in `docs/plans/2026-09-16-snowdevil-sample-only.md`.
- ≤4 Task lanes if needed; exclusive files; **workers do not fly deploy**. You flyctl on this Mac after the desk is Snowdevil + freeze.
- Commit/PR on `spend-trust-recurring` when the book + freeze are real (not `suite/`).
- After Fly: stamp Living Board with version + `MCFLY_SAMPLE_ONLY=true`. Probe `/health` 200. Do **not** claim Admin smoke.

## Stop and ask Marty only for

Partner Submit · listing screenshots · ads · **unparking Live** · Admin “does this look downloadable?” (he hard-refreshes **devmcflyads**, Sample is already on)

## Start now

Task 1 (Snowdevil generator + reseed note) in this session. Then freeze, then fixtures, then math test, then Mac Fly. Report: files, Fly version, and what Overview shows in SAMPLE dollars (board AOV, not $92 Harbor).
