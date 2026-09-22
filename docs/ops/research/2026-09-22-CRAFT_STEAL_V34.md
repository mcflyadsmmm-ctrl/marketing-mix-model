# Craft steal v34 → v35 — structure only

**Date:** 2026-09-22  
**Role:** product-site craft director  
**Live then:** mcflyads.com **v34** (`ad054108`) paper/sky, sales-first, founder: not world-class yet  
**This cook:** site **v35** on `cursor/site-world-class-5bc6`  
**Honesty rebase:** onto `4838c8e` (v35 competitor/native-Analytics honesty). Craft structure kept; uniqueness claims refused. Native Reports Group by day of week, Repeat Customer Insights from $59, Better Reports from $19.90, Polar from $750 (not invented $1,020), listing still spend-first.  
**Looked at:** polaranalytics.com + Polar listing · triplewhale.com (egress blocked) + Triple Whale listing · lifetimely.io + Lifetimely listing · TrueProfit listing · Repeat Customer Insights listing · mcflyads.com v34

Steal **structure**. Do not steal claims. Forbidden: fake video, fake logos, fake 4.9, fake install counts, pixel screenshots, net-profit hero.

H1 locked. SAMPLE Snowdevil dollars locked. $39 / 7-day locked. Install → `https://apps.shopify.com/mcfly-analytics-public`.

---

## What v34 already had (keep)

| Surface | v34 |
| --- | --- |
| First fold | Live HTML Overview desk (no video) · H1 locked · two CTAs |
| Proof | Harbor gone · Snowdevil $68,457 / $19,023 / 3.60× |
| Price | One plan named · GMV wedge in hero |
| FAQ | Five home `<details>` · /faq 12 questions |
| Share | One Slack paste + /product mailto |
| 0 reviews | Footnote on the roundup cards |
| OG | `og-analytics.jpg` 1200×630 · not cash-MER |
| Footer | Demo · Pricing · About · FAQ · legal |

World-class miss: Polar puts proof **in the fold**, Lifetimely prices as a **screenshot card**, Polar’s Slack digest is a **named artifact**, and 0 reviews was a footnote instead of a fact chip.

---

## Steals (structure → Mcfly file)

| # | Steal from | Structure taken | Claims **not** taken | Mcfly file |
| ---: | --- | --- | --- | --- |
| 1 | Polar home | One-sentence coverage lede under the locked H1 | “Grow resilient brands”, 4,000+ brands, AI agents | `site/index.html` |
| 2 | Polar home / listing | Proof chips **in the first fold** | “Trusted by 4,000+”, 4.9 (117) as ours | `site/index.html` — chips: Reviews 0 · listing live · $39 · 7-day · no pixel |
| 3 | Polar / TW / Lifetimely / TrueProfit / RCI listings | **One** comparison table a roundup can screenshot | Polar $1,020, “we beat them”, net profit | `site/index.html` `#where-sits` · `site/pricing.html` tax table |
| 4 | Polar “Executive summary to Slack” | Paste framed as a **weekly digest artifact** you copy | Auto-post to Slack, n8n, Gmail | `site/index.html` `#paste-slack` · `site/product.html` `#mailto-specimen` |
| 5 | Lifetimely home FAQ | Home FAQ as objection handler (`<details>`) | Profit Agent, COGS, Slack Q&A | `site/index.html` `#faq-home` — added 0 reviews / trial window / GMV |
| 6 | Lifetimely pricing | One-plan card a CFO can screenshot: fee, trial, in/out | Order slider, $149 @ 3,000, Amazon add-on | `site/pricing.html` `.cfo-shot` |
| 7 | Repeat Customer Insights listing | Product as a **bookkeeper ledger** (line / is / is not / tab) | RFM, Klaviyo tags, 5.0 (14) as ours | `site/product.html` ledger table |
| 8 | Polar “instant demo, no signup” | Demo lede names instant SAMPLE desk | Polar demo data, no-call as a sales motion we fake | `site/demo.html` |
| 9 | Polar / Lifetimely 0-review honesty (by contrast) | Put **Reviews: 0** on fold, facts, FAQ, footer | Invented stars or install counts | `site/index.html` · `site/pricing.html` · `site/faq.html` · `site/about.html` · `site/assets/mcfly/chrome.js` |
| 10 | Polar product-without-video | Live HTML numbers, not a pixel still | Polar pixel dashboards, TrueProfit net-profit shots | `site/product.html` — dropped `product-cockpit.jpg` |
| 11 | Polar / Lifetimely unified CSS | Inner pages on `mcfly.css` only | Their tokens, mint/dark bands | `site/pricing.html` `site/product.html` `site/faq.html` — **no `site.css`** |
| 12 | Polar footer sitemap | Product + reviews-0 meta in footer | Resource library, social, fake logos | `site/assets/mcfly/chrome.js` · `site/assets/chrome.js` |
| 13 | Lifetimely FAQ page | /faq hero as objection frame (“stars vs order math”) | AI profit analyst Qs | `site/faq.html` |
| 14 | 390 / 1280 craft | Fold chips wrap · digest head wraps · table scroll · 1280 table full width | Dark cinematic hero | `site/assets/mcfly/mcfly.css` v35 block |
| 15 | Polar/Lifetimely OG restraint | Keep honest brand OG, don’t swap in a pixel still | Product-motion OG video | OG URLs unchanged (`og-analytics.jpg`) |

