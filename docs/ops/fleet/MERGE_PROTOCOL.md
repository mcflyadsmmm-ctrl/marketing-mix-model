# Fleet merge protocol

**SoT parent:** [`../FLEET_ENTERPRISE.md`](../FLEET_ENTERPRISE.md)  
**Failure mitigations:** A2 thrash, A4 fake done, A9 deploy abuse, D5 secrets

---

## Branch naming

| Pod | Pattern | Example |
| --- | --- | --- |
| Desk | `fleet/desk/<ticket-id>-short` | `fleet/desk/D-001-pro-upsell` |
| Services | `fleet/services/<ticket-id>-short` | `fleet/services/S-001-setup-sku` |
| Education | `fleet/edu/<ticket-id>-short` | `fleet/edu/E-001-gumroad-cta` |
| B2B | `fleet/b2b/<ticket-id>-short` | `fleet/b2b/B-001-wl-ia` |
| Growth/Gate | `fleet/growth/<ticket-id>-short` | `fleet/growth/G-001-aso` |

- Branch from latest `main` (or redesign trunk if Conductor names it).
- One ticket → one branch. No multi-ticket mega-branches.
- Prefer Task `best-of-n-runner` / worktrees for risky Desk craft (`craft` / `money-path` tags).

---

## Path locks (CODEOWNERS-style)

| Path glob | Owner pod | Notes |
| --- | --- | --- |
| `app/**` | **Desk** | Shopify embedded app |
| `packages/**` | **Desk** (serialize) | mer-core / engine — Conductor approves cross-pod |
| `site/custom-analytics*` | **Services** | Custom DS lead gen |
| `site/mds-made-easy/**` | **Education** | Course |
| `site/assets/mds-course.*` | **Education** | |
| `site/pricing.html`, `site/product.html`, `site/app.html` | **Growth** or Conductor serialize | Money path copy |
| `site/assets/site.css` | **Conductor-only / serialized** | Never two pods same tick |
| `docs/ops/fleet/**` | **Gate / Conductor** | Queues + logs |
| `docs/BILLING_TIERS.md`, billing routes | **Desk** | |
| `docs/DESK_SCHOOL_PLAN.md` | **Education** | |

If a ticket needs a locked path outside its pod: Conductor grants a **one-tick lease** in the QUEUE note, then revokes.

---

## Before merge (required)

1. Ticket `id` matches branch and QUEUE row status `in_review` or `done-pending-merge`
2. Critic report attached (or BoN pick documented)
3. App touched → `bash scripts/agent-ship-gate.sh` **PASS** (exit 0)
4. App scopes/privacy/sales loaders touched → `bash scripts/mcfly-compliance-spotcheck.sh` PASS
5. No `.env`, secrets, or Partner tokens in diff
6. Religion check: no pixels / MTA / SyncWith zoo / App URL = marketing domain
7. Deploy **not** implied by merge — deploy needs grant phrase or standing grant **after** merge if shipping to prod

---

## Merge order (when conflicts)

1. Gate / fleet docs  
2. Desk (`app/`, packages)  
3. Services (custom analytics)  
4. Education (mds-made-easy)  
5. Growth (pricing/product SEO)  
6. B2B  

On conflict: freeze other pods (failure A2) until Gate + Conductor clear the tree.

---

## PR / integrate rules

- Prefer small PRs; title includes ticket id (`D-001: …`)
- Conductor merges (or founder). Implementer does **not** force-push `main`
- After merge: append [`TICK_LOG.md`](./TICK_LOG.md); mark QUEUE ticket `done`
- If ship-gate FAIL: ≤3 fix attempts on same branch, then HUMAN_GATE / escalate

---

## Deploy after merge

| Surface | Command / action | Grant |
| --- | --- | --- |
| Desk | `fly deploy -a mcfly-analytics` (or Render SoT) | Standing grant or `Desk deploy allowed this turn.` + gate PASS + health curl |
| Static | Cloudflare Pages / GH Pages per host SoT | `Pages deploy allowed this turn.` or standing Pages grant |

Never deploy on cold-start-only host for **Pro-announced** traffic (failure B2).
