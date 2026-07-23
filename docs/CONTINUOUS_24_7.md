# Mcfly — Continuous 24/7 improvement

**Goal:** Mcfly Ads & Analytics improves **without waiting for a human to open chat** — zero shortcuts, religion-safe, evidence-gated.

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

## Tick protocol (orchestrator)

Every tick:

1. **Orient** — health URL, site HTTP (`?v=` live vs local), git status, next **site curriculum** step from [`SITE_CRAFT_LOOP.md`](./SITE_CRAFT_LOOP.md)  
2. **Site-first spawn** (training-style multitask — see SITE_CRAFT_LOOP):
   - **≥80% ticks:** Generator + Critic in parallel on `site/**`; Verifier after; Distiller → next brief  
   - **≤20% ticks / only if site blocked or gate red:** App cash desk and/or QA ship-gate  
   - **Model routing (frontier-first — quality over cheap Auto):**
     - Parent Auto **orchestrates only**. Specialists use frontier models via Task `model`.
     - **Claude Fable 5** (`claude-fable-5-thinking-high`) / **Opus 4.8** (`claude-opus-4-8-thinking-high`) — hero, authority pages, pricing narrative, hard taste
     - **Claude Sonnet 5** (`claude-sonnet-5-thinking-high`) — app UX, strong secondary craft
     - **Grok 4.5 high fast** (`cursor-grok-4.5-high-fast`) — critics, explore, QA, hygiene, parallel sweeps
     - **Composer 2.5 fast** (`composer-2.5-fast`) — trivial renames / ?v= only
     - **GPT 5.6 Sol/Terra** — alternate judgment / Best-of-N when useful
     - **Every site mega-tick:** ≥1 Fable or Opus Generator on craft-critical work; never all-inherit Auto
3. **Integrate** — merge safe diffs; reject religion violations / critic religion fails  
4. **Gate** — site ticks: visual + `?v=` bump; full `bash scripts/agent-ship-gate.sh` when app touched (or red QA)  
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
