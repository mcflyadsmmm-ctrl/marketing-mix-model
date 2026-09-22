# Site third-party audit — 2026-09-22

**Role:** Hostile stranger + App Review 1.1.4 + $5M Saturday operator. Public **website** only.  
**Tip this note is about:** `92a278b` / Fly **v433** / Live **PARKED** (`MCFLY_SAMPLE_ONLY=true`). Site-only. Do not Fly. Do not Pages-deploy. Do not unpark.  
**Painted IA:** Overview → Orders → Customers → Spend → Goals. Growth / LTV are Customers chips.  
**Price:** One plan **$39**/store/month after 7-day trial. No Free plan. No GMV ladder.  
**Trial depth:** Trial = **90 closed days** of order rows. Paid = up to **24 months**. Never “full-access.” Never 24 months on trial.  
**Religion:** Total ROAS = Shopify Total Sales ÷ entered spend, or —. Never 0×. SAMPLE = Snowdevil, labeled. Canonical marketing **https://mcflyads.com**. App URL **https://mcfly-analytics.fly.dev**. Listing handle `mcfly-analytics-public`. Reviews **0** (do not invent).

Fetched **2026-09-22** with Chrome UA. urllib without UA is 403 on Pages; curl with Chrome UA is 200. Quotes below are copied from the live HTML (or from a headless Chrome first-fold of that HTML). Nothing in quotation marks was written for this file.

## Floor — reciting these names as the whole note is FAIL

Already scored on `docs/ops/SCOREBOARD.md` at this tip. **Do not recook desk.** Phone six-figure wrap (Customers LTV 30/90/first-year + Orders weekly ledger under 36rem) is the **next desk cook**. Out of scope. Snowdevil `$68,457` does not prove a six-figure cell fits. Do not edit `app/**`, `fly.toml`, `shopify.app.toml`, `LIVE_UNPAID_INGEST_DAYS`, or SCOPES.

Harbor Home Co is **not** on the live spine. Reciting Harbor as a live home find is FAIL. Reciting eleven top tabs as shipped is FAIL — the painted rail on `/demo` is five + Settings. Reciting `~60 days` as live home copy is FAIL — Fly `GET /app` is the recovery shell; Pages `/app` 301s to `/product`.

## Pages vs Fly (one line, then the table)

**mcflyads.com Pages is a diverged stale fork (v31 iframe hero + 24-month trial lie). fly.dev site/ at v433 matches this git tree (v30 widget + 90/24 honest) — except FAQ / support / llms still sell a desk the painted app does not ship.**

| Surface | Pages `mcflyads.com` | Fly `mcfly-analytics.fly.dev` |
| --- | --- | --- |
| Home `<meta name="mcfly-version">` | **v31** | **v30** |
| Home bytes | 10,809 | 20,863 |
| Facts strip | **“24 months · Order history on trial”** | **“90 days · Order history on trial”** |
| Home close | “Trial includes 24 months of order history.” | “Trial is 90 days of order history. Paid is up to 24 months.” |
| `full-access` | Home JSON-LD + pricing + product + FAQ + support + privacy + terms + `llms-full.txt` | **Absent** on those URLs |
| Home first fold | Iframe `https://mcfly-analytics.fly.dev/demo?hosted=1#mcfly-chart` | Static SAMPLE widget `$631` / `$68,457` |
| `/lab` | 301 → stale home | **200** Northline `$98,500` · **4.19×** |
| `/custom-analytics` | 301 → stale home | **200** Custom Data Solutions |
| Privacy / terms / support 90/24 | full-access, no 90 | 90 closed days vs paid 24 months |
| `/demo` | Thin chrome + iframe of Fly `/demo?hosted=1` | The actual SAMPLE desk |

Listing **Website** on 2026-09-22 is `https://mcfly-analytics.fly.dev` (zero `mcflyads.com` hrefs in the listing HTML). Privacy + Support are Fly. **Terms is not linked.** App Review who follows listing URLs sees Fly. A $5M operator who Googles the brand sees Pages.

## First fold — 8 seconds, ~1280px and ~390px

### Canonical Pages `https://mcflyads.com/` (~1280px)

