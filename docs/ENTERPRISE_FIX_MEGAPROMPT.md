# Enterprise Fix Megaprompt — Mcfly Ads (post deep audit 2026-07-26)

**Paste this into a fresh Cursor chat (or parent Auto orchestrator).**  
**SoT:** `docs/MASTER_PLAN.md` §0–§4 · `docs/MASTER_DIRECTIVE.md` · this audit.  
**Audit canvas:** open beside chat from the deep-audit session.  
**Apps Script:** REFERENCE ONLY (`vendor/mer-apps-script/`) — never edit/push/redeploy Black Clover. Steal **features**, not Fraunces/sky chrome.

---

## Mission

Fix every P0/P1 from the enterprise deep audit, then ship-gate. Make **mcflyads.com mobile-honest** (charts never cut off). Restyle the **Spend explorer** to **mcflyads.com aesthetic** while keeping Apps Script–class **capabilities**.

**Refuse:** pixels, MTA, TW clones, connector zoo, App URL = mcflyads.com, clasp push.

**Deploy:** Pages + Fly only when parent asks after ship-gate green. Commit only if Marty asks.

---

## Topology (redesign)

Parent Auto orchestrates. Spawn in parallel with **explicit** models:

| Role | Model slug | Owns |
| --- | --- | --- |
| Implementer A — correctness | `cursor-grok-4.5-high-fast` | source/TZ/periods/upsert |
| Implementer B — site mobile + explorer brand | `cursor-grok-4.5-high-fast` | `site/**` explorer + CSS |
| Critic | `cursor-grok-4.5-high-fast` | score ≥4.5, mobile 390px, religion |
| Optional DX split | `composer-2.5-fast` | route/CSS splits only if A/B unblocked |

Never omit `model` on Task spawns.

---

## P0 — Correctness (do first)

### A1. Spend `source` integrity (sample collision)

**Bug:** `createSpendRepository().upsertSpendDays` writes amount/note but **never** `source`. CSV/bill pass `source: "csv"`; Prisma defaults / preserves `"sample"` → sample OFF drops imported spend.

**Fix:**

1. On create **and** update, set `source` from `row.source` (`csv` | `manual` | sync tag → prefer `csv` for desk imports).
2. Same for `app.spend.tsx` manual upsert and `v1.spend.tsx` if they omit source.
3. When overwriting a sample row with real import, **force** `source` off `sample`.
4. Tests: seed sample day → CSV same channel/day → sample OFF → amount still in MER spend aggregate.
5. Files: `spend-repository.server.ts`, `app.spend.tsx`, `v1.spend.tsx`, tests.

### A2. Shop IANA day keys everywhere

**Bug:** `localDayKeyFromIso` in `shopify-sales.server.ts` uses **server** local TZ (Fly UTC). Facts path already uses shop IANA.

**Fix:**

1. Route all live by-day bucketing through `shopLocalDayKey` / shop timezone from settings/metadata.
2. Align `resolvePeriod` / `periods.ts` edges to **shop-local** calendar (not server `new Date(y,m,d)`).
3. Tests for order near midnight America/Denver vs UTC machine.
4. Files: `shopify-sales.server.ts`, `periods.ts`, `mer-dashboard.server.ts`, `app._index.tsx` loader.

### A3. Facts-first desk (GraphQL off hot path)

**Bug:** Cash MER loader still backfills + multiple live GraphQL pulls on nav.

**Fix (incremental, don’t boil ocean):**

1. Prefer `SalesDayFact` when complete for range; skip live by-day/explorer pulls when facts cover window.
2. Defer / throttle `runSalesFactsBackfill` (not blocking first paint; or only when facts incomplete).
3. Prior-period: facts if present, else one live call — not always live.
4. Document remaining GraphQL cases. Target: redesign KPI “GraphQL off hot path” for happy path.

### A4. Religion copy: no “automatic spend”

**Fix:** `site/download.html` (and any sibling) must say CSV / Bill→daily spine — **not** “pulls spend automatically.” Match `product.html` / FAQ.

---

## P0 — Site mobile + Mcfly aesthetic explorer (Marty priority)

### B1. Mobile: charts must never clip

**Evidence:** `spend-explorer-demo.js` forces `plotW = Math.max(520, …)` while `body { overflow-x: hidden }` — phones cut off the chart.

**Fix:**

1. Chart width = `min(containerWidth, needed)` with **internal** horizontal scroll only (`.sx-demo__chart-wrap` / `.sx-demo__scroll`). Never rely on page-level overflow.
2. On ≤430px: reduce `colMin`, allow plotW down to ~container (~320–360); fewer x-labels; denser but readable bars.
3. Controls: wrap / collapse secondary (FROM/TO, Sales line) under a “More” disclosure on narrow; keep range + grain visible.
4. Hero instruments: already stack — verify no horizontal bleed; chips wrap without forcing page scroll.
5. Soften `min-height: 100svh` hero on mobile if it forces clip of explorer.
6. QA: 390×844 and 430 widths — screenshot or CDP: full chart visible via scroll-inside, no cut bars/labels.
7. Unify cache `?v=` to one stamp across **all** `site/*.html` (kill b/d/e/f skew).

