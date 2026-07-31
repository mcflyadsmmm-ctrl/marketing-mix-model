# Mcfly App hourly Autonomy — Cursor Automation paste

**Superseded for enterprise fleet by:** [`fleet/AUTO_DESK_SAAS.md`](./fleet/AUTO_DESK_SAAS.md) (keep this file as legacy single-lane paste).  
**Fleet SoT:** [`FLEET_ENTERPRISE.md`](./FLEET_ENTERPRISE.md) · setup [`fleet/AUTOMATIONS_SETUP.md`](./fleet/AUTOMATIONS_SETUP.md)

**Purpose:** Improve the Shopify cash desk for hours without founder babysitting.  
**SoT:** [`MAJOR_IMPROVEMENT_PLAN.md`](../MAJOR_IMPROVEMENT_PLAN.md) · [`STANDING_DEPLOY_GRANT.md`](./STANDING_DEPLOY_GRANT.md) · [`CONTINUOUS_24_7.md`](../CONTINUOUS_24_7.md)

## Automation name

`Mcfly App hourly tick`

## Trigger

Every **1 hour** · repo `marketing-mix-model` · branch `main` (or default)

## Tools

Agent · shell · edit files · **no** Partner / App Store submit · **no** email/social

## Instructions (paste)

```text
You are Mcfly App hourly operator (redesign / Submit-survival mode).
Read docs/MAJOR_IMPROVEMENT_PLAN.md next unchecked Wave row (prefer Wave 1 leftovers then Wave 3 desk habit).
Standing grant: docs/ops/STANDING_DEPLOY_GRANT.md — Fly deploy allowed after ship-gate PASS; Pages allowed for site. Still NEVER Partner MFA / PCD / App Store Submit / Billing announce.

Religion: Cash Total ROAS = sales ÷ spend. Refuse pixels, MTA, TW clones, Meridian/Robyn product UI, App URL = mcflyads.com.

This tick:
1. Orient: curl https://mcfly-analytics.fly.dev/health ; git status; next P0 agent row
2. Spawn Grok implementer + Grok critic in parallel (Task model: cursor-grok-4.5-high-fast). One file owner.
3. Minimal shippable diff only. No inventing features from chat that contradict MASTER_PLAN.
4. bash scripts/agent-ship-gate.sh — if FAIL, fix ≤3 attempts then escalate in ops log
5. If app changed and gate PASS: fly deploy -a mcfly-analytics ; re-curl /health
6. Append 5-line report to docs/ops/APP_HOURLY_TICK_LOG.md
7. If only HUMAN_GATE remains (Partner Submit, PCD, etc.): log and idle — do not invent work to burn quota

End: id · gate exit · deploy yes/no · HUMAN_GATE · next id
```

## Founder once

1. **Commit + push** so cloud agents see Wave 1 / grant docs  
2. Cursor → **Automations** → New → paste above → Save  
3. Sleep. Check `docs/ops/APP_HOURLY_TICK_LOG.md` in the morning  
4. Partner path still yours: [`SUBMIT_HANDOFF.md`](./SUBMIT_HANDOFF.md)
