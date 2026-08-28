# Submit-ready scorecard — 2026-07-28 (Chat 5 critic refresh)

> **ARCHIVED.** This scorecard predates paid managed pricing and the August fixes. Use [`RESUBMIT_PLAN.md`](./RESUBMIT_PLAN.md); do not use the percentages or Free-listing instructions below.

**Purpose:** Honest craft vs human-gate readiness for first **Free** App Store submit.  
**SoT:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) · [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md) · [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · [`SHIP_BUILD_PLAN.md`](./SHIP_BUILD_PLAN.md)  
**Auditor:** Fleet Chat 5 (read-mostly). **No deploy. No App Store approval claim.**

---

## Evidence this tick (2026-07-28 ~13:15 UTC)

| Check | Result |
| --- | --- |
| `GET https://mcfly-analytics.fly.dev/health` | **200** `{"ok":true,"db":"up",…}` |
| Trust: `/support` `/privacy` `/pricing` `/terms` `/demo` | **200** each |
| `/assets/mcfly-sheets-spend-guide` | **200** (`.html` → **308** redirect — fine) |
| Support invite-only voice | **OK: Free listing voice** (no `invite-only`) |
| Privacy PCD signals | **OK** (`numberOfOrders` / opaque / `read_customers` diet) |
| `bash scripts/agent-ship-gate.sh` | **PASSED** exit **0** (241 unit tests + typecheck + build + health) |
| `bash scripts/mcfly-compliance-spotcheck.sh` | **PASSED** exit **0** |
| Listing screenshots `docs/listing-assets/shots/` | **4/5 ready** — need Spend or Allocation for #5; marketing site held out |

---

## Scorecard

| Lane | Score | Notes / evidence |
| --- | ---: | --- |
| **Agent hygiene** | **~94** | Ship-gate + compliance spot-check green this tick; religion/scopes/HMAC/CSV diet intact |
| **Site / trust URLs** | **~95** | Live 200s + Free voice + PCD privacy signals (2026-07-28 curl) |
| **App UX craft** | **~93** | Cash MER desk + CSV/pipe honesty in repo; Fly health green |
| **Listing package** | **~75** | Copy/icon in docs; **4/5 shots** letterboxed; need Spend/Allocation + screencast |
| **Submit-human** | **~30** | Distribution / PCD / emergency / smoke / assets / Submit **all open** (no reply phrases) |
| **Overall submit-ready** | **~54%** | Agent craft ~90%+; **human gates still dominate Submit** |

### Split (do not conflate)

| Slice | Honest % | Meaning |
| --- | ---: | --- |
| **Agent craft / hygiene** | **~93–94%** | Code + live host + trust URLs ready enough to *support* a Free submit |
| **Human Partner path** | **~30%** | A–E in SUBMIT_NOW not closed |
| **App Store approved** | **0%** | **Not claimed. Not proven. Review not started.** |

---

## Remaining fatals ranked — AGENT_FIX vs HUMAN_GATE

| # | Risk | Severity | Class | Notes |
| --- | --- | --- | --- | --- |
| 1 | Partner **Distribution** ≠ Shopify App Store | **Critical** | **HUMAN_GATE** | No public listing path |
| 2 | **PCD Level 1** not requested (before Submit) | **Critical** | **HUMAN_GATE** | Paste from listing §PCD; **leave name/email/phone/address unchecked** |
| 3 | **Install smoke** on `devmcflyads` not closed | **Critical** | **HUMAN_GATE** | Margin → CSV → MER; sample **OFF** |
| 4 | **Sample desk ON** during reviewer path | **Critical** | **HUMAN_GATE** | 1.1.4 factual-info reject |
| 5 | **Listing shot #5** (Spend CSV or Allocation) still missing | **High** | **HUMAN_GATE** | Upload 01–04 from `shots/`; capture `/app/spend?shot=1` for #5 |
| 6 | **Demo screencast** missing | **High** | **HUMAN_GATE** | Listing package |
| 7 | **Emergency contact** email+phone | **High** | **HUMAN_GATE** | Partner Settings |
| 8 | Partner paste: Free + copy + icon + automated checks + **Submit** | **High** | **HUMAN_GATE** | Wrong pricing / empty fields |

### Non-fatal agent polish (not submit blockers this tick)

| Item | Class | Notes |
| --- | --- | --- |
| PCD paste-pack / privacy harden (Fleet Chat 2) | **AGENT_FIX** (optional) | Listing §PCD already exists; live privacy signals OK — polish only |
| Pages deploy for newest site copy | **HUMAN_GATE** if founder wants live | Trust URLs already green; not a reject fatal |
| Meta/Google OAuth App Review | **HUMAN_GATE** / defer | CSV-first; no fake Works-with |

**No agent-fatal blockers found this tick.** Do not invent features to “raise” the scorecard.

---

## Remaining human gates (SUBMIT_NOW order)

1. `distribution done`
2. `pcd done` — **Level 1 only** ([`PCD_AND_LTV.md`](./PCD_AND_LTV.md))
3. `emergency contact done`
4. `install works` (sample OFF on `devmcflyads`)
5. `assets uploaded`
6. `submitted`

---

## Verdict (Chat 5)

- **PCD Level 1 only still recommended** — till LTV stays Level 1; do **not** request name/email/phone/address.
- Agent hygiene + live trust/host: **green** (2026-07-28 evidence above).
- **Not submit-ready overall (~54%)** until human A–E close.
- **Do not claim App Store approved.**

### Thrive path progress (unchanged)

| Step | Status |
| --- | --- |
| Narrow ICP positioning | Docs / listing voice — ongoing |
| Ablestar-grade CSV | **Shipped** |
| Pipe automation wedge | **Shipped (CSV path)**; Sheet live pull **DEFER** |
| Refund/cancel honesty | Clarity shipped; cancel/test filter later |
| Channel advice = heuristic | Portfolio-honest |
| Human gates → Submit | **Open** |
