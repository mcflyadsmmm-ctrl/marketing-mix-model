# Critical Audit — Mcfly ecosystem (adversarial, docs only)

**Agent:** Mcfly Critical Audit  
**Date:** 2026-09-22 (America/Denver)  
**Base tip:** `origin/cursor/spend-trust-recurring` @ `5b33d67`  
**Claimed Fly:** **v407** (Conductor / task brief) · Live **PARKED**  
**Scope:** Rip app honesty, site voice, ops SoT. **No** app craft, Fly, Live unpark, Partner Submit, or invented Partner metrics.  
**Wave plan:** `docs/plans/2026-09-22-adversarial-niche-intel.md`

**Method:** Static read of tip `app/**`, `site/**`, and `docs/ops/**` plus open PR heads (`gh pr list`). Proof = file path or URL. Fix lane = **craft** / **docs** / **Marty-gate**.

**Verdict:** Tip git is ahead of every living SoT file. Fleet docs still point cooks at already-shipped P2 and a dead tip SHA. App honesty is mostly careful on Total ROAS empties, but Live discount codes, SAMPLE Cash CPA day-sums, Overview spend readiness, and folded boards still lie or hide value. Site tip still sells BE@40%, Custom inquire, and spend-first FAQ IA while Custom URLs 301 home.

---

## Severity legend

| Sev | Meaning |
|-----|---------|
| **P0** | Fleet will cook wrong work, or merchant sees a trust-breaking number/label |
| **P1** | Material honesty / IA / voice defect; ship before growth claims |
| **P2** | Stale secondary docs, SEO zombies, or polish |

---

## 1. App honesty

