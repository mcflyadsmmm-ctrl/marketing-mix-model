# HTML leftovers vs live listing + product law — apex v38

**Date:** 2026-09-22T22:37Z  
**Role:** leftover hunt. Research only. Parent cooks. Do not merge, deploy, ShopifyQL-wait, or unpark Live.  
**SoT:** live HTML at https://mcflyads.com (curl). Git quotes are cook targets when they match live.  
**Stamp:** `<meta name="mcfly-version" content="v38" />` on `/` `/demo` `/pricing` `/product` `/about` `/faq` `/support`. Pages journal `dfb9f017`. Fly `/` also v38. Fly `/health` `ok` / `mcfly-analytics` / `db: up`.  
**Asset drift:** `GET /assets/mcfly/chrome.js` body already comments **v39** / `craft-steal-v39` (hash ≠ this git). HTML meta still **v38**, so chrome does not overwrite it. Footer honesty line is unchanged. Do not treat chrome.js as the page version.

**Product law used:** Living Board v38 — leftover Analytics still does not ship is the **median ticket**. Native already Groups by weekday, can show ShopifyQL returning sales $, pins monthly sales targets, has customer cohort reports. Repeat Customer Insights from $59 is the closer LTV/latency app. Spend is the door, not the greeting. Goals is not a second sales plan. Reviews **0**. Custom 301. `/lab` 301. cash OG 301. 7-day then $39. Empty spend is —.

**Listing SoT (same crawl):** https://apps.shopify.com/mcfly-analytics-public — still spend-first. Rating **0.0 (0 Reviews)**. One plan **$39 / month** + 7-day trial.

---

## Named hunt — confirm gone on LIVE 200s

Crawled sitemap 200s (`/` `/demo` `/pricing` `/product` `/about` `/faq` `/support` `/privacy` `/terms` `/cookies` `/security` `/dpa` `/404` `/llms.txt` `/llms-full.txt`) plus parked hops (no `-L`) and Fly `/` `/privacy` `/support` `/terms` `/demo` `/lab`.