Nav: Demo · Pricing · About · **INSTALL**.  
Kicker: **“MCFLY ANALYTICS · SPEND NEXT TO SALES.”**  
H1: **“Deeper Shopify numbers Analytics does not show.”**  
Lede: “Typical order, returning dollars, weekends, LTV — then Total ROAS when you add spend. No ad-network login.”  
CTAs: **Install** · Try the demo · “$39/store/mo after 7-day trial.”  
Hero is not the `$68,457` lock. It is a live iframe of `/demo#mcfly-chart`: **“Shopify Total Sales YTD $1,161,719”**, **“SALES EXPLORER Last 30 days · $103,993 total · 169 orders”**, SEP 22 **$5,123**, AOV **$615**. Period chips include **1y**. SAMPLE chip is not in the first-fold screenshot. Figcaption (below the iframe) still says “spend $19,023 · sales $68,457 · 3.60×.”

Would they Install? Maybe — then they hit a spend-led listing. Would they bounce? If they can read: the caption and the iframe disagree in the same fold.

### Canonical Pages home (~390px)

The fold is a **broken iframe**. A **“THIS YEAR $1,161,719 +14% / LY $1,020,414”** card paints **above** the Mcfly hamburger. H1, Install, $39, and SAMPLE are **not** in the first 844px. A $5M operator on a Saturday phone sees a million-dollar year and a hamburger. They bounce.

### Fly `https://mcfly-analytics.fly.dev/` (~1280px / ~390px)

Same kicker / H1 / Install / $39. Right rail is the **labeled SAMPLE** widget: Snowdevil · SAMPLE · Typical order **$631** · Returning **$45,409** · This month **$68,457** · This year **$918,649**. Caption: “SAMPLE · not a live client · Total ROAS lives on Spend · empty = —.” Phone still shows Install + SAMPLE `$631` in the first screen. This is the fold Pages should have. It is **not** what mcflyads.com serves.

### `/demo` iframe (Pages chrome + Fly desk)

Yellow banner (Fly desk, inside the iframe): **“Sample data · Snowdevil example sales so you can click around. Not this shop’s Shopify sales. Live is parked until launch.”**  
Pages hero (same URL): **“Install opens this shop’s Live book only. no Sample|Live toggle.”**  
Desktop ~1280: five tabs + Settings + chips YoY glance / Chart / Mix close / YoY year. Look-here-first typical **“around $597.”** Shopify Total Sales card **$103,993**. Hero still locks **$68,457**.  
Phone ~390: chrome + three CTAs + parked banner + pill wrap. The money card is a clip at the bottom. **Toy chrome. Not an enterprise first fold.**

Do not recook the desk phone wrap. The **site** leftover is the Pages `/demo` hero (three CTAs + long lock + BE@40%) eating the fold, and the home v31 iframe that dumps `#mcfly-chart` into a 390px marketing page.

## Listing vs site vs parked Live (1.1.4)

Live `https://apps.shopify.com/mcfly-analytics-public` (2026-09-22, Chrome UA):

- Title / og:title: **“Ad spend next to store sales — Total ROAS +…”**
- Hero: **“See every ad dollar next to Sales. Total ROAS, LTV, and deep customer insights on one desk.”**
- Feature bullet (public): **“Flat $39 with Goals and 7/14/28 allocation — price stays put as you grow”**
- Pricing card: “7-day free trial, then $39/month”
- Data access: **“View orders All order history”**
- JSON-LD description: **“Put Meta, Google, TikTok, and billboard spend next to Shopify sales. … Flat $39. No pixels.”**
- Rating **0.0 (0 Reviews)** — do not invent
- “More apps like this” includes **Parkour: Facebook Pixel**
- **No Overview / Orders / Customers** in the listing body
- **No 90 vs 24** anywhere
- Website = Fly origin, **not** mcflyads.com. Terms URL **absent**. Privacy + Support = Fly.

Site Install (Pages and Fly) is `https://apps.shopify.com/mcfly-analytics-public`. The marketing H1 sells Analytics depth. The listing sells spend. 4.2.3 wants **no plan price in feature bullets**; `$39` is in a feature bullet today. 1.1.4 wants listing, site, and app to match. They do not.

## Stale leftover hunt (live, not folklore)

