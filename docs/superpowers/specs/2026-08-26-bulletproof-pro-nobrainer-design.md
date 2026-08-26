# Bulletproof first-session + Pro no-brainer — design spec

**Date:** 2026-08-26  
**Status:** Active — Wave A executes on `cursor/bulletproof-desk-plan-2ae5`  
**Product SoT:** [`STRATEGY.md`](../../../STRATEGY.md)  
**Companion plan:** [`docs/superpowers/plans/2026-08-26-bulletproof-pro-nobrainer.md`](../plans/2026-08-26-bulletproof-pro-nobrainer.md)

## Problem

Mcfly only wins if a merchant can (1) put real spend next to Shopify sales in the first session without silent wrong numbers, (2) understand Pro as LTV + year Goals at $39 flat, and (3) not bounce after they pay because LTV looks empty. Prior fleets shipped walkthroughs, examples, and Pro teasers. Three critic passes plus a deeper code audit still found **trust-breakers that uninstall after the first upload or the first Pro charge**.

This spec is the complete issue inventory, the jobs we will not chase, the hunt method for finding the next layer of issues, and the wave order so each slice ships testable software.

## Jobs we ship vs jobs we never chase

| Hire | Ship | Never |
| --- | --- | --- |
| All money out next to Shopify sales | CSV / paste / typed extras including billboards; Total ROAS = sales ÷ spend you added | Pixels, MTA, “true ROAS,” Ads Manager OAuth |
| Payback Shopify Analytics lacks | Opaque-id cohorts + Cash CAC + progress while ingesting | Email CRM, Level 2 PII |
| Year spend ceilings | Full Goals board on Pro; type sales → max spend / month | Predictive / channel LTV, SKU COGS P&L |
| Flat fee vs GMV tax | In-app $39 store fee; uninstall/Free stops next cycle | Changing Partner price; GMV ladders |
| Spreadsheet MER incumbent | Easy daily CSV + honest formula | Warehouse BI, incrementality, MMM |

