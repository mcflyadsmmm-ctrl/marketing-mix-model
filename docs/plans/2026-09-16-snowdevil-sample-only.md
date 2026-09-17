# Snowdevil SAMPLE-only — implementation plan

> **For agentic workers:** Execute this file. REQUIRED: Mac `flyctl` after the desk is Sample-only Snowdevil (unless Marty said hold). Do **not** unpark Live. Do **not** Partner Submit.

**Goal:** The installed app is a dense, honest **Snowdevil** SAMPLE desk (Shopify’s snowboard generated-data shop) so Marty can judge look + math before Live is turned on for real stores.

**Architecture:** Keep the four Desk lanes already on `cursor/spend-trust-recurring`. Replace Harbor Home Co economics/copy with a 400-day Snowdevil book (board AOV, winter peak, Meta+Google spend). Force Sample on; hide Live until Marty unparks. Same formula.

**Tech stack:** React Router 7, Prisma/Postgres, Admin GraphQL 2026-07, Fly `mcfly-analytics`, Mac `flyctl`.

## Global constraints

- Total ROAS = SAMPLE sales ÷ **entered SAMPLE spend**. Empty spend is **—** not `0.00×`. No pixels / MTA / OAuth.
- SAMPLE chip / watermark **always on** during this freeze (App Store 1.1.4). Never present Snowdevil dollars as `devmcflyads` live orders.
- Brand in SAMPLE chrome: **Snowdevil**. Products shaped like The Complete Snowboard / Collection / ski wax — not Harbor $88 AOV candles.
- Scopes stay `read_orders,read_customers`. No `read_all_orders`. No Live `orderCreate` / Matrixify / Bogus checkout fattening.
- Listing: `https://apps.shopify.com/mcfly-analytics-public`. Reviews **0**. Cursor/Grok never Submit.
- App URL: `https://mcfly-analytics.fly.dev`. Branch: `cursor/spend-trust-recurring`. Never `clean-revamp-v8` / `main` / PR #19.
- Never commit `suite/` or `.env.local`.
- Mac split: [`../ops/GROKBOT_MAC_SPLIT.md`](../ops/GROKBOT_MAC_SPLIT.md). Grok may `flyctl` on this Mac. Marty is Admin/Partner gate.
- Do **not** revert the four Desk lanes (Overview pending, Shopify books, Spend payoff, YoY/Settings). Adopt them.

---

### Task 1: Snowdevil book (data)

**Files:**
- Modify: `app/app/lib/demo-sample-desk.server.ts`
- Modify: `app/app/lib/demo-sample-desk.test.ts`
- Modify: `app/app/lib/sample-desk.server.ts` (`SAMPLE_DESK_SHOP_NAME`, `SAMPLE_BOOK_NOTE`, `sampleDeskNeedsSeed`)
- Modify: `app/app/lib/order-facts.server.ts` (`seedSampleOrderFacts` comment + unit counts 1–2)

**Book law:**
- Keep `SAMPLE_BOOK_DAYS = 400` through today UTC.
- Keep target Total ROAS `SAMPLE_DESK_TARGET_MER = 3.5` (impressive, not 4.4× theater).
- AOV **$520–$700** (Complete Snowboard territory), not Harbor $88–$116.
- Season: Nov–Feb peak; May–Aug off-season (wax/clearance, still enough dollars that Overview is not empty); Sep–Oct pre-season.
- Spend mix: Meta + Google heavy (Shopping for boards), email, other (affiliates/events). Not 14 channels every day. No TikTok-required.
- `SAMPLE_MIN_NEW_CUSTOMERS = 1` so summer 2-order days stay honest.
- Spend `note` = `sample:snowdevil-1`. `sampleDeskNeedsSeed` returns true if note ≠ that (rewrites leftover Harbor rows).
- Export `SAMPLE_DESK_SHOP_NAME = "Snowdevil"`.

- [ ] **Step 1:** Lock tests: AOV median > $400; Nov sales > May sales; only `meta|google|email|other`; MER 3.1–4.0; last day = today UTC; shop name Snowdevil; `SAMPLE_BOOK_NOTE` used in insert.
- [ ] **Step 2:** Implement generator + reseed note.
- [ ] **Step 3:** `cd app && npx vitest run app/lib/demo-sample-desk.test.ts app/lib/sample-desk-enable.test.ts`

---

### Task 2: Sample-only freeze (halt Live)

**Files:**
- Modify: `app/app/lib/sample-desk.server.ts` — `isSampleOnlyFreeze()`, `hydrateSampleOnlyFreeze(shopId)`, reject `use-real` / `hide-sample-preview` while freeze is on
- Modify: `app/app/routes/app.settings.tsx` — Sample | Live: hide Live CTAs; one line “Live is parked until launch”
- Modify: `app/app/routes/app.data-mode.tsx` — `use-real` no-ops during freeze
- Modify: `app/app/lib/product-labels.ts` — `sampleHint` names Snowdevil example, not Harbor
- Modify: `fly.toml` `[env]` `MCFLY_SAMPLE_ONLY = "true"`

