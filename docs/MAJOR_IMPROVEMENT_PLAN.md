# Mcfly Major Improvement Plan (90 days) — agent-executable SoT

**Status:** LOCKED for agents · 2026-07-29  
**Outcome:** Submit-safe Monday cash desk + dual-pillar organic/GEO — without pixel/MMM theater  
**Product SoT:** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4 · Delivery: [`MASTER_DIRECTIVE.md`](./MASTER_DIRECTIVE.md)  
**Absorbs:** [`RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md`](./RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md) · [`RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md`](./RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md) · [`SEO_AI_GEO_RUNBOOK.md`](./SEO_AI_GEO_RUNBOOK.md) · [`BFS_WORLD_CLASS.md`](./BFS_WORLD_CLASS.md) · [`SHIP_BUILD_PLAN.md`](./SHIP_BUILD_PLAN.md)

**Refuse always:** pixels · Web Pixels · MTA · Markov/Shapley · Meridian/Robyn product UI · SyncWith zoo · App URL = mcflyads.com · forever-free bait · GMV tax · “static one-time MMM” as the company story

**Models:** Grok implementer + Grok critic (`cursor-grok-4.5-high-fast`); Composer hygiene. Explicit `model` on Task.

**Deploy:** Pages/Fly only when founder grants that turn.

---

## 0. North star

| Bar | Definition |
| --- | --- |
| Submit-safe | Compliance + Polaris/CSB + cold reviewer script + listing honesty |
| Habit | Cold path &lt;10 min → weekly Monday Close |
| Organic | Dual-pillar site indexed + AI citation signals + outreach |
| Commercial | Free → ~$79 flat; Custom fixed-fee + retainer — not GMV tax |

```text
Wave1 Submit survival ──┐
Wave2 Organic/GEO ──────┼──► Wave3 Desk habit ──► Wave4 Billing + Custom + reviews
Harness continuous ─────┘
```

---

## Wave 1 — App Store survival (days 0–14)

Goal: approval odds; avoid Valley-of-Death reject loops.

| ID | Work | Owner | Evidence when done |
| --- | --- | --- | --- |
| W1-1 | Compliance spotcheck + privacy/PCD parity | Agent | `bash scripts/mcfly-compliance-spotcheck.sh` PASS · **done 2026-07-29** |
| W1-2 | Contextual Save Bar on settings/goals/spend mutations | Agent | Polaris/App Bridge `data-save-bar` · audit [`ops/W1_UX_CSB_20260729.md`](./ops/W1_UX_CSB_20260729.md) |
| W1-3 | UX reject pass: no red primary CTAs; no blocking upgrade modals; mobile Close/Spend | Agent + critic | [`ops/W1_UX_CSB_20260729.md`](./ops/W1_UX_CSB_20260729.md) |
| W1-4 | GraphQL: `extensions.cost` + `THROTTLED` wait; sized `first`; Bulk for large history | Agent | `shopify-graphql-cost.server.ts` + sales retry · **done 2026-07-29** |
| W1-5 | Webhooks: ACK &lt;5s; idempotent delivery; compliance stays fast | Agent | Orders + job queue pattern · spotcheck PASS |
| W1-6 | Cold reviewer test script (margin → SAMPLE spend → desk → Close) | Agent draft · Human paste | [`ops/REVIEWER_TEST_SCRIPT.md`](./ops/REVIEWER_TEST_SCRIPT.md) · **done 2026-07-29** |
| W1-7 | Listing shots + Distribution → Submit | **HUMAN_GATE** | Partner |

**Exit:** compliance green · CSB/UX pass · GraphQL retry path · reviewer script ready · founder can Submit.

### Wave 1 fleet paste