Incumbent is **the spreadsheet**, not Triple Whale. Shopify Analytics leaves Meta/Google cost blank ([Shopify community thread](https://community.shopify.com/t/profit-ad-spend-tracking-on-shopify-whats-actually-broken-for-you/646399)). Platform ROAS will not match Shopify books ([Polar](https://www.polaranalytics.com/post/why-your-shopify-roas-never-matches-across-tools-and-how-to-fix-it); [Saurav 2026](https://www.sauravdoesmarketing.com/post/shopify-vs-meta-ads-manager-vs-ga4-why-your-numbers-never-match-and-which-one-to-trust-2026)). Mcfly’s honest number is MER / Total ROAS from **typed spend + Shopify sales**, on purpose.

App Store first session: reviewers and merchants judge the **clean-install empty desk**, not the Practice demo ([AppNatively 2026](https://appnatively.com/blog/how-to-fix-app-store-submission-errors); [eSEOspace QA](https://eseospace.com/blog/shopify-app-testing-qa-checklist/)).

## Constraints (verbatim for implementers)

- App URL stays `https://mcfly-analytics.fly.dev`. Never mcflyads.com as App URL.
- Listing paste (short/long/features/captions) must **not** include `$` / `$39`.
- Upgrade leaves the embed (`_top`). Never load `admin.shopify.com` in the iframe (2.1.1). Nested Upgrade stays **outside** the Add spend `<Form>`.
- No pixels, MTA, true ROAS, anti-pixel sermons, competitor name-calling in merchant chrome.
- PCD Level 1 only. Free = all `SPEND_CHANNELS` + typed extras. Pro = live LTV + full Goals only.
- In-app: **Practice | Your store**. Partner testing paste may still say `SAMPLE desk OFF`.
- Do not click Partner Submit. Do not edit Partner Dashboard listing fields.
- Imports at top of files. Exhaustive `switch` uses `never`.
- Standing Fly grant: after `SKIP_HEALTH=1 bash scripts/agent-ship-gate.sh` PASS, `fly deploy -a mcfly-analytics --yes`.
- Parallel implementer agents must **not** share this worktree.

## Hunt method (how we go deeper than one critic pass)

Do not treat any inventory as complete. Every wave ends by running this loop and appending new rows to the plan’s “Later findings” table.

1. **Parser corpus** — native Meta / Google / TikTok / Microsoft / EU Excel (`;` + `12,50` + `13/01`) + Account-name dumps + lifetime date-span rows. Fail-closed > silent Other.
2. **Empty-shop walk** — new Shop row, Practice OFF, no spend, no margin confirm, no OrderFacts. Screenshot-quality copy on Overview, Spend, Goals, LTV, Allocation, Advanced, Settings.
3. **Post-Pro walk** — `proBillingActive` true, 0 CohortFacts, `OrderBackfillState` missing or `historyLimited: true` default. LTV must not say “Free shows…” or look like $0 LTV.
4. **Dead-intent grep** — `intent ===` in routes vs `<Form>` / `name="intent"` in UI. Orphans are honesty bugs.
5. **Clock grep** — every default window (`14d`, `90d`, `mtd`, `lm`, `l12m`) must have a merchant-visible label on the same surface.
6. **Copy-lock tests** — `desk-sample-ux`, `fly-trust-pages`, `app-store-resubmit`, `easy-add-spend-tab`, `desk-honesty-labels`, `site-go-live`, `ltv-sales-spine`. Changing copy **updates the test in the same commit**.
7. **Marketing vs entitlements diff** — homepage / support / pricing vs `entitlements.ts` (Goals Pro, LTV Pro, Email Overview Free, all channels Free).
8. **Currency / TZ / guests** — `formatCurrency` default USD; cohort month from UTC `orderedAt`; `guestOrders: 0` on desk spine.
9. **GDPR / uninstall** — `webhooks.compliance.tsx` + `webhooks.app.uninstalled.tsx` still ACK and erase; no theme leftovers (we inject none).
10. **Billing decline / cancel** — Upgrade `_top`; Settings honesty; no iframe charge.

## Issue inventory (2026-08-26)

Evidence from live code (file:line) plus prior critic passes. Severity is **uninstall / no-upgrade / wrong number** first.

### P0 — wrong number or empty after they paid

| ID | Finding | Evidence | Fix |
| --- | --- | --- | --- |
| P0.1 | `Account` / `Network` / `source` / `medium` treated as **channel** columns → native Ads Manager dumps silently land in **Other** | `HEADER_SYNONYMS.channel` in `app/app/lib/spend-csv.ts` (~149); long-format wins when channel+amount exist (~1520–1522) | Channel synonyms = `channel`, `platform` only. Account-name files become date+amount → `needsForceChannel`. |
| P0.2 | Range export (Reporting starts ≠ ends, or `start - end` in one cell) writes **the whole amount on day 1** | `parseForcedChannelSpendCsv` uses `dateCol` only (`spend-csv.ts` ~1361–1408); `parseSpendDate` accepts a single day | Refuse with “export Day breakdown or Divide a bill.” Never write. |
| P0.3 | Force-channel UI + server allowlist are **Meta/Google only**; TikTok/Microsoft/etc. native CSV hard-fails | `app.spend.tsx` ~626–630, ~1064, ~1437–1463 | Parse any `SPEND_CHANNELS` member; picker lists all advertised platforms; submit hidden field **synchronously** (no `setTimeout(0)`). |
| P0.4 | Empty LTV prefers `history_limited` because `OrderBackfillState.historyLimited` **defaults true** and `getOrderBackfillHistoryLimited` uses `?? true` | `order-facts.server.ts` ~302, ~666; `till-ltv.server.ts` ~210–211; copy in `app.ltv.tsx` ~582–583 still says “Free shows the available window” | Empty + no cohorts → `backfilling`. `history_limited` only after Shopify ACCESS_DENIED **and** the limited window is fully crawled. Drop “Free shows…”. Default `historyLimited` false on create. |
| P0.5 | After $39, ingest is **≤2 closed days per paint** with **no progress** (days done / remaining) | `app.ltv.tsx` ~64; `app._index.tsx` ~223; Overview promises “open LTV for progress” (~1092) but LTV is a static line | Kick LTV backfill with default `maxDays` (7); surface `getOrderBackfillProgress`; keep “Orders still syncing — not $0 LTV”. |
| P0.6 | Overview scoreboard default **MTD** vs explorer default **14d** (Spend explorer **90d**) | `app._index.tsx` ~111–112; `app.spend.tsx` ~327–328; `PeriodControl` labels `LM` / `L12M` | When `exRange` unset on Overview, tie chart to scoreboard period. Spell out Last month / Last 12 months. Caption if chart uses closed days through yesterday. |

### P1 — friction, honesty gaps, marketing mismatch

| ID | Finding | Fix |
| --- | --- | --- |
| P1.1 | EU `;` CSV → “Missing Day/date column” | Detect `;` / tab delimiter; parse or name the delimiter in the error. |
| P1.2 | EU `12,50` fail-closed as “unreadable amount” | Keep fail-closed; error must say use `12.50` / US thousands. |
| P1.3 | Ambiguous `05/06/2026` parsed as US | Wave C: fail-closed asking for YYYY-MM-DD. Wave A: keep US MM/DD (Ads Manager ISO still works). |
| P1.4 | `declare-recon` action has **no form**; recon banners only on drift | Wave C: Spend “Declare Ads Manager total for this period” **or** delete intent + soften Advanced copy. |
| P1.5 | `csv-combine` / `buildSheetsImportGuide` UI-dead | Wave C: delete merchant-facing remnants **or** restore one combine control. Do not advertise Combine until UI exists. |
| P1.6 | Contribution LTV uses Prisma default **35%** while `marginConfirmedAt` is null | Label “default 35% until you confirm in Settings” when unconfirmed. Do not invent a confirmed margin. |
| P1.7 | Homepage “03 Goals + Email” reads Free; only “04 LTV (Pro)” is badged | Wave B: Email Overview Free; year Goals Pro. |
| P1.8 | Dual brand **Mcfly Ads** vs **Mcfly Analytics**; Sample vs Practice on `/` `/demo` | Wave B: product pages = Mcfly Analytics + Practice. Leave Custom Data Solutions (MDS) pages as the agency line. |
| P1.9 | Grow 10% YoY enabled when prior year sales = 0 | Wave D: disable + no success toast on zeros. |
| P1.10 | `formatCurrency` always USD | Wave D: thread `shop.currencyCode`. |
| P1.11 | Cohort month from UTC `orderedAt` | Wave D: shop-local first-order date. |
| P1.12 | Goals `parseGoalsYear` without `deskTz` | Wave D: pass shop IANA. |
| P1.13 | Free Overview still fires OrderFact backfill | Gate Overview `runOrderFactsBackfill` on `canUseLtv`. |
| P1.14 | Practice ON blocks the first real CSV | Keep block; primary CTA remains Switch to Your store (already). |
| P1.15 | Advanced jargon before first spend | First line: optional; add spend first. Do **not** hide tabs on `cashReady` (`desk-honesty-labels.test.ts`). |
| P1.16 | Install CTAs → `/support` not App Store | Keep until listing URL is a live `apps.shopify.com` page (do not invent a 404). |

### P2 — dead chrome, test holes, polish

| ID | Finding | Fix |
| --- | --- | --- |
| P2.1 | `SampleDeskBanner` returns `null` | Wave C: delete component + unused notes **or** restore. |
| P2.2 | Template loader still has Free Meta+Google branches while `canUseAllChannels` is always true | Simplify in Wave C. |
| P2.3 | Silent skip of totals/zeros with no “skipped N rows” | Success summary in Wave C. |
| P2.4 | Privacy “Level-1 package” buried in Settings `<details>` | Wave E: one sentence on Settings without jargon. |
| P2.5 | Support two inboxes; Fly vs site order mismatch | Wave B: Gmail first everywhere until DNS; one sentence. |
| P2.6 | Share / Email Overview tertiary on Overview | Wave E: keep Email label; add “Email this overview”. |
| P2.7 | `trialDays: 0`; Practice already shows Pro UI | Do **not** add a Shopify trial without founder ask. Practice remains the preview. |
| P2.8 | Pro teaser CAC uses desk `newCustomers: 0` | Wave D: align Free preview with till new-buyer path or honest “needs spend + Pro ingest”. |
| P2.9 | Today live cap / guest orders never shown | Wave D: disclose closed-days + guests excluded from cohorts. |
| P2.10 | Force-channel auto-resubmit via `setTimeout` + `s-button` click | Folded into P0.3. |

## Out of scope (explicit)

- Partner Submit, Partner listing field edits, invented App Store URL.
- Pixels, CAPI, MTA, TrueProfit COGS, Triple Whale clone, SKU P&L.
- Raising or lowering the $39 Partner price.
- Hiding channels behind Pro.
- Gating nav on `cashReady`.
- `parallel-cli research` (CLI present, **not authenticated** this environment).

## Architecture

Keep the embedded React Router 7 desk. Fixes stay in existing modules:

- Parser honesty → `spend-csv.ts` (pure) + Spend route allowlist/UI.
- LTV empty honesty → `till-ltv.server.ts` + `order-facts.server.ts` + LTV/Overview copy.
- One clock → Overview loader + `PeriodControl` + `spend-explorer.ts`.
- Marketing mismatch → `site/index.html`, `site/support.html`, `site/demo.html`, Fly `support.tsx` — not Partner UI.

Each wave is a shippable PR slice: failing tests first, then code, then ship-gate.

## Success

- Native Meta `Day,Account name,Amount spent` does **not** write Other; it asks which platform.
- Monthly range CSV does **not** spike one day.
- TikTok Day+Cost can be forced to TikTok without a Combine UI.
- New Pro shop with 0 cohorts sees syncing + progress, never “Free shows…” and never $0 LTV.
- Overview chart window matches the scoreboard period until the merchant picks a chart range.
- Product marketing says Mcfly Analytics, Practice, and Goals-as-Pro.
- Ship-gate green; Fly health `{"ok":true,"db":"up"}`.