| Hunt | Live 200 HTML | Grade |
| --- | --- | --- |
| Harbor / Northline / `$98,500` / `4.19×` | **Absent** on apex 200s and Fly marketing. Fly `/demo` `4.19` hits are dollar cents (`1264.19`), not Northline. | **GONE** |
| Google Fonts CDN on apex legal | Copy is denial: “No Google Fonts CDN.” CSS is `/assets/fonts-local.css`. No `fonts.googleapis`. | **GONE on apex copy** — see P0-7 for Fly iframe |
| waitlist / FormSubmit **in page copy** | **Absent** on apex 200 HTML. | **GONE as copy** — see P0-6 for live POST |
| downloadable calculator | `/mer-calculator` `/break-even-roas-calculator` `/calculator` **301 → /pricing**. Phrase “downloadable calculator” absent. | **GONE** — see P0-6 sheets guide |
| ad-account OAuth | Live says “No ad OAuth” / “No Meta/Google OAuth.” Shopify OAuth on privacy/security is install, not ads. | **GONE as lie** |
| Sample\|Live **toggle as a product** | No toggle UI. Support **keeps** `There is no Sample\|Live toggle.` Terms: `there is no Sample\|Live toggle on this host.` | **GONE as toggle** — **KEEP** the denial |
| `full-access` | **Absent** on apex 200s. | **GONE** |
| `trial includes 24 months` | **Absent.** Live is `Trial is 90 days of order history; paid is up to 24 months.` | **GONE** (intentional vs listing-paste 24-mo trial) |
| Polar `$1,020` as a from-price | Not sold as Polar’s price. String still planted — see P0-4. | **half-cooked** |
| TrueProfit `5.0 (880)` | **Absent.** Live: `TrueProfit listing 4.9 (898)`. Listing JSON-LD tonight: **4.9 / 898**. | **GONE** |
| `every report, not one card` | **Absent.** Clone remains — see P0-5. | **half-cooked** |
| `Monthly sales plan from Shopify orders` | Exact string **absent** on index/pricing/about. Remnants — see P0-2. | **half-cooked** |
| Invented 4.9 **Mcfly** reviews | Live: `we do not invent a 4.9` / `Mcfly reviews: 0.` Listing: `0.0` / `No reviews yet`. Competitor 4.9s are Polar / Lifetimely / TrueProfit. | **GONE as invention** |
| Custom inquire | **Absent** on apex 200s. `/custom-analytics` **301 /**. `/download` **301 /demo**. | **GONE** |
| cash OG | `/assets/brand/og-cash-mer.jpg` **301 →** `/assets/brand/og-analytics.jpg`. No `og-cash-mer` / `cash desk` / `cash MER` on apex 200s. | **GONE** |
| `/lab` 200 | `/lab` `/lab/` **301 /**. `/lab.html` **308 → /lab → 301 /**. Follow ends on home **200**, not lab HTML. Fly `/lab` **301** Fly home. | **GONE as 200** |

v38 cooked the named list on **copy tests**. First fold, JS, product contrast, legal OG, and processors were not the same pass.

---

## Listing (live) vs site (live)

Quoted from listing HTML 2026-09-22:

> Title: `Mcfly Analytics - Ad spend next to store sales — Total ROAS +...`

> `See every ad dollar next to Sales. Total ROAS, LTV, and deep customer insights on one desk.`

> `Mcfly Analytics is the cash desk for that gap.`

> JSON-LD: `Put Meta, Google, TikTok, and billboard spend next to Shopify sales.`

> Feature: `Spot when platforms claim the same purchase your till counted once`

> Feature: `Flat $39 with Goals and 7/14/28 allocation`

> Feature: `Break-even Total ROAS plus Cash Acquisition Costs`

> Pricing card: `Spend vs sales on aligned dates` · `All channels, including billboards` · `Customer LTV and Goals board` · `7-day free trial, then $39/month`

> Reviews: `0.0 (0 Reviews)` · `No reviews yet`

Listing has **no** `typical order`, **no** `median`, **no** `YoY`, **no** `90 days`, **no** `24 months`.

Site H1 (locked): `Deeper Shopify numbers Analytics does not show.` Site discloses the mismatch in the sits-note. **Do not cook the site to match spend-first listing.** Cook is Marty Partner Save of [`docs/ops/LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md). Cursor does not Submit.

Competitor listings tonight (JSON-LD / pricing cards), matching what v38 already cites:

| App | Live listing | Site v38 |
| --- | --- | --- |
| Polar | Core from **$750/month**, GMV-based, **4.9 (117)** | `$750` · `4.9 (117)` |
| Triple Whale | **Free** / Foundation **$219** / Automate **$749**, **4.1 (91)** | same ladder |
| Lifetimely | FREE / S **$49** / M **$149** (up to 3,000 orders) / L **$299**, **4.9 (538)** | `Free / $49 / $149 / $299` |
| TrueProfit | From **$35/month**, extra-order surcharges, **4.9 (898)** | `4.9 (898)` · from `$35` |
| Repeat Customer Insights | Entrepreneur from **$59**, Growth **$99**, Peak **$249**, **5.0 (14)** | from `$59` · `5.0 (14)` |
| Better Reports | From **$19.90** | from `$19.90` |

---

## Ranked P0s (parent cooks)

### P0-1 — First fold still sells native returning / weekends / LTV as the gap

**Law:** leftover is **median ticket**. Native already weekday grouping, ShopifyQL returning sales $, cohort reports, monthly sales targets. RCI from $59 is closer LTV/latency.

**Live `/` HTML:**

> kicker: `Typical order · returning dollars · spend optional`

> lede: `Median ticket, returning dollars, weekends — from orders you already have.`

> meta description: `Typical order is the median, not AOV. Returning dollars, not the returning-customer rate.`

> og:description: `Typical order, returning dollars, weekends — spend optional.`

Hero KPIs are still **Typical order / Returning dollars $45,409 / Weekend mix 23%**, each a `<button class="dd-kpi … dd-kpi--drill">` with `Click for detail`.

v38 **did** cook the FAQ body and the how-it-works lede (`Typical order is the leftover median`). The **first sentence a merchant reads** was not.

Same uniqueness bundle still live on:

- `/faq` hero: `Typical order, returning dollars, weekends, LTV — spend is optional.`
- `/about` lede: `typical order, returning dollars, weekends, days to second, LTV from the orders you already have.`
- `/pricing` “In the fee”: `Typical order, returning dollars, weekends, LTV 30/90/365`
- `/product` meta: `typical order, returning dollars, weekends, days to second, LTV`
- `/llms-full.txt`: `Returning dollars, not the returning-customer rate.`

**Git (matches live):**

```79:81:site/index.html
            <p class="kicker">Typical order · returning dollars · spend optional</p>
            <h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>
            <p class="lede lede--tight">Median ticket, returning dollars, weekends — from orders you already have. Spend optional. No pixel.</p>
```

```24:24:site/index.html
  <meta name="description" content="Deeper Shopify numbers Analytics does not show. Typical order is the median, not AOV. Returning dollars, not the returning-customer rate. Spend optional. Total ROAS = Shopify sales ÷ entered spend; empty = —. 7-day trial, then $39/store/mo." />
```

**Cook:** keep locked H1. Make kicker/lede/meta/OG/hero KPIs **median leftover**. Returning $ and weekend mix may exist below the fold **as packaging next to named native**, not as the gap. Same pass on faq hero, about lede, pricing fee list, product meta/OG, llms-full. Do not invent Mcfly 4.9. Do not put Harbor/Northline back.

---

### P0-2 — Goals still a sales-plan product (named hunt remnant)

v38 banned the **exact** string `Monthly sales plan from Shopify orders` on index/pricing/about. Live still ships the claim.

**Live `/` loads** `/assets/demo-desk.js?v=20260922v38` (hash = this git):

```274:275:site/assets/demo-desk.js
      goals: ["Goals", "Monthly sales plan · spend optional"],
      settings: ["Settings", "Sample data · Live is parked · $39/mo"],
```

Clicking Goals on the home collage paints **Monthly sales plan**. Settings caption is Sample\|Live leftover language (`Sample data · Live is parked`) on a public 200.

**Live `/product`:**

```227:227:site/product.html
        <p class="contrast-lede">Overview → Orders → Customers at $0 spend. Growth and LTV stay Customers chips. Type spend on Spend when you want Total ROAS. Goals is the sales plan. Settings is billing and shop clock — not a sixth analysis tab in the Admin iframe pills.</p>
```

About/pricing already say `Native already pins monthly sales targets on Overview` — keep that. Kill sales-plan as a Mcfly product noun.

---

### P0-3 — Live listing is still the spend-first card (not an HTML cook)

See listing quotes above. Site sits-note already: `The live App Store card still leads with ad spend next to store sales. This site leads with Overview → Orders → Customers.`

**Do not** rewrite home to “cash desk” / `till` / `7/14/28 allocation` to satisfy 1.1.4. That would undo product law. **Marty Partner Save** of the sales-first paste. This P0 is listed so occupancy does not pretend v38 closed listing match.

---

### P0-4 — Polar `$1,020` still planted

Named hunt item. Polar listing tonight: twitter/pricing **`$750/month`**, Core Plan, **4.9 (117)**. No `$1,020` on Polar’s listing.

**Live `/` sits-note:**

> `Polar’s App Store list price starts at $750/mo. We do not invent Polar $1,020.`

v38 tests **require** that denial. Reviewers still **see** `$1,020`. Same FAIL as the v34 adversarial audit.

**Git:**

```287:287:site/index.html
        <p class="sits-note mono">Listing “from” prices, not a private quote: … Polar’s App Store list price starts at $750/mo. We do not invent Polar $1,020. Mcfly reviews: 0. …
```

**Cook:** drop `$1,020` even as a refused number. Keep `$750` + `Mcfly reviews: 0.` Loosen `site-honesty-v35` / `v38` tests that lock the planted figure.

---

### P0-5 — `every report, not one report` (clone of cooked `not one card`)

Named hunt `every report, not one card` is gone. Live `/` FAQ + `/faq` (visible + JSON-LD) still:

> `Grow+ staff can be Dashboards only (Overview + Live view), not full Admin. Reports permission is every report, not one report.`

**Git:**

```437:437:site/index.html
            <p>You copy or Save PNG. … Grow+ staff can be Dashboards only (Overview + Live view), not full Admin. Reports permission is every report, not one report. Basic Shopify has no staff seat. <a href="/faq">Full FAQ</a>.</p>
```

Keep **Dashboards only vs Reports**. Drop the slogan. That was the v38 uniqueness leftover, renamed.

---

### P0-6 — Trust/processor leftovers still 200 (waitlist API, allocation/cohort OG, sheets guide)

v37 journal claimed legal pages dropped waitlist/FormSubmit/calculator. **Copy** did. **Surface** did not fully.

| Live | Proof |
| --- | --- |
| `POST https://mcflyads.com/api/waitlist` | **400** `{"ok":false,"error":"A valid email is required."}` · `Allow: POST, OPTIONS` — Pages Function still live, FormSubmit in `functions/api/waitlist.js` |
| `/privacy` `/terms` `/support` `/security` `/404` | still load `/assets/app.js` (`WAITLIST_ENDPOINT = "/api/waitlist"`). No `data-waitlist` form on those 200s, but the client + API remain |
| `/privacy` og:description | `Total ROAS data diet: order totals, opaque OrderFact / CohortFact…` |
| `/privacy` why-we-process | `rules-based allocation, and customer lifetime value cohorts` |
| `/terms` | `offer rules-based allocation guidance` |
| `/assets/mcfly-sheets-spend-guide` | **200** HTML, `site.css`, “Download a blank Day + selected-platform CSV”, link to `/assets/mcfly-pipe-spend-long-blank.csv` (**200** CSV). Linked from live `/product` and `/support#sheets-spend` |
| collage | `/support` `/privacy` `/terms` `/cookies` `/security` `/dpa` `/404` still load `site.css?v=20260829v13`. Destyle is craft, not this leftover patch, unless parent is already on that rebuild |

`CohortFact` as a **table name** may stay. Chrome-banned **cohort** in merchant voice and **Allocation** as a product noun should not be the privacy OG.

**Git:**

```20:20:site/privacy.html
  <meta property="og:description" content="Total ROAS data diet: order totals, opaque OrderFact / CohortFact, spend you enter. No name/email CRM. 7-day trial then $39/store/mo." />
```

```215:215:site/privacy.html
      <p>To run the Total ROAS dashboard, break-even Total ROAS, rules-based allocation, and customer lifetime value cohorts; …
```

Parked git still has waitlist forms (`site/mer-calculator.html`, `site/custom-analytics.html`) — **not live 200s** while `_redirects` hold. If redirects drop, those 200 with Harbor/Northline/`$98,500`. WARN, not this cook unless parent is deleting parked files.

---

### P0-7 — Public SAMPLE desk still loads Google Fonts CDN

Apex legal now says **No Google Fonts CDN**. Live `/demo` iframes `https://mcfly-analytics.fly.dev/demo?hosted=1`. That document **200** includes:

> `rel="preconnect" href="https://fonts.googleapis.com"`

> `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque…&family=Figtree…`

Named hunt item moved hosts. This is **Fly SAMPLE chrome**, not Pages HTML. Parent cooking `site/*.html` will not close it. Do **not** ShopifyQL-wait. Do **not** unpark Live. Optional later Fly wrap — out of this Pages leftover pass unless Conductor splits a Fly lane.

---

## Not P0 (do not distract the cook)

- Support phrase `There is no Sample|Live toggle.` — **keep**.
- Snowdevil lock `$68,457` / `$19,023` / `3.60×` / typical `$631` / returning `$45,409` — keep.
- `2.50×` break-even without “@ 40%” — WARN (margin math), not this uniqueness pass.
- Lifetimely listing plan **names** are FREE/S/M/L; site says Free/$49/$149/$299 — prices match; names are WARN.
- YoY cards on home are `<article>`, not `/demo` CTAs — v35 cook still holds. KPI **buttons** `Click for detail` are collage (fold into P0-1, not a second ticket).
- `true ROAS` hits are refusals (`not “true ROAS”`).
- `Free plan` hits are `No Free plan` / `There is no Free plan.`
- `.html` 308s (`/lab.html`, `/privacy.html`, …) hop to 301/200 canon. Not lab 200.
- Git Northline landers (`site/lab.html`, SEO suite) remain in repo; Cloudflare `_redirects` 301 them. Live hop table 2026-09-22: `/lab` `/cash-mer` `/monday-close` `/custom-analytics` `/advanced-mds` `/mds-made-easy/` `/vs-attribution-suites` all **301 /**.

---

## Parked hop table (live, no follow)

| URL | HTTP | Location |
| --- | --- | --- |
| `/lab` `/lab/` | 301 | `/` |
| `/cash-mer` | 301 | `/` |
| `/monday-close` | 301 | `/` |
| `/custom-analytics` | 301 | `/` |
| `/download` | 301 | `/demo` |
| `/mer-calculator` `/calculator` `/break-even-roas-calculator` | 301 | `/pricing` |
| `/assets/brand/og-cash-mer.jpg` | 301 | `/assets/brand/og-analytics.jpg` |
| `/app` | 301 | `/product` |

---

## Parent cook notes

1. One version = one job. Suggested job: **P0-1 + P0-2 + P0-4 + P0-5** (fold uniqueness + Goals remnants + planted Polar number + report slogan). P0-3 is Partner. P0-6 is legal/API. P0-7 is Fly.
2. Do not merge this research branch into the live site PR. Do not Pages deploy from here. Do not execute ShopifyQL-wait. Do not unpark Live.
3. Keep: locked H1, Install → `mcfly-analytics-public`, reviews 0, $39 / 7-day, 90 vs 24 paid, Snowdevil SAMPLE dollars, Support Sample\|Live denial, Harbor/Northline off `/`.
4. Loosen tests that lock leftover strings (`We do not invent Polar $1,020`, `every report, not one report`) when those strings are the cook target.
