# QUEUE — Desk SaaS

**Pod:** Desk · **Paths:** `app/**`, billing docs · **Branch:** `fleet/desk/<id>-*`  
**Merge:** [`MERGE_PROTOCOL.md`](./MERGE_PROTOCOL.md) · **Parent:** [`../FLEET_ENTERPRISE.md`](../FLEET_ENTERPRISE.md)

Ticket fields: `id` · `wave` · `status` · `tag` · `revenue_hypothesis` · `paths` · `model`

| id | wave | status | tag | revenue_hypothesis | paths | model |
| --- | --- | --- | --- | --- | --- | --- |
| D-001 | 1 | done | money-path | Flip/verify Managed Pricing Pro $39 upgrade path converts Free ritual users | `app/app/lib/billing*.ts`, `app/app/routes/app.billing.tsx`, `docs/BILLING_TIERS.md` | grok impl + critic |
| D-002 | 1 | ready | craft | Ritual retention — CSV→Total ROAS TTFV & honesty banners lift weekly opens | `app/app/routes/app._index.tsx`, `app/app/components/CashTrustBanners.tsx` | grok (+ Claude if quota) |
| D-003 | 2 | blocked | money-path | Agency multi-store Pro ARPU | multi-store surfaces | grok — unlock Wave 2 |
| D-004 | 2 | blocked | money-path | Sheet pull / webhook spend import lifts Pro convert (not SyncWith zoo) | spend import routes | grok — PIPE_AUTOMATION_WEDGE |

**P0 now:** D-002 (D-001 code-complete 2026-07-31). Status values: `ready` · `in_progress` · `in_review` · `done` · `blocked`

### D-001 evidence — Managed Pricing Pro path (code-complete; do not announce)

1. `ProUpgradeButton` POSTs `/app/billing` → `requestProSubscription` (gated by `MCFLY_BILLING=1`).
2. On ok → `buildManagedPricingPlansUrl(shop)` → top-frame Shopify plan picker (`…/charges/{handle}/pricing_plans`).
3. Active Pro synced via `syncShopProFromShopify` / webhooks → `Shop.proBillingActive` (not `appSubscriptionCreate`).
4. Tests: `cd app && npm test -- billing.test.ts billing-flag.test.ts billing-webhook.test.ts` → exit 0 (28 passed).
5. **Founder (H9 open):** Partner Free+Pro $39 plans set; Fly `MCFLY_BILLING=1` only after announce — no merchant Billing marketing yet.
