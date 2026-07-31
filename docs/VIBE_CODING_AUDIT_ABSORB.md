# Research absorb — Vibe-coding / AI Shopify analytics failure audit

**Status:** LOCKED absorb · 2026-07-30  
**Input:** Founder paste — *Architectural, Security, and Compliance Vulnerabilities in AI-Generated Shopify Analytics Applications*  
**Product SoT:** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4  
**Companions:** [`RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md`](./RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md) · [`UNINSTALL_RISKS.md`](./UNINSTALL_RISKS.md) · [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · [`MEGAPROMPT_VIBE_CODING_BUGBOT.md`](./MEGAPROMPT_VIBE_CODING_BUGBOT.md)

---

## 0. Verdict for Mcfly

That audit describes a **storefront pixel / event-lake / agentic marketing OS**. Mcfly is an **Admin cash desk** (Shopify sales ÷ ad spend). Most catastrophic vectors are **refused by religion** or **already protected** by the Shopify app template + our compliance spine.

**We are not “safe because AI wrote it.”** We are safer because scope excludes the failure modes LLMs invent for analytics apps — then we still have **two real engineering debts** before charging at scale: GraphQL **Bulk** for deep history, and live **Billing API** wiring.

---

## 1. Vector → Mcfly status

| Audit vector | Status | Why |
| --- | --- | --- |
| In-app LLM insights / prompt injection / XSS from LLM HTML / excessive agency / system prompt leak | **PROTECTED** | No product LLM agent; desk coach is rules/banners only. **Never** feed merchant data to a model for training (PPA). |
| PPA ban: training AI on Merchant/Customer Data | **PROTECTED (policy)** | Religion + docs refuse; no external LLM on shop facts. Re-open only with written consent + opt-out retention — prefer never. |
| Cookie auth / ITP / infinite OAuth in iframe | **PROTECTED** | Official `@shopify/shopify-app-react-router` + App Bridge session tokens; offline tokens for workers (`shopify.server.ts`, `authenticate.admin`). |
| Session token used as Admin API token (LLM mix-up) | **PROTECTED** | Offline session via `unauthenticated.admin` for jobs; session JWT only authenticates embedded requests. |
| ScriptTag / theme liquid inject / DOM scrape | **REFUSE_N_A** | No storefront inject. Uninstall leaves no theme ghosts. |
| Web Pixels + Customer Privacy API + CAPI dedupe | **REFUSE_N_A** | Not our product. Adding pixels would *create* the audit’s risks. |
| Postgres for clickstream OLAP / need ClickHouse | **REFUSE_N_A** (event lake) · **PROTECTED** (our job) | Serving layer is daily `SalesDayFact` / `SpendEntry` / bounded `OrderFact` — not a pixel lake. Columnar later only if evidence demands. |
| GraphQL leaky bucket / THROTTLED / nested `first:100` | **PARTIAL** | Cost + THROTTLED retry shipped (`shopify-graphql-cost.server.ts`); desk HARD-STOPS live crawl. **Gap:** Bulk Operations for multi-year history. |
| Billing REST hallucination / Stripe while listed | **PARTIAL** | Billing flag OFF; no Stripe. Stub entitlements only. **Gap:** GraphQL Billing + `test: true` + subscription webhooks before charges. |
| Usage charge without idempotencyKey | **N_A until Billing** | Prefer flat Pro $39 — avoid usage meters unless founder locks otherwise. |
| GDPR webhooks missing (“we store no PII”) | **PROTECTED** | All three compliance topics + HMAC (`webhooks.compliance.tsx`); uninstall purge (`webhooks.app.uninstalled.tsx`). |
| PCD Level 2 without approval / plaintext email | **PROTECTED** | Level 1 only; opaque customer id + amounts/dates; no name/email/phone/address queries. |
| HMAC skip / first-shop API fallback | **PROTECTED** | `authenticate.webhook` everywhere; `api-auth.server.ts` requires shop hint. |
| Unsolicited modals / dark patterns / red primary upsell | **PROTECTED (UX religion)** | Soft Pro teaser after first spend; ritual nav demotes Goals/LTV until cash-ready. |

---

## 2. Steal from the audit (keep doing)

1. Never add an autonomous spend/campaign agent.  
2. Never inject storefront scripts “for analytics completeness.”  
3. Keep facts-first Postgres; don’t build a clickstream warehouse for Total ROAS.  
4. Finish **Bulk Operations** for deep order history under `read_all_orders`.  
5. Wire Billing only with `test: true` in review, subscription update webhooks, flat fee.  
6. Run [`MEGAPROMPT_VIBE_CODING_BUGBOT.md`](./MEGAPROMPT_VIBE_CODING_BUGBOT.md) before “ready to charge.”  
7. Ship-gate + compliance spotcheck before approval claims.

---

## 3. Refuse / do not “fix” by adopting the audit’s product

| Audit recommendation | Mcfly action |
| --- | --- |
| Implement Web Pixels + CAPI | **Refuse** — category death / religion |
| ClickHouse as default | **Refuse** until scale evidence on daily facts |
| LLM report generator on customer telemetry | **Refuse** — PPA + XSS + injection surface |
| Autonomous Meta bid agent | **Refuse** — excessive agency |

---

## 4. Residual risks (honest)

| Risk | Severity | Owner |
| --- | --- | --- |
| Deep history without Bulk (timeouts / throttle) | P1 scale | Agent — Bulk backfill |
| Billing API not live | P0 before charges | Agent scaffold + **HUMAN** Partner |
| `samplePreviewAllowed` migration must deploy with DataModeBar | P0 deploy | Fly migrate on boot |
| Partner MFA / PCD request / Distribution | Critical submit | **HUMAN** |
| Staff Session email fields in Prisma template | Low (not customer L2) | Keep privacy honest; don’t expand |

---

## 5. One-line answer

**Yes — we are protected against most of that audit because we refused to build the app it describes.** Remaining vibe-code debt is **Bulk history + Billing wiring + human Partner gates**, not pixels, cookies, or ClickHouse.
