# Mcfly Enterprise Frontier Fleet OS

**Status:** Wave 0 SoT (2026-07-31)  
**Authority:** [`MASTER_PLAN.md`](../MASTER_PLAN.md) beats prompts. Delivery: [`MASTER_DIRECTIVE.md`](../MASTER_DIRECTIVE.md).  
**Attended fleet (legacy day map):** [`AGENT_FLEET_TODAY.md`](../AGENT_FLEET_TODAY.md)  
**Conductor:** [`CONDUCTOR_FRONTIER.md`](../CONDUCTOR_FRONTIER.md)  
**24/7:** [`CONTINUOUS_24_7.md`](../CONTINUOUS_24_7.md)  
**Control plane:** [`fleet/`](./fleet/)

---

## 0. Locked defaults

1. **Hosting = vendor-agnostic free stacking.** Cloudflare Pages is today’s `mcflyads.com` host only — not religion. Desk SaaS stays **Node + Prisma + Postgres**. No Wave-0 Workers/D1 rewrite.
2. **Money rule:** $0 forever where free tiers are real (static, Neon Free, Gumroad/Stripe take-rate-only). First **Pro or Custom dollar** pays always-on Desk (~$5–7/mo). Cap: `hosting_monthly <= 0.15 * trailing_30d_revenue`.
3. **No shortcuts:** `bash scripts/agent-ship-gate.sh` + religion refuse + evidence-only checklists. Human gates stop agents.
4. **Frontier fleet:** Conductor orchestrates only. Task `model` always explicit (Grok default; GPT Sol hard judgment; Claude only if quota allows — **never retry Claude on limit**).
5. **Parallel ≠ thrash:** branch-per-pod, one file owner, max concurrent Tasks, idle on HUMAN_GATE.

### Grant phrases

| Phrase | Effect |
| --- | --- |
| `Pages deploy allowed this turn.` | Static host deploy (CF Pages / GH Pages SoT) |
| `Desk deploy allowed this turn.` / `Fly deploy allowed this turn.` | Desk host after ship-gate PASS |
| Standing grant | [`STANDING_DEPLOY_GRANT.md`](./STANDING_DEPLOY_GRANT.md) until `revoke deploy` |
| `stop fleet` / `stop 24/7` | Hard kill all Automations + attended swarm |

---

## 1. Kill criteria (hard stop entire fleet)

1. Religion violation merged to `main` (pixels / MTA / SyncWith zoo / App URL = marketing domain)
2. Production multi-tenant data bleed evidenced
3. Hosting spend > 15% trailing 30d revenue for 14 days without shrink plan
4. Three consecutive Automation days with zero ship-gate PASS and no HUMAN_GATE logged (quota thrash)
5. Founder says `stop fleet` / `stop 24/7`

Live tracking: [`fleet/FAILURE_REGISTER.md`](./fleet/FAILURE_REGISTER.md).

---

## 2. Critical failure register (summary)

Full live board: [`fleet/FAILURE_REGISTER.md`](./fleet/FAILURE_REGISTER.md).

| Band | Examples | Fleet response |
| --- | --- | --- |
| **A** Fleet/agent | Quota burn, merge hell, fake done, religion drift, 30-chat fantasy | Caps, idle, merge freeze, critic fail |
| **B** Hosting/$0 | Fly card, Render cold start, Neon limits, wrong free Postgres | Host inventory, ban list, revenue upgrade |
| **C** Business | App Store stuck, Free no Pro, custom no close, B2B early | Wave locks, sales KPI, defer B2B |
| **D** Data/enterprise | Live-crawl, DLQ ignore, tenant bleed, CSV OOM, secrets | Job-queue SoT, compliance stop deploys |
| **E** Conductor/founder | HUMAN_GATE stall, conductor implements, chaos priorities | Board + restart conductor |

---

## 3. Multi-vendor free hosting

Baseline evidence: [`fleet/HOSTING_BASELINE.md`](./fleet/HOSTING_BASELINE.md).

| Surface | Primary $0 | Backup | Ban |
| --- | --- | --- | --- |
| Site / custom / course | Cloudflare Pages (live) | GitHub Pages, Render Static | Vercel Hobby if commercial ToS blocks |
| Postgres | Neon Free (or current Fly-attached free-ish DB) | — | **Render Free Postgres** (~30d expiry) |
| Desk compute | Existing Fly `mcfly-analytics` | Render Free (**smoke/review only**) | Workers Free as full Desk |
| Checkout | Gumroad / Stripe Payment Links | — | Monthly LMS before revenue |

### Desk ladder D0→D4

| Stage | Trigger | Compute | Database |
| --- | --- | --- | --- |
| **D0** | Now → first $ | Keep Fly if live/cheap; Render Free standby for smoke | Neon Free / current |
| **D1** | 10–50 Free installs | Minimize always-on workers | Neon Free |
| **D2** | First Pro or Custom $ | **Always-on** cheapest Node (~$5–7) from revenue | Neon Free until limit |
| **D3** | Agency tier | Scale RAM / worker | Neon Launch + pool |
| **D4** | Stable MRR | Optional edge webhook extract | Postgres SoT |

**Never** sell Pro on cold-start-only hosting.

---

## 4. Control plane artifacts