---

## CSS / version

- Append-only **v35** block in `site/assets/mcfly/mcfly.css` (page-hero, bands, CFO card, digest artifact, ledger, 390/1280).
- Cache bust `?v=20260922v35` on spine CSS/JS.
- `mcfly-version` **v35** · `mcfly-build` **craft-steal-v35** on pages touched + chrome fallback.

**Never** stacked into `site.css` for Tier A.

---

## Cited “from” prices (listings, not quotes)

| Listing | Public from | Reviews (listing) |
| --- | --- | --- |
| Polar | $750/mo, GMV-based | 4.9 (117) |
| Triple Whale Foundation | $219/mo | 4.1 (91) |
| Lifetimely | $149/mo at 3,000 orders | 4.9 (538) |
| TrueProfit | from $35/mo + per-order | 4.9 (898) |
| Repeat Customer Insights | from $59/mo | 5.0 (14) |
| **Mcfly** | **$39 after 7-day** | **0** |

We do not invent Polar $1,020. Mcfly does not ingest COGS and does not paint net profit.

---

## Before → after craft gaps (still remaining after this cook)

v34 → v35 closed: Polar-tight lede, proof chips in the fold, one honesty roundup table, paste as a named digest you copy, home FAQ as objection handler (0 reviews / trial / GMV), CFO screenshot card, bookkeeper ledger, inner pages on `mcfly.css` only, Reviews 0 on fold/footer, no cinematic dark hero.

Still remaining (structure we did not steal, or cannot steal without lying):

1. Social proof is honest **0** — Polar/TW/Lifetimely still win the logo wall and star count. We name 0; we do not invent a 4.9.
2. OG is still a brand jpg (`og-analytics.jpg`), not a desk still or motion OG.
3. Partner listing paste is still spend-first until Marty Save in Partner Dashboard. Site leads Overview → Orders → Customers; the live App Store card still leads with ad spend next to store sales.
4. No motion (correct: we refuse fake video). Polar/TW still look “alive” in the fold.
5. `/demo` is an iframe to Fly SAMPLE, not Polar’s in-page instant demo with no chrome jump.
6. Footer is still thinner than Polar’s resource library (no blog, no integrations grid, no social).
7. Phone fold is still taller than Polar because the live HTML desk **is** the product — 390 hides extra YoY cards, not the desk.
8. Comparison table is honest “from” prices, not Polar’s marketing 2×2 with logos. No fake logo row.
9. Product page is a ledger + SAMPLE cards, not a pixel walkthrough. Bookkeeper-clear; less cinematic than TW.
10. Pricing CFO card is one plan — no Lifetimely order-volume slider theater (we refuse that claim).