| Leftover | Pages | Fly site/ | Verdict |
| --- | --- | --- | --- |
| Harbor | Miss | Miss on spine | Dead. Do not recook. |
| Eleven top tabs | Miss | Miss on `/demo` rail | FAQ + support still name Email Overview / Spend Allocation / “Spend, Overview, LTV, Goals” |
| `~60 days` | `/app` 301 → product | `GET /app` = recovery shell | File leftover `site/app.html` only. Not a live spine cook. |
| full-access | **Live on pricing, product, FAQ, support, privacy, terms, llms** | Clean on those URLs | Pages deploy. |
| 24 months on trial | **Home facts strip + close + product ×3** | Honest 90 / paid 24 | Pages deploy. |
| Northline 4.19× | `/lab` 301 home | **`/lab` 200** | Fly leftover. Listing Website is Fly. |
| Custom packages on home | Miss | Miss | Fly `/support` still inquires Custom Data Solutions |
| BE@40% as pledge | Demo hero “BE 2.50× @ 40%” | Same lock, SAMPLE-labeled | Not a Settings pledge. Still a demo-hero shout. |
| Sample\|Live toggle | Correctly denied | Correctly denied | Demo banner also says Live is parked — which fights “Install opens Live.” |
| Spend-first hero | Kicker + “Upload spend → see Total ROAS → hit Goals.” | Same | Both origins. |

## Trust pages vs listing URLs

Partner paste wants Website = `https://mcflyads.com`, Privacy / Support / Terms = Fly. Live listing: Website = **Fly**, Privacy = Fly `/privacy`, Support = Fly `/support`, **Terms not on the page**. Fly trust pages are 90/24 honest. Fly `/support` still points “Trust URLs” at **mcflyads.com**/privacy · /support · /terms — the stale origin. App Review who opens listing Support, then clicks those links, lands on Pages full-access.

---

## Twelve site cooks

Ranked by **Install conversion / App Review 1.1.4**, not nits. Files under `site/` only. Do not recook desk.

### 1. Canonical mcflyads.com still sells a 24-month full-access trial the parked app cannot keep

**Merchant:** “The website said trial includes 24 months of order history and seven days of full access. I installed. Order rows stopped at 90 closed days.”

**Evidence (live Pages, Chrome UA, 2026-09-22):**

- `https://mcflyads.com/` facts strip: **“24 months Order history on trial.”** Close: **“Trial includes 24 months of order history.”** JSON-LD still contains **full-access**.
- `https://mcflyads.com/pricing`: “seven days of **full access**, then $39/store/mo.” Plan card: **“After a 7-day full-access trial.”** Bullet: **“Trial includes 24 months of order history.”**
- `https://mcflyads.com/product`: **“Trial includes 24 months of order history”** three times. Close: **“7-day full-access trial, then $39/store/mo.”**
- FAQ / support / privacy / terms / `llms-full.txt` on Pages: **full-access**, no 90.

Fly home / pricing / product / privacy / terms already say 90 vs 24. `site-go-live.test.ts` already locks index + pricing. Pages was not deployed.

**Why a $5M store bounces:** They install for YoY and first-year LTV. The unpaid till is 90 closed days. That is a 1.1.4 listing/site/app mismatch, not a copy nit.

**PASS** one Pages deploy of the Fly-honest tree for home / pricing / product / FAQ / support / privacy / terms / llms. **HOLD** lengthening `LIVE_UNPAID_INGEST_DAYS`. **REFUSE** “full-access” as a synonym for “the five tabs exist.”

**Files:** `site/index.html` (already honest in git — **Pages is the leftover**), `site/pricing.html`, `site/product.html`, `site/faq.html`, `site/support.html`, `site/privacy.html`, `site/terms.html`, `site/llms-full.txt`. Extend `app/app/lib/site-go-live.test.ts` so FAQ / product / support cannot say “Trial includes 24 months” or “full-access.”

### 2. Install CTA dumps a sales-first site onto a spend-led listing that still prints $39 in a feature bullet

**Merchant:** “Your site said deeper Shopify numbers Analytics does not show. The App Store page said see every ad dollar next to Sales, and put $39 in a feature.”

