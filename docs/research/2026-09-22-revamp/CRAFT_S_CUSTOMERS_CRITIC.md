# Craft S (v48) — Customers — outside critic

**Branch:** `cursor/craft-customers-v48` @ `2a581bd` vs `origin/cursor/spend-trust-recurring`
**Plan:** `APP_CRAFT_PLAN.md` Ship S · `CRAFT_S_CUSTOMERS_NOTES.md` · `.cursor/skills/mcfly-app-craft/SKILL.md`
**Precedent:** `CRAFT_S_ORDERS_CRITIC.md` (v47)
**Verdict:** **SHIP** — fold blocker fixed (`rank="more" fold defaultOpen={shotMode}` on both routes).

## Checks

| Check | Result | Evidence |
| --- | --- | --- |
| First fold = primary metric + compare + one chart | PASS | `rank="first"` lane on `/app/customers` and `/demo/customers` holds, in order: `CustomersFirstViewport` (returning-$ hero), `CustomersCompareGlance` ("Same window last year"), then `CustomerMixChart`. The chart moved up out of the old shareables lane. |
| Shareables + scoreboard folded | PASS | Both routes use `rank="more" fold defaultOpen={shotMode}` on `Returning mix and facts` (Orders v47 pattern). |
| No `<s-section className>` | PASS | `rg '<s-section[^>]*className'` across both routes + three touched components = 0. |
| Native `<section>` + `<h3>` | PASS | Hero, compare, and chart are native `<section>`s; compare uses `<h3 class="mcfly-yoy__h">`, chart uses `<h3 class="mcfly-chart__h">`. |
| No essay ledes | PASS | `mcfly-book__lede`, `deskBookLede`, and `CUSTOMERS_CONTRAST` are gone from both routes. Greeting shrank to "Returning N% · New M%". Hero defs are one sentence each. The Shopify Analytics contrast is SR-only (`mcfly-overview-plane__sr` is visually hidden in CSS). |
| From orders | PASS | Hero meta renders `OVERVIEW_FROM_ORDERS_LABEL`. |
| SAMPLE_ONLY | PASS | Branch doesn't touch `sample-desk.server.ts`; `MCFLY_SAMPLE_ONLY` gate intact. Sample desk still shows `SAMPLE_CUSTOMERS_DOOR` under the hero. |
| No `read_reports` | PASS | All three `shopify.app*.toml` scopes = `read_orders,read_customers,read_all_orders`. |
| `npm test` | PASS | 169 files, 2005 tests green. |
| CSS parses | PASS | `postcss.parse(mcfly-desk.css)` OK. New selectors mirror the Orders beat rules. |
| `tsc --noEmit` | Pre-existing only | 4 errors, all in files this branch doesn't touch (`app._index.tsx`, `demo._index.tsx`, `spend-paste-preview.test.ts`). None in Customers files. |

## Blocker

1. **Fold the secondary lane.** On both `app/routes/app.customers.tsx` and `app/routes/demo.customers.tsx`, change
   `<DeskLane rank="next" label="Returning mix and facts">` to
   `<DeskLane rank="more" label="Returning mix and facts" fold defaultOpen={shotMode}>` (demo: `data.shotMode`).
   `customers-page.test.ts` finds the first lane's end by `label="Returning mix and facts"`, so the label string must stay or that test needs updating. Add one assertion that the lane carries `fold`.

## Non-blocking (next pass)

1. **Same numbers painted twice.** Returning $ is the hero *and* the first compare card. New $ is in the hero strip ("New $X") *and* the second compare card. The skill says numbers carry meaning once. Next pass: compare cards should show only the last-year value and delta, or the hero strip should drop "New $X".
2. **"Dollars per buyer" is mislabeled and not a compare.** `buildCustomersCompareKpis` uses `returningBuyerArpu` and falls back to `newBuyerArpu`, but the label is a generic "Dollars per buyer". It also never has a delta, yet it sits under "Same window last year". Either label it "Returning $ per buyer" / "New $ per buyer" to match the source, or drop it from the compare strip.
3. **Nested chart board.** `CustomerMixChart` now puts `div.mcfly-chart__head.mcfly-chart__board` *inside* the outer `div.mcfly-chart__board`, and deletes the old `.mcfly-chart__masthead` that `.mcfly-cust-mix .mcfly-chart__masthead` grid rules placed. `OrdersTimingChart` puts the head directly in the section instead. Probably fine visually, but check the masthead/readout alignment on the screenshot.
4. **Pending compare is a bare "—".** Under `salesPending`, `CustomersCompareGlance` shows the heading plus an em-dash (pending text is SR-only). Acceptable, but a sighted merchant sees an empty-looking card. Consider rendering nothing while pending, since the hero already shows the pending line.
5. **Hardcoded empty copy.** "No identified buyers in this window yet." is inline in `CustomersFirstViewport`. Move it to `customers-first-viewport.ts` next to the other constants.

## Not verified

- No dev server was running and this critic didn't start one. The skill's done bar asks for a `/demo/customers` 1280×720 screenshot. Conductor should take it after the fold fix, and confirm the first two viewports show hero → compare → mix chart, with the "Returning mix and facts" toggle collapsed below.

No merge, no deploy by this critic.
