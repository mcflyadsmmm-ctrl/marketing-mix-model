# Third desk truth — hostile merchant after v38

**Date:** 2026-09-22 · America/Denver  
**Role:** hostile Shopify merchant. Not Mcfly. Assume the uniqueness cook is overconfident. Fail leftovers.  
**Did not:** cook HTML · merge · Pages/Fly deploy · ShopifyQL-wait · unpark Live · change locked home H1.

**Method:** live `curl` of `/` `/faq` `/pricing` `/product` `/about` `/demo` `/support` `/privacy` `/cookies` `/dpa` `/terms` plus parked hops. Headless Chrome 390×844 and 1440×1100 screenshots of `/` `/faq` `/pricing` `/product` `/about` `/privacy`. Competitor App Store cards fetched the same hour. Shopify Help for staff seats / Dashboards.

**Stamp split (live moved while crawling):**

| Probe | UTC | `mcfly-version` | `mcfly-build` | CSS/JS cache |
| --- | --- | --- | --- | --- |
| First HTML | 22:33Z | **v38** | `craft-steal-v38` | `?v=20260922v38` |
| Re-probe + screenshots | 22:47Z | **v40** | `craft-steal-v40` | `?v=20260922v40` |

Assigned stamp was Pages `dfb9f017` / v38. Cloudflare headers did not print a Pages id. First-save HTML is the v38 book. Merchant-now quotes below are **v40** unless marked v38. Parent: do not recook the v38 home lede — v40 already rewrote it.

**Overall:** v38’s uniqueness FAQ body is honest. The desk still sells returning dollars / weekends / LTV as the gap in kickers, OG, FAQ intro, About, and the CFO “in the fee” list. `/product` still names Goals a sales plan. `demo-desk.js` still says `Monthly sales plan`. Those are the P0s. SAMPLE book, Mcfly stars, fonts, waitlist, calculator, Slack-bot claim, COGS/pixel/MTA, empty —, Custom 301: pass.

Locked home H1 on both stamps:

```html
<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>
```

---

## Hunt scoreboard (live v40 unless noted)

| Hunt | Grade | Live proof |
| --- | --- | --- |
| Leftover uniqueness | **P0** FAQ intro + About + kicker/OG; **P0** `/product` Goals | FAQ Q2 says returning/weekend/LTV are **not a native hole**. FAQ lede still lists them as what Analytics does not show. |
| Invented reviews / stars | **PASS** | Mcfly 0.0 (0). TrueProfit **4.9 (898)** matches `apps.shopify.com/trueprofit`. Polar 4.9 (117). TW 4.1 (91). Lifetimely 4.9 (538). RCI 5.0 (14). |
| SAMPLE mix (Harbor / Northline $98,500) | **PASS** | Absent on all crawled HTML. Snowdevil `$68,457` / `$19,023` / `3.60×`. |
| Google Fonts CDN | **PASS** | `fonts-local.css` `@font-face` → `/assets/fonts/*.woff2`. Privacy/cookies/DPA: “No Google Fonts CDN.” No `fonts.googleapis`. |
| Waitlist / FormSubmit | **PASS** | Zero hits. `/waitlist` → 404 (not 301). |
| Downloadable calculator | **PASS** | Terms: “Parked calculator URLs 301 to Pricing.” `/mer-calculator` 301 `/pricing`. `/break-even-roas-calculator` 301 `/pricing`. `/calculator` 301 `/pricing`. |
| Share-job Slack bot | **PASS** (claim) / **P1** (JS leftover nearby) | Home: “Not a Slack bot.” “Mcfly never posts.” |
| Staff-seat | **WARN / P1 name** | Basic **0 users** is still Help Center truth. Dashboards = Overview + Live view is true. Plan name is **Grow**, not **Grow+**. |
| COGS / P&L / pixel / MTA | **PASS** | Refused on home FAQ, pricing “Not in the fee”, about refuse doors, product refuse list. |
| Empty spend 0× | **PASS** | “empty = —” / “never 0×”. SAMPLE 3.60× is typed spend, not empty. |
| Parked calculator | **PASS** | See hops. FAQ: “Not a parked calculator.” |
| Custom inquire | **P1** | `/custom` 301 `/`. About: “Custom Data Solutions is parked.” `/inquire` **404**. `/packages` **404**. |
| Goals leftover | **P0** | `/product` “Goals is the sales plan.” Table: “Spend not required.” `demo-desk.js` `Monthly sales plan · spend optional`. Home/pricing/about already say not a second sales-plan product. |

