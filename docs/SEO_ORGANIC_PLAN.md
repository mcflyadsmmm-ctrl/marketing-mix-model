# Website SEO & Organic Ranking Improvement Plan — Mcfly Ads

> **Execution SoT (dual pillar + AI GEO):** [`SEO_AI_GEO_RUNBOOK.md`](./SEO_AI_GEO_RUNBOOK.md) — agents run that file. This doc is historical keyword/tech notes.

**Scope:** `site/**` (Cloudflare Pages) · Brand: Mcfly Ads (cyan/navy, M ribbon + lockup)  
**Religion:** Never pitch pixels, MTA, path attribution, TW clones, or App URL = mcflyads.com.  
**Product truth:** Cash MER = Shopify sales ÷ ad spend; break-even from margin; rules-based allocation. Free App Store now → ~$79 flat later.  
**Related:** `SEO_AI_GEO_RUNBOOK.md` · `VALUE_THESIS.md` · `POSITIONING_PIXEL_HONESTY.md` · `SITE_CRAFT_NEXT.md` · `REJECT_RISK_AUDIT.md` · `APP_STORE_LISTING.md`

---

## 1. Current state (honest)

### Already in local `site/**` (good bones)

| Asset | Status |
| --- | --- |
| Unique `<title>` + meta description per core page | Present |
| `rel=canonical` → `https://mcflyads.com/…` | Present |
| OG + Twitter cards | Present |
| `robots.txt` Allow + Sitemap pointer | Present |
| `sitemap.xml` | Includes hubs + `why-pixels-fail` + `lastmod` |
| Brand thesis in titles/descriptions | Cash MER / sales ÷ spend |
| Trust URLs for App Store | `/support` `/privacy` `/terms` `/pricing` |

### Gaps that still matter for ranking

| Gap | Impact |
| --- | --- |
| Live Pages (updated 2026-07-26) | Ads brand + Free/PCD trust + why-pixels live; keep FAQ/glossary thin until next content tick |
| Thin topical graph | FAQ / glossary / vs-suites still on roadmap |
| Brand dual-name | Site **Mcfly Ads** · listing **Mcfly Analytics** — keep coherent |

**Verdict:** Technical hygiene is strong for a small static site. Ranking upside is **category content + deploy parity + schema**, not hero thrash.

---

## 2. Positioning keywords

### Primary

1. cash MER / marketing efficiency ratio (Shopify sales ÷ ad spend)
2. break-even MER (from contribution margin)
3. Shopify cash desk / Monday budget ritual
4. Shopify marketing analytics (desk, not suite)

### Secondary

- Shopify ad spend tracking / MER calculator
- break-even ROAS → always redirect language to **break-even MER**
- flat Shopify analytics pricing / no GMV tax
- Triple Whale alternative **as framing only** (cash desk vs path suite)

### Refuse (never target)

true ROAS · pixel ROAS · MTA · view-through · path credit · TW/Northbeam **clone** keywords · forever-free · public `.myshopify.com` install form

---

## 3. Technical SEO

### P0 (ship now)

1. Cloudflare Pages publish so live = local Free + PCD + Ads brand
2. Ship `why-pixels-fail.html` + sitemap entry
3. 404: `noindex`, no self-canonical
4. JSON-LD: Organization + WebSite + SoftwareApplication on home
5. OG share art ~1200×630 (`assets/brand/og-cash-mer.jpg`)
6. Founder: Search Console verify + submit sitemap

### P1 (weeks 2–4)

- `/faq.html` + FAQPage schema (visible Q&A only)
- Chrome/footer rail: Product · Why pixels fail · Pricing · Support
- CWV: LCP &lt;2.5s mobile; keep `prefers-reduced-motion`
- Unique meta audit on app/download/terms

### P2 (months 2–3)

- Prefer clean URLs in copy (`/product`) with stable canonicals
- Optional comparison frame page (desk vs suite — no clone matrix)
- External mentions (partners, operator forums) — honest cash-MER thesis

---

## 4. Content architecture

| URL | Job |
| --- | --- |
| `/` | Category claim + Install Free / waitlist |
| `/product.html` | Desk ritual |
| `/pricing.html` | Free now · ~$79 flat later |
| `/why-pixels-fail.html` | Authority: privacy-era honesty |
| `/support.html` | Install Free + human help |
| `/privacy.html` | PCD-honest data diet |
| `/faq.html` (next) | Objections |
| `/cash-mer.html` (optional) | Glossary hub |
| `/vs-attribution-suites.html` (optional) | Frame only — never feature parity |

---

## 5. 90-day roadmap

| Weeks | Ship |
| --- | --- |
| **0** | Pages deploy; GSC; curl trust URLs |
| **1** | why-pixels + 404 + OG + JSON-LD (this slice) |
| **2** | Internal links + CWV pass |
| **3–4** | FAQ + glossary |
| **5–6** | vs-suites frame page |
| **7–12** | Real support Qs → FAQ refresh; GSC query doubles on MER terms |

---

## 6. Anti-AI-slop craft rules

1. Brand-first hero — brand + 1 H1 + 1 lede + 1 CTA group + 1 visual
2. Thesis in ≤3s — “Cash MER is sales ÷ spend”
3. Cyan/navy + Bricolage/Figtree/Plex Mono only
4. Cards only for interaction
5. On-page refuse list when demystifying competitors
6. No invented features in meta/H2
7. Title ~50–60 chars; description ~140–160
8. One H1; motion restrained + reduced-motion
9. CTA honesty — App Store Free / waitlist mailto
10. Craft rubric mean ≥4.5 before publish claims

---

## 7. App Store ↔ site coherence

| Surface | Voice |
| --- | --- |
| Listing name | Mcfly Analytics |
| Site brand | Mcfly Ads |
| Formula | Shopify sales ÷ ad spend |
| Pricing | Listing **Free**; site may say ~$79 later |
| App URL | `mcfly-analytics.fly.dev` only |
| Trust URLs | Must match Free + PCD live |

---

## Success metrics (90 days)

| Signal | Target |
| --- | --- |
| Indexed URLs with cash-MER thesis | ≥ 8 quality pages |
| GSC impressions for cash MER / break-even MER | Non-zero, rising MoM |
| Trust URL crawl | 200 + copy parity |
| Soft-404 / why-pixels | Zero |
| Religion violations in meta/H1 | Zero |
