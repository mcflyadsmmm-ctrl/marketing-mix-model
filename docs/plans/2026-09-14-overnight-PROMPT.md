# PASTE THIS into a Cursor Agent chat (or keep the Conductor that already started)

**Workspace:** `/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model`  
**Branch:** `cursor/spend-trust-recurring` (never `cursor/clean-revamp-v8`)  
**Marty is asleep.** Do not ask him questions. Do not write a research essay. Execute until the morning report. If this chat is summarized, re-read this file + `docs/ops/journal/OVERNIGHT_20260914.md` and continue the next unfinished tick.

You are **one overnight Conductor** for **Mcfly Analytics**. Product: Shopify embedded app. 7-day trial then **$39**/store/month. Listing: `https://apps.shopify.com/mcfly-analytics-public`. App URL: `https://mcfly-analytics.fly.dev`. Reviews: **0**. Do not invent reviews or install counts. Cursor does not Partner Submit.

---

## 0. Authority (board wins)

Read in this order, then **stop reading** and work:

1. `docs/LIVING_BOARD.md`
2. `docs/plans/2026-09-13-million-store-desk.md` ← building plan
3. **This file** ← overnight execution. Outranks older punch lists, save-the-desk-PROMPT, “omit sparse,” world-class-attack research.
4. `docs/ops/journal/OVERNIGHT_20260914.md` ← resume pointer

If an older file contradicts the million-store plan + this prompt, **this pair wins**.

---

## 1. Job (one sentence)

Finish the million-store desk so a $1M Shopify operator would **keep $39** after the first session: Overview is a sales scoreboard Shopify Analytics does not put on one screen; Marketing is the spend room after one typed day; leftover homework tabs are gone; Live Admin matches the repo.

**Done when Marty wakes:** ship-gate green, Fly deployed from this branch, Living Board stamped, morning report written. He does not re-prompt.

---

## 2. Already shipped in this working tree — DO NOT REVERT

Tick 1 is **done in repo, not Fly** (Live is still **v253**).

- Overview always paints Shopify Total Sales. Total ROAS sibling only when spend > 0. `hideHero` is gone.
- `CashControlBoard` is **not mounted** on Overview (`app._index.tsx` still **builds** `buildCashControlBoard` for window-rail chips only).
- `DESK_OVERVIEW_TABS = []`. `DeskOverviewTabs` is as-of + share only.
- `#mcfly-compare` `#mcfly-ledger` `#mcfly-mix` `#mcfly-plan` land on **Overview home** (App Store 2.1.1: no iframe throw). Do not restore those as Overview tabs.
- `DeskWindowRail.tsx`: Yesterday / Last 7 / This month / This quarter / This year. Empty spend cell is `—`, never `0.00×`.
- Glance: typical (median), returning **dollars**, second order, weekend, discounted, returns. Break-even under the ROAS pair.
- Chart: `SpendExplorer` `quiet`, **compare off**. `MonthlyPacing` still under the chart.

**Do not** remount `CashControlBoard` on Overview. **Do not** restore `hideHero`. **Do not** spawn another 22-row research table.

---

## 3. Hard locks (religion)

- Total ROAS = Shopify Total Sales ÷ **entered** spend. Empty spend is not `0.00×`. Closed days only. Unpaired spend days excluded from the ratio.
- Scopes: `read_orders` + opaque `read_customers` only. No email/name/address/SKU in GraphQL.
- Refuse: pixels, MTA, path/view-through, “true ROAS,” Triple Whale / Northbeam clones, connector zoo, in-app AI analyst, more sidebar items, copying Shopify sessions & conversion onto Overview.
- Sidebar stays: Overview · Orders · Buyers · Timing · Goals · Marketing · Settings.
- Voice: shop-owner English. Ban as **labels**: aMER, till, Monday, cohort, ARPU, MTD, QTD, YTD, L7, YoY. Code ids may stay `amer` / `mtd`.
- App URL stays `https://mcfly-analytics.fly.dev`. Never point App URL at mcflyads.com.
- **Do not git commit** unless Marty already asked in an earlier message in this same chat. **Do not git push.**
- **Do not** `wrangler pages deploy`. Site mega-ticks paused.
- Ads stay off.

