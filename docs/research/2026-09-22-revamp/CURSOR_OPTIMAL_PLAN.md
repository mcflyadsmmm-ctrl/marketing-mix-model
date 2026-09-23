# Cursor optimal plan — Mcfly Analytics (SoT for the next Conductor)

**Written:** 2026-09-22 ~20:00 America/Denver, by the outside critic (Opus), after reading `ENTERPRISE_PLAN.md`, `REBUILD_SPEC.md`, `WAVES.md`, `README.md`, `05`–`12`, `AGENTS.md`, `handover-mac-2026-09-22/TIP_STATE.md`, `docs/ops/CONDUCTOR_LANES.md`, `docs/BILLING_TIERS.md`, and the `LISTING_LIVE_PASTE.md` header, **and after re-probing this Mac**. Several Conductor "facts" did not survive the probe. They are corrected in §1 and they change the order of work.

**Implements:** `REBUILD_SPEC.md` (still the product spec). **Supersedes:** the *sequence* in `ENTERPRISE_PLAN.md` and the model table in `README.md`. `REVAMP_SPEC.md` stays dead.

---

# 0. One-page verdict

**What we are building.** One product with one face on three surfaces: an order-book morning desk inside Shopify Admin. First screen: *"This month is $X — up N% vs the same days last year,"* labeled **From orders**, with returning dollars, typical order, and weekend share underneath. Spend and Total ROAS come second and sit on the Spend tab. mcflyads.com, the App Store card, and `/demo` all show that same screen. Flat **$39** after a 7-day trial. Total ROAS = Shopify sales ÷ entered spend; empty is **—**.

**What "done" means for this program.** All six of these must be true, checked by curl on this Mac:

1. The published site (Pages `mcflyads`, stamp **v43+**) and the Fly app come from **one reconciled commit** on `cursor/spend-trust-recurring` that is pushed and not behind origin.
2. `https://mcfly-analytics.fly.dev/` no longer serves a marketing homepage. `/privacy`, `/support`, `/terms`, `/demo`, `/app`, and `/health` still work.
3. `/demo` first screen reads as the canonical sentence with the Snowdevil lock (**$68,457** vs **$69,891**, typical **$631**, returning **$45,409**, weekend **23%**). It does not contain "Look here first", "Live is parked", "Mix close", "YoY glance", "Shopify Total Sales", or `0×`.
4. No surface says trial = 24 months. Trial is **90 closed days**; paid is **up to 24 months**.
5. Marty has saved the listing paste (tagline, body, and pricing) so the card sells the same first screen.
6. Living Board is restamped to the versions that are actually live.

**What we refuse.** Pixels, MTA, ad OAuth, "true ROAS", ShopifyQL/Analytics parity claims before PCD L2, the `read_reports` scope change in this publish, a second pricing tier, invented reviews or installs, ads, unparking Live without Marty, more micro-PRs, more research waves, and parallel frontier agents.

**The harsh part Grok skipped.** The draft plans treat this as a design problem on a clean base. It isn't. Right now:

- the local ship tree is **86 commits behind origin**;
- **68 PRs are open**, and a cloud agent fleet is still merging into the ship branch on its own (31 merges today);
- the dirty rebuild **overlaps 22 files** with those remote commits;
- the dirty tree **silently adds the `read_reports` scope** to both TOMLs and `fly.toml`;
- Live is **parked**, so every paying install today sees Snowdevil SAMPLE and "Live is parked until launch", not their own store.

No aesthetic rebuild matters until the fleet stops, the base is reconciled, and Marty decides when merchants see their own orders.

---

# 1. Trust order and tip of ship

## Trust order

1. **A live probe on this Mac** (curl, `git`, `gh`, `flyctl`). It always wins.
2. **This file.**
3. `ENTERPRISE_PLAN.md`, then `REBUILD_SPEC.md` for product detail. REBUILD_SPEC still wins on *what the screen says*; this file wins on *order, owners, models, and gates*.
4. The 2026-09-23 handoff email in the business inbox. Partly stale: it points at `mcfly-analytics/`, but the real ship tree is `marketing-mix-model/`.
5. `docs/LIVING_BOARD.md`. Local copy says site v30 / Fly 396; origin's docs stamp Fly v433. Both are stale until Phase D restamps.
6. Research `01`–`12`. Evidence only. `05` was re-checked against live Fly v445 tonight and its S0 strings are **still live**.

## Probed facts (2026-09-22 ~20:00 MT)

