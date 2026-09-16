# World-class punch — Mcfly Analytics vs Polar / Shopify Analytics

**Date:** 2026-09-10 · America/Denver  
**Role:** critic. No product code. No Fly. No commit.  
**SoT:** [`docs/plans/2026-09-10-world-class-attack.md`](../../plans/2026-09-10-world-class-attack.md) · board [`docs/LIVING_BOARD.md`](../../LIVING_BOARD.md)  
**Live:** Fly **238** · listing reviews **0** · site **v15**  
**Absorb:** [`2026-09-10-independent-insights.md`](./2026-09-10-independent-insights.md) is stale on several book rows that already shipped. Do not re-ship typical day / 2nd-in-30 / 2nd-vs-3rd / 2nd-vs-1st as “new.”

**238 update:** Tick C+D shipped. Marketing heading is Marketing; $0 spend is three doors + honesty; share card leads Total Sales. Remaining critic items: dead CSS, leftover Upload Spend chrome on Settings/demo/allocation, live listing still spend-first until Marty pastes.

Cursor does not Partner Submit. Do not invent reviews or install counts.

---

## Verdict

Shopify Analytics already gives a free Overview, mean AOV, and a report zoo. Polar sells warehouse density at Polar prices. Mcfly wins only if a stranger, Sample off, **$0 spend**, can open Admin and get a Polar-quiet **order book** that Analytics does not print on one screen — then optionally type a day of spend.

Fly 237 got the spine: one report per tab, Total Sales hero, drills not tiles, explorer last, LTV without “cohort” in chrome. It is **not** world-class yet. The Marketing tab still titles **Upload Spend** and, after save, points at **Open Total ROAS**. The forwarded recap still titles **Total ROAS** even when the subject line already switched to sales. That is how a merchant concludes the $39 app is a broken ads product sitting next to free Shopify Analytics.

Steal from Polar: one home, one hero, coverage in the sentence, no widget soup. Steal from Shopify Analytics: native chrome, period rail, empty states that do not look crashed. **Never** steal Polar pixels / MTA / 50 dashboards / alerts, and never clone Analytics’ tile wall.

---

## Ranked cheapness (do these, in order)

Cheap = few files, high stranger-trust, no new math, no new scopes.

| Rank | Tick | Why it is cheap | Stop when |
| ---: | --- | --- | --- |
| **1** | **C — Marketing stranger path** | Heading + leftover CTA + one-day payoff. Doors already exist. | Sample off, $0: heading **Marketing**, three doors, **one** honesty sentence. After one typed day: mix + Total ROAS + coverage on **this** tab. No “Open Total ROAS” as the win. |
| **2** | **D — Share / recap sales-first** | One function + tests. Loader `shareSubject` already flips at $0. Body does not. | Forwarded card at $0 spend leads Shopify Total Sales + typical / returning / weekend. Total ROAS only when spend > 0. Never 0×. |
| **3** | **Spend / Goals paper** | Same `.mcfly-book` language as Orders. Settings stay Polaris. | Marketing/Goals do not look like a second product (panels + leftover scoreboard CSS). |
| **4** | **Sparse honesty** | Omit or `—` + why. Most of ShopifyBookSection already does this. | No 0.0%, no boxed dash next to real dollars, no “Ingested 12 of 60” in merchant chrome. |
| **5** | **Dead CSS** | Markup already left. Tests already forbid the class names in TSX. | Sweep unused `.mcfly-hero-compact`, `.mcfly-tab-snaps`, `.mcfly-ltv-summary`, `.mcfly-first-view`, orphan `.mcfly-hero`. |
| **6** | **Catalog (after C+D only)** | New depth rows, right tab, not Overview fold. | 2+ unit share, full-price vs discounted AOV, top 10% of **customers**, source AOV as drill. |

Do **not** start 6 before 1–2. Do **not** Pages-deploy or listing-paste until Phase 2 Admin shots exist.

