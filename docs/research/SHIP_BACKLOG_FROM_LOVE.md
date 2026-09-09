# Ship backlog from love research (2026-09-09)

Exclusive-file Desk waves derived from [LOVE_SCORECARD.md](./LOVE_SCORECARD.md). Conductor owns commit + Fly. Workers do not deploy. ≤4 lanes; **one Desk Claude** on overlapping files.

---

## Wave Love-0 — Finish 7C export (in flight)

| | |
| --- | --- |
| **Outcome** | Period ledger CSV live on Fly; Overview/Spend download when closed-day trusted |
| **Files** | Allowlist in `docs/ops/money/WAVE7C_EXPORT_LEDGER_SPEC.md` |
| **DoD** | Spec acceptance + ship gate + Fly health + smoke stamp |
| **Status** | **DONE** · `06a88cb` · Fly **v201** |

---

## Wave Love-1 — SAMPLE honesty (P0 · L2)

| | |
| --- | --- |
| **Outcome** | Live coverage never counts SAMPLE days; SAMPLE primary CTA drives use-real, not demo toy |
| **Exclusive files** | `app/app/routes/app.spend.tsx` (coverage), `app/app/lib/first-session-path.ts` (and tests), possibly `SampleDeskBanner` |
| **Must not** | Touch Settings target-mer; no OAuth |
| **DoD** | Hostile #1 + #5 closed; unit tests; ship gate |

---

## Wave Love-2 — Overview cold empty (P0 · L3)

| | |
| --- | --- |
| **Outcome** | Cold merchant can land Overview empty state without forced Spend bounce |
| **Exclusive files** | `app/app/routes/app._index.tsx` (+ honesty tests) |
| **Must not** | Overlap Love-1 spend.tsx in same Claude lane |
| **DoD** | Hostile #2 closed; cold path documented in REVIEWER_TEST_SCRIPT |

---

## Wave Love-3 — Explorer confirmed target only (P0 · L5)

| | |
| --- | --- |
| **Outcome** | Spend Explorer never draws “Target 3.00×” from unconfirmed default |
| **Exclusive files** | `app/app/lib/spend-explorer.ts`, `app/app/components/SpendExplorer.tsx`, related tests; wire from `_index` only if needed |
| **Must not** | Reopen Settings target semantics except passing `targetMerConfirmed` |
| **DoD** | Series uses null target when unconfirmed; SAMPLE still shows sample target |

---

## Wave Love-4 — ReviewAsk prove (P0 · L6 · Marty+Desk)

| | |
| --- | --- |
| **Outcome** | Admin smoke proves ReviewAsk appears when gates pass; App Bridge miss mitigated |
| **Files** | `ReviewAsk.tsx` only if smoke FAIL; else Marty stamp only |
| **DoD** | Smoke Record notes ReviewAsk behavior; still **0** published reviews until honest |

---

## P1 (park until interviews or smoke+outbound rolling)

- L7 deep-history copy polish  
- L8 CSV/Apps Script craft pack (`docs/` + templates only first)  
- L9 site MER literacy from COMMUNITY_SIGNALS  
- L10 habit prompts after first trusted ROAS  

## Refuse forever (unless MASTER_PLAN amended by founder)

L12 Meta/Google OAuth · L13 pixels/MTA.
