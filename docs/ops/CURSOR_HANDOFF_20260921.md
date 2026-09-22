# Mcfly Analytics — Cursor handoff (2026-09-21 MT)
**From:** Galaxy Master (Grok Bot fleet HALTED by Marty)  
**To:** Cursor cloud agents / product conductor on `mcflyadsmmm-ctrl/marketing-mix-model`  
**Repo:** https://github.com/mcflyadsmmm-ctrl/marketing-mix-model  
**Tip branch:** `cursor/spend-trust-recurring`  
**Live Fly:** `mcfly-analytics` **v406** · tip SHA `2107ea876cf86e8195f172e88415520b5a450ef9`  
**Health:** `/health` ok=true db=up · `/app` 200  
**Live stage:** PARKED (`MCFLY_SAMPLE_ONLY=true`) — do **not** unpark without Marty

---

## Why this file exists
Marty ordered: **halt all Grok bots** and **pass all memory to Cursor**. Grok fleet is idle. Continue product work **only in Cursor**.

---

## Product lock
- **Mcfly Analytics** — $39 flat Shopify **order-history / LTV desk** (APP-FIRST)
- Painted IA: **Overview → Orders → Customers → Spend → Goals** (Growth/LTV = Customers chips only)
- Commercial: $39/store/mo · 7-day trial · unpaid/trial Live ingest **90 closed days** · paid = full Shopify-visible window (order rows ≤24mo)
- **Never:** COGS/P&L hero · Meta pixels/path credit/MTA · GMV pricing · invent Partner metrics · off-Shopify
- Reviewer before craft-done · scoreboard = accepted work not PR count

## Marty-only gates (Cursor must not do these)
1. Live go / unpark  
2. Partner paste / Submit  
3. Approve-send (warm / review asks)  
4. Secrets / legal / banking  

Smoke stamp **waived** — continuous tip improve was the default until halt.

---

## Tip SoT right now
| Item | Value |
|------|--------|
| Branch | `cursor/spend-trust-recurring` |
| SHA | `2107ea876cf86e8195f172e88415520b5a450ef9` |
| Fly | **v406** |
| SAMPLE | assumed / continuous improve (Marty waived user smoke) |
| Live | **PARKED** |
| Accuracy 5b unpaid 90d | **PASS** (after #134) |

### Merged on tip (recent)
| PR | What |
|----|------|
| #124–#126 | P0 returning$ / cohort LTV / days-to-second |
| #127–#130 | P1 product→LTV / predictive LTV / whale RFM / refunds honesty |
| #132 | P2-A order-history forecast Overview+Goals |
| #133 | P2-B shareable Slack insight cards |
| #134 | Unpaid/trial Live ingest clamp to 90d |
| #135 | Promo discount-depth LTV (Light/Typical/Deep) |

### Docs / briefs
- SoT ops: `docs` + box `/workspace/galaxy-money/mcfly-company/MASTER_OPERATING_PROMPT.md`
- ADD board: `ADD_BACKLOG_RANKED.md` · P2 briefs · PR #131 docs `docs/ops/ADD_BRIEFS_PROMO_LTV_SPEND_PASTE_20260922.md`
- Listing paste ready: `LISTING_PASTE_READY.md` (Marty Partner only)
- Warm drafts: `/workspace/galaxy-money/mcfly-growth/` (approve-send only)

---

## Next Cursor work (was in flight — interrupted by halt)
1. **Spend paste densify** (Brief 2) — Cursor `bc-84c89f41` **cancelled mid-cook**. Restart from tip `2107ea8` using Brief 2 in `docs/ops/ADD_BRIEFS_PROMO_LTV_SPEND_PASTE_20260922.md`. Empty paste keeps Total ROAS / Cash CPA / payback as `—`. No Meta ROAS.
2. After Reviewer PASS → merge tip → `flyctl deploy --app mcfly-analytics --remote-only`  
   - Auth: Cursor **My Secrets** Runtime Secret `FLY_API_TOKEN` for repo `mcflyadsmmm-ctrl/marketing-mix-model` (personal secrets). Env-scoped alone was insufficient earlier.
3. Do **not** Live unpark. Do **not** Partner Submit.

---

## Deploy notes for Cursor
- Successful path: Cloud Agent + `FLY_API_TOKEN` injected → Fly v404 then v405 then v406
- Failed paths: Grok Bot secret card (does not inject into Cursor VMs); Mac not required
- No root GitHub Actions Fly workflow today

---

## Fleet (HALTED)
Galaxy Master · Mcfly App · Reviewer · Compete Scout · Live Accuracy · Warm Ops  
Rooms: Craft / Growth / Trust / Ops (Ops rare)  
Grok routines **paused:** Mcfly daily drive · Mcfly niche weekly

---

## Continuity one-liner for Cursor
Continue Mcfly tip on `cursor/spend-trust-recurring` from `2107ea8` / Fly v406: restart Spend paste densify → Reviewer → merge → Fly; keep Live parked; honor painted IA and refuse list; ping Marty only for Live / Partner / approve-send / secrets.
