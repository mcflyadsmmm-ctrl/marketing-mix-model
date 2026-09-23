# Critical audit + capability gap — 2026-09-22

**Lane:** Research · CRITICAL AUDIT + CAPABILITY GAP  
**Ship tree:** `marketing-mix-model/` @ `cursor/spend-trust-recurring`  
**Probed (UTC):** 2026-09-23T01:15Z–01:16Z  
**Reviews:** **0** (listing star rating `0.0/5`, “(0 Reviews)” — not invented)  
**Partner funnel / install counts:** **UNKNOWN** (not guessed)

Religion lock: Total ROAS = Shopify Total Sales (after returns) ÷ merchant-entered ad spend. Flat $39/store/mo after 7-day trial. No pixels / MTA. Spend is the door, not the greeting.

---

## 1. Executive verdict

**Not publish-ready for a step-change revamp as a “ship the board as SoT” package.** Live surfaces are ahead of docs; Live sales truth is still compromised; listing still sells spend-first while the site sells Overview-first.

- App is **published** and reachable: listing 200, Fly `/health` 200, site 200, `/demo` 200 SAMPLE.
- Desk chrome (five tabs + Settings) and honesty language (`—` not `0×`, pending ≠ $0) are largely in code.
- **Fly is v445** (machine), not board’s **396** / EXECUTION’s **401**. Site is **v42**, not board/EXECUTION **v30**.
- Live day totals depend on ShopifyQL (`shopifyql_sales_day_v1`). Scope `read_reports` is on Session / uncommitted TOML, but **PCD Level 2 fields still PENDING** → `shopifyqlQuery` **ACCESS_DENIED** until L2 — blocks Analytics day-total parity claims only.
- Historical **SalesDayFact poison** (`shopify_order_current_total_v1` zeros) is only partially fixed in **uncommitted** working tree: backfill gap detection filters by ShopifyQL source; **read paths still sum any “certified” row** without `source === shopifyql_sales_day_v1`.
- SAMPLE `/demo` + site craft look strong; **Live first paint at $0 spend** is the trust cliff.
- Overfold: **~318 commits since 2026-09-01**, Fly releases **~every hour** on 2026-09-22 — densify micro-PRs, not one revamp.
- Ads / Partner Save / funnel week: still Marty gates. Ads **NO**.

**Verdict:** Fit for a **research → synthesis → one publish** revamp. Not fit to claim “Analytics day-total parity” or “docs match live” until poison read-filter lands, L2 status is explicit in UX, and Living Board / EXECUTION are restamped.

---

## 2. Live vs claimed

### Probes (this audit)

| Surface | Result | Evidence |
| --- | --- | --- |
| `https://mcflyads.com/` | **200** · `mcfly-version` **v42** · `mcfly-build` `craft-steal-v42` | HTML meta |
| `https://mcflyads.com/demo` | **200** · iframe → `https://mcfly-analytics.fly.dev/demo?hosted=1` | iframe `src` |
| `https://mcfly-analytics.fly.dev/health` | **200** `{"ok":true,"service":"mcfly-analytics","db":"up",...}` | curl body |
| `https://mcfly-analytics.fly.dev/demo` | **200** · SAMPLE Snowdevil desk markers | HTML |
| `https://apps.shopify.com/mcfly-analytics-public` | **200** · reviews **0** · card leads with ad spend / Total ROAS | title + “(0 Reviews)” |
| Fly releases | Latest **v445** complete ~2h before probe; machine `VERSION 445` | `flyctl releases` / `flyctl status` |

### Docs staleness

| Doc | Claims | Live (probe) | Gap |
| --- | --- | --- | --- |
| `docs/LIVING_BOARD.md` | Updated **2026-09-19** · Site **v30** Pages `83cfac91` · Fly **396** | Site **v42** · Fly **445** | Board **~12 Fly versions + 12 site majors behind** |
| Workspace `EXECUTION.md` | Fly **401** · Site **v30** Pages `60abdfb4` · PCD L2 **Submitted** | Fly **445** · Site **v42** | EXECUTION also stale; Pages id ≠ board |
| Board “Next” | Partner Save five-tab paste; reviews 0; ads NO | Listing still spend-led (“Ad spend next to store sales”) | Matches open Marty gate |
| Site lede | “Returning dollars sit next to ShopifyQL” | L2 PENDING → Live ShopifyQL returning $ **not shippable as parity** | Marketing claim overruns Live capability |

