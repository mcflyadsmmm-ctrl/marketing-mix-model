# Conductor · frontier fleet (enterprise scale)

**Role of this chat:** Orchestrate only. Spawn Task specialists with explicit `model`. Integrate reports. Hand HUMAN_GATE to founder.

**Operating system SoT:** [`ops/FLEET_ENTERPRISE.md`](./ops/FLEET_ENTERPRISE.md)  
**Queues / merge / failures / Automations:** [`ops/fleet/`](./ops/fleet/)  
**Human board:** [`ops/fleet/HUMAN_GATE_BOARD.md`](./ops/fleet/HUMAN_GATE_BOARD.md)  
**Hosting baseline:** [`ops/fleet/HOSTING_BASELINE.md`](./ops/fleet/HOSTING_BASELINE.md)

Conductor **never implements**. Daily: rank P0 per QUEUE · clear HUMAN_GATE pings · merge via [`ops/fleet/MERGE_PROTOCOL.md`](./ops/fleet/MERGE_PROTOCOL.md) only after ship-gate.

## What Cursor conductor can do

| Capability | Use |
| --- | --- |
| **Parallel Task agents** | Many specialists at once; `run_in_background: true` |
| **Explicit frontier models** | Grok / GPT Sol·Terra / Claude Fable·Opus·Sonnet / Composer — never inherit Auto for craft |
| **Resume / interrupt** | Follow-up without losing lane |
| **Ship-gate / shells** | Evidence before “done” |
| **MCP** | Shopify docs, Cloudflare Pages, browser QA |
| **Automations** | Hourly cloud ticks (no auto-deploy unless you say so) |
| **Cannot** | Partner MFA, PCD click, App Store Submit, Meta App Review |

## Enterprise scale = facts + queue (not warehouse)

Religion refuses BigQuery/pixels/MTA. Big-company ready means:

1. Desk never live-crawls 100k+ orders on nav  
2. Order webhooks → dirty days → reconcile  
3. Postgres job queue + DLQ  
4. Spend CSV caps + batched upserts  
5. Load-test matrix + p95 SLO  

Spec: [`docs/superpowers/specs/2026-07-26-enterprise-redesign-design.md`](./superpowers/specs/2026-07-26-enterprise-redesign-design.md) §5.

## Active frontier lanes (this wave)

Pod queues (SoT): [`ops/fleet/QUEUE_DESK.md`](./ops/fleet/QUEUE_DESK.md) · [`QUEUE_SERVICES.md`](./ops/fleet/QUEUE_SERVICES.md) · [`QUEUE_EDU.md`](./ops/fleet/QUEUE_EDU.md) · [`QUEUE_B2B.md`](./ops/fleet/QUEUE_B2B.md) · [`QUEUE_GROWTH.md`](./ops/fleet/QUEUE_GROWTH.md).

Cloud Automations: [`ops/fleet/AUTOMATIONS_SETUP.md`](./ops/fleet/AUTOMATIONS_SETUP.md) (enable after push).

See conductor status messages for live agent IDs.