v38 already cooked (do not recook): uniqueness FAQ Q2 + JSON-LD; TrueProfit 4.9 (898); Grow+ Dashboards sentence; product H1 `Median ticket. Not Shopify AOV.`; CFO card on `/pricing`; local fonts; Polar $750 / “We do not invent Polar $1,020”; locked H1.

v40 already cooked vs this agent’s v38 HTML: home hero lede is no longer “Median ticket, returning dollars, weekends — from orders you already have.”

---

## P0 — cook one-liners

### 1. `/product` still sells Goals as a sales plan

Quoted live v40:

> “Goals is the sales plan. Settings is billing and shop clock — not a sixth analysis tab in the Admin iframe pills.”

> Goals row: “Sales vs the calendar. Spend not required”

Quoted same origin, `/pricing` chapter two / `/about` Goals door / home Goals row:

> “Native already pins monthly sales targets on Overview. Mcfly Goals is optional Total ROAS vs break-even on that calendar — not a second sales-plan product.”

v38 test only bans `Goals is the monthly sales plan from Shopify orders` on index/pricing/about. It never opened `/product`.

**Cook:** On `/product` only — replace both lines with the About sentence. Keep Spend last. Do not touch home H1. Extend the honesty test to `product.html` for `Goals is the sales plan` and `Spend not required`.

### 2. Live collage JS still names a monthly sales plan

Quoted `https://mcflyads.com/assets/demo-desk.js?v=20260922v40` line 274:

```js
goals: ["Goals", "Monthly sales plan · spend optional"],
```

Home collage loads this file. Merchant who clicks the Goals drill sees the v38-banned job.

**Cook:** Same file, same array: `"Optional Total ROAS vs break-even · spend last"`. Ban `Monthly sales plan` in `demo-desk.js` in the honesty test.

### 3. `/faq` first viewport contradicts Q2 uniqueness

Quoted live v40 FAQ header (390 screenshot matches):

```html
<h1>0 reviews. Median ticket.</h1>
<p>Deeper Shopify numbers Analytics does not show. Typical order, returning dollars, weekends, LTV — spend is optional. 7-day trial, then $39/store/mo. Trial is 90 days of orders; paid is up to 24 months.</p>
```

Quoted the next uniqueness Q (visible + JSON-LD):

> “Typical order is the leftover: Shopify AOV is the mean; there is no native median ticket. Returning dollars, weekend mix, days-to-second, and LTV 30/90/365 are **not a native hole**: ShopifyQL can show returning sales $; Shopify Reports can Group by day of week; native RFM shows average days since last order; Shopify already has customer cohort reports.”

Same page, two jobs. H1 is a reviews/median mash. Lede still sells the pre-v38 bundle.

**Cook:** H1 back to `FAQ`. Lede: median leftover only + reviews 0 + listing-mismatch sentence already on the page. Do not weaken Q2. Keep locked home H1.

---

## P1 — cook one-liners

