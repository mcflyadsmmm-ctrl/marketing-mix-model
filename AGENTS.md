# Mcfly Ads & Analytics — Agent entrypoint

**Read in order before writing code:**

1. [`docs/MASTER_DIRECTIVE.md`](./docs/MASTER_DIRECTIVE.md) — how to deliver (loops, DoD, gates, lanes)
2. [`docs/CONTINUOUS_24_7.md`](./docs/CONTINUOUS_24_7.md) — always-on / swarm ticks
3. [`docs/MASTER_PLAN.md`](./docs/MASTER_PLAN.md) §0–§4 — product religion (wins on conflict)
4. [`docs/SHIP_CHECKLIST.md`](./docs/SHIP_CHECKLIST.md) — flip boxes only with evidence
5. [`docs/AGENTS.md`](./docs/AGENTS.md) — overnight / automation prompts
6. [`.cursor/skills/mcfly-shopify-compliance/SKILL.md`](./.cursor/skills/mcfly-shopify-compliance/SKILL.md) — App Store / GDPR / PCD before approval claims  
6b. [`docs/PCD_AND_LTV.md`](./docs/PCD_AND_LTV.md) — Level 1 vs 2, till LTV without Level 2, post-launch expansion
6c. [`docs/RETIRED_SURFACES.md`](./docs/RETIRED_SURFACES.md) — Monday Close UI + Meta/Google spend OAuth **out of product**
7. **Total ROAS desk UI:** [`docs/APPS_SCRIPT_CRAFT_SPEC.md`](./docs/APPS_SCRIPT_CRAFT_SPEC.md) + clasp source in `vendor/mer-apps-script/` (gitignored) — see [`docs/APPS_SCRIPT_ACCESS.md`](./docs/APPS_SCRIPT_ACCESS.md)
8. **App Store ship audit (anti-circle):** [`docs/MEGAPROMPT_SHIP_AUDIT.md`](./docs/MEGAPROMPT_SHIP_AUDIT.md) · competitive gaps [`docs/COMPETITIVE_APP_STORE_GAP_AUDIT.md`](./docs/COMPETITIVE_APP_STORE_GAP_AUDIT.md) · runbook [`docs/SUBMIT_NOW.md`](./docs/SUBMIT_NOW.md)
9. **Premium Shopify-native UX (craft, not TW parity):** [`docs/PREMIUM_NATIVE_UX_RESEARCH.md`](./docs/PREMIUM_NATIVE_UX_RESEARCH.md) · skill [`.cursor/skills/mcfly-premium-native-ux/SKILL.md`](./.cursor/skills/mcfly-premium-native-ux/SKILL.md)
10. **Install smoke / Billing later:** [`docs/INSTALL_SMOKE.md`](./docs/INSTALL_SMOKE.md) · [`docs/BILLING_TIERS.md`](./docs/BILLING_TIERS.md)
11. **Value thesis (cash desk, flat fee, why not TW):** [`docs/VALUE_THESIS.md`](./docs/VALUE_THESIS.md)
12. **Voice / copy SoT (MDS):** [`docs/MDS_RESEARCH_ABSORB.md`](./docs/MDS_RESEARCH_ABSORB.md)
13. **Category domination megaprompt:** [`docs/CATEGORY_DOMINATION_MEGAPROMPT.md`](./docs/CATEGORY_DOMINATION_MEGAPROMPT.md) · partner smoke [`docs/DESIGN_PARTNER_SMOKE.md`](./docs/DESIGN_PARTNER_SMOKE.md)
14. **Pipe automation wedge:** [`docs/PIPE_AUTOMATION_WEDGE.md`](./docs/PIPE_AUTOMATION_WEDGE.md) — Free CSV; SyncWith-class paid by merchant; Mcfly pulls Sheet
15. **Fresh-chat fleet (ship today):** [`docs/AGENT_FLEET_TODAY.md`](./docs/AGENT_FLEET_TODAY.md) — parallel Agent chats + paste prompts; don’t continue mega-threads  
15b. **Enterprise frontier fleet OS:** [`docs/ops/FLEET_ENTERPRISE.md`](./docs/ops/FLEET_ENTERPRISE.md) · [`docs/ops/fleet/`](./docs/ops/fleet/) — failure audit, queues, Automations setup  
16. **Conductor · frontier / enterprise scale:** [`docs/CONDUCTOR_FRONTIER.md`](./docs/CONDUCTOR_FRONTIER.md)
17. **Full ship build plan + cost analysis:** [`docs/SHIP_BUILD_PLAN.md`](./docs/SHIP_BUILD_PLAN.md)
18. **SEO + AI GEO (dual pillar, agent-run):** [`docs/SEO_AI_GEO_RUNBOOK.md`](./docs/SEO_AI_GEO_RUNBOOK.md) — product desk + Custom Data Solutions; fleet pastes in §9
19. **Research absorb (MMM/pixels/agentic — steal vs refuse):** [`docs/RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md`](./docs/RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md)
20. **Research absorb (Shopify App Store failure vectors):** [`docs/RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md`](./docs/RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md)
21. **90-day Major Improvement Plan (agent SoT):** [`docs/MAJOR_IMPROVEMENT_PLAN.md`](./docs/MAJOR_IMPROVEMENT_PLAN.md) — Wave 1 submit → Wave 2 organic → Wave 3 desk → Wave 4 commercial
22. **Competitive landscape absorb (not a roadmap):** [`docs/RESEARCH_ABSORB_COMPETITIVE_LANDSCAPE.md`](./docs/RESEARCH_ABSORB_COMPETITIVE_LANDSCAPE.md)

## Mission

Ship a **world-class marketing site** (mcflyads.com) and a **world-class Shopify cash desk** (Total ROAS + break-even + allocation). Companies succeed when they get a trusted Total ROAS in **&lt;10 minutes** and use the Monday ritual weekly. Ambition: **incredible vs any alternative** on craft — zero shortcuts.

## 24/7

- Chat sprint loop while this session is alive (**frontier specialists**, Auto orchestrates)
- **True 24/7** = Cursor Automation (hourly cloud agent) — see CONTINUOUS_24_7.md · enterprise pastes [`docs/ops/fleet/AUTOMATIONS_SETUP.md`](./docs/ops/fleet/AUTOMATIONS_SETUP.md) · legacy [`docs/ops/APP_HOURLY_AUTOMATION.md`](./docs/ops/APP_HOURLY_AUTOMATION.md)
- **Standing deploy grant** (until revoke): [`docs/ops/STANDING_DEPLOY_GRANT.md`](./docs/ops/STANDING_DEPLOY_GRANT.md) — **never ask** to update Fly; after ship-gate, push and `fly deploy` the best live desk the same turn. Never Partner Submit.
- Overnight map: [`docs/ops/OVERNIGHT_MEANINGFUL_20260729.md`](./docs/ops/OVERNIGHT_MEANINGFUL_20260729.md)
- Each tick: orient → parallel specialists with **explicit frontier models** (Fable/Opus/Sonnet/Grok) → ship-gate → report
- See `.cursor/rules/50-subagent-models.mdc` — quality over cheap Auto for craft

## Refuse always

Pixels, MTA, path credit, view-through, “true ROAS,” Triple Whale / Northbeam feature parity, SyncWith connector zoo, App URL = marketing site domain.

## Before claiming done / approval-ready

```bash
bash scripts/agent-ship-gate.sh
bash scripts/mcfly-compliance-spotcheck.sh
```

## Human gates (stop and hand off)

Partner MFA, host billing cards, Meta/Google App Review, DNS, App Store submit, design-partner store access.