**Tests that currently lock the wrong heading** — implementers must update these with Tick C, not fight them:

- `app/app/lib/easy-add-spend-tab.test.ts` — expects `heading={PRODUCT_NOUN.uploadSpend}`
- `app/app/lib/desk-sample-ux.test.ts` — “Spend keeps the Upload Spend heading”

Keep nav label **Marketing** (`app/app/lib/desk-nav.ts`). Keep verb **Upload Spend** on the typed-day CTA. Heading ≠ CTA.

---

## Must not be undone

These are the Fly 237 wins. A “fix” that reverses any of them fails the critic.

| Lock | Where it lives | Failure mode |
| --- | --- | --- |
| **Sales-first Overview** | `OverviewFirstViewport.tsx` + `app._index.tsx` | Total ROAS / spend column / 0× in the first viewport. Tile wall above the fold. |
| **Works at $0 spend** | Overview, Orders, Buyers, Timing, Goals, LTV paint without spend | Empty spend treated as 0×. Overview primary that implies the app is broken. `NUMBER_HONESTY.empty` on Overview (it belongs on Marketing only). |
| **Drills, not a tile zoo** | `ShopifyBookSection.tsx` `<details className="mcfly-book__row">` | New KPI cards, snap grid, compact hero pair. |
| **Explorer last** | Overview explorer `details` after Goals/Marketing snaps | Chart as a second dashboard, default-open at $0 spend. |
| **Empty spend is not 0×** | `number-honesty.ts`, MarketingSnapSection mer hero only when `merValue` | Painting `0.00×` or a Total ROAS title with $0 spend. |
| **Omit sparse shares** | `ShopifyBookSection` `hasShare` / `row.v !== "—"` | Fake 0% or 0.0% next to real numbers. |
| **Settings stay Polaris forms** | `app.settings.tsx` `s-page` + native fields | Sky-paper / Fraunces body on Settings. |
| **One report per tab** | Orders / Buyers / Timing via `DeskBookPage` + one `ShopifyBookSection` group | Dumping the full book onto Overview again. |
| **Religion** | Total ROAS = Shopify Total Sales ÷ **entered** spend | Pixels, MTA, true ROAS, OAuth zoo, in-app AI, `read_all_orders` as the product. |
| **SAMPLE honesty** | `SampleDeskBanner`, `samplePeriodSuffix` | Shot mode hiding SAMPLE when sample is on. |

Overview already does the hard part: Total Sales hero, four quiet glance stats, one sentence (`overviewNoticeSentence`), spend line only as `OVERVIEW_SPEND_EMPTY_LINE`. Do not “improve” that into more cards.

---

## Voice bans (merchant chrome)

Ban in headings, heroes, glance labels, share body, banners, empty states. Internal identifiers (`tillLtv`, `cohortMonth`, `amer`) may stay in code.

| Ban | Use instead |
| --- | --- |
| aMER / MER (as the product name) | Total ROAS |
| till / cash desk / Monday | Overview / this window / any day |
| cohort / ARPU / p25–p75 | First orders · {month} / sales per buyer / most orders |
| one-and-done (bare) | Buyers with one order |
| Upload Spend as the **page title** next to Total ROAS leftover | Heading **Marketing**; CTA may stay Upload Spend |
| Open Total ROAS as the post-save win | Open Overview · or show Total ROAS **on Marketing** once spend exists |
| 0.0% / 25.0% | Whole percents: 25% |
| Ingested *n* of *m* closed days | Orders still syncing — not $0 |
| Broader order access / scope sermon | 60-day window, honest, once |
| Attribution / true ROAS / platform ROAS as a lead | Sales ÷ spend you added, once under Marketing |
| Beats SaaS / 500-seat / coexist | Nothing. Delete. |

`PRODUCT_NOUN.amer` remaining as `"aMER"` is fine **inside Advanced Metrics** only — keep it off Overview, Marketing, Goals, LTV, share text.

`DeskBookPage` still takes a prop named `tillLabel`. Rename is optional cleanup, not a stranger bug.

