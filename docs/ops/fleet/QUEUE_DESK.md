# QUEUE — Desk SaaS

**Pod:** Desk · **Paths:** `app/**`, billing docs · **Branch:** `fleet/desk/<id>-*`  
**Merge:** [`MERGE_PROTOCOL.md`](./MERGE_PROTOCOL.md) · **Parent:** [`../FLEET_ENTERPRISE.md`](../FLEET_ENTERPRISE.md)

Ticket fields: `id` · `wave` · `status` · `tag` · `revenue_hypothesis` · `paths` · `model`

| id | wave | status | tag | revenue_hypothesis | paths | model |
| --- | --- | --- | --- | --- | --- | --- |
| D-001 | 1 | ready | money-path | Flip/verify Managed Pricing Pro $39 upgrade path converts Free ritual users | `app/app/lib/billing*.ts`, `app/app/routes/app.billing.tsx`, `docs/BILLING_TIERS.md` | grok impl + critic |
| D-002 | 1 | ready | craft | Ritual retention — CSV→Total ROAS TTFV & honesty banners lift weekly opens | `app/app/routes/app._index.tsx`, `app/app/components/CashTrustBanners.tsx` | grok (+ Claude if quota) |
| D-003 | 2 | blocked | money-path | Agency multi-store Pro ARPU | multi-store surfaces | grok — unlock Wave 2 |
| D-004 | 2 | blocked | money-path | Sheet pull / webhook spend import lifts Pro convert (not SyncWith zoo) | spend import routes | grok — PIPE_AUTOMATION_WEDGE |

**P0 now:** D-001 (after Wave 0 push). Status values: `ready` · `in_progress` · `in_review` · `done` · `blocked`
