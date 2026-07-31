# Built for Shopify + “best of kind” — Mcfly research absorb

**Researched:** 2026-07-28  
**Official SoT:** [Built for Shopify requirements](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements) · [BFS overview](https://shopify.dev/docs/built-for-shopify) · [App Design Guidelines](https://shopify.dev/docs/apps/design)  
**Craft companion:** [`PREMIUM_NATIVE_UX_RESEARCH.md`](./PREMIUM_NATIVE_UX_RESEARCH.md)  
**Religion:** Total ROAS = sales ÷ spend; **refuse** pixels / MTA / “true ROAS” / TW clones.

This doc answers: what does it take to be a **high-quality Built for Shopify** app *and* the **best cash Total ROAS desk** of its kind — without confusing those two bars.

---

## Two different prizes (do not conflate)

| Prize | What Shopify / merchants reward | When Mcfly can chase |
| --- | --- | --- |
| **App Store approval** | Safe, honest, works in Admin, Free listing path | **Now** — [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) |
| **World-class category craft** | Habit, glanceable desk, TTFV &lt;10m, listing shots | **Now–ongoing** — Admin ↔ demo parity |
| **Built for Shopify badge** | Hard thresholds: installs, reviews, Web Vitals, design audit, category rules | **After** ~50 paid-plan installs + 5 reviews + traffic for vitals |

Docs already say: do **not** chase BFS until installs/reviews exist ([`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)).

---

## What Built for Shopify actually requires (2025–2026 bar)

### A. Proven usefulness (gates badge, not craft)

- ≥ **50 net installs** from shops on **paid Shopify plans**
- ≥ **5 App Store reviews** + minimum average rating
- Clean Partner account (no active infractions)

Without real merchants using the app for 28+ days, Web Vitals often **cannot even be scored** (Shopify wants ~100 samples per metric).

### B. Performance (admin iframe)

At **75th percentile**, with latest App Bridge so Shopify can collect vitals:

| Metric | Target |
| --- | --- |
| LCP | ≤ 2.5s |
| CLS | ≤ 0.1 |
| INP | ≤ 200ms |

Also: do not tank **storefront** Lighthouse by &gt;10 points (Mcfly is Admin-only → low risk if no theme/script injection).

### C. Integration / safety

- **Embedded** in Admin; latest App Bridge; session tokens
- **No marketing-site clone** as App Home (“must not look identical to mcflyads.com”)
- Primary workflows **inside** Admin (not “go to our SaaS login”)
- Clean uninstall; avoid theme Asset API hacks (N/A for cash desk)
- GDPR webhooks / data care (Mcfly already strong)

### D. Design §4 (the part that shapes craft)

Shopify rejects apps that feel alien. Landmines that matter to Mcfly:

1. Majority of content **not** in card-like Admin containers  
2. Primary buttons **not** Polaris-colored (no green/purple primary zoo)  
3. **Serif/script as majority body** (Fraunces OK in scoreboard island — not whole Settings)  
4. Background wildly different from Admin (full sky-paper SaaS skin)  
5. Tabs change content **above** the tabs  
6. Poor mobile / horizontal scroll  
7. Own nav instead of **`s-app-nav`**  
8. Forms without **Contextual Save Bar** when reasonable  
9. Plan-gated features that look enabled but aren’t (**label + disable** freemium)  
10. Non-dismissible promo spam  

**Hybrid rule (locked):** Polaris owns chrome/forms; Apps Script craft owns the **scoreboard island** only — see [`PREMIUM_NATIVE_UX_RESEARCH.md`](./PREMIUM_NATIVE_UX_RESEARCH.md).

### E. Category trap — Analytics / Ads vs Mcfly religion

BFS **§5.3 Analytics** and **§5.1 Ads** (attribution-style) require **Web Pixel extensions** for event subscription — **no script tags**.

Mcfly’s product **refuses pixels**. Therefore:

- Do **not** position Mcfly as a path-attribution / pixel analytics suite for BFS category scoring.
- Keep listing category voice as **marketing cash close / spend affordability** (coexists with attribution suites).
- If Partner forces an “Analytics” bucket that demands pixels for BFS, **choose craft + religion over the badge** until Shopify’s category map allows a non-pixel cash desk — or document an official exception with Partner support.

**Best of kind ≠ force-fit into pixel Analytics BFS.**

---

## What “best of its kind” means for Mcfly (craft bar)

Independent of the badge — this is how you beat alternatives without cloning TW:

1. **One decision in &lt;10 minutes** — margin → Meta/Google spend → Total ROAS vs break-even  
2. **Glanceable homepage** — decision strip + 4 KPIs + pacing (Admin desk catching `/demo`)  
3. **Sales Goals** — MTD/QTD/YTD semi-gauges + YoY (sales only)  
4. **Honesty** — SAMPLE labeled; Free = Meta+Google; Pro gates labeled/disabled (BFS 4.3.7)  
5. **Ritual IA** — Overview · Spend · Goals · Mix · Close · Settings — not a connector zoo  
6. **Trust** — Level 1 PCD, redacts, privacy/DPA path ([`LEGAL_READINESS.md`](./LEGAL_READINESS.md))  
7. **Performance** — keep desk JS lean so future BFS vitals aren’t doomed  

Steal craft from TW/NB/Polar **hierarchy and habit**; never steal pixels/MTA/Compass.

---

## Mcfly gap map (honest)

| BFS / quality area | Status | Next |
| --- | --- | --- |
| Embedded App Bridge + Admin home | Strong | Maintain |
| Webhooks / uninstall / PCD diet | Strong | Partner PCD Level 1 submit |
| Design hybrid (Polaris + island) | In progress | CSB on Settings; card majority on Spend/Settings |
| Freemium labeled | Shipped | Keep Pro locks disabled+labeled |
| Web Vitals | Unknown in field | Instrument after public installs; latest App Bridge |
| 50 installs + 5 reviews | Not started | Post-submit growth |
| Analytics-category web pixels | **Refuse** | Avoid wrong category / don’t chase badge via pixels |
| Admin ↔ demo craft parity | **Active** | Fly deploy + listing shots |

---

## Recommended sequence

1. **Submit Free** — human gates in [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)  
2. **World-class Admin desk** — continue optimal loops (Spend/Close/Mix parity, CSB, banner quieting)  
3. **Instrument Web Vitals** in production once traffic exists  
4. **Apply BFS** only when Partner Distribution shows criteria green — and only if category rules don’t require pixels  

---

## Sources

- https://shopify.dev/docs/apps/launch/built-for-shopify/requirements  
- https://shopify.dev/docs/built-for-shopify  
- https://shopify.dev/docs/apps/design  
- https://shopify.dev/docs/api/app-home/patterns/templates/homepage  
- https://www.shopify.com/partners/blog/built-for-shopify-updates  
