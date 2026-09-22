# Niche gap-fill cook queue (Compete Scout synthesizer)

**Agent:** Mcfly Gap Fill Planner  
**Date:** 2026-09-22 (America/Denver)  
**Tip frame:** Fly **v407** · tip `5b33d67` · Live **PARKED** · smoke **waived**  
**Branch:** `cursor/adversarial-niche-intel-5bc6`  
**Job:** Merge four research docs into one ordered cook queue — **fewer bigger PRs**. Docs only. No `app/` craft. No invented Partner metrics.

**Inputs (read, do not reinvent):**

| Scout | Path |
|-------|------|
| Critical Audit | `docs/ops/research/2026-09-22-CRITICAL_AUDIT.md` |
| Compete Why-Better | `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md` |
| Top Shopify Apps | `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md` |
| Real Operator Pains | `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md` |
| Wave plan | `docs/plans/2026-09-22-adversarial-niche-intel.md` |
| Board | `docs/ops/ADD_BACKLOG_RANKED.md` |

**Locks:** Painted IA Overview→Orders→Customers→Spend→Goals · $39 flat · Growth/LTV = Customers chips · refuse COGS / pixels / MTA / GMV / sixth tab / sessions / invent metrics · Listing / review sends = **Marty later** · ShopifyQL is **not** a craft blocker.

