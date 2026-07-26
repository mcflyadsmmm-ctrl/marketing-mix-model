# Mcfly Ads & Analytics — Agent entrypoint

**Read in order before writing code:**

1. [`docs/MASTER_DIRECTIVE.md`](./docs/MASTER_DIRECTIVE.md) — how to deliver (loops, DoD, gates, lanes)
2. [`docs/CONTINUOUS_24_7.md`](./docs/CONTINUOUS_24_7.md) — always-on / swarm ticks
3. [`docs/MASTER_PLAN.md`](./docs/MASTER_PLAN.md) §0–§4 — product religion (wins on conflict)
4. [`docs/SHIP_CHECKLIST.md`](./docs/SHIP_CHECKLIST.md) — flip boxes only with evidence
5. [`docs/AGENTS.md`](./docs/AGENTS.md) — overnight / automation prompts
6. [`.cursor/skills/mcfly-shopify-compliance/SKILL.md`](./.cursor/skills/mcfly-shopify-compliance/SKILL.md) — App Store / GDPR / PCD before approval claims
7. **Cash MER desk UI:** [`docs/APPS_SCRIPT_CRAFT_SPEC.md`](./docs/APPS_SCRIPT_CRAFT_SPEC.md) + clasp source in `vendor/mer-apps-script/` (gitignored) — see [`docs/APPS_SCRIPT_ACCESS.md`](./docs/APPS_SCRIPT_ACCESS.md)
8. **App Store ship audit (anti-circle):** [`docs/MEGAPROMPT_SHIP_AUDIT.md`](./docs/MEGAPROMPT_SHIP_AUDIT.md) · competitive gaps [`docs/COMPETITIVE_APP_STORE_GAP_AUDIT.md`](./docs/COMPETITIVE_APP_STORE_GAP_AUDIT.md) · runbook [`docs/SUBMIT_NOW.md`](./docs/SUBMIT_NOW.md)
9. **Premium Shopify-native UX (craft, not TW parity):** [`docs/PREMIUM_NATIVE_UX_RESEARCH.md`](./docs/PREMIUM_NATIVE_UX_RESEARCH.md) · skill [`.cursor/skills/mcfly-premium-native-ux/SKILL.md`](./.cursor/skills/mcfly-premium-native-ux/SKILL.md)
10. **Install smoke / Billing later:** [`docs/INSTALL_SMOKE.md`](./docs/INSTALL_SMOKE.md) · [`docs/BILLING_TIERS.md`](./docs/BILLING_TIERS.md)
11. **Value thesis (cash desk, flat fee, why not TW):** [`docs/VALUE_THESIS.md`](./docs/VALUE_THESIS.md)

## Mission

Ship a **world-class marketing site** (mcflyads.com) and a **world-class Shopify cash desk** (cash MER + break-even + allocation). Companies succeed when they get a trusted MER in **&lt;10 minutes** and use the Monday ritual weekly. Ambition: **incredible vs any alternative** on craft — zero shortcuts.

## 24/7

- Chat sprint loop while this session is alive (**frontier specialists**, Auto orchestrates)
- **True 24/7** = Cursor Automation (hourly cloud agent) — see CONTINUOUS_24_7.md
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