**Evidence:** Site primary CTA (Pages + Fly, `chrome.js` + home) → `https://apps.shopify.com/mcfly-analytics-public`. Live listing title **“Ad spend next to store sales.”** Hero **“See every ad dollar next to Sales.”** Feature **“Flat $39 with Goals and 7/14/28 allocation.”** Data access **“All order history.”** og:description **“Flat $39.”** Painted tabs are not in the listing body.

**Why a $5M store bounces:** They wanted Overview YoY at $0 spend. They got a spend desk next to Pixel-neighbor apps. Reviewer 4.2.3 / 1.1.4 reads the same page the Install button opens.

**PASS** Marty paste of `docs/ops/LISTING_LIVE_PASTE.md` (sales-first, **no $ in feature bullets**, 90 vs 24, Overview · Orders · Customers). Site cook: stop promising “Install opens this shop’s Live book” until Live is unparked, and do not let site kicker “Spend next to sales” + listing hero say the same spend-first sentence while the H1 says the opposite. **HOLD** inventing reviews. **REFUSE** pixels to “match” the listing.

**Files:** `site/index.html` (kicker + Install), `site/assets/mcfly/chrome.js`, `site/demo.html` (Install + “Live book”). Listing paste is human — Cursor does not Submit.

### 3. Pages v31 home iframe is a $1.16M unlabeled SAMPLE chart that fights the $68,457 caption — phone has no Install

**Merchant:** “Your homepage showed this year $1,161,719. The caption said $68,457. On my phone I never saw Install.”

**Evidence:** Pages home HTML: iframe `src="https://mcfly-analytics.fly.dev/demo?hosted=1#mcfly-chart"`. Figcaption: “spend $19,023 · sales $68,457 · 3.60×.” Headless 1280px first fold: YTD **$1,161,719**, last 30 days **$103,993**, SEP 22 **$5,123**, chip **1y**. Headless 390px: year card **above** the hamburger; H1 / Install / $39 clipped out. Fly home (this git tree) still paints the static SAMPLE widget `$631` / `$68,457` with a SAMPLE chip. Pages **v31** is not this tree’s `site/index.html` (v30).

**Why a $5M store bounces:** Two year numbers, no SAMPLE on the money, 1y implied on a product whose trial is 90 days. Phone never reaches the CTA.

**PASS** kill the Pages-only iframe hero. Ship the Fly v30 labeled widget, or a static shot of it. **HOLD** changing SAMPLE generator dollars to “match” the explorer. **REFUSE** using Live Admin as the marketing iframe while PARKED.

**Files:** Pages-only HTML (not in `92a278b`). Do not add `home-desk-frame` to `site/index.html`. `site/demo.html` should not be the home fold.

### 4. Site says Install opens this shop’s Live book. `/demo` banner says Live is parked until launch.

**Merchant:** “The demo told me Live is parked until launch. Pricing told me Install opens this shop’s Live book.”

**Evidence:**

- Fly `/demo` banner: **“Live is parked until launch.”**
- Pages + Fly `site/demo.html`: **“Install opens this shop’s Live book only.”**
- Fly `site/pricing.html`: **“Install opens this shop’s Live book — Shopify sales + the spend you upload.”**
- Fly `site/support.html`: **“install = this shop’s Live book”** and **“After install, Admin is this shop’s Live book.”**
- Product truth: Fly is still `MCFLY_SAMPLE_ONLY=true`.

**Why a $5M store bounces:** They Install from a parked host. SAMPLE is not their shop. 1.1.4.

**PASS** site copy: SAMPLE is `/demo`; Live Admin is this shop **when unparked**; today the public host is SAMPLE-only. Keep “no Sample|Live toggle.” **HOLD** unparking to make the sentence true. **REFUSE** a Sample|Live switch in Admin.

**Files:** `site/demo.html`, `site/pricing.html`, `site/support.html`, `site/product.html`, `site/faq.html` (“install is this shop’s Live book”), `site/index.html` if it implies Live on Install.

### 5. SAMPLE lock, explorer, and look-here-first disagree in public

**Merchant:** “You locked $68,457 and 3.60×. The desk showed $103,993 and typical around $597. The homepage iframe showed $1,161,719.”

