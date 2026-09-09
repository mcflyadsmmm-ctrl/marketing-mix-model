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
| **Status** | **DONE** · `27df782` · Fly with Love-2 |

---

## Wave Love-2 — Overview cold empty (P0 · L3)

| | |
| --- | --- |
| **Outcome** | Cold merchant can land Overview empty state without forced Spend bounce |
| **Exclusive files** | `app/app/routes/app._index.tsx` (+ honesty tests) |
| **Must not** | Overlap Love-1 spend.tsx in same Claude lane |
| **DoD** | Hostile #2 closed; cold path documented in REVIEWER_TEST_SCRIPT |
| **Status** | **DONE** · `e774d5d` · Overview href `/app?stay=1` |

---

## Wave Love-3 — Explorer confirmed target only (P0 · L5)

| | |
| --- | --- |
| **Outcome** | Spend Explorer never draws “Target 3.00×” from unconfirmed default |
| **Exclusive files** | `app/app/lib/spend-explorer.ts`, `app/app/components/SpendExplorer.tsx`, related tests; wire from `_index` only if needed |
| **Must not** | Reopen Settings target semantics except passing `targetMerConfirmed` |
| **DoD** | Series uses null target when unconfirmed; SAMPLE still shows sample target |
| **Status** | **DONE** · `0398fcb` · Fly **v203** · [Love-3](d2330b60-d979-4be6-8e1a-1abc21e65340) |

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
| **Status** | **DONE** · `0398fcb` + listing paste follow-up · Fly **v203** |

---

## Wave Love-1b — one-tap use-real from Overview (P1 bolt-on)

| | |
| --- | --- |
| **Outcome** | SAMPLE “Use my real store” on Overview POSTs `use-real` in one tap (Form), not two |
| **Exclusive files** | `app._index.tsx` primary action Form shape; optional `firstSessionPrimaryAction` POST variant |
| **Note** | Love-1 left two-tap by design (data-mode is POST-only) — [Love-1](eb51c9ec-599c-45ff-a85e-eaf429ed9a2d) caveat |
| **Status** | **DONE** · `32332ba` · [Love-1b](75a5f88d-409a-4022-8c55-9f7178080d09) · Fly **v206** `deployment-01M22DJN03JH5Q46DFVHHPC1WX` |

---

## Wave Love-6 — First-day coverage tone (P0 · L14 · P09)

| | |
| --- | --- |
| **Outcome** | First typed spend day does not greet with a critical red “27-hole” banner; incomplete coverage is honest but not hostile |
| **Exclusive files** | Spend coverage UI path in `app.spend.tsx` (+ tests) — **after Love-1** lands (same file exclusive) |
| **DoD** | New merchant path documented; no SAMPLE counted as live |
| **Status** | **DONE** · `621faa0` · [Love-6](2b5f6345-997b-4ffc-a823-e009d4914262) · Fly `deployment-01M22D1W7HX6Z45WPZV0H8DJD5` |

---

## Wave Love-7 — declare-recon form OR delete dead reads (P1 · L17)

| | |
| --- | --- |
| **Outcome** | Merchant can set/clear declared Ads Manager spend for ±5% recon, **or** Overview/Advanced/Allocation stop reading unreachable state |
| **Exclusive files** | Settings or Spend recon form + `declare-recon` action wire; or remove dead banners |
| **DoD** | No orphan action; religion intact |
| **Status** | **DONE** · DELETE-DEAD-READS · `ad39c90` · [Love-7](0545a5d0-37a9-4f84-af90-6cd4447f1451) · Fly **v210** |

| | |
| --- | --- |
| **Outcome** | Hold/reduce/step-test advice already computed is shown, or empty copy no longer promises it |
| **Exclusive files** | `app.allocation.tsx` (+ related lib already computing actions) |
| **DoD** | Copy matches UI |
| **Status** | **DONE** · `9813811` · [Love-8](d15efbc2-1e72-4012-ab14-6e92513d715a) · Fly **v208** |