| Item | Value | Source |
| --- | --- | --- |
| Workspace | `/Users/martysmithson/Documents/MCFLY ANALYTICS APP` | — |
| Ship tree | `marketing-mix-model/` | `git` |
| Branch | `cursor/spend-trust-recurring` | `git branch --show-current` |
| Local HEAD | `5b33d67` (Merge PR #138, 2026-09-21 21:47 MT) | `git rev-parse` |
| **origin tip** | **`92a278b`** "docs: stamp Fly v433…" 2026-09-22 18:27 UTC | `git fetch` |
| Local vs origin | **0 ahead / 86 behind** | `git rev-list --left-right --count` |
| Remote delta | 184 files, +15,343 / −1,579; 180 under `site/` or `app/app/` | `git diff --stat` |
| Dirty ∩ remote | **22 files** (all first-fold Desk components/tests, `app._index.tsx`, `demo._index.tsx`, `mcfly-desk.css`, `site/index.html`, `pricing.html`, `faq.html`) | `comm` |
| Dirty-only risk | `app/shopify.app.toml`, `app/shopify.app.public.toml`, `fly.toml` add **`read_reports`** | `git diff` |
| Open PRs | **68** (40 from cloud agent suffix `-5bc6`, 14 from `-2ae5`); #194–#203 all touch `site/**` | `gh pr list` |
| Merged today | **31** | `gh pr list --search merged:>=2026-09-22` |
| Site in git (origin) | stamp **v30**, H1 "Deeper Shopify numbers Analytics does not show." | `git show origin/…:site/index.html` |
| Site live | mcflyads.com **v42** (v42 source is **not in git**) | curl |
| Site local dirty | stamp **v43** `rebuild-first-screen-v43`, H1 "Spend next to real Shopify sales.", Snowdevil lock present, 90/24 sentence correct | `rg` |
| Fly | `mcfly-analytics` **v445** (released ~3h before probe), `/health` 200; image has no git label, so **source SHA unknown** | `flyctl releases` |
| Fly `/` | serves marketing site **v42** because `app/Dockerfile` bakes `site/` into the image and `app/scripts/serve-with-site.mjs` mounts it with `index: "index.html"`. Enforced by `app/app/lib/fly-trust-pages.test.ts`. | code + curl |
| Fly `/demo` live | still contains **Look here first**, **Live is parked**, **Mix close**, **YoY glance**, **Shopify Total Sales**; `$108,666` ×10; no "From orders" | curl |
| Live data | **PARKED** — `fly.toml` `MCFLY_SAMPLE_ONLY = "true"` | file |
| Listing | https://apps.shopify.com/mcfly-analytics-public · reviews **0** · $39 after 7-day | AGENTS.md |
| PR #43 | merged; ads **NO** | ENTERPRISE_PLAN |

## Corrections to the Conductor's "confirmed" list

| Claimed | Probe says | Consequence |
| --- | --- | --- |
| "Ship tree @ 5b33d67" is the tip | 5b33d67 is the **local base**. Origin is 86 commits ahead. | Deploying Fly from local would **roll back** ~50 merged PRs. Phase 0 is mandatory. |
| `$108,666` is only a unit-test sentence | It is also the **live Fly `/demo` Overview clock** (rolling Snowdevil MTD). `overview-order-book.test.ts` uses it too. | "Try the demo" on the site shows a different number than the site still. Phase B must pin `/demo` to the lock window. |
| Uncommitted Overview no longer blanks on `salesPending` | `OverviewFirstViewport.tsx` ignores it (`_salesPending`), but `overviewGreetingPending()` in `overview-first-viewport.ts` still returns `true` on `salesPending`. | Phase C must prove the greeting/hero does not go dark when OrderFact rows exist. |
| Dirty tree = "Overview rebuild + site first screen + research" | It also contains a **scope change** (`read_reports`) in three config files. | Revert those three hunks before any deploy. The scope belongs to Phase G, and only Marty can approve it (it forces re-auth for every installed shop). |
| `docs/BILLING_TIERS.md` is billing SoT | Also says "Daily sales totals are a ShopifyQL query (`read_reports`)". That contradicts the From-orders lock while L2 is pending. | Listing lane fixes that sentence in Phase A. |
| Micro-PRs are banned | A cloud fleet is producing them right now and self-merging. | Marty pauses it (§7 gate M0). The Conductor merges nothing from it. |

---

# 2. Model routing (mandatory)

**Principle:** Grok judges once, Composer types, and Opus is only brought in when a brief is wrong. Most recurring work here is mechanical: copy that is already locked, CSS, tests, and curls. The expensive mistakes came from fleet size and repeated work, not from using a weak model.

## Routing table

| Job type | Model | Pool | Max concurrent | Escalate when | Anti-pattern (what burned usage) |
| --- | --- | --- | --- | --- | --- |
| Conductor turns: status, probes, merges, deploys, board restamp | **inherit** (keep the Conductor on `grok-4.7-high`; drop to `composer-2.5-fast` for pure shell days) | Cursor Models | 1 (one chat) | Never escalate the Conductor itself; spawn a critic instead | New "finalize / world class" chats that forget the board and restart Desk |
| Git reconcile (Phase 0 merge of dirty tree onto origin, 22 conflicts) | Conductor on **`grok-4.7-high`** | Cursor Models | 1 | If a conflict touches money semantics (SalesDayFact, billing, ingest depth) and the intent isn't obvious → **`claude-opus-5-5-medium`** single read, answer "keep ours / theirs / blend" per hunk | Handing a 22-file conflict to four workers |
| Product judgment (hero copy, what to delete, conflicts between research files) | **`grok-4.7-high`** | Cursor Models | 1 | Opus and Grok disagree on a ship/no-ship call → **`gpt-5.6-terra-medium`** tie-break (one shot, same brief) | Re-running Phase R research on a second model; writing `REVAMP_SPEC` then `REBUILD_SPEC` then this |
| Implementation to a locked spec (TSX, CSS, tests, HTML) | **`composer-2.5-fast`** | Cursor Models | 2 (Site + Desk) | Composer fails the same test twice with no new evidence → `grok-4.7-high` reads the diff and rewrites the prompt; not Opus | Opus/Fable doing CSS; a lane restarting into a thinner method (curl instead of browser) |
| Data-truth code (salesPending, SalesDayFact poison read path, backfill resume copy) | **`composer-2.5-fast`** implements; **`grok-4.7-high`** writes the exact rule first (Conductor, in the prompt) | Cursor Models | 1 (Desk only) | Poison-row semantics are ambiguous after reading `sales-facts.server.ts` ~L361 → **`claude-opus-5-5-medium`** one read | Letting Composer invent the rule |
| Listing paste pack / docs text edits | **`composer-2.5-fast`** | Cursor Models | 1 | Tagline makes a claim about Shopify you can't verify → `grok-4.7-high` rewrite | Opus rewriting prose that is already chosen |
| Smoke curls, FUNNEL/SUPPORT_MX docs | **Conductor shell, no model**; Ops lane on `composer-2.5-fast` only if a doc must be written | — / Cursor Models | 1 | Never | Spawning an agent to run curl |
| Outside critique of a plan / spec / big diff before publish | **`claude-opus-5-5-medium`** | Other Models | 1, **once per publish** | Opus stuck on religion / billing / security / a high-stakes conflict → **`claude-fable-5-1-thinking-high`** (~2× Opus). Budget: at most one Fable call per week | Opus on every lane; Fable for routine plans |
| Long-file skim (logs, 2k-line research, PR list triage) | **`gemini-3.8-flash-high`** | Other Models | 1 | Needs judgment → hand the summary to Grok | Frontier model reading 68 PR bodies |
| Alternate long-context critique | **`gemini-3.1-pro`** | Other Models | 1 | Only if Opus is unavailable | Running Gemini *and* Opus on the same critique |
| Browser visual check of `/demo` and home after Phase D | Conductor `cursor-ide-browser` (no subagent) | — | 1 | Visual regression unclear → one `browser-use` subagent on `composer-2.5-fast` | Two visual audits of the same build |
| Security review of the publish diff | `security-review` subagent on **inherit**, only if the diff touches auth/billing/webhooks/scopes | — | 1 | Findings on billing/scope → Fable | Running it on CSS-only diffs |

**Hard caps:**
- **At most one frontier "Other Models" agent (Opus, Fable, GPT, or Gemini-pro) at any time.**
- **At most two implementation lanes at once** (Site + Desk). Listing and Ops are short and run *after* or *between*, not stacked. Never four frontier agents in parallel.
- **Zero cloud agents on `cursor/spend-trust-recurring`** until Phase D is live. Cloud agents make branches and PRs; the ship branch takes one reconciled commit at a time.

## Conductor default day

1. `status`: probe (§6 "quick probe" block), with no model spend beyond the Conductor turn. Diff the result against §1. If origin moved, stop and find out who pushed.
2. Read `LIVING_BOARD.md` plus this file's §3 checklist. Pick the lowest unfinished phase.
3. If a Marty gate blocks it, write the exact click list to Marty in one message and move to the next unblocked phase.
4. Spawn at most Site + Desk on `composer-2.5-fast` with the §5 prompts. Listing/Ops only when Site/Desk are idle or done.
5. While lanes run: the Conductor does curls, reads diffs, and runs tests in the shell. No polling loops and no second critic.
6. Lanes return, then the Conductor runs `npm test` (app) plus the lane's grep bar, merges locally, and commits with a conventional-commit message.
7. **Before any publish:** one `claude-opus-5-5-medium` critic pass over the publish diff against §6. Fix-only follow-up if it finds holes.
8. Publish (Phase D only): Pages from a non-git temp copy, then `flyctl deploy` from this Mac, then §6 smoke, then restamp the board, then update the canvas.
9. End of day: one status line in the board. Don't start "keep going" loops.

---

# 3. Work inventory (fleet compressed)

Status key: **done** = live and probed · **dirty-local** = in the uncommitted tree, not pushed, not live · **remote-only** = on origin, not in local · **not started** · **Marty-only**.

Everything below ships in the phases in §4. Nothing ships as its own PR.

## Base / process

| # | Deliverable | Status | Phase |
| --- | --- | --- | --- |
| P1 | Stop the cloud PR fleet (`-5bc6`, `-2ae5`, others) from pushing/merging into the ship branch | **Marty-only** (pause agents/automations) | 0 |
| P2 | Snapshot dirty tree to a branch (`cursor/rebuild-v43-local`) and push, so nothing is lost | not started | 0 |
| P3 | Merge origin (`92a278b`+) into the snapshot; resolve 22 overlaps in favor of REBUILD_SPEC on first-fold files and origin elsewhere | not started | 0 |
| P4 | Revert `read_reports` in `app/shopify.app.toml`, `app/shopify.app.public.toml`, `fly.toml` | dirty-local (must revert) | 0 |
| P5 | Triage 68 open PRs: do not merge any. Close the site ones (#194–#203) as superseded by v43. List the rest for Marty in one table | not started | 0 |
| P6 | Recover v42 site source (live but not in git): `wget` mirror to `handover-mac-2026-09-22/site-v42-live/` for diff reference only | not started | 0 |

## Listing (`05` §4, `09`, `10`, BILLING)

| # | Deliverable | Status | Phase |
| --- | --- | --- | --- |
| L1 | `LISTING_LIVE_PASTE.md`: kill every "trial includes 24 months"; one sentence: trial 90 closed days, paid up to 24 months | not started (header still wrong) | A |
| L2 | Paste body re-led by orders-first (Overview → Orders → Customers, spend second); drop Meta/Google/TikTok/billboard keyword pile from the lead | not started | A |
| L3 | Tagline: current pick claims "Shopify Analytics skips YoY", which is contestable (Analytics has period compare). Offer Marty two safe options (§5 Listing prompt) | not started | A |
| L4 | Remove stale "Matches Fly 396 + site v30" and "Site v20" gates from the paste header/URL table | not started | A |
| L5 | `docs/BILLING_TIERS.md`: fix "Daily sales totals are a ShopifyQL query" so it says order book now, QL after L2 | not started | A |
| L6 | Partner Save of listing + Pricing (one plan, no Free, name Mcfly Analytics) | **Marty-only** | A |
| L7 | Listing stills from Live Admin (not SAMPLE) | **Marty-only**, after Live unparks | F |

## Desk (`06`, `08`, `11`, `12`, REBUILD_SPEC)

| # | Deliverable | Status | Phase |
| --- | --- | --- | --- |
| D1 | Overview first fold: one plane, canonical sentence, **From orders**, returning / typical / weekend strip, orders chart captioned "Orders" | dirty-local (`overview-order-book.ts`, `OverviewFirstViewport.tsx`) | B |
| D2 | Remove from Overview fold: spend, Total ROAS, MER, CPA, "Look here first", Analytics essays, "Live is parked until launch", "Click for detail", soft KPI grid | dirty-local (partial); **live still shows them** | B |
| D3 | Kill dual nav (`YoY glance`, `Chart`, `Mix close`, `YoY year` sub-tabs) from the first fold | live still shows; unknown locally | B |
| D4 | `/demo` default window pinned to the Snowdevil lock (1–16 Sep 2026) so `/demo` = site still = **$68,457 / $69,891 / $631 / $45,409 / 23%**; SAMPLE chip small | not started (live shows $108,666) | B |
| D5 | Change `overview-order-book.test.ts` fixture from `$108,666` to the lock sentence, or keep it neutral (not a Snowdevil claim) | dirty-local | B |
| D6 | Coverage line: "Trial: 90 closed days of orders · Paid: up to 24 months" (no ShopifyQL wording) | not started / verify | B |
| D7 | Orders first fold: median hero, mean as foil; no scoreboard lead | dirty-local (verify) | B |
| D8 | Customers first fold: returning $ vs new $ from the order book; not QL New/Returning | dirty-local (verify) | B |
| D9 | Goals never sits above the sales figure | dirty-local (`app.goals.tsx`) | B |
| D10 | "Live is parked until launch" removed from `app.spend.tsx` (~555, ~1504) and `app.spend.import.tsx` (~492, ~1998), and anywhere a Live host could render it | not started | B |
| D11 | `salesPending` never blanks hero / median / returning / weekend when OrderFact has rows; includes `overviewGreetingPending()` | partial (component yes, greeting helper no) | C |
| D12 | Legacy zero `SalesDayFact` rows (source ≠ `shopifyql_sales_day_v1`) read as gaps, never certified $0 | not started | C |
| D13 | Backfill resume copy: "Orders still loading — N of M days on file — not $0" driven by `ORDER_FACT_MAX_DAYS_PER_RUN = 7` / `ORDER_FACT_MAX_PAGES_PER_RUN = 40` | not started | C |
| D14 | Analytics Total/Net/Gross and QL New/Returning stay **—** with the "From orders" label | verify | C |
| D15 | Fly `/` stops serving marketing: `serve-with-site.mjs` 301s non-trust marketing paths to `https://mcflyads.com<path>`; keeps `/privacy`, `/support`, `/terms`, embedded `/?shop=…` → `/app`; update `fly-trust-pages.test.ts` | not started | D |
| D16 | Remix `_index` OriginShell copy ("Total ROAS = Shopify sales ÷ ad spend… billboards") stops being reachable as a homepage; fallback redirects too | not started | D |

## Site (`05` §2, `07`, REBUILD_SPEC)

| # | Deliverable | Status | Phase |
| --- | --- | --- | --- |
| S1 | Home hero: locked H1 "Spend next to real Shopify sales.", locked subhead, one Install, one ghost demo, one price line, framed still of the new Overview | dirty-local v43 | B |
| S2 | No "Reviews 0" chip, no "App Store card still says ad spend", no proof chips, no "Click for detail" in the hero | dirty-local (verify: `Reviews 0` still appears 2× on local index) | B |
| S3 | 90 / 24 sentence on home, pricing, FAQ | dirty-local (present) | B |
| S4 | Pricing is a purchase page, not "One plan · screenshot this" / "Not in the fee" | dirty-local (verify) | B |
| S5 | `/demo` page: SAMPLE frame around the desk, not an apology + two fine-print captions | not started / verify | B |
| S6 | Competitor review-count tables off the home page | verify | B |
| S7 | Reviews 0 / listing lag / "not Analytics day totals" once each, in FAQ or footer | verify | B |
| S8 | Stamp v43+ everywhere (`mcfly-version`, CSS/JS `?v=`), `mcfly-build` names the publish | dirty-local | B |
| S9 | Search Console "Page with redirect": sitemap lists only 200 URLs; nothing in `sitemap.xml` is a `_redirects` source | not started | D/E |
| S10 | Custom Data Solutions / hire / lab pages stay 301'd, not in sitemap, not linked from home | verify | D |

## Ops / Marty

| # | Deliverable | Status | Phase |
| --- | --- | --- | --- |
| O1 | `support@mcflyads.com` MX (Namecheap → Cloudflare Email Routing) | **Marty-only** | E |
| O2 | Search Console: re-inspect the 16 Sep "Page with redirect" URLs after the Phase D Pages publish; request validation | **Marty-only** click; Ops writes the URL list | E |
| O3 | Founder outreach to the five stores for honest reviews | **Marty-only** | F |
| O4 | FUNNEL_WEEKLY paste (Partner visits / installs / trials / paid) | **Marty-only** | F |
| O5 | Live unpark decision (stage `overview_orders` first) | **Marty-only** | F (decision), after D |
| O6 | PCD Level 2 approval | Shopify / Marty | G |
| O7 | Living Board + canvas restamp to real live versions | Conductor | D |

---

# 4. Execution program (phases)

Phases run in order **0 → A∥B → C → D → E∥F → G**. A (docs only) runs in parallel with B. C folds into the same commit as B. D is the only publish. E and F are Marty work and never block A–D.

## Phase 0 — Stop the fleet, reconcile the base (NEW; blocks everything else)

**Why:** Local is 86 behind origin, the dirty tree overlaps 22 remote files, and a cloud fleet is still merging. Building on this base and deploying Fly would regress production. Merging from the fleet would bring back the micro-PR loop.

**Definition of done**
- Marty has paused the cloud agents/automations producing `-5bc6` / `-2ae5` PRs, and `git fetch` shows origin stays put for 30 minutes.
- Dirty tree is pushed as `cursor/rebuild-v43-local` (safety copy; `handover-mac-2026-09-22/working-tree.patch` is the second copy).
- Branch `cursor/rebuild-v43` = origin tip + dirty work, conflicts resolved, `read_reports` reverted, `npm test` green in `app/`.
- No open-PR merges. Site PRs #194–#203 closed with comment "superseded by rebuild-v43 (REBUILD_SPEC)". The rest are listed for Marty in the board, but none are merged.

**Owner:** Conductor only (Mac shell). No Task lanes. Model: Conductor on `grok-4.7-high`. For money-semantics hunks, one `claude-opus-5-5-medium` read.

**Commands**
```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model"
git fetch origin && git rev-list --left-right --count HEAD...origin/cursor/spend-trust-recurring
git switch -c cursor/rebuild-v43-local && git add -A && git commit -m "chore: snapshot dirty rebuild-v43 before reconcile" && git push -u origin cursor/rebuild-v43-local
git switch -c cursor/rebuild-v43 && git merge origin/cursor/spend-trust-recurring   # resolve 22 files
git checkout origin/cursor/spend-trust-recurring -- fly.toml app/shopify.app.toml app/shopify.app.public.toml   # drop read_reports
rg -n "read_reports" fly.toml app/shopify.app*.toml   # expect: no scopes line with read_reports
cd app && npm test
```
**Conflict rule:** first-fold files (Overview/Orders/Customers viewports, `app._index.tsx`, `demo._index.tsx`, `site/index.html`, `pricing.html`, `faq.html`) take the **REBUILD_SPEC intent** from local, then re-apply any origin *bug fix* that isn't copy (e.g. #189 shop-local clock, #190 coverage hash). All other files take origin.

## Phase A — Listing paste honesty (docs only) + Marty Save

**Definition of done**
- `rg -n "Trial includes \*\*24 months\*\*|trial includes 24 months|24mo-on-trial|Matches Fly \*\*396" docs/ops/LISTING_LIVE_PASTE.md` returns nothing.
- One history sentence everywhere in the pack: **"Trial includes 90 closed days of order history; paid includes up to 24 months."**
- Body leads with the first screen (this month vs last year from orders, typical order, returning dollars); spend is paragraph two.
- `docs/BILLING_TIERS.md` "Daily sales totals are a ShopifyQL query" rewritten to: "Until PCD Level 2, day sales are read from orders on file. ShopifyQL day totals (`read_reports`) come after L2."
- Marty saves in Partner (tagline, short, long, bullets, Pricing one plan). Cursor never Submits.

**Exclusive files:** `docs/ops/LISTING_LIVE_PASTE.md`, `docs/APP_STORE_LISTING.md`, `docs/BILLING_TIERS.md`.
**Model:** Listing lane on `composer-2.5-fast`. Tagline choice: Conductor (`grok-4.7-high`) picks two options for Marty.
**Verify:** the `rg` above plus `rg -n "90 closed days" docs/ops/LISTING_LIVE_PASTE.md` ≥ 2 hits.

## Phase B — Align Desk + Site to REBUILD_SPEC and the Snowdevil lock (no deploy)

**Definition of done (local, on `cursor/rebuild-v43`)**
- Desk D1–D10 done. Site S1–S8 done.
- Local `/demo` (dev server) first screen contains `This month is $68,457` and `From orders`, and contains none of `Look here first`, `Live is parked`, `Mix close`, `YoY glance`, `Shopify Total Sales`, `Click for detail`, `0×`.
- Local `site/index.html` hero has the locked H1 and subhead, one Install href `https://apps.shopify.com/mcfly-analytics-public`, one price line, and `Reviews 0` appears **at most once, outside `<header>`/hero**.
- Coverage line reads trial 90 / paid 24 on Overview, pricing, FAQ.
- `npm test` green; `snowdevil-founder-bar.test.ts`, `site-demo-phone.test.ts`, `site-demo-harbor.test.ts` still assert `$68,457`.

**Exclusive files**
- Desk: `app/app/**`, excluding anything under `app/scripts/**`.
- Site: `site/**`.

**Models:** Site and Desk both on `composer-2.5-fast`, run in parallel (the only allowed parallel pair).
**No deploy. No commit by workers.** The Conductor commits once B + C are green.

## Phase C — Volume honesty (same commit as B)

**Definition of done**
- `overviewGreetingPending()` does not return `true` just because `salesPending` when the window has OrderFact rows. Add a unit test: OrderFact rows present + `salesPending: true` → hero paints order-book $X.
- Read path treats `SalesDayFact` rows whose source ≠ `shopifyql_sales_day_v1` (and legacy zero rows) as **gaps**. A test proves a window of legacy zero rows renders **—** plus "still loading — not $0", never `$0`.
- Backfill resume line: when the order-fact crawl hasn't reached the window start (chunks of `ORDER_FACT_MAX_DAYS_PER_RUN = 7` days / `ORDER_FACT_MAX_PAGES_PER_RUN = 40` pages), the Overview shows "Orders still loading — N days on file — not $0." Test at N < window.
- Analytics Total / Net / Gross and QL New/Returning render **—**. Test exists.
- Nothing writes order sums into `SalesDayFact`. `rg -n "upsert.*SalesDayFact|salesDayFact\.(upsert|create)" app/app/lib` shows only the QL writer.

**Exclusive files:** Desk lane (continues in the same Task), `app/app/lib/sales-facts.server.ts`, `sales-pending.ts`, `overview-first-viewport.ts`, `order-facts.server.ts` (read-only unless copy), their tests.
**Model:** `composer-2.5-fast`. The Conductor writes the exact rules above into the prompt. Escalate a poison-row ambiguity to `claude-opus-5-5-medium` once.

### Enterprise volume bar (what a big store needs to believe us)

- Crawl runs in **7-day / 40-page chunks** and resumes; webhooks keep today live while history catches up.
- The desk always states **days on file** and says **"still loading — not $0"** until the window is covered.
- A window with no orders is **—**, never `$0`; YoY without a prior window is "Last year not on file", never `+∞%`.
- Trial caps at **90 closed days**; paid goes to **24 months**; the coverage line says which one applies.
- No SKU, no GMV pricing, no SSO. "Enterprise" here means the number is honest at volume.

## Phase D — One publish (the only deploy in this program)

**Pre-flight (all must pass)**
- `cursor/rebuild-v43` merged to `cursor/spend-trust-recurring` via one PR by the Conductor, pushed; `git rev-list --left-right --count HEAD...origin/cursor/spend-trust-recurring` = `0 0`.
- D15/D16 done (Fly root not marketing), `fly-trust-pages.test.ts` updated to the new contract.
- `fly.toml`: `SCOPES` has no `read_reports`; `MCFLY_SAMPLE_ONLY = "true"` unchanged.
- One `claude-opus-5-5-medium` critic pass over `git diff origin/cursor/spend-trust-recurring@{before}..HEAD` against §6; fix-only follow-up if needed.
- `live` site version probed: still v42 (if it moved, find out who deployed before overwriting).

**Steps (Conductor, Mac)**
1. Pages: copy `site/` to a non-git temp dir, then `wrangler pages deploy <tmp> --project-name mcflyads` (no `--branch`).
2. Fly: `~/.fly/bin/flyctl deploy -a mcfly-analytics` from `marketing-mix-model/` on `cursor/spend-trust-recurring` (HEAD = origin). Record the new version.
3. §6 smoke, every line.
4. Restamp `docs/LIVING_BOARD.md` (site v43+ + Pages deploy id, Fly vNNN + SHA), then update the canvas.

**Exclusive files for D15/D16:** `app/scripts/serve-with-site.mjs`, `app/scripts/shopify-app-path.mjs`, `app/app/routes/_index/**`, `app/app/lib/fly-trust-pages.test.ts`. These belong to the **Desk** lane for this phase only (named explicitly in the prompt).
**Model:** Desk on `composer-2.5-fast` for D15/D16; Conductor inherit for deploy.

**Rollback:** `flyctl releases -a mcfly-analytics` then `flyctl deploy --image <v445 image>`; Pages: promote previous deployment in the dashboard (Marty) or redeploy the v42 mirror from P6.

## Phase E — Search Console leftovers + `support@` MX (Marty clicks)

- Ops writes `docs/ops/SUPPORT_MX.md` (exact Cloudflare Email Routing records for `support@mcflyads.com`) and a list of every sitemap URL with its live status code (`curl -s -o /dev/null -w "%{http_code} %{redirect_url}"`).
- **Done:** every `<loc>` in `https://mcflyads.com/sitemap.xml` returns 200 with no redirect; Marty has requested validation in Search Console; `dig MX mcflyads.com +short` shows Cloudflare routes; a test email to `support@` arrives in the business inbox.
- Model: Ops on `composer-2.5-fast` or Conductor shell only.

## Phase F — Reviews outreach + FUNNEL + unpark decision (Marty; never a freeze on A–D)

- Marty emails the five founder stores (drafts may be prepared in Gmail by the Conductor; **Marty sends**). Never incentivize and never script star ratings.
- Marty pastes one organic week into `docs/ops/money/FUNNEL_WEEKLY.md`.
- **Unpark decision (O5):** after D, the Conductor gives Marty a one-page evidence pack: §6 smoke PASS, Phase C tests, and the first-session window at 90 days. Marty decides `MCFLY_SAMPLE_ONLY=false` + `MCFLY_LIVE_STAGE=overview_orders`. Until then, paying installs see SAMPLE. **Say this plainly to Marty. It is the biggest money leak.**
- Listing stills from Live Admin after unpark (L7).

## Phase G — After PCD Level 2 only

- Only when Shopify approves L2: add `read_reports` (Marty approves the scope change, `shopify app deploy` of config, all installed shops re-auth), ShopifyQL day totals into `SalesDayFact`, and only then any "matches Shopify Analytics" label.
- Until then, the label stays **From orders** and Analytics clocks stay **—**. L2 blocks only this phase.

---

# 5. Lane prompts (copy-paste ready)

The Conductor pastes these into Task. Each prompt includes model, exclusive files, done bar, and "do not". Workers do not commit, deploy, Submit, or open PRs.

## Site lane

```text
Task: Site lane — Phase B for Mcfly Analytics. Model: composer-2.5-fast.
Repo: /Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model on branch cursor/rebuild-v43 (already reconciled with origin by the Conductor). Do not switch branches.
Read first: docs/research/2026-09-22-revamp/REBUILD_SPEC.md (Site section) and CURSOR_OPTIMAL_PLAN.md §3 rows S1–S8, S10.

EXCLUSIVE FILES: site/** only. Do not touch app/**, docs/**, fly.toml, or any toml.

Do:
1. Home hero: H1 exactly "Spend next to real Shopify sales." Subhead exactly "Median ticket and returning dollars from orders you already have. Type spend later for Total ROAS — empty stays —." Wordmark "Mcfly Analytics" reads as the brand. One primary Install → https://apps.shopify.com/mcfly-analytics-public. One ghost "Try the demo" → /demo. One line "7-day trial, then $39/store/mo." One framed still of the new Overview: "This month $68,457 · same days last year $69,891 · From orders · Returning $45,409 · Typical order $631 · Weekend 23%" with a small SAMPLE label. No other revenue numbers.
2. Remove from hero and fact strips: "Reviews 0" chips, proof-chips, "App Store card still says ad spend", "Click for detail", ShopifyQL wording, "Analytics does not show", "Live is parked".
3. "Reviews 0", listing lag, and "not Analytics day totals" appear once each, in faq.html or the footer. Remove competitor review-count tables from index.html.
4. Every page: history sentence exactly "Trial includes 90 days of order history; paid includes up to 24 months." No "trial includes 24 months" anywhere.
5. pricing.html: one plan, $39, 7-day trial, the history sentence, uninstall stops the charge. Delete "screenshot this" and "Not in the fee" framing.
6. demo.html: SAMPLE is a thin frame label around the iframe. Delete apology paragraphs and the two clock-essay fine-print captions. Delete "Open the full Snowdevil desk" if the iframe is the desk.
7. Stamp v43 (or v44 if Conductor says v43 is taken): meta mcfly-version, mcfly-build "rebuild-first-screen-v43", and every ?v= cache key.
8. sitemap.xml lists only URLs that return 200 (no _redirects sources). Custom/hire/lab pages stay 301 and unlinked from home.

Done when (run and paste output):
  rg -c "Spend next to real Shopify sales" site/index.html            # ≥1
  rg -n "trial includes 24 months|Trial includes 24 months" site/     # none
  rg -n "Click for detail|screenshot this|still says ad spend|Live is parked" site/  # none
  rg -c "Reviews 0" site/index.html                                    # ≤1 and not inside the hero section
  rg -n "108,666" site/                                               # none
  cd app && npx vitest run app/app/lib/site-demo-phone.test.ts app/app/lib/site-demo-harbor.test.ts app/app/lib/snowdevil-founder-bar.test.ts
Do not: deploy Pages, run wrangler, commit, open PRs, invent reviews/installs, edit app/**.
Return: files changed, the grep outputs, and any test you could not make pass.
```

## Desk lane

```text
Task: Desk lane — Phases B + C (and D15/D16 when Conductor says "Phase D") for Mcfly Analytics. Model: composer-2.5-fast.
Repo: /Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model on branch cursor/rebuild-v43. Do not switch branches.
Read first: docs/research/2026-09-22-revamp/REBUILD_SPEC.md (App section), 12-ANALYTICS_VS_POSSIBLE.md §2–§5, CURSOR_OPTIMAL_PLAN.md §3 rows D1–D16 and §4 Phase C.

EXCLUSIVE FILES: app/app/** (Phase B/C). For Phase D only, also app/scripts/serve-with-site.mjs, app/scripts/shopify-app-path.mjs, app/app/routes/_index/**. Never site/**, docs/**, fly.toml, app/shopify.app*.toml.

Religion: Total ROAS = Shopify sales ÷ entered spend, only on Spend, empty = —. No pixels, no sessions, no "matches Shopify Analytics", no "true ROAS". Never write order sums into SalesDayFact.

Phase B:
1. Overview first fold = one plane: meta row; "THIS MONTH"; $X; "same days last year $Y"; "From orders"; strip "Returning $A · Typical order $B · Weekend C%"; orders-by-day chart captioned "Orders". Sentence must read "This month is $X — up N% vs the same days last year." Prior missing → "Last year not on file", delta —.
2. Remove from the Overview fold: spend, Total ROAS, MER, CPA, "Look here first", Analytics essays, "Live is parked until launch", "Click for detail", soft KPI grid, and the sub-nav "YoY glance / Chart / Mix close / YoY year".
3. /demo defaults to the Snowdevil lock window (1–16 Sep 2026) so it paints $68,457 vs $69,891, typical $631, returning $45,409, weekend 23%. Keep a small SAMPLE chip. Change the $108,666 fixture in overview-order-book.test.ts to a neutral non-Snowdevil number or the lock.
4. Coverage line: "Trial: 90 closed days of orders · Paid: up to 24 months." No ShopifyQL wording.
5. Orders fold hero = median (typical) order, mean as quiet foil. Customers fold hero = returning $ vs new $ from the order book. Goals never above the sales figure.
6. Delete "Live is parked until launch" strings in app.spend.tsx and app.spend.import.tsx (and any Live-host render path).

Phase C:
7. overviewGreetingPending(): salesPending alone must not return true when the window has OrderFact rows. Add a test.
8. SalesDayFact rows whose source ≠ "shopifyql_sales_day_v1", and legacy zero rows, are gaps on the read path. Test: legacy zero window → "—" plus "Orders still loading — not $0".
9. Resume copy when the crawl (ORDER_FACT_MAX_DAYS_PER_RUN=7, ORDER_FACT_MAX_PAGES_PER_RUN=40) has not reached the window start: "Orders still loading — N days on file — not $0." Test at N < window.
10. Analytics Total/Net/Gross and ShopifyQL New/Returning render —. Test.

Phase D (only when told): serve-with-site.mjs — on Fly, GET for any marketing path (/, /index.html, /pricing, /faq, /about, /product, other site pages) 301 → https://mcflyads.com<same path+query>, EXCEPT: /privacy, /support, /terms, /health, /demo and /demo/*, /app*, /auth*, /webhooks*, build assets, and the embedded redirect (shouldSkipMarketingSite → /app). Update fly-trust-pages.test.ts to assert this contract.

Done when:
  cd app && npm test                      # green
  rg -n "Live is parked" app/app          # only in tests asserting absence
  rg -n "Look here first|Mix close|YoY glance" app/app/components app/app/routes   # none on first fold
  rg -n "salesDayFact\.(upsert|create)|SalesDayFact.*upsert" app/app/lib   # only the ShopifyQL writer
Do not: fly deploy, change scopes, change MCFLY_SAMPLE_ONLY, commit, open PRs, touch site/**.
Return: files changed, new test names, npm test summary, anything you could not do.
```

## Listing lane

```text
Task: Listing lane — Phase A for Mcfly Analytics. Model: composer-2.5-fast.
Repo: /Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model (any branch; docs only).
EXCLUSIVE FILES: docs/ops/LISTING_LIVE_PASTE.md, docs/APP_STORE_LISTING.md, docs/BILLING_TIERS.md.

Do:
1. Everywhere in the paste pack: replace "Trial includes 24 months" / "24mo honesty check" with "Trial includes 90 closed days of order history; paid includes up to 24 months." Rename the pre-Save check to "90/24 honesty check".
2. Remove stale gates: "Matches Fly 396 + site v30", "Site v20 live (Pages a7862580)", "Fly 331 desk + site v19". Replace with "Spot-check the live mcflyads.com version before Save."
3. Re-lead the long description and first bullet with the first screen: this month vs the same days last year from orders; typical order; returning dollars. Spend and Total ROAS (sales ÷ entered spend, empty = —) is paragraph two. Cut the Meta/Google/TikTok/billboard pile from the lead (it may stay once lower down).
4. Tagline (≤80 chars): keep the current line as option 1, add two options that make no claim about what Shopify Analytics lacks, e.g.
   - "This month vs last year, typical order, returning dollars — from orders"
   - "Your Shopify orders as a morning number. Spend next to sales, flat $39"
   Mark all three "Marty picks".
5. BILLING_TIERS.md: replace "Daily sales totals are a ShopifyQL query (read_reports), not an order crawl." with "Until PCD Level 2, day sales come from orders on file. ShopifyQL day totals (read_reports) come after L2."
6. Keep: reviews 0, no install counts, no invented ratings, "Cursor does not Submit", App URL = Fly, Website = mcflyads.com.

Done when:
  rg -n "Trial includes \*\*24 months|trial includes 24 months|396|v30|v20|v19" docs/ops/LISTING_LIVE_PASTE.md   # none
  rg -c "90 closed days" docs/ops/LISTING_LIVE_PASTE.md   # ≥2
Do not: open Partner Dashboard, upload images, edit site/** or app/**, commit.
Return: diff summary + the three tagline options.
```

## Ops lane

```text
Task: Ops lane — Phase E prep for Mcfly Analytics. Model: composer-2.5-fast (or Conductor shell with no agent).
EXCLUSIVE FILES: docs/ops/SUPPORT_MX.md, docs/ops/money/FUNNEL_WEEKLY.md (template only — no numbers), docs/ops/SEARCH_CONSOLE_REDIRECTS.md (new).

Do:
1. For every <loc> in https://mcflyads.com/sitemap.xml: curl -s -o /dev/null -w "%{http_code} %{redirect_url}" and tabulate. Flag any non-200. Cross-check against site/_redirects sources.
2. Write SUPPORT_MX.md: exact Cloudflare Email Routing steps + DNS records for support@mcflyads.com → business Gmail, and a verify block (dig MX mcflyads.com +short; test send).
3. FUNNEL_WEEKLY.md: empty weekly row template (visits, installs, trials, paid, uninstalls, reviews) with "Marty pastes from Partner". No numbers invented.
Done when: the three files exist, every sitemap URL has a status code, no product code touched.
Do not: change DNS, click Search Console, buy ads, deploy, commit, invent numbers.
```

---

# 6. Publish bar and smoke curls (must all pass after Phase D)

```bash
# --- quick probe (every Conductor day) ---
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model"
git fetch -q origin && git rev-list --left-right --count HEAD...origin/cursor/spend-trust-recurring   # expect 0 0
gh pr list --state open --json number --jq length
~/.fly/bin/flyctl releases -a mcfly-analytics | head -3
curl -s https://mcflyads.com/ | rg -o 'mcfly-version" content="[^"]+'
curl -s -o /dev/null -w "%{http_code}\n" https://mcfly-analytics.fly.dev/health          # 200

# --- site (Pages mcflyads) ---
curl -s https://mcflyads.com/ | rg -o 'mcfly-version" content="v4[3-9]'                   # v43+
curl -s https://mcflyads.com/ | rg -c "Spend next to real Shopify sales"                 # ≥1
curl -s https://mcflyads.com/ | rg -c 'apps.shopify.com/mcfly-analytics-public'          # ≥1
curl -s https://mcflyads.com/ | rg -c '\$68,457'                                          # ≥1
curl -s https://mcflyads.com/ | rg -n 'still says ad spend|Click for detail|108,666|Live is parked'   # none
for p in / /pricing /faq /demo; do curl -s "https://mcflyads.com$p" | rg -n -i "trial includes 24 months"; done   # none
curl -s https://mcflyads.com/pricing | rg -c "Trial includes 90 days of order history; paid includes up to 24 months"   # ≥1

# --- Fly is the app, not the site ---
curl -sI https://mcfly-analytics.fly.dev/ | rg -i "^(HTTP|location)"          # 301 → https://mcflyads.com/
curl -sI https://mcfly-analytics.fly.dev/pricing | rg -i "^location"          # https://mcflyads.com/pricing
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://mcfly-analytics.fly.dev/?shop=example.myshopify.com&host=abc"   # 302 → /app?...
for p in /privacy /support /terms /demo; do curl -s -o /dev/null -w "$p %{http_code}\n" "https://mcfly-analytics.fly.dev$p"; done   # all 200

# --- /demo first screen ---
curl -s https://mcfly-analytics.fly.dev/demo > /tmp/demo.html
rg -c "From orders" /tmp/demo.html                  # ≥1
rg -c 'This month is \$68,457' /tmp/demo.html       # ≥1
for s in "Look here first" "Live is parked" "Mix close" "YoY glance" "Shopify Total Sales" "Click for detail" "0×" "108,666"; do printf "%s: " "$s"; rg -c -F "$s" /tmp/demo.html || echo 0; done   # all 0

# --- config did not drift ---
~/.fly/bin/flyctl config show -a mcfly-analytics | rg -n "SCOPES|MCFLY_SAMPLE_ONLY"   # no read_reports; SAMPLE_ONLY "true"
rg -n "read_reports" app/shopify.app.toml app/shopify.app.public.toml fly.toml | rg -v "^\s*#"   # none in scopes lines

# --- sitemap has no redirect sources ---
curl -s https://mcflyads.com/sitemap.xml | rg -o '<loc>[^<]+' | sed 's/<loc>//' | while read u; do curl -s -o /dev/null -w "%{http_code} $u\n" "$u"; done | rg -v "^200"   # none
```

Then a visual check of `https://mcflyads.com/` and `https://mcfly-analytics.fly.dev/demo` at 1280px and 390px in the Cursor browser: one screenshot each, embedded in the board journal. Only one visual pass.

---

# 7. Marty-only gates (Cursor never clicks these)

| # | Gate | Blocks |
| --- | --- | --- |
| M0 | **Pause the cloud agent fleet / automations** pushing and self-merging `-5bc6`, `-2ae5`, and other PRs into `cursor/spend-trust-recurring` | Phase 0 → everything |
| M1 | Partner **Save** of the listing paste (tagline pick, short, long, bullets) | Phase A done |
| M2 | Partner **Pricing**: one plan "Mcfly Analytics", $39 / 30 days, 7-day trial, no Free | Phase A done |
| M3 | **Unpark Live** (`MCFLY_SAMPLE_ONLY=false`, stage `overview_orders`) after the evidence pack | Paying merchants seeing their own store |
| M4 | Approve any **scope change** (`read_reports`) and the `shopify app deploy` of config that forces re-auth | Phase G |
| M5 | `support@` **MX** DNS change | Phase E |
| M6 | **Search Console** validation request | Phase E |
| M7 | **Founder outreach** emails to the five stores (Conductor may draft; Marty sends) | Phase F reviews |
| M8 | **FUNNEL_WEEKLY** paste from Partner | Ads gate |
| M9 | Live Admin **listing stills** upload | After M3 |
| M10 | **Ads budget** (still NO until smoke PASS + 3 honest reviews + one organic FUNNEL week + P0 on Fly) | Ads |
| M11 | Pages dashboard **rollback** if Phase D Pages goes wrong | Rollback only |
| M12 | Any Partner **Submit** / re-review | Never Cursor |

---

# 8. Kill list

- **Deploying Fly or Pages from a tree that is behind origin**, or from the dirty tree before Phase 0.
- **Merging any of the 68 open PRs** during this program. More micro-PRs. Cloud agents on the ship branch.
- **Shipping the `read_reports` scope** before L2 and Marty's approval.
- Pixels, MTA, sessions, conversion, "true ROAS", ad-platform OAuth, "matches Shopify Analytics", ShopifyQL parity copy.
- Order sums written into `SalesDayFact`. Painting legacy zero day-facts as a certified year. `$0` or `0×` for unknown.
- "Trial includes 24 months." "Live is parked until launch" on any surface a stranger or merchant sees.
- `$108,666` (or any number other than the Snowdevil lock) on the site or `/demo` first screen.
- Inventing reviews, ratings, install counts, GMV, logos, or App Store URLs. Reviews chips in the hero.
- Fly-deploying `cursor/clean-revamp-v8`. Shipping from `mcfly-analytics/` or `marketing-mix-model-os-v5/`.
- `wrangler pages deploy --branch`, Pages project `marty-smithson`, git remote `origin-alt` for the ship.
- Treating PCD L2 or "need 3 reviews" as a ship freeze. L2 blocks only Phase G; reviews are outreach.
- Four frontier agents at once; Opus/Fable on CSS or copy that is already locked; Fable for routine plans; re-running research on a second model; a second visual audit of the same build; restarting a lane into a thinner method.
- Reviving `REVAMP_SPEC.md`. Writing another spec before Phase D is live.
- New features: Goals densify, Advanced, shareable-card packs, Product/Promo→LTV densify, AI chat, P&L/COGS, competitor tables, a second tier or an "enterprise" SKU.
- Leading with Custom Data Solutions. Job search, trading, Lucky dash.
- Starting ads. Unparking Live without Marty. Partner Submit.

---

# 9. Next action

**Conductor, now:** send Marty one message asking him to pause the cloud agent fleet that is self-merging into `cursor/spend-trust-recurring` (gate M0). Then snapshot the dirty tree to `cursor/rebuild-v43-local`, merge `origin/cursor/spend-trust-recurring` (86 commits ahead) into `cursor/rebuild-v43` with `read_reports` reverted and `npm test` green, before spawning any lane.
