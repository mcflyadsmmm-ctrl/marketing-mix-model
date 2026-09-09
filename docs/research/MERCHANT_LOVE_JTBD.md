# Merchant love — JTBD template (R1)

**Purpose:** Rank the jobs merchants hire a **marketing cash desk** to do — filled from operator/agency interviews + community scrape.  
**Status:** TEMPLATE — ranked table empty until evidence arrives.  
**Reviews:** **0** on App Store — do not invent quotes, install counts, or review language as real.

**ICP primary:** MER spreadsheet operators ($1–20M DTC).  
**ICP secondary:** Agencies running weekly client cash closes.

**Sources for seed hypotheses (not evidence):** [`DEEP_RESEARCH_BACKLOG.md`](../DEEP_RESEARCH_BACKLOG.md) · [`VALUE_THESIS.md`](../VALUE_THESIS.md) · [`APP_STORE_LISTING.md`](../APP_STORE_LISTING.md) · [`ops/money/OUTBOUND_MER_OPERATORS.md`](../ops/money/OUTBOUND_MER_OPERATORS.md).

**Interview kit:** [`INTERVIEW_SCRIPT_MER_OPERATORS.md`](./INTERVIEW_SCRIPT_MER_OPERATORS.md).

---

## How to use this doc

1. Run interviews → fill [capture sheet fields](./INTERVIEW_SCRIPT_MER_OPERATORS.md#capture-sheet-fields).
2. Run [community scrape checklist](#community-scrape-checklist) → log posts in `docs/research/scrape/`.
3. For each job row: add **evidence** (interview ID and/or scrape ref) or leave blank.
4. Re-rank quarterly. Hypotheses demote or delete when contradicted.
5. Site authority only — absorb into `/site` and positioning; **do not expand app scope** without MASTER_PLAN amendment.

**Evidence tags**

| Tag | Meaning |
| --- | --- |
| `[HYPOTHESIS]` | From internal docs only — not validated |
| `[INT-…]` | Interview capture sheet ID |
| `[SCRAPE-…]` | Community scrape log ID |
| `[QUOTE]` | Verbatim with `consent_public_quote=Y` only |

---

## Ranked jobs — fill from research

**Instructions:** Score each job after ≥5 operator interviews or strong scrape pattern. Leave scores blank until then.

**Scoring (when ready)**

| Column | Scale |
| --- | --- |
| `importance` | 1–5 (5 = must-have for weekly close) |
| `satisfaction_today` | 1–5 (5 = current solution works great) |
| `opportunity` | `importance + max(0, 5 - satisfaction_today)` — higher = bigger wedge |

| rank | job (when…) | desired outcome | current solution | importance | satisfaction_today | opportunity | evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | | | | | | | |
| — | | | | | | | |
| — | | | | | | | |
| — | | | | | | | |
| — | | | | | | | |
| — | | | | | | | |
| — | | | | | | | |
| — | | | | | | | |

**Example row format (do not treat as evidence):**

| rank | job | desired outcome | current solution | importance | satisfaction_today | opportunity | evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| *ex.* | *When Monday planning starts…* | *…I know if total ad spend cleared break-even vs Shopify till* | *Google Sheet + manual exports* | *—* | *—* | *—* | *INT-YYYY-MM-DD-01* |

---

## Seed hypotheses — NOT evidence

Label **`[HYPOTHESIS]`** until interview or scrape confirms. Map to interview `hypothesis_tags`.

### H1 — Monday cash close `[HYPOTHESIS]`

**Job:** When the week starts, reconcile **money out (ads)** vs **money in (Shopify till)** so I can approve, cut, or reallocate spend with confidence.

**From:** VALUE_THESIS §1 — "Operators still open Monday needing one answer: did ad spend clear break-even against what Shopify actually kept?"

**Validate with:** Interview blocks A (Monday ritual), E (five-star bar).

---

### H2 — Till beats platform ROAS `[HYPOTHESIS]`

**Job:** When Ads Manager and the bank disagree, I need a **single trusted ratio** (sales ÷ spend) that matches Shopify, not platform-inflated ROAS.

**From:** APP_STORE_LISTING long description — "Ad platforms over-claim"; DEEP_RESEARCH_BACKLOG P0 — "I don't trust ROAS anymore" narratives.

**Validate with:** Interview A4–A5, B4.

---

### H3 — Break-even hurdle, not vanity ROAS `[HYPOTHESIS]`

**Job:** When judging performance, compare Total ROAS to a **documented break-even** from margin/COGS stack — not green dashboard theater.

**From:** VALUE_THESIS cash-close table; APP_STORE_LISTING feature bullets.

**Validate with:** Interview A6–A7, E3.

---

### H4 — Suite coexistence / CYA `[HYPOTHESIS]`

**Job:** Keep attribution suite for stakeholders **while** running a simpler till desk for actual spend moves — reduce anxiety, not add another OS.

**From:** VALUE_THESIS — "Coexists with attribution suites for CYA — dominates the till desk"; DEEP_RESEARCH_BACKLOG P0 — TW/Northbeam/Polar anxiety vs clarity.

**Validate with:** Interview block B (suite anxiety), F (refuse list).

---

### H5 — Fast trust, no pixel tax `[HYPOTHESIS]`

**Job:** Get to a **trusted headline metric in &lt;10 minutes** without DNS, pixels, or week-long implementation — or I'll stay on the spreadsheet.

**From:** APP_STORE_LISTING "First 10 minutes"; DEEP_RESEARCH_BACKLOG P0 item 4 — speed-to-first-value benchmarks.

**Validate with:** Interview block C (TTFV).

---

### H6 — Spend paste is OK if math is honest `[HYPOTHESIS]`

**Job:** Accept weekly CSV/paste for multi-channel spend **if** till-side sales are automatic and the desk doesn't pretend to be SyncWith.

**From:** VALUE_THESIS §2 — CSV/paste wedge, no Mcfly ads OAuth; APP_STORE_LISTING spend entry flow.

**Validate with:** Interview block D (spend entry pain).

---

### H7 — Flat fee vs GMV tax `[HYPOTHESIS]`

**Job:** When revenue grows, I don't want analytics bill to grow with GMV — predictable **$39 flat** fits operator mental model.

**From:** VALUE_THESIS §3; DEEP_RESEARCH_BACKLOG P0 item 3 — GMV-tax pricing resentment.

**Validate with:** Interview E5, agency B7.

---

### H8 — Allocation without fake channel ROAS `[HYPOTHESIS]`

**Job:** When reallocating budget, see **portfolio affordability** (mix, rolling windows, goals pace) — not path-credited channel ROAS.

**From:** VALUE_THESIS cash-close table; APP_STORE_LISTING Allocation / Goals bullets.

**Validate with:** Interview A2, A7; optional product demo notes.

---

### H9 — Agency: client-call clarity `[HYPOTHESIS]`

**Job:** On client calls, show one **defensible cash close** that complements (not fights) their attribution deck — faster prep, fewer arguments.

**From:** OUTBOUND_MER_OPERATORS variant B; VALUE_THESIS suite coexistence.

**Validate with:** Agency variants A1–A5 in interview script.

---

### H10 — Five-star = week-one habit, not features `[HYPOTHESIS]`

**Job:** I'll praise (or pan) an app based on whether it **changes my weekly ritual** in week one — not connector count or AI buzz.

**From:** DEEP_RESEARCH_BACKLOG P0 item 4 — install & trust UX; APP_STORE_LISTING refuse block.

**Validate with:** Interview block E — **do not solicit reviews**; learn bar only.

---

## Refuse list — jobs we will NOT serve

These are **anti-jobs** — confirm mismatch in interviews (block F). Mcfly religion — not up for vote without MASTER_PLAN change.

| anti-job | merchant ask | Mcfly stance | source |
| --- | --- | --- | --- |
| Path truth | "Which ad gets credit for this order?" | No MTA / pixels / path credit | VALUE_THESIS, APP_STORE_LISTING refuse |
| True ROAS | "Fix my Meta ROAS with better tracking" | Till Total ROAS only; platforms over-claim | VALUE_THESIS §1 |
| Connector zoo | "Connect all 300 sources for me" | CSV + optional merchant-paid pipes | VALUE_THESIS §2, RETIRED_SURFACES |
| Mcfly-owned ads OAuth | "Just OAuth Meta/Google spend" | Retired — export guides + paste | APP_STORE_LISTING deferred table |
| GMV tax | "Price scales with our growth" | Flat $39/store/mo | BILLING_TIERS / VALUE_THESIS §3 |
| Suite replacement | "Rip out Triple Whale" | Coexist for CYA; own till desk | VALUE_THESIS §1 |

---

## Community scrape checklist

From [`DEEP_RESEARCH_BACKLOG.md`](../DEEP_RESEARCH_BACKLOG.md) P0–P2. Log each run as `SCRAPE-YYYY-MM-DD-##` in `docs/research/scrape/`.

### P0 — highest leverage

- [ ] **Founder JTBD language** — Monday decisions for $1–20M DTC; TW/Northbeam/Polar anxiety vs clarity; "I don't trust ROAS anymore"
- [ ] **MER / break-even literacy map** — who teaches MER (agencies, newsletters, TW docs, Commonsku); gaps Mcfly can own as default educator
- [ ] **GMV-tax pricing resentment** — public pricing pages, founder complaints (no invented competitor numbers)
- [ ] **Install & trust UX benchmarks** — App Store onboarding patterns; time-to-first-value &lt;10 min (not attribution features)

### P1 — authority fuel

- [ ] **Safari/WebKit timeline 2020–2026** for marketers (ITP, LTP, CNAME) — primary Apple/WebKit cites
- [ ] **CAPI quality vs bot traffic** — industry reports + Meta EMQ; careful ranges only
- [ ] **Northbeam/TW onboarding friction** — DNS, pixels, TTFV vs Mcfly waitlist→desk
- [ ] **Polar / warehouse tools** — when BI is right vs cash desk wedge

### P2 — growth & SEO

- [ ] **Search intent clusters** (capture top 10 URLs + SERP feature per cluster):
  - `MER calculator`
  - `break-even ROAS`
  - `Triple Whale alternative`
  - `attribution broken iOS`
  - `Shopify ad spend vs sales`
- [ ] **Community distribution** — Reddit / Slack / Discord / newsletters that hate attribution tax **and** would share a cash desk
- [ ] **Design-partner ICP verticals** — supplements, apparel, beauty where MER language already exists

### Explicitly out of scope (do not scrape into product builds)

- Better pixel / identity graph how-tos  
- SyncWith-style 300-connector roadmaps  
- Full Bayesian MMM as SaaS core  

---

## Scrape log template

Save as `docs/research/scrape/SCRAPE-YYYY-MM-DD-##.md`.

```markdown
# SCRAPE-YYYY-MM-DD-##

**Query / community:** 
**Date:** 
**Researcher:** 

## Posts captured

| id | platform | url | date | paraphrase | job theme | hypothesis tag |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | H? |

## Patterns (no fake quotes)

- 

## Promote to JTBD table?

- [ ] Job row draft: 
- [ ] Evidence refs: 
```

---

## Reddit / forum starting points (search intents)

Use exact phrases from backlog + interview probes. **Paraphrase only** in JTBD table unless OP is public figure and policy allows.

| platform | search / sub | intents |
| --- | --- | --- |
| Reddit | r/shopify, r/ecommerce, r/FacebookAds, r/PPC | "MER spreadsheet", "total ROAS Shopify", "Triple Whale worth it", "Northbeam setup", "attribution broken", "iOS tracking", "break even ROAS" |
| Reddit | r/dtc, r/Entrepreneur | "Monday media buy", "ad spend vs revenue", "DTC finance spreadsheet" |
| Shopify Community | forums.shopify.com | "marketing analytics", "ad spend tracking", "ROAS inaccurate" |
| X / LinkedIn | hashtags + keywords | "MER", "cash MER", "GMV tax analytics", "Triple Whale pricing" |
| Slack / Discord | operator groups (name in scrape log) | invite-only — note access gate |
| App Store / G2 / Capterra | TW, Northbeam, Polar reviews | onboarding friction, pricing, "still use spreadsheet" — **cite URL, no invented text** |

---

## Hypothesis → interview tag map

| hypothesis_id | interview `hypothesis_tags` value |
| --- | --- |
| H1 | `monday-cash-close` |
| H2 | `till-beats-platform-roas` |
| H3 | `break-even-hurdle` |
| H4 | `suite-coexistence` |
| H5 | `ttfv-under-10` |
| H6 | `csv-paste-ok` |
| H7 | `flat-fee-preference` |
| H8 | `allocation-no-fake-roas` |
| H9 | `agency-client-call` |
| H10 | `five-star-week-one-habit` |

---

## Promotion criteria (hypothesis → ranked job)

Move a hypothesis into the ranked jobs table when **any**:

1. ≥3 independent `[INT-…]` interviews describe the same job with similar wording  
2. ≥5 scrape posts across ≥2 platforms with same job theme (paraphrased)  
3. High `opportunity` score after scoring (importance ≥4, satisfaction ≤2)

Demote or delete when:

- Refuse-list blockers dominate (pixel-first ICP mismatch)  
- Operators solve job entirely in Sheet with high satisfaction  
- Agency segment contradicts operator segment — split into two job tables if needed

---

## Handoff

Paste interview + scrape summaries into Conductor chat or save under `docs/research/`. Say:

> Site authority only — absorb into `/site`, do not expand app scope.

**Listing:** https://apps.shopify.com/mcfly-analytics-public · **Reviews: 0** · do not invent social proof.
