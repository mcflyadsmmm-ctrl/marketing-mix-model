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

## Wave Love-1 — SAMPLE CTA honesty (P0 · L2 · Hostile #5 only)

| | |
| --- | --- |
| **Outcome** | SAMPLE primary CTA drives use-real / Real mode, not `/app/demo` toy admin |
| **Exclusive files** | `app/app/lib/first-session-path.ts` (+ tests), `SampleDeskBanner` / Overview SAMPLE CTA as needed |
| **Must not** | Touch Settings target-mer; no OAuth; do not re-litigate Hostile #1 |
| **DoD** | Hostile #5 closed; unit tests; ship gate |
| **Note** | Hostile #1 (SAMPLE in live coverage) stamped **CLOSED** in FRICTION_AUTOPSY §3 with file evidence — Love-1 does not re-open coverage |

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

## Wave Love-5 — Automate / pipe discoverability (P0 · L16)

| | |
| --- | --- |
| **Outcome** | Spend surfaces links to `/app/spend/template?pipe=long\|wide`; listing/smoke no longer tell reviewers to click a missing Automate tab |
| **Exclusive files** | `app.spend.tsx` (link row), optionally `docs/ops/LISTING_LIVE_PASTE.md` + `REVIEWER_TEST_SCRIPT.md` |
| **Must not** | Build Meta/Google OAuth or resurrect Connections |
| **DoD** | Click path from Spend → template works; Partner paste notes “pipe template” not Automate tab |

---

## Wave Love-6 — First-day coverage tone (P0 · L14)

| | |
| --- | --- |
| **Outcome** | First typed spend day does not greet with a critical red “27-hole” banner; incomplete coverage is honest but not hostile |
| **Exclusive files** | Spend coverage UI path in `app.spend.tsx` (+ tests) — **after Love-1** lands (same file exclusive) |
| **DoD** | New merchant path documented; no SAMPLE counted as live |

---

## Wave Love-7 — declare-recon form OR delete dead reads (P1 · L17)

| | |
| --- | --- |
| **Outcome** | Merchant can set/clear declared Ads Manager spend for ±5% recon, **or** Overview/Advanced/Allocation stop reading unreachable state |
| **Exclusive files** | Settings or Spend recon form + `declare-recon` action wire; or remove dead banners |
| **DoD** | No orphan action; religion intact |

---

## Wave Love-8 — Allocation verdict render (P1 · L18)

| | |
| --- | --- |
| **Outcome** | Hold/reduce/step-test advice already computed is shown, or empty copy no longer promises it |
| **Exclusive files** | `app.allocation.tsx` (+ related lib already computing actions) |
| **DoD** | Copy matches UI |

---

## P1 (park until interviews or smoke+outbound rolling)

- L7 deep-history copy polish  
- L8 CSV/Apps Script craft pack (`docs/` + templates only first)  
- L9 site MER literacy from COMMUNITY_SIGNALS  
- L10 habit prompts after first trusted ROAS  
- L15 trial clock vs trust clock desk copy  

## Refuse forever (unless MASTER_PLAN amended by founder)

L12 Meta/Google OAuth · L13 pixels/MTA.
