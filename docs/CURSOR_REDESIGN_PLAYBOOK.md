# Cursor Redesign Playbook — Mcfly 6–8 weeks

**Models:** Grok 4.5 (`cursor-grok-4.5-high-fast`) default. Claude/GPT opportunistic.  
**Religion:** cash MER = sales ÷ spend; refuse pixels/MTA/TW clones.

## Daily tick (45–90 min)

```text
1. Orient — curl health; git status; next item in docs/ENTERPRISE_REDESIGN.md
2. Spawn — Grok implementer (ONE file owner) ∥ Grok critic
3. Skills — mcfly-premium-native-ux + shopify-polaris-app-home (chrome) /
            mcfly-apps-script-craft (scoreboard only) /
            mcfly-shopify-compliance (scopes/webhooks)
4. Design Mode — Admin iframe when UX changes
5. Gate — npm test / typecheck; bash scripts/agent-ship-gate.sh
6. Report — shipped / blocked human / next
7. NO site Generator swarm; NO fly deploy unless founder asks
```

## Topology

| Role | Model |
| --- | --- |
| Parent | Auto / Composer |
| Implementer | Grok 4.5 |
| Critic | Grok 4.5 |
| Hard architecture | Grok; GPT Sol if quota allows |

## Skills map

| Skill | When |
| --- | --- |
| `mcfly-premium-native-ux` | Default redesign ticket |
| `shopify-polaris-app-home` | `s-*` chrome, empty, Settings |
| `shopify-dev` | App Bridge / design docs |
| `shopify-admin` | Admin GraphQL |
| `shopify-use-shopify-cli` | validate / deploy / store execute |
| `shopify-app-store-review` | Weeks 4 / 6 / 8 milestones |
| `mcfly-shopify-compliance` | PCD / webhooks / listing |
| `mcfly-apps-script-craft` | Cash MER / Allocation scoreboard only |

## MCP / connectors (dev tooling)

| Connector | Status |
| --- | --- |
| Shopify Dev MCP | Required (app workspace) |
| GitHub | Required for PR review / CI |
| Cursor Browser | Required for Admin Design Mode |
| Sentry | Optional → required once prod traffic |
| Fly CLI | Deploy only when asked |
| Unrelated user MCPs (trading, etc.) | Disable for this project |

## Branch / PR

- Trunk: `redesign/enterprise-desk`
- Short PRs: `redesign/<lane>-<ticket>` → trunk → main
- PR CI: `.github/workflows/pr-ci.yml` (test + typecheck + build, `SKIP_HEALTH=1`)

## Chat opener (paste)

```text
Follow mcfly-premium-native-ux + religion. Grok-default specialists.
Redesign mode: app lane only; no site ticks; no Fly deploy unless I ask.
Next item from docs/ENTERPRISE_REDESIGN.md.
```
