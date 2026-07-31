# Mcfly Enterprise Redesign — operating brief

**Status:** ACTIVE (6–8 weeks)  
**Trunk:** `redesign/enterprise-desk`  
**Spec:** [`docs/superpowers/specs/2026-07-26-enterprise-redesign-design.md`](./superpowers/specs/2026-07-26-enterprise-redesign-design.md)  
**Cursor playbook:** [`docs/CURSOR_REDESIGN_PLAYBOOK.md`](./CURSOR_REDESIGN_PLAYBOOK.md)

## North star

Trusted cash MER (Shopify sales ÷ ad spend) in &lt;10 minutes, used weekly, ending in an allocation action. World-class Admin craft. Flat-fee honesty. No pixels / MTA / TW clones.

## Modes

| Mode | Behavior |
| --- | --- |
| Redesign (now) | App lane P0; site mega-ticks paused; Grok-default specialists; no auto Fly deploy |
| Steady-state (after) | Resume site/app balance per CONTINUOUS_24_7 |

## Weekly slices

1. **W0** — Trunk, guardrails, PR CI, playbook  
2. **W1–2** — Cash MER viewport diet, margin confirm, Goals CSB, empty states, CSS/route split  
3. **W3–5** — Period honesty, SalesDayFact, webhooks+queue, facts-first desk, API shop hint, spend unique  
4. **W6–8** — Sentry/SLOs, Playwright, Explorer/Goals polish, load-test matrix, App Store self-review  

## Success KPIs

| KPI | Target |
| --- | --- |
| Time to trusted MER | ≤8–10 min median |
| Desk loader p95 (facts) | &lt;2–3s |
| Shopify GraphQL on desk nav | Off hot path |
| `app._index` LOC | ≤400 (progressive) |
| PR CI | green on redesign PRs |

## Refuse

Pixels, MTA, connector zoo, BigQuery-until-pain, GMV-tax billing, `read_all_orders` without Partner approval.
