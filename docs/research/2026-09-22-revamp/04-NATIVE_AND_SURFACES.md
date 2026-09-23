# 04 — Native Analytics capabilities + listing/site surfaces

**Lane:** SHOPIFY ANALYTICS CAPABILITIES + LISTING/SITE SURFACES  
**Date:** 2026-09-22 (America/Denver)  
**Live probed:** https://mcflyads.com · https://apps.shopify.com/mcfly-analytics-public · Shopify Dev docs via MCP (`shopifyqlQuery`, PCD, ShopifyQL)  
**Codebase note:** scopes intent in `app/shopify.app.toml` = `read_orders,read_customers,read_all_orders,read_reports` · ShopifyQL day totals path exists in `app/app/lib/sales-facts.server.ts` but is gated until `read_reports` + PCD L2 actually return  
**Reviews / installs / visits:** not invented — public listing shows **0 reviews**; site states the same

---

## Executive take

Merchants already get a deep free Analytics + ShopifyQL stack. Mcfly’s durable wedge at $39 is **order-book packaging merchants do not get for free without export** (median ticket, weekend mix next to that ticket, opaque LTV / days-to-second, YoY year board, optional Total ROAS = sales ÷ typed spend) — not “we replace Analytics.” Live App Store copy still sells **ad spend first**; the site sells **Overview → Orders → Customers**. That mismatch is the highest surface EV fix, and it is Marty Save only. Do not claim cold Analytics / ShopifyQL parity until PCD L2 lands.

---

## 1. Native vs Mcfly capability matrix

Sources: Shopify Admin Analytics (merchant-facing), ShopifyQL reference + Analytics build docs, Admin `shopifyqlQuery` (API **2026-07** docs), Mcfly religion + Live desk IA (Overview · Orders · Customers · Spend · Goals).

| Capability | Native Shopify (free / plan-included) | App via Admin Orders GraphQL (`read_orders` / `read_all_orders` + L1 customers) | App via `shopifyqlQuery` (`read_reports` + **PCD L2**) | Mcfly today (promise honesty) |
| --- | --- | --- | --- | --- |
| This-period Total sales | Overview / Reports | Summable from orders (basis must be labeled) | `FROM sales SHOW total_sales` — Analytics-aligned tables | Order-sum / SAMPLE; **QL totals HOLD until L2** |
| Mean AOV | Overview | Mean of order totals | Sales schemas | Can label average; **typical order = median** is the product claim |
| Median ticket | Not a first-class Overview KPI | **Yes** — compute on order book | Not the wedge (QL is aggregates) | **Core claim — keep** |
| YoY / COMPARE TO | Overview range compare; QL `COMPARE TO` / timeseries | Rebuild from order history windows | Native-quality day/month series | YoY board from orders/SAMPLE; do **not** say “ShopifyQL-certified” until L2 |
| Returning customers **rate** | Overview / reports | From `numberOfOrders` / order history | Customer / sales splits in QL | Site already admits native rate exists |
| Returning sales **$** | ShopifyQL / Reports can show returning sales $ | Approximate from order book + guest rules | Preferred for Analytics parity | Honest: “next to ShopifyQL returning $” is a **juxtaposition**, not “we run QL yet” |
| Day-of-week / weekend mix | Reports can Group by day of week | **Yes** — Sat+Sun % of window | Group dimensions in QL | Packaging next to median — **not** “missing native report” (site already says this) |
| Sessions / conversion | Analytics + `FROM sessions` | **No** (orders API ≠ traffic) | Yes via QL | **Never claim** — out of religion |
| Attribution / last-click channel | Some QL / marketing surfaces | No (no pixel zoo) | Possible in QL; not Mcfly | Banned |
| RFM / avg days since last order | Native RFM reports | Partial from order dates | Possible | Days-to-second is Mcfly packaging; don’t claim RFM replacement |
| LTV 30/90/365 (opaque) | Not the same one-desk story | **Yes** from order history (L1 opaque id) | Enrichment later | **Promise now** (trial history depth must match billing truth) |
| Total ROAS = sales ÷ typed spend | Not native as one desk | Sales from orders + merchant spend store | Sales from QL + spend store | **Promise now**; empty = **—**, never 0×; Spend last |
| Goals vs break-even ROAS | Native sales targets on Overview | App Settings + spend | Same | Optional chapter two |
| Embed admin metric cards | Native only | Custom UI | `<s-shopifyql-metric-card>` etc. | Post-L2 roadmap option — not a site claim |

