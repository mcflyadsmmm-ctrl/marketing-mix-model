# Cursor Automations setup (founder)

**Parent:** [`../FLEET_ENTERPRISE.md`](../FLEET_ENTERPRISE.md)  
**Prerequisite (A8):** Commit + **push** `docs/ops/FLEET_ENTERPRISE.md` and `docs/ops/fleet/**` to the branch Automations checkout (usually `main`). Cloud agents cannot read unpushed files.

## Create these five Automations

Use **Cursor → Automations** (Agents Window). For each row: New Automation → paste **Instructions** from the linked file → set trigger → enable tools (Agent, shell, edit; **no** Partner Submit).

| # | Name | Cadence | Instructions file | Enable when |
| --- | --- | --- | --- | --- |
| 1 | `Mcfly Desk SaaS hourly` | 1 hour | [`AUTO_DESK_SAAS.md`](./AUTO_DESK_SAAS.md) | After push |
| 2 | `Mcfly Services Factory 6h` | 6 hours | [`AUTO_SERVICES_FACTORY.md`](./AUTO_SERVICES_FACTORY.md) | After push |
| 3 | `Mcfly Education daily` | 24 hours | [`AUTO_EDUCATION.md`](./AUTO_EDUCATION.md) | After push |
| 4 | `Mcfly B2B Platform daily` | 24 hours | [`AUTO_B2B_PLATFORM.md`](./AUTO_B2B_PLATFORM.md) | After push (**stays wave-locked idle** until Wave 2) |
| 5 | `Mcfly Growth+Gate 6h` | 6 hours | [`AUTO_GROWTH_GATE.md`](./AUTO_GROWTH_GATE.md) | After push |

## Tools checklist

- Agent / edit / shell / git as needed  
- Deploy via shell only when paste + standing grant allow  
- Do **not** connect actions that click Partner Dashboard Submit  

## Verify

1. First Growth+Gate tick appends [`TICK_LOG.md`](./TICK_LOG.md)  
2. Desk tick curls `/health`  
3. B2B tick logs `WAVE_LOCKED` until unlock  
4. On `stop fleet`: disable all five in Automations UI  

## Agent handoff note

Opening the Automations editor from chat requires the **Agents Window** Automate finish path. Pastes above are the source of truth; founder (or agent in Agents Window) creates the five schedules after push.

**2026-07-31:** Glass Automations opened with **Mcfly Desk SaaS hourly** prefilled. Founder: save after `docs/ops/fleet/**` is on the Automation checkout branch, then create #2–#5 from the paste files in this table.