### B2. Features = Apps Script; look = mcflyads.com

**Intent:** Same capabilities as Apps Script Spend explorer / scoreboard craft — **not** a visual clone of the Black Clover script.

**Keep feature parity:**

- Ranges: 14d / 30d / 90d / YTD / 1y / All + FROM/TO
- Grain: Day / Week / Month / Quarter
- Views: stacked channel $ / share % / total $
- MER line + target rail + optional sales line
- Chips: window, spend, MER
- Tooltip honesty: cash MER = sales ÷ spend

**Restyle to site brand:**

- Fonts: Bricolage Grotesque + Figtree + IBM Plex Mono (site tokens) — **not** Fraunces / Source Sans script look
- Colors: navy `--ink` / cyan accent / paper surface on dark hero — **not** `#e8f2fa` / `#0284c7` script tokens
- Chrome: match `.hero-craft` / site bands — quiet borders, no Google Sheets dashboard chrome
- Controls: site `.seg` / button language where possible; less “admin tool” density on marketing surface
- App desk explorer may stay Polaris/desk-token native; **site** demo must feel like mcflyads.com

**Files:** `site/assets/spend-explorer-demo.js`, `site/assets/site.css` (`.sx-demo*`, `.hero .sx-demo*`), `site/index.html` copy tweaks only if needed.

**Critic score:** mobile ≥4.5 · brand-match ≥4.5 · feature parity ≥4.5 · religion PASS.

---

## P1 — Ops / narrative / DX

1. **Normalize site asset `?v=`** on every HTML page + fix `sw.js` precache to versioned URLs or stop precaching CSS/JS.
2. **Narrative coherence:** Fly bare `/` (`app/app/routes/_index`) → CSV spine voice (not “live pipes next”). Align `APP_STORE_LISTING` PCD wide-template line + bullets with full channel set. Fix `APP_FEATURES.md` CSV = Planned → Shipped. Soften waitlist vs Free confusion on homepage if easy.
3. **Spend upsert batching:** transaction + fewer round-trips for combine/bill/csv (still correct source).
4. **CSV/API limits:** max upload size + row cap with clear error.
5. **GO_LIVE.md scopes:** `read_orders,read_customers` to match fly.toml / shopify.app.toml.
6. **Sample source honesty:** sample sales must never be labeled as live Shopify outside UI-gated paths; prefer `source: "sample"` in data layer where typed.
7. **Dual MER packages:** pick one SoT (`mer-engine` or `mer-core`) and re-export the other — no formula fork.
8. **Monolith diet (progressive):** extract Cash MER loader helpers / explorer panel from `app._index.tsx` toward ≤400 LOC target — only after P0 correctness green.
9. **Stale docs:** update `REJECT_RISK_AUDIT` / `SUBMIT_READY_SCORECARD` — trust URLs live Free+PCD; submit-human still ~35%.

---

## P2 — backlog (don’t block P0)

- Money as Decimal/cents instead of Float  
- Rate limit `/v1/spend`  
- Docker production `npm ci --omit=dev`  
- Queue/webhooks redesign slice (ENTERPRISE_REDESIGN W3–5)  
- Playwright install-smoke automation  

---

## Human gates (report only — do not fake)

1. Distribution → Shopify App Store  
2. PCD questionnaire  
3. Install smoke on `devmcflyads` with sample **OFF**  
4. Capture **5** listing shots  
5. Partner Pricing **Free** → Submit  

---

## Definition of Done

```bash
# Agent
(cd app && npx vitest run app/lib/spend-billing.test.ts app/lib/spend-csv.test.ts app/lib/spend-explorer.test.ts)  # + new source/TZ tests
bash scripts/agent-ship-gate.sh
bash scripts/mcfly-compliance-spotcheck.sh

# Site
# - 390px: explorer chart fully usable (in-panel scroll OK; no clipped bars)
# - Visual: explorer reads as mcflyads.com, not Apps Script port
# - All HTML share one ?v= stamp
```

**Report:** P0/P1 checklist with file evidence · leftover human gates · no false “submit-ready.”

---

## Suggested first message to specialists

> Implement ENTERPRISE_FIX_MEGAPROMPT.md. Priority order: A1 source → A2 TZ → B1/B2 mobile+brand explorer → A3 facts-first → A4 copy → P1 narrative/cache. Apps Script features only; Mcfly brand on site. Ship-gate before claiming done. No deploy/commit unless parent asks.