| # | Leftover | Quote | Cook |
| --- | --- | --- | --- |
| 4 | Home kicker + OG still hang returning dollars / weekends off the locked H1 | Kicker: `Typical order · returning dollars · spend optional`. `og:description`: “Typical order, returning dollars, weekends — spend optional.” `meta description`: “Returning dollars, not the returning-customer rate.” Visible lede is already honest. | Keep H1. Kicker → `Median ticket · spend optional`. OG/meta → median leftover + empty —. |
| 5 | `/about` lede uniqueness | “typical order, returning dollars, weekends, days to second, LTV from the orders you already have” under the same locked line as home. Doors below are honest. | Lede: median leftover + spend optional + reviews 0. Leave the door copy. |
| 6 | CFO “In the fee” uniqueness | “Typical order, returning dollars, weekends, LTV 30/90/365” with no native caveat. 390 screenshot of `/pricing` first fold. Chapter two on the same page is already honest about Goals. | In-the-fee line 2 → `Median ticket next to native returning sales $`. |
| 7 | FAQ JSON-LD RCI Q | “Mcfly is one Admin desk: median ticket, returning dollars, and month/quarter/year on the same board.” | Match visible uniqueness: median leftover, returning $ sits next to ShopifyQL. |
| 8 | `Grow+` plan name | “Grow+ staff can be Dashboards only (Overview + Live view)” | Help Center plan is **Grow** (5 users). Dashboards permission text is correct. Say `Grow`. |
| 9 | Custom inquire 404s | `/inquire` `/packages` `/waitlist` 404. `/custom` 301 `/`. 404 OG: “That URL isn’t part of the Total ROAS story.” | 301 those leftovers home. 404 OG sales-first, not Total ROAS. |
| 10 | Privacy date + spend-first legal chrome | Privacy “Last updated: July 28, 2026” + “to show Total ROAS”. Cookies/DPA/terms Sep 22. `site.css` still on privacy/cookies/dpa/terms/support. “rules-based allocation” in privacy why-we-process + terms. | Stamp privacy Sep 22. OG/lede sales-first. Allocation only if Spend still ships it. Collage destyle is a rebuild, not this leftover patch. |
| 11 | Home spend tiles are still `/demo` CTAs | `<a class="live-slice" href="/demo?tab=spend">` wrapping 3.60×. YoY cards are `<article>` (v35). | Spend/ROAS/BE tiles → `<article>` like YoY. |
| 12 | FAQ H1 craft | `0 reviews. Median ticket.` | Restore `FAQ`. Reviews stay in the rhythm line. |

---

## Per-page (hostile merchant)

### `/` — WARN leftover uniqueness in chrome, PASS on SAMPLE / stars / 0×

v38 hero lede (22:33Z, do not recook):

> “Median ticket, returning dollars, weekends — from orders you already have. Spend optional. No pixel.”

v40 hero (22:47Z, 390 + desktop screenshots):

> Kicker: “Typical order · returning dollars · spend optional”

> H1: “Deeper Shopify numbers Analytics does not show.”

> Lede: “Typical order is the leftover median — Shopify AOV is the mean. Returning dollars sit next to ShopifyQL returning sales $. Spend optional last — empty paints —.”

> Chips: “Reviews 0 · $39 after 7-day · No pixel · App Store card still says ad spend”

SAMPLE lock present: typical `$631`, returning `$45,409`, weekend `23%`, month `$68,457` vs `$69,891`. Caption: “Total ROAS lives on Spend · empty = —”. Share block: “Not a Slack bot.” Staff FAQ names Grow+ Dashboards + Basic has no staff seat.

390 CSS: `.hero--v25 .dd-kpi-grid--hero { grid-template-columns: minmax(0, 1fr); }` — v35 2-col overflow is dead. Desktop is 2+1 (typical full-width, returning + weekend). Phone chrome = brand + hamburger.

### `/faq` — FAIL uniqueness intro

H1 `0 reviews. Median ticket.` Lede still the pre-v38 bundle. Q2 honest. RCI Q still uniqueness-sells returning dollars. “Not a parked calculator.” Empty spend —. COGS refused. Staff/Grow+ same as home.

### `/pricing` — PASS fee honesty / WARN uniqueness in the screenshot card

H1 locked: “7-day free trial. Then $39/month.” CFO card present. Reviews 0. No Free plan. Not in the fee: pixel / MTA / COGS / P&L / Slack posts. In the fee still lists weekends + LTV 30/90/365. SAMPLE `$68,457` / `$19,023` / `3.60×`. “Empty spend paints —, never 0×.”

### `/product` — FAIL Goals leftover / PASS H1

