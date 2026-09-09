# Capability map — what the Mcfly Analytics desk actually does

**Lane:** R0 · **Written:** 2026-09-08 · **Tree:** `mcfly-analytics/` on `cursor/redesign/enterprise-desk`
**Method:** read every route under `app/app/routes`, then cross-check `MASTER_PLAN.md` §1/§6, `app/app/lib/product-labels.ts`, `VALUE_THESIS.md`, `RETIRED_SURFACES.md`, `APP_STORE_LISTING.md`, `entitlements.ts`, `desk-nav.ts`.
**Supersedes:** the shorter R0 draft of this file. Its findings are carried forward below, with two corrections noted in §4.

**Religion lock (applies to every row below):** Total ROAS = Shopify Total Sales (after returns, incl. shipping/tax/duties/fees) ÷ ad spend the merchant entered. No pixels, no MTA, no path credit. aMER = new-customer sales ÷ spend. Averages, never marginal or causal. Reviews live = **0** — nothing in this file infers install counts, review counts, or competitor prices.

**Trust grades used here**

| Grade | Means |
| --- | --- |
| **Strong** | Merchant can complete the job, honesty gates fire correctly, empty states teach rather than lie |
| **Partial** | Real capability exists but is gated, buried, under-rendered, or promises more than it draws |
| **Weak** | Capability exists in code but has no reachable merchant path, or the merchant-facing copy oversells it |
| **Dead** | Retired on purpose — redirect or ops-only residue |

---

## 1. Route inventory (everything under `app/app/routes`)

### Merchant-facing (embedded Admin, in nav)

| Route | Nav label | `later`? | Grade |
| --- | --- | --- | --- |
| `app._index.tsx` → `/app` | Overview | core | **Strong** |
| `app.spend.tsx` → `/app/spend` | Spend | core | **Strong** |
| `app.settings.tsx` → `/app/settings` | Settings | core | **Strong** |
| `app.goals.tsx` → `/app/goals` | Goals | depth | **Partial** |
| `app.allocation.tsx` → `/app/allocation` | Spend Allocation | depth | **Partial** |
| `app.ltv.tsx` → `/app/ltv` | LTV | depth | **Partial** |
| `app.advanced.tsx` → `/app/advanced` | Advanced | depth | **Partial** |

Nav is defined in `lib/desk-nav.ts` and is deliberately never hidden — depth pages soft-gate with `FirstTrustedRoasGate` ("First get Total ROAS") instead of disappearing, because hiding tabs "felt broken."

### Merchant-reachable but not in nav

| Route | What it is | Grade |
| --- | --- | --- |
| `app.demo.tsx` → `/app/demo` | SAMPLE preview control + ops-only listing-shot links | **Partial** |
| `app.spend.template.tsx` → `/app/spend/template` | CSV template generator (7 shapes) | **Strong** (hidden) |
| `app.period-ledger[.]csv.tsx` → `/app/period-ledger.csv` | Closed-day sales+spend ledger export | **Strong** (hidden) |
| `app.billing.tsx` → `/app/billing` | POST-only Shopify subscription confirmation | **Partial** |
| `app.data-mode.tsx` → `/app/data-mode` | POST-only Sample ⇄ Real switcher | **Strong** |
| `app.close.tsx` → `/app/close` | Retired Monday Close → redirects to `/app` | **Dead** (by design) |
| `app.connections.tsx` → `/app/connections` | Retired Meta/Google OAuth → redirects to `/app/spend` | **Dead** (by design) |

### Non-desk routes (not merchant jobs)

`_index/route.tsx` (public Fly landing → App Store install CTA, refuses shop-domain collection per 2.3.1) · `auth.$.tsx` + `auth.login/` (Shopify OAuth) · `v1.mer.tsx`, `v1.spend.tsx`, `v1.allocation.tsx` (token API) · `webhooks.*` (orders, uninstall, scopes, subscriptions, compliance) · `api.jobs.tick.tsx` (ops-secret backfill tick) · `health.tsx` (`ok` + `db: up`) · `faq|pricing|privacy|support|terms.tsx` (301 from Fly origin to mcflyads.com).

---

## 2. Surface-by-surface

### 2.1 `/app` — Overview (the desk)

