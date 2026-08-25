# Mcfly — Continuous 24/7 improvement

**Goal:** Mcfly Ads & Analytics improves **without waiting for a human to open chat** — zero shortcuts, religion-safe, evidence-gated.

**Enterprise fleet SoT:** [`ops/FLEET_ENTERPRISE.md`](./ops/FLEET_ENTERPRISE.md) — five pod Automations, failure kill criteria, free-host ladder, wave locks. Setup: [`ops/fleet/AUTOMATIONS_SETUP.md`](./ops/fleet/AUTOMATIONS_SETUP.md). Tick log: [`ops/fleet/TICK_LOG.md`](./ops/fleet/TICK_LOG.md).

## Reality check (so we don’t kid ourselves)

| Layer | What it is | Runs when |
| --- | --- | --- |
| **A. This chat loop** | Cursor agent woken by shell ticks | Mac awake + Cursor open on this chat |
| **B. Cursor Automation** | Cloud agent on a schedule | **True 24/7** (even if laptop sleeps) |
| **C. GitHub overnight.yml** | MER sync/recon/report | Daily CI — product data loop, not craft |

**A alone is not 24/7.** B is required for always-on. Keep A for high-intensity local swarm while you’re building.

## Always-on mission (every run)

Read product religion + delivery OS (paraphrased if files not on branch yet):

- Cash MER = sales ÷ ad spend; refuse pixels / MTA / TW feature clones
- Beat alternatives on **clarity, craft, reliability, ease, honesty** — not feature count
- Zero shortcuts: ship gate before claiming done; checklist only with evidence
- Human gates stop the agent (Partner MFA, App Store submit, billing cards, DNS)

## Redesign mode (6–8 weeks — **active**)

See [`ENTERPRISE_REDESIGN.md`](./ENTERPRISE_REDESIGN.md) + [`docs/superpowers/specs/2026-07-26-enterprise-redesign-design.md`](./superpowers/specs/2026-07-26-enterprise-redesign-design.md).

- **App lane is P0.** Site mega-ticks (≥80% site-first) are **paused** — except Wave 1 **Services/Education money paths** under [`ops/FLEET_ENTERPRISE.md`](./ops/FLEET_ENTERPRISE.md) (Custom CTA, MDS go-live), which are monetize not mega-site craft.
- Specialists default to **Grok 4.5** (`cursor-grok-4.5-high-fast`).
- Topology: Parent + 1 Grok implementer + 1 Grok critic (fleet caps: ≤6 Tasks; Conductor + ≤4 chats).
- **Always `fly deploy`** after ship-gate PASS when the desk changed. Standing grant is on ([`ops/STANDING_DEPLOY_GRANT.md`](./ops/STANDING_DEPLOY_GRANT.md)) — do not ask. Never Partner Submit.
- Idle on HUMAN_GATE; kill criteria in FLEET_ENTERPRISE.

## Tick protocol (orchestrator)

Every tick:

1. **Orient** — health URL, git status, next item from [`ENTERPRISE_REDESIGN.md`](./ENTERPRISE_REDESIGN.md) (or site curriculum only if redesign paused)  
2. **Spawn** (redesign-active):
   - **App / QA ticks:** Grok implementer (one file owner) ∥ Grok critic  
   - **Site ticks:** paused unless founder re-enables; then Grok/GPT (Claude if quota allows)  
   - Parent Auto **orchestrates only**. Specialists set Task `model` explicitly — never all-inherit Auto  
3. **Integrate** — merge safe diffs; reject religion violations / critic religion fails  
4. **Gate** — `bash scripts/agent-ship-gate.sh` when app touched (CI may set `SKIP_HEALTH=1`)  
5. **Report** — 5 lines: shipped, **models used**, critic scores, blocked (human), next  

## Intensity settings

| Mode | Cadence | Use |
| --- | --- | --- |
| **Site sprint** | every **10–15 min** (chat loop) | mcflyads.com priority — Generator/Critic/Verifier swarm |
| **Sprint** | every 15–20 min | Mixed lanes when site D0 strong |
| **Always-on** | every hour (Cursor Automation) | True 24/7 cloud |
| **Data** | daily (GitHub Actions) | Overnight MER orchestrator |

## Stop conditions

- User says `stop 24/7` / `stop loop`
- Kill criteria in MASTER_PLAN (recon breach, etc.)
- Human gate with no path forward → report and idle until user signal

## Idle when live lags deploy (important)

If **local site is ship-eligible** (critic mean ≥4.5, Candidate B dock, Ads brand, why-pixels local OK) **and live mcflyads.com still shows old brand / missing pages / stale `?v=`**, the next P0 is **human push/deploy** — not another Generator swarm.

On each wake in that state:

1. Orient (health + live curl) once  
2. Spawn **at most one** Grok Critic to refresh `SITE_CRAFT_NEXT.md`  
3. **Do not** spawn Fable/Opus mega-ticks every 8 minutes — it burns frontier quota and fights itself while live stays stale  
4. Report: still waiting on deploy; loop may keep pulsing but parent stays idle-ish until live matches local or user says otherwise  

If the chat was idle and **many tick notifications queue at once**, treat as **one** wake — never backfill dozens of specialist waves.

## Human must enable once

1. Approve + save **Cursor Automation** (hourly Mcfly improver)  
2. Commit/push delivery OS so cloud agents can read it  
3. Keep Fly billing active so app health stays green  
4. Occasional taste pass on the site (“still AI?” / “wow”)