### What merchants get free (compressed)

- **Overview:** period sales, mean AOV, returning rate, pin monthly sales targets, compare this range to last year.
- **Reports + Explore:** day-of-week grouping, many saved reports, export.
- **ShopifyQL editor (admin):** same language apps use — sales, orders, customers, sessions, marketing schemas; `TIMESERIES`, `GROUP BY`, `COMPARE TO`, attribution helpers on some sales queries.
- **Apps platform (post-approval):** `shopifyqlQuery`, analytics web components, model/enrich into Shopify Analytics ([Apps → Analytics](https://shopify.dev/docs/apps/build/analytics)).

### What apps can do without L2 (orders path)

- Ingest/paginate orders (`read_orders`; deep history needs `read_all_orders` when Partner-approved).
- Opaque customer joins (`read_customers` without name/email/phone/address = PCD **Level 1**).
- Build median, weekend %, YoY boards, till LTV, days-to-second, guest vs returning **dollar** heuristics from the stored book.
- Typed/CSV spend + Total ROAS chips.

### What only ShopifyQL unlocks for apps

- Aggregates that match **Analytics definitions** without reinventing refund/net basis (sales day facts).
- Sessions / conversion / traffic (McFly should still refuse as product hero).
- Cheap day totals at scale vs crawling every order for certified Overview parity.

**API version notes**

| Surface | Version observed |
| --- | --- |
| Dev MCP default Admin / shopifyqlQuery examples | **2026-07** |
| ShopifyQL language docs | Published under **2025-10 → 2026-10** (syntax + schemas versioned) |
| Mcfly `shopify.app.toml` webhooks `api_version` | **2025-10** |
| Product implication | Prefer pinning Admin GraphQL client to a single supported version; ShopifyQL body is versioned with the QL docs, wrapped by Admin `shopifyqlQuery` |

---

## 2. ShopifyQL / L2 implications for claims and roadmap

### Hard gate (docs, not folklore)

[`shopifyqlQuery`](https://shopify.dev/docs/api/admin-graphql/2026-07/queries/shopifyqlQuery) requires:

1. Scope **`read_reports`**
2. **Level 2** protected customer data access including **name, address, phone, and email** fields  
   ([Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data))

PCD L2 for a public app = Partner request + Level 1 **and** Level 2 requirement checklist + possible data-protection review. This is independent of “we already declared `read_reports` in TOML.”

Repo reality: sales-facts lane is written for ShopifyQL New/Returning Total Sales $ (`shopifyql_sales_day_v1`) and treats missing L2 / scope as a **reports** failure, not an orders failure. Accuracy checklist **F.\*** stays **HOLD** until L2.

### Claims — do / don’t until L2

| Claim class | Until L2 | After L2 + F-audit PASS |
| --- | --- | --- |
| “Matches Analytics Overview Total sales for this period” | **Don’t** | May — with tolerance table |
| “ShopifyQL returning sales $” as *our* data source | **Don’t** imply we query it | May label certified QL split |
| “Deeper than Overview” via median / packaging | **Yes** | Still yes |
| “Returning dollars sit *next to* ShopifyQL returning $” | Careful: juxtaposition OK if clear we compute from orders | Stronger if side-by-side certified |
| Sessions / conversion / “fix Analytics” | Never | Still never as hero |
| SAMPLE Snowdevil numbers | Marketing only | Still not Live proof |

### Roadmap sequencing (surface-safe)

1. **Now:** Sell order desk + SAMPLE; listing/site sales-first; Total ROAS optional.
2. **L2 approved:** Turn on `shopifyqlQuery` backfill; run Accuracy **F**; only then change copy from “order history” to “Analytics-aligned totals.”
3. **Later optional:** Embed `<s-shopifyql-metric-card>` for trust theater — after F PASS, not as an install bait before approval.

---

## 3. Site convert audit (severity, ranked fixes)

**Probed:** https://mcflyads.com/ (v30-class), `/pricing`, `/demo` (2026-09-22 browse).  
**Brand law check:** Mark **Mcfly Analytics** in nav/title; firm **Mcfly Ads** in footer; Custom not sold on home. Line/job H1: “Deeper Shopify numbers Analytics does not show.” Paper/sky + ribbon M present. CTA **Install** → App Store. Nav Demo · Pricing · About — within spine.

### First viewport (desktop)

| Element | Observation |
| --- | --- |
| Brand | Strong — M + “Mcfly Analytics” left; passes brand test |
| H1 | Job-led, not brand-overpowered |
| Support | Median vs mean + spend optional — dense but on-message |
| CTAs | Primary **Install** (black); secondary **Try the demo** |
| Price | “$39/store/mo after 7-day trial” under CTAs |
| Trust chips | `REVIEWS 0` · `$39 AFTER 7-DAY` · `NO PIXEL` — honest, also cold |
| Friction chip | Link **“APP STORE CARD STILL SAYS AD SPEND”** in the hero trust band |
| Product proof | Snowdevil SAMPLE desk (typical / returning / weekend) — strong |

### Conversion friction (severity-ranked)

| Sev | Issue | Why it costs install→trial |
| ---: | --- | --- |
| **P0** | Hero announces listing still sells ad spend | Teaches doubt *before* Install; merchants leave to verify a mismatched card |
| **P0** | Live listing ≠ site story (spend-first vs sales-first) | Dual funnel fights itself; App Store searchers never see site honesty |
| **P1** | Trial history story split: site/pricing/FAQ **90 days** trial vs listing paste pack **24 months** | Trust break on first billing/FAQ read; pick one truth and sync all surfaces |
| **P1** | ShopifyQL named in hero/body while L2 PENDING | Over-promises Analytics adjacency; risk if merchant expects native-identical $ |
| **P1** | First viewport is essay + caveats + competitor honesty | High cognitive load; “why install?” competes with disclaimers |
| **P2** | Reviews 0 chip + FAQ “why 0 reviews” early | Honesty good; still reduces social proof vs category peers |
| **P2** | `/demo` clock vs home Sep 1–16 stills explicitly diverge | Confuses “is SAMPLE broken?” — already labeled, still friction |
| **P2** | Long competitive FAQ (Polar / TW / RCI prices) above simple close | Useful for sophisticated buyers; delays one-plan Install for everyone else |
| **P3** | Aesthetic: sparse white + monospace chips reads “engineering memo” more than “operator desk you’d open daily” | Not wrong brand law; weak desire vs polished analytics category |

### Ranked site fixes (EV for install→trial)

1. Remove or demote “App Store card still says ad spend” from hero once Marty Saves sales-first listing (or replace with neutral “Listing live”).
2. Align **trial order-history window** everywhere (90 vs 24mo) to billing reality — one number.
3. Soften ShopifyQL wording to “works beside native returning sales $” / “order book now; Analytics-aligned totals when approved” — no implied live QL.
4. Compress first fold: brand · one job · one proof desk · Install · Demo; move caveats below.
5. Keep Reviews 0 honesty but move the essay FAQ one scroll down; close CTA earlier.
6. Pricing page already clear ($39 flat) — keep; ensure history line matches home.
7. `/demo`: one-line clock rule remains; consider matching home still freeze or drop freeze language.
8. Aesthetic pass (see §5) — white KPI cards, less monospace theater in hero.

---

## 4. Listing / ASO implications (copy/shots — Marty Save only)

### Live public listing (audited 2026-09-22)

| Field | Live observation |
| --- | --- |
| Title/tag chrome | “Mcfly Analytics - **Ad spend next to store sales** — Total ROAS +…” |
| H2 | “See every **ad dollar** next to Sales. Total ROAS, LTV, and deep customer insights on one desk.” |
| Body themes | Ads Manager vs till; Meta/Google/TikTok/retainers/billboards; platforms claiming same purchase |
| Feature bullets | Total ROAS; dual-count purchases; add channels by day/CSV; flat $39 + Goals; break-even + CAC |
| Categories | Marketing and sales → **ROAS**; Visuals → **Analytics dashboard** |
| Pricing card | **$39/month**, 7-day trial — plan name Mcfly Analytics |
| Reviews | **0** (histogram empty) |
| Data access blurb | Customers, orders, store analytics (high level) |
| Developer | Mcfly Ads |

**Gap vs ready paste** ([`docs/ops/LISTING_LIVE_PASTE.md`](../../ops/LISTING_LIVE_PASTE.md)): sales-first tagline/short/long already drafted (“Shopify Analytics skips YoY, typical order…”). **Not live.** Site FAQ correctly admits the mismatch.

### ASO patterns from category peers (no fake Mcfly proof)

Observed on [Repeat Customer Insights](https://apps.shopify.com/repeat-customer-insights) and common analytics apps:

| Pattern | Peer behavior | Mcfly implication |
| --- | --- | --- |
| Job-specific tagline | Niche job in ≤80 (“CPG… retention”) | Use Analytics-skips line, not ad-spend line |
| Feature taxonomy | Many category chips (LTV, cohorts, dashboards) | Prefer **Analytics dashboard** + sales-report keywords; keep ROAS as secondary after Save |
| Gallery | Dashboard stills first; demo store link | Recapture **Live Admin** Overview YoY first ([`CAPTIONS.md`](../../listing-assets/shots/CAPTIONS.md)); never `/demo` SAMPLE as product |
| Social proof | Reviews + reply threads | Keep **0**; do not invent; founder outreach is separate |
| Works with | Tags / Klaviyo logos | Stay **blank** unless real integration |
| Pricing story | Multi-tier feature ladders | One plan is a strength — say “whole desk” in features without $ in short/long (4.2.3) |

### Listing pack actions (Marty Save — Cursor does not Submit)

1. Paste sales-first **tagline / short / long / features / keywords** from LISTING_LIVE_PASTE.
2. Recapture five Live Admin shots (white operator cards); Overview crop = **zero spend**.
3. Feature media = Overview YoY, not ROAS hero.
4. Confirm one plan, no Free plan; no $ in short/long body.
5. Keywords: `shopify analytics`, `typical order`, `customer LTV`, `sales reports`, `ROAS` — ban pixel / true ROAS / attribution bait.

---

## 5. Aesthetic direction notes (site + in-app)

Specific, not “make it premium.”

### Keep (brand law)

- Paper/sky field; original ribbon **M**; public mark **Mcfly Analytics**; firm **Mcfly Ads** in footer only.
- Operator **white KPI cards** with calm type — Black Clover scoreboard density, not SaaS purple glow.
- Primary CTA = solid black **Install**; secondary outline Demo.
- Empty metrics = em dash **—**, never fake zeros.

### Change (concrete)

| Surface | Direction |
| --- | --- |
| Site hero | One composition: left job + CTAs; right **one** SAMPLE desk. Kill monospace “status sticker” row in the first fold (move Reviews 0 / no pixel to a quieter trust line under price). |
| Type | Keep expressive display for H1; body stays short operator sentences. Reduce all-caps chip labels in hero. |
| Color | Sky blue only on interactive period tabs / M mark — not as page wash. Avoid cream-serif-terracotta and purple gradients. |
| Cards | Hero desk may use cards (interaction). Marketing sections below: prefer open scoreboard rows over nested card stacks. |
| In-app | Overview = sales YoY + peeks + open sales chart; **zero** spend/ROAS on Overview. Orders = median hero + weekend %. Customers = returning $ + LTV chips. Spend = last tab, formula visible. |
| Motion | Site: 2–3 intents only (tab press, card detail open, Install hover). No floating badges on hero media. |
| Listing shots | Crop white KPI wells; Polaris chrome out; no charcoal collage; no pricing in PNG. |

### Anti-patterns to refuse

- Custom Data Solutions chrome, dark/cyan theater, invented 4.9 stars, collage patches on `site.css` for Tier A, pixel-suite screenshot language.

---

## 6. Top 8 surface ships (site or listing pack) by install→trial EV

| Rank | Ship | Surface | EV rationale | Owner |
| ---: | --- | --- | --- | --- |
| 1 | **Save sales-first listing paste** (tagline/short/long/features/keywords) | Listing (Marty Save) | Fixes P0 mismatch for App Store traffic — primary install path | Marty |
| 2 | **Recapture + upload 5 Live Admin shots** (Overview YoY first) | Listing | ASO gallery = trial confidence; SAMPLE `/demo` stills banned as product | Marty + pack |
| 3 | **Hero: remove “card still says ad spend”** after Save (or replace with Install-forward trust) | Site | Stops teaching doubt in first viewport | Site lane |
| 4 | **Unify trial history window** (90d vs 24mo) across site, pricing, FAQ, listing | Site + Listing | Honesty/compliance; prevents uninstall-on-day-1 confusion | Site + Marty paste |
| 5 | **De-QL the hero** — order-book claims only until L2 | Site | Prevents overpromise; protects religion | Site |
| 6 | **Compress first fold** (job + desk + Install/Demo; caveats below) | Site | Faster path to Install click | Site |
| 7 | **Feature media overwrite** to Overview YoY (not ROAS) | Listing | Searchers see Shopify-depth desk, not ad ledger | Marty |
| 8 | **Quiet Reviews 0** (keep honest; don’t lead FAQ with it) | Site | Reduce coldness without inventing proof | Site |

**Explicit non-ships for this lane:** inventing reviews/installs; Partner Submit; Fly deploy; promising ShopifyQL parity; ads spend.

---

## Gap summary (site/listing vs Live app)

### Cannot keep until L2 + Accuracy F PASS

- “Our totals are Shopify Analytics / ShopifyQL totals.”
- Certified New/Returning **Total Sales $** from `shopifyqlQuery`.
- Any cold claim that Live already runs `read_reports` analytics parity.
- Sessions/conversion or “replace Analytics.”

### Can promise now (order book + SAMPLE)

- Median **typical order** vs native mean AOV.
- Weekend mix % next to that ticket (packaging).
- YoY month/quarter/year **board** from order history / SAMPLE (honest empty LY = —).
- Returning dollars / days-to-second / 30·90·365 LTV from opaque order book (history depth = whatever billing actually grants).
- Optional Total ROAS = Shopify sales ÷ entered spend; empty **—**; no pixel.
- Flat **$39** after 7-day; SAMPLE on https://mcflyads.com/demo; Install → https://apps.shopify.com/mcfly-analytics-public.
- Reviews **0** — state, don’t invent.

---

## Sources

- Live site browse: mcflyads.com `/`, `/pricing`, `/demo` (2026-09-22)
- Live listing: apps.shopify.com/mcfly-analytics-public
- Peer listing pattern: apps.shopify.com/repeat-customer-insights
- Shopify Dev: [shopifyqlQuery 2026-07](https://shopify.dev/docs/api/admin-graphql/2026-07/queries/shopifyqlQuery), [Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data), [Apps Analytics](https://shopify.dev/docs/apps/build/analytics), ShopifyQL reference (2026-07 / 2026-10)
- Internal: `docs/LIVING_BOARD.md`, `docs/ops/LISTING_LIVE_PASTE.md`, `docs/APP_STORE_LISTING.md`, `docs/ops/ACCURACY_AUDIT_CHECKLIST.md` §F, `app/shopify.app.toml`

---

## Return brief (for Conductor)

**Path:** `marketing-mix-model/docs/research/2026-09-22-revamp/04-NATIVE_AND_SURFACES.md`

**5 bullets**

1. Native already covers Overview sales, mean AOV, YoY compare, day-of-week reports, ShopifyQL returning $, RFM, sessions — Mcfly wedge is **median + packaging + opaque LTV + optional Total ROAS**, not Analytics replacement.
2. `shopifyqlQuery` hard-requires **`read_reports` + PCD L2** (name/address/phone/email); order GraphQL works without L2 — do not claim QL parity yet.
3. Site first viewport is on-brand but conversion-hurt by listing-mismatch callout, ShopifyQL adjacency language, and 90d vs 24mo history drift.
4. Live listing still **ad-spend-first**; sales-first paste pack is ready — highest EV is Marty Save + Live Admin shot recapture.
5. Post-L2 roadmap: certify sales day facts (Accuracy F), then upgrade claims; optional QL metric cards later.

**Top 3 site/listing ships**

1. Marty Save sales-first listing paste.  
2. Recapture/upload Live Admin Overview-first gallery.  
3. Site hero: drop spend-mismatch chip post-Save + de-QL + unify trial history.

**Aesthetic direction (one paragraph)**  
Keep paper/sky, ribbon M, and white operator KPI cards; make the first viewport one composition (job + SAMPLE desk + Install/Demo) without monospace status stickers; use sky blue only on the M and period tabs; push competitive FAQ and Reviews-0 essay below the fold; in-app keep Overview spend-free with open sales chart and Spend as the last chapter — denser scoreboard, not purple-SaaS chrome.