- **Merchant job:** "Did the money I spent on ads clear what the till actually kept, for the period I picked?"
- **Inputs required:** Shopify orders (automatic, via `SalesDayFact` backfill) + at least one non-sample `SpendEntry`. Margin % is **optional** and only unlocks break-even — it never gates the scoreboard.
- **What it draws:** `CashVerdict` sentence, `TotalRoasGauge` (Total ROAS vs target vs break-even), Shopify Total Sales tile with prior-period delta, Total Spend tile with per-channel $ and % mix, Acquisition glance (aMER, new vs returning), LTV snapshot (Cash CAC / LTV·90d / LTV:CAC), collapsed Spend Explorer (daily spend vs sales, custom from/to), Share Overview (Email), Period ledger CSV button, `ReviewAsk`.
- **Honesty gates (this is the strongest part of the product):**
  - `resolveTrustedRoasHero` refuses to print a multiple when sales facts are still loading — shows "Sales facts loading" / "Period not covered" instead of a flattering `0.00`.
  - Prior-period deltas are **skipped entirely** when prior coverage is incomplete or clamped, rather than faking a 0 baseline.
  - `salesUntrustedZero` distinguishes "facts said $0 and the live Admin probe failed" from a genuinely quiet period (`liveConfirmedZero`).
  - Hard-stop comment in the loader: desk paint never runs unbounded `fetchShopifySales`; only stored day-facts plus a page-capped "today" top-up. This is what keeps a 100k-order store from timing out.
  - `CashTrustBanners` surfaces: spend coverage holes, below-break-even, stale margin, truncated/unavailable today, order-window limits, deep-history grant CTA.
  - `PeriodTrustNote` + a "Period not trusted" / "Finish spend trust" chip.
  - Period ledger button is **disabled with an explanation** whenever the server would 409.
- **SAMPLE vs live:** SAMPLE swaps the whole sales+spend source (`fetchSampleSales`), keeps a yellow `SampleDeskBanner`, blocks `ReviewAsk`, and forces the primary CTA to "Turn SAMPLE preview OFF." Listing-capture mode (`?listing=1`) hides the SAMPLE banner but the numbers stay sample — documented, and the Demo page says so.
- **Cold path:** first `/app` open with no live spend **redirects to `/app/spend?activate=1`** (`firstOpenRedirect`). `?stay=1` opts out. SAMPLE and shot mode never bounce.
- **Grade: Strong.** This is a finished surface. The honesty machinery here is the product's actual moat.

### 2.2 `/app/spend` — Spend (the only input the merchant owns)

- **Merchant job:** "Get my ad spend into the desk without another login, and know which days are still missing."
- **Five write paths:** typed one-day row (`spend-day`, the taught primary), paste CSV, file upload CSV, multi-file **Combine & import** (up to 20 slots, one channel each), and "Divide a bill into daily rows" (monthly/quarterly/bi-annual/annual lump → equal daily rows).
- **Supporting surfaces:** channel picker (drives template columns, persisted in `localStorage`), inline template preview + "Download blank template", per-platform export playbook (14 platforms with real click-steps), coverage strip for the last 28 local days, missing-days list with a one-click "download blanks for exactly those dates" link, selected-period spend total, period-ledger CSV button, last 3 entries.
- **Honesty gates:**
  - **Fail-closed import.** Any parse error → nothing is written (explicitly the "Ablestar" rule in the code). No soft success with an error list.
  - **Replace confirmation.** If the upsert preview shows `updated > 0`, the merchant gets "Same days already on the desk" before anything overwrites.
  - **SAMPLE write block.** With SAMPLE on, every live write intent is refused: "this is not your money… Nothing was written."
  - Idempotent key `shopId + channel + periodStart` — re-typing a day replaces, never doubles.
  - Backdating past the `SalesDayFact` window warns that Shopify sales won't exist to divide.
  - Size limits (2 MB / 50k rows) checked before the file is read into memory.
  - Coverage copy converts holes into cash language: "26 days missing — Total ROAS looks better than cash."
- **Grade: Strong.** The single best-executed page for a cold merchant. TTFV is genuinely a typed row.

### 2.3 `/app/settings` — Settings

