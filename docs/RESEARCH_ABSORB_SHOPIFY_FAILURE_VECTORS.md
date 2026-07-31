# Research absorb — Early-stage Shopify app failure vectors

**Status:** LOCKED absorb · 2026-07-29  
**Input:** Founder deep research — *Comprehensive Analysis of Failure Vectors in Early-Stage Shopify Applications*  
**Product SoT:** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4  
**Companions:** [`RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md`](./RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md) · [`BFS_WORLD_CLASS.md`](./BFS_WORLD_CLASS.md) · [`.cursor/skills/mcfly-shopify-compliance/SKILL.md`](../.cursor/skills/mcfly-shopify-compliance/SKILL.md) · [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md) · [`UNINSTALL_RISKS.md`](./UNINSTALL_RISKS.md) · [`VIBE_CODING_AUDIT_ABSORB.md`](./VIBE_CODING_AUDIT_ABSORB.md)

---

## 0. Verdict for Mcfly

This paper is **high-signal for App Store survival** (GDPR webhooks, Polaris/UX, GraphQL economics, webhook storms, Billing, ASO, churn). It is **not** a brief to add storefront pixels, checkout scraping, or path analytics.

Mcfly is an **Admin-embedded cash desk**, not a storefront script injector. Apply every failure vector that hits **Admin apps + webhooks + GraphQL + listing**; **translate or refuse** storefront/CWV/pixel/checkout-extension advice that assumes we own the buyer journey.

---

## 1. Failure vector → Mcfly status

| Vector (research) | Mcfly stance | Status / next |
| --- | --- | --- |
| Skip discovery / feature-list SOW | Religion locked: Monday cash close persona = marketing operator / founder | **OK** — do not reopen MMM/pixel scope |
| Launch perfect vs MVP + feedback | Free CSV desk → OAuth → Billing; design partners | **OK** — keep iterative; don’t boil-the-ocean |
| **GDPR webhooks** missing / assume “no PII = skip” | Mandatory always; 200 ACK | **SHIPPED** `webhooks.compliance.tsx` — never regress; privacy policy must match |
| Polaris / native feel | Polaris-only Admin | **Ongoing craft** — Apps Script scorecard |
| Contextual Save Bar missing | Use CSB on settings mutations | **AUDIT** settings/goals/spend forms before submit |
| Red for primary CTAs | Red = destructive only | **AUDIT** listing + app CTAs |
| Mobile Admin friction | Polaris responsive | **AUDIT** Close/Spend on narrow viewport |
| Unsolicited modals / promo overlays | Banned | **OK religion** — no upgrade guilt timers |
| Dark patterns / fake Shopify AI purple | Banned | **OK** — refuse |
| Theme JS ghost code on uninstall | Prefer Theme App Extensions if any storefront surface | **LOW risk** — Mcfly is Admin-first; **no raw theme inject**; if any embed needed later → App Embed only |
| Vague App Store test instructions | Reviewer as cold user | **HUMAN_GATE** — paste pack in listing docs must be step-by-step + SAMPLE data |
| REST-first / ignore GraphQL cost | GraphQL Admin only | **Harden** cost + `THROTTLED` + sized `first` |
| Pagination instead of Bulk for history | Bulk for large order history | **Harden** sales sync path |
| Webhook storms / sync processing | ACK &lt;5s → queue → workers; idempotent | **SHIPPED pattern** orders + job queue ([`ops/JOB_QUEUE.md`](./ops/JOB_QUEUE.md)); keep compliance/uninstall fast |
| Duplicate webhooks | Idempotent by `X-Shopify-Webhook-Id` | **SHIPPED** delivery keys — extend everywhere |
| Serverless DB connection storms | Prefer Fly + pooled Postgres | **OK** — Fly hosting; avoid Vercel-style fan-out for webhooks |
| Storefront CWV / −10 Lighthouse | Applies if we inject storefront assets | **Mostly N/A** — don’t add storefront JS; Admin vitals for BFS later |
| Checkout.liquid / Scripts / pixels for analytics | Research says migrate to Checkout Extensibility + Web Pixels | **REFUSE product** — we don’t modify checkout or ship pixels |
| External Billing (Stripe) while listed | Ban → Partner death | **OK** — Shopify Billing only when `MCFLY_BILLING` |
| Lifetime $1M Partner revenue share | Model 85% post-threshold | **Finance note** — not engineering P0 |
| Hybrid usage meters / capped amounts | Complex; prefer flat ~$79 | **Prefer flat** — matches value thesis |
| ASO: title keywords, install velocity | Listing name locked Mcfly Analytics; organic site + velocity | **HUMAN** listing + reviews; site SEO already |
| App Store Ads CAC | Can be ruinous | **Prefer organic** (SEO/GEO + outreach) over paid App ads early |
| Review extortion | Don’t pay; public reply + Partner Violation | **Runbook** — document when it happens |
| Churn / invisible ROI | Uninstall feedback; surface Monday value | **Product** — Close memo, SAMPLE OFF, TTFV &lt;10m |

