# Craft S (v47) — Orders · Outside critic

**Verdict: SHIP** (no blockers). Conductor merges and deploys Fly; this critic does neither.

- **Branch:** `cursor/craft-orders-v47` @ `fd47f5d` vs `origin/cursor/spend-trust-recurring`
- **Scope:** 17 files, +364 / −168. Desk Orders (`app.orders.tsx`, `demo.orders.tsx`), `OrdersFirstViewport`, new `OrdersCompareGlance`, `OrdersTimingChart` heading, `orders-first-viewport.ts` constants, and 26 lines of CSS.
- **Checked against:** `APP_CRAFT_PLAN.md` Ship S, `CRAFT_S_ORDERS_NOTES.md`, and `.cursor/skills/mcfly-app-craft/SKILL.md`.

## Done bar

| Check | Result | Evidence |
| --- | --- | --- |
| First fold = typical-order hero + vs-prior + one chart | PASS | The `rank="first"` lane on both `/app/orders` and `/demo/orders` holds, in order: `OrdersFirstViewport` (median hero), `OrdersCompareGlance` (orders, sales, and AOV vs prior), then `OrdersTimingChart`. |
| Clock / intelligence / frequency folded at `rank="more"` | PASS | One `DeskLane rank="more" fold defaultOpen={shotMode}` wraps `OrdersScoreboard`, `OrdersIntelligence`, and `OrdersFrequencyChart` on both routes. The old second `rank="next"` "Weekday and hour" lane is gone. |
| No `s-section className` | PASS | `rg s-section` finds nothing in Orders components or routes. A test now forbids `<s-section` in `OrdersFirstViewport`. |
| Native `<section>` + `<h3>` | PASS | The hero and compare use `<section aria-label>`. The compare has `<h3 class="mcfly-yoy__h">` ("Vs prior period"). The chart title changed from `<p>` to `<h3 class="mcfly-chart__h">` ("When sales land"). |
| No essay ledes | PASS | Both `mcfly-book__lede` blocks (the Analytics essay and the pending banner) are removed from both routes, and tests assert their absence. The greeting is gone. The Analytics contrast and the timing-split sentence are now screen-reader-only (`__sr`, and those classes exist in CSS). The lane hint is suppressed with `hint=""`. |
| From orders | PASS | Hero meta reads `OVERVIEW_FROM_ORDERS_LABEL` ("From orders") · Typical order · N orders. |
| SAMPLE_ONLY | PASS | The demo passes `useSampleDesk`, so the hero shows `SAMPLE_ORDERS_DOOR` ("Snowdevil example orders — not this shop.") and the section carries `data-sample`. |
| No `read_reports` | PASS | All three tomls have `read_orders,read_customers,read_all_orders`. There are no `read_reports` hits on Orders paths. |
| No spend/ROAS on Orders | PASS | Existing `ORDERS_SPEND_BANS` tests still run against the first view and the route. |
| `npm test` | PASS | 169 files and 2004 tests passed. |
| CSS parses | PASS | `postcss.parse(mcfly-desk.css)` succeeds. |
| `tsc --noEmit` | No new errors | 24 errors repo-wide. The only ones in touched files are 3 in `orders-first-viewport.test.ts`, where `ordersOperatorGreeting` calls lack `todaySalesTruncated`. Base has the same three calls against the same type, so these are pre-existing. Nothing in the new or changed components or routes fails. |

## Blockers

None.

## Non-blocking follow-ups (next Orders pass, not a HOLD)

1. **Hero density.** Under the hero value sit the meta line, a peek strip (days to second · 2+ items · Discounted), and `OrdersTicketBand`. The skill says "one subdued meta line max." The strip is numbers-only, not prose, so it's tolerable. Next pass: pick either the strip or the ticket band for the first fold.
2. **Dead props.** `OrdersFirstViewport` accepts `stepMix` and `tickets` as `_stepMix` and `_tickets` but never uses them. Either drop them from the props and both call sites, or use them.
3. **Duplicated `deltaCopy`.** `OrdersCompareGlance` copies it from `OrdersIntelligence`. The logic and units are identical (same `ordersIntelDelta` source). Extract it into `orders-intelligence.ts`.
4. **`ORDERS_TODAY_TRUNCATED_LINE` is two sentences** and now appears on the first fold whenever live today hits the ~100-order cap. It's an honesty edge case, but consider shortening it to one line, e.g. "Today capped at ~100 orders — not a closed day."
5. **Unstyled modifiers.** `mcfly-overview-plane__hero--even` and `mcfly-yoy__vs--flat` have no CSS rules. This is harmless because the base classes apply; delete them or style them.
6. **Strip `key={part}`.** A key collision is theoretically possible if two parts render identical text. Key by index or by peek key instead.

## Not verified here (Conductor pre-publish)

- The skill's done bar requires a `/demo/orders` screenshot at 1280×720 before calling live quality done. No dev server was running and this critic didn't start one. Conductor should take the screenshot on the preview or after Fly deploy, and confirm the first two viewports show hero → compare → chart, with the folded "Sales clock and intelligence" toggle below.
- Embedded Admin render (`/app/orders`) against a real shop, including the pending and truncated states.

## Marty-only

Nothing new. Unpark, listing Save, and ads are unchanged.