- **Merchant job:** set break-even and the target multiple; manage plan, SAMPLE visibility, and privacy exports.
- **Inputs:** profit margin % (optional; blank is valid), Total ROAS Goal (blank = clear the rail, never a 0 sentinel). Sales basis is **hard-locked to Total** in the action — the Net toggle from `MASTER_PLAN.md` §6 is not exposed.
- **Contains:** Desk targets panel with live break-even preview, "More" drawer → Sample vs real store (including "Real store only — hide Sample" for good), Plan & billing (7-day trial → $39, `ProUpgradeButton` → `/app/billing`), Privacy data exports (download Level-1 `data_request` JSON packages).
- **Honesty gates:** margin confirmation timestamps drive a "Reconfirm profit margin" stale banner; billing syncs from Shopify on load and fails open to the cached flag.
- **Grade: Strong.**

### 2.4 `/app/goals` — Goals

- **Merchant job:** "Is this period's till cash on pace against a sales target I set?"
- **Inputs:** monthly sales goals for a year (manual, or one-click **Grow YoY** at 5/10/15/20% off prior-year actuals), plus the Total ROAS Goal.
- **Draws:** MTD/QTD/YTD gauges, a full-year monthly board with actual vs goal vs prior year, YoY panel, monthly fine-tune drawer.
- **Honesty gates:** `FirstTrustedRoasGate` soft-gate when there is no live spend; `DeskPageWhy` explains it sits *next to* Total ROAS, not instead of it; sales-load failure banner.
- **SAMPLE:** goals board runs on sample sales/spend when SAMPLE is on, banner labeled.
- **Grade: Partial.** The board is real and complete, but it is depth: it needs a full prior year of `SalesDayFact` to make Grow YoY meaningful, and a new install's first year is empty. Not a reason a merchant installs; a reason they stay.

### 2.5 `/app/allocation` — Spend Allocation

- **Merchant job (as advertised in-app):** "which channels to cut or keep so break-even is protected."
- **What it actually renders:** (1) top 3 quarterly allocations ranked by portfolio Total ROAS, (2) a spend-share pie + channel list for the selected period, (3) rolling 7/14/28-day Total ROAS vs the prior equal window.
- **The gap:** `metrics.allocation.actions` exists and is computed, but the page uses it only to annotate the history view. **No recommendation card is rendered.** The empty state literally promises "then this page says which channels to cut or keep" — the page never says it. Merchants get a mix picture and a rolling trend, and must infer the action themselves.
- **Honesty gates (these are good):** hard lock when spend coverage <70%, when declared-vs-desk recon drifts past ±5%, or when margin is unset (`breakEvenMer == null`). Never builds advice from `emptySales` zeros after a sales-load failure. Copy is spend-share and portfolio framed — no channel-level profitability claim, consistent with `MASTER_PLAN.md` §1.4.
- **Grade: Partial.** Honest and religion-clean, but under-rendered against its own copy and against the listing's "Allocation" bullet.

### 2.6 `/app/ltv` — LTV / Acquisition

- **Merchant job:** "Do new customers pay back the spend I logged?"
- **Draws:** Acquisition this period (new vs returning counts and sales share, AOV, Cash CAC), Lifetime value cohorts (30 / 90 / 365-day revenue per new customer, LTV:CAC, contribution-adjusted LTV when margin is set), cohort deep dive.
- **Inputs:** `OrderFact` / `CohortFact` backfill (fire-and-forget from Overview and this page), shop IANA timezone, and — for anything beyond ~60 days — the `read_all_orders` grant.
- **Honesty gates:** five distinct empty states, none of which read as broken: `no_timezone`, `history_limited` ("not permanently dead — Shopify will prompt"), `backfilling` ("Total ROAS does not wait on LTV"), `no_spend` ("Cash CAC is period spend ÷ new customers"), `pro_required`. `DeepHistoryBanner` offers the scope grant. PCD-clean: opaque customer key + `numberOfOrders` only, no CRM.
- **SAMPLE:** cohorts run on sample orders with an explicit "not your live Shopify orders" banner.
- **Grade: Partial.** The math and the empty-state honesty are strong; delivery depends on a merchant granting deeper order access and on backfill completing. A day-one install sees "filling," not value.

### 2.7 `/app/advanced` — Advanced Metrics