---

## 4. Models (this Cursor account — do not invent slugs)

Task `model` **must** be one of:

| Role | Slug |
| --- | --- |
| Implementer / critic / architecture | `cursor-grok-4.6-xhigh` |
| Partner-paste English / listing | `gpt-5.6-sol-medium` |
| Cheap explore / test grep | `composer-2.5-fast` |
| Hard judgment if Grok stalls | `gpt-5.6-sol-medium` |
| Claude (optional, once) | `claude-opus-5-thinking-high` — if API limit, **do not retry Claude** |

**Banned:** `cursor-grok-4.5-high-fast` (not installed). `inherit` / Auto for craft specialists.

Topology per tick: parent + **1 Grok implementer** (exclusive files) + **1 Grok critic after the implementer lands** (not before — reviewing unwritten code is theater). No four-lane Site/Listing/Desk/Ops swarm. No Best-of-N site generators.

---

## 5. Work order (sequential — exclusive files)

Stamp `docs/ops/journal/OVERNIGHT_20260914.md` after **every** tick.

### Tick 2 — Marketing is the spend room

**Exclusive files (implementer owns):**

- `app/app/routes/app.spend.tsx`
- `app/app/components/MarketingSpendRoom.tsx` (**new**)
- `app/app/styles/mcfly-desk.css` (**append only**)
- `app/app/lib/easy-add-spend-tab.test.ts`
- `app/app/lib/marketing-spend-room.test.ts` (**new** — source-string + glossary bans)

**May import, do not rewrite:** `app/app/lib/mer-control.ts` (`mixRowsFromDays`, `compareMix`, `ledgerForGrain`, `buildCashControlBoard` / plan types).

**Do not touch:** `OverviewFirstViewport.tsx`, `DeskWindowRail.tsx`, `DeskOverviewTabs.tsx`, `desk-nav.ts`, `app._index.tsx`, `CashControlBoard.tsx`, `site/**`.

**Behavior:**

- Empty Marketing (Live, zero typed days, Sample off): **unchanged** — three doors + honesty. No 0×. No mix/plan/ledger tease.
- After **one typed day** of spend (or Sample on): below the existing period pair / explorer, mount `MarketingSpendRoom`:
  1. **Channels** — mix table. Absorb Compare as a **vs last month** column (and vs last year if data exists). Not a separate Overview view. Window chips: This month / Last 7 / Last 30 — labels in shop-owner English, never `MTD`/`L7`.
  2. **Plan** — daily-cap remaining-month table from `board.plan` when DualClose exists. Collapse if `cannotHit`. Email/SMS stay locked (existing `isEmailLockedChannel`).
  3. **Every day** — collapsed `<details>` ledger (day grain default) + existing CSV export. Not a fourth Overview tab.
- Copy craft from `CashControlBoard.tsx` mix/compare/plan/ledger blocks (~625–1130). Do **not** copy chips, dual-close theater, or Overview tabs.
- `app.spend.tsx` already has period pair + SpendExplorer. Do not duplicate the Overview window rail.
- Banned glossary in **new** files (test must lock): aMER, till, Monday, cohort, ARPU, MTD, QTD, YTD, L7, YoY.

**Tests:** rewrite `easy-add-spend-tab.test.ts` if source strings move; **do not delete** the empty-state three-doors lock. New `marketing-spend-room.test.ts` asserts: strangerEmpty path has no `<MarketingSpendRoom`; after spend the route contains it; glossary bans.

**Done:** `npx vitest run app/app/lib/easy-add-spend-tab.test.ts app/app/lib/marketing-spend-room.test.ts` green. SAMPLE Marketing after a spend day shows mix + vs-last-month without leaving the page.

### Tick 3 — Demolish leftover Overview lab + merchant aMER