```text
@docs/MAJOR_IMPROVEMENT_PLAN.md @docs/RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md

Lane: Wave 1 App Store survival. Next unchecked W1-* agent row.
Model: cursor-grok-4.5-high-fast implementer + critic.
Religion: cash Total ROAS; no pixels/MTA. Run compliance spotcheck when touching webhooks/privacy.
No Fly/Pages deploy unless founder granted this turn.
End: W1 id · evidence · next id · HUMAN_GATE.
```

---

## Wave 2 — Organic + AI GEO (days 0–30, parallel)

| ID | Work | Owner |
| --- | --- | --- |
| W2-1 | GSC verify + sitemap + AI Crawl Control Allow citation bots + Markdown for Agents | **HUMAN** — [`ops/GSC_HUMAN_GATE.md`](./ops/GSC_HUMAN_GATE.md) · [`ops/AI_CRAWLER_POLICY.md`](./ops/AI_CRAWLER_POLICY.md) |
| W2-2 | SEO P1: cash-mer deepen; TW-alt / variance / profit-trackers | Agent — [`SEO_AI_GEO_RUNBOOK.md`](./SEO_AI_GEO_RUNBOOK.md) §7 |
| W2-3 | Save weekly SEO Automation | **HUMAN** — [`ops/SEO_GEO_WEEKLY_PROMPT.md`](./ops/SEO_GEO_WEEKLY_PROMPT.md) |
| W2-4 | Send 5 outreach + 1 social | **HUMAN** — [`ops/OUTREACH_DRAFTS_20260729.md`](./ops/OUTREACH_DRAFTS_20260729.md) |
| W2-5 | FAQ harvest monthly from real questions | Agent |

**Exit:** GSC Success · citation Allows confirmed · outreach started · P1 ticks logged.

### Founder Wave 2 checklist (print)

- [ ] Search Console: property live · submit `https://mcflyads.com/sitemap.xml`
- [ ] Cloudflare → AI Crawl Control: **Allow** OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot
- [ ] Enable **Markdown for Agents** if toggle present
- [ ] Save Cursor Automation from `SEO_GEO_WEEKLY_PROMPT.md`
- [ ] Send 5 emails + post 1 draft from `OUTREACH_DRAFTS_20260729.md`

---

## Wave 3 — Desk domination (days 14–60)

| ID | Work | Owner |
| --- | --- | --- |
| W3-1 | TTFV &lt;10 min; SAMPLE OFF unmistakable | Agent |
| W3-2 | Close craft ≥4.7 ([`APPS_SCRIPT_CRAFT_SPEC.md`](./APPS_SCRIPT_CRAFT_SPEC.md)) | Agent + critic |
| W3-3 | Meta/Google spend OAuth (amounts only) | Agent · **HUMAN** App Review |
| W3-4 | Pipe Automate polish ([`PIPE_AUTOMATION_WEDGE.md`](./PIPE_AUTOMATION_WEDGE.md)) | Agent |
| W3-5 | Design-partner Monday Closes + WTP | **HUMAN** ([`DESIGN_PARTNER_SMOKE.md`](./DESIGN_PARTNER_SMOKE.md)) |

### Wave 3 fleet paste

```text
@docs/MAJOR_IMPROVEMENT_PLAN.md @docs/CATEGORY_DOMINATION_MEGAPROMPT.md

Lane: Wave 3 desk habit. Next unchecked W3-* agent row.
No pixels/MTA. No TW clone. Grok implementer + critic.
End: W3 id · scorecard · HUMAN_GATE.
```

---

## Wave 4 — Commercial (days 45–90)

| ID | Work | Owner |
| --- | --- | --- |
| W4-1 | Shopify Billing ~$79 flat when founder announces | Agent after grant · [`BILLING_TIERS.md`](./BILLING_TIERS.md) |
| W4-2 | Custom retainer inquire (no homepage consulting steal) | Agent + site |
| W4-3 | Reviews + uninstall feedback loop | **HUMAN** + Agent triage |
| W4-4 | BFS only if category does not require pixels | **DEFER** |

---