- **Merchant job:** "Show me the rest of the formulas after I trust the multiple."
- **Sections:** Portfolio efficiency (Total ROAS, aMER, gross MER, net vs total, vs target, vs break-even) · Affordability control (spend headroom for period / month / day, max spend at target, max at break-even, pace) · Acquisition & payback (new vs returning, AOV, Cash CAC, LTV 30/90/365, LTV:CAC) · Spend structure (coverage, recon) · Allocation summary · Prior period deltas.
- **Honesty gates:** every tile ships a `formula` line and a `caveat` line; page kicker is "Enterprise formulas · averages, not causal channel ROAS"; `notTrueRoas` chip.
- **Grade: Partial.** Genuinely dense and religion-clean, but it is read-only — no tile leads to an action, and Affordability headroom (the most decision-shaped math in the app) is buried three tabs deep behind a `<details>` inside a depth page.

### 2.8 `/app/demo` — SAMPLE preview

- **Merchant job:** rehearse the desk without touching live numbers.
- **Actions:** `prepare` / `seed` / `enable` (seeds ~3 years of matched sample days at a target Total ROAS), `disable`, `clear`.
- **Honesty gates:** when SAMPLE is on the page leads with a pre-review warning ("Turn SAMPLE preview OFF"); when off it confirms "Using your real store."
- **Problem:** the same page carries a **"Listing shots (ops) — Staff only"** drawer with `?listing=1` capture links and crop instructions. That is Mcfly internal ops shipped inside a merchant-visible route.
- **Grade: Partial.**

### 2.9 Merchant-facing math glossary

Every noun below is enforced in `app/app/lib/product-labels.ts` — the code has one vocabulary, and it matches `MASTER_PLAN.md` §1.

| Noun | Desk definition |
| --- | --- |
| **Total ROAS** | Shopify Total Sales (after returns, incl. shipping / tax / duties / fees) ÷ ad spend the merchant entered, same period |
| **Break-even Total ROAS** | ≈ 1 ÷ confirmed contribution margin |
| **aMER** | New-customer sales ÷ spend — average acquisition efficiency, not channel CAC truth |
| **Total ROAS Goal** | Optional operator target; the Overview gauge shows the rail only when `targetMerConfirmedAt` is set |
| **Cash CAC** | Period ad spend ÷ new customers |
| **Period trust** | Closed-day sales and spend complete enough to allow above/below-target language |
| **Deep history** | Without the `read_all_orders` grant, an honest ~60-day fact window with a grant CTA — never a silent truncation |

---

## 3. Hidden power (real capability with no front door)

1. **API v1 — `/v1/mer`, `/v1/allocation` (GET), `/v1/spend` (POST).** Bearer-token auth against per-shop `ApiToken` rows, with a global env token that is off by default and requires either `MCFLY_ALLOW_GLOBAL_API_TOKEN=1` or an `X-Mcfly-Ops-Secret` header plus `X-Mcfly-Shop-Id`. Zod-validated queries, capped date ranges, 64 KB body ceiling, `X-Mcfly-Warning` header when SAMPLE is on, and a **503 `sales_facts_incomplete`** rather than a partial number — the API honors the same honesty religion as the UI. `/v1/spend` upserts on the same idempotent key as CSV. **There is no merchant-facing token mint UI anywhere.** `mintApiToken()` exists in `api-auth.server.ts` and is called by nothing in the routes. So the entire API is ops-only in practice, and a Sheets companion (`MASTER_PLAN.md` §7 Phase 5) is one small settings panel away from being real.
2. **Period ledger CSV — `/app/period-ledger.csv?period=…`.** Closed-day sales + spend for the selected period, resolved entirely server-side (the browser cannot supply a shop, a window, or a sales value), read-only, no backfill, no GraphQL. Both Overview and Spend render the button and pre-mirror the server's gates so the control is never offered when the route would 409. This is the "defend it to finance" artifact the positioning promises, and it is currently a single grey secondary button.
3. **CSV template generator — `/app/spend/template`.** Seven distinct outputs from one route: full wide, wide blank, blank-rows-for-specific-dates, selected-platform blank, selected-platform with examples, and **`?pipe=long` / `?pipe=wide`** SyncWith-class Sheet shapes. The pipe templates are the merchant-paid automation wedge from `PIPE_AUTOMATION_WEDGE.md` — and they are reachable **only by typing the query string**. Nothing in the UI links to them.
4. **Combine & import.** Up to 20 platform exports, each pinned to a channel, parsed and merged in one transaction with a single replace confirmation. This is the multi-platform Monday paste in one click and it is a `<details>`-adjacent block on Spend.
5. **Divide a bill into daily rows.** Agency retainers and annual invoices become daily spend so coverage doesn't show false holes. Solves a real MER-spreadsheet pain and is hidden inside a collapsed `<summary>`.
6. **Share Overview (mailto).** `formatOverviewShareText` builds a full period card — sales, spend, Total ROAS, break-even, margin, channel breakdown, deltas, and an explicit "Sales facts still loading — not a trusted multiple" line when the hero is untrusted. Mcfly never sends the mail; the merchant's own client does. Zero infra, zero deliverability risk, and it is the cheapest word-of-mouth loop in the app — rendered as a tertiary "Email" button.
7. **Allocation depth already computed.** `buildAllocationHistoryView` produces top quarters by portfolio Total ROAS with per-channel share bars, plus rolling 7/14/28 windows vs prior. `metrics.allocation.actions` (hold / reduce / step-test with spend floors, `MAX_CUT_PCT = 50`) is computed on every load and **thrown away by the view**.
8. **`?listing=1` capture mode.** A whole parallel render path that strips SAMPLE chrome, banners, CTAs, and page headings for clean 1600×900 App Store shots — while keeping the numbers honest about their source.

