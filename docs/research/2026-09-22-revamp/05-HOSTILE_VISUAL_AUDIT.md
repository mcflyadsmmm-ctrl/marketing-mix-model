# Hostile visual audit — Mcfly Analytics

**Date:** 2026-09-22  
**Method:** `curl` HTML only (no browser this pass). Judged markup strings, structure, meta, and what the DOM admits about layout.  
**URLs:** [mcflyads.com](https://mcflyads.com) · [/pricing](https://mcflyads.com/pricing) · [/demo](https://mcflyads.com/demo) · [fly.dev/demo](https://mcfly-analytics.fly.dev/demo) · [listing](https://apps.shopify.com/mcfly-analytics-public)  
**Live site meta:** `mcfly-version` **v42** · `mcfly-build` **craft-steal-v42** · theme-color `#f2f5f8`  
**Reviews:** **0** — do not invent any. PCD L2 pending is not an excuse for an ugly desk.

### What curl could not see
- Actual rendered layout: spacing, type scale on screen, contrast, radius, shadows, motion.
- CSS paint (colors beyond `#f2f5f8` theme-color and class names; full visual hierarchy).
- Images / listing gallery stills / OG art pixels (only URLs and alt/titles in markup).
- Chrome injected by `data-chrome` / `chrome.js` (nav/footer may hydrate client-side).
- Inside Shopify Admin Polaris embed (only public `/demo`).
- Mobile breakpoints, hover states, scroll behavior.
- iframe paint on `/demo` until you open the Fly URL separately (shell HTML is thin; desk is on Fly).

What *was* visible: titles, copy, CTAs, hero desk structure, pricing card copy, demo shell + captions, Fly SSR desk strings, listing title/tagline/bullets/reviews/pricing.

---

## 1. Verdict (8 lines)

1. A stranger does **not** install: the homepage hero leads with broken English, insider jargon, and **Reviews 0**.
2. Site and listing sell **two products** — median Overview board vs “Ad spend next to store sales / Total ROAS” ROAS app.
3. First viewport is not a composition; it is a **disclaimer stack** glued to a SAMPLE KPI collage with “Click for detail.”
4. Pricing markup reads like an **internal fee sheet** (“One plan · screenshot this”, “Not in the fee”), not a $39 purchase page.
5. `/demo` is a SAMPLE apology header + iframe + two fine-print captions — then Fly opens with **“Live is parked until launch.”**
6. The desk markup is an **ops manual**: dual nav, “Look here first,” essay footnotes under every number — not a ten-minute habit.
7. The App Store card is generic ROAS laundry (Meta/Google/TikTok/billboards) with **(0 Reviews)** — category wallpaper.
8. Bottom line: **would not install; would not stay.** Honesty without craft is still ugly. Flat $39 does not buy this face.

---

## 2. Site first viewport — specific visual failures

Judged from homepage HTML structure (`hero`, `hero__copy`, `proof-chips`, `shot-frame` / `dd-desk`).

| Element (as named in markup) | Failure |
| --- | --- |
| Kicker `Median ticket · spend optional` | Product manager label, not a brand moment. |
| H1 `Deeper Shopify numbers Analytics does not show.` | Broken stacked nouns; sounds unfinished; title tag repeats the same stumble. |
| Lede `…Spend optional last — empty paints —.` | Engineer dialect on a marketing surface. |
| CTA `Install` / `Try the demo` | Fine as links; zero desire without a beautiful product plane — and the “product plane” is a homework desk. |
| `proof-chips`: `Reviews 0`, `$39 after 7-day`, `No pixel` | Leading with **zero social proof** as a chip is anti-conversion cosplay. |
| Link `App Store card still says ad spend` | Public todo / dirty laundry in the hero. |
| Hero desk: `Snowdevil` · `SAMPLE` · period buttons · KPI buttons | Not one hero visual — a **mini-app** dumped into the first viewport. |
| Every KPI ends with `Click for detail` | First screen assigns homework. |
| YoY block lede (packaging apology) | Preemptive “not a missing Overview metric” essay *inside* the hero shot. |
| Caption `SAMPLE · frozen Sep 1–16 still · not the live /demo clock · click a card · empty = —` | Changelog / QA note as hero footer. |
| Fact strip repeats `Reviews 0` / `$39` / no pixel | Same apology band twice before “How it works.” |
| Theme `#f2f5f8` + `is-light is-mono` | Cold paper SaaS; markup admits mono/editorial intent without any sensual product presence in the strings. |

Hierarchy failure: brand is not the hero signal — the **apology and SAMPLE desk** are. A stranger sees “we have no reviews” and “our App Store card is wrong” before they feel anything.

---

## 3. Demo / app first screen — specific visual failures

### `/demo` shell (mcflyads.com/demo)
Markup is almost empty product UI:
- H1: `Full Snowdevil SAMPLE demo.`
- Body: `SAMPLE Snowdevil — not a live client… This is not your store.`
- CTAs: `Install` · `Open the full Snowdevil desk`
- Then a bare `<iframe src="https://mcfly-analytics.fly.dev/demo?hosted=1">`
- Two `.fine` captions arguing about clocks, Sep 1–16 stills, break-even math, and `$39/mo`

That is not a demo landing — it is a **loading dock with legal footnotes**. The product is outsourced to Fly; the marketing page contributes SAMPLE, SAMPLE, SAMPLE.

### Fly desk (`mcfly-analytics.fly.dev/demo`) — internal tool, not $39 product
Visible SSR strings that kill the product feel:
- `SAMPLE Snowdevil · same desk as the Shopify app · not a live client`
- `Sample data` · `Snowdevil example sales so you can click around. Not this shop’s Shopify sales.`
- **`Live is parked until launch`** — on a published App Store app’s public desk. Unforgivable.
- Dual nav: tabs `Overview` `Orders` `Customers` `Spend` `Goals` `Settings` **plus** `YoY glance` `Chart` `Mix close` `YoY year`
- Babysitter label: `Look here first`
- Card soup: `Shopify Total Sales $108,666`, `Typical order $602`, `Returning $65,722`, `Weekend`, `Typical day`, Yesterday / This week / MTD…
- Footnotes: Pending/authorized/COD/Klarna caveats; “not the company book”; formula dumps (`7 days × typical day`, month-close arithmetic)
- Numbers fight the homepage stills (home Typical order **$631** / Sep 1–16 frozen vs desk **$602** / live MTD) — marketing and product **disagree in markup**

What feels internal: launch-parked copy, dual navigation taxonomies (`Mix close`), “Look here first,” essay ledes, share/copy rituals baked into SSR, SAMPLE banners stacked. A paid desk should calm; this one **lectures and cavesits**.

---

## 4. Listing card — why it looks like every other ROAS app

From App Store HTML:
- Title: `Mcfly Analytics - Ad spend next to store sales — Total ROAS +...`
- Description/og: `Put Meta, Google, TikTok, and billboard spend next to Shopify sales. Read Total ROAS, LTV, and Goals in Admin. Flat $39. No pixels.`
- H2: `See every ad dollar next to Sales. Total ROAS, LTV, and deep customer insights on one desk.`
- Body: Meta/Google/TikTok/retainers/billboards · “cash desk for that gap” · platform overlap · Ads Manager ROAS contrast — **the standard ROAS-app sermon**.
- Bullets: Total ROAS ÷ entered spend · platform double-count · Meta/Google/TikTok/retainers/billboards CSV · Flat $39 + 7/14/28 allocation · Break-even + CAC
- Categories: `ROAS` · `Analytics dashboard`
- Rating: `(0 Reviews)` / overall empty stars
- Price: `$39/month. Free trial available.`

Meanwhile the **site** hero link admits: `App Store card still says ad spend` while homepage sells Overview → Orders → Customers / median ticket. That is not nuance — it is **two faces in the markup**. Interchangeable ROAS listing + mismatched site = trust fail before install.

Gallery stills: curl cannot see pixels; only that a `Featured images gallery` exists (`+ 2 more`). Do not invent what the stills show beyond titles/copy.

---

## 5. Ranked ugliness list (≥15)

| Rank | Severity | Item |
| --- | --- | --- |
| 1 | S0 | Listing ↔ site split: ad-spend Total ROAS card vs median Overview site. |
| 2 | S0 | Hero / pricing / strips lead with **Reviews 0**. |
| 3 | S0 | Fly desk string **`Live is parked until launch`** on a live product demo. |
| 4 | S0 | Hero link **`App Store card still says ad spend`** — unfinished work on the storefront. |
| 5 | S1 | H1 English failure: `Deeper Shopify numbers Analytics does not show.` |
| 6 | S1 | First viewport = SAMPLE mini-desk + `Click for detail` homework. |
| 7 | S1 | Desk dual nav (page tabs + YoY glance / Mix close / …). |
| 8 | S1 | `/demo` shell is SAMPLE apology + iframe + fine-print clock essays. |
| 9 | S1 | Pricing eyebrow `One plan · screenshot this` — founder stage direction. |
| 10 | S1 | Pricing column `Not in the fee` sold as a feature (absence as product). |
| 11 | S1 | `Look here first` on the paid desk surface. |
| 12 | S2 | Insider jargon: `empty paints —`, `Mix close`, `empty BE is —`. |
| 13 | S2 | Home still numbers ≠ Fly desk numbers ($631 / Sep 1–16 vs $602 / MTD). |
| 14 | S2 | Comparison tables naming Polar / Triple Whale / Lifetimely **with their review counts** next to Mcfly’s 0. |
| 15 | S2 | Fact-strip and FAQ repetition of the same honesty lines — sounds nervous, not premium. |
| 16 | S2 | Listing keyword pile (Meta/Google/TikTok/billboards/allocation) = category clone. |
| 17 | S3 | `theme-color` `#f2f5f8` paper SaaS coldness (what markup admits about mood). |
| 18 | S3 | Demo CTA `Open the full Snowdevil desk` when the iframe already *is* the desk. |
| 19 | S3 | Chrome via empty `<div data-chrome>` — brand nav not even in the static HTML of core pages. |

---

## 6. What is actually good (max 5)

1. Price string is unambiguous: 7-day then **$39**/store/mo; uninstall stops the charge.
2. Religion is stated in plain math when it appears: Total ROAS = sales ÷ entered spend; empty = —.
3. SAMPLE is labeled as SAMPLE (ethics), even when overplayed.
4. One plan (no Free / Pro / Enterprise matrix sludge) is readable in pricing markup.
5. No invented 4.9 — the site refuses fake stars (correct; still visually costly when shoved into the hero).

---

## 7. Evidence — quoted visible strings

### Homepage
- `Median ticket · spend optional`
- `Deeper Shopify numbers Analytics does not show.`
- `Typical order is the median — Shopify AOV is the mean. Returning dollars sit next to ShopifyQL returning sales $. Spend optional last — empty paints —.`
- `Reviews 0` · `$39 after 7-day` · `No pixel` · `App Store card still says ad spend`
- `Snowdevil` · `Sep 1–16, 2026` · `SAMPLE` · `Typical order` `$631` · `Click for detail`
- `SAMPLE · frozen Sep 1–16 still · not the live /demo clock · click a card · empty = —`
- `Listing live · we do not invent a 4.9`
- meta: `v42` / `craft-steal-v42`

### Pricing
- `7-day free trial. Then $39/month.`
- `$39 stays $39 at $5M. Path suites often tax GMV. Mcfly does not.`
- `One plan · screenshot this`
- `Reviews` → `0 · listing live · we do not invent a 4.9`
- `In the fee` / `Not in the fee`
- `Empty spend paints` / `SAMPLE · empty BE is —`

### Demo shell
- `Full Snowdevil SAMPLE demo.`
- `SAMPLE Snowdevil — not a live client. Instant SAMPLE desk — no signup or sales call… This is not your store.`
- Captions: home stills Sep 1–16 vs live iframe clock; `Total ROAS = sales ÷ spend · empty = —`

### Fly demo
- `SAMPLE Snowdevil · same desk as the Shopify app · not a live client`
- `Live is parked until launch`
- `Look here first`
- `Shopify Total Sales` `$108,666` · `Typical order` `$602` · `Returning` `$65,722`
- Subnav: `YoY glance` · `Mix close` · `YoY year`

### Listing
- `Mcfly Analytics - Ad spend next to store sales — Total ROAS +...`
- `$39/month. Free trial available.`
- `(0 Reviews)`
- `See every ad dollar next to Sales. Total ROAS, LTV, and deep customer insights on one desk.`
- `Stores show Sales. Ads Manager shows its own purchases… Meta, Google, TikTok, retainers, and billboards…`
- Feature bullets on Total ROAS, platform overlap, billboards, Flat $39 + allocation

---

*Hostile critic. Markup alone already fails desire, coherence, and product presence. No defense. No Fly deploy. No code edits.*
