# Mcfly Analytics — App Store success plan

> **For agentic workers:** Product SoT is repo-root [`STRATEGY.md`](../../../STRATEGY.md). This file is the sequenced plan to overcome the failure modes from the 2026-08-25 teardown. Implement in phases; do not skip Phase 0.

**Goal:** A listed, useful Shopify analytics app: exact spend from every platform (including billboards) next to Shopify metrics, LTV Shopify does not give you, and a clear Goals board — without anti-pixel identity.

**Architecture:** Keep the existing embedded Admin app (`app/`). Reposition listing + Pro packaging first. Then reduce spend friction and make LTV/Goals the paid reason. Optional ad-account connects come after listing, as convenience, not as the soul of the product.

**Tech stack:** Shopify Admin embedded app (React Router 7), Fly `mcfly-analytics`, Prisma spend + OrderFact/CohortFact, Shopify App Pricing Free + Pro $39.

## Global Constraints

- App URL stays `https://mcfly-analytics.fly.dev`. Never the marketing site.
- Partner listing paste (short/long/features/captions) must **not** include `$39` (4.2.2 / 4.2.3). Price lives in Partner Pricing + in-app Upgrade.
- First listing: PCD **Level 1 only** (no name/email/phone/address). Till LTV does not need Level 2.
- Upgrade must exit the embed (`window.open(..., "_top")` / GET `/app/billing`). Never load `admin.shopify.com` in the iframe (2.1.1).
- SAMPLE / Practice **OFF** on the review store before Submit.
- Do **not** build pixels, MTA, or “true ROAS.” Also do **not** market as anti-pixel.
- Standing Fly grant: after ship-gate, deploy. Do not ask.
- [`STRATEGY.md`](../../../STRATEGY.md) wins over [`VALUE_THESIS.md`](../../VALUE_THESIS.md) / cash-desk religion copy for App Store Mcfly Analytics.

---

## New product (say this everywhere)

Mcfly Analytics is the Admin app where you:

1. **Put exact spend in** from Meta, Google, TikTok, email, **billboards**, radio, or anything you type.
2. **See it next to Shopify sales** for the same dates (Total ROAS = sales ÷ that spend — a board number, not a sermon).
3. **See LTV / payback** Shopify Analytics does not compute (opaque customer id + order history — not email CRM).
4. **Set Goals** (year board, pace vs actual).

We are **not** TrueProfit (net profit / COGS / Amazon). We are **not** Triple Whale (pixel / MTA). We are the missing layer: **all money out, including offline, beside the till.**

Billboards are the proof we are not another Meta-OAuth clone. Easy upload is the feature. Optional auto-sync is a later convenience.

---

## Phase 0 — Exist on the App Store (kills failure #1)

**Owner:** Founder (Partner clicks). Agent: paste, smoke, Fly.  
**Done when:** `https://apps.shopify.com/mcfly-analytics` is a live listing, not 404.

Nothing in Phases 1–6 matters until this is true. Shopify already paused once (ref 127166). The remaining rejects are form/trust mismatches, not missing pixels.

### 0.1 Partner testing form (4.5.4 / 4.5.5)

