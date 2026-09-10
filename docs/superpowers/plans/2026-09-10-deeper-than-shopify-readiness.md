# Deeper-than-Shopify Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement **one track at a time**. Steps use checkbox (`- [ ]`) syntax. Do **not** implement this whole file in one PR — spawn a focused implementation plan per track when that track starts.

**Goal:** Make Mcfly Analytics unmistakably worth $39/store/mo by shipping only the cash and cohort insights Shopify Analytics does not give — then get the desk review-ready without inventing proof.

**Architecture:** Treat free Shopify Analytics as the floor we refuse to duplicate. Mcfly owns the **till desk**: same-period Shopify sales ÷ merchant-entered spend, break-even from margin, coverage honesty, order-cohort LTV, and a constrained spend call. Frontier models burn tokens on clarity, trust, and those wedge surfaces — never on pixels, MTA, or a second Analytics clone.

**Tech Stack:** Remix/React Router embedded app (`app/`), Prisma + Shopify Admin GraphQL, Fly (`mcfly-analytics`), marketing site on Cloudflare Pages (`site/` → `mcflyads.com`), Vitest honesty/trust tests.

**Related SoT (read, do not fork religion):**
- [`docs/VALUE_THESIS.md`](../../VALUE_THESIS.md) — cash desk, not path credit
- [`docs/research/KILL_SHOT_MATRIX_2026-09.md`](../../research/KILL_SHOT_MATRIX_2026-09.md) — competitor failure modes
- [`docs/research/FRICTION_AUTOPSY.md`](../../research/FRICTION_AUTOPSY.md) — week-1 love killers
- [`docs/research/CAPABILITY_MAP.md`](../../research/CAPABILITY_MAP.md) — what is Strong vs Partial
- [PR #45](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/45) / `cursor/review-ready-finalize-3706` — sales-first listing + Allocation trust + quiet Sample chrome

## Global Constraints

- **Religion:** Total ROAS = Shopify Total Sales (after returns) ÷ spend the merchant entered for the **same period**. Averages only. No pixels, MTA, path credit, “true ROAS,” or Mcfly-owned Meta/Google spend OAuth.
- **Price voice:** 7-day full-access trial → **$39/store/mo** flat. Do not invent reviews, install counts, or App Store proof.
- **Shopify Analytics is free:** If Analytics already answers it well (sessions, conversion rate, top products, live view, basic sales over time), **do not rebuild it**. Demote or remove duplicate chrome.
- **SAMPLE honesty:** Practice data never looks like live cash. Live desk stays quiet (no Sample|Real dual chrome). Practice lives on Demo + Settings.
- **App URL:** `https://mcfly-analytics.fly.dev`. Do not Fly-deploy from dirty Mac `marketing-mix-model` trees.
- **Frontier burn rule:** Tokens go to (1) insight depth on the wedge, (2) copy/IA clarity, (3) trust gates, (4) listing/site coherence — **not** feature zoo, AI chat OS, or connector theater.

---

## 0. Wedge lock — what we sell vs what is free

### Shopify Analytics already gives (do not burn tokens cloning)

| Free in Shopify | Merchant already has |
| --- | --- |
| Sales / orders / AOV over time | Sessions, conversion, online-store funnel |
| Sales by referring channel / marketing | Top products, landing pages |
| Live view, cohorts (basic retention) | Customer reports, RFM-ish views in Admin |

### Mcfly must be the only place for (burn tokens here)

| Insight | Why Analytics cannot replace it | Primary surfaces |
| --- | --- | --- |
| **1. Total ROAS vs break-even** | Analytics has no ad-spend ledger or margin-derived break-even | Overview, Goals, Settings margin |
| **2. Spend coverage honesty** | Missing spend days silently inflate the multiple | Spend, Overview trust banners |
| **3. Platform claimed vs banked** | Ads Manager ROAS ≠ Shopify till | Platform variance / Overview teach |
| **4. Order-cohort LTV / Cash CAC till** | Admin lacks opaque-id cohort till next to spend | LTV |
| **5. Constrained allocation call** | “Shift spend to protect break-even” with floors — not path credit | Allocation |
| **6. Weekend / typical-order operator reads** | Deeper order grain Analytics skips, framed as cash decisions | Overview sales-first spine |
| **7. Monday / period close artifact** | Shareable cash close, not a dashboard tour | Close / Share / ledger export |

### Explicit kill list (refuse even if a model suggests it)

- Pixel / CAPI / “true ROAS” / MTA / identity graph
- Meta/Google spend OAuth owned by Mcfly
- Sessions/funnel clone of Analytics
- Generic LLM chatbot over the desk
- GMV-scaled pricing, forever-free bait, invented social proof
- Hiding nav tabs when SAMPLE is off (felt broken before)

---

## 1. Readiness definition (“ready”)

Ready for **review asks** means all of:

1. **Trust:** Untrusted $0 never paints as live cash (Overview + Allocation + exports). SAMPLE cannot be mistaken for the store.
2. **TTFV:** Cold merchant reaches a useful sales-first Overview in one open; spend is optional until they want Total ROAS.
3. **Wedge clarity:** First viewport answers a question Analytics cannot — not “another sales chart.”
4. **Listing/site:** Sales-first paste pack + mcflyads.com match the desk; no Sample-vs-Live feature framing.
5. **Human gates only left:** Partner distribution, PCD, emergency contact, install smoke on real store, assets — not agent craft debt.

Not ready if: dual Sample/Live chrome returns, Allocation advises on untrusted zeros, Overview duplicates Analytics without a cash job, or listing promises path credit.

---

## 2. Track map (implement as separate plans)

```text
Track A  Trust + quiet chrome     ──┐
Track B  Sales-first Overview wedge ├──► Track E  Listing/site truth
Track C  Spend tax ↓ (CSV craft)  ──┤
Track D  LTV + Allocation depth   ──┘
                    │
                    ▼
            Track F  Review-ready ship + human gates
```

Frontier fleet default: **one track = one implementer + one critic**, religion file attached every time.

---

### Track A — Trust + quiet chrome (foundation)

**Why first:** Without trust, deeper insights look like lies.

**Files (expected):**
- Modify: `app/app/components/DataModeBar.tsx` (already quiet on live — keep it)
- Modify: `app/app/routes/app.allocation.tsx` + trust helpers (untrusted-$0 gate)
- Modify: `app/app/lib/mer-trust.ts`, Overview trust banners
- Test: `app/app/lib/*trust*.test.ts`, `docs/ops/SMOKE_UNTRUSTED_ZERO.md`
- Site: `site/pricing.html`, `site/demo.html` — no Sample-vs-Live product framing; ship via Cloudflare Pages

**Acceptance:**
- [ ] Live desk shows no Sample|Real dual toggle
- [ ] SAMPLE on → warning + exit only; Demo/Settings own practice
- [ ] Allocation never recommends on untrusted $0
- [ ] mcflyads.com `/pricing` + `/demo` match repo (needs `CLOUDFLARE_API_TOKEN` Pages deploy)
- [ ] Smoke checklist in `docs/ops/SMOKE_UNTRUSTED_ZERO.md` manually passable on a real store

**Frontier burn:** Critic pass on every trust banner string — “would a merchant think this is live cash?”

---

### Track B — Sales-first Overview that Analytics cannot steal

**Job:** First open teaches **order economics Analytics skips**, then optionally invites spend for Total ROAS.

**Files (expected):**
- Modify: `app/app/routes/app._index.tsx` (Overview)
- Modify: `app/app/components/CashTrustBanners.tsx`, hero compact, FirstSessionGuide
- Modify: `app/app/lib/first-session-path.ts`, `product-labels.ts` / `cash-desk-copy.ts`
- Test: `app/app/lib/cash-desk-ux.test.ts`, desk honesty tests

**Build (in order):**
1. **Hero question (one):** e.g. “What does a typical order look like — and are weekends carrying the till?” — not a sales sparkline clone.
2. **Three wedge tiles max** above the fold when spend is empty: typical order / weekend vs weekday / new vs returning sales share (order-backed only).
3. **Spend optional CTA:** “Add spend to unlock Total ROAS vs break-even” — never block Overview.
4. **When spend trusted:** swap hero to Total ROAS vs break-even + one cash verdict sentence; demote Analytics-redundant charts.
5. **Kill:** any Overview block that only restates Admin → Analytics without a Mcfly-only twist.

**Acceptance:**
- [ ] Cold install (no spend) still feels valuable in &lt;2 minutes
- [ ] With trusted spend, first viewport is Total ROAS vs break-even, not a dashboard
- [ ] No sessions/conversion clone
- [ ] Copy passes “Brand test”: remove nav — still clearly Mcfly cash desk

**Frontier burn:** Parallel copy critiques (clarity vs honesty); one implementer for IA; one visual craft pass only after copy locks.

---

### Track C — Spend tax collapse (habit unlock)

**Job:** Make entering spend cheaper than the merchant’s Monday sheet — without OAuth.

**Files (expected):**
- Modify: `app/app/routes/app.spend.tsx`
- Modify: `app/app/lib/spend-quick-day.ts`, import parsers, coverage copy
- Test: spend-day / repository tests

**Build (in order):**
1. **First day celebration, not 27-hole shame** — soften coverage tone until ≥3 days or merchant opts into full-strip audit ([FRICTION_AUTOPSY](../../research/FRICTION_AUTOPSY.md) F2).
2. **One-row typed path** remains primary; CSV second; playbook third.
3. **Coverage language in cash:** “Missing days make Total ROAS look better than cash” — never “sync broken.”
4. **Refuse** Meta/Google OAuth; improve export recipes only.

**Acceptance:**
- [ ] First typed day does not greet with critical 27-missing wall
- [ ] SAMPLE blocks live writes with one clear exit
- [ ] Merchant can land trusted MTD Total ROAS with ≤10 minutes of spend work

**Frontier burn:** UX microcopy + empty-state variants A/B in code comments only — ship one winner, delete the rest.

---

### Track D — LTV + Allocation depth (stay reasons)

**Job:** Depth that justifies staying after Total ROAS clicks.

**Files (expected):**
- Modify: `app/app/routes/app.ltv.tsx`, `app/app/routes/app.allocation.tsx`, `app/app/routes/app.goals.tsx`
- Modify: cohort / allocation libs under `app/app/lib/`
- Test: allocation trust tests, LTV empty-state honesty

**Build (in order):**
1. **LTV:** Day-one empty states that teach (history grant, backfill) without looking broken; Cash CAC only when spend exists; never email CRM.
2. **Allocation:** Render the constrained recommendation card that math already supports — cut/keep language with “keep ≥ half of period spend” floor; hard-lock when coverage/margin fails.
3. **Goals:** No unconfirmed `3.00×` painting red/green truth ([FRICTION F4/F6](../../research/FRICTION_AUTOPSY.md)).

**Acceptance:**
- [ ] Allocation page states a concrete cut/keep call when trusted — or an explicit lock reason
- [ ] LTV never implies path credit or email CRM
- [ ] Goals never treat default target as merchant-confirmed

**Frontier burn:** Math critic (unit tests) before UI critic; refuse causal language in copy review.

---

### Track E — Listing + site truth (distribution)

**Job:** Public story matches desk; no fake proof.

**Files (expected):**
- Modify: `docs/ops/LISTING_*PASTE*.md`, `site/*.html` (product/pricing/demo/faq)
- Deploy: Cloudflare Pages `mcflyads` (token required); Fly already hosts app

**Build:**
1. Sales-first listing paste locked (PR #45 Lane B).
2. Site hero: brand + one wedge sentence + one CTA — no Sample-vs-Live feature compare.
3. Screenshots via listing-capture mode (`?shot=1`) — live chrome, SAMPLE numbers OK if labeled in Partner notes only as needed.
4. **Never** invent reviews or install counts.

**Acceptance:**
- [ ] Partner paste pack is copy-paste ready
- [ ] mcflyads.com `/demo` `/pricing` `/product` coherent with desk
- [ ] Listing claims ⊆ shipped capabilities in CAPABILITY_MAP

---

### Track F — Review-ready ship (merge of gates)

**Job:** Agent craft closed; only human Partner steps remain.

**Checklist:**
- [ ] Merge PR #45 (or successor) to deploy branch used for Fly
- [ ] Fly smoke: health + untrusted-$0 + SAMPLE off path on smoke store
- [ ] Pages deploy for site
- [ ] Human: Distribution, PCD Level 1, emergency contact, install smoke sample OFF, assets, Submit
- [ ] Rotate any tokens pasted in chat (GitHub / Fly)

**Exit:** Founder can ask for reviews with a desk that already delivers Analytics-plus cash insight — not a promise.

---

## 3. How to burn frontier-model tokens (operating system)

| Burn | Do | Do not |
| --- | --- | --- |
| **Insight design** | Force every Overview/LTV/Allocation block through the wedge table in §0 | “What else could we show?” brainstorms |
| **Copy** | One sentence cash job + honesty clause | Feature tours, Sample-vs-Live marketing |
| **Trust** | Dual agent: implementer + hostile critic on $0 / SAMPLE / coverage | Single agent “looks good” |
| **Code** | Small PRs per track; Vitest honesty first | Mega-refactors across all tabs |
| **Visual** | Atmosphere + hierarchy on marketing; Polaris discipline in-app | Purple glow / dashboard collage heroes |
| **Research** | Kill-shot vs TW/Northbeam: cash close speed | Attribution literature rabbit holes |

**Fleet recipe (repeatable):**
1. Attach this plan + VALUE_THESIS + FRICTION_AUTOPSY.
2. Assign **one track**.
3. Implementer writes failing trust/UX test → minimal code → pass.
4. Critic only answers: *Does this duplicate free Analytics? Does it lie? Does it raise TTFV?*
5. Commit + push; no deploy unless founder grants.

---

## 4. Priority order for the next agent sessions

| Order | Track | Outcome |
| --- | ---: | --- |
| 1 | **A** finish | Trust + Pages site ship (CF token) |
| 2 | **B** | Overview wedge Analytics cannot steal |
| 3 | **C** | Spend tax ↓ so Total ROAS habit sticks |
| 4 | **D** | Allocation recommendation + LTV empty honesty |
| 5 | **E/F** | Listing truth + human submit gates |

Do not start Track D chrome polish while Track B still reads like a second Analytics.

---

## 5. First concrete implementation plan to spawn next

When execution starts, create:

`docs/superpowers/plans/2026-09-10-track-b-overview-wedge.md`

…with TDD tasks for Overview hero + three sales-first tiles + spend-optional CTA, exact file hunks, and Vitest assertions that **forbid** sessions/conversion widgets.

Track A residual (Pages deploy + any remaining trust gaps) can be a short sibling plan if CF token arrives.

---

## 6. Self-review (plan quality)

| Spec intent | Covered by |
| --- | --- |
| Deeper than free Shopify Analytics | §0 wedge + kill list + Track B/D |
| Significant improvements, ready | §1 readiness + Tracks A–F |
| Frontier models / token burn | §3 operating system |
| No fake proof / religion | Global Constraints + Track E |

No placeholders for religion, price, or kill list. Granola MCP was unavailable (needs auth) — re-check meeting decisions when auth is on if product calls change.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-deeper-than-shopify-readiness.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — Fresh subagent per track (start Track B after A residual), review between tracks  
2. **Inline Execution** — This session executes one track with checkpoints  

**Which approach — and should we start with Track A residual (Cloudflare site ship) or Track B (Overview wedge)?**
