# Design spec — Mcfly site (Amp rhythm, Mcfly soul)

**When:** 2026-09-18 · Extracted for Wave Amp-rhythm (Claude/ChatGPT-safe)  
**Reference:** Amp/Lifetimely *visual patterns only* — not copy, colors, or AI-analyst pitch.  
**Brand law:** paper/sky · Mcfly Analytics · Install → `mcfly-analytics-public` · reviews **0** · empty spend = —

## Borrow (patterns)

| Pattern | Amp does | Mcfly does |
| --- | --- | --- |
| Product first | Hero product shot | Framed dark-well product chrome (Snowdevil SAMPLE) |
| Breathing room | Large whitespace | Wider section padding, fewer competing paragraphs |
| Alternating proof | Copy + screenshot rows | Feature rows: ROAS / Goals / Customers+LTV + Signal/Evidence/Next |
| Facts not fake logos | Logo strip | Honest facts strip (no invent installs/reviews) |
| Detect→Explain→Decide | 3 steps | Upload → Total ROAS → Goals (already religion) |
| Sticky dual CTA | Trial + Demo | Install + Try the demo |

## Refuse

- Clone Amp dark OS / mint-on-black marketing page
- “Book a Free Consult,” MMM Sprint, Custom packages as home sell
- Fake logos, testimonials, GMV, review counts
- Purple gradients, glassmorphism, AI-agent theater
- Replacing H1 “Deeper Shopify numbers Analytics does not show.”

## Tokens (Mcfly)

- Page: `#f2f5f8` paper/sky
- Ink: `#0a1221`
- Accent: `#1ab8c4` / well accent `#5ee7f0`
- Well product chrome: `#0c1219` surfaces (Admin hybrid wells)
- Radius: 2–14px (editorial, not pill soup)
- Container: ~1120px; section pad: `clamp(3rem, 8vw, 5.5rem)`

## Homepage section order

1. Sticky nav — Demo · Pricing · About · Install  
2. Hero — H1 + short lede + Install/Demo + **product frame** (well KPIs)  
3. Facts strip — No ad-network login · 24 months history · $39/store/mo · Shopify App Store  
4. How it works — Upload / See / Decide  
5. Alternating rows — Total ROAS · Goals · Customers/LTV (+ Signal/Evidence/Next)  
6. Tab grid — Shopify five · Spend six · Settings  
7. Pricing band — 7-day then $39  
8. Footer  

## Listing stills

Admin wells after Fly go — see `STATUS_20260918_visual_scorecard.md`. Site floats ≠ App Store product stills.

## Implemented (site v22)

- Homepage: product-frame hero · facts strip · Upload/See/Decide · three alternating feature rows (ROAS / Goals / Shopify five) · tab doors · pricing band
- CSS: `.product-frame*`, `.facts-strip*`, `.feature-row*`, `.section--spacious`, `.mini-kpi*` in `site/assets/mcfly/mcfly.css`
- Religion intact: H1, Install CTA, $39, Snowdevil SAMPLE, empty = —, no Book Consult / MMM Sprint / fake logos