While `MCFLY_SAMPLE_ONLY` is true (or `"1"`): every Admin load hydrates Sample on (seed if needed), Live switch does not flip, SAMPLE DATA watermark stays. Do **not** seed inside *every* loader if the book is already through today — use existing `ensureSampleBookThroughToday` in-flight map.

Marty unpark = set `MCFLY_SAMPLE_ONLY=false` on Fly **and** he says so. Do not unpark in this job.

- [ ] **Step 1:** Test: freeze on → `applySampleDeskIntent("use-real")` leaves `useSampleDesk` true; Settings chrome has no “Switch to Live data now”; `sampleHint` contains Snowdevil not Harbor.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** `cd app && npx vitest run app/lib/sample-desk-enable.test.ts app/lib/desk-sample-ux.test.ts app/lib/yoy-settings-visible.test.ts`

---

### Task 3: Visuals use the new book (do not rebuild IA)

**Files:**
- Modify: `app/app/lib/desk-phone-fixture.html` — brand Snowdevil; typical order ~$600 not $92; drop Harbor
- Modify: tests that still assert Harbor / `$82,068` / `$23,414` / `$92` as SAMPLE (`desk-phone-layout.test.ts`, `desk-sample-ux.test.ts`, `site-demo-harbor.test.ts`, `site-demo-phone.test.ts`, `spend-recurring.test.ts`, `desk-paint-currency.test.ts`, `sample-book-ready.test.ts`)
- Modify: `app/app/lib/spend-money.ts` comment (SAMPLE USD is Snowdevil book ISO)
- Site (after desk tests green): `site/demo.html`, `site/assets/demo-desk.js`, `site/index.html` — Snowdevil not Harbor; recompute MTD/QTD/YTD from `buildThreeYearSampleDesk({ now: new Date("2026-09-16T18:00:00Z") })` so public demo matches the generator. Keep 3.51× class (sales÷spend near 3.5). Never Northline `$98,500` / `4.19×`.

Do **not** restyle Overview into a pamphlet. Keep KPI cards + open chart from the four lanes.

- [ ] **Step 1:** Update fixtures + tests.
- [ ] **Step 2:** `cd app && npx vitest run app/lib/desk-phone-layout.test.ts app/lib/desk-sample-ux.test.ts app/lib/site-demo-harbor.test.ts app/lib/site-demo-phone.test.ts`
- [ ] **Step 3:** Site copy Snowdevil. Pages only if Marty wants `/` updated this round; default **desk Fly first**.

---

### Task 4: Math smoke (Sample)

Walk every tab against Snowdevil numbers (code + tests, not Marty Admin):

| Tab | Must show |
| --- | --- |
| Overview | YoY cards with real SAMPLE dollars; typical order board-sized; chart visible; SAMPLE chip |
| Orders | Median vs mean, weekend, Online/POS cards |
| Customers | Returning **dollars** hero |
| Growth | Days to second / 30-day come-back or honest — |
| LTV | 90-day hero; First year — if window too short |
| Spend | SAMPLE ledger + Sales \| Total ROAS (3.x×) + mix; SAMPLE dollars do not transfer |
| Total ROAS | Certified chips; empty Live spend N/A during freeze |
| YoY | This month vs last month vs last year vs last 7 |
| Settings | Sample-only copy; 7-day then $39; no Live CTA |

Formula check: pick one SAMPLE day, `sales / sum(spendByChannel)` ∈ 3.1–4.0. Never `0.00×` with spend on file unless sales are certified $0.

- [ ] **Step 1:** One vitest that builds the book for a fixed `now` and asserts MTD spend > 0, MTD sales > 0, mer in range, AOV > 400.
- [ ] **Step 2:** `bash scripts/agent-ship-gate.sh` from repo root if that script exists; otherwise the vitest set above plus typecheck the app uses.

---

### Task 5: Mac Fly (Sample QA), then stop

Marty must **see** it. Live stays parked.

```bash
# from marketing-mix-model on cursor/spend-trust-recurring
# do not commit suite/
bash scripts/agent-ship-gate.sh
fly deploy -a mcfly-analytics --yes
```

Stamp `docs/LIVING_BOARD.md`: Fly version, `MCFLY_SAMPLE_ONLY=true`, Snowdevil, occupancy 0/4. Probe `https://mcfly-analytics.fly.dev/health` 200.

**Do not** Pages-deploy unless site changed **and** Marty wants it.

---

## Definition of done

1. Settings cannot switch to Live while freeze is on.
2. SAMPLE book is Snowdevil (board AOV, winter peak, Meta+Google), 400 days through today.
3. Overview looks like a scoreboard (cards + chart), labeled SAMPLE.
4. Total ROAS on Spend is sales ÷ entered SAMPLE spend, ~3.5×, never 0× for empty.
5. Fly has that binary. Marty still has to hard-refresh **devmcflyads** and say pass/fail.
6. Live path exists in code but is parked — not deleted.

## Human leftover (never this plan)

Partner Submit · listing stills · ads · unparking Live (`MCFLY_SAMPLE_ONLY=false`) · “downloadable?” in Admin.
