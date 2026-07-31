# Research absorb — Attribution / MMM ecosystem + Agentic Cursor engineering

**Status:** LOCKED absorb for agents · 2026-07-29  
**Inputs:** Founder-provided deep research (2 docs)  
  1. E-Commerce Attribution Ecosystem, MMM, and Agentic Shopify App Development  
  2. Architecting an Elite Shopify Marketing Analytics App (anti-slop Cursor / pixels / ClickHouse / Markov–Shapley)  
**Product SoT (wins on conflict):** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4 · [`VALUE_THESIS.md`](./VALUE_THESIS.md) · [`MDS_RESEARCH_ABSORB.md`](./MDS_RESEARCH_ABSORB.md)  
**Companions:** [`BFS_WORLD_CLASS.md`](./BFS_WORLD_CLASS.md) · [`SEO_AI_GEO_RUNBOOK.md`](./SEO_AI_GEO_RUNBOOK.md) · [`.cursor/rules/00-mcfly-religion.mdc`](../.cursor/rules/00-mcfly-religion.mdc)

---

## 0. One-line verdict

The research correctly diagnoses **why pixels/MTA are dying** and **how to build Shopify apps with disciplined agents**. It wrongly concludes that Mcfly’s product should be **Meridian/Robyn MMM**, **Web Pixels telemetry**, or **Markov/Shapley path credit**. Mcfly’s wedge remains: **Monday cash close (net sales ÷ spend) + break-even + step-tests** — flat fee — coexisting with suites. Steal craft + distribution + GraphQL hygiene; **refuse** the attribution OS.

---

## 1. Steal vs refuse matrix (both papers)

### Steal (strengthen Mcfly)

| Research claim | Mcfly translation | Where it lands |
| --- | --- | --- |
| Platforms inflate ROAS 20–40%; Direct/None / session breaks | Site + FAQ authority: *why platforms over-claim*; Product = till truth | `/why-pixels-fail`, `/platform-variance`, listing honesty |
| Mid-market gap between TW tiles and $1K–2.5K MMM | Own **cash desk** at Free → ~$79; Custom $5–25K for building-sized desks | Dual pillar already |
| TOFU free calculator → install | MER / BE calculators live; waitlist / Install free | `/mer-calculator`, `/break-even-roas-calculator` |
| Remix + TS + Prisma + Polaris + GraphQL Admin | Already stack; keep | `app/` |
| App Bridge v4 CDN + Polaris-only embedded UI | BFS craft; no Tailwind admin | [`BFS_WORLD_CLASS.md`](./BFS_WORLD_CLASS.md) |
| GraphQL cost bucket, `THROTTLED` in body, size `first` to need | Harden Admin sync (orders/spend), not pixels | App sales/spend loaders |
| Bulk Operations for >~250 historical records | Prefer bulk for historical order sync | Order facts / Shopify sales API |
| Compliance webhooks HMAC (customers/data_request, redact, shop/redact) | Already required; never regress | Compliance skill + routes |
| MCP live Shopify schema (not training cutoff) | Use `user-shopify-dev-mcp` before inventing Admin API | Agent harness |
| Plan-first / TDD / modular files / SEARCH-REPLACE on large files | Matches ship loop + anti-slop | Cursor rules / fleet |
| Concise Architect · verify packages before import · interface/types before impl · no TODO stubs | Adopt as project rules where missing | `.cursor/rules/` |
| Distribution-first App Store | Organic SEO/GEO + outreach packs already running | Site + ops |

### Translate (same pain, different math)

| Research says | Mcfly does instead |
| --- | --- |
| Adstock + Hill saturation + marginal ROAS curves in-app | **Break-even Total ROAS** from margin + **portfolio** step-tests with spend floors; disclose **average ≠ marginal** |
| Meridian MCMC / Robyn Ridge as product | Religion: not Robyn/Meridian/incrementality theater ([`VALUE_THESIS.md`](./VALUE_THESIS.md)) |
| One-time custom MMM as core SKU | Custom Data Solutions = **fixed-fee decision desks** + metric contracts — not homepage MMM SaaS |
| Pixel identity / event warehouse | Shopify **Admin sales** (net) + **spend** CSV/OAuth amounts |
| Markov removal effect / Shapley budget fairness | Rules-based hold / reduce / step-test; never path credit |
| ClickHouse + Drizzle for billion pixel events | Prisma/Postgres shop-scoped facts; columnar only if **enterprise scale revenue pulls** (ops runbooks) — not pixel lake |

### Refuse (kill-on-contact — do not implement from these papers)

