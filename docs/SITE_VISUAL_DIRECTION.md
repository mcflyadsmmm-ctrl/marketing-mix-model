# Site visual direction — Mcfly Ads (mcflyads.com)

**Status:** Locked for craft elevation · 2026-07-26  
**Stack:** Static `site/**` (HTML/CSS/JS) · Cloudflare Pages later  
**Religion:** Cash MER = Shopify sales ÷ ad spend. STEAL_CRAFT from TW/NB marketing polish only — never pixels / MTA / path / “true ROAS” / feature clones.  
**Skills applied:** `web-visual-direction` · `landing-page-craft` · `web-design-engineer` · `responsive-ui-qa`

---

## 1. Visual thesis (one sentence)

**Editorial cash-desk authority:** a dark till-room with cyan signal light — brand and formula first, product proof as the only decoration, motion that settles numbers rather than sells theater.

Useful tension: *finance-legible clarity* × *operator urgency* (not neon SaaS excitement).

---

## 2. Audience / task / feeling

| | |
| --- | --- |
| **Audience** | Shopify founders & media buyers tired of path dashboards |
| **Immediate task** | Understand cash MER in ≤3s → Install Free or waitlist |
| **Feeling** | “This team knows the till” — calm, sharp, expensive restraint |

---

## 3. Reference principles (craft only)

| Reference archetype | Steal | Avoid |
| --- | --- | --- |
| Premium analytics marketing (TW/NB class) | Full-bleed first viewport, product UI as hero media, scroll rhythm, typographic weight | Attribution copy, GMV-tax pricing theater, feature bento soup |
| Award GSAP landings (e.g. KironX-class) | Intentional scroll/entrance timing, pinned clarity | Custom cursors, particle networks, scroll-jacking |
| Mcfly existing equity | M ribbon, cyan `#5ee7f0`, navy `#0a1221`, Bricolage + Figtree + Plex Mono, desk mock | Green CSS square mark, Inter, purple glow kits |

Do **not** copy competitor layouts or assets. Extract rhythm and hierarchy only.

---

## 4. First viewport composition (hard budget)

Exactly:

1. **Brand** — M mark + “Mcfly” + cyan “Ads” (hero-scale, survives remove-nav test)  
2. **One H1** — platforms lying / till truth (outcome language)  
3. **One lede** — `sales ÷ spend` formula visible  
4. **One CTA group** — Install Free (primary) + waitlist (secondary)  
5. **One dominant visual** — Monday desk (existing `.desk`) edge-to-edge on wide; deferred on narrow  

Forbidden in first viewport: stat strips, logo walls, card grids, floating badges, promo chips, FAQ, pricing tiers.

---

## 5. Token sketch (compatible with `site.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--ink-hero` | `#f4f6f8` | Hero body |
| `--navy` | `#0a1221` | Hero plane |
| `--cyan` | `#5ee7f0` | Ads, accents, formula underline |
| `--cyan-deep` | `#2bb8c4` | Links on light |
| `--truth` / green CTA | Soften primary CTA toward **cyan-tinted solid** or near-white solid — avoid “generic SaaS green” competing with brand cyan |
| Display | Bricolage Grotesque | Brand, H1 |
| Body | Figtree | Lede, UI |
| Mono | IBM Plex Mono | Formula, proof strike |
| Radius | Sharp-ish (≤8px) | Desk chrome; no pill blobs |
| Max content | ~1120–1200px | Desk + copy split |

Surfaces: mesh + grain + gridline OK if subtle. No glassmorphism stacks. No multi-layer glow.

---

## 6. Motion budget (≤3 intentional; reduced-motion = off)

| # | Motion | Purpose |
| --- | --- | --- |
| 1 | Brand + H1 rise / settle (~400–600ms, ease-out) | Presence |
| 2 | Formula underline draw | Thesis lock |
| 3 | Desk enter (opacity + slight Y) | Proof lands after type |

Everything else static or CSS-only ambient mesh (paused under `prefers-reduced-motion`).

No scroll-jack, no custom cursor, no particle canvas, no loader theater.

---

## 7. Photography / imagery plan

| Asset | Role |
| --- | --- |
| `assets/hero-atmosphere.webp` (+ jpg) | Full-bleed hero atmosphere behind mesh (low opacity, vignette) — real visual plane |
| `assets/brand/mcfly-m-transparent.png` | Small + hero mark |
| `assets/brand/mcfly-ads-lockup.png` | OG / social only (not hero chrome) |
| Live desk HTML | Dominant product proof — keep sample numbers; never fake customer logos |

Prefer atmosphere **edge-to-edge** under hero, not inset card media.

---

## 8. Anti-slop checklist (fail = reject ship)

- [ ] No purple / indigo gradient kits  
- [ ] No cream + terracotta serif cliché  
- [ ] No Inter/Roboto/Arial as primary  
- [ ] No green CSS square “logo”  
- [ ] No hero card grid / badge stickers  
- [ ] No emoji  
- [ ] Brand survives remove-nav test  
- [ ] CTA honesty (Install Free / waitlist mailto — no fake submit)  
- [ ] Religion: sales ÷ spend visible; no “true ROAS” as product  
- [ ] `prefers-reduced-motion` kills entrance motions  

---

## 9. Conversion brief (landing-page-craft)

- **Offer:** Shopify cash MER desk — sales ÷ spend, break-even, one Monday call  
- **Primary action:** Install Free → `/support.html`  
- **Objection:** “Another analytics suite” → refuse pixels; show till desk  
- **Proof nearby:** Desk MER vs struck platform claim  

---

## 10. Implementation scope (this tick)

| In | Out |
| --- | --- |
| `site/index.html` hero + home-only CSS | Full site redesign |
| `site/assets/site.css` hero tokens/motion | App Polaris |
| Cache bump `?v=20260726c` | Cloudflare / Fly deploy |

**Critic gate:** Must score brand-first + non-slop + motion ≤3 vs this doc before any future `publish site`.
