---
name: QL Research Finish
overview: "Cursor-agent-ready SoT after Opus critic. Marty clicks || Composer #220 + assert. Models locked. Fly skip default. Accuracy F FAIL → Overview fix not Customers."
todos:
  - id: marty-tonight
    content: "NO MODEL — Marty click card (re-grant, scorecard 1-7, Accuracy F, Listing Save) → Result:"
    status: completed
  - id: spawn-desk-220
    content: composer-2.5-fast Task — Spawn Prompt A (#220 Path A + loader guards + tests)
    status: completed
  - id: spawn-ops-assert
    content: composer-2.5-fast Task — Spawn Prompt B (assert-live-secrets.sh via fly ssh printenv)
    status: completed
  - id: conductor-integrate
    content: inherit — integrate checklist; commit only after execute; gh pr ready 220; local green
    status: in_progress
  - id: one-critic
    content: claude-opus-5-5-medium ×1 — Ship critic; FAIL bars in plan §6
    status: pending
  - id: restamp-sot
    content: inherit — SCOREBOARD+Living Board v467; drop stale phone-wrap next-ship
    status: pending
  - id: site-after-save
    content: composer-2.5-fast — Site Pages only after Marty Listing Save
    status: pending
  - id: fly-if-needed
    content: inherit — Fly skip default; if deploy → secrets re-assert → assert script PASS
    status: pending
  - id: stage-customers
    content: NO MODEL — Marty secrets customers→ltv only after Result PASS; never if Accuracy F FAIL
    status: pending
isProject: false
---

# Mcfly finish — Cursor Conductor SoT (Opus-hardened)

**Upgraded by:** Opus critic [`plan critic`](c7106893-66af-4bc8-bab1-82a7d6c205b2) · 2026-09-23  
**Ship tree:** `marketing-mix-model/` · `cursor/spend-trust-recurring` @ `8b60ab5` · Fly **v467** (SCOREBOARD still says ~v460 — Conductor restamps)  
**PR #220:** draft · 14 files · **0 CI checks** · MERGEABLE ≠ green

---

## How Marty prompts

| You type | Conductor |
| --- | --- |
| `status` | Probes only |
| `execute` / `go` | Spawn A + B in parallel; you do click card |
| `Result:` … | Stamp; if Accuracy F FAIL → Overview/Orders fix lane, **not** Customers unlock |
| `go money` / `go site` / `stop` | Listing leftovers / one Site / idle |

---

## Model matrix (locked)

| Job | Model |
| --- | --- |
| Conductor plan/integrate/`gh`/`flyctl`/Pages/board | **inherit** |
| Marty clicks / shell probes | **no model** |
| Spawn A Desk #220 · Spawn B assert script · Site HTML | **composer-2.5-fast** |
| Ship critic / HOLD | **claude-opus-5-5-medium ×1** then Composer fix |
| Banned | Research fleets · Opus on CSS · 3rd lane · recook #219 · CPA/enterprise/review-ask · unlock Customers · ads |

Env names (exact): `MCFLY_SAMPLE_ONLY` · `MCFLY_LIVE_STAGE` — never shorthand.

---

## 1. Confidence + risks

Confidence **medium-high** on order (Marty || #220 || assert). Risks:

- Any `fly deploy` without secret re-assert → git `[env]` re-parks Live / SAMPLE on
- #220 may hide tabs but **loaders still fetch** — direct `/app/customers|ltv|growth` leak
- #220 never ran CI — MERGEABLE is a false green
- SCOREBOARD ~v460 + stale phone-wrap next-ship misleads workers
- Accuracy F is Marty judgment — if FAIL, next ship is Overview/Orders reconciliation, **not** Customers

---

## 2. Spawn Prompt A — Desk #220

Paste into Cursor Task (`composer-2.5-fast`, local, Desk lane):

```
model: composer-2.5-fast
Task: Finish PR #220 (branch cursor/live-desk-tab-gate-b8fc, base cursor/spend-trust-recurring) to a mergeable, non-draft-ready state. Path A is decided: Customers, Growth, and LTV stay locked through liveDeskTabAllowed until MCFLY_LIVE_STAGE opens them. Check out the existing branch; do not open a new PR.
Exclusive files: the 14 files already in #220 (app/app/components/{CustomersScoreboard,DeskPanelRail,DeskTopTabs,LiveDeskLockedPage}.tsx, app/app/lib/{desk-customers-stack.server,live-desk-surface,live-desk-surface.test,live-unpark}.ts, app/app/routes/{app,app.customers,app.growth,app.ltv}.tsx, app/app/styles/mcfly-desk.css, docs/ops/LIVE_UNPARK_CHECKLIST.md), plus app/app/lib/live-unpark.test.ts.
Required: each locked route's loader must refuse to fetch or return Customers/LTV/Growth data when the gate is closed. Hiding the tab is not enough. Add a test per route for gate closed → locked page, no data read. Rebase onto 8b60ab5 if behind.
Refuse: fly.toml, site/**, scripts/**, docs/LIVING_BOARD.md, docs/ops/SCOREBOARD.md, billing, scopes, SAMPLE toggle, the 90-day logic, Overview/Orders. No git commit/push. No fly deploy. No gh pr ready/merge.
Done when (run in marketing-mix-model/app): npm run typecheck && npm run lint && npm test all pass; git diff --stat vs the base only lists the exclusive files.
Return: PASS/FAIL, test counts, the diff stat, one line per locked route naming the loader guard, and any file you needed but were refused.
```

---

## 3. Spawn Prompt B — Ops assert script

Paste into second Task (`composer-2.5-fast`, local, Ops lane) **in parallel** with A:

```
model: composer-2.5-fast
Task: Create scripts/assert-live-secrets.sh. It is read-only and must never set anything.
Behavior: run `flyctl ssh console -a mcfly-analytics -C 'printenv MCFLY_SAMPLE_ONLY MCFLY_LIVE_STAGE'`. Take expected values from args or env, defaulting to false / overview_orders. Also curl https://mcfly-analytics.fly.dev/health and expect 200. Print one PASS/FAIL line per check and exit non-zero on any FAIL or if flyctl fails. Add a --print-fix flag that only echoes the `flyctl secrets set …` command and never runs it. Needs set -euo pipefail; must not print tokens. Do not use `fly secrets list` digests as proof.
Exclusive files: scripts/assert-live-secrets.sh. Optional note text for LIVE_UNPARK "Deploy re-assert" — return in chat if Lane A still owns that file.
Refuse: app/**, fly.toml, site/**, docs/LIVING_BOARD.md, docs/ops/SCOREBOARD.md, any secrets set/deploy, git commit.
Done when: bash -n passes; shellcheck clean if installed; live run against production prints honest PASS/FAIL; --print-fix echoes without executing.
Return: script path, live-run output, Scoreboard stamp text (v467 + secrets-verified timestamp) for Conductor to paste.
```

---

## 4. Conductor integrate checklist (inherit)

1. Read both returns. FAIL or diff outside exclusive files → one fix-only resume to that lane.
2. Re-run in `marketing-mix-model/app`: `npm run typecheck && npm run lint && npm test`.
3. Manual: `MCFLY_LIVE_STAGE=overview_orders` → `/app/customers`, `/app/ltv`, `/app/growth` show locked page, **no data query**.
4. Workers leave uncommitted. Conductor commits **only after** Marty `execute`: #220 stays on its branch; assert script → separate commit/PR on `cursor/spend-trust-recurring`. Conventional commits.
5. `gh pr ready 220` → wait `gh pr checks 220` green (or record “no CI; local green”) → ≤1 Opus Ship.
6. Opus HOLD → one Composer fix → one re-Ship → then stop.
7. Merge only on Ship PASS.
8. **Fly skipped by default.** If deploy: `flyctl deploy` → `flyctl secrets set MCFLY_SAMPLE_ONLY=false MCFLY_LIVE_STAGE=overview_orders` → `scripts/assert-live-secrets.sh` PASS or roll back.
9. Restamp `docs/ops/SCOREBOARD.md` + `docs/LIVING_BOARD.md`: **v467**, secrets verified, **drop** stale phone-wrap “next ship”. Update cash-machine canvas.
10. No Site Pages until Marty reports Listing Save.
11. On execute: copy this SoT to `docs/research/2026-09-23-CURSOR_FINISH_PLAN.md`.

---

## 5. Marty click card

```
1 Re-grant read_reports on store/devmcflyads (accept scope prompt)
2 Scorecard 1–7 + Accuracy F vs Admin Analytics (closed prior day)
3 Listing Save from docs/ops/LISTING_LIVE_PASTE.md (Public app 403721814017) — no Submit unless you choose
4 Spot-check https://apps.shopify.com/mcfly-analytics-public
5 Reply → Result: regrant=Y/N · score=_/7 · accuracyF=PASS/FAIL($mcfly vs $admin, range) · listingSave=Y/N
6 Then: execute | go site | stop
```

Partner app: `https://dev.shopify.com/dashboard/227535001/apps/403721814017`  
Shop: `https://admin.shopify.com/store/devmcflyads/apps`

---

## 6. Verification / critic FAIL bars (Opus)

FAIL Ship if any:

- Locked route loader still queries Customers/LTV/Growth when gate closed
- #220 diff touches Overview/Orders, billing, scopes, `fly.toml`, or `site/**`
- typecheck/lint/test fail, or tests only assert “tab hidden”
- Assert script can mutate secrets, or exits 0 on missing/mismatch
- Deploy without assert script PASS after
- Worker commit/push/`gh pr merge`/`fly deploy`
- SCOREBOARD/Board still ~v460 or claims Customers/LTV unlocked
- Invented reviews/installs/Accuracy/listing URL
- Pages publish before Listing Save

---

## 7. What NOT to spawn

- Third lane · research fleets · re-run `mcfly-research/` cooks  
- Site/Pages before Listing Save · listing rewrite agents  
- CPA · enterprise-feel · niche #180 · ReviewAsk  
- Unlock Customers/LTV · “unpark next stage”  
- Ads / Meta prep · TW/Lifetimely parity  
- CSS polish · second Opus without HOLD  
- Any lane editing `fly.toml` `[env]` to “fix” kill-switch (stays parked/true)

---

## Trajectory (honest)

Win = $39 morning desk merchants trust at $0 spend. Beat TW/Lifetimely on uninstall themes (≠ Shopify, connectors, bill shock)—not pixel/P&L suite. Path: trust + listing → paid → ≥3 reviews → FUNNEL → ads.

**Program done-when:** Result written · #220 merged after Ship · assert script exists · SoT = v467 · ≤1 Site after Save · Ads NO · Opus 0 or 1.