| ID | Sev | Finding | Evidence | Fix |
|----|-----|---------|----------|-----|
| A1 | **P0** | **Live `discountCode` is always null** while SAMPLE stamps `WELCOME10` / `POWDER15` / `BUNDLE`. Promo LTV “named codes” on Live cannot paint; merchants see SAMPLE-only code truth. Ship 2 already names this — tip ADD board does **not**. | `app/app/lib/ltv-depth-page.server.ts` (`discountCode: null` + comment “Codes are not stored”); SAMPLE codes in `app/app/lib/ltv-depth-sample.ts` / `ltv-depth-sample.test.ts`; tip `docs/ops/ADD_BACKLOG_RANKED.md` still lists promo/spend paste as **next** | **craft** (store codes on Live OrderFact) + **docs** (absorb board) |
| A2 | **P0** | **SAMPLE Cash CPA / paste buyers day-sum across days** — same buyer on two pasted days counts twice. Live paste uses unique OrderFacts; SAMPLE path sums `buyerDays`. Preview can understate Cash CPA / invent payback vs Live. | `app/app/lib/spend-paste-preview.ts` `buyersOnPastedDays` (live unique vs `identified += day.identifiedBuyers`); `app/app/lib/spend-paste-buyers.server.ts` header (“SAMPLE keeps day-sum buyerDays”) | **craft** (unique SAMPLE buyers for paste range) |
| A3 | **P1** | **Empty vs $0 religion is split.** KPI paint uses `—` (`formatSpendOnFile(0)` → `—`), but import UI says **“Empty cells count as $0.”** Spend calendar copy: “deleted day stays $0” vs “no spend entered, not a certified $0.” Merchants can believe blank CSV cells certify zero spend. | `app/app/lib/spend-on-file.ts`; `app/app/routes/app.spend.import.tsx` (~1514 “Empty cells count as $0.”); `app/app/routes/app.spend.tsx` empty / deleted-day copy | **craft** (one lexicon: empty cell = no amount / —, tombstone delete = $0 only when explict) |
| A4 | **P1** | **Payback copy overclaims.** UI: “Payback is about N days versus first 90.” Math is piecewise interpolation across cohort anchors — “average cohort math only — never a causal or per-customer forecast.” “About” softens but still reads like a recovery forecast. | `app/app/routes/app.spend.tsx` (~975–976); `app/app/lib/cash-payback.ts` header | **craft** (label: interpolated vs first-90 average, not recovery ETA) |
| A5 | **P1** | **Overview spend creep.** Law: Overview = order intelligence, zero spend/ROAS doors. Loader still `materializeRecurringSpendForShop`, builds `spendByDay` / `cashControl`, passes `hasSpend` into trust banners, and gates `mcfly-desk--live-ready` on `!spendBlocked` (`!hasSpend`). Live Overview still treats “has spend” as readiness. | `docs/LIVING_BOARD.md` (“zero spend/ROAS on Overview”); `app/app/routes/app._index.tsx` (~169, ~289–303, ~351–384, ~554–555, ~681, ~743–744); `app/app/components/CashTrustBanners.tsx` | **craft** (drop spend readiness from Overview chrome; keep spend on Spend tab) |
| A6 | **P1** | **Live vs SAMPLE confusion under freeze.** Freeze correctly blocks Live writes, but Overview still says “· live sales” when `!useSampleDesk`. With `MCFLY_SAMPLE_ONLY=true` merchants should only see SAMPLE — any path that clears sample chrome while Live is parked risks SAMPLE dollars read as this shop. | `app/app/routes/app._index.tsx` tillLabel “live sales”; `isSampleOnlyFreeze()` spend routes; `docs/ops/LIVE_UNPARK_CHECKLIST.md` | **craft** + **Marty-gate** (unpark checklist) |
| A7 | **P1** | **Unpaid ~90d vs stale ~60 claim.** Ingest clamp is `LIVE_UNPAID_INGEST_DAYS = 90`. Comment in `customers-analytics.ts` still says “~60 on a fresh live install.” LTV empty copy is careful (“not $0”), but depth comments teach the wrong window. | `app/app/lib/live-unpark.ts`; `app/app/lib/customers-analytics.ts` lines 5–7; `app/app/lib/sales-facts.server.ts` unpaid clamp | **docs** (comment) + verify UI never says ~60 (**craft** if any chrome still does) |
| A8 | **P1** | **Boards folded so merchants miss them.** Spend explorer / mix / CPA use `fold={emptyLiveSpend}` — stranger Live with no spend collapses the cash stack. Customers LTV depth (`LtvPromoBoard`, product→LTV, whales) sits behind `fold` with `defaultOpen={shotMode \|\| panel === "depth"}` — default stranger never opens promo depth. ADD Ship 2 wants promo on “What a new buyer is worth”; tip still buries it after Product board inside a closed fold. | `app/app/routes/app.spend.tsx` (~1204–1280); `app/app/routes/app.customers.tsx` (~244–245); `app/app/components/CustomersLtvSection.tsx` (~448–456) | **craft** |
| A9 | **P2** | **SAMPLE-as-client surface risk.** App chrome labels SAMPLE; listing paste says SAMPLE is not a live client. Risk is **site/ops** (Harbor / Northline dollars, “case study” voice) more than Admin watermark — see S-section. | `docs/ops/LISTING_PASTE_READY.md`; `docs/ops/CURSOR_FLEET_HANDOFF_FULL.md` refuse “SAMPLE as case study” | **docs** / site craft |
| A10 | **P2** | Older sample-math audit claimed Overview zero-spend PASS; tip Overview still loads spend spine. That research is **stale relative to tip** — do not cite as green. | `docs/ops/research/2026-09-16-sample-math-audit.md` criterion 6 vs `app._index.tsx` today | **docs** (supersede) |

**App honesty bright spots (do not “fix” into lies):** Total ROAS empty paints `—` / never `0×` on Spend KPI (`desk-spend-stack.server.ts` religion; `spend-upload-findings.ts`); paste preview holds ROAS/CPA/payback with “not $0” reasons when sales/buyers missing (`spend-paste-preview.ts`).

---

## 2. Site