**Evidence:** Home (Fly) lock + pricing tile: spend **$19,023** · sales **$68,457** · **3.60×** · typical **$631**. `/demo` look-here-first: **“Typical order around $597.”** Overview card: **$103,993**. Pages home iframe: YTD **$1,161,719** / 30d **$103,993**. All labeled SAMPLE Snowdevil on some surface, not on the Pages iframe fold.

**Why a $5M store bounces:** They will not trust Total ROAS = sales ÷ spend if the marketing site cannot pick one sales number for one SAMPLE window.

**PASS** one public lock (this-month Total Sales + typical + spend) on home, `/demo` hero, and pricing tile. Explorer YTD is a different window — name it or do not put it in the marketing fold. **HOLD** recooking SAMPLE math. **REFUSE** fake $0 last year to force the year card.

**Files:** `site/index.html`, `site/demo.html`, `site/pricing.html`. Not `app/**`.

### 6. Listing-trust Support still sells Spend / Overview / LTV / Goals and Custom Data Solutions

**Merchant:** “App Store Support said the whole desk is Spend, Overview, LTV, Goals, and asked if I wanted Custom Data Solutions. The app I installed has Overview, Orders, Customers, Spend, Goals.”

**Evidence:** `https://mcfly-analytics.fly.dev/support` (listing Support URL, matches git):

- Trust chip: **“Custom inquire · Non-Shopify desks → Custom Data Solutions”**
- Price FAQ: **“the whole desk (Spend, Overview, LTV, Goals)”**
- Bottom: **“Inquire for Custom Data Solutions →”** `href="/custom-analytics#inquire"`
- Trust URLs: **mcflyads.com**/privacy · /support · /terms (stale Pages)

Pages `/support` dropped Custom inquire and still says **full-access**.

**Why a $5M store bounces:** Reviewer 1.1.4. Operator who is not shopping a $5–25K custom desk.

**PASS** painted five tabs on Support + FAQ. 301 Custom inquire (already on Pages `_redirects`; Fly serves the file). Point trust URLs at the Fly origins the listing uses, or deploy Pages first so mcflyads.com matches. **HOLD** unshelving Custom. **REFUSE** Custom packages on home.

**Files:** `site/support.html`, `site/faq.html`, `site/_redirects` (Pages-only — Fly needs an equivalent or delete `site/custom-analytics.html` from the Fly static tree), `site/lab.html`.

### 7. FAQ still describes the eleven-tab-era desk on the honest Fly origin

**Merchant:** “FAQ said Spend Allocation pie, Email Overview mailto, LTV / Acquisition. I opened five tabs and Settings.”

**Evidence:** `https://mcfly-analytics.fly.dev/faq` = git `site/faq.html` `#desk-tabs`:

> “Total ROAS · break-even · Spend CSV · **Spend Allocation (pie + rolling 7/14/28)** · Goals (MTD/QTD/YTD + monthly board) · **LTV / Acquisition** · **Email Overview (mailto with period cards).**”

JSON-LD: **“Spend, Overview, LTV, Goals — whole desk.”**  
Visible cost line is 90/24 honest. The **tabs** are not. Pages FAQ was rewritten to “Five analysis tabs… Overview · Orders · Customers · Spend · Goals” and still says **full-access**. Two origins, two lies.

**Why a $5M store bounces:** They evaluate tabs in 8 seconds. FAQ is the listing-adjacent page Google still has (`noindex` on the page; JSON-LD still ships).

**PASS** one FAQ body: five tabs + Settings; Growth/LTV are Customers chips; mix/CPA/YoY live on those pages. Keep 90/24. **HOLD** bringing back Email Overview. **REFUSE** eleven tabs.

**Files:** `site/faq.html` (visible + JSON-LD). `site-go-live.test.ts` does not lock this — that is why v431 left it.

### 8. `/demo` on a phone is a chrome toy; desktop is a real desk that still fights the hero lock

**Merchant:** “On my phone /demo was three buttons and a parked banner. I never saw the year board. On desktop I saw $103,993 under a hero that said $68,457.”

