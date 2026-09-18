# Enterprise / $1k-feel full-tab SCORECARD — 2026-09-18

**Audience:** Coordinator assigning one-FAIL Cursor cooks.  
**Tip:** `cursor/spend-trust-recurring` @ `0a7a9f3` (merge of #113).  
**Craft SoT:** SAMPLE Snowdevil Admin desk (`/app/*`). Live still parked (`MCFLY_SAMPLE_ONLY=true`).  
**Method:** Static read of tip routes, first-fold components, honesty helpers, and #103–#113 lock tests. **No formula changes. No UI cooks. No Fly. No Admin session. Not a Marty PASS.**  
**Bar:** enterprise / $1k-feel — dense soft cards, progressive lanes, written formulas, empty ≠ $0, heroes Shopify Analytics does not clone.

**SoT read:** [`PASS_BAR.md`](./PASS_BAR.md) · [`OWN_THE_NICHE.md`](./OWN_THE_NICHE.md) · [`SHOPIFY_ONLY_COMPETE.md`](./SHOPIFY_ONLY_COMPETE.md) · [`CRAFT_UNLOCK.md`](./CRAFT_UNLOCK.md) · [`ACCURACY_ONE_SHOP_SCORECARD.md`](./ACCURACY_ONE_SHOP_SCORECARD.md) · [`LIVE_UNPARK_CHECKLIST.md`](./LIVE_UNPARK_CHECKLIST.md) · [`../plans/2026-09-15-TAB_LOCK.md`](../plans/2026-09-15-TAB_LOCK.md). No dedicated `ONE_K` / enterprise-feel file on tip; $1k bar = CRAFT_UNLOCK “multi-million” + PASS_BAR Quality + OWN_THE_NICHE $39-alone, judged harder.

**HOLD (not FAIL):** Live Admin accuracy rows 3–9 on [`ACCURACY_ONE_SHOP_SCORECARD.md`](./ACCURACY_ONE_SHOP_SCORECARD.md) (shop TZ, refunds, Overview vs Analytics, typical vs 10 orders, pending crawl, Live watermark off). SAMPLE math packs (v336 / v339 / sample-math) are not a Live pass.

---

## How to read

| Mark | Meaning |
| --- | --- |
| **PASS** | Tip already locks this area for SAMPLE first path. Do not recook unless a later FAIL regresses it. |
| **FAIL** | Assignable gap. One cook in the ranked list below. |
| **N/A → PASS** | Area does not apply on this tab’s first path (and nothing leaks). |

Spend premium is judged on `/app/spend`. Other tabs PASS that column when spend / ROAS / upload stay off the first fold.

---

## Table — Tab × area

Evidence is first-path (fold / first `DeskLane` / Settings chrome). File paths are under `app/app/` unless noted.

| Tab | 1 Trust / accuracy | 2 Uninstall friction | 3 $1k / multi-million craft | 4 Spend premium | 5 Green SAMPLE psychology | 6 No COGS / margin / pixel | 7 Niche vs Shopify Analytics |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Overview** `/app` | **PASS** — pending / thin paint `—` + “not $0” (`OverviewFirstViewport.tsx`, `OVERVIEW_PENDING_LINE`); `DataModeBar` + SAMPLE chip; door `SAMPLE_OVERVIEW_DOOR` (“Snowdevil example sales — not this shop”). | **PASS** — `syncNeedsTop` banners above glance (`app._index.tsx` ~678–681); first lane “Look here first” + Mcfly peeks; Settings switch copy on `DataModeBar`. | **PASS** — `#104` lanes: peeks+YoY first, mix/shareables next, sales explorer next, depth folded (`app._index.tsx` ~736–837). Soft KPI + open chart, not a tile wall. | **N/A → PASS** — zero spend / ROAS / upload on first fold (CRAFT_UNLOCK / TAB_LOCK). | **PASS** — `#103` YoY down = `--mcfly-delta-down` mute (`desk-delta-tokens.test.ts`, `.mcfly-yoy--glance .mcfly-yoy__delta--down`). | **FAIL** — SAMPLE overlay `SAMPLE_DESK_MARGIN_PCT = 0.35` paints a trust chip **“Margin 35%”** above the first lane (`app._index.tsx` ~714–717; `sample-desk.server.ts` ~156). Merchant never set margin. | **PASS** — `#112` heroes are typical / returning $ / weekends (`OVERVIEW_FIRST_LANE_LABEL`). YoY MTD/QTD/YTD stay as TAB_LOCK spine *after* those peeks — not the lead clone. |
| **Orders** `/app/orders` | **PASS** — pending “not $0” lede; thin empty `ORDERS_THIN_EMPTY_LINE`; `SAMPLE_ORDERS_DOOR`; typical = median, average labeled. | **PASS** — `#109` order-progress on `DeskBookPage`; `#113` typical heroes lead the first lane (`OrdersFirstViewport`). | **FAIL** — first `DeskLane` still stacks viewport **+** `OrdersScoreboard` (shape + sales clock) **+** `OrdersIntelligence` 90d KPI strip (`app.orders.tsx` ~108–129). That is a dump after the hero, not a progressive lane. | **N/A → PASS** — `ORDERS_SPEND_BANS`; no spend on route. | **PASS** — intel downs use `mcfly-orders-intel__delta--down` → grey token. | **PASS** — no margin / COGS / pixel on first lane. | **FAIL** — clock still labels **“Total Sales”** when gross is unknown (`orders-scoreboard.ts` `buildOrdersClock` ~197–198) and intel KPI **“Sales”** (`orders-intelligence.ts` ~207) sit in the **same** first lane as the median hero. |
| **Customers** `/app/customers` | **PASS** — SAMPLE lede “not this shop’s Shopify orders”; mix empty “not $0” / “not zero”; pending `—`. | **PASS** — explorer-first mix; ActionCard empties on retention (next lane); guests out of returning $. | **PASS** — marquee + compact returning hero; RFM / whales / concentration folded `rank="more"` (`app.customers.tsx` ~161–201). | **N/A → PASS** — mix chart: “no spend ever overlays this”. | **PASS** — no period-delta reds on first fold. | **PASS** — order-history only. | **PASS** — returning **$** vs Analytics headcount rate (`CUSTOMERS_CONTRAST`). |
| **Growth** `/app/growth` | **PASS** — SAMPLE Snowdevil lede; pending “not $0”; scoreboard “Needs identified first orders — not $0.” | **PASS** — comeback explorer first; TT2 next; drill to LTV. | **PASS** — book hero / fact grid retired; chart + soft board (`app.growth.tsx` ~125–151). | **N/A → PASS** — no spend on first path. | **PASS** — no `--mcfly-lie` delta classes on first fold. | **PASS** — order-history only. | **PASS** — who came back / first-time $ / days-to-second — not Total Sales. |
| **LTV** `/app/ltv` | **PASS** — first-90 hero; year `—` + “Not $0.”; `#110` Target Line = observed average (`LtvValueBuild`); Unlock copy is Live-90, not a fake year; SAMPLE depth labeled in next lane. | **PASS** — `#109` `UnlockFullHistoryBanner` **before** first lane (`app.ltv.tsx` ~503–505); first-win empties ActionCard-shaped on flagship boards. | **PASS** — hero + build + short grid first; Product→LTV / Promo→LTV / explorers `rank="next"`; spend economics `rank="more"`. | **N/A → PASS** — Spend/CPA links in footer only. | **N/A → PASS** — no YoY down strip on first fold. | **FAIL** — SAMPLE has spend on file + `showMarginKept` (`useSampleDesk`); first-lane **First year** row appends “$X kept. After 35% margin.” (`app.ltv.tsx` ~256–259, ~337–338). Pixel/MTA absent. | **PASS** — first-90 after first order; `PRODUCT_NOUN.ltvNotInShopify`. |
| **Spend** `/app/spend` | **PASS** — “Empty spend is never 0×”; no `0.00×`; SAMPLE banner `SAMPLE_LEDGER_HANDOFF`; freeze blocks Live save (`app.spend.tsx` ~330–334, ~655–665). | **PASS** — stranger empty = Yesterday hero only (no ledger graveyard); “Add yesterday” primary; ROAS links gated until rows exist. | **PASS** — `#108` soft hero + collapsed Coverage / Recent ledger (`defaultOpen={false}`). | **PASS** — progressive disclosure, `$X/day` continues, CSV on `/app/spend/import`, **no** `MarketingSnapSection` / ROAS hero (`easy-add-spend-tab.test.ts`). | **N/A → PASS** — no pace/down KPIs on Upload. | **PASS** — `#111` import calculator has no margin %; no pixel/OAuth on Upload fold. | **PASS** — `SPEND_UPLOAD_CONTRAST`: Analytics shows sales, not a spend ledger. |
| **Settings** `/app/settings` | **PASS** — “Live is parked until launch”; SAMPLE “Snowdevil example numbers, not this shop”; freeze omits Switch buttons (`app.settings.tsx` ~431–511). Kill-switch no-op is code-locked (`sample-desk-enable.test.ts`). | **PASS** — `#109` Sample \| Live first, then **Need help?** + `mcflyadsmmm@gmail.com` + Open Support (`uninstall-friction.test.ts`). | **PASS** — plumbing, not a report dump (`mcfly-settings--soft`). | **N/A → PASS** — nudge to Spend Upload only after a target save, not first paint. | **N/A → PASS** — no delta theater. | **PASS** — `#111` hides Profit margin / COGS / break-even fields (`margin-setup-parked.test.ts`). Ghost `marginPct` POST handler remains (not merchant-visible). | **PASS** — targets + Sample \| Live + billing; not a Total Sales clone. |
| **Goals** `/app/goals` | **FAIL** — SAMPLE stretch `$800k` year returning $ (`SAMPLE_HABIT_RETURNING_TARGET`) resolves as if typed (`resolveHabitTarget` + `targetSource: "typed"` in `goals-habit.ts` ~117–125, ~182). Board copy: “target you typed”; input prefills `800000` (`OrderHistoryGoalsBoard.tsx` ~290, ~470). Pending / empty still say “not $0”. | **PASS** — habit board leads; syncing/thin/young/unset ActionCards; trial line → Settings. Unlock stays on LTV (correct). | **FAIL** — `<details open>` “Monthly board · fine-tune” paints the 12-month table on first scroll (`app.goals.tsx` ~916–917). After habit + sales hero + gauges, that is a plan dump. | **N/A → PASS** — spend/ROAS facts only when spend exists; no upload form. | **FAIL** — `#103` missed Goals **pace / row** downs: `.mcfly-goals-pace--down` and `.mcfly-goals-table__row--down` still use `--mcfly-lie` red (`mcfly-desk.css` ~7283–7284, ~7389–7390). YoY *delta* class is already grey. | **PASS** — first path is LTV Target Line + returning $; no pixel. | **PASS** — habit board (new-buyer worth + returning $) leads; `GOALS_ANALYTICS_LEDE` contrasts plan vs Analytics period sales. |

**Composite:** 8 surfaces × 7 areas. **5 FAIL cells** across 4 surfaces (Overview-6, Orders-3, Orders-7, LTV-6, Goals-1, Goals-3, Goals-5). Customers · Growth · Spend · Settings are clean on this rubric.

---

## Ranked FAIL list (assign these)

Order: **trust / accuracy → uninstall → polish**. Each row is **one cook**. Do not bundle. Do not merge this audit PR with a cook.

| Rank | Bucket | FAIL | Why it kills trust or the $1k feel | ONE-cook scope | Suggested title |
| ---: | --- | --- | --- | --- | --- |
| **1** | Trust | **SAMPLE 35% margin paints as this shop’s truth** on Overview first chrome **and** LTV first-lane First-year footnote | Merchant never typed margin. `#111` parked the Settings ask. SAMPLE overlay (`SAMPLE_DESK_MARGIN_PCT`) still shows **Margin 35%** next to freshness (`app._index.tsx` ~714–717) and “$X kept. After 35% margin.” on the LTV value grid (`app.ltv.tsx` ~337–338). Reads as Live shop economics. | **One PR:** delete the Overview margin trust chip. Strip `x: kept / marginNote` from first-lane `orderRows`. Keep economics in LTV `rank="more"` only if still spend-gated — do **not** show margin on SAMPLE first path. Extend `margin-setup-parked.test.ts`. Do not touch Settings form (already hidden). Do not unpark Live. | `cursor/park-sample-margin-paint-f441` |
| **2** | Trust | **Goals SAMPLE $800k returning target paints as “what you typed”** | `SHOPIFY_ONLY_COMPETE` allows a Snowdevil stretch so the canvas is dense — it does **not** allow labeling that stretch as a merchant-typed target. `targetSource` is only `"average" \| "typed"`; SAMPLE fallback is `"typed"`. Formula card + ActionCard say “target you typed”; the field opens at `800000`. | **One PR:** add `targetSource: "sample"` (or equivalent). Copy: “Snowdevil example stretch — not a target you set.” Keep the dense $800k canvas. Saving still writes a real typed target. Lock in `goals-habit.test.ts` + board chrome test. Do not change LTV Target Line (#110). | `cursor/goals-sample-stretch-label-f441` |
| **3** | Uninstall | **Orders first fold still clones Shopify sales** after the #113 median hero | `#113` put typical-order peeks first. The same `rank="first"` lane then mounts the sales clock (`Total Sales` / After returns) and 90d intel **Sales** KPI (`app.orders.tsx` ~114–129). A merchant who wanted “not another Total Sales page” still gets one immediately. | **One PR:** first `DeskLane` = `OrdersFirstViewport` only. Move `OrdersScoreboard` clock/shape to `rank="next"` (or fold with existing “Ticket, basket, returns”). Move `OrdersIntelligence` to `rank="next"` / weekday lane. Keep `#113` tests; add an assertion that first lane does not contain `OrdersClockBar` / `OrdersIntelligence`. No formula change. | `cursor/orders-demote-sales-clock-f441` |
| **4** | Polish | **Goals down states still danger-red** | `#103` locked period/YoY/growth downs to grey. Goals **pace** and **monthly row** still use `--mcfly-lie` (`mcfly-desk.css` ~7283–7390, plus fill ~7337). SAMPLE downs feel like errors, not quiet misses. | **One PR:** paint `.mcfly-goals-pace--down`, `.mcfly-goal-row__pace.mcfly-goals-pace--down`, `.mcfly-goals-table__row--down`, `.mcfly-goals-month-bar__fill--down` with `--mcfly-delta-down` / mute (match `.mcfly-goals-delta--down`). Add those selectors to `desk-delta-tokens.test.ts`. Paint only. | `cursor/goals-green-psychology-f441` |
| **5** | Polish | **Goals monthly board is open on first paint** | Habit board + sales hero + MTD/QTD/YTD gauges already earn the tab. `<details open>` (`app.goals.tsx` ~916) dumps a 12-row plan table — not $1k progressive lanes. | **One PR:** close the details by default (`<details>` without `open`; keep `open` for `shotMode` if listing needs the table). One attribute + a test that first paint does not force-open the board. Do not remove Grow 10% or the table. | `cursor/goals-fold-monthly-board-f441` |

**Do not assign (already PASS or HOLD):** Live unpark · sync-law crawl clamp · Partner paste · Spend ROAS hero (removed) · MarketingSnap on Upload (removed) · Overview spend tiles · Settings COGS fields · Customers tile wall · Growth book dump · LTV Target Line typing · Unlock CTA placement · SAMPLE watermark / DataModeBar · empty-vs-zero `0.00×`.

---

## What is already PASS on tip (#103–#113 era)

Do not recook these unless a ranked FAIL’s PR regresses them.

| PR | What shipped | Rubric cells it locks |
| ---: | --- | --- |
| **#103** | Green-up / grey-down period deltas (`--mcfly-delta-*`; YoY, orders intel, scoreboard). | Overview-5, Orders-5, and the sales-five delta tokens. **Not** Goals pace/table (rank 4). |
| **#104** | Progressive `DeskLane` ranks on Overview + sales-five. | Overview-3; lane chrome on Customers / Growth / LTV. |
| **#105** | Bar charts match line-explorer hover/grain; Spend progressive disclosure. | Chart craft on Overview / Customers / Growth / Orders timing; Spend-3. |
| **#107** | One-shop accuracy scorecard + helpers. | Trust *path* ready; Live rows stay HOLD. |
| **#108** | Spend ease: Yesterday hero, `$X/day`, collapsed ledger, no ROAS hero. | Spend-2, Spend-3, Spend-4. |
| **#109** | Uninstall pass: sync above Overview glance, pending empties, Unlock leads LTV, Settings help. | Overview-2, LTV-2, Settings-2; pending honesty on the five. |
| **#110** | LTV Target Line = observed average, not a typed goal. | LTV-1, LTV-7; Goals LTV track source `"average"`. |
| **#111** | Profit-margin / COGS **setup** parked from Settings / import / pricing bullets. | Settings-6, Spend-6. **Does not** lock Overview chip or LTV first-lane footnote (rank 1). |
| **#112** | Overview first lane labeled Mcfly-only (typical / returning $ / weekends). | Overview-7, Overview-3 lead. |
| **#113** | Orders typical-order first viewport (median vs Shopify average). | Orders-1, Orders-2 lead. **Does not** lock demoting the sales clock (rank 3). |

**Also already PASS (pre-#103, still true on this tip):**

- SAMPLE Snowdevil book + `DataModeBar` + “Live is parked until launch”; freeze no-ops Switch (`fly.toml` `MCFLY_SAMPLE_ONLY=true`).
- Empty spend → Total ROAS `—`, never `0.00×` (`formatMer(null)`).
- Overview / Orders / Customers / Growth / LTV first-path refuse spend-hero / pixels / MTA / “true ROAS”.
- LTV flagship + Product→LTV + Promo→LTV + shareables + RFM-lite + TT2 + mix/close (PASS_BAR / OWN_THE_NICHE scorecards #93–#100).
- Customers explorer-first mix (post-#73 wall cook) and Growth explorer-first comeback.
- `SampleDeskBanner` is a documented no-op — SAMPLE honesty is `DataModeBar` + per-tab ledes (not a FAIL).

---

## First-fold map (SAMPLE SoT)

| Tab | What a merchant sees first (after `DataModeBar`) |
| --- | --- |
| Overview | Sync banners if pending → brand/as-of + **optional Margin 35% chip** + SAMPLE chip → lane “Typical order, returning $, weekends” (peeks then YoY). |
| Orders | Pending lede → median-vs-average contrast → typical heroes → **sales clock + 90d Sales intel**. |
| Customers | SAMPLE + contrast ledes → new vs returning $ chart + compact returning hero. |
| Growth | SAMPLE + pending ledes → comeback explorer + soft board. |
| LTV | Unlock (Live locked only) → first-90 + 30/90/365 build + fact grid (**margin footnote if SAMPLE+spend**). |
| Spend | Example-spend banner → honesty line → Yesterday / Add a day. Ledger collapsed. |
| Settings | Sample data + Live parked → Need help? → ROAS / order-history targets → plan. |
| Goals | Habit board (LTV line + **$800k-looking returning target**) → sales hero → gauges → **open monthly table with red downs**. |

---

## Explicit non-goals of this packet

- Did **not** implement any FAIL cook.
- Did **not** flip `MCFLY_SAMPLE_ONLY` or `MCFLY_LIVE_STAGE`.
- Did **not** claim Admin / Marty craft PASS (`CRAFT_UNLOCK` Galaxy day-2: Admin PNGs still required before Marty ping).
- Did **not** score marketing `/demo` (non-SoT).
- Did **not** re-open CPA / YoY / Allocation / Total ROAS as first-class tabs (out of the requested set). Those stay off the ranked list unless a later cook leaks them onto Overview / Spend first path.

---

## Coordinator paste

```
Rank 1  trust   park SAMPLE margin paint (Overview chip + LTV first-lane footnote)
Rank 2  trust   label Goals $800k as Snowdevil stretch, not typed
Rank 3  uninstall  demote Orders sales clock + intel out of first DeskLane
Rank 4  polish  Goals down pace/rows → grey (--mcfly-delta-down)
Rank 5  polish  close Goals monthly <details> by default
```

One FAIL per cook. Base each cook on `cursor/spend-trust-recurring` tip. Do not merge this audit.
