# Capability map — Mcfly Analytics (R0)

**Date:** 2026-09-09 · **Tree:** `mcfly-analytics` · `redesign/enterprise-desk`  
**Fly at map time:** v200 (Wave 7B target Total ROAS). Wave 7C period ledger **landing dirty** (not Fly yet).  
**Religion:** Total ROAS = Shopify Total Sales (after returns) ÷ entered ad spend. No pixels / MTA.  
**Reviews:** 0 (do not invent). **Listing:** https://apps.shopify.com/mcfly-analytics-public · plan **Mcfly Analytics** · $39 / 7-day trial.

---

## Verdict

**Not a stub — a full Monday cash desk with honesty debt.**  
Core ritual (margin → spend → trusted Total ROAS → break-even / target / allocation / share / export) is implemented. Love risk is **activation friction + honesty leaks + distribution**, not missing “another TW tile.”

Evidence:

- Strong: Overview Total ROAS + period trust, Spend SoT (CSV/paste/one-row), Settings margin + optional target, Goals pace, Allocation, aMER glance, SAMPLE bar, Share Overview mailto, billing $39 path, deep-history honesty.
- Partial: LTV/Advanced depth after facts window, ReviewAsk flywheel, Spend Explorer target still uses numeric default when unconfirmed (7B caveat).
- Weak / Dead: Connections OAuth (retired → Spend), Monday Close UI (retired → Overview), cold Overview sometimes bounced to Spend.
- Shipping: period ledger CSV (7C) — code in tree; verify tests + Fly before claiming live.

---

## Trust grade legend

| Grade | Meaning |
| --- | --- |
| **Strong** | Merchant job works live with clear honesty |
| **Partial** | Works with caveats / thin data / craft debt |
| **Weak** | Easy to misread or miss value |
| **Dead** | Retired or should not be sold |

---

## Merchant surfaces

| Surface | Route | Merchant job | Inputs | Honesty gates | SAMPLE vs live | Trust |
| --- | --- | --- | --- | --- | --- | --- |
| Shell | `app.tsx` | Nav + Sample\|Real mode | Shop session | DataModeBar | SAMPLE stamped | Strong |
| Overview | `app._index.tsx` | Trusted Total ROAS hero, explorer, aMER, share, review ask | Period, spend+sales facts, settings | `resolvePeriodTrust`, fact window, ReviewAsk gates | SAMPLE preview book | Strong / Partial (cold bounce) |
| Spend | `app.spend.tsx` | Enter/import spend; coverage | CSV/paste/typed day | SAMPLE excluded from live coverage (hostile residual risk) | SAMPLE practice rows | Strong / Partial |
| Spend templates | `app.spend.template.tsx` | Download CSV shapes | None | n/a | Same templates | Strong |
| Settings | `app.settings.tsx` | Margin, optional target Total ROAS, sales basis, deep history CTA | Margin %, target, confirm timestamps | Margin confirmed; target only when `targetMerConfirmedAt` | SAMPLE locked target | Strong |
| Goals | `app.goals.tsx` | Full-year sales goals + pace | Goals + target | Confirmed target on save | SAMPLE board | Strong |
| Allocation | `app.allocation.tsx` | Channel mix $/% over windows | Spend entries | Co-occurrence hedge copy | SAMPLE mix | Strong |
| LTV | `app.ltv.tsx` | Cash CAC / cohort LTV next to spend | Order facts / deep history | 60-day honesty without `read_all_orders` | SAMPLE LTV | Partial |
| Advanced | `app.advanced.tsx` | Post-trust aMER depth | Trusted ROAS first | Average≠causal | SAMPLE | Partial |
| Demo / SAMPLE admin | `app.demo.tsx` | Seed/inspect SAMPLE | Admin | Must not mutate live | SAMPLE only | Partial (CTA confusion risk) |
| Data mode | `app.data-mode.tsx` | Toggle Sample\|Real | POST | Mode bar | Switch | Strong |
| Billing | `app.billing.tsx` | Start $39 subscription | Shopify billing | Trial path | Live only | Strong |
| Period ledger CSV | `app.period-ledger[.]csv.tsx` | Closed-day analysis CSV | Period preset | Fail-closed SAMPLE + incomplete | Block SAMPLE | Strong (pending Fly) |
| Connections | `app.connections.tsx` | — | — | Retired | Redirect → Spend | **Dead** |
| Close | `app.close.tsx` | — | — | Retired | Redirect → Overview | **Dead** |