| Artifact | Purpose |
| --- | --- |
| This file | SoT topology + defaults |
| [`fleet/FAILURE_REGISTER.md`](./fleet/FAILURE_REGISTER.md) | Live A–E IDs |
| [`fleet/MERGE_PROTOCOL.md`](./fleet/MERGE_PROTOCOL.md) | Branches, path locks, merge order |
| [`fleet/QUEUE_DESK.md`](./fleet/QUEUE_DESK.md) etc. | Tickets with revenue_hypothesis |
| [`fleet/HUMAN_GATE_BOARD.md`](./fleet/HUMAN_GATE_BOARD.md) | Founder daily board |
| [`fleet/TICK_LOG.md`](./fleet/TICK_LOG.md) | Append-only tick reports |
| [`fleet/HOSTING_BASELINE.md`](./fleet/HOSTING_BASELINE.md) | Host evidence |
| [`fleet/AUTO_*.md`](./fleet/) | Automation pastes |
| [`fleet/AUTOMATIONS_SETUP.md`](./fleet/AUTOMATIONS_SETUP.md) | Founder: create Automations in Agents Window |

---

## 5. Frontier topology (per ticket)

```text
Conductor picks P0 from QUEUE
  → Implementer (Grok) on pod branch [background]
  → Critic (Grok or GPT Sol) parallel [background]
  → optional BoN (2nd) ONLY if tag = craft|money-path (max 2/day)
  → Gate: ship-gate + compliance spotcheck when app touched
  → Conductor merges via MERGE_PROTOCOL or rejects
  → TICK_LOG + FAILURE_REGISTER if new mode
```

### Models (Task `model` required)

| Role | Slug |
| --- | --- |
| Implementer (default) | `cursor-grok-4.5-high-fast` |
| Critic / BFS | `cursor-grok-4.5-high-fast` or `gpt-5.6-sol-medium` |
| Hard judgment | `gpt-5.6-sol-medium` |
| Desk craft (if quota) | `claude-sonnet-5-thinking-high` / `claude-fable-5-thinking-high` → else Grok |
| Hygiene / docs | `composer-2.5-fast` |

### Hard caps

| Cap | Value |
| --- | --- |
| Attended chats | Conductor + **≤4** (Desk, Services, Education, Gate) |
| Background Tasks | **≤6** across all pods |
| Tickets per Automation tick | **1** |
| BoN pairs / day | **2** |
| Fix attempts then escalate | **≤3** |
| B2B Automation deploy | **Wave 2 unlock only** |

### Capacity (“30 eng” = slots, not chats)

| Pod | Slots | Concurrent Tasks | Primary $ |
| --- | --- | --- | --- |
| Desk | 8 | 2 | Pro ARPU |
| Services | 8 | 2 | Custom + setup |
| Education | 3 | 1–2 | Course funnel |
| B2B | 5 | 1–2 (Wave 2+) | Agency MRR |
| Gate + Growth | 6 | 1–2 | Convert + quality |

---

## 6. Five Automations

| Automation | Cadence | Wave | Paste |
| --- | --- | --- | --- |
| Mcfly Desk SaaS hourly | 1h | 0+ | [`AUTO_DESK_SAAS.md`](./fleet/AUTO_DESK_SAAS.md) |
| Mcfly Services Factory 6h | 6h | 0+ | [`AUTO_SERVICES_FACTORY.md`](./fleet/AUTO_SERVICES_FACTORY.md) |
| Mcfly Education daily | 24h | 0+ | [`AUTO_EDUCATION.md`](./fleet/AUTO_EDUCATION.md) |
| Mcfly B2B Platform daily | 24h | **2 only** | [`AUTO_B2B_PLATFORM.md`](./fleet/AUTO_B2B_PLATFORM.md) |
| Mcfly Growth+Gate 6h | 6h | 0+ | [`AUTO_GROWTH_GATE.md`](./fleet/AUTO_GROWTH_GATE.md) |

**Do not enable cloud Automations until this doc + fleet/ are committed and pushed** (failure A8).

---

## 7. Wave locks (cash before platform)

| Wave | Capacity | Unlock | Exit |
| --- | --- | --- | --- |
| **0 Bootstrap** | Docs + host inventory | Founder executes this OS | This file + host baseline pushed |
| **1 Monetize** | ≥50% Desk+Services+Edu | Wave 0 done | Pro URL **or** Custom invoice path **or** Gumroad live |
| **2 Automate+Agency** | Desk + thin pipes | First $ **or** 10 design-partner rituals | Sheet/webhook + multi-store |
| **3 B2B** | B2B pod on | ~10 paying Pro **or** founder waiver | White-label / API / benchmarks |

Every queue ticket **must** include `revenue_hypothesis` or Conductor rejects it.

---

## 8. Human gates (fleet idles — does not invent)

Partner MFA, Distribution, PCD, App Store Submit, host billing card when free exhausted, Gumroad/Stripe account create, DNS cutover, design-partner store access, religion amendments.

Board: [`fleet/HUMAN_GATE_BOARD.md`](./fleet/HUMAN_GATE_BOARD.md).

---

## 9. Conductor daily checklist

1. Rank P0 on each QUEUE  
2. Read HUMAN_GATE_BOARD — ping founder if blocked  
3. Spawn ≤ caps; never implement in Conductor  
4. Merge via MERGE_PROTOCOL only after gate PASS  
5. Answer on demand: P0 per pod · open failures A–E · hosting $ vs revenue  

---

## 10. Religion refuse (every paste)

Pixels, MTA, path / view-through / “true ROAS,” Triple Whale / Northbeam feature parity, SyncWith connector zoo, App URL = mcflyads.com, forever-free marketing, inventing features that contradict MASTER_PLAN.
