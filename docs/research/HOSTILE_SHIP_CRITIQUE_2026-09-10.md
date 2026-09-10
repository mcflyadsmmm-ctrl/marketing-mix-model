# Hostile ship-readiness critique — 2026-09-10

**Source:** frontier fleet hostile critique (Opus thinking) on `cursor/review-ready-finalize-3706`.  
**Verdict:** **early wedge** — honesty layer strong; day-zero differentiated desk still blocked by activation arithmetic and Analytics-duplicative cold tiles.

Do not invent reviews/installs. Religion unchanged: Total ROAS = Shopify sales ÷ entered spend.

## Top blockers (uninstall risk order)

1. **Activation mismatch** — taught path is “type one day”; trust needs ~70% coverage (~14 days mid-month). Trial is 7 days. Promote lump-spread (“enter month total → daily rows”) as first-run primary (`app.spend.tsx`, `install-stickiness.ts` / `first-session-path.ts`).
2. **Order economics self-destructs** — panel gated on `coldEmpty` (`app._index.tsx`); AOV + returning share duplicate free Analytics. Keep panel after spend; swap tiles for spend-per-order / weekend vs weekday Total ROAS.
3. **Overview loader serial GraphQL** — `runSalesFactsBackfill` up to 14 days sync (`sales-facts.server.ts`). Cap sync fill; queue the rest; cooldown quiet stores.
4. **Order-economics math windows mixed** — period sales vs 14-day `salesByDay`; total vs net cohort bases. Reconcile + Vitest.
5. **Allocation never names a channel** — `salesContribution` never set in prod; only portfolio hold/reduce. Add operator-declared contribution **or** rename copy to portfolio-only.
6. **Demo promises channel advice** the engine can’t emit (`site/assets/demo-desk.js`). Align demo to real portfolio strings.
7. **“Update spend” CTA spam** — up to four CTAs on Overview; collapse to one primary.
8. **Site/FAQ “days to second order”** — claimed, not computed. Ship metric or strip (incl. FAQ JSON-LD).
9. **Billing enforcement residue** — entitlements always open; Managed Pricing unclear. Pick install-gate vs in-app gate and delete dead freemium chrome.
10. **Period ledger export** — requires 100% day coverage; show “export covered range” instead of permanent grey button.

## Still duplicating free Analytics

- Cold AOV / returning-share tiles; Overview sales delta; Acquisition new/returning split (aMER is ours); LTV cohort revenue alone (Cash CAC / LTV:CAC are ours); Spend explorer sales series.

## Un-clonable (keep investing)

Total ROAS vs break-even · spend-coverage honesty · Cash CAC / LTV:CAC · closed-day ledger · platform claimed vs banked (needs input form).

## Friendly-merchant bar vs App Store bar

- **Friendly first installs:** blockers **1, 3, 4** + decide **5** and **9**.
- **App Store submit:** also **2, 6, 7, 8, 10** + green suite + fresh screenshots + human Partner gates (Distribution, PCD, emergency, real-store smoke).

## Note on this branch tip

Critique reported suite red in places / ship-gate risk — re-run `scripts/agent-ship-gate.sh` (or focused vitest) after integrating Spend + Allocation WIP before claiming green.