**Evidence:** `site/demo.html` hero (Install + “Open the full Snowdevil desk” + “Pricing — $39/mo”) plus SAMPLE lock plus **“BE 2.50× @ 40%.”** CSS `.demo-live-frame { min-height: 70vh }` at `max-width: 719px`. Headless 390px: money clipped. Headless 1280px: enterprise-density Overview, SAMPLE labeled, Live parked named — then the $103,993 vs $68,457 fight. `demo.html` tab map still deep-links `cpa`, `allocation`, `yoy`, `growth`, `ltv` as if they were top tabs.

**Why a $5M store bounces:** Saturday phone. If Demo is the nav item next to Install, the first fold has to be the desk, not the marketing paragraph.

**PASS** shrink `/demo` chrome on phone (one line SAMPLE + one Install). Keep the iframe. Align hero dollars with Overview. **HOLD** desk phone six-figure wrap (SCOREBOARD next). **REFUSE** a second SAMPLE shop.

**Files:** `site/demo.html`, `site/assets/mcfly/mcfly.css` (`.demo-live-frame`, `.page-hero--demo-tight`).

### 9. How-it-works and the kicker still lead spend on a sales-first H1

**Merchant:** “You said deeper numbers Analytics does not show. Then how it works was upload spend → see Total ROAS → hit Goals.”

**Evidence:** Fly + Pages home kicker **“Spend next to sales.”** H2 **“Upload spend → see Total ROAS → hit Goals.”** `chrome.js` footer: **“Mcfly Analytics — spend next to Shopify sales.”** Listing hero is the same religion. Painted product: Overview / Orders / Customers at $0 spend; Spend last.

**Why a $5M store bounces:** They already have Triple Whale for spend theater. The install reason is YoY / typical / returning $ / LTV. Spend as chapter two is the product. Spend as the kicker is the listing leftover.

**PASS** kicker + how-it-works = Overview first (this month vs last year, typical, returning $), spend optional. Keep empty = —. **HOLD** deleting Spend from the site. **REFUSE** pixels / true ROAS to make the kicker “true.”

**Files:** `site/index.html`, `site/assets/mcfly/chrome.js` footer, `site/about.html` if it repeats the spine.

### 10. Fly still serves Northline 4.19× `/lab` because `_redirects` is Pages-only — and listing Website is Fly

**Merchant:** “Your app website opened a lab: Invoice $98,500. Cash 4.19×. Northline Supply. I thought that was the product.”

**Evidence:** `GET https://mcfly-analytics.fly.dev/lab` 200, title **“SAMPLE lab — $98,500 spend, cash 4.19× vs platform ~4.8×.”** Copy: **“SAMPLE Exec / CFO · Northline Supply signed spend $98,500 · cash 4.19×.”** Pages `/lab` 301s to the stale home (`site/_redirects`). Listing Website = Fly, so App Review can find `/lab` without Google.

**Why a $5M store bounces:** Wrong SAMPLE, wrong ROAS, Custom Data Solutions $5–25K in the meta description. Harbor is dead; **Northline is live on the App URL origin.**

**PASS** Fly-side 301 `/lab` `/custom-analytics` and the parked lander list to `/` (or stop shipping those HTML files with the app). **HOLD** deleting the files from git until Pages + Fly both 301. **REFUSE** putting 4.19× on home.

**Files:** `site/lab.html`, `site/custom-analytics.html`, `site/lead-gen-desk.html`, `site/_redirects`, plus the Northline lander set `site-sample-lock.sh` already hates on `/`.

### 11. `llms-full.txt` still teaches AI the Buyers / Timing / Marketing desk

**Merchant:** “ChatGPT cited your llms file: Overview, Orders, Buyers, Timing, Goals, Marketing. That is not the app.”

**Evidence:** Fly `https://mcfly-analytics.fly.dev/llms-full.txt` (git): **“Desk: Overview, Orders, Buyers, Timing, Goals, Marketing (spend optional).”** 90/24 honest in the lede. Pages same file still **“7-day full-access trial”** + the same six names. `site/llms.txt` is closer (product URLs only) and still leads “ad spend beside Shopify sales.”

**Why a $5M store bounces:** AI answers are the new first fold. Wrong IA in the citeable summary is 1.1.4 for machines.