H1: “Median ticket. Not Shopify AOV.” Opening lede names ShopifyQL + RCI + leftover median. Then contrast-lede + table Goals leftover (P0). SAMPLE Snowdevil only.

### `/about` — WARN uniqueness lede / PASS Goals door + Custom park

Same locked H1. Lede sells weekends / days-to-second / LTV. Goals door honest. “Custom Data Solutions is parked; this firm sells the Shopify desk only.” Reviews 0. Empty —.

### `/demo` — PASS SAMPLE / WARN calendar vs stills

H1: “Full Snowdevil SAMPLE demo.” Iframe `https://mcfly-analytics.fly.dev/demo?hosted=1`. Meta SAMPLE `$68,457` · `$19,023` · `3.60×`. Caption: stills are Sep 1–16; iframe moves with the calendar; BE is 1 ÷ typed margin, not a 40% floor; empty = —. No Harbor/Northline.

### `/support` — PASS Sample\|Live + no Slack bot / WARN collage

Keeps `There is no Sample|Live toggle.` “Mcfly never posts to Slack and never sends mail.” Empty paste —, not 0×. Loads `site.css` + `mcfly.css`. Gmail `mcflyadsmmm@gmail.com` as inbound (ops leftover, not this hunt).

### `/privacy` `/cookies` `/dpa` `/terms` — PASS fonts/waitlist/calculator / WARN dates + Total ROAS chrome

Cookies: “Local fonts — … No Google Fonts CDN.” DPA: “Fonts are local files on this host, not Google Fonts CDN.” Terms: no downloadable calculator; “Parked calculator URLs 301 to Pricing.” “there is no Sample|Live toggle on this host.” Privacy last updated July 28. No waitlist/FormSubmit. Legal pages lack `mcfly-version`.

### Parked hops

| URL | Live |
| --- | --- |
| `/custom` `/lab` `/monday-close` `/cash-mer` `/advanced-mds` `/mds-made-easy` | 301 `/` |
| `/mer-calculator` `/break-even-roas-calculator` `/calculator` | 301 `/pricing` |
| `/mer-calculator.html` | 308 → `/mer-calculator` → 301 `/pricing` |
| `/inquire` `/packages` `/waitlist` | **404** |

---

## Competitor stars (same hour as v40 re-probe)

| Listing | Live card | Site table |
| --- | --- | --- |
| Mcfly `mcfly-analytics-public` | 0.0 (0 Reviews). Spend-first “cash desk”. | Reviews 0. Chip discloses listing mismatch. |
| TrueProfit | **4.9 (898)** from $35 | 4.9 (898) |
| Polar | 4.9 (117) from $750 GMV | 4.9 (117) / $750 |
| Triple Whale | 4.1 (91). Free / Foundation $219 / Automate $749 | match |
| Lifetimely | 4.9 (538). Free / $49 / $149 / $299 (3,000 orders) | match |
| Repeat Customer Insights | 5.0 (14) from $59 | 5.0 (14) |

Do not invent Mcfly 4.9. Listing 1.1.4 spend-lead is **disclosed**, not cooked. Marty Partner Save. Cursor does not Submit.

Staff seats: [Help Center user limits](https://help.shopify.com/en/manual/your-account/users/users-plan-requirements) — Basic 0, Grow 5. [Dashboards permission](https://help.shopify.com/en/manual/your-account/staff-accounts/staff-permissions/staff-permissions-descriptions) — Overview + Live view. Reports permission is all reports.

---

## v38 HTML that v40 already ate (do not harvest as live)

From first curl of `/` at 22:33Z:

```html
<p class="lede lede--tight">Median ticket, returning dollars, weekends — from orders you already have. Spend optional. No pixel.</p>
```

Proof chips then: “Reviews 0 · Listing live · $39/store/mo · 7-day trial · No pixel” — no listing-mismatch chip yet.

---

## Refuse (parent)

- Do not change locked home H1.
- Do not invent reviews.
- Do not unpark Live or execute ShopifyQL-wait.
- Do not 200 Custom inquire.
- Do not merge this branch into a site cook. This file only.