---

## 4. Dead weight and confusion

### Intentional dead (keep)

| Surface | Behavior | Verdict |
| --- | --- | --- |
| `/app/close` | 302 → `/app` (preserves `?period`) | Correct per `RETIRED_SURFACES.md`. Keep for bookmarks. |
| `/app/connections` | 302 → `/app/spend` | Correct. Keep. |

### Actual confusion (fix candidates)

1. **`declare-recon` has no form.** `app.spend.tsx` implements the `declare-recon` action (writes `declaredAdsSpend` + period bounds to `Settings`), the loader computes `spendRecon`, and Overview passes it to `CashTrustBanners`, which renders a ±5% drift warning. But **no UI in the repo submits that intent** — no input, no button, on Spend or anywhere else. Consequences: the drift banner can never fire for a real merchant; the Advanced "Spend structure → recon" tile can never populate; and `/app/allocation`'s lock copy ("Desk spend vs declared Ads Manager is outside ±5% — fix recon before allocation") describes a state a merchant has no way to enter or exit. This is the single largest orphaned capability in the desk.
2. **Allocation over-promises its own render.** Empty state: "then this page says which channels to cut or keep." The page shows quarters, a pie, and rolling windows. Either render the computed `actions` or change the copy.
3. **Ops content on a merchant route.** `/app/demo`'s "Listing shots (ops) — Staff only" drawer with `?listing=1` links, crop dimensions, and "Clear SAMPLE data" belongs in `docs/LISTING_CAPTURE.md`, not in a merchant's Admin.
4. **Advanced's SAMPLE CTA trap is dead code.** `buildAdvancedSections` can emit a `lockedReason` for Acquisition & payback whose CTA is **"Try SAMPLE preview" → `/app/demo`**. Since `getShopEntitlements` now hard-returns `canUseLtv: true` for every shop, this branch is unreachable — but if it ever fired it would push a merchant toward fake numbers to see a real feature, which contradicts "SAMPLE is preview data only — not a feature unlock" in `entitlements.ts`. Delete the branch.
5. **Vestigial `pro_required` / freemium residue.** `proRequiredLtvSummary()`, `PRO_UPSELL.channels`, `FREE_CHANNELS`, `canUseChannel`, `assertChannelsAllowed`, and the `"— $39 desk"` disabled-option labels in the Spend dropdown all still exist even though `canUseAllChannels` is unconditionally `true`. Harmless at runtime, but it is the same freemium residue `APP_STORE_LISTING.md` quarantined on the listing side, still living in the code.
6. **`/app/billing` has no loader.** It is action-only. A merchant (or a stale bookmark) hitting the URL with GET does not land on a plan page. Low impact, but it is a 404-shaped hole under a "Start $39 plan" button.
7. **Two overlapping SAMPLE controls.** The global `DataModeBar` (Sample | Real, POSTing to `/app/data-mode`) and the `/app/demo` page (prepare / enable / disable / clear) both toggle the same flag with different vocabulary. Not harmful, but it is two mental models for one switch.

