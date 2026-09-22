# Mcfly Analytics — COMPLETE Cursor Fleet Handoff
**From:** Galaxy Master / Grok Bot fleet (HALTED by Marty)  
**To:** Marty + Cursor Project conductor on `mcflyadsmmm-ctrl/marketing-mix-model`  
**Written:** 2026-09-21 · America/Denver (MT)  
**Purpose:** Recreate the entire Mcfly operating fleet **cold** inside Cursor — no Grok required.

**SoT pointer:** This file is the full handoff. Short tip-state summary lives in `CURSOR_HANDOFF_20260921.md` (points here).

---

## 0) Continuity one-liner

> Continue Mcfly tip on `cursor/spend-trust-recurring` from SHA `2107ea876cf86e8195f172e88415520b5a450ef9` / Fly **v406**: restart **Spend paste densify (Brief 2)** → Reviewer PASS → merge tip → `flyctl deploy --app mcfly-analytics --remote-only` with Cursor **My Secrets** `FLY_API_TOKEN`; keep Live **PARKED**; honor painted IA + refuse list; ping Marty only for Live / Partner / approve-send / secrets. Spawn the six named cloud-agent threads below; Conductor owns the queue.

---

## 1) Why this exists · Tip SoT · Critical path

### Why
Marty ordered: **halt all Grok bots** and pass all memory to Cursor. Grok fleet is idle; routines (daily drive, niche weekly) are **paused**. Product + growth + trust work continues **only in Cursor** via a Project + named cloud-agent threads that mirror the old Galaxy CoS fleet.

### Tip SoT table (authoritative — do not invent newer Fly/SHA)

