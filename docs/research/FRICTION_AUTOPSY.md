# Friction autopsy — Mcfly Analytics (R3)

**Date:** 2026-09-09  
**Sources:** `HOSTILE_WAVE6_BACKLOG.md`, `UNINSTALL_RISKS.md`, `SMOKE_APP_STORE_ADS.md`, `REJECT_RISK_AUDIT.md` (skim), Wave 7B Spend Explorer caveat, ReviewAsk / deep-history / SAMPLE paths, Wave 7C export landing.

**Scoring:** Uninstall risk (1–5) × Frequency (1–5). Religion: **Fix** = ship under cash-desk religion · **Keep** = intentional · **Refuse** = do not “fix” with pixels/OAuth zoo.

---

## Top love-killers (ranked)

| Rank | Friction | U×F | Religion | Exclusive fix lane (suggested) |
| --- | --- | --- | --- | --- |
| 1 | **Spend entry tax** — CSV/paste feels heavier than Monday sheet for first win | 5×5=25 | Fix | `app.spend.tsx`, templates, one-row UX copy — **not** Meta OAuth |
| 2 | **Cold path / Overview bounce** — never see Overview empty honesty; bounced to Spend | 5×4=20 | Fix | `app._index.tsx` redirect vs empty (Hostile #2) |
| 3 | **SAMPLE mistaken for live** + coverage counting SAMPLE as “up to date” | 5×4=20 | Fix | `app.spend.tsx` coverage loader (Hostile #1); SAMPLE CTA → use-real (Hostile #5) |
| 4 | **Expected auto-sync** (TW/SyncWith muscle memory) → uninstall “not working” | 4×5=20 | Fix copy / Keep CSV | Listing FAQ + Spend empty honesty; **Refuse** Mcfly ads OAuth |
| 5 | **ReviewAsk silent miss** — App Bridge `reviews` once; flywheel dead (reviews=0) | 4×4=16 | Fix | `ReviewAsk.tsx` + recheck poll (Hostile #3; partial ship exists — verify live) |
| 6 | **Deep-history / 60-day window** surprising LTV/Goals users | 4×3=12 | Fix | Settings grant CTA + Overview banners (`deep-history-honesty`) |
| 7 | **Unconfirmed target rail on Spend Explorer** (“Target 3.00×” without confirm) | 3×4=12 | Fix | `spend-explorer.ts` + `SpendExplorer.tsx` (outside Wave 7B allowlist — new lane) |
| 8 | **Pro / billing before first trusted ROAS** (historical risk; one-plan now) | 4×2=8 | Fix | Keep Spend primary until cash-ready; nav discipline (`UNINSTALL_RISKS`) |
| 9 | **Period incomplete → green/red verdicts** (trust leaks) | 4×2=8 | Fix | Keep 7B trust gates; audit explorer + allocation copy |
| 10 | **Export not yet on Fly** while operators want finance CSV | 3×3=9 | Fix | Finish Wave 7C commit + Fly; stamp smoke |

---

## Hostile Wave 6 residual checklist

| # | Item | Status note |
| --- | --- | --- |
| 1 | SAMPLE days in live coverage | Open — severe honesty |
| 2 | Overview cold-empty unreachable | Open |
| 3 | ReviewAsk App Bridge one-shot | Partial fix shipped earlier — re-verify on Admin smoke |
| 4 | ReviewAsk vs `periodExceedsFactWindow` | Fix stamped in git (`8f4fdb6`) — confirm on Fly |
| 5 | SAMPLE CTA → `/app/demo` | Open |

---

## TTFV autopsy (&lt;10 min claim)

Smoke SoT: `docs/ops/money/SMOKE_APP_STORE_ADS.md` — Result blank until Marty Admin PASS.

| Step | Ideal | Friction today |
| --- | --- | --- |
| Install → Real mode | Clear | SAMPLE default confusion |
| Margin confirm | Settings | Optional clarity OK after 7B |
| Add spend | One-row or CSV | CSV tax; coverage honesty |
| See trusted Total ROAS | Overview | Bounce / trust banners |
| Ask for review | After value | ReviewAsk miss risk |

---

## Wave 7C note

`period-ledger` lib + route present in dirty tree (2026-09-09). Until Conductor commit + Fly + smoke, do **not** sell export as live. Fail-closed SAMPLE is correct religion.

---

## Explicit refuse (not love-killers — traps)

- Meta/Google spend OAuth inside Mcfly
- Pixels / MTA / “true ROAS”
- SyncWith connector marketplace
- GMV tax pricing
- Inventing reviews to unlock ads

---

## Recommended P0 Desk waves (from autopsy only)

1. **Honesty:** SAMPLE coverage + SAMPLE CTA use-real  
2. **Activation:** Overview cold-empty reachable  
3. **Explorer:** Pass confirmed target only into Spend Explorer series  
4. **Ship:** Wave 7C export → Fly  
5. **Reviews:** ReviewAsk Admin recheck during smoke  

Money parallel unchanged: smoke PASS · outbound ×20 · FUNNEL paste · ads NO.