**PASS** painted five tabs + 90/24 in `llms-full.txt` / `llms.txt`. **HOLD** writing new SEO landers. **REFUSE** invented installs in GEO copy.

**Files:** `site/llms-full.txt`, `site/llms.txt`.

### 12. Product still lists Amazon as a named spend platform on the public desk page

**Merchant:** “Product listed Amazon next to Meta and Google. I thought you read Amazon.”

**Evidence:** Fly + Pages `/product` platform list includes **`<li>Amazon</li>`** (with Apple Search, Impact/CJ, Klaviyo/Mailchimp). Religion: refuse Amazon as a product promise. Paste-first spend can take an Amazon Ads CSV without selling Amazon analytics. The public list does not say that.

**Why a $5M store bounces:** They will ask where Amazon orders went. We will say Shopify only. Uninstall.

**PASS** named platforms = ad accounts you can paste (and say Shopify sales only). **HOLD** Amazon Ads as a CSV column in the template. **REFUSE** Amazon Seller / Vendor as a second ledger.

**Files:** `site/product.html`. Not the mer-engine channel map.

---

## Verdicts in one place

| # | Pain | Origin | Verdict |
| --- | --- | --- | --- |
| 1 | Pages 24-month / full-access trial | Pages | **PASS** Pages deploy of Fly-honest copy. **HOLD** the 90. |
| 2 | Install → spend-led listing + `$39` feature bullet | Site CTA + listing | **PASS** listing paste (human). Site kicker must not agree with the old listing. |
| 3 | v31 home iframe $1.16M / phone clip | Pages only | **PASS** drop iframe. Ship v30 labeled widget. |
| 4 | Install = Live book vs PARKED | Both | **PASS** name parked. **HOLD** unpark. |
| 5 | SAMPLE $68,457 vs $103,993 vs $1.16M | Both | **PASS** one public lock. **HOLD** generator recook. |
| 6 | Support tabs + Custom inquire | Fly listing URL | **PASS** painted tabs. 301 Custom on Fly. |
| 7 | FAQ Email Overview / Spend Allocation | Fly = git | **PASS** five tabs. |
| 8 | `/demo` phone chrome toy | Both | **PASS** shrink chrome. **HOLD** desk phone wrap. |
| 9 | Spend-first kicker / how-it-works | Both | **PASS** Overview first. |
| 10 | Fly `/lab` Northline 4.19× | Fly | **PASS** 301 with the app. |
| 11 | llms Buyers / Timing / Marketing | Both | **PASS** painted IA. |
| 12 | Amazon on `/product` | Both | **PASS** Shopify-only wording. **REFUSE** Amazon ledger. |

## Not cooks (so the next agent does not “find” them)

- Harbor on home — gone.
- Custom packages on home — gone.
- Sample\|Live toggle as a shipped control — correctly denied in copy.
- Empty spend as 0× on spine pages — Pages and Fly both say —.
- Invented stars / installs / GMV — listing is **0.0 (0 Reviews)**. Do not write a number.
- Fly privacy / terms 90/24 — already honest. Pages is the leftover.
- Desk phone six-figure wrap — SCOREBOARD next. Out of scope.

## What “site perfection” actually is from here

1. **Marty/Mac Pages deploy** of this tree so mcflyads.com stops lying about 24 months and full-access. That is the 1.1.4 P0. No new craft.
2. **Marty listing paste** so Install does not open a spend-led `$39`-in-a-bullet page. Cursor does not Submit.
3. **Then** the git leftovers this Fly already ships: FAQ tabs, support Custom, llms IA, `/lab` on Fly, `/demo` chrome, home kicker, Amazon `<li>`, SAMPLE lock vs explorer.
4. Do not Fly v434 for a site sentence. Do not unpark Live to make “Live book” true. Do not recook the desk.

Fetched: Pages `/` `/pricing` `/product` `/demo` `/faq` `/about` `/support` `/privacy` `/terms` `/lab` `/llms-full.txt`; Fly `/` `/pricing` `/privacy` `/support` `/terms` `/demo` `/product` `/faq` `/lab` `/health`; listing `apps.shopify.com/mcfly-analytics-public`. Chrome UA. Headless first-folds 1280/390 on Pages home, Fly home, Pages `/demo`.
