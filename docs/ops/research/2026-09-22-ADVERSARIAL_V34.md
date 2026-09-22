# Adversarial live audit — mcflyads.com v34

**Date:** 2026-09-22T21:41Z · America/Denver  
**Role:** third-party Shopify App Store reviewer + brand-design critic. Not Mcfly.  
**Assume:** the team is overconfident. Fail them.  
**Method:** live `curl -sSIL` + HTML extract of `/` `/demo` `/pricing` `/product` `/about` `/faq` `/support` `/privacy` `/terms`, hops for parked URLs, OG `https://mcflyads.com/assets/brand/og-analytics.jpg` (HTTP 200, `image/jpeg`, 70021 bytes, 1200×630 sales-first SAMPLE cards), listing `https://apps.shopify.com/mcfly-analytics-public`. Headless Chrome screenshot hung in this VM; overflow FAIL for `/` at 390px is proven in shipped CSS, not vibes.  
**Live stamp:** `mcfly-version` **v34** · `operator-desk-v34` · Pages still serving v34 at crawl time.  
**Locks honored in the cook:** home H1 unchanged · no invented reviews · no Partner Save · no unpark · SAMPLE Snowdevil `$68,457` / `$19,023` / `3.60×` · `$39` / 7-day · Support keeps the exact phrase `no Sample|Live toggle`.

**Overall: FAIL.** Sales-first spine copy is closer than v32. It is not App Store 1.1.4-clean, not Polar-quiet, and not honest about the listing the merchant actually opens.

This file grades **live v34 HTML**. Repo cook to **v35** is listed at the end. Do not treat git as live until Pages.

---

## Listing (1.1.4) — FAIL

Quoted from `https://apps.shopify.com/mcfly-analytics-public` 2026-09-22:

> “Mcfly Analytics - Ad spend next to store sales — Total ROAS +...”

> “See every ad dollar next to Sales. Total ROAS, LTV, and deep customer insights on one desk.”

> “Mcfly Analytics is the cash desk for that gap.”

> “Put Meta, Google, TikTok, and billboard spend next to Shopify sales.” (SoftwareApplication JSON-LD `description`)

> “Pricing $39/month. Free trial available. Rating 0.0 (0 Reviews)”

> “Mcfly Analytics $39 / month Features Spend vs sales on aligned dates All channels, including billboards Customer LTV and Goals board 7-day free trial, then $39/month”

> “No reviews yet”