---

## Per-tab punch (file-level)

### Overview — keep the hero, clean the leftover theater

**Keep:** `OverviewFirstViewport` Total Sales + glance + one sentence. `OverviewSectionIndex` doors. `GoalsSnapSection` / `MarketingSnapSection` as chapters. Explorer in a closed `details` when `totalSpend === 0`.

| # | File | Punch |
| --- | --- | --- |
| O1 | `app/app/routes/app._index.tsx` | Footer `mcfly-overview-more` duplicates the book doors + Goals/Marketing/Settings. Polar would not print a second sitemap under the chart. Cut or reduce to Settings only. |
| O2 | `app/app/routes/app._index.tsx` | Loader `shareSubject` is already sales-first at $0 (`Shopify sales — {period}`). Body is not — see Tick D. Pass typical / returning / weekend into `formatOverviewShareText` (depth already on `metrics.shopifyDepth` + `shopBook`). |
| O3 | `app/app/components/MarketingSnapSection.tsx` | Empty path: **two** ledes (section thesis + `NUMBER_HONESTY.empty` + csv + 60-day). Collapse to **one** honesty sentence + one CTA. Three doors live on the Marketing **tab**, not here. |
| O4 | `app/app/components/GoalsSnapSection.tsx` | Lede restates the title. Fine if gauges exist; when no plan, the single CTA is enough — drop the duplicate “Goals vs calendar — …” throat-clear. |
| O5 | `app/app/lib/product-labels.ts` | `shareOverviewDef` / `shareOverviewEmailDef` still say the merchant forwards **Total ROAS cards**. Align with Tick D (sales-first when spend is empty). `deskTitle: "Total ROAS"` is leftover product-noun — do not put it back on `s-page`. |
| O6 | `app/app/routes/app._index.tsx` | Dead empty-state machinery: `marginBlocked = false` forever, `bothBlockedEmpty` / `marginOnlyEmpty` / `coldEmpty` never happen. Safe to delete **after** Tick C+D, not instead of them. |

Do not put `ShopifyBookSection` back on Overview. Do not reopen the explorer at $0 spend (`open={shotMode \|\| metrics.totalSpend > 0}` is correct).

### Marketing (`/app/spend`) — Tick C, cheapest world-class miss

Nav already says Marketing. The page heading says **Upload Spend**. After a save, the success banner’s first link is **Open Total ROAS**. Polar would never name the tab one thing and the report another, then send the merchant “home” for the number they just unlocked.

| # | File | Punch |
| --- | --- | --- |
| M1 | `app/app/routes/app.spend.tsx` L511 | `s-page heading={PRODUCT_NOUN.uploadSpend}` → `PRODUCT_NOUN.marketingSection` (**Marketing**). Comment on L533 is now a lie. |
| M2 | `app/app/lib/product-labels.ts` | Keep `uploadSpend` / `setupAddSpend` as the **verb** on the primary button and typed-day H2. Do not rename every string in the repo. |
| M3 | `app/app/routes/app.spend.tsx` L545–550 | Success banner: kill `Open Total ROAS` as the lead. After one day the win is **on this page**: Total ROAS + mix + coverage. Link to Overview is secondary (“Same numbers on Overview”). |
| M4 | `app/app/routes/app.spend.tsx` | After `entries.length > 0` (or period spend > 0): one `.mcfly-book` hero = Total ROAS (or `—` + why if sales pending), drill rows = Total Spend + channels, coverage sentence. Reuse `MarketingSnapSection` or a thin sibling — do not invent a third visual language. Empty: keep `SPEND_DOORS` + **one** helper (`NUMBER_HONESTY.empty` or the existing “Empty spend is $0 … No ad-account login”). Drop the extra kicker **plus** helper **plus** status foot stacking. |
| M5 | `app/app/routes/app.spend.tsx` L986–993 | Footer still advertises Spend Allocation + Advanced Metrics on a $0 stranger path. Hide until spend exists, or bury. Advanced is not Polar-home. |
| M6 | `app/app/routes/app.spend.import.tsx` | Import heading “Import or backfill” is fine (a job). Post-import `Open Total ROAS` (L1071 / L1082) is the same leftover as M3. |
| M7 | `app/app/routes/app.settings.tsx` L366–371, `CashTrustBanners.tsx`, `app.allocation.tsx` | “Upload Spend” as a **place name** is OK as a verb (“upload daily spend”). `Open Total ROAS` buttons after margin-save teach the wrong home. Prefer Open Overview. |