| Topic | Why |
| --- | --- |
| Web Pixels / App Pixels / `write_pixels` / `read_customer_events` as product spine | Religion + BFS Analytics trap ([`BFS_WORLD_CLASS.md`](./BFS_WORLD_CLASS.md) § pixels) |
| Markov Chain / Shapley / MTA / “true ROAS” / path credit | MASTER_PLAN refuse |
| Shipping Meridian / Robyn / DeepCausalMMM in the Shopify app | Wrong product; capital death |
| Custom CSS / Tailwind Admin / non-Polaris embedded UI | BFS + craft refuse |
| Mandating **10,000 chars** of internal monologue every turn | Conflicts with concise founder UX; burns tokens; not Mcfly ops |
| Autonomous `git add -A && git commit` checkpoints without founder ask | User git rules: commit only when requested |
| Pixel CAPI / identity graph “to compete with TW” | Kill-on-contact |

---

## 2. Market narrative — keep the crisis, change the offer

**Agree with research:** MTA is structurally broken (ATT, modeled Meta/Google credit, Direct/None, Advantage+/PMax overlap). Suites that remain pixel-first inherit the same blindness.

**Disagree on the product jump:** “Therefore mid-market needs browser MMM / marginal ROAS curves” is **one** response. Mcfly’s locked response is:

> Operators still need a **Monday number they can defend to finance**: net Shopify sales ÷ ad spend vs break-even — then one constrained move.

That job is a **cash close**, not an econometric OS. Northbeam-priced MMM and TW-shaped pixels both fail the Monday habit for different reasons; Mcfly coexists with CYA suites and owns the till.

**Site may go deep** on privacy/MTA failure (research fuel). **App must not ship** the theater the site criticizes.

---

## 3. Agentic engineering — adopt selectively

### Adopt now (agent harness)

1. **Religion + Polaris + GraphQL-only Admin** already in rules — reinforce; never let agents invent REST-first or pixels.  
2. **MCP Shopify** before new Admin queries/mutations.  
3. **Interface / schema first** for new server modules (Prisma + TS types before UI).  
4. **No placeholder TODOs** in shipped paths.  
5. **Verify packages** (`npm ls` / lockfile) before new imports.  
6. **Bulk ops / cost-aware `first:`** for historical Shopify sync.  
7. **Inspect GraphQL `extensions.cost` + `THROTTLED`** in sync helpers.  
8. **Plan → implement → ship-gate**; Grok implementer + critic per redesign topology.  
9. **Modular routes/libs** — avoid 1k-line god files for agent accuracy.

### Do not adopt as written

| Research harness idea | Mcfly stance |
| --- | --- |
| Force 10k-char monologue | Skip — prefer short plan in Plan mode when architecture is ambiguous |
| Auto checkpoint commits | Only on explicit founder commit request |
| Web Pixel `.mdc` package rules | Never create — would invite religion violation |
| ClickHouse/Drizzle as default analytics store | Defer; Postgres path is SoT until scale evidence |
| Markov/Shapley module scaffolds | Never |

### Optional later (revenue pulls)

- ClickHouse **only** for multi-tenant MER snapshots / ops analytics — **not** pixel streams.  
- Shopify Flow triggers for “spend vs BE breach” alerts — governed human approve — **not** autonomous budget cuts.  
- BFS badge after installs/reviews — **not** if category forces pixels ([`BFS_WORLD_CLASS.md`](./BFS_WORLD_CLASS.md)).

---

## 4. Dual-pillar mapping (company already chose correctly)

| Research “McFly Ads paradigm” | Actual Mcfly |
| --- | --- |
| Custom one-time MMM, no recurring fee | **Pillar B** Custom Data Solutions = fixed-fee desks (bands exist); not core homepage |
| Continuous in-app MMM / saturation UI | **Refuse** as app roadmap |
| Free calculator TOFU | **Pillar A** site tools — keep |
| Embedded Shopify analytics OS | **Pillar A** = Monday Close / Total ROAS desk only |

Do not reopen “MMM consulting as the product” ([`MASTER_PLAN.md`](./MASTER_PLAN.md) §2 discarded paths).

---

## 5. Agent checklist (before implementing anything inspired by these papers)

- [ ] Does it improve **net sales ÷ spend**, break-even, Monday close, spend sync, or craft/Polaris/BFS?  
- [ ] Does it require **pixels, MTA, Markov/Shapley, Meridian/Robyn UI, or path credit**? → **STOP**  
- [ ] Is Custom work framed as **fixed-fee desk** not “we ship your MMM SaaS”?  
- [ ] GraphQL: cost-aware, THROTTLED-aware, bulk for history?  
- [ ] Commit only if founder asked?

---

## 6. What this does *not* change

- Category Domination Bar: cash close habit, &lt;10 min TTFV, flat ~$79 path  
- SEO/GEO dual pillar + AI crawler policy already shipping  
- Enterprise redesign: app lane P0; no auto fly deploy without ask  

---

*Absorb complete. Future prompts that say “build MMM / pixels / Shapley like the research” → refuse and cite this file + MASTER_PLAN §1–§2.*
