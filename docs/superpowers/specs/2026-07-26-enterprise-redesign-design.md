# Enterprise Redesign Design Spec — Mcfly Analytics

**Date:** 2026-07-26  
**Status:** Approved for implementation (program trunk `redesign/enterprise-desk`)  
**Horizon:** 6–8 weeks  
**Religion:** Cash MER = Shopify sales ÷ ad spend; break-even from contribution margin; rules-based allocation. Refuse pixels, MTA, path credit, view-through, “true ROAS,” connector zoo, TW clones.

---

## 1. Problem

The app is a working cash-desk POC with strong religion and hybrid craft, but:

1. **Cash MER homepage is a god-page** (~1268 LOC) — decision, KPIs, unit econ, Spend Explorer, control, spine, mix compete above the fold.
2. **Live Shopify GraphQL pagination on every desk load** will not scale past modest order volume; L12M/3yr UI overclaims the 60-day `read_orders` window.
3. **Activation trust is brittle** — margin “saved” uses a 500ms `updatedAt` heuristic; defaults look locked before confirmation.
4. **Ops gaps** — no PR CI historically, no Playwright ritual smoke, no Sentry, API first-shop fallback, spend upsert without unique day key.
5. **Cursor guardrails** favored site-first Claude swarms and auto Fly deploy — wrong for an enterprise app redesign.

## 2. Goals / non-goals

### Goals

- Trusted MER in ≤10 minutes; weekly Monday ritual ending in allocation.
- World-class Admin-native appearance + usability (steal craft, not attribution).
- Facts-first data path supporting boutique → high-volume stores without BigQuery.
- Cursor OS: Grok-default, PR CI, no auto-deploy during redesign.

### Non-goals (this program)

- Pixels / MTA / CAPI / connector marketplace
- BigQuery / warehouse
- `read_all_orders` without Partner approval
- GMV-tax billing
- Site mega-tick curriculum (paused)

## 3. Product architecture

```text
Shopify Admin (60d) --webhooks+recon--> SalesDayFact
CSV / manual --------------------------> SpendEntry (unique shop+channel+day)
                                              |
                                    Period SQL + MerSnapshot
                                              |
                         Desk / Goals / Allocation / /v1 / overnight
```

**Cash definition (locked):**  
`MER = Σ shop-currency sales (documented cancel/refund policy) ÷ Σ logged ad spend` over the same shop-timezone closed days. Desk, API, overnight, Sheets all use `@mcfly/mer-core` / `@mcfly/mer-engine` only.

## 4. UX architecture

### Hybrid rule (remain)

- **Polaris** owns chrome, forms, tables, empty states, Contextual Save Bar.
- **Apps Script scoreboard island** owns Cash MER + Allocation decision UI (Fraunces KPIs, decision strip).

### Cash MER first viewport (W1–2)

Interactive regions above the fold (≤6):

1. Sticky context / trust chips  
2. Decision takeaway + next action  
3. Period control  
4. 4-up KPI grid (MER, Sales, Spend, EOM/BE)  
5. Primary empty CTA when blocked  
6. One secondary link (“Explore spend mix”)

**Progressive disclosure:** Spend Explorer, control panel, 14-day spine, channel mix — collapsed or below fold by default.

### Activation

- Explicit `Settings.marginConfirmedAt` (nullable DateTime). Unconfirmed margin = preview copy only; break-even not “locked.”
- Empty states: missing margin → Settings; missing spend → Spend; one primary CTA each.

### Goals IA

- Goals remains in primary nav (5 items) as **planning**; Allocation remains **this-week action**.
- Goals uses Contextual Save Bar parity with Settings.

## 5. Data & scale design

| Work | Detail |
| --- | --- |
| Period honesty | Periods beyond Shopify 60d window labeled incomplete / stored-facts-only |
| SalesDayFact | `(shopId, day)` unique; sales, orderCount, new/returning, currency, asOf, source |
| Ingest | Install/backfill chunked within 60d; dirty-day reconcile; optional bulk |
| Webhooks | `orders/create|updated|cancelled` → HMAC → idempotent `WebhookDelivery` → queue → ACK &lt;5s |
| Jobs | Postgres-backed queue; per-shop concurrency 1; DLQ; overnight fan-out |
| Spend | `@@unique([shopId, channel, periodStart])` + upsert |
| API auth | Require shop hint; **remove** global-token first-shop fallback |
| Timezone | Shop IANA tz → day keys (not server local) |

## 6. Operability

- PR CI: test + typecheck + build (`SKIP_HEALTH=1`)
- Playwright ritual smoke + screenshot baselines
- Sentry + structured logs (`shopId`, jobId, Shopify cost)
- SLOs: desk p95 &lt;2–3s (facts); ingest lag p95 &lt;15m; overnight ≥99% shops/day
- Load-test matrix LT1–LT8 documented in `docs/ops/LOAD_TEST_MATRIX.md`
- Entitlement stub: flat fee, no GMV tax (superseded: one plan, no tiers)

## 7. Cursor operating system

See [`docs/CURSOR_REDESIGN_PLAYBOOK.md`](../../CURSOR_REDESIGN_PLAYBOOK.md).

- Rewrite `.cursor/rules/50-subagent-models.mdc` → Grok-default  
- Redesign mode in `CONTINUOUS_24_7` + hourly automation: **no fly deploy**  
- Skills: premium-native, polaris-app-home, shopify-dev/admin/cli, app-store-review, compliance, apps-script craft  

## 8. Success metrics

| KPI | Target |
| --- | --- |
| Settings→Spend→MER | ≤8 min median |
| First viewport regions | ≤6 |
| GraphQL page-loops on desk nav | ≤1 for totals+by-day; prefer 0 (facts) |
| `app._index.tsx` | Progressively ≤400 LOC |
| API without shop hint | 401/403 hard fail |
| PR CI | Green on redesign PRs |
| App Store self-review | 0 codebase fails; human gates listed |

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| L12M/3yr overclaim | Period labels + facts-from-install |
| Webhook miss | Mandatory daily reconcile |
| Redesign churn on Fly | No auto-deploy |
| Feature creep toward TW | Religion refuse + critic lane |

## 10. Delivery slices

1. W0 — Trunk, guardrails, PR CI, playbook, this spec  
2. W1–2 — UX diet, margin confirm, Goals CSB, empty states, CSS split start  
3. W3–5 — Schema/facts/webhooks/auth/spend unique/period honesty/facts read path  
4. W6–8 — Sentry stub, Playwright, load matrix, polish, entitlement stub  

---

**Out of scope:** pixels, MTA, connector zoo, BigQuery, ZIP LTV, GMV billing.