---

## 2. Steal (engineering / ops)

1. **Never** claim compliance webhooks optional without PII — Mcfly already implements; keep HMAC + 200.  
2. **Deterministic GraphQL backoff** from `extensions.cost` (not jitter-only).  
3. **Bulk Operations** for historical order/sales import.  
4. **Webhook = ACK then queue**; workers do DB/API; idempotent delivery keys.  
5. **CSB + Polaris + no dark patterns** before Distribution submit.  
6. **Reviewer test script** with SAMPLE spend + margin path written like a cold merchant.  
7. **ASO + organic velocity** over App Store Ads until retention proven.  
8. **Uninstall hygiene** for any future Theme App Extension; Admin session purge on uninstall/redact already.

---

## 3. Refuse / do not misapply

| Research push | Why refuse for Mcfly |
| --- | --- |
| Web Pixels as “analytics apps must” | Religion — cash desk uses Admin sales + spend, not buyer telemetry |
| Checkout UI Extensions for attribution | Out of category; abandonment risk; not our job |
| Storefront script performance as P0 for our badge | We shouldn’t inject storefront bundles |
| Feature sprawl to “feel complete” before MVP | Scope creep Valley of Death — religion prevents this |

---

## 4. Pre-submit scorecard (agents + founder)

Flip only with evidence:

### AGENT_FIX / AUDIT

- [ ] Compliance topics registered in Partner + return 200 for all three + uninstall path documented  
- [x] Settings surfaces that mutate: Contextual Save Bar where Polaris requires — evidence `docs/ops/W1_UX_CSB_20260729.md` (2026-07-29)  
- [x] No red primary CTAs; no blocking upgrade modals — evidence same ops log  
- [ ] GraphQL helpers: `THROTTLED` + cost wait; bulk for large history  
- [ ] All webhooks: &lt;5s ACK path; idempotency  
- [ ] Privacy / PCD copy matches Level 1 reality  

### HUMAN_GATE

- [ ] App Store testing instructions cold-path complete ([`SUBMIT_NOW.md`](./SUBMIT_NOW.md) / listing paste)  
- [ ] Distribution / review submit  
- [ ] Billing announce before charges  
- [ ] Extortion / review response if attacked  
- [ ] Read uninstall feedback weekly once live  

---

## 5. Commercial survival (aligned with Mcfly)

| Research | Mcfly |
| --- | --- |
| Valley of Death = no installs + high CAC | Organic site + calculators + App Store Free; Custom cash; no App Ads addiction |
| Ranking loves velocity + retention | Ship habit (Monday Close) so uninstalls stay low |
| Visible ROI or churn | Desk must show sales ÷ spend vs BE every open — not background theater |

---

*Cite this file when agents propose “we must add pixels/checkout extensions for App Store survival.” Survival = compliance + Polaris + GraphQL + webhooks — not path attribution.*