### Working tree (ship branch) — uncommitted truth

```
M app/app/lib/sales-facts.server.ts      # poison overwrite gap filter
M app/app/lib/sales-facts.server.test.ts
M app/shopify.app.toml                   # +read_reports
M app/shopify.app.public.toml            # +read_reports
M fly.toml                               # SCOPES += read_reports
M docs/ops/GROKBOT_MAC_SPLIT.md
?? docs/research/2026-09-22-revamp/
```

Branch: `cursor/spend-trust-recurring` tracking origin. Tip includes spend paste densify (#138) etc.; **poison overwrite is not in HEAD yet**.

### Claimed product vs Live product

- **Claimed (site / north star):** Overview → Orders → Customers help at **$0 spend**; Spend last; empty spend = **—**.
- **Claimed (listing):** Spend-led Total ROAS + LTV + Goals; flat $39; no pixels.
- **Live Fly:** Healthy SAMPLE demo; Live desk depends on SalesDayFact + OrderFact ingest. ShopifyQL day totals **blocked on L2** despite `read_reports` in session/TOML intent.
- **Do not claim:** install counts, Partner conversion, or that PCD L2 is approved. Status for L2 fields: **PENDING** (authoritative context for this pack).

---

## 3. Desk capability map

Primary nav: five analysis tabs + Settings (`DESK_PRIMARY_NAV` / `app.tsx` ~139–149; `desk-nav.ts` 11–12).

| Tab | Route | SAMPLE | Live primary facts | What it actually delivers |
| --- | --- | --- | --- | --- |
| **Overview** | `app/app/routes/app._index.tsx` | `fetchSampleSales` / `fetchSampleSalesByDay` / `fetchSampleSalesOrdersByDay` (`SampleSalesDay`) | **SalesDayFact** via `loadDeskSalesForPeriod` / `getSalesFactsTotals` / `getSalesFactsByDay` (+ capped today top-up). Explorer uses `getSalesOrderFactsByDay` (still SalesDayFact order counts, not depth). HARD-STOP: never unbounded multi-day order crawl for period KPIs (`app._index.tsx` 210–217, 306–322). | YoY / period sales board, sales explorer chart, peeks, honesty banners when incomplete / pending. **Zero spend/ROAS on Overview** (craft unlock). Depth tiles that need median/weekend/hour come from dashboard `shopifyDepth` (OrderFact-derived where wired). |
| **Orders** | `app.orders.tsx` → `loadDeskSalesPage` | Sample sales + sample OrderFact depth | Period clocks from **SalesDayFact** totals; **median / discounts / 2+ / weekday / hour / Online vs POS** from `loadOrderDepthRows` → **OrderFact** (`desk-sales-page.server.ts` 94–124, `order-facts.server.ts`). | Typical order (median) vs mean, timing, frequency, intel — “board still paints from orders on file” while sales pending banner shows (`app.orders.tsx` 100–108). |
| **Customers** | `app.customers.tsx` → `loadCustomersStackPage` | Explicit SAMPLE Snowdevil banner (`app.customers.tsx` 184–188) | Returning $ / mix / RFM / whales / LTV / Growth panels from **OrderFact** + **CohortFact**; period sales clocks from SalesDayFact path shared with desk stack. ShopifyQL New/Returning $ only when `customerMetricsAvailable` on facts. | Deeper than native customer list: returning dollars, LTV triangle, growth TT2, shareable insight cards. Live returning-$ from SalesDayFact stay dark if ShopifyQL split never writes (`salesResultFromDayTotal` zeros headcount; `customerMetricsAvailable` gate — `sales-facts.server.ts` 112–134, 595–598). |
| **Spend** | `app.spend.tsx` (+ import/template) | Snowdevil spend book; `SAMPLE_LEDGER_HANDOFF` | Merchant-entered spend ÷ **SalesDayFact** sales for Total ROAS / MER / CPA / mix. Empty spend → **—**, never 0× (`app.spend.tsx` 1006–1016, 1062–1063). | Door for religion metrics. Live parked copy still present in places (“Live is parked until launch” ~555) — verify vs unpark claim in EXECUTION. |
| **Goals** | `app.goals.tsx` | `fetchSampleSales` | `loadSalesByDayForGoalsRange` → SalesDayFact / sample by day. Missing months stay **—**, not $0 (`app.goals.tsx` 181–182, 776–788, 912–913). | Year plan + gauges; actuals honesty when facts incomplete. |
| **Settings** | `app.settings.tsx` | Notes SAMPLE vs Live | Target Total ROAS, returning-$ habit target, billing, support — not a fact spine. | Billing / target rails; SAMPLE honesty strings when sample on. |

**Fact spine summary**

| Store | Role | Without L2 ShopifyQL |
| --- | --- | --- |
| **SalesDayFact** | Closed-day Total/Net/Gross/orderCount for Overview/Goals/Spend ROAS | Ingest throws `ShopifyReportsScopeError` / ACCESS_DENIED path; empty or legacy poison rows. Product lock: **no order-sum fallback** (`live-ingest-depth.ts` 11–13). |
| **OrderFact** | Median, hour, basket, RFM, LTV cohorts, Cash CPA denom | **Works with `read_orders` (+ `read_all_orders` for deep history)** — PCD L1 opaque id + `numberOfOrders`. Unpaid clamp: trial slice days (`live-ingest-depth.ts` / PR #134). |
| **SAMPLE** (`SampleSalesDay` / sample orders) | `/demo` + Admin SAMPLE toggle | Full wow independent of L2. |

**Fold redirects (overfold residue, not primary nav):** `app.roas` / `app.cpa` / `app.allocation` → Spend panels; `app.ltv` / `app.growth` → Customers panels; `app.yoy` → Overview; `app.buyers` → Customers; `app.timing` → Orders (`app.*.tsx` redirect loaders).

---

## 4. Honesty / uninstall risks

Concrete UI / data lies (or underclaims that feel like lies):

1. **Poison SalesDayFact zeros as “real days.”** Legacy `shopify_order_current_total_v1` rows can sit in DB. Uncommitted patch makes backfill treat non-ShopifyQL sources as gaps (`sales-facts.server.ts` `existingFactDayKeys` + `source: SALES_DAY_FACT_SOURCE`, lines 137–159 in working tree). **`getSalesFactsTotals` / `getSalesFactsByDay` still do not filter by source** (694–718, 887–907) — only `isCertifiedSalesDayFact` (non-zero or inside horizon / deep scopes). With `read_all_orders`, **$0 poison days certify and underclaim period sales** → merchant sees quieter sales than Shopify Analytics → uninstall / “your app is wrong.”

2. **`$0 sales ÷ spend = 0.00×` path is guarded in metrics** (`mer-dashboard.server.ts` 197–200: `salesPending` keeps `mer` null) and Spend paints **—** (`formatMer(null)` → `"—"` in `mer-format.ts` 39–41). Risk remains if pending flag is false while facts are incomplete zeros.

3. **Pending sales painted as $0.** Many surfaces correctly say “Still loading — not $0” / “Sales for closed days are still loading — not $0” (Overview, Orders, Customers, Spend, Goals). Risk: any chip that formats `0` currency without `salesPending` check.

4. **Site claims ShopifyQL adjacency for returning dollars** while L2 PENDING. Live cannot honestly “sit next to ShopifyQL returning sales $” until L2 fields approve. Risk: listing/site → install → empty Live returning $ from facts spine.

5. **Listing vs product IA mismatch.** App Store card: “Ad spend next to store sales.” Site/north star: Overview/Orders/Customers at $0 spend first. Merchant who installs for spend-only may bounce when Spend is empty and Overview looks thin.

6. **Incomplete OrderFact window.** Truncation / history-limited banners exist (`orderBackfillProgress`, `UnlockFullHistoryBanner`). Still: median/LTV underclaim vs full Shopify history if `read_all_orders` not re-granted or unpaid 90-day clamp (`LIVE_UNPAID_INGEST_DAYS`).

7. **“Live parked” copy on Spend** (`app.spend.tsx` ~555) vs EXECUTION “Live secrets unparked.” Mixed messages → support distrust.

8. **Docs / agents claim wrong Fly/site versions** → wrong smoke criteria, wrong stills, wrong paste pack assumptions → Partner Save of stale story.

9. **Deleted spend day stays $0 / empty** (documented honesty on Spend) — good if labeled; bad if merchant thinks rate refill will restore (copy already warns — keep that in revamp).

10. **CUSTOM / retired tabs returning via bookmark** redirect safely, but 22 `app.*.tsx` routes keep cognitive load for agents → accidental feature reopens.

---

## 5. Capability gap table

| HAVE NOW | BLOCKED ON L2 (ShopifyQL / PCD fields) | BUILDABLE IN 7 DAYS without L2 |
| --- | --- | --- |
| Published app + listing URL; $39 / 7-day religion in code | **Certified Analytics-parity day totals** via `shopifyqlQuery` | Land poison **read-path** filter: only serve `shopifyql_sales_day_v1` **or** treat legacy as missing for KPIs + coverage |
| SAMPLE Snowdevil desk on Fly `/demo` + site iframe | ShopifyQL New/Returning **sales $** on SalesDayFact (`customerMetricsAvailable`) | Overview/Orders/Customers first fold that **leads with OrderFact depth** (median, weekend, returning $ from orders) when SalesDayFact incomplete |
| Five-tab nav + Settings; fold redirects | Claiming “matches Shopify Analytics This month $X” on Live | Explicit Live honesty banner: “Day totals wait on Shopify reports access” — never paint poison $0 as complete |
| OrderFact median / hour / basket / RFM / LTV / Growth (P1 densify PRs) | Multi-year SalesDayFact backfill from ShopifyQL | Trial/unpaid OrderFact window UX clarity; pro upgrade CTA that does not invent scopes |
| Spend ledger, paste densify, empty = — | ROAS that uses ShopifyQL-certified sales only | Spend “door” polish after Overview trust; keep — / never 0× tests |
| Goals month honesty (— for missing) | Goals actuals from QL day facts at full paid window | Goals from OrderFact daily sums as interim? (weaker than Shopify Total Sales — label honestly or skip) |
| Site v42 craft / sales-first story | Site line “next to ShopifyQL” as Live promise | Soften site copy to “next to Shopify returning sales” / OrderFact until L2 |
| Listing live, reviews **0** | — | Listing paste five-tab pack (Marty Save) — copy only |
| `read_reports` in Session (per founder) + uncommitted TOML/fly | Field-level L2 approval | Commit/deploy scope alignment **only if** Partner already approved scope; do not claim QL works |
| Honesty test suite against `0.00×` | — | One “Live empty desk” golden path test (SAMPLE + Live fixtures) |
| Board / EXECUTION as agent SoT | — | Restamp Living Board + EXECUTION to v42 / Fly 445 after next intentional ship |

---

## 6. Overfold debt — do not repeat

Patterns from ~318 commits since 2026-09-01 and ~hourly Fly releases on 2026-09-22:

1. **Densify micro-PRs** (`feat(customers): add…`, `feat(ltv): densify…`, Slack insight cards, forecast, RFM-lite, paste trio) without closing the SalesDayFact trust gate.
2. **Fold-never-delete redirects** left as permanent route files — good for bookmarks, bad if agents keep “shipping” into redirect stubs.
3. **Craft unlock waves** that add cards/panels while Live spine is empty → SAMPLE looks world-class, Live looks broken.
4. **Docs lag live** (board v30 / Fly 396 while production is v42 / 445) — agents optimize against ghosts.
5. **Scope/TOML edits uncommitted** while Session already has scopes — split brain between repo and Partner.
6. **Partial poison fixes** (backfill gap only) without read-path source filter — false sense of safety.
7. **Religion-safe Spend polish** before Overview/Orders stay value at $0 spend (inverts north star).
8. **Listing still spend-led** while site rewrote to sales-first — two products in market.
9. **Hourly Fly deploys** without board journal / Pages stamp discipline → unverifiable “what merchants see.”
10. **Parallel research files** that restate ShopifyQL gates without Conductor kill criteria — research must end in one REVAMP_SPEC, not more micro-lanes.

**Revamp rule:** one publish with SoT restamp beats twenty densify PRs.

---

## 7. Top 10 ship candidates (this audit only)

Ranked by **merchant stay / trust** (not vanity craft). Files = rough touch estimate.

| # | Candidate | Why stay/trust | Files touch (est.) | SAMPLE vs Live | L2? |
| --- | --- | --- | --- | --- | --- |
| 1 | **SalesDayFact read-path: ignore non-`shopifyql_sales_day_v1` (or treat as gap) + finish overwrite backfill** | Stops underclaim / fake complete zeros on Live Overview/Spend/Goals | 2–4 (`sales-facts.server.ts`, tests, maybe one desk banner) | Live-critical; SAMPLE untouched | **N** to ship filter; **Y** to refill correct totals |
| 2 | **Live first-fold OrderFact value when SalesDayFact incomplete** (median, weekend, returning $ from orders; sales clocks stay — / pending) | Delivers north star at $0 spend without QL | 4–8 (Overview + Orders + Customers loaders/components) | Both; Live is the point | **N** |
| 3 | **Hard Live honesty strip: “Closed day totals need Shopify reports (L2)” — never imply Analytics parity** | Prevents refund/uninstall from ACCESS_DENIED emptiness | 2–5 (desk banners + site meta lede soften) | Live + site | **N** (copy); blocked claim is L2 |
| 4 | **Commit + align `read_reports` TOML/fly with Partner reality; document Session vs L2** | Removes repo/runtime split; clears path when L2 lands | 3 (tomls, fly.toml, short ops note) | Live | Scope **N** if already Partner-approved; QL fill **Y** |
| 5 | **Coverage complete must not count poison/legacy sources** | Stops `salesPending=false` with hollow book | 1–3 | Live | **N** |
| 6 | **Partner listing Save: five-tab / $0-spend-led paste** (`LISTING_LIVE_PASTE.md`) | Aligns install promise with product; reviews stay 0 until earned | Docs + Marty click only | Listing | **N** |
| 7 | **Kill “Live parked” Spend strings if unparked; one SAMPLE/Live vocabulary** | Removes mixed parked/unparked story | 1–3 | Admin Live | **N** |
| 8 | **Restamp Living Board + EXECUTION to site v42 / Fly 445 + open gates** | Stops agent thrash | 2 docs | Ops | **N** |
| 9 | **Freeze densify PRs: no new Customers/LTV panels until #1–#3 green on Live Admin Result** | Protects trust budget | Process + maybe SCOREBOARD | Both | **N** |
| 10 | **One Admin Live Result checklist: Overview at $0 spend paints OrderFact depth; Spend — ; no 0.00×** | Closes human gate without inventing funnel | Ops journal template | Live Admin | **N** |

---

## 8. Open questions for Conductor (max 8)

1. Is PCD Level 2 **Submitted only** or **Approved** for ShopifyQL fields? (EXECUTION says Submitted; this pack assumes PENDING until Marty confirms.)
2. On **devmcflyads**, do SalesDayFact rows still show `source=shopify_order_current_total_v1` with sales 0 for days Shopify Analytics shows money? (DB truth — UNKNOWN here.)
3. Should Live Overview **refuse to paint any sales $** until ShopifyQL-certified facts exist, or **paint OrderFact-derived proxies** with explicit “not Shopify Total Sales” labels?
4. Confirm: is Spend “Live parked” copy obsolete after unpark, or is Live spend still intentionally SAMPLE-only?
5. Partner Save of five-tab listing: still blocked by captcha/offline (EXECUTION 2026-09-20) — is Marty free to Save this week?
6. FUNNEL_WEEKLY / organic week numbers: **UNKNOWN** — does any week exist, or still empty?
7. After poison filter ships, is one Fly deploy enough, or must existing poison rows be **deleted/requeued** per shop?
8. Revamp publish target: **site-only story fix**, **desk trust fix**, or **both in one Phase P** with board restamp?

---

## Evidence index (primary)

| Claim | Where |
| --- | --- |
| Overview HARD-STOP facts-only | `app/app/routes/app._index.tsx` 210–217, 243–250, 306–322 |
| ShopifyQL source constant + uncommitted gap filter | `app/app/lib/sales-facts.server.ts` 33–34, 137–159 (WT), 694–718 |
| Certification ignores `source` column | `app/app/lib/shopify-order-window.ts` 84–96; totals loop 711–718 |
| No order-sum fallback for day totals | `app/app/lib/live-ingest-depth.ts` 11–13 |
| Orders depth from OrderFact | `app/app/lib/desk-sales-page.server.ts` 94–124 |
| Spend empty = — | `app/app/routes/app.spend.tsx` 1006–1016 |
| salesPending blocks 0.00× MER | `app/app/lib/mer-dashboard.server.ts` 197–200 |
| ShopifyQL ACCESS / scope errors | `app/app/lib/shopify-sales-totals.server.ts` 38–57, 66–75 |
| Board / EXECUTION stale versions | `docs/LIVING_BOARD.md` 5–9; workspace `EXECUTION.md` 3 |
| Live versions | Fly **445**; site meta **v42**; listing reviews **0** |

---

*End of audit. No app/** or site/** edits in this lane. No fly deploy. No invented reviews or installs.*
