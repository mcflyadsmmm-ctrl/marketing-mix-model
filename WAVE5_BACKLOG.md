# Wave 5 backlog — honesty leftovers, recovery, Shopify-API first session

**Kind:** Audit + backlog only. No product code in this PR.  
**Tree:** `cursor/spend-trust-recurring` @ `5caedff` (Wave 4 tip; includes merged PR #53).  
**Not:** `main`, PR #19, `suite/`, `.env`, Fly deploy, invented reviews / smoke / metrics.  
**Reviews stay 0.** Ads stay off. Pricing stays 7-day then $39/store/mo. 11-tab lock intact.

**Founder override (this run):** any number mistake is still kill-risk #0. Wave 4 already sealed unseen Shopify days, Goals missing ≠ $0, fill-empty recurring, no fake 0% shares, LTV/Growth first-on-file, and shop-currency paint. **Do not re-open that work.** Wave 5 ranks what is still false-looking *after* those seals.

**Assumptions:** Waves 1–4 land as written. Founder-verified 2026-09-16 ~3:30 MT: Fly **mcfly-analytics v325**, `/health` ok=true db=up, `/app` and `/auth/opening` 200. This audit is **this tip’s code + existing tests**, not a new Admin pass. No invented demcflyads dollars.

Granola was unavailable (MCP needs auth). Prior product religion is from `docs/LIVING_BOARD.md`, `docs/MASTER_DIRECTIVE.md`, `docs/plans/2026-09-15-TAB_LOCK.md`, Wave 4 PR #53, and WAVE4_BACKLOG / draft PR #52 (pre-implement — do not re-file).

---

## Overall desk trust score (after Wave 4)

**Fair–solid on formulas; shaky on leftover $0 chrome, session parity, and first-session completeness.**

Wave 4 closed the year-of-$0 / fake 0% / first-on-file / currency-on-paint class. The Shopify five can still look useful at $0 spend. The remaining kill is **not** “add another metric.” It is **a merchant reading a real-looking $0 spend tile, a 410 “Handling response” after they type a day, or a thin Shopify book that looks empty until they click around.**

| Layer | After Wave 4 |
| --- | --- |
| Formula (sales ÷ spend) | **Solid** — mer-core / mer-engine / desk `computeMer` |
| SAMPLE vs Live contamination | **Solid** (code + tests) |
| Unseen Shopify days / Goals missing ≠ $0 | **Solid** (Wave 4 seals + tests) |
| Recurring fill-empty / durable delete | **Solid** (Wave 4) |
| Returning/new $ shares / LTV first-on-file | **Solid** (Wave 4) |
| Empty spend → no 0× ROAS | **Solid** on Overview / CPA / ROAS ×; **shaky** on Spend `$` tiles |
| Session / 410 chrome | **Fair** — `/app` + Spend + book pages; leftovers on ROAS / Allocation / Settings |
| First-session Shopify five (no CSV) | **Fair** — scopes are enough; ingest is timid after OAuth (`maxDays: 2`) |
| Shop currency | **Fair** — paint requires a code; unknown still falls back to USD |

---

## Accuracy / formula audit (mandatory)

Verdicts: **PASS** / **FAIL** / **UNKNOWN**.  
UNKNOWN only when a live Admin session is required — exact demcflyads check listed.

No live Admin numbers were invented. Harbor site dollars below are **from repo copy**, not a new smoke.

### 1. Total ROAS / Harbor ROAS formula

| Check | Verdict | Evidence |
| --- | --- | --- |
| Desk Total ROAS is **sales ÷ spend**, never sales+spend, never inverted | **PASS** | `packages/mer-core/src/mer.ts` `calculateMer` = `totalSales / totalSpend`, null when `totalSpend <= 0`. Twin in `packages/mer-engine/src/index.ts` `computeMer`. Tests: `packages/mer-core/tests/mer.test.ts`. Dashboard uses `computeMer(action.sales, totalSpend)` after `actionSalesForBasis` (`app/app/lib/mer-dashboard.server.ts`). |
| Copy states the same formula | **PASS** | `PRODUCT_NOUN.definition` = `"Shopify Total Sales ÷ ad spend"`; `notTrueRoas` = `"Sales ÷ spend. Not platform ROAS."` (`app/app/lib/product-labels.ts`). Total ROAS lede restates it (`app.roas.tsx`). |
| Empty spend is not 0× | **PASS** | `calculateMer` returns `null`. Overview omits the ROAS tile when `totalSpend <= 0` (`OverviewFirstViewport.tsx`). Total ROAS paints **—** when `!hasSpend` (`app.roas.tsx`). CPA dashes (`app.cpa.tsx` + `cpa-page.test.ts`). `resolveSalesReadiness` still suppresses the ratio when no certified day has landed (`sales-pending.ts` + the 2026-08-26 `$0 ÷ $650 = 0.00×` smoke). |
| Harbor 3.51× is sales ÷ spend | **PASS** on arithmetic / **UNKNOWN** on desk paint | Site lock: spend `$23,414` · sales `$82,068` · **3.51×** (`docs/LIVING_BOARD.md`). Desk SAMPLE seed still **generates** a book (`sample-desk.server.ts`) — not guaranteed to print Harbor’s exact dollars. |

**demcflyads UNKNOWN:** Settings → Sample data. Read Overview / Total ROAS Sales, Spend, Total ROAS. Confirm Sales ÷ Spend = the painted × (two decimals). Those dollars are the generated SAMPLE book, not necessarily site Harbor `$23,414` / `$82,068`. Then Switch to Live. Confirm SAMPLE spend did **not** move into Live Total ROAS.

---

### 2. Spend aggregation (channels, timezone, SAMPLE vs Live)

| Check | Verdict | Evidence |
| --- | --- | --- |
| Meta + Google + email + other **sum** into the Total ROAS **denominator** | **PASS** | `channelSpendFromEntries` / `sumSpend` (`mer-dashboard.server.ts`, `packages/mer-engine`). Recurring `$0` tombstones do **not** enter the denom (`sumSpend` ignores non-positive). |
| SAMPLE spend never enters Live ROAS | **PASS** (code + tests) | Live loads use `{ excludeSample: true }` / `NOT: { source: "sample" }`. SAMPLE loads use `sampleOnly: true`. `materializeRecurringSpendForShop` returns `{ written: 0 }` when `sampleOn` (`spend-recurring.test.ts` “skips SAMPLE desks”). Saving a live day while SAMPLE is on **turns SAMPLE off first** (`app.spend.tsx`). `resolveHonestSales` zeros `source: "mock"` when sample is off (`mer-trust.ts`). |
| Day boundaries | **PASS** with the same documented convention as Wave 4 | Spend stamps UTC midnight of the YYYY-MM-DD key. Sales bucket `createdAt` with **shop IANA**. Recurring “through yesterday” is shop-local. Join is **calendar key**. |
| Recurring fill vs SAMPLE | **PASS** | Skipped on SAMPLE desks (above). |

**demcflyads UNKNOWN:** Live desk, shop timezone not UTC (demcflyads is America/Denver if still). Type yesterday Meta $40. Confirm the row’s date is **shop-local yesterday**, and Total ROAS denominator moves by $40 for that shop-local day — not UTC yesterday if they differ.

---

### 3. Wave 4 seals (re-check only — do not re-file as Wave 5 product)

| Seal | Verdict | Evidence |
| --- | --- | --- |
| Unseen / old empty Shopify days not stored or served as $0 | **PASS** | `isUnseenShopifySalesDay` + `isCertifiedSalesDayFact` (`sales-facts.server.ts`, `shopify-order-window.ts`). Tests: empty 0-edge fetch outside the window does not upsert; stored $0 outside the window is dropped (`sales-facts.server.test.ts`). `resolveSalesReadiness` treats a beyond-window period with no certified days as **pending**, not $0. |
| Goals Actual / Prior / YTD missing ≠ $0 | **PASS** | `mapGetMonth` returns `null`; YTD actual is null if any included month is missing (`sales-goals.server.ts`). Year-board copy: “Missing months are not $0.” Tests: `goals-page.test.ts`, `sales-goals.test.ts`. |
| Recurring fills **empty days only**; Edit/Delete stay | **PASS** | Rematerialize leaves any existing row alone. Rate change does not rewrite past `recurring` amounts. Delete writes a `$0` `manual` tombstone (`spend-recurring.server.ts` + `spend-recurring.test.ts`). Preview copy matches. |
| Returning / new $ shares never a fake 0% | **PASS** | Shares only when `customerMetricsAvailable` and identified split > 0; else `null` → **—** (`shopify-native-stats.ts` + tests). |
| LTV / Growth first-on-file is not lifetime first | **PASS** | `computeCohortRollups` skips buyers whose lifetime `numberOfOrders` > in-window orders. First year stays **—** when `historyLimited` (`order-facts.server.ts`, `till-ltv.server.ts` + tests). Chrome says first on file / this window. |
| Shop currency on painted dollars | **PASS** when `Shop.currencyCode` is a valid ISO | `formatCurrency(amount, currency)` requires the code (`mer-format.ts` + `mer-format.test.ts` CAD ≠ USD). `DeskCurrencyContext` wraps the desk. Residual: unknown code still → USD (see §6). |

**demcflyads UNKNOWN (Wave 4 founder checks, still not this run):** Live Goals month older than ~60 days is **—**, not `$0`. Overview “This year” is not a finished $0 year. Recurring rate change keeps earlier auto-filled amounts; delete stays empty. Customers % matches Shopify first-time vs returning **sales** for the same window. LTV does not mint a new first-year dollar for a known returning buyer. Non-USD shops: every `$` wears that ISO.

---

### 4. Empty vs zero vs missing (leftovers after Wave 4)

| Case | Verdict | Evidence |
| --- | --- | --- |
| Pending sales ≠ $0 | **PASS** | Overview / book / Goals pending copy still say “still loading — not $0.” |
| Empty spend ≠ 0× ROAS | **PASS** | Core + Overview + Total ROAS × + CPA. |
| Empty spend **Spend KPI** | **FAIL** | Total ROAS Spend tile always `formatCurrency(metrics.totalSpend)` → `$0` while ROAS is **—** (`app.roas.tsx`). Allocation `PeriodSnapshotSection` always paints Spend `$0` **above** the honest empty state (`app.allocation.tsx` — empty copy says “Empty spend is not a made-up mix,” then the snap writes `$0`). |
| Spend ledger copy vs Wave 4 empty≠zero | **FAIL** (copy) | Spend + import: “Days with no row are $0” / “Empty spend is $0” (`app.spend.tsx`, `app.spend.import.tsx`). After Wave 4 tombstones, an **empty** day is a correction; a **missing** day before the first typed day is unknown. The strings collapse those. Tests currently lock the `$0` wording (`easy-add-spend-tab.test.ts`). |
| CPA empty | **PASS** | `hasSpend && … : "—"` (`cpa-page.test.ts`). |
| YoY last year empty | **PASS** | Prior missing → null / “No last-year days” (`overview-yoy.ts`, `CertifiedScoreboard.tsx`). Overview cards paint last year **—** when `missingPrior`. |
| Partial fact load, sales > 0 | **PASS** (disclosed understatement) | `salesCoverageIncomplete` shows the real ratio and withholds break-even advice (`sales-pending.ts`). Not a fake 0×. Residual: first-session thinness (see §C). |
| True $0 sales day older than ~60 days | **UNKNOWN** (by design) | `isCertifiedSalesDayFact` drops old `$0` without `read_all_orders`. Conservative, not inflated. |

**demcflyads UNKNOWN:** Live, $0 typed spend. Open **Total ROAS** — does Spend read `$0` or —? Open **Channel Allocation** — does the period snap show Spend `$0` above “add spend”? Open **Spend Upload** before any day — does the strip say empty is `$0`?

---

### 5. Shopify-sourced fields

| Field | Verdict | Evidence |
| --- | --- | --- |
| Numerator = Shopify Total Sales (returns included) unless Net is chosen | **PASS** | `shopify-sales.server.ts` + `actionSalesForBasis` (`sales-basis.ts`). Net falls back to Total and flags `netBasisUnavailable`. |
| Prior-period MER / sales **delta** uses the same basis as the hero | **FAIL** | Hero ROAS uses `action.sales` (Total or Net). Prior is always `{ totalSales: priorFacts.totalSales }` and `computeMer(options.priorSales.totalSales, priorSpend)` (`app._index.tsx`, `mer-dashboard.server.ts`). A Net-basis merchant can read a delta that compares **Net ÷ spend** to **Total ÷ spend**. |
| Timezone / day keys | **PASS** | Shop IANA for sales; documented UTC spend stamp. |
| `numberOfOrders` / first-on-file | **PASS** | Wave 4 persist + skip. |
| `sourceName` (Online / POS / Shop) | **PASS** (Orders mix) | Still Shopify `source_name`, not extra connectors. |
| Shop currency | **PASS** when set / **FAIL** when missing | `shopCurrencyCode` comment: “Unknown / empty → USD” (`spend-money.ts` + `spend-money.test.ts` “falls back to USD”). Wave 4 required the argument; it did not kill the silent default. |

**demcflyads UNKNOWN:** Settings → sales basis **Net** (if the shop has a known subtotal). Compare Overview / Total ROAS vs-prior delta to the hero numerator. If the shop is USD, currency fallback is invisible — do not stamp PASS for CAD.

---

### 6. Recovery UX / spend doors

| Check | Verdict | Evidence |
| --- | --- | --- |
| Document 410 → `/auth/opening` (200 + App Bridge) | **PASS** | `shopify.server.ts` `authenticateAdminWithoutDocumentGone`; `auth.opening.tsx`. |
| `.data` 410 rewritten (no turbo-stream “Handling response”) | **PASS** | Data-request 410 → `data(SESSION_RECOVERY_DATA, { status: 403 })`. `decorateShopifyBoundaryError` replaces empty / “Handling response” (`merchant-error-recovery.ts` + tests). |
| `/app` + Spend public/gone gate | **PASS** | `app.tsx` public stub; Spend + import use `requireAdmin` (`public-app-gate.server.ts` + tests). |
| Book-page `DeskRouteErrorBoundary` | **PASS** (partial) | Customers · Growth · Orders · LTV · YoY · CPA · Goals · Spend (`merchant-error-recovery.test.ts` list). |
| Same gate + page boundary on Total ROAS / Allocation / Settings / Overview | **FAIL** | Loaders call `authenticate.admin` only (`app.roas.tsx`, `app.allocation.tsx`, `app.settings.tsx`, `app._index.tsx`). No page-level `DeskRouteErrorBoundary`. Retry from shell is always `/app`. Friend-demo path after typing a day is **Total ROAS**. |
| Goals / YoY / LTV `requireAdmin` | **FAIL** (gate only) | They have the page boundary, but a bare deep-link can still hit `authenticate.admin` without the public redirect Spend already has. |
| Spend first fold = yesterday; Continue default; Edit does not start a rate | **PASS** | Wave 3 locks still in `app.spend.tsx`, `spend-continue-daily.ts`. |
| Typed one-day → Live ROAS without CSV | **PASS** | First door = Add a day (`spend-doors.ts`). Success banner → `/app/roas`. No OAuth / pixel on Spend. Connections route retired → Spend. |
| Import surface still says CSV is first | **FAIL** | `SPEND_IMPORT_DOORS[0].hint` = “Fill daily spend… **Start here.**” (`spend-doors.ts`). Main Spend hides Backfill after yesterday; `/app/spend/import` re-promotes the template. |

**demcflyads UNKNOWN:** From Shopify Admin, open Mcfly → **Total ROAS** (and Allocation, Settings) after the session token is stale / in a new tab with `?shop=demcflyads.myshopify.com`. Confirm recovery is Retry / Open Shopify Admin — never raw 410 HTML or “Handling response.” Then Live: type yesterday one channel $40 → Total ROAS moves. Do **not** treat SAMPLE Harbor as that proof.

---

## Verdict register

| ID | Finding | Verdict |
| --- | --- | --- |
| A1 | Total ROAS = sales ÷ spend; empty spend → no 0× | **PASS** |
| A2 | SAMPLE spend excluded from Live ROAS | **PASS** |
| A3–A8 | Wave 4 seals (unseen days, Goals —, fill-empty, no fake 0%, first-on-file, currency argument) | **PASS** (code + tests) |
| A9 | Harbor desk dollars vs site `$23,414` / `3.51×` | **UNKNOWN** — SAMPLE ÷ check |
| B1 | Empty-spend Spend KPI `$0` on Total ROAS / Allocation | **FAIL** |
| B2 | Spend copy “empty / missing day = $0” | **FAIL** vs Wave 4 empty≠zero |
| B3 | Prior MER / sales delta ignores Net basis | **FAIL** |
| B4 | `shopCurrencyCode` silent USD fallback | **FAIL** (latent on USD shops) |
| C1 | 410 / Handling response on `/app` + Spend + `.data` | **PASS** |
| C2 | `requireAdmin` + page boundary on ROAS / Allocation / Settings / Overview | **FAIL** |
| C3 | Typed one-day spend door (no CSV, no ads OAuth) | **PASS** |
| C4 | Import “Start here” vs typed-first | **FAIL** |
| D1 | First-session Shopify five from `read_orders` + `read_customers` | **FAIL** (ingest timid after OAuth) |
| D2 | Live demcflyads accuracy vs Admin Analytics | **UNKNOWN** — no Admin numbers this run |

---

## Top remaining uninstall risks (after Wave 4)

Honesty first, then session, then first-experience completeness.

1. **A merchant believes they have $0 spend on file** because Total ROAS / Allocation paint `$0` next to an honest **—** ROAS. Wave 4 taught “missing ≠ $0” on sales; spend tiles did not get the same seal.
2. **Deep-link / stale-token 410 on the spend-handoff pages** (Total ROAS, Allocation, Settings). Friend-demo bar is install → SAMPLE honest → type one day → Live ROAS. A “Handling response” *after* they typed is worse than a blank first open.
3. **Shopify five still thin on first Admin open.** OAuth already kicks a bounded backfill (`auth.$.tsx` uses default 20 sales days / 7 order days). Every later Overview / book load only resumes `maxDays: 2`. Customers / Growth / LTV can look empty-as-broken until many clicks — Sidekick-class “no sales” distrust, even though banners say “not $0.”
4. **Net-basis prior delta that is not the hero’s sales.** “Numbers don’t match” on the compare chip.
5. **Import “Start here”** sends a merchant to CSV after Wave 3 made yesterday the first fold.
6. **Silent USD** on the first non-USD install (latent on demcflyads).

---

## Shopify-API first-experience completeness (no CSV)

Already in scopes (`shopify.app.toml`): **`read_orders,read_customers`**. Webhooks already dirty SalesDayFact (`orders/create|updated|cancelled`). Shop timezone + currency already on `Shop`. Billing subscriptions already via Billing API + webhook.

| Available now | First-experience gap |
| --- | --- |
| `read_orders` Total Sales / gross / net / returns | YTD / book stay honest (Wave 4). **Gap:** post-OAuth desk kicks only **2 days** per Overview/book load, so the public-app ~60-day window is not on file at first useful paint. |
| `read_customers` + `numberOfOrders` | Wave 4 uses this to refuse a fake LTV first-order. **Gap:** OrderFact default after OAuth is **7 days**; Customers / Growth / LTV wait on the same 2-day resume. |
| Shop IANA + `currencyCode` | Timezone used; currency painted when valid. **Gap:** unknown → USD. |
| Orders webhooks | Closed-day refresh after first session. **Do not** treat webhooks as the first-open backfill. |

**Shopify-approved API that would need a new scope (research only — not Wave 5 implement):** [`MarketingActivity.adSpend`](https://shopify.dev/docs/api/admin-graphql/latest/objects/MarketingActivity) requires [`read_marketing_events`](https://shopify.dev/docs/api/usage/access-scopes). That is a merchant re-auth, not a CSV. **UNKNOWN** whether demcflyads (or a typical first install) has any activities with `adSpend` filled — many shops will be empty. Do not add the scope to “complete” spend; typed one-day remains the door.

**Do not add for Wave 5:** `read_all_orders`, `read_reports` / ShopifyQL, `read_customer_events` / pixels, Meta/Google OAuth, Klaviyo, CSV redesign.

---

## Competitive / Shopify best-practice research (2026-09-16)

Public sources only. No invented competitor metrics, install counts, or Mcfly reviews.

### What Shopify asks of an embedded first session

- **App Store requirement 1.1.1 — session tokens.** Embedded apps must work without third-party cookies or local storage (incognito included). [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements). Mcfly already rewrites document 410 → `/auth/opening` and `.data` 410 → recoverable 403. Wave 5 leftover is **parity on the pages the friend-demo actually opens after spend**.
- **ID tokens, not cookies.** App Bridge issues a ~1-minute ID token; the app exchanges it — never sends it to Admin GraphQL. [ID tokens](https://shopify.dev/docs/apps/build/authentication-authorization/id-tokens). A stale token is a session reopen, not “Gone.”
- **Built for Shopify 3.1 — stay in Admin.** Embed with latest App Bridge; **primary workflows inside Shopify Admin**; **seamless signup from Shopify credentials** (no second login). [BFS requirements](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements). Typed spend + Shopify five match this. Ad-account OAuth / pixel onboarding is the pattern Shopify’s own BFS text is warning against (external primary workflow).
- **BFS 4.2.2 / 4.2.3 — helpful onboarding + homepage metrics.** Homepage must show whether the app is working and expose **obvious metrics** — a static welcome after dismissals fails. [BFS 4.2.3](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements). Mcfly’s Overview YoY cards are the homepage metrics; they fail the spirit of this if they are still “loading — not $0” after the merchant has been sitting in Admin with `read_orders` already granted.
- **App Home empty state:** say *why* it’s empty and offer **one** primary next action. [Empty state composition](https://shopify.dev/docs/api/app-home/patterns/compositions/empty-state). Empty spend should point at **Add a day**, not a `$0` tile and not “Start here” on CSV.

BFS 1.2.2 (five reviews) / 1.2.1 (50 net installs) stay **founder-only**. Reviews remain **0**. Do not invent stamps.

### What competitors punish on day one (steal the complaint, not the stack)

- **Triple Whale onboarding** is shop → **pixel** → **ad-platform OAuth** → UTMs. Vendor: [Onboarding guide](https://kb.triplewhale.com/en/articles/5677051-onboarding-guide-account-setup), [Meta Ads integration](https://kb.triplewhale.com/en/articles/9507673-meta-ads-integration). Mcfly analog if we imply “connect ads / upload CSV to be useful.”
- **Polar** vendor docs: numbers often **won’t match Shopify Home**; first sync can take hours. [Discrepancy guide](https://intercom.help/polar-app/en/articles/6728881-troubleshooting-data-discrepancies-between-shopify-and-polar). Mcfly analog: a second book, or a first open that looks like “no sales.”
- **Northbeam** vendor: “Northbeam and Shopify reports will rarely match exactly, and that’s expected.” Default revenue does not deduct refunds the way Shopify Total Sales does. [Why doesn’t Northbeam match](https://docs.northbeam.io/docs/why-doesnt-northbeam-match-my-shopify-reporting). Mcfly religion stays **match Shopify Total Sales**.
- **Native Analytics** already answers this period’s sales. Public apps still only see **~60 days** of orders unless `read_all_orders` is approved. [Access scopes](https://shopify.dev/docs/api/usage/access-scopes). Wave 4 honesty stays; Wave 5 does not promise a year.

Older complaint map (ratings dated **2026-09-15**, not re-counted this run): `docs/ops/research/2026-09-15-competitor-uninstall-signals.md`, `docs/ops/research/2026-09-15-shopify-analytics-gaps.md`.

### Actionable on this desk (after the number is honest)

- Finish **embedded session recovery** on the spend-handoff routes (App Store 1.1.1 / friend-demo).
- Make **App Home + Shopify five complete from already-granted APIs** before any upload friction (BFS homepage metrics + empty-state “one next action”).
- Keep empty spend as **— / add a day**, never a certified `$0` cockpit (Polar/TW “broken until connected”).
- Do **not** add `read_marketing_events` or pixels to skip typing yesterday.

---

## Ranked Wave 5 implement list (≤6)

Honesty leftovers first. Recovery and Shopify-API completeness next. No line-by-line edits — outcomes and acceptance checks only.

### 1. Empty spend never looks like certified $0 (Total ROAS, Allocation, Spend copy)

**Outcome:** When no typed/uploaded spend is on file for the window, Spend dollars paint **—** (or “no spend entered”), matching ROAS **—** and CPA. Allocation’s period snap agrees with its empty state. Spend ledger copy distinguishes **missing** (unknown) from a **deleted / $0 correction** (Wave 4 tombstone). Recurring fill-empty behavior does not change.

**Why uninstall / EV:** Kill-risk #0 leftover. Wave 4 taught merchants that missing sales are not `$0`. A `$0` Spend tile next to honest **—** ROAS reads as “I have $0 ads on file.” Same Polar/TW “the number is not Shopify’s / the app is empty-as-zero” engine, on the spend side.

**Verify:** Tests: `totalSpend <= 0` → Spend KPI / Allocation snap are dash or omitted, not `formatCurrency(0)`. Spend empty-state copy no longer claims “Empty spend is $0” for a desk with no rows. Existing 0× guards stay green. **demcflyads:** §4 UNKNOWN.

### 2. Session recovery parity on the spend-handoff pages

**Outcome:** Total ROAS, Channel Allocation, Settings, and Overview (plus any leftover `authenticate.admin`-only analysis route a friend can deep-link) use the same public/gone gate Spend already has, and a page-level recovery whose Retry returns **that tab**. Merchant-visible copy stays Retry / Open Shopify Admin. No raw 410 HTML, no “Handling response.”

**Why uninstall / EV:** Friend-demo bar after one typed day is Live ROAS. Wave 3 fixed `/app` + Spend; the handoff page can still bubble to the shell. Shopify App Store 1.1.1 / ID-token hygiene: a stale token is a reopen, not Gone.

**Verify:** Tests extend the book-page / `requireAdmin` lists to ROAS, Allocation, Settings (and Overview if it stays a child loader). **demcflyads:** §6 UNKNOWN (stale token / `?shop=` deep-link on `/app/roas`).

### 3. First Admin open completes the public-app Shopify window from APIs already granted

**Outcome:** After install / OAuth / first embedded Overview, closed days inside the public-app `read_orders` window (~60 days) are on SalesDayFact **or** the desk stays **pending / —**, never a sealed thin book. OrderFact for Customers / Growth / Orders / LTV reaches the same window without the merchant clicking through dozens of 2-day resumes. No new scopes. No CSV. `read_all_orders` stays refused. Web Vitals / request-time budget still matter — burst work must not block OAuth or first paint.

**Why uninstall / EV:** BFS homepage must show working metrics; native Sidekick 1-stars are “it said we had no sales.” Shopify five are the $0-spend moat. The APIs are already approved; ingest is timid (`auth.$.tsx` defaults vs later `maxDays: 2` on `app._index.tsx` / `desk-sales-page.server.ts`).

**Verify:** Tests: a first-open / post-auth path that is allowed to request more than two missing closed days (or an equivalent resume) fills or remains pending — never upserts unseen `$0`. Existing unseen-day / pending tests stay green. **demcflyads Live (not SAMPLE):** immediately after a hard refresh, Overview This month / Customers / LTV either show the shop’s recent Shopify window or “still loading — not $0,” and a second refresh shortly after is materially more complete — not still two days.

### 4. Prior-period deltas use the same sales basis as the hero

**Outcome:** When Settings sales basis is Net, vs-prior sales $ and prior MER use Net (or withhold the delta when Net is unavailable). Total-basis shops unchanged. Never compare Net ÷ spend to Total ÷ spend.

**Why uninstall / EV:** “Doesn’t match Shopify” on the compare chip — the attribution-suite uninstall engine, on our own basis toggle.

**Verify:** Tests: Net hero + known prior net → delta/MER use net; unknown net → no fake prior improvement. **demcflyads:** §5 UNKNOWN (Net toggle).

### 5. Spend doors stay typed-first; import is not “Start here”

**Outcome:** `/app/spend/import` (and any import door copy) treats template/CSV/bill as **backfill after yesterday’s amount**, matching main Spend. One-day type + optional Continue $X/day remain the first-session door. No ads OAuth, no pixel, no new connector.

**Why uninstall / EV:** Wave 3 made yesterday the first fold so a friend can reach Live ROAS without a CSV. Import “Start here.” reintroduces upload friction Shopify’s empty-state guidance says to avoid.

**Verify:** Tests: import door hints no longer claim the template is the start; main Spend first fold stays `#mcfly-spend-add` / yesterday. **demcflyads:** land on Spend Upload — first fold is yesterday; Backfill is secondary. Only then open import if needed.

### 6. Unknown shop currency is not silent USD (only after 1–5)

**Outcome:** Missing/invalid `Shop.currencyCode` does not format as USD. Paint **—** / “currency unknown,” or refuse to mint `$` until `ensureShop` has a real ISO. Valid CAD/USD/etc. unchanged.

**Why uninstall / EV:** A CAD shop reading USD `$` is a number mistake. Latent on USD-only demcflyads; kill on the first non-USD install. Wave 4 required the argument; the helper still defaults.

**Verify:** Tests: null/empty/bogus code ≠ USD-looking `$1,200`. Passing `CAD` still differs from `USD`. **demcflyads:** USD shop — no regression. Non-USD remains UNKNOWN until a real shop exists.

---

## Out of scope (do not put in Wave 5)

- App Store listing screenshots, listing paste, Partner Submit  
- Ads, inventing smoke / reviews / install counts / metrics  
- CSV / Ads Manager upload friction as the product, template redesign, Spend explorer on Overview  
- `read_all_orders`, `read_reports` / ShopifyQL, `read_marketing_events` as the shipped spend door  
- Pixels, Meta/Google OAuth, Klaviyo, P&L, AI analyst, 12th tab  
- Re-opening Wave 4 seals (SalesDayFact, Goals dashes, fill-empty recurring, 0% shares, first-on-file) unless a regression forces a touch  
- TAB_LOCK Overview “three YoY cards only” craft diet (Overview already omits ROAS at $0 spend)  
- `SampleDeskBanner` no-op hygiene  
- Polaris restyle, Fly deploy, `main`, PR #19, `suite/`, `.env`  
- Namecheap MX / `support@`  
- BFS review/install thresholds (founder-only)

---

## Suggested Wave 5 verify note (human, after implement)

Not this run. When an implement lane ships 1–3: one **Live** pass on demcflyads — Total ROAS Spend tile at $0 typed spend; Allocation snap vs empty copy; stale-token `/app/roas`; first-refresh Shopify five vs a second refresh. SAMPLE Harbor ÷ check from §1 UNKNOWN. Recurring delete+rate is a **Wave 4** check — only re-run if #1 touches Spend copy. No invented PASS.

---

## What Waves 1–4 already closed (do not re-file as Wave 5 product)

- Overview blank Total ROAS / Ad spend wall at $0 spend  
- SAMPLE spend labeled example-only; `guide=real` Live handoff  
- LTV First year **—** when `historyLimited`; first-on-file ≠ lifetime first  
- Book-page 60-day / truncated banners on Customers · Growth · Orders  
- Goals pending/error copy **and** year-board Actual/Prior/YTD **—** when missing  
- SalesDayFact unseen days never stored/served as $0  
- Recurring fill empty only; Edit/Delete stay; `$0` tombstone  
- Returning/new $ shares never a fake 0%  
- Shop currency argument on painted dollars (USD fallback leftover = Wave 5 #6)  
- 410 → recovery on `/app` + Spend; book `DeskRouteErrorBoundary`  
- Spend first fold = yesterday; Continue $X/day default; Edit does not start a rate  