Typed-day form, recurring, CSV doors, $0 cell = empty, Live vs Sample — **keep**. Do not add OAuth.

### Goals — heading is right; the page is still two products

First ~80 lines of render: `s-page heading="Goals"` (good), then a custom rail (period + year select + YTD chip), trial sentence, SAMPLE banner, then a book hero. Polar would one title, one period, one hero, then the plan.

| # | File | Punch |
| --- | --- | --- |
| G1 | `app/app/routes/app.goals.tsx` L646–727 | Book hero (Total Sales) + spend drills only when `periodHasSpend` — **keep**. Do not put Total ROAS in the hero at $0. |
| G2 | `app/app/routes/app.goals.tsx` L742–756 | `mcfly-panel mcfly-goals-declare` is leftover card chrome. Same paper as Orders: lede + rows / details, not a second panel system. Year select can stay; it does not need a chip that says “Goals hidden · YoY only” in operator dialect. |
| G3 | `app/app/components/SalesGoalGauges.tsx` | `variant="book"` on the page is correct. Default muted still says “cash Total ROAS” in `DEFAULT_MUTED` — voice ban adjacent. Overview `variant="inline"` is correct; do not reintroduce `panel`. |
| G4 | `app/app/components/GoalsSnapSection.tsx` | Overview chapter: invitation only until a year plan exists. Do not sneak MER gauges onto Overview at $0 spend (already gated on `planned`). |

### LTV — chrome is book; the tab is three reports

`DeskBookPage` heading **LTV**, no `mcfly-ltv-summary` in TSX — **keep**. Polar still would not stack three full `.mcfly-book` heroes on one tab (90-day value, returning share, first-order months). Returning-sales hero duplicates **Buyers**.

| # | File | Punch |
| --- | --- | --- |
| L1 | `app/app/routes/app.ltv.tsx` L353–360 | “Ingested *n* of *m* closed days” is engineer chrome. One line: orders still syncing — not $0. |
| L2 | `app/app/routes/app.ltv.tsx` L432–437 | “Deeper history unlocks with broader order access” is a scope pitch. Ban. 60-day honesty already exists. |
| L3 | `app/app/routes/app.ltv.tsx` L441–466 | Second book (“New vs returning this window”) is Buyers. Cut the duplicate hero; keep spend-optional Cash CAC **drills** on the first book when spend exists. |
| L4 | `app/app/routes/app.ltv.tsx` `BookRows` | Months with `v: "—"` are filtered out entirely — good. Do not print a dash row to “show” an empty month. |
| L5 | `app/app/components/LtvSnapSection.tsx` | Unused on Overview (good). Contains “Cash CPA” / “Repeat rate”. Do not re-mount it on Overview. Delete or leave parked — not a Tick C file. |

`ltv.cohorts` in data is fine. Merchant label **First orders · {month}** is the lock.

### Orders / Buyers / Timing — already the Polar bar

`app.orders.tsx` / `app.buyers.tsx` / `app.timing.tsx` + `ShopifyBookSection.tsx` + `DeskBookPage.tsx`. One hero, clock on Orders, drills that omit `—`. This is the craft other tabs must copy — not rewrite.