---

## Wave Love-trial — Trial vs trust clock (P0 · L15 · P10)

| | |
| --- | --- |
| **Outcome** | Desk states clearly that a trusted Total ROAS needs closed days of entered spend — trial alone is not “done” |
| **Exclusive files** | Overview / empty-state / billing-adjacent copy only |
| **Must not** | Change billing plan length without founder; no OAuth |
| **DoD** | Merchant sees trust clock next to trial; SCORECARD L15 closed |
| **Status** | **DONE** · `a309757` · [Love-trial](abed2077-2524-44d9-86a3-7de68956d282) |

---

## Wave Love-UX — from Shopify peer IA research (2026-09-09)

Sources: [`PEER_APP_IA_SKETCHES.md`](./PEER_APP_IA_SKETCHES.md) · [`BEST_SHOPIFY_APP_UX.md`](./BEST_SHOPIFY_APP_UX.md) · [`MCFLY_NAV_AUDIT.md`](./MCFLY_NAV_AUDIT.md)

| Wave | Outcome | Tag | Status |
| --- | --- | --- | --- |
| **Love-UX1** | Overview dismissible Setup Guide (Judge.me) — elevate existing `FirstSessionGuide` onto Home empty, auto-check steps | small-desk | **DONE** · `b516143` · Fly **v215** |
| **Love-UX2** | Spend pipe-template front-door elevation (Love-5 shipped link; make verbs Matrixify-loud) | small-desk | **DONE** · `0e43a8b` · [Love-UX2+3](7bfd5344-1510-45d8-966c-b7d0542dd336) |
| **Love-UX3** | Cold activate copy: “Shopify sales already here — no ad login” | copy-only | **DONE** · with UX2 `0e43a8b` |
| **Love-UX6** | Overview one-line Total ROAS definition chip | copy-only | **DONE** · `cdc7972` · [Love-UX6](e2745710-0824-49c4-8064-551133821beb) |
| — | Keep core nav Overview·Spend·Settings; no Integrations tab | copy-only | **LOCK** |
| — | Meta OAuth / Integrations nav | challenge | **DEFER** |

---

## Wave Love-Visual — from VISUAL_CRAFT_SHOPIFY_APP.md

Source: [`VISUAL_CRAFT_SHOPIFY_APP.md`](./VISUAL_CRAFT_SHOPIFY_APP.md) §5 + §7 PR gate

| Wave | Outcome | Status |
| --- | --- | --- |
| **Love-V1** | Banner budget on Overview/CashTrustBanners — chips for info; ≤1 critical above fold | **DONE** · `da303a9` · [Love-V1](2dcfa5a2-c194-49e2-853e-de092ec2a929) |
| **Love-V2** | Hero actions: one primary (Update spend); demote Share/ledger | **DONE** · `83cfc37` · [Love-V2](0c553156-a064-4823-bf78-8032e8264616) |
| **Love-V3** | Spend teach: one calm surface above day form (cap banner stack) | **DONE** · `d66f90a` · [Love-V3](581d82a4-a361-421c-98ab-026e33485bc5) |

---

## P1 (park until interviews or smoke+outbound rolling)

- ~~L7 deep-history copy polish~~ **DONE** (optional-after-trust copy live in `deep-history-honesty.ts` / v215)  
- L8 CSV/Apps Script craft pack (`docs/` + templates only first) — **DONE** (CSV_CRAFT_PACK + ladder/pipe links)  
- L9 site MER literacy from COMMUNITY_SIGNALS — **DONE** (faq.html + outbound phrases)  
- L10 habit prompts after first trusted ROAS — **DONE** (HabitNudge on Overview)  
- ~~Goals page unconfirmed-target sister of Love-3~~ **DONE** `7c2f32a`  

## Refuse forever (unless MASTER_PLAN amended by founder)

L12 Meta/Google OAuth · L13 pixels/MTA.