**Already SHIPPED (#124–#138)** — do not re-queue as invent:

| PR | Closed |
| ---: | --- |
| #124–#126 | Returning $ · cohort 30/90/365 · Growth days-to-second |
| #127–#130 | Product→LTV · predictive LTV · whale/RFM-lite · refunds honesty |
| #132–#133 | Order-history forecast · shareable insight cards |
| #134 | Unpaid Live ingest ~90d |
| #135 | Promo depth bands (discount $) |
| #138 | Spend paste cash Total ROAS / CPA / payback |

---

## How to read

| Verdict | Meaning |
|---------|---------|
| **PASS** | One craft (or site) PR Conductor can dispatch without inventing scope |
| **HOLD** | Niche-adjacent but blocked (schema / PCD / Marty decision) |
| **REFUSE** | Anti-job — steal the pain, never the product |

Each **PASS** is one bigger cook. Do not splinter Ship 2 into three Flys. Do not open a sixth tab.

---

## PASS cooks (ordered)

### PASS 1 — Ship 2: open-lane starter value (v408)

**Merchant sentence:** On Customers → LTV, on the open “What a new buyer is worth” lane, I can see whether a deeper first discount, Online vs POS vs Shop, or a named code when Shopify stored one starts a stronger 30/90/365 path — without opening a folded report.

**Tab / chip:** Customers → **LTV** (open lane)

**Why it wins:** Lifetimely sells product / promo / first-item LTV Drivers behind an order ladder; native discount reports stop at orders/sales; Orders already shows source mix but not LTV. Closing the open-lane gap steals the Lifetimely “breakdown” question at $39 without COGS or CAC-from-ads. Audit A1 + A8 (LTV half): Live `discountCode` is null while SAMPLE names codes; `LtvPromoBoard` sits behind a closed fold.

**Scope (one PR — do not invent a second):**

1. Move `LtvPromoBoard` up onto the open LTV lane (promo depth already shipped #135 — placement only).  
2. LTV by Online / POS / Shop from stored `sourceName`.  
3. Store Live `discountCode` on `OrderFact` when Shopify already has one (not `discountApplications` titles).

**Evidence pointers:**

- Real pains P11 / P18 / P20 · top-8 #1–3 — `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`  
- Compete L3 / L4 Drivers · PASS rank 1 — `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md`  
- Top Apps Lifetimely / RCI first-product & promo steal · §F.7 — `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`  
- Critical Audit A1 · A8 — `docs/ops/research/2026-09-22-CRITICAL_AUDIT.md`  
- Named earlier as Ship 2 in sibling queue plan (`docs/plans/2026-09-22-shopifyql-wait-queue.md` on `cursor/shopifyql-wait-queue-5bc6`)

**In flight note:** Ship 2 may already be cooking. **Keep as #1** — do not duplicate as a new invent. If a branch already owns promo-up + source LTV + Live `discountCode`, absorb that PR; do not open a second.

---

### PASS 2 — Spend + Overview honesty cluster

**Merchant sentence:** When I paste spend or open Overview with $0 spend on file, blank cells and missing sales never look like certified zeros, SAMPLE cash math matches Live unique-buyer rules, and Overview never treats “has spend” as desk readiness.

**Tab / chip:** Spend · Overview (chrome only — no ROAS tiles on Overview first fold)

**Why it wins:** Trust is the wedge vs Triple Whale attribution theater and TrueProfit “wrong until configured.” Paste densify (#138) already shipped the cash door; the audit still finds SAMPLE day-sum double-count, empty-cell = $0 copy fighting `—` religion, payback overclaim, and Overview spend creep. One honesty PR closes the trust leak competitors get blamed for — without pixels.

**Scope (one PR):**

1. SAMPLE paste Cash CPA / payback = unique buyers across pasted days (Audit A2).  
2. One empty / $0 / tombstone lexicon on Spend import + calendar (A3).  
3. Payback labeled as interpolated vs first-90 average, not recovery ETA (A4).  
4. Drop Overview spend readiness / `mcfly-desk--live-ready` gated on `hasSpend` (A5) — Overview stays order intelligence at $0 spend.  
5. Spend explorer / mix / CPA: do not fold the cash stack closed solely because Live spend is empty when the empty state itself teaches paste (A8 Spend half).

**Evidence pointers:**

- Critical Audit A2–A5 · A8 (Spend) · Top 10 #5–9 — `docs/ops/research/2026-09-22-CRITICAL_AUDIT.md`  
- Real pains P12 (shipped #138) · P14 Overview $0-spend · top-8 #8 — `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`  
- Top Apps Spend optional paste + — not 0× · §F.8 · Overview refuse spend tiles — `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`  
- Compete refuse T1/TP3; steal honest sales ÷ typed spend — `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md`

---

### PASS 3 — Morning habit densify (digest + first-run three wins)

**Merchant sentence:** On first open I get three named wins (month close → who to save → set a target) and a copyable morning sentence I can paste to Slack — with zero OAuth and zero spend required.

**Tab / chip:** Overview · Customers · Goals

**Why it wins:** Peel daily Slack / TW Moby recaps / Putler weekly email still pull operators who want “check like weather.” #133 shipped shareable cards; competitors still win the *habit ritual*. Klaviyo’s guided three-win Admin path is the install pattern — invert TW’s pixel wall. One PR densifies ritual + first-run, not a Slack product.

**Scope (one PR):**

1. Overview “Today’s read” / shareable one-liner densify (Peel digest shape, no Slack bot).  
2. Explicit three named first-run wins in Admin chrome / ActionCards: Overview YoY → Customers returning-$ / whales → Goals set LTV or returning-$ target.  
3. Goals weekly-ritual density on existing forecast + cards (#132/#133) — polish only, no new forecast engine.

**Evidence pointers:**

- Compete P1 / T4 / PU4 · PASS ranks 3 · exec #3 — `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md`  
- Top Apps §C.1 / §C.4 · §F.1 / §F.4 · Klaviyo guided setup · Peel digests — `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`  
- Real pains P13 · P14 · top-8 #6 — `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`

---

### PASS 4 — Mobile Admin soft-dense (all five tabs)

**Merchant sentence:** On phone Admin I can read the primary KPI and one ActionCard per tab without escaping to TrueProfit’s native app or native Analytics maze.

**Tab / chip:** All five (embed densify — **not** a separate consumer app)

**Why it wins:** Reddit TW “pay for a dashboard I use 20%” + TrueProfit mobile praise + native mobile Analytics escape hatch. Painted pills exist; phone TAB_WORTH_BAR does not. Steal TrueProfit/PageFly mobile density; refuse a second native client.

**Scope (one PR):** Soft-dense scoreboards + ActionCards readable at ~390px across Overview / Orders / Customers / Spend / Goals. No IA change. No sixth tab.

**Evidence pointers:**

- Compete TP5 / S7 · PASS rank 6 · exec #6 — `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md`  
- Top Apps §F.6 · TrueProfit / PageFly mobile — `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`  
- Real pains P15 · top-8 #5 — `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`

---

### PASS 5 — Orders UX compression (product × date / timing)

**Merchant sentence:** I can answer basic order/sales questions (typical ticket, product × date, weekend timing) on Orders without exporting CSV to Sheets/ChatGPT — and without any claim that Mcfly fixes Shopify sessions.

**Tab / chip:** Orders · Overview glance only

**Why it wins:** Native New Analytics “analyst-designed / NO DATA / product×date hard” is still the loudest Shopify complaint class. Mcfly already owns median/typical and base timing; densify to kill the export loop (P16) without owning traffic accuracy.

**Scope (one PR):** Product sales explorer / product×date densify aligned to painted Orders craft + weekend/hour densify vs TAB_WORTH_BAR. **Never** session/visitor accuracy claims.

**Evidence pointers:**

- Real pains P05 · P16 · P21 · top-8 #7 — `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`  
- Compete S6 PASS Orders for order questions · refuse Live View — `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md`  
- Top Apps Orders source mix / typical order steal — `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`  
- ADD backlog rank 4 (still PASS niche) — `docs/ops/ADD_BACKLOG_RANKED.md`

---

### PASS 6 — Site niche honesty (Pages craft)

**Merchant sentence:** The public site sells Mcfly Analytics Install at $39 with Overview→Orders→Customers→Spend→Goals — never break-even@40% as a product promise, never Custom inquire beside Install, never spend-first FAQ as the spine.

**Tab / chip:** Site (not Admin) · Marty **Pages** deploy

**Why it wins:** Audit S1/S2/S4: tip site still sells BE@40%, Custom inquire vs Custom 301, FAQ IA wrong. Listing/site honesty is distribution trust; competitors already have mature App Store corpora — Mcfly cannot afford product-voice lies on the spine.

**Scope (one site PR):** Kill BE@40% product voice · remove Custom inquire CTA · FAQ/product IA = painted five · one SAMPLE book SoT on public pages. Conductor resolves open #140 redirect conflict before Pages deploy. **Marty later** for production Pages.

**Evidence pointers:**

- Critical Audit S1–S5 · Top 10 #6–7 — `docs/ops/research/2026-09-22-CRITICAL_AUDIT.md`  
- Top Apps pricing clarity contrast · §F.5 — `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`  
- Real pains P02 / P22 multi-store wording adjacent (site/listing) — `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`

---

### PASS 7 — Listing / multi-store $39 clarity (Marty paste)

**Merchant sentence:** Partner Pricing and site Pricing say one number — $39 per store per month after 7-day trial — with no hidden GMV quota and clear multi-store = N × $39.

**Tab / chip:** Pricing / listing (not a craft tab)

**Why it wins:** Metering rage across Lifetimely / TW / TrueProfit / Putler / Peel is Mcfly’s commercial wedge. Flat price posture exists; multi-store wording is still “Next” on ADD rank 2. **Marty later** — no Partner Submit from this wave.

**Scope:** Docs + listing paste draft only. No invent stars/installs. No Free plan. No GMV ladder.

**Evidence pointers:**

- Real pains P02 · P22 · top-8 #4 — `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`  
- Compete L11 / T8 / TP8 / PU9 refuse metering · L2 trial length soft — `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md`  
- Top Apps §C.5 · §F.5 — `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`

---

### PASS 8 — Ops SoT absorb (docs-only, Conductor)

**Merchant sentence:** *(internal)* Fleet cooks from a board that matches tip SHA, Fly v407, smoke waived, and this gap-fill next PASS — not from stale handoffs that re-queue #135/#138.

**Tab / chip:** Docs / ops only

**Why it wins:** Audit O1–O4 / O6: SCOREBOARD tip SHA lie, ADD next = shipped work, MASTER paste “tip smoke v403”, handoffs restart Spend paste. Wrong SoT cooks wrong app. This Gap Fill patch + scoreboard/handoff follow-ups are docs PASS — not craft.

**Scope:** Absorb lines in `ADD_BACKLOG_RANKED.md` (this PR) · Conductor merges scoreboard v407 / MASTER paste / handoff tip locks on separate docs PRs as needed. Close or rebase colliding open PRs (#137/#139/#140/#141 family).

**Evidence pointers:**

- Critical Audit O1–O6 · Top 10 #1–3 · #10 — `docs/ops/research/2026-09-22-CRITICAL_AUDIT.md`

---

## HOLD (do not queue to Craft yet)

| Item | Why HOLD | Evidence |
|------|----------|----------|
| Discount **titles** via `discountApplications` crawl | Schema / new field crawl; Ship 2 stores code only when already on order | Real P18 · Audit A1 boundary · ADD HOLD |
| Country / customer-tag → LTV | PCD Level 2 / non-PII field approval — do not read shipping addresses or tags in review | Real P19 · Compete L3 refuse country/tag · wave locks |
| Native Slack / email bot OAuth as must-ship | Digest *shape* is PASS 3; bot product needs niche decision | Compete P1 HOLD/REFUSE Slack bot · Real P13 |
| Sessions / visitor “fix native Analytics” any claim | Out of order-history niche; HOLD any matching-traffic line | Real P21 · Compete S6 refuse · wave locks |
| Live unpark / Partner Submit / outbound review sends | Marty-gate; Live PARKED | Wave plan · Audit Marty-gate rows |
| Open site PR #140 redirect map vs tip `_redirects` | Conductor picks one niche story before Pages | Audit S2 / O6 |

---

## REFUSE (never “win” by copying)

| Theme | Who wins today | Why REFUSE |
|-------|----------------|------------|
| COGS / shipping / fees / net profit P&L | Lifetimely · TrueProfit · Peel cost intelligence | Anti-job |
| Pixels / path credit / MTA / Meta ROAS / “true ROAS” | Triple Whale · TrueProfit · Peel UTM-MTA · Lifetimely attribution | Anti-job · uninstall engine |
| GMV / order / revenue metering · Free plan as P&L funnel | Lifetimely ladder · TW GMV · TrueProfit overage · Putler slabs · Peel floors | Rage theme; stay $39 flat |
| Sixth analysis tab | Suite sprawl | Growth/LTV stay Customers chips |
| Amazon / multichannel / Recharge-Skio MRR | Peel · Lifetimely Amazon · Putler 17+ | Off Shopify-only |
| SQL / Snowflake / Compass MMM / AI Profit Agent / Moby hero | Peel · TW Enterprise · Lifetimely | Not painted IA |
| Invent Partner stars / installs / conversion | — | Anti-job |
| Separate native mobile P&L app | TrueProfit | Steal density only (PASS 4) |

---

## Cook order for Conductor (App after Reviewer)

| Order | PASS | Fly / surface | Notes |
|------:|------|---------------|-------|
| 1 | Ship 2 open-lane starter value | v408 · Customers→LTV | **Next PASS on ADD board** · may be in flight — do not duplicate |
| 2 | Spend + Overview honesty cluster | App honesty | After Ship 2 or parallel only if different files + Conductor OK |
| 3 | Morning habit densify | Overview · Goals · Customers | Builds on #132/#133 |
| 4 | Mobile soft-dense | All five | Phone TAB_WORTH_BAR |
| 5 | Orders UX compression | Orders | No session claims |
| 6 | Site niche honesty | Site · Marty Pages | Resolve #140 conflict first |
| 7 | Listing multi-store $39 | Marty paste later | No Partner Submit from wave |
| 8 | Ops SoT absorb | Docs | This file + board patch start it |

**Smoke:** waived. **ShopifyQL / `read_reports`:** trust gate only — not a craft blocker for any PASS above.

---

## Explicit non-actions (this synthesizer)

- No `app/` patches · no `flyctl` · no Live unpark · no Partner Submit · no outbound sends.  
- No invented installs, stars, reviews, or Partner conversion rates.  
- Does not re-list SHIPPED #124–#138 as next invent.  
- Does not invent a new Ship 2 — keeps the named starter-value cook as PASS 1.

---

## Source index

- `docs/ops/research/2026-09-22-CRITICAL_AUDIT.md`  
- `docs/ops/research/2026-09-22-COMPETE_WHY_BETTER.md`  
- `docs/ops/research/2026-09-22-TOP_SHOPIFY_APPS.md`  
- `docs/ops/research/2026-09-22-REAL_OPERATOR_PAINS.md`  
- `docs/plans/2026-09-22-adversarial-niche-intel.md`  
- `docs/ops/ADD_BACKLOG_RANKED.md` (patched absorb/next to match this file)  
- Sibling Ship 2 naming: `docs/plans/2026-09-22-shopifyql-wait-queue.md` on `origin/cursor/shopifyql-wait-queue-5bc6`

*Gap Fill Planner · docs only · 2026-09-22*