| # | File | Punch (small) |
| --- | --- | --- |
| B1 | `ShopifyBookSection.tsx` L326–331 | “Biggest orders” = top 10% of **orders**. Honest. Do not relabel as customers. Catalog item is a **new** row later. |
| B2 | `ShopifyBookSection.tsx` | `hasShare` omits 0%. Keep. Discount / weekend / returning already skip junk. |
| B3 | `product-labels.ts` `shopifyBookMuted` | “Last ~60 days. Spend optional.” Correct vs Shopify Analytics. Do not lengthen. |

### Settings — do not restyle

`app.settings.tsx` Polaris forms, CSB, margin, Sample \| Live, billing. Attack tick 3: **Settings stays Polaris.** Only leftover: post-save **Open Total ROAS** (see M7). No `.mcfly-book` conversion.

### Allocation / Advanced — not Phase 1 home

`/app/allocation` and `/app/advanced` are after spend. Do not surface them on the $0 Marketing stranger path (M5). `app.advanced.tsx` still says “till LTV” in copy (~L176) — voice ban if that string is merchant-visible.

---

## Tick D — Share / recap (file-level)

Today:

- Loader (`app._index.tsx` L359–362): subject is already `Shopify sales — {period}` when `!hasSpend && !useSampleDesk`.
- Body (`cash-close.ts` `formatOverviewShareText` L492–540): **always** titles `Total ROAS`, leads with `Total ROAS: —`, then sales, then `$0` spend.
- Tests (`cash-close.test.ts`): only cover spend-on and sales-pending. No $0-spend sales-first case.
- Button: `ShareOverviewButton` label is **Email** (`shareOverviewEmail`). Fine. Subject/body are the bug.

| # | File | Punch |
| --- | --- | --- |
| D1 | `app/app/lib/cash-close.ts` `formatOverviewShareText` | If `totalSpend <= 0` (and not sample-forced): title Shopify Total Sales; **do not** print a Total ROAS line or `$0` Total Spend as the story. Lead sales + optional `salesDeltaLine`. Then typical order / returning share / weekend (new optional fields). Formula line only when spend > 0. |
| D2 | `app/app/lib/cash-close.ts` | Keep sales-pending guard: never email `Shopify Total Sales: $0` for unknown days. Keep spend-on path: Total ROAS + BE + mix. |
| D3 | `app/app/lib/cash-close.test.ts` | Add $0-spend case: title/body lead sales, contain typical/returning/weekend when passed, **not** `Total ROAS` as the title, **not** `0.00×`. Keep existing spend-on + pending tests. |
| D4 | `app/app/routes/app._index.tsx` | Pass the glance facts you already compute (`shopBook`, `metrics.shopifyDepth`). Do not fetch more. |
| D5 | `app/app/lib/product-labels.ts` | `shareOverviewDef` must not promise a Total ROAS card when spend is empty. |

This is the 90-second ritual in the research absorb (Total Sales → one notice → health). It is **not** a new email product and not Monday Close (retired).

---

## Dead CSS (Tick 5 — after markup confirmed)

Grep of `app/app/**/*.tsx`: **zero** `mcfly-hero-compact`, `mcfly-tab-snaps`, `mcfly-ltv-summary`, `mcfly-first-view`, `mcfly-hero__`. Tests already assert Overview/LTV TSX do not use them.

| Block | File | Note |
| --- | --- | --- |
| `.mcfly-hero` ~L236 | `app/app/styles/mcfly-desk.css` | Orphan. Hero is `.mcfly-book__hero-v` (Fraunces lock at L11376 — **keep**). |
| `.mcfly-tab-snaps` / `__snap` ~L5357+ | same | Tile zoo. Also L11334, L11481. |
| `.mcfly-ltv-summary` ~L3610–3774 | same | Old LTV tiles + `.mcfly-acq` restyle. TSX gone. |
| `.mcfly-hero-compact` ~L8423–8796, L10375, L11370–11816 | same | Compact scoreboard. Do not revive. |
| `.mcfly-first-view` ~L8446–8509 | same | Replaced by `.mcfly-book__glance`. Test: `overview-first-viewport.test.ts` forbids the old class in the component. |

