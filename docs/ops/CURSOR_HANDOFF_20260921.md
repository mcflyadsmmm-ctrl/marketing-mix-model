# Mcfly Analytics — Cursor handoff (2026-09-21 MT)
**From:** Galaxy Master (Grok Bot fleet HALTED by Marty)  
**To:** Cursor cloud agents / Project conductor on `mcflyadsmmm-ctrl/marketing-mix-model`

## SoT
**Full fleet recreate + paste-ready agent prompts:**  
[`CURSOR_FLEET_HANDOFF_FULL.md`](./CURSOR_FLEET_HANDOFF_FULL.md)  
*(repo target: `docs/ops/CURSOR_FLEET_HANDOFF_FULL.md`)*

This short file is the 2026-09-21 tip-state snapshot. Do not invent roles. **Current runtime (2026-09-23 America/Denver)** is on `docs/LIVING_BOARD.md` and `docs/ops/SCOREBOARD.md`: Fly secrets unparked to `overview_orders` (`MCFLY_SAMPLE_ONLY=false`), recent release **~v460**, health **200** at 22:22Z, `read_reports` shipped, PCD L2 Approved, Customers/LTV locked, ads **NO**, reviews **0**. Git kill-switch stays parked; secrets override; Marty re-asserts after deploy. The PARKED row below is that day’s history.

---

## Tip state (authoritative)

| Item | Value |
|------|--------|
| Repo | https://github.com/mcflyadsmmm-ctrl/marketing-mix-model |
| Branch | `cursor/spend-trust-recurring` |
| SHA | `2107ea876cf86e8195f172e88415520b5a450ef9` |
| Fly | `mcfly-analytics` **v406** · `/health` ok · `/app` 200 |
| Live | **PARKED** (`MCFLY_SAMPLE_ONLY=true`) — never unpark without Marty |
| Next cook | **Spend paste densify Brief 2** (empty paste → Total ROAS / Cash CPA / payback stay **—**) |
| Deploy | `flyctl deploy --app mcfly-analytics --remote-only` + Cursor **My Secrets** `FLY_API_TOKEN` |
| Open PRs | #136 (this handoff) · #131 (briefs, may be unmerged) |

### Merged recent
#124–#130 P0/P1 · #132 forecast · #133 insight cards · #134 unpaid 90d · #135 promo depth

### Marty-only
Live go · Partner paste/Submit · approve-send · secrets/legal/banking

### Continuity one-liner
Continue tip from `2107ea8` / Fly v406: restart Spend paste densify → Reviewer → merge → Fly; keep Live parked; spawn six agents from FULL §6 (Conductor, Craft App, Reviewer, Compete Scout, Live Accuracy, Warm Ops); ping Marty only for Live / Partner / approve-send / secrets.

### First 60 min
See FULL §10. Grok fleet **HALTED**; routines paused.