**Exclusive files:**

- `app/app/components/CashControlBoard.tsx` — delete the file **only if** `rg 'CashControlBoard' app/app` shows zero route mounts. Keep `mer-control.ts` (math).
- `app/app/lib/mer-control.test.ts` — rewrite the **chrome** describes off `CashControlBoard.tsx` onto `MarketingSpendRoom.tsx`. Keep math tests.
- `app/app/lib/product-labels.ts` — merchant string `amer: "aMER"` → `amer: "New sales ÷ spend"` (code key `amer` stays).
- `app/app/lib/advanced-metrics.ts` + `advanced-metrics.test.ts` — tiles must not show the word `aMER` to merchants.
- Grep `app/app/components` + `app/app/routes` for `\baMER\b` in merchant chrome; rename labels only.
- `app/app/routes/app._index.tsx` — optional: if Tick 2 Marketing now builds its own board, stop shipping mix/plan/ledger on the Overview loader. **Keep** chip build for `DeskWindowRail`.
- `docs/PARTNER_TESTING_INSTRUCTIONS.md` — step 1: Overview is sales + depth cards, **no** Compare/Ledger/Channels/Plan subtabs. Step 5: after a spend day, **Marketing** shows mix / vs last month / plan / every-day table. Hashes `#mcfly-mix` etc. still open Overview without throwing.
- `docs/LIVING_BOARD.md` — Next line matches reality.

**Done:** `rg 'CashControlBoard' app/app/routes` empty. `rg 'aMER' app/app/components app/app/routes` empty (tests/docs may mention the old word as a ban). Partner paste has no Overview subtabs.

### Tick 4 — Density pass (only if 2+3 green and time remains)

Orders / Buyers / Timing already use `ShopifyBookSection` heroes + rows. **Do not** turn them into FAQs. If a page is still accordion-only, densify **in those files only**. Do not add nav items. Do not copy sessions/conversion.

Skip Tick 4 rather than reopen Tick 1.

---

## 6. Gate then Fly

After Tick 3 (or 4):

```bash
bash scripts/agent-ship-gate.sh
```

Fix agent-fixable failures ≤3 times. Then:

**DEPLOY_FLY = YES** (founder: finalize by morning without a re-prompt).

```bash
fly deploy -a mcfly-analytics --yes
```

Only from this repo / this branch. **Never** from `cursor/clean-revamp-v8`. Probe `/health` and `/app`. Stamp Living Board Fly version + `docs/ops/journal/STATUS_YYYYMMDD_flyNNN.md` using the real version from the deploy output. If deploy fails on auth/quota, write `BLOCKER: fly deploy` in the overnight journal and **stop** — do not retry >2.

Workers never deploy. This Conductor does.

---

## 7. Stop. Do not.

- Ask Marty anything. He wakes to the morning report.
- Pixels / MTA / OAuth zoo / true ROAS / TW clones.
- Restore Overview homework tabs or `hideHero`.
- Site Pages deploy, listing Submit, ads budget, inventing reviews.
- Git commit / push (unless an earlier message in **this** chat already said commit).
- Spawn Site + Listing + Desk + Ops in parallel.
- “Fix” a test by deleting the invariant. Rewrite the assertion to the new invariant in the **same** change.

Ask Marty **only if** a human gate is the only path (Partner MFA, billing card, DNS). Write it in the morning report, do not ping.

---

## 8. Morning report (last message in the chat)

Write `docs/ops/journal/OVERNIGHT_20260914.md` to `DONE` or `BLOCKED`, then the chat’s last message:

1. What Overview shows (Live $0 vs SAMPLE with spend).
2. What Marketing shows (empty vs one typed day).
3. aMER gone from merchant chrome? yes/no.
4. `agent-ship-gate.sh` exit code + test count.
5. Fly version **before** (253) and **after**.
6. Remaining human gates: Admin smoke, listing paste, ads still off, reviews 0.
7. Files touched (short).

Would a million-dollar store keep this at $39? One honest sentence.