### Public / trust pages (Fly)

`pricing` · `faq` · `support` · `privacy` · `terms` · bare `_index` (shop redirect). Site marketing SoT remains **mcflyads.com** (Pages), not App URL.

### APIs / ops

| Route | Job | Trust |
| --- | --- | --- |
| `v1.mer` / `v1.spend` / `v1.allocation` | Programmatic MER/spend/allocation | Partial (power users / scripts) |
| `webhooks.orders` + compliance / uninstall / scopes / subscriptions | Sales facts + lifecycle | Strong |
| `health` | DB probe | Strong |
| `api.jobs.tick` | Worker tick | Ops |

---

## Math glossary (merchant nouns)

| Noun | Definition (desk) |
| --- | --- |
| **Total ROAS** | Shopify Total Sales after returns ÷ spend merchant entered, same period |
| **Break-even Total ROAS** | ≈ 1 ÷ confirmed contribution margin |
| **aMER** | New-customer sales ÷ spend (average, not causal) |
| **Target Total ROAS** | Optional operator goal; Overview rail only when confirmed (SAMPLE always configured) |
| **Period trust** | Closed-day sales+spend complete enough to allow above/below target language |
| **Deep history** | Without `read_all_orders`, honest ~60-day fact window |

SoT: `app/app/lib/product-labels.ts`, `docs/MASTER_PLAN.md`.

---

## Hidden power (undersold)

1. **One-row typed spend** — cold path without full CSV.
2. **Share Overview mailto** — merchant-owned email of cards (Mcfly does not send).
3. **Period ledger CSV** (7C) — SalesDayFact-only sales; SAMPLE fail-closed.
4. **Allocation history** — quarters / pie / rolling 7/14/28.
5. **v1 APIs** — scriptable Total ROAS / spend without Domo.
6. **Optional target + closed-day copy** — Wave 7B.
7. **Acquisition glance** — aMER + N/R (Wave 7A).

---

## Dead weight / confusion

| Item | Why it hurts love |
| --- | --- |
| SAMPLE primary CTA → `/app/demo` | Feels like toy admin, not “use real” |
| Cold Overview → Spend bounce | Merchant never sees empty Overview honesty |
| Spend Explorer target from unconfirmed `targetMer` default | Fake “Target 3.00×” without Settings confirm |
| Connections / Close redirects | Docs/history may still mention retired surfaces |
| ReviewAsk App Bridge one-shot miss | Review flywheel silent fail (reviews stay 0) |

---

## Listing parity (2026-09-09 live check)

| Listing promise | Desk delivery |
| --- | --- |
| Plan name **Mcfly Analytics** @ $39 + 7-day | Billing path matches; Partner Save done |
| Feature bullets: Total ROAS, break-even, CSV, Allocation+Goals, LTV/mailto | Delivered on desk (LTV Partial without deep history) |
| “Not Ads Manager ROAS” | Product labels + Overview copy |
| Reviews | **0** — ReviewAsk must not invent |

---

## Capability scorecard (founder one-glance)

| Domain | Grade |
| --- | --- |
| Cash close (Total ROAS) | Strong |
| Spend entry craft | Strong / Partial (CSV tax) |
| Break-even / target | Strong |
| Allocation / Goals | Strong |
| LTV / Advanced | Partial |
| Export / share | Strong (export pending Fly) |
| Connectors / pixels | Dead by design (correct) |
| Activation / reviews | Weak (distribution + ReviewAsk) |

**Bottom line:** Skeleton metaphor under-sells the desk. Treat product as **craft + honesty + first-10-min + outbound**, not “build more suite tiles.”
