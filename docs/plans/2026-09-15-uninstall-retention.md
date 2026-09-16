# Uninstall-retention wave — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut first-session uninstalls by making every Shopify tab impressive at $0 spend, then making Spend Upload the easiest door to the rest — without adding pixels, OAuth, or a 12th tab.

**Architecture:** Wave 1 (in flight) does not stop. Research writes complaint maps only. After Desk returns, a tab-audit lane scores all 11 analysis pages plus Settings against uninstall risks. Conductor then ships only P0 honesty/depth fixes exclusive to `app/app/**`.

**Tech Stack:** Shopify embedded Remix desk in `marketing-mix-model/` on `cursor/spend-trust-recurring`. Fly `https://mcfly-analytics.fly.dev`. Listing `https://apps.shopify.com/mcfly-analytics-public`.

## Global Constraints

- Public mark Mcfly Analytics · firm Mcfly Ads · listing https://apps.shopify.com/mcfly-analytics-public · 7-day then $39/store/month · reviews **0** (do not invent).
- Total ROAS = Shopify Total Sales ÷ entered spend. Empty spend is — not 0×. No pixels / MTA / OAuth zoo / Klaviyo.
- Shopify five (Overview, Customers, Growth, Orders, LTV) must be useful with **$0 spend**. Spend six never block those five.
- Top bar stays 11 analysis tabs + Settings. Time grain on the card/chart, not in s-app-nav.
- `read_orders` ~60-day honesty. Do not add `read_all_orders` silently.
- Ads NO until smoke PASS + 3 honest reviews + FUNNEL week + P0 on Fly.
- Workers do not `fly deploy`. Do not git add -A. Cursor does not Partner Submit.
- Do not interrupt in-flight Desk / Site / Listing file locks.

---

## Task 1: Competitor + Shopify Analytics complaint research (now)

**Files:** `docs/ops/research/2026-09-15-competitor-uninstall-signals.md`, `docs/ops/research/2026-09-15-shopify-analytics-gaps.md`, `docs/ops/research/2026-09-15-tab-vs-complaints.md`

- [x] Lane spawned 2026-09-15 — `docs/ops/research/2026-09-15-*.md` exclusive; do not double-spawn.
- [x] Cite public 1-star / Reddit / Shopify Help complaints (URL + quote/paraphrase). No invented Mcfly reviews.
- [x] Map each complaint to one of our 11 tabs, or **Refuse**.
- [x] Separate “already ships on Fly 318” vs “gap” vs “out of religion.”

**Landed:** spend wall / numbers ≠ Shopify / median / returning dollars / second-order CSV / LTV honesty / buried weekend / Sidekick lies / empty 0× / GMV-OAuth. Retention moat = Shopify five. Refuse pixels, OAuth, Klaviyo, P&L, `read_all_orders`, AI analyst.

## Task 2: Per-tab uninstall audit (read-only; Desk backfill may still run)

**Files:** read-only `app/app/routes/app.*.tsx` + components; write `docs/ops/research/2026-09-15-tab-uninstall-audit.md`

- [x] Spawned after research return — must not edit Desk exclusive files (`order-facts*`, job-queue, CashTrustBanners).
- [x] Score every tab 1–5: first 10 seconds, $0-spend usefulness, accuracy (never $0/0×), depth vs native Analytics, next action. Flag spend walls on Shopify five.

**Landed:** Overview is the uninstall greeting (blank ROAS + Ad spend at $0). Customers / Growth / Orders retain if reached. Spend Upload easiness waits. Audit: `docs/ops/research/2026-09-15-tab-uninstall-audit.md`.

## Task 3: P0 desk fixes only (after audit)

Exclusive `app/app/**` files named in the audit. Tests + Conductor Fly. No new tabs. No connectors.

- [x] Spawned 2026-09-15 after audit: Overview greeting lane + honesty leftover lane (exclusive files).
- [x] P0 #1–2, #6–7 Overview: no ROAS/Ad spend tiles at $0; YoY cards first; returning $ not headcount; no PeriodControl on Overview.
- [x] P0 #3/#5: book-page truncated/today/60-day honesty (verify Fly 319 wire) + LTV First year not complete inside 60 days.
- [x] Conductor Fly after both return.

## Task 4: Spend Upload easiness (only if audit says the door is the uninstall)

**Blocked by audit:** Overview spend wall is first. Do not run this until Overview P0s land.

Keep Spend Upload input-only. Easier type / CSV / recurring. Never put explorer back on Overview.