## Continuous — Agent harness

Add/strengthen `.cursor/rules` (no 10k monologue; no auto-commits without ask):

- [ ] Types/interfaces before feature impl  
- [ ] No TODO stubs in shipped paths  
- [ ] Verify packages before new imports  
- [ ] Shopify MCP before inventing Admin API  
- [ ] Prefer SEARCH/REPLACE on large files  
- [ ] Explicit refuse: pixels, Markov/Shapley, Meridian/Robyn product UI  

---

## HUMAN_GATE register

| Gate | Wave |
| --- | --- |
| Partner Distribution / Submit / shots | W1-7 |
| GSC + CF AI Crawl Control + Markdown for Agents | W2-1 |
| Save weekly Automation | W2-3 |
| Outreach / social send | W2-4 |
| Meta/Google App Review | W3-3 |
| Design-partner stores | W3-5 |
| Billing announce | W4-1 |
| Pages/Fly deploy | any — phrase required |

---

## Competitive correction (do not drift)

External research often paints Mcfly as **static one-time MMM vs TW/Northbeam/Recast**. That is **wrong product**.

| Wrong story | Locked Mcfly |
| --- | --- |
| One-time MMM script, zero SaaS | **Pillar A:** Shopify Monday Close SaaS (Free → ~$79) |
| Must add pixels / Apex / Sonar to compete | **Refuse** — till close coexists with suites |
| Must become continuous Bayesian MMM SaaS | **Refuse** — not Robyn/Meridian theater |
| Code ownership beats Robyn/Meridian | Open-source already commoditized that USP — **don’t compete there** |

Use competitor depth for **site narrative** (why platforms over-claim) and **craft bar** — never to reopen MTA/MMM OS. See [`RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md`](./RESEARCH_ABSORB_ATTRIBUTION_AGENTIC.md).

---

## Progress log

| Date | Done | Evidence |
| --- | --- | --- |
| 2026-07-29 | SoT created; Wave 1 kickoff | this file |
| 2026-07-29 | W1-1 compliance PASS | `mcfly-compliance-spotcheck.sh` |
| 2026-07-29 | W1-4 GraphQL THROTTLED helper + sales + order-facts wire | `shopify-graphql-cost.*` · vitest cost+sales pass |
| 2026-07-29 | W1-5 webhooks ACK + idempotency | [`ops/W1_WEBHOOKS_20260729.md`](./ops/W1_WEBHOOKS_20260729.md) |
| 2026-07-29 | W1-6 reviewer script | [`ops/REVIEWER_TEST_SCRIPT.md`](./ops/REVIEWER_TEST_SCRIPT.md) |
| 2026-07-29 | W1-2/3 CSB/UX audit | [`ops/W1_UX_CSB_20260729.md`](./ops/W1_UX_CSB_20260729.md) |
| 2026-07-29 | Ship-gate PASS + compliance PASS | `agent-ship-gate.sh` · `mcfly-compliance-spotcheck.sh` |
| 2026-07-29 | Listing shot 5 + Submit handoff | `05-spend-csv.png` · [`ops/SUBMIT_HANDOFF.md`](./ops/SUBMIT_HANDOFF.md) |
| 2026-07-29 | Harness rule | `.cursor/rules/70-agent-harness.mdc` |
| 2026-07-29 | Founder Wave 2 checklist | [`ops/FOUNDER_WAVE2_CHECKLIST.md`](./ops/FOUNDER_WAVE2_CHECKLIST.md) |
| 2026-07-29 | W1 ship-gate PASS + SAMPLE/`?shot=1` 1.1.4 hygiene | `agent-ship-gate.sh` exit 0 · `mcfly-compliance-spotcheck.sh` exit 0 · [`ops/W1_SHIP_GATE_20260729.md`](./ops/W1_SHIP_GATE_20260729.md) |

Flip Wave checkboxes only with evidence. Append rows here each tick.