**Vs site:** home H1 is “Deeper Shopify numbers Analytics does not show.” Lede is typical order / returning dollars / spend optional.  
**Vs desk:** Growth and LTV are Customers chips; five analysis tabs plus Settings; spend optional last; empty spend is —. Listing still sells spend-first Total ROAS + Allocation as the product.  
**Do not fake-match the listing.** Marty Partner Save of the sales-first paste (#192). Cursor does not Submit. v35 **discloses** the mismatch on `/` `/pricing` `/faq` `/about`.

Stars: **0.0 (0 Reviews)** — they did not invent a 4.9. PASS on invented stars. FAIL on 1.1.4 site/listing match.

Public pricing card showed one plan named Mcfly Analytics at $39 + 7-day. WARN: agents cannot see Partner “Free plan” leftover; the public page did not show a Free plan.

---

## Per-page (live v34)

### `/` — FAIL

Quoted:

> “Typical order is the median, not Shopify’s AOV. Returning dollars, not the returning-customer rate. Spend is optional.”

> “Shopify Overview can compare this range to last year. Mcfly keeps this month, this quarter, and this year on one board — last year on the card.”

> “We do not invent Polar $1,020. Mcfly reviews: 0.”

> “Polar’s App Store list price starts at $750/mo and moves with GMV.”

| Hunt | Grade | Proof |
| --- | --- | --- |
| Native Analytics (YoY / AOV / returning / weekends) | **WARN** | YoY is not a lie — they admit Overview can compare one range. Median vs AOV and dollars vs rate are the real gap. |
| Listing match | **FAIL** | Site sales-first; listing spend-first. v34 did not disclose that. |
| Desk (five tabs, Growth/LTV chips, spend optional, empty —) | **PASS** | “Growth and LTV are chips here.” “empty = —” in meta. |
| CTA-in-KPI | **FAIL** | Hero YoY cards were `<a class="dd-yoy__card live-slice" href="/demo">` wrapping `$68,457`. KPI is not a CTA. |
| Collage | **FAIL** | Marketing hero iframes a fake Admin (`demo-desk.css` + `dd-kpi--drill`). Polar does not collage a toy desk into the billboard. |
| Unlinked FAQ | **FAIL** | Home `<details>` count 5. Only “Do you put a pixel…” linked `<a href="/faq">Full FAQ</a>`. Four answers dead-ended. |
| Phone 390 overflow | **FAIL** | `mcfly.css` `@media (max-width: 390px) { .hero--v25 .dd-kpi-grid--hero { grid-template-columns: 1fr 1fr; } }` is more specific than `demo-desk.css`’s 430px 1-col stack. Three KPI buttons at 390 become a 2+1 grid that undoes the phone lock. |
| Polar $1,020 | **FAIL** | “We do not invent Polar $1,020” still plants a number that is not Polar’s public from-price ($750). |
| Harbor / Northline | **PASS** | Not on live home. Snowdevil `$68,457`. |
| 2.50× @ 40% | **WARN** | Break-even still paints `2.50×` with “SAMPLE window · type margin in Settings” — not “@ 40%”. 2.50× is 40% margin math. |
| Reviews / Free plan / full-access | **PASS** | “Mcfly reviews: 0.” No full-access. No Free plan on home. |
| OG vs on-page | **PASS** | `og-analytics.jpg` is SAMPLE typical `$631` · returning `$45,409` · this month `$68,457` vs last year `$69,891`. Matches on-page SAMPLE, not cash-MER collage. |

### `/demo` — WARN

Quoted:

> “SAMPLE Snowdevil — not a live client. No signup. No sales call. Typical order, returning dollars, then five tabs: Overview, Orders, Customers, Spend, Goals. Spend is optional.”

> “Overview same-clock is this hour versus last year, not a full-day compare.”

> iframe `src="https://mcfly-analytics.fly.dev/demo?hosted=1"`

H1 locked “Full Snowdevil SAMPLE demo.” SAMPLE dollars present. Phrase `no Sample|Live toggle` **absent** (tests require it off this page). Collage is the Fly iframe — acceptable for `/demo`. Desktop density is the real desk; craft FAIL belongs to `/`.

### `/pricing` — FAIL (collage) / WARN (1.1.4)

Quoted:

> “7-day free trial. Then $39/month.” (H1 — locked)

> “There is no Free plan. Trial is 90 days of order history; paid is up to 24 months.”

> “Public demo is SAMPLE Snowdevil”

> Loads `/assets/site.css?v=20260829v13` **and** `/assets/mcfly/mcfly.css`

Tier A spine still stacks legacy collage `site.css`. Polar/TW-class FAIL. Copy is sales-first and 90/24 honest. v34 did not disclose the spend-first listing.

### `/product` — WARN

Quoted:

> “Overview → Orders → Customers first — this month vs last year, typical order, returning dollars, weekends, days to second, LTV. Growth and LTV are Customers chips, not extra tabs. Spend is optional last.”

Desk match: PASS. Collage `site.css` + `mcfly.css`: FAIL craft. SAMPLE `$68,457` present. No Harbor / Northline / `@ 40%` / full-access.

### `/about` — WARN

Quoted:

> “Deeper Shopify numbers Analytics does not show.” (H1 — same locked line)

> “Five analysis tabs plus Settings: Overview · Orders · Customers · Spend · Goals. Growth and LTV are Customers chips.”

> “No Free plan. Not a GMV tax.”

> “Empty spend paints — never 0×.”

Paper/sky `mcfly.css` only — craft PASS vs `/pricing`. No `Monday` (test lock). No listing-mismatch disclosure on v34.

### `/faq` — FAIL (JSON-LD vs visible + collage)

Quoted visible Q2:

> “Typical order, returning dollars, weekend mix, days-to-second, and LTV 30/90/365 from orders you already have. Overview’s AOV is the average; Overview’s returning number is a headcount rate. Empty spend paints —, never 0×.”

Quoted JSON-LD Q2 (v34):

> “Typical order, returning dollars, weekend mix, days-to-second, and LTV 30/90/365 from orders you already have. Empty spend paints —, never 0×.”

The headcount/AOV sentence was **visible only**. 1.1.4-adjacent: schema that omits the Analytics contrast. Question order 12/12 matched names. Loads `site.css` + `mcfly.css`. Phrase `no Sample|Live toggle` is not on FAQ (Support only — keep it there).

### `/support` — FAIL (OG + Monday leftover) / PASS (scopes + Sample\|Live)

Quoted:

> “Approve `read_orders` (sales totals), `read_all_orders` (deeper history), and minimal `read_customers` (opaque customer id + `numberOfOrders` only)”

> “There is no Sample|Live toggle.”

> og:description v34: “Email a human for Total ROAS help.”

> “if it’s urgent before a Monday budget call”

Scopes match `shopify.app.toml` (`read_orders,read_customers,read_all_orders`). No `read_reports` claimed. **PASS** scopes. **KEEP** exact `no Sample|Live toggle`. OG was spend-first vs a sales-first desk. Voice ban Monday on a trust URL. Collage `site.css`.

### `/privacy` — FAIL (Google Fonts lie)

Quoted:

> “Google Fonts — font files loaded from Google’s CDN on the marketing site”

Live CSS is `/assets/fonts-local.css`. That is a processor lie. Scopes + `numberOfOrders` + no name/email CRM: PASS. OG was “Total ROAS data diet.” CohortFact table name stays (it is the row); “lifetime value cohorts” in why-we-process was chrome-banned voice.

### `/terms` — FAIL (legal leftovers)

Quoted:

> “Covers https://mcflyads.com, the downloadable calculator, and the Mcfly Analytics Shopify app”

> Jump nav: “Free launch” → `#free-launch` while H2 already said “Trial and billing”

> “connect the Shopify store and ad accounts you authorize”

> “cohort LTV methods” · “The desk (Sample data and Live data)”

Calculators 301 to `/pricing`. There is no ad OAuth. Admin has no Sample|Live toggle. Leftovers.

### Parked legal URLs — PASS (live hops)

| URL | Live |
| --- | --- |
| `/monday-close` | 301 → `/` |
| `/cash-mer` | 301 → `/` |
| `/advanced-mds` | 301 → `/` |
| `/mds-made-easy/` | 301 → `/` |
| `/mer-calculator` and `.html` | 301 → `/pricing` |
| `/break-even-roas-calculator` and `.html` | 301 → `/pricing` |

Repo HTML still self-canonicalizes those files. Live Cloudflare `_redirects` parks them. WARN if redirects ever drop — not a live 200 today.

### `/cookies` `/security` `/dpa` — FAIL leftovers (200)

Quoted cookies:

> “Google Fonts — browser requests to Google’s font CDN”

> “Waitlist form”

Quoted DPA:

> “For waitlist emails sent directly to Mcfly”

> “FormSubmit.co (waitlist fallback), Google Fonts CDN (marketing site)”

These are live 200s. Waitlist is a launch leftover. Fonts are local.

---

## Trust extras

| Claim | Live | Grade |
| --- | --- | --- |
| Invented stars | Listing 0.0 (0 Reviews). Site “Mcfly reviews: 0.” | **PASS** |
| Polar $1,020 | Home planted the number while denying it | **FAIL** |
| Harbor / Northline on home | Absent | **PASS** |
| 2.50× @ 40% | `2.50×` without “@ 40%” | **WARN** |
| full-access | Absent on crawled spine | **PASS** |
| Free plan | Site “No Free plan.” Listing one $39 plan + free trial | **WARN** (Partner picker still human) |
| SAMPLE Snowdevil | `$68,457` / `$19,023` / `3.60×` | **PASS** lock |

---

## v35 cook (this branch — not live until Pages)

Proven leftovers written into `site/*.html` + chrome/CSS:

1. Home YoY cards are `<article class="dd-yoy__card">`, not `/demo` CTAs.  
2. Every home FAQ answer links `<a href="/faq">Full FAQ</a>`.  
3. Drop Polar `$1,020`. Disclose listing spend-lead + reviews 0. Keep Polar from-price `$750`.  
4. FAQ JSON-LD Q2 includes the AOV / headcount-rate sentence. Q11 discloses listing mismatch in visible + JSON-LD.  
5. Terms: no downloadable calculator, jump label “Trial and billing”, no ad-account OAuth, no Sample\|Live dual desk, no cohort-LTV chrome.  
6. Cookies / privacy / DPA: local fonts, no waitlist, no FormSubmit, no Google Fonts CDN.  
7. Support OG sales-first; Monday budget call removed; **`no Sample|Live toggle` kept**.  
8. 390px hero KPI grid `minmax(0, 1fr)` so it cannot beat the 430px stack.  
9. Version `v35` / `adversarial-v35` cache-bust.

**Not cooked (still FAIL if you open live v34, still FAIL as craft after v35):** destyling `/pricing` `/product` `/faq` `/support` off `site.css` (rebuild, not a leftover patch). Partner listing Save. Unpark. Invented reviews. Fly wrap of v35.

**Tests:** `site-go-live` still bans `full-access` and 24-month trial. `site-about-enterprise` still refuses `Monday` on about. Support still contains `no Sample|Live toggle`. Home H1 unchanged.
