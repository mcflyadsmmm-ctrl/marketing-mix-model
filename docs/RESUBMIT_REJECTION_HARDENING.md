# Resubmit rejection hardening — 2026-08-24

**App:** Mcfly Analytics · Ref 127166 (paused) · Fly `mcfly-analytics` **v141**  
**Prior reject:** [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) **2.1.1** (Upgrade loaded `admin.shopify.com` inside iframe → refused to connect) + **4.5.4 / 4.5.5** (incomplete test credentials).

This note is the agent audit after “make sure it doesn’t get rejected again.”

---

## Prior reject → fix evidence

| Issue | Fix | Live evidence |
| --- | --- | --- |
| 2.1.1 Admin in iframe | User-gesture `open(_, "_top")` via `BillingExitProvider` + GET HTML bounce (`billing-exit.server.ts`); never bare 302 to Admin | Spend → Upgrade must open Admin plan picker in the top frame |
| 4.5.4 / 4.5.5 credentials | [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md) | **HUMAN** checkbox ON + paste TEST ACCOUNT block (Username: none). Do not submit empty user/pass with box off. |

---

## Full requirements matrix (agent-verified)

| Req | Risk if failed | Status |
| --- | --- | --- |
| **1.1.1** Session tokens | Embedded auth | Green — `@shopify/shopify-app-react-router` |
| **1.1.4** Factual info | Listing/site claim Free-only while Upgrade charges | **Fixed in repo** — listing + Fly trust pages are Free + Pro; **do not** send reviewers to stale mcflyads.com Pages |
| **1.2.1–1.2.3** Shopify App Pricing | Off-platform billing / no plan change | Green in code — Managed Pricing URL + Manage plan for Pro; Partner must match |
| **2.1.1** No critical UI errors | Billing iframe brick | Green in code + live JS + unit guards |
| **2.2.3** App Bridge latest | CDN script on exit + app | Green |
| **2.2.4** GraphQL Admin | REST banned for new apps | Green pattern |
| **2.3.1** No shop-domain harvest | Public form | Green — `/auth/login` → `/` (Fly origin) |
| **3.1.1** TLS | Invalid cert | Green — Fly HTTPS |
| **3.2.1** `read_all_orders` | Unapproved scope | Green — TOML/Fly scopes `read_orders,read_customers` only |
| **GDPR** compliance webhooks | Missing / no HMAC | Green — toml + route; bad HMAC → non-200; spotcheck PASS |
| **4.5.x** Testing instructions | Vague / no password | Pack ready; **password HUMAN** |
| **Privacy URL** | 404 / mismatch | Use **https://mcfly-analytics.fly.dev/privacy** (mcflyads.com Pages still waitlist) |

---

## Automated tests (this run)

- `npm test` in `app/`: **434 passed**
- New: `billing-iframe-guard.test.ts` (adversarial 2.1.1 source + behavior guards)
- Pre-existing suite fail (unrelated): `api-query-range.test.ts` — `@mcfly/api-contract` resolve
- `bash scripts/mcfly-compliance-spotcheck.sh` → **PASSED**
- Live: `/health` ok+db; compliance POST without HMAC **400**; `/auth/login` **302** → mcflyads.com

---

## Still HUMAN (will reject again if skipped)

1. Partner → **App testing information** → Username/Password **empty**, check **“My app doesn't require an account to use it”**, paste the TEST ACCOUNT block from [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md)
2. Partner → Pricing → **Shopify App Pricing Free + Pro $39** (not Free-only)
3. Embedded Admin smoke on the review install: Spend → **Upgrade to Pro** → top-frame plan picker (no refused-to-connect) → approve → Settings → **Manage plan** → Free
4. SAMPLE desk **OFF** before judging live Total ROAS
5. Deploy updated `site/` to Cloudflare Pages so live `/pricing` `/support` match Free+Pro honesty
6. Confirm Partner app handle = `mcfly-analytics-public` (= `SHOPIFY_APP_HANDLE`)

---

## Do not re-litigate (already closed)

- Bare `redirect(adminUrl)` from `/app/billing`
- Same-frame `location.assign` for Admin hosts
- `read_all_orders` on Fly
- Shop-domain install form on marketing site
- Compliance topics missing from toml