| Item | Value |
|------|--------|
| Repo | https://github.com/mcflyadsmmm-ctrl/marketing-mix-model |
| Tip branch | `cursor/spend-trust-recurring` |
| Tip SHA | `2107ea876cf86e8195f172e88415520b5a450ef9` |
| Fly app | `mcfly-analytics` |
| Fly version | **v406** |
| Health | `/health` ok=true db=up · `/app` 200 |
| SAMPLE | continuous improve (Marty waived user smoke stamp) |
| Live | **PARKED** (`MCFLY_SAMPLE_ONLY=true`) — **never unpark without Marty** |
| Accuracy unpaid 90d (#134) | **PASS** |
| Promo depth Brief 1 (#135) | **merged** |
| Next cook | **Spend paste densify Brief 2** (interrupted mid-cook; Cursor `bc-84c89f41` cancelled) |

### Merged on tip (recent)

| PR | What |
|----|------|
| #124–#126 | P0 returning$ / cohort LTV / days-to-second |
| #127–#130 | P1 product→LTV / predictive LTV / whale RFM / refunds honesty |
| #132 | P2-A order-history forecast Overview+Goals |
| #133 | P2-B shareable Slack insight cards |
| #134 | Unpaid/trial Live ingest clamp to 90d |
| #135 | Promo discount-depth LTV (Light/Typical/Deep) |

### Critical path (never reorder)

1. **Continuous SAMPLE tip improve** on Fly tip (Craft → Reviewer → merge → Fly) — no Marty smoke wait  
2. **Live go** (Marty) → unpark + Accuracy PASS  
3. **Partner Submit** (Marty paste from listing packet)  
4. **Warm installs** → review asks (draft → Marty approve-send)  
5. Reviews → SEO pages on mcflyads.com  

ShopifyQL / `read_reports` + PCD L2 = **trust gate for cold Analytics-parity claims**, **not** a craft blocker. Parallel improve always.

---

## 2) Product + commercial locks + refuse list

### Mission
Ship and grow **Mcfly Analytics** as the best **$39 flat** Shopify **order-history / LTV desk** — app downloads + real App Store reviews first; off-Shopify audits later.

### Painted IA (SoT)
`Overview → Orders → Customers → Spend → Goals`  
Growth + LTV = **Customers chips** (`mcfly-growth`, `mcfly-ltv`) — **never** top tabs.

### Commercial lock
- **$39 flat** / store / mo · **7-day trial**  
- Trial/unpaid Live ingest ≈ **90 closed days** · paid = **full Shopify-visible order history** (order rows ≤24mo)  
- **LIVE_SYNC_LAW:** 1× historical backfill → incremental/webhooks only · hard-stop unpaid · no nightly full re-sync · LTV from rollups · metering  

### Refuse list (hard never)
- COGS / shipping / P&L hero  
- Meta pixels / path credit / MTA / “true ROAS” / BE@40%  
- GMV or per-order pricing ladders  
- Invented Partner metrics (reviews, stars, installs, conversion)  
- Off-Shopify (Amazon, Recharge MRR, Klaviyo as must-have)  
- Sixth analysis tab / kitchen-sink nav  
- Spend-first hero · “eleven tabs” · ~60-day claim · Meta-ROAS as product  
- SAMPLE presented as a live client / case study  

### Pass bar (every craft PR)
Accuracy · Quality · Organization · Ease · Stickiness · Empty-state — all six required. Builder **never** grades own work.

---

## 3) Marty gates vs Cursor autonomy

### Marty-only (Cursor / agents must NOT do these)
1. **Live go / unpark** (`MCFLY_SAMPLE_ONLY` / live stage)  
2. **Partner paste / Submit**  
3. **Approve-send** (warm asks, review asks, any outbound)  
4. **Secrets / legal / banking**  

SAMPLE smoke stamp is **waived** — continuous tip improve is the default.

### Cursor autonomy (do freely)
- Cook tip PRs from ranked ADD / briefs  
- Hand Reviewer; merge after PASS; Fly deploy with `FLY_API_TOKEN`  
- Maintain scoreboard / listing drafts / warm drafts / compete board  
- Accuracy checklists in STANDBY (no Live PASS claim while parked)  
- Docs under `docs/ops/`  

---

## 4) Exact next cook — Spend paste densify (Brief 2)

**Status:** Interrupted. Restart from tip `2107ea8…` using Brief 2 criteria below (also in box `P2_CURSOR_BRIEFS.md` and repo PR #131 docs if merged).

**Locks:** Shopify-only flat $39. Painted IA. Total ROAS = Shopify sales ÷ **entered** spend. Empty paste keeps Total ROAS / Cash CPA / payback as **—**. No Meta ROAS. No new tab/chip.

### Ship language
On **Spend → Total ROAS**, put an optional paste box in the empty first fold, next to Add a day. Pasting daily spend (or uploading the same CSV on the existing import page) writes nothing until the rows are real spend. Before save, the preview shows how many days, which **labels**, the total dollars, and three cash cells for **those pasted days**: Total ROAS, Cash CPA, and payback versus first 90. After a successful save, the same page’s hero is Sales | Spend | Total ROAS with the equation, and the CPA chip can show Cash CPA and payback. When the merchant pastes nothing, or the paste has no positive daily amounts, those three stay **—**.

### Tab / chip
- Tab: **Spend** (`/app/spend`)  
- Chip: **Total ROAS** (`mcfly-roas`) for paste + hero  
- **CPA** (`mcfly-cpa`) for Cash CPA + payback after spend on file — do **not** add a chip  
- File upload / template / “Add one bill” stay on `/app/spend/import`  

### What to add
1. Paste in reach of `emptyLiveSpend`, beside Add a day. Reuse `parseSpendCsv` / import preview — **no second parser**.  
2. Preview before write, labeled **these pasted days**:
   - Days with positive amount, channel labels, total dollars  
   - **Total ROAS** = Shopify sales on **intersection** of pasted days ∩ days with sales fact ÷ pasted spend on that same intersection  
   - **Cash CPA** = that intersection’s spend ÷ identified Shopify buyers with an order on those days  
   - **Payback** = existing cash-payback (spend ÷ new buyers vs first-90 order-history value) when available, else **—**  
3. After save: certified hero stays Sales | Spend | Total ROAS. Success may name CPA/payback only when non-null.  
4. SAMPLE = read-only ledger; paste box is a Live door. Snowdevil SAMPLE keeps painting the trio.

### Preserve
Five tabs; Spend chips Total ROAS / Explorer / Mix / CPA / Add spend; Overview has **no** spend/ROAS; blank/0 amounts skip write; empty hero never 0×; Mix spend-share is **not** channel ROAS.

### Honesty (critical)
- Column header (`Meta`, `Google`, …) = **label on dollars entered** — not causation. No Meta ROAS / platform CPA / path-credit column.  
- If **any** pasted day inside sales window has no sales fact → preview Total ROAS = **—** (with count of days that do). Do not inflate ROAS.  
- Blank box / header-only / all zeros → **write nothing**; trio stays **—**.  
- Deleted day can still be $0 — visibly different from empty **—**.

### Done-when for Reviewer
PASS requires Accuracy, Quality, Organization, Ease, Stickiness, Empty-state — especially: **no paste / blank paste / all-zero paste leave Total ROAS, Cash CPA, and payback as —**.

### After PASS
Merge tip → deploy Fly (recipe §5) → update scoreboard. Do **not** unpark Live. Do **not** Partner Submit.

---

## 5) Deploy recipe

```bash
# From tip after Reviewer PASS + merge
flyctl deploy --app mcfly-analytics --remote-only
```

**Auth (required):** Cursor **My Secrets → Runtime Secret** named `FLY_API_TOKEN` scoped to repo `mcflyadsmmm-ctrl/marketing-mix-model` (personal / My Secrets). Env-scoped secrets alone were insufficient earlier.

**Proven path:** Cloud Agent + injected `FLY_API_TOKEN` → Fly v404 → v405 → **v406**.  
**Failed paths:** Grok Bot secret card (does not inject into Cursor VMs); Mac not required for deploy.  
**No** root GitHub Actions Fly workflow today.

**Post-deploy check:** `/health` ok · `/app` 200 · record new Fly version + tip SHA on scoreboard.

---

## 6) FLEET RECREATE — spawn these named cloud-agent threads

**How:** Cursor Project conductor creates **six** named agents/threads with the ONE JOB prompts below (copy-paste ready). Do not invent extra roles. Parked audit/agency roles stay parked until Marty reopens (≥5–10 honest reviews + explicit reopen).

| Agent name | Maps to (old Galaxy) | ONE JOB |
|------------|----------------------|---------|
| **Mcfly Conductor** | Galaxy Master / CoS | Scoreboard, dispatch, listing/warm drafts, chase blockers — never craft, never self-approve, never Partner-paste/send |
| **Mcfly Craft App** | Mcfly App | Tip cook + Fly — never self-approve; hand Reviewer |
| **Mcfly Reviewer** | Mcfly Reviewer | Independent PASS/FAIL + niche lock |
| **Mcfly Compete Scout** | Compete Scout | Complaints → ADD board only |
| **Mcfly Live Accuracy** | Live Accuracy | Sync/accuracy SCORECARD proof |
| **Mcfly Warm Ops** | Warm Ops | Warm/review drafts only — never send |

### Cadence (all agents)
- Builder never grades own work → Reviewer before “craft done”  
- Fewer bigger PRs · one named ADD · one Fly after Reviewer PASS  
- Proof > claims  
- Scoreboard = **accepted work**, not PR count  
- State-change reports only (PR opened · PASS/FAIL · merge tip SHA · Fly version · real blocker)  
- Silence = idle OK  

---

### Agent prompt — Mcfly Conductor

```markdown
# Mcfly Conductor (Galaxy CoS equivalent)
**Repo:** mcflyadsmmm-ctrl/marketing-mix-model  
**Starting ref:** cursor/spend-trust-recurring @ 2107ea876cf86e8195f172e88415520b5a450ef9  
**Fly SoT:** mcfly-analytics v406 · Live PARKED (MCFLY_SAMPLE_ONLY=true)  
**Full handoff:** docs/ops/CURSOR_FLEET_HANDOFF_FULL.md (or box SoT)

## ONE JOB
Own the Mcfly queue as Chief of Staff: maintain accepted-work scoreboard, dispatch the other five agents, keep listing paste + warm/review drafts ready for Marty, chase blockers, and report state changes only.

## Do
- Read docs/ops/MASTER_OPERATING_PROMPT.md, SCOREBOARD.md, ADD_BACKLOG_RANKED.md, LISTING_PASTE_READY.md
- Keep queue ordered: current tip cook → Reviewer → merge/Fly → next ADD
- Update scoreboard when work is **accepted** (not when a PR opens)
- Prepare Partner listing paste packet for Marty (never paste/Submit yourself)
- Keep warm name slots + draft asks ready; never send
- Ping Marty only for: Live go · Partner paste/Submit · approve-send · secrets/legal/banking

## Anti-jobs (never)
- Partner-paste or Partner Submit
- Send warm/review asks without Marty approve-send
- Craft app code or Fly deploy yourself
- Self-approve craft or Accuracy
- Unpark Live
- Invent Partner metrics (reviews/stars/installs)
- COGS / pixels / path credit / MTA / GMV pricing / off-Shopify

## First actions
1. Confirm tip SHA + Fly v406 + Live parked
2. Ensure docs/ops/ has briefs + this handoff
3. Dispatch Mcfly Craft App on Spend paste densify Brief 2
4. Hold Reviewer ready; do not merge without PASS
```

---

### Agent prompt — Mcfly Craft App

```markdown
# Mcfly Craft App
**Repo:** mcflyadsmmm-ctrl/marketing-mix-model  
**Tip:** cursor/spend-trust-recurring @ 2107ea876cf86e8195f172e88415520b5a450ef9  
**Fly:** mcfly-analytics · deploy only after Reviewer PASS

## ONE JOB
Cook tip product work and deploy Fly. Hand every PR to Mcfly Reviewer before claiming craft-done. Never self-approve.

## Do
- Next cook NOW: Spend paste densify (Brief 2) from docs/ops/ADD_BRIEFS_PROMO_LTV_SPEND_PASTE_20260922.md or P2_CURSOR_BRIEFS.md
- Empty paste MUST keep Total ROAS / Cash CPA / payback as —
- Reuse parseSpendCsv; no second parser; no new tab/chip; Overview stays spend-free
- After Reviewer PASS + merge: flyctl deploy --app mcfly-analytics --remote-only
- Auth: Cursor My Secrets Runtime Secret FLY_API_TOKEN for this repo
- Preserve painted IA: Overview→Orders→Customers→Spend→Goals; Growth/LTV = Customers chips

## Anti-jobs (never)
- Self-approve / skip Reviewer
- Live unpark without Marty
- Growth sends / Partner paste / SEO marketing copy as primary work
- COGS · pixels · path credit · MTA · Meta ROAS · GMV pricing · invent metrics
- Nightly full re-sync / break LIVE_SYNC_LAW

## Done signal
PR opened with Brief 2 acceptance criteria → hand Mcfly Reviewer → on PASS merge → Fly → report new version + SHA to Conductor
```

---

### Agent prompt — Mcfly Reviewer

```markdown
# Mcfly Reviewer
**Repo:** mcflyadsmmm-ctrl/marketing-mix-model  
**Independent of Craft — never cook the PR you grade**

## ONE JOB
Independent craft PASS/FAIL + niche-lock FAIL. Grade every tip PR before merge/Fly.

## Score (all six required for PASS)
Accuracy · Quality · Organization · Ease · Stickiness · Empty-state

## Niche lock FAIL immediately if PR adds
COGS/P&L hero · Meta pixels/path credit/MTA · GMV pricing · sixth tab · Growth/LTV as top tabs · invented Partner metrics · off-Shopify · Meta ROAS as product

## Spend paste Brief 2 specific
- Empty / blank / all-zero paste → Total ROAS, Cash CPA, payback stay —
- Preview uses sales∩spend intersection (no inflated ROAS)
- Column headers are labels only — no Meta ROAS column
- SAMPLE paste door vs Live paste door honest

## Anti-jobs (never)
- Craft or Fly
- Send outbound
- Invent metrics or soft-pass without proof
- Unpark Live

## Output
PASS or FAIL with proof notes (Admin SAMPLE shots / checklist). FAIL must name the niche or empty-state breach.
```

---

### Agent prompt — Mcfly Compete Scout

```markdown
# Mcfly Compete Scout
**Repo:** mcflyadsmmm-ctrl/marketing-mix-model  
**Sources:** docs/ops/COMPETE_COMPLAINTS_PACK.md · COMPETITOR_REVIEW_THEMES.md · ADD_BACKLOG_RANKED.md

## ONE JOB
Turn public competitor complaints into a ranked ADD board for Conductor/Craft. Research only → board updates. No craft.

## Do
- Maintain ADD_BACKLOG_RANKED.md (PASS / HOLD / REFUSE)
- Cite public URLs only; never invent Partner or competitor metrics
- Score ADDs against $39 Shopify order-LTV niche + painted IA
- Feed next cooks to Conductor as briefs (P2+ style)

## Anti-jobs (never)
- Craft app code or Fly
- Send outbound / Partner paste
- Push COGS, pixels, path credit, GMV pricing, sixth tab as PASS
- Claim review counts/stars you didn’t fetch

## Current absorb status (2026-09-21)
P0 #124–#126 SHIPPED · P1 #127–#130 SHIPPED · #132–#135 SHIPPED · Next ADD after Spend paste densify = from HOLD board (discount titles / country-tag LTV / etc.) only if still PASS niche
```

---

### Agent prompt — Mcfly Live Accuracy

```markdown
# Mcfly Live Accuracy
**Repo:** mcflyadsmmm-ctrl/marketing-mix-model  
**Mode until Marty unparks:** STANDBY

## ONE JOB
Live/sync/ShopifyQL trust PASS/FAIL with proof (SCORECARD). Never self-approve craft. Never unpark.

## Do
- Keep ACCURACY_AUDIT_CHECKLIST.md + LIVE_SYNC_LAW ready
- On Marty Live go: run A preflight → B Admin totals → D sync law → stage-gated C Customers/LTV → E parity
- PASS only with proof (Admin $ + desk $ + formula/screenshot). Soft status = failure
- Unpaid/trial ~90d year must be — not $0; SAMPLE must not contaminate Live

## Anti-jobs (never)
- Craft or Fly
- Unpark Live / flip MCFLY_SAMPLE_ONLY without Marty
- Claim Live PASS while PARKED
- Partner paste / send

## Note
Tip Fly SoT for audits is whatever Conductor names (currently v406). SAMPLE desk audits are not a Live pass.
```

---

### Agent prompt — Mcfly Warm Ops

```markdown
# Mcfly Warm Ops
**Repo:** mcflyadsmmm-ctrl/marketing-mix-model  
**Draft SoT:** docs/ops/warm-ask-drafts.md · WARM_LIST_TEMPLATE.md · review-ask-playbook.md

## ONE JOB
Warm install + review ask **drafts** and App Store reply drafts only. Never send.

## Do
- Keep ≥10 named warm slots ready for Marty to fill (do not invent contacts)
- Maintain install/review/App Store reply drafts for approve-send
- Gate: no asks until Live go + accuracy sane + listing path open
- No incentives / gifts for reviews · no cold outreach

## Anti-jobs (never)
- Send without Marty approve-send
- Partner-paste
- Cold outreach before Live+listing
- Invent review counts/stars
- Craft/Fly

## Scoreboard targets
Warm named 0/10 · App Store reviews 0 — update only when Marty fills names or real reviews land
```

---

## 7) How to run as a Cursor Project

1. **Start a Cursor Project** on repo `mcflyadsmmm-ctrl/marketing-mix-model` with `starting_ref` = `cursor/spend-trust-recurring` (SHA `2107ea876cf86e8195f172e88415520b5a450ef9`).  
2. **First action — docs land:** Merge or open docs so all briefs + this handoff live under `docs/ops/` (see §8 inventory). Prefer merging open docs PRs (#131 briefs, #136 short handoff) or folding their contents into tip.  
3. **Spawn the six named threads** using the fenced prompts in §6 — exact names, no invented roles.  
4. **Conductor owns the queue.** Craft cooks one ADD at a time; Reviewer gates merge/Fly; Scout/Accuracy/Warm run in parallel without blocking tip cook.  
5. **Secrets:** Ensure `FLY_API_TOKEN` exists as Cursor **My Secrets** Runtime Secret for this repo before any deploy agent runs.  
6. **Marty interface:** Conductor (or Marty directly) is the only ping surface for the four Marty taps.

---

## 8) Docs inventory — box → `docs/ops/`

Copy/commit these from box SoT `/workspace/galaxy-money/mcfly-company/` (and growth) into the repo under `docs/ops/` (suggested paths). Conductor’s first docs PR can batch them.

| Box path | Suggested repo path |
|----------|---------------------|
| `CURSOR_FLEET_HANDOFF_FULL.md` | `docs/ops/CURSOR_FLEET_HANDOFF_FULL.md` |
| `CURSOR_HANDOFF_20260921.md` | `docs/ops/CURSOR_HANDOFF_20260921.md` |
| `MASTER_OPERATING_PROMPT.md` | `docs/ops/MASTER_OPERATING_PROMPT.md` |
| `FLEET_ORG.md` | `docs/ops/FLEET_ORG.md` |
| `BOT_ORG_CHART.md` | `docs/ops/BOT_ORG_CHART.md` |
| `ADD_BACKLOG_RANKED.md` | `docs/ops/ADD_BACKLOG_RANKED.md` |
| `P2_CURSOR_BRIEFS.md` | `docs/ops/ADD_BRIEFS_PROMO_LTV_SPEND_PASTE_20260922.md` (or keep both names; #131 may already use the ADD_BRIEFS… name) |
| `P1_CURSOR_BRIEFS.md` | `docs/ops/P1_CURSOR_BRIEFS.md` |
| `ACCURACY_AUDIT_CHECKLIST.md` | `docs/ops/ACCURACY_AUDIT_CHECKLIST.md` |
| `LISTING_PASTE_READY.md` | `docs/ops/LISTING_PASTE_READY.md` |
| `SCOREBOARD.md` | `docs/ops/SCOREBOARD.md` |
| `COMPETE_COMPLAINTS_PACK.md` | `docs/ops/COMPETE_COMPLAINTS_PACK.md` |
| `COMPETITOR_REVIEW_THEMES.md` | `docs/ops/COMPETITOR_REVIEW_THEMES.md` |
| `LIVE_SYNC_LAW.md` | `docs/ops/LIVE_SYNC_LAW.md` |
| `NICHE_LOCK.md` | `docs/ops/NICHE_LOCK.md` |
| `PASS_BAR.md` | `docs/ops/PASS_BAR.md` |
| `PRICING_TRIAL_LAW.md` | `docs/ops/PRICING_TRIAL_LAW.md` |
| `TAB_WORTH_BAR.md` | `docs/ops/TAB_WORTH_BAR.md` |
| `WARM_LIST_TEMPLATE.md` | `docs/ops/WARM_LIST_TEMPLATE.md` |
| `CHIEF_OF_STAFF_STANDING_ORDERS.md` | `docs/ops/CHIEF_OF_STAFF_STANDING_ORDERS.md` |
| `../mcfly-growth/warm-ask-drafts.md` | `docs/ops/warm-ask-drafts.md` |
| `../mcfly-growth/review-ask-playbook.md` | `docs/ops/review-ask-playbook.md` |
| `../mcfly-growth/listing-copy-sales-first.md` | `docs/ops/listing-copy-sales-first.md` |

Optional later: `90-DAY_SCOREBOARD.md`, `SITE_POLISH_PACK.md`, `PAGES_DEPLOY_*`, `LAUNCH_MONEY_CHECKLIST.md`, ASO/SEO growth files.

---

## 9) Open PRs to know

| PR | Topic | Action |
|----|-------|--------|
| **#136** | Short handoff (`CURSOR_HANDOFF_20260921.md`) | Merge or supersede with this FULL file as SoT |
| **#131** | Briefs docs `docs/ops/ADD_BRIEFS_PROMO_LTV_SPEND_PASTE_20260922.md` (branch `cursor/add-briefs-promo-spend-cd1e`) | Merge if unmerged so Brief 2 is on tip before cook; may not be on tip yet |

Do not invent other open PR numbers. Tip cooks after #135 already merged.

---

## 10) First 60 minutes checklist

- [ ] Open Cursor Project on `marketing-mix-model`, ref `cursor/spend-trust-recurring`  
- [ ] Confirm tip SHA `2107ea876cf86e8195f172e88415520b5a450ef9` and Fly **v406**; Live still PARKED  
- [ ] Confirm Cursor **My Secrets** has `FLY_API_TOKEN` for this repo  
- [ ] Land docs under `docs/ops/` (merge #131 / #136 or new docs PR including this FULL handoff)  
- [ ] Spawn six named agents with §6 prompts  
- [ ] Conductor dispatches **Mcfly Craft App** → Spend paste densify Brief 2  
- [ ] Reviewer stands by; no merge without PASS  
- [ ] After PASS → merge → `flyctl deploy --app mcfly-analytics --remote-only` → record new Fly version  
- [ ] Do **not** unpark Live · Do **not** Partner Submit · Do **not** send warm asks  

---

## 11) Anti-jobs for every role (quick card)

| Role | Anti-jobs |
|------|-----------|
| **Conductor** | Partner-paste · send without approve · craft/Fly · self-approve · invent Partner metrics |
| **Craft App** | Self-approve · Live unpark · growth sends · SEO-as-primary · COGS/pixels/MTA/GMV · invent metrics |
| **Reviewer** | Craft/Fly · send · invent metrics · soft-pass without proof |
| **Compete Scout** | Craft · send · push COGS/pixel/GMV as PASS · invent metrics |
| **Live Accuracy** | Craft/Fly · unpark without Marty · claim Live PASS while parked |
| **Warm Ops** | Send without approve · cold before Live+listing · invent contacts/reviews · craft/Fly |
| **All** | Unpark Live · Partner Submit · secrets/legal/banking · off-Shopify scope creep |

---

## Appendix A — Kill list (site / listing / craft)
No spend-first hero · no BE@40% · no “eleven tabs” · no ~60-day claim · no Meta-ROAS as product · no kitchen-sink nav · no SAMPLE-as-case-study

## Appendix B — Success bar
Each tab worth **$39** renew · multi-million-store polish · uninstall friction minimized · LTV signature best-in-niche · flat price defended by cheap-ops

## Appendix C — Grok fleet status
**HALTED.** Roles that existed: Galaxy Master · Mcfly App · Reviewer · Compete Scout · Live Accuracy · Warm Ops. Rooms Craft/Growth/Trust/Ops idle. Routines paused: Mcfly daily drive · Mcfly niche weekly. Do not wait on Grok.

---

*End of COMPLETE Cursor fleet handoff. Recreate fleet from §6–§7; cook from §4; deploy from §5; gates from §3.*