Open [App testing information](https://dev.shopify.com/dashboard) for Public app **403721814017** (not Custom **400772497409**).

| Field | Value |
| --- | --- |
| Username | empty |
| Password | empty |
| “My app doesn't require an account to use it.” | **CHECKED** |
| Testing instructions | Entire paste from [`docs/PARTNER_TESTING_INSTRUCTIONS.md`](../../PARTNER_TESTING_INSTRUCTIONS.md) |

Do not invent a staff password. Do not submit checkbox off + blanks. That is the last pause.

### 0.2 Pricing honesty (1.1.4)

Partner → Listing → **Pricing** = Shopify App Pricing:

1. Free (default)
2. Pro · **$39 USD** · every 30 days

In-app Upgrade already charges (`MCFLY_BILLING=1` on Fly). If Partner is Free-only, review fails.

### 0.3 Upgrade smoke (2.1.1)

On a **development** store, in the **embedded** Admin app (not a standalone tab):

1. Spend → **Upgrade to Pro**
2. Shopify plan picker must replace the **top** Admin frame
3. **Fail** if `admin.shopify.com refused to connect` inside the iframe

Code SoT: `app/app/lib/billing-navigate.ts`, `ProUpgradeButton`. Do not “fix” this by loading Admin in the iframe.

### 0.4 SAMPLE / Practice OFF

Demo → **Turn sample desk OFF** on the review store (`devmcflyads` / App Review store). Reviewers who see Practice numbers think the app is fake.

### 0.5 Live site matches the app

Human: publish current `site/` to Cloudflare Pages so [mcflyads.com](https://mcflyads.com/) is not a waitlist / “billing later” story.

Must match:

- Install Mcfly Analytics (App Store or Fly install path)
- Free + Pro exists (site may describe plans; **listing paste still has no $**)
- Privacy / Support / Terms 200 at extensionless URLs
- One product name: **Mcfly Analytics** (Mcfly Ads = custom work page, not a second app)

Repo already has honest `site/` in places. Live Pages historically lagged. Curl before Submit.

### 0.6 Listing paste (reposition, no religion)

Rewrite [`docs/APP_STORE_LISTING.md`](../../APP_STORE_LISTING.md) to the STRATEGY one-liner **before** the next Submit. Ban anti-pixel / “we refuse true ROAS” as identity. Ban `$` in short/long/features.

**Tagline (draft, ≤80):** `All your ad spend — even billboards — next to Shopify`

**Short (draft, no price):**  
`Add spend from Meta, Google, TikTok, or billboards. See it next to Shopify sales, LTV, and goals — numbers Shopify Analytics does not combine.`

**Long (draft, no price):**  
Open on the job: Shopify does not ingest ad or offline cost. Mcfly lets you upload or type spend from every platform, including billboards, and puts it beside Shopify sales for the same dates. Pro unlocks customer LTV/payback and a full-year Goals board. We do not replace Ads Manager attribution. We do not require a pixel.

**Keywords (draft):** `ad spend`, `Shopify analytics`, `LTV`, `ROAS`, `billboards`, `marketing goals` — not `pixel`, `attribution`, `true ROAS`, `anti-pixel`.

**Works with:** still blank unless we ship a real Checkout surface. Do not fake Meta/Google logos.

**Shots:** [`docs/LISTING_VISUAL_PACK.md`](../../LISTING_VISUAL_PACK.md) — retake so shot 1 is Shopify + spend together, shot 3 is **Add a billboard / typed extra in one field** (not a CSV sermon), shot 4 is LTV, shot 5 is Goals. After captures, SAMPLE OFF.

### 0.7 Human Submit checklist (existing runbooks)

Follow [`docs/SUBMIT_NOW.md`](../../SUBMIT_NOW.md) + [`docs/ops/FOUNDER_DO_NOW.md`](../../ops/FOUNDER_DO_NOW.md):

- Distribution = App Store
- PCD Level 1 submitted
- Emergency contact
- Icon `docs/listing-assets/mcfly-app-icon-1200.png`
- Five unique Admin shots
- Reply phrases: `distribution done` / `pcd done` / `plans set` / `submitted`

**Agent must not** click Submit. **Agent must** keep Fly healthy and 2.1.1 un-broken.

---

## Phase 1 — First trusted number (kills failure #3, week-1 churn)

**Owner:** Agent. **Done when:** a new install can put **one day’s spend** (Meta **or** a billboard) next to Shopify sales in under 10 minutes without a CSV religion class.

Today Spend is a three-step CSV path (`app/app/routes/app.spend.tsx`). That is honest and too heavy. Competitors win because numbers appear. We cannot match Meta OAuth this week (Meta App Review for `ads_read` on third-party accounts takes weeks — [Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights)). We **can** make manual entry feel like a 30-second win.

### 1.1 Proud “Add spend” (billboards included)

**Files:** `app/app/routes/app.spend.tsx`, `app/app/styles/mcfly-desk.css`, `app/app/lib/spend-custom-channel.ts`

Ship a primary path **above** CSV:

- Amount + date + channel (named list **or** type “Billboards — I-15”)
- Save → Overview immediately shows sales ÷ that spend for the selected period
- CSV remains “many days / Ads Manager export,” not the only door

Empty Spend must not lead with Pro. It must lead with **Add $**.

### 1.2 All named platforms on Free

**Files:** `app/app/lib/entitlements.ts`, `app/app/lib/entitlements.server.ts`, `docs/BILLING_TIERS.md`

Today Free is Meta + Google + `other`; TikTok/Amazon/Email are Pro. That fights “every platform including billboards” and makes Pro a homework tax.

**Lock:** Free = **all** `SPEND_CHANNELS` + typed extras. Pro = **LTV + full Goals** (+ later connected accounts). Keep $39. Change `PRO_UPSELL.includes` copy.

Tests: `app/app/lib/spend-billing.test.ts`, entitlements tests.

### 1.3 One period, one sales definition

**Files:** `app/app/lib/periods.ts`, `app/app/components/PeriodControl.tsx`, routes `app._index.tsx`, `app.spend.tsx`, `app.goals.tsx`, `app.ltv.tsx`, `app.allocation.tsx`

Bug class that earns 1★: LTV cohorts all-time while CAC uses the selected period; facts window vs L12M.

**Lock:**

- Shared `?period=` on every desk tab
- LTV page: **label** cohort window vs period spend (never silently mix)
- Sales numerator: one basis (Total Sales default; Net as toggle) everywhere
- Practice vs Your store: never mix writes; banner always on when Practice is on

This is trust, not craft.

### 1.4 Practice cannot look like the store

**Files:** `app/app/lib/sample-desk.server.ts`, `DataModeBar` / product labels

- Default **Your store** for new installs
- Practice chrome: “Example data — not your store”
- Block CSV into Practice (already fail-closed — keep it)
- Reviewer notes already say SAMPLE OFF — UI must make that obvious

### 1.5 Do not promise pixels in FAQ

Listing + in-app: “We show Shopify sales next to the spend you add. Ads Manager still has its own ROAS. Mcfly does not install a pixel.” Neutral. Not a fight.

---

## Phase 2 — Make $39 worth it (kills failure #4)

**Owner:** Agent + listing. **Done when:** a merchant who already uploaded spend can point at **two screens** and say why they paid.

TrueProfit is $35 with ad sync + LTV. Triple Whale Free already shows blended ROAS. We do not win by matching them. We win if Pro is obviously:

1. **LTV / payback Shopify does not show**
2. **Full-year Goals board** (sales + spend + ROAS target)

### 2.1 Stop teasing the wrong thing

Do not gate “named extras” or billboards. Gate:

| Free | Pro $39 |
| --- | --- |
| All spend channels + typed extras | Live store LTV (not Practice-only) |
| Overview: Shopify sales ÷ spend, same dates | Full-year Goals board + YoY fill |
| Period filters, Allocation mix | Deeper history when `read_all_orders` is approved |
| Goals **pace** vs one Total ROAS target (keep) | Month-by-month plan + gauges |

Update `PRO_FEATURE_BULLETS` / Settings plan table / Partner testing paste (testing paste **may** mention $39; listing **must not**).

### 2.2 LTV that survives a screenshot

**Files:** `app/app/routes/app.ltv.tsx`, `app/app/lib/contrib-ltv.ts`, `app/app/lib/order-facts.server.ts`, `docs/PCD_AND_LTV.md`

Already shipped: per-customer revenue windows; margin as 0–1. Still required:

- Request Partner **`read_all_orders` after listing** (not mid-first-review) so 90/365 is not a 60-day stub
- Payback vs **period-matched** spend, with a caption when cohort is longer than the slicer
- Empty live state: “Orders still syncing” not $0 LTV that looks like a bug
- Practice LTV remains a demo of Pro, not a substitute for live Pro

We will not beat Lifetimely’s email CRM on Level 1. We **can** beat Shopify Analytics (which has no LTV vs ad spend). Sell that gap, not Lifetimely’s.

### 2.3 Goals as a place, not a leftover

**Files:** `app/app/routes/app.goals.tsx`, `app/app/lib/sales-goals.server.ts`

Make Goals feel like the year operating system:

- Monthly **sales** goals (exists)
- Optional monthly **spend** cap / Total ROAS target (if missing, add)
- Pace vs actual using the **same** spend + sales as Overview
- Free: this-period vs target. Pro: 12-month board

This is the habit loop. Spend upload without Goals is a calculator. Goals without trusted spend is fiction.

---

## Phase 3 — Less homework over time (kills “CSV vs autopilot”)

**Owner:** Agent, after listing. **Done when:** a merchant can keep Spend current without a weekly CSV class, **without** Mcfly owning a connector zoo.

Do **not** block Phase 0 on OAuth. Meta Advanced Access for third-party ad accounts is a separate review ([ads_read / insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights)). Google needs a developer token. That is months of support load.

### 3.1 Recurring manual (days, not months)

- “Same as last week” duplicate
- Paste a 7-row Ads Manager table
- Multi-file combine (partially exists)

### 3.2 Merchant-owned Sheet pull

[`docs/PIPE_AUTOMATION_WEDGE.md`](../../PIPE_AUTOMATION_WEDGE.md) already describes SyncWith → Sheet → Mcfly template.

**Build:** authenticated URL or Apps Script dump into Spend (columns `date | channel | amount`). Merchant pays SyncWith. Mcfly does not become SyncWith.

This is how we get “numbers appear” **before** Meta App Review.

### 3.3 Optional Meta/Google connect (Pro convenience)

**Un-retire** [`docs/RETIRED_SURFACES.md`](../../RETIRED_SURFACES.md) **only for spend amounts**, after founder listing is live:

- Scope: daily **spend**, not campaign management, not CAPI, not pixels
- Store tokens encrypted; refresh; honest “disconnected” banners
- Billboards and typed extras stay manual forever (APIs cannot see a billboard)

Until App Review for those APIs is done, **do not** put “Works with Meta” on the listing.

### 3.4 What we still never build

Pixels, view-through, path credit, incrementality. Operators who want that buy Triple Whale / Northbeam. Mcfly coexists.

---

## Phase 4 — Category that people already buy (kills failure #2)

We do not invent “cash desk religion.” We occupy a **real** search:

> Shopify analytics + **ad spend** + **offline spend** + **LTV** + **goals**

Roundups split profit vs attribution. We are the third column: **spend completeness**. ProfitLens is CSV + P&L. Kipify is OAuth MER. We are **any dollar, including billboards**, next to Shopify, plus LTV and Goals.

**Listing category:** Marketing analytics.  
**Competitive sentence (support/site, not listing prices):** “TrueProfit if you need COGS. Triple Whale if you need a pixel. Mcfly if you need every dollar you spent — including billboards — next to Shopify, LTV, and goals.”

Allocation mix stays **spend share** and should be labeled as share of spend, not “winning channel ROAS.” Honesty without anti-pixel branding.

---

## Phase 5 — Distribution, brand, founder physics (kills failure #5)

**Owner:** Founder. Agent supports copy and a 15-store playbook.

### 5.1 One name

Public product: **Mcfly Analytics**.  
Custom $15–40K: **Custom analytics** (page on mcflyads.com), sold **from** the listed app (“Need a desk that is not Shopify-only? Inquire”) — not a waitlist that contradicts Install.

Privacy titles, Partner app name, Fly landing, and site H1 must match.

### 5.2 First 15 reviews (the actual moat)

App Store search is reviews. Plan:

1. Nutricost + 5 operator friends install **Your store**, add real spend, leave a review after 7 days
2. 5 consultant/clients (services path)
3. Founder replies to **every** review within 48 hours for 90 days (TrueProfit’s 5.0 is a support sport)

Do not buy reviews. Do not review from Practice-only use.

### 5.3 Time budget (one founder)

| Cadence | Work |
| --- | --- |
| Until listed | Phase 0 only — no new category essays |
| Week 1 listed | 30 min/day: uninstall reasons, 1★ replies, install friction notes |
| Ongoing | Custom desks from inbound; App Store is the top of funnel |

### 5.4 Do not compete with yourself

The app is the business that must take off. Custom work is the high-ticket SKU for weird stacks. If the app stays unlisted, custom is the only revenue — that is the current trap.

---

## Phase 6 — Where they would have gone instead (own the migrate-to)

If someone is about to leave, the product should already have answered the job:

| They wanted | We keep them if | We send them away if |
| --- | --- | --- |
| Profit / COGS / Amazon | We never claimed that | TrueProfit / BeProfit |
| Pixel / MTA | We never claimed that | Triple Whale / Northbeam |
| Sheet forever | Sheet pull (3.2) is good enough | SyncWith only |
| LTV | Pro LTV is labeled and period-honest | Lifetimely (email CRM) |
| All spend + Shopify + goals | **This is us** | Nobody — this is the stay |

Support macro: one paragraph, no religion.

---

## Implementation order (agents)

Do not start OAuth or Lifetimely clones before 0–2.

| Order | Work | Branch hint |
| --- | --- | --- |
| A | Listing copy + shot captions to STRATEGY (no $ in paste) | docs |
| B | Free = all spend channels; Pro = LTV + Goals | `entitlements.ts` |
| C | One-field Add spend (amount/date/channel/typed extra) | `app.spend.tsx` |
| D | Period + sales-basis cohesion across tabs | `periods.ts` + routes |
| E | LTV captions + `read_all_orders` Partner packet (submit after list) | `app.ltv.tsx` |
| F | Goals board = Pro hero (spend/ROAS rails if missing) | `app.goals.tsx` |
| G | Sheet pull | new route + jobs |
| H | Meta/Google spend OAuth | after listing + API reviews |

Each app tick: tests → ship-gate → **Fly deploy** (standing grant).

---

## Weakness → counter (index)

| # | Failure | Counter |
| --- | --- | --- |
| 1 | Never lists | Phase 0 human form + Pricing + 2.1.1 + SAMPLE OFF + Pages |
| 1b | Cold start / 0 reviews | Phase 5 design partners + reply SLA |
| 2 | Category orphan | Spend completeness + LTV + Goals; drop anti-pixel identity |
| 3 | Week-1 CSV homework | 1.1 Add $; 1.2 all channels Free; 3.x Sheet then optional OAuth |
| 3b | Practice / LTV distrust | 1.3–1.4; 2.2 captions; Practice LTV already unit-fixed on Fly v145 |
| 4 | $39 never converts | Pro = LTV + Goals only; extras Free |
| 5 | Brand / founder / dual offer | One name; custom as upsell; founder review hour |
| 6 | Migrate-to incumbents | Phase 6 honesty; own the billboard + Shopify + goals job |
| 7 | “Worse everything” | Stop competing on their jobs; win on spend-from-anywhere |

---

## Founder actions this week (no agent can do these)

1. Checkbox **ON** + testing paste (`docs/PARTNER_TESTING_INSTRUCTIONS.md`).
2. Partner Pricing **Free + Pro $39**.
3. Embedded Upgrade smoke; SAMPLE **OFF**.
4. Publish Cloudflare Pages from current `site/`.
5. Upload shots + Submit.
6. Text 10 people to install after it lists.

When those are done, reply in chat with `submitted` and the listing URL. Agents continue A–H on Fly without asking permission to deploy.
