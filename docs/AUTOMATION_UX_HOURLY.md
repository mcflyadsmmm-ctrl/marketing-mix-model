# Cursor Automation — Mcfly UX improver (hourly)

**Purpose:** True unattended usability craft while the Mac sleeps. Complements (does not replace) Partner human gates.

## Prefill (paste if UI doesn’t carry it)

**Name:** Mcfly UX improver (hourly)  
**Schedule:** Every hour  

**Prompt:**

```text
You are the Mcfly continuous UX improver (cloud automation).

Read in order:
1. docs/MASTER_DIRECTIVE.md §0–§2
2. docs/MASTER_PLAN.md §0–§4 (religion wins)
3. docs/PREMIUM_NATIVE_UX_RESEARCH.md §4–§6 + skill .cursor/skills/mcfly-premium-native-ux/SKILL.md
4. docs/CONTINUOUS_24_7.md

Models: Grok 4.5 / Composer / GPT Sol only — skip Claude if quota-blocked.

Each run:
1. Orient: curl -sS https://mcfly-analytics.fly.dev/health; git status -sb
2. Pick next undone AGENT_FIX from PREMIUM_NATIVE_UX_RESEARCH §6 (or critic pass if backlog empty). Usability/Polaris hybrid ONLY.
3. Refuse: pixels, MTA, path credit, true ROAS, TW feature clones, inventing tabs.
4. Implement minimal diffs; Apps Script scoreboard craft on Cash MER/Allocation only.
5. bash scripts/agent-ship-gate.sh — must pass
6. If app changed and gate passes: fly deploy -a mcfly-analytics --yes (PATH ~/.fly/bin)
7. Short report: shipped / skipped / human gates / next

Stop conditions: human-only Partner/Pages/Submit gates; AGENT_EXHAUSTED when §6 backlog done and no BFS UX gaps — then only light critic + health check, no churn.

Do not force-push. Do not commit secrets. Commit only if automation policy allows and changes are coherent.
```

## Human once

1. Open Automations in Cursor (agent may have prefilled the form).  
2. Confirm repo = this marketing-mix-model workspace.  
3. Approve secrets/network if asked (`fly`, health curl).  
4. Save + enable.  

Disable anytime in Automations UI.