### SAMPLE CTA traps

| Trap | Where | Effect |
| --- | --- | --- |
| Overview's **primary action becomes "Turn SAMPLE preview OFF" → `/app/demo`** whenever SAMPLE is on (`firstSessionPrimaryAction`) | `/app` header button | The most prominent button on the desk points away from the desk, into a page whose second half is Mcfly staff tooling. A merchant exploring SAMPLE is steered to admin plumbing instead of to Spend. |
| Advanced's locked-section CTA **"Try SAMPLE preview"** | `/app/advanced` | Unreachable today (`canUseLtv` is always true), but it is a live contradiction of "SAMPLE is preview data only — not a feature unlock." Delete rather than leave loaded. |
| SAMPLE numbers stay sample under `?listing=1` while the SAMPLE banner is hidden | any desk page | Correct and documented for App Store capture, but it is the one place where an on-screen number has no visible SAMPLE marker. Ops discipline, not code, is the control. |

### Honesty leak worth naming

**Spend Explorer draws a target line from an unconfirmed default.** Overview passes `targetMer: metrics.targetMer` into `buildSpendExplorerSeries` without the `targetMerConfirmed` check that `TotalRoasGauge` applies (`metrics.targetMerConfirmed ? metrics.targetMer : null`). A merchant who never set a goal can see a target rail on the daily chart that they did not choose. Small surface, but it is the same class of mistake the rest of the desk is unusually careful to avoid.

### Correction to the prior draft

- **ReviewAsk App Bridge one-shot miss: fixed.** `ReviewAsk` now polls for `shopify.reviews.request` every second up to two dwell periods instead of sampling once at hydration. The review flywheel is still *rare* by design — it needs trusted Total ROAS, ≥24h since install, complete facts, no history limit, non-SAMPLE, and 60s of dwell — but it is no longer silently broken.
- **Period ledger CSV: in tree and wired.** Both Overview and Spend render the control with mirrored gates; the prior draft listed it as "pending Fly," which is a deploy question, not a capability question.

---

## 5. Listing parity — live listing promise vs desk delivery

Source of promises: `docs/APP_STORE_LISTING.md` (paste-ready short/long/bullets/reviewer notes). Live listing: `https://apps.shopify.com/mcfly-analytics-public`. **Reviews live = 0.** No install or review counts are asserted anywhere in this file.

| Listing promise | Desk reality | Parity |
| --- | --- | --- |
| "Total ROAS = Shopify Total Sales ÷ ad spend" | Exactly what Overview computes; label constants enforce the wording | ✅ Full |
| "for any period (MTD / QTD / YTD / **custom** — any period you choose)" | `PeriodControl` ships MTD · LM · QTD · YTD · L12M. **3 yr is shot-mode only.** Arbitrary custom dates exist only in the collapsed Spend Explorer (`exFrom`/`exTo`) and in the v1 API — not for the headline Total ROAS period. | ⚠️ Partial — "custom" oversells the period picker |
| "Break-even Total ROAS from your profit margin %" | Settings margin → `calculateBreakEvenMer`, live preview, gauge band, allocation gate | ✅ Full |
| "Spend by channel via CSV — mix in $ and %" | Delivered on Overview (channel list with $ and %) and Allocation (pie + list) | ✅ Full |
| "Spend Allocation — quarters, pie, rolling 7/14/28" | All three render exactly as described | ✅ Full — note the listing wisely does **not** claim a recommendation, so the in-app copy is the thing that's out of step, not the listing |
| "Goals — MTD/QTD/YTD pace + full-year board + YoY" | All present | ✅ Full |
| "LTV / Acquisition — Cash CAC, cohort LTV, LTV:CAC" | Present, but gated behind `OrderFact` backfill and, past ~60 days, the `read_all_orders` grant | ⚠️ Partial — true, delivery is delayed |
| "Email Overview — opens your mail app (mailto; Mcfly never sends mail)" | Exactly right; `ShareOverviewButton` is a plain `mailto:` | ✅ Full |
| "Per-platform export guides in-app (sales columns ignored)" | 14-platform playbook with real click-steps on Spend | ✅ Full |
| "Optional automation: Spend → **Automate** → Mcfly pipe template → SyncWith / Coupler / Supermetrics / Coefficient" | **There is no "Automate" tab, section, or link.** The word appears once, in a `spend-csv.ts` error string. Pipe templates exist only at `/app/spend/template?pipe=long\|wide`, unlinked. Reviewer notes step 3 tells a Shopify reviewer to click a control that does not exist. | ❌ **Gap — highest review risk in the parity table** |
| "Freshness chip ('Last refreshed') + Update spend throughout Overview" | Both present | ✅ Full |
| "Orders / new / returning / AOV for the same period" | Present on Overview glance and LTV. **Caveat:** on live (non-SAMPLE) loads Overview sets `customerMetricsAvailable: false` for the Explorer because the cross-day unique-customer crawl is refused on paint — the split comes from till facts instead | ⚠️ Partial — correct numbers, narrower source than implied |
| "Embedded in Admin — no second login, no public .myshopify.com form" | True; the Fly landing explicitly refuses to collect a shop domain (App Store 2.3.1) | ✅ Full |
| "$39/store/mo flat · 7-day trial · one plan · nothing feature-gated" | `getShopEntitlements` returns full access to every shop; `PRO_UPSELL` copy matches | ✅ Full in code — **live listing fixed 2026-09-09:** plan **Mcfly Analytics**, no `(paid)` bullets after Partner Save. Residual listing risk = Automate/pipe discoverability. |
| "No pixels / MTA / path credit / true ROAS" | Enforced in labels, banners, tile caveats, and refusal copy throughout | ✅ Full |

