# Fleet failure register (live)

**Parent:** [`../FLEET_ENTERPRISE.md`](../FLEET_ENTERPRISE.md)  
**Updated:** 2026-07-31 (Wave 0 bootstrap)  
**Owner:** Growth+Gate Automation + Conductor

Status legend: `open` · `watching` · `mitigated` · `triggered`

| ID | Failure | Status | Notes / evidence |
| --- | --- | --- | --- |
| A1 | Quota burn | watching | Grok default; idle on HUMAN_GATE |
| A2 | Thrash / merge hell | mitigated | [`MERGE_PROTOCOL.md`](./MERGE_PROTOCOL.md) path locks |
| A3 | Mega-thread amnesia | mitigated | Queues + Automations; Conductor no-impl |
| A4 | Fake done | mitigated | Gate owns done; ship-gate required |
| A5 | Religion drift | watching | Refuse in every AUTO paste |
| A6 | Invented work on HUMAN_GATE | watching | Automations must idle |
| A7 | BoN cost explosion | mitigated | Max 2 BoN/day; craft\|money-path only |
| A8 | Uncommitted fleet docs | watching | Fleet OS pushed earlier; Wave1 site money paths still need commit+push + Pages |
| A9 | Standing deploy abuse | watching | [`STANDING_DEPLOY_GRANT.md`](../STANDING_DEPLOY_GRANT.md) + gate |
| A10 | 30-agent fantasy | mitigated | Cap Conductor+4 chats; ≤6 Tasks |
| B1 | Fly card / free gone | watching | See [`HOSTING_BASELINE.md`](./HOSTING_BASELINE.md) — Fly live v135 |
| B2 | Render Free cold start | watching | Ban for Pro announce |
| B3 | Neon Free limits | watching | Inventory DB provider in baseline |
| B4 | Render Free Postgres as SoT | mitigated | Banned in FLEET_ENTERPRISE |
| B5 | Static DNS thrash | watching | CF Pages SoT for mcflyads.com |
| B6 | Commercial free ToS ban | watching | Prefer CF/GH Pages |
| B7 | Render hours/bandwidth | watching | Single free web service max |
| B8 | Host suspend | watching | Gate health curl |
| C1 | App Store reject / stuck | watching | HUMAN — submitted 2026-07-31 (H2); wait review · SUBMIT_NOW / PCD |
| C2 | Free forever zero Pro | watching | Wave 1 Billing path |
| C3 | Custom leads zero closes | watching | Services = sales+delivery |
| C4 | Course no audience | watching | Funnel to app/custom |
| C5 | B2B before retention | mitigated | Wave 2 lock on AUTO_B2B |
| C6 | Scope explosion | watching | revenue_hypothesis required |
| C7 | Shopify Analytics 3.0 | watching | Stay cash-close religion |
| C8 | Unpaid rev-share / no $ | watching | ≥50% Wave 1 capacity |
| D1 | Live-crawl 100k orders | watching | Job queue / enterprise redesign |
| D2 | Job queue / DLQ ignore | watching | [`JOB_QUEUE.md`](../JOB_QUEUE.md) |
| D3 | Multi-tenant bleed | watching | Compliance stop deploys |
| D4 | CSV OOM / upsert storms | watching | Caps stay |
| D5 | Secrets in commits | watching | Gate grep; never commit .env |
| E1 | Founder HUMAN_GATE stall | open | [`HUMAN_GATE_BOARD.md`](./HUMAN_GATE_BOARD.md) |
| E2 | Conductor implements | mitigated | Rule in FLEET_ENTERPRISE |
| E3 | Chaos priorities | mitigated | QUEUE_* SoT |
| E4 | Deploy without grant | watching | Grant phrases |

### Kill criteria check (Gate tick)

- [ ] No religion on main  
- [ ] No tenant bleed  
- [ ] Hosting ≤15% revenue (N/A until revenue)  
- [ ] Not 3 thrash days  
- [ ] No `stop fleet`  