Sweep in **one CSS PR**, after Tick C+D so nobody “needs” the old classes mid-flight. Keep `.mcfly-book*` intact. Do not restack tokens into `site.css`.

---

## Catalog — after Tick C+D, right tab, not Overview fold

Attack + absorb remaining **new** facts (opaque ids only, suppress on tiny n):

| Idea | Tab | Files | Do not |
| --- | --- | --- | --- |
| 2+ unit share (basket, not mean items) | Orders | `shopify-depth-stats.ts` + `ShopifyBookSection.tsx` `periodRows` | Hero. Overview glance. |
| Full-price vs discounted AOV | Orders | same + existing discount amount | Replace discounted-order **share** (already shipped). |
| Top 10% of **customers** (concentration) | Buyers | depth by `customerKey` + `buyersRows` | Relabel “Biggest orders.” Email lists. |
| Source AOV (Online / POS / Shop) | Timing | source mix already has **share**; AOV is the drill | Hero. Ad-channel mix. |

Already shipped — **do not** treat as punch:

- Typical day, discounted orders + typical $ off, items per order, returns & edits, shipping+tax, second in 30, 2nd vs 3rd+, second vs first, guest vs identified typical order, biggest **orders**, one-sentence Overview notice, 60-day coverage line.

Coverage on retention: if n is too small, omit the row (already `hasShare` / min eligible). Never fake 0.0%.

---

## Listing / site must wait for shots

Phase lock from the attack plan. Critic enforcement:

| Phase | Job | This punch list |
| --- | --- | --- |
| **1 App** | Polar desk a stranger can open at $0 | Ticks C → D → paper → CSS. Then ship-gate + **Conductor** Fly. Workers never `fly deploy`. |
| **2 Evidence** | Marty hard-refresh Admin, Live data, shot each nav tab | Overview ($0 spend, no ROAS hero), Orders, Buyers, Timing, Goals, Marketing empty, Marketing after one day. Captions from [`docs/LISTING_VISUAL_PACK.md`](../../LISTING_VISUAL_PACK.md). |
| **3 Listing** | Paste pack matches **those** shots | [`docs/ops/LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md). Marty Saves/Submits. Do not paste spend-first ASO. Kill leftover “lead with spend next to Shopify.” Plan name **Mcfly Analytics**, not Pro. One plan $39 + 7-day. Reviews stay **0** until real. If live listing still shows CUSTOM DATA SCIENCE / 4.42× — Marty replaces the still. |
| **4 Site v16** | Home / Demo / Pricing / Product match the desk | After shots. Pages Direct Upload from a **non-git temp** copy. Never `wrangler --branch`. Never redirect `/lab`. Harbor SAMPLE below the fold stays `$23,414 / $82,068 / 3.51×`. Do not sell Northline `$98,500` / `4.19×` on `/`. |

Do **not** rewrite mcflyads.com to a prettier product than Fly. Do **not** recapture listing stills from SAMPLE 3-year Total ROAS. App URL stays `https://mcfly-analytics.fly.dev`. Website = mcflyads.com.

---

## Human leftover (never a Task)

Partner Submit · screenshot upload · plan rename Pro → Mcfly Analytics · MX for `support@` · ads budget · unparking Sample \| Live · widening scopes · `read_all_orders`.

Ads remain **NO** until smoke PASS + honest reviews + a week in `FUNNEL_WEEKLY.md`.

---

## Implementer guardrails

1. One lane: App. Exclusive files as Conductor assigns. Do not edit `site/**` for this punch.
2. Religion refuse: pixels, MTA, true ROAS, Polar/TW clones, connector zoo, in-app AI.
3. `bash scripts/agent-ship-gate.sh` before anyone claims Tick C or D done.
4. If a test locks `heading={PRODUCT_NOUN.uploadSpend}`, **change the test with the heading** — that lock is the bug.
5. Do not Fly-deploy from this critic turn. Conductor deploys after Phase 1 ticks land.
)