| ID | Sev | Finding | Evidence | Fix |
|----|-----|---------|----------|-----|
| S1 | **P0** | **Kill-list BE@40% still product voice on tip site.** Demo / home / product / pricing still advertise break-even **2.50× @ 40%**. MASTER kill list and listing paste ban BE@40% as product claim. | `site/demo.html` meta + hero (`BE 2.50× @ 40%`); `site/index.html` (“At 40% profit margin”); `site/product.html` / `site/pricing.html` float cards; `docs/ops/MASTER_OPERATING_PROMPT.md` kill list; `docs/ops/LISTING_PASTE_READY.md` | **craft** (site) — remove fixed 40% as product promise; margin is merchant-entered |
| S2 | **P0** | **Conflicting CTAs: Install vs Custom inquire.** Tip `_redirects` 301 `/custom-analytics` → `/`, but `download.html` still offers **Custom inquire** beside Install. FAQ / product still spend-first. Niche cleanup PR #140 is **not** tip. | `site/download.html` (~560–562); `site/_redirects` Custom 301s; open PR https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/140 | **craft** (site) + **Marty-gate** (Pages deploy) |
| S3 | **P1** | **Off-niche HTML still in tree; some still 200.** Tip redirects park Custom/lab/pixel/TW pages, but HTML remains (SEO if redirect file not deployed). **Still 200 on tip:** `/break-even-roas-calculator`, `/mer-calculator` (no redirect). Calculators are fine as tools; BE@40% copy on them is not. Agency/CRM landers exist as files (redirected). | `site/*.html` inventory (46 pages); `site/_redirects`; missing redirect for break-even calculator on tip | **craft** (redirects + copy) + **Marty-gate** (Pages) |
| S4 | **P1** | **Pixel / Meta-ROAS / attribution product voice.** Pages frame Mcfly as Total ROAS desk vs suites (ok as refuse), but FAQ schema still lists “Spend, Overview, LTV, Goals” (wrong painted IA) and Email Overview / Acquisition zoo. Product page: “Upload spend → see Total ROAS” as primary lede. | `site/faq.html` JSON-LD + body; `site/product.html` (~480); `site/vs-attribution-suites.html` (301 on tip → `/`); `site/why-pixels-fail.html` (301) | **craft** (FAQ/product IA = Overview→Orders→Customers→Spend→Goals) |
| S5 | **P1** | **SAMPLE number SoT conflict (Harbor vs Snowdevil vs Northline).** Skill + Living Board still lock **Harbor** `$23,414 / $82,068 / 3.51×` on home; demo meta uses Snowdevil `$19,023 / $68,457 / 3.60×`; lab/agency HTML still Northline `$98,500 / 4.19×` (301’d). Three SAMPLE books → “which is the client?” | `.cursor/skills/mcfly-site/SKILL.md`; `docs/LIVING_BOARD.md` Harbor lock; `site/demo.html`; `site/lab.html` | **docs** + **craft** (one SAMPLE book everywhere public) |
| S6 | **P2** | **Inventable-metrics refuse is documented; no star/install invention found on tip home.** Warm/Partner metrics stay 0 on scoreboard — good. Risk is reintroducing via stale open site PRs (#27/#28/#29). | `docs/ops/SCOREBOARD.md` reviews 0; open PRs #27–#29 (old site revamps) | **Marty-gate** (close/ignore stale PRs) |

**Open site PR conflict:** #140 (`cursor/site-niche-cleanup-5bc6`) re-opens `/vs-attribution-suites` + `/triple-whale-alternative` as 200 and parks break-even → mer-calculator — **conflicts with tip `_redirects`** that 301 those compare pages home. Conductor must pick one niche story before Pages deploy.

---

## 3. Ops SoT

| ID | Sev | Finding | Evidence | Fix |
|----|-----|---------|----------|-----|
| O1 | **P0** | **SCOREBOARD tip SHA / Fly lie.** Tip file still **v406 / `2107ea8`**, SAMPLE smoke **WAITING Marty**, while task + scoreboard PR name **v407 / `5b33d67`**, smoke **WAIVED**. Stale tip SHA is an explicit wave defect. | tip `docs/ops/SCOREBOARD.md`; PR https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/139; tip SHA `5b33d67` via `git rev-parse origin/cursor/spend-trust-recurring` | **docs** (merge #139 or equivalent) |
| O2 | **P0** | **ADD_BACKLOG still lists shipped work as next.** Tip absorb: P2 next = promo depth + spend paste densify. Both merged (#135 / #138). Sibling branch `cursor/shopifyql-wait-queue-5bc6` already absorbed tip and named **Customers open-lane starter value** — tip board did not. | tip `docs/ops/ADD_BACKLOG_RANKED.md` lines 16–23, 73; `origin/cursor/shopifyql-wait-queue-5bc6` ADD absorb; PRs #135/#138 | **docs** (absorb from #137 or Gap Fill) |
| O3 | **P0** | **MASTER_OPERATING_PROMPT Marty one-liner still “tip smoke v403 until I PASS.”** Body says smoke waived / continuous improve; paste line contradicts. Fleet will ping Marty for dead smoke. | `docs/ops/MASTER_OPERATING_PROMPT.md` ~91 vs ~12–14, ~35 | **docs** |
| O4 | **P0** | **CURSOR handoffs lock Fly v406 / SHA `2107ea8` and “restart Spend paste densify.”** Paste densify is merged; Fly claimed v407. Spawning from FULL handoff re-cooks shipped Brief 2. | `docs/ops/CURSOR_FLEET_HANDOFF_FULL.md`; `docs/ops/CURSOR_HANDOFF_20260921.md` | **docs** |
| O5 | **P1** | **LIVING_BOARD Fly 396 / Harbor SAMPLE / occupancy theater.** Board Updated 2026-09-19 · Fly **396** while tip Fly is v407. Harbor lock fights Snowdevil. Agents reading board first get wrong world. | `docs/LIVING_BOARD.md` | **docs** |
| O6 | **P1** | **Open PR pile conflicts.** Concurrent docs/site SoT: #141 (this wave), #140 site niche, #139 scoreboard v407, #137 ShopifyQL wait + ADD absorb, #131 P2 briefs (historical). Plus zombie craft/site PRs (#12–#20, #27–#29, #54, #82…). Two ADDs / two redirect maps / two Fly tips = Conductor collision. | `gh pr list --state open` on `mcflyadsmmm-ctrl/marketing-mix-model` | **Marty-gate** / Conductor (close or base-rebase; one SoT merge order) |
| O7 | **P2** | **SCOREBOARD “Partner Submit READY” while Live PARKED.** Paste may be ready; critical path still SAMPLE→Live→Partner. “READY” overstates. | tip `docs/ops/SCOREBOARD.md` | **docs** |

---

## Top 10 (P0/P1 only) — Conductor order

1. **O1** — SCOREBOARD still v406/`2107ea8` vs Fly v407/`5b33d67` (**docs**)  
2. **O2** — ADD_BACKLOG next cooks = already shipped promo + paste (**docs**)  
3. **O3** — MASTER paste “tip smoke v403” (**docs**)  
4. **A1** — Live `discountCode: null` vs SAMPLE codes (**craft**)  
5. **A2** — SAMPLE paste Cash CPA day-sum double-count (**craft**)  
6. **S1** — BE@40% still on demo/home/product (**craft** site)  
7. **S2** — Custom inquire CTA vs Custom 301 / Install spine (**craft** + **Marty-gate** Pages)  
8. **A5** — Overview spend readiness / recurring spend spine (**craft**)  
9. **A8** — Spend + LTV depth boards folded closed for strangers (**craft**)  
10. **O4/O6** — Handoffs + open PRs fighting tip SoT (**docs** / Conductor)

---

## Explicit non-actions (this audit)

- No `app/` patches, no `flyctl`, no Live unpark, no Partner Submit.  
- No invented installs, stars, reviews, or Partner conversion rates.  
- Gap Fill Planner owns cook queue merge after Compete + Real Problems land.

---

## Sources index

- Tip: `origin/cursor/spend-trust-recurring` @ `5b33d67e3ec7b07f4dc4d9edbb9dc82f87e7ae4b`  
- Fly claim: task brief **v407** · Live PARKED  
- Open PRs: https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pulls  
- Wave: `docs/plans/2026-09-22-adversarial-niche-intel.md`

*Critical Audit · docs only · 2026-09-22*
