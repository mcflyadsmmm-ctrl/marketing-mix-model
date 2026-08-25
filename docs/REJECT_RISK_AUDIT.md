# Reject-risk audit — Mcfly Analytics (App Store)

**Auditor lane:** B1 App Store compliance + B2 legal/trust.  
**Re-audit date:** 2026-08-24 (post 2.1.1 pause)  
**Companion:** [`RESUBMIT_REJECTION_HARDENING.md`](./RESUBMIT_REJECTION_HARDENING.md) · [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) · [`BILLING_TIERS.md`](./BILLING_TIERS.md)

**Verdict:** Code + Fly **v141** address the paused 2.1.1 billing iframe bug. **Not resubmit-ready** until human gates below. **Not App Store approved.**

---

## Evidence snapshot (2026-08-24)

| Check | Result |
| --- | --- |
| Fly image | **v141** (`app` + `worker` started, iad) |
| `GET https://mcfly-analytics.fly.dev/health` | **200** `ok` + `db:up` |
| Live Upgrade JS | `ProUpgradeButton-BeJLYLQ_.js` — POST + `window.open(_, "_top")` + `embedded=1`; never same-frame Admin |
| `MCFLY_BILLING` / `SHOPIFY_APP_HANDLE` | Deployed on Fly |
| SCOPES | `read_orders,read_customers` (no `read_all_orders`) |
| Trust URLs | **Use Fly** `https://mcfly-analytics.fly.dev/{privacy,support,terms}` — repo `site/` is honest; **Pages still waitlist** |
| Vitest | **443 passed** (+ iframe guard suite); 1 unrelated `@mcfly/api-contract` suite fail |
| Compliance spotcheck | **PASSED** |

---

## Top remaining risks (ranked) — mostly HUMAN

| # | Risk | Severity | Agent / human |
| --- | --- | --- | --- |
| 1 | Partner test form empty + checkbox off — **4.5.4 / 4.5.5** | **Critical** | **HUMAN** checkbox ON; paste TEST ACCOUNT block; never `<PASTE…>` |
| 2 | Partner Pricing Free-only while Upgrade charges — **1.1.4 / 1.2** | **Critical** | **HUMAN** set Free + Pro $39 |
| 3 | No embedded Admin click-test of Upgrade path | **Critical** | **HUMAN** smoke |
| 4 | Live mcflyads.com still “when Billing announced” until Pages deploy | **High** | **HUMAN** paste Fly trust URLs (or CF token to publish Pages) |
| 5 | SAMPLE desk ON during review | **High** | **HUMAN** OFF |
| 6 | Emergency contact / PCD / Distribution | **High** | **HUMAN** if not already |

**Agent closed this tick:** billing iframe 2.1.1 hardening + tests; listing/docs honesty Free+Pro; site HTML honesty in repo.

Do **not** claim approved.