**Parity summary:** the desk under-delivers the listing in exactly one place that a reviewer will click (Automate / pipe templates unlinked), and over-delivers in two places the listing never mentions (period ledger CSV, v1 API). Plan name / `(paid)` residue was cleared on live listing 2026-09-09.

---

## 6. Verdict — skeleton or full desk?

**Full desk with three loose bolts.** This is not a scaffold pretending to be a product.

**Evidence for "full desk":**

- Seven merchant surfaces, all rendering real computed values from one metrics spine (`buildDashboardMetrics`) — not seven variations on one tile.
- Five independent spend-entry paths (typed day, paste, upload, 20-slot combine, bill-to-daily), all sharing one idempotent upsert key, all fail-closed on parse error, all blocked under SAMPLE.
- The honesty layer is deeper than the feature layer: untrusted-zero suppression, skipped deltas on incomplete prior coverage, disabled-with-reason export buttons, a hard-stop against unbounded Shopify crawls, five differentiated LTV empty states, and coverage holes translated into "Total ROAS looks better than cash." Most apps at this stage would print the 0.00.
- Depth exists past the headline: portfolio quarters ranked by Total ROAS, rolling 7/14/28 vs prior window, spend headroom at target and at break-even, contribution-adjusted LTV, cohort 30/90/365.
- Compliance is real and shipped, not planned: GDPR webhooks, Level-1-only PCD, `ComplianceDataExport` with a 60-day TTL, and a merchant-facing download panel in Settings.
- Infrastructure a skeleton wouldn't have: a token API with range caps and `sales_facts_incomplete` refusal, a server-authoritative closed-day ledger export, a listing-capture render mode, and a job tick for backfill resumption.

**Evidence for the three loose bolts:**

- **A wired action with no switch.** `declare-recon` writes state that three surfaces read (Overview drift banner, Advanced recon tile, Allocation lock) and that no merchant can produce, because the form was never built.
- **A page that computes advice and doesn't show it.** Allocation calculates hold / reduce / step-test with spend floors on every load, renders none of it, and tells the merchant in its empty state that it will.
- **A listing step that points at a missing tab.** "Spend → Automate" appears in both the long description and the reviewer smoke script; the control does not exist. The underlying pipe templates do — they just need a link.

**Read:** the ratio of *shipped honesty machinery* to *shipped features* is unusually high, which is the right ratio for a trust product but means the desk's best work is invisible. The highest-leverage next moves are not new features — they are a recon input, an allocation verdict card, and an Automate link that makes three existing capabilities reachable.

---

*R0 lane · read-only inventory · no code changed, no commit. Downstream: `FRICTION_AUTOPSY.md` (R3), `LOVE_SCORECARD.md` (synthesis).*
