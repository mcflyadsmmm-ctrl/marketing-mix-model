# Site craft candidates — Best-of-N

Isolated approaches for curriculum steps. Generators write here when primary `site/**` files are claimed by a peer. Parent / critic picks the higher-scoring candidate; implement winner into `site/**` in a later tick.

---

## Candidate B — Sticky mobile waitlist CTA (curriculum step 2)

**Author:** Generator-B  
**Date:** 2026-07-22  
**Status:** design note only — do **not** land in `site/index.html` or `site/assets/site.css` while Generator-A owns those files  
**Vs default:** full-width bottom sticky bar (“Get early access” → `#waitlist`)

### Thesis

A full-bleed bottom bar converts, but reads as SaaS chrome and eats vertical truth. Prefer a **thumb-dock edge peek** that (1) stays in the natural right-thumb zone, (2) never competes with the hero CTA, and (3) expands into a **compact waitlist sheet** so conversion is one gesture, not scroll-hunt + fill.

### Behavior (mobile ≤720px only)

1. **Hidden** while `.hero` intersects the viewport (hero already owns the CTA budget).
2. **Peek in** after hero exits: a compact vertical rail on the right edge — not a full-width bar.
3. **Tap** expands a bottom sheet with name + email + submit (role/store optional / deferred) — same `data-waitlist` handler as the close band.
4. **Auto-dismiss** when `#waitlist` enters view (IntersectionObserver) so the real close form isn’t doubled.
5. **`prefers-reduced-motion`:** instant show/hide; no slide.

Desktop / wide: no dock — nav CTA + in-page form remain.

### HTML sketch (land later; disjoint file option)

Prefer a single mount node injected by a tiny module so Generator-A’s HTML stays clean:

```html
<!-- site/index.html — one inert mount only when integrating -->
<div id="waitlist-dock" hidden data-waitlist-dock></div>
```

```html
<!-- Expanded structure (built by JS or static in a partial) -->
<aside class="wl-dock" data-waitlist-dock hidden>
  <button type="button" class="wl-dock__peek" aria-expanded="false" aria-controls="wl-dock-sheet">
    <span class="wl-dock__mark" aria-hidden="true"></span>
    <span class="wl-dock__label">Early access</span>
  </button>

  <div id="wl-dock-sheet" class="wl-dock__sheet" role="dialog" aria-labelledby="wl-dock-title" hidden>
    <div class="wl-dock__grab" aria-hidden="true"></div>
    <p id="wl-dock-title" class="wl-dock__title">Join early access</p>
    <p class="wl-dock__sub"><span class="mono">sales ÷ spend</span> — then the till decides.</p>
    <form class="waitlist waitlist--dock" data-waitlist novalidate>
      <label>Email <input type="email" name="email" autocomplete="email" required /></label>
      <label class="sr-only">Name <input type="text" name="name" autocomplete="name" /></label>
      <button class="btn primary solid" type="submit">Request access</button>
    </form>
    <button type="button" class="wl-dock__close">Close</button>
  </div>
</aside>
```

Optional disjoint implementation path (avoids merge thrash): `site/assets/waitlist-dock.js` + `site/assets/waitlist-dock.css`, loaded only on `body.home`, bumped `?v=`.

### CSS sketch

```css
/* Mobile-only thumb dock — cyan/navy only; no purple, no glow stack */
.wl-dock {
  display: none;
}

@media (max-width: 720px) {
  .wl-dock:not([hidden]) {
    display: block;
    position: fixed;
    right: 0;
    bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
    z-index: 40;
    pointer-events: none;
  }

  .wl-dock__peek {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 0.65rem 0.75rem 0.65rem 0.55rem;
    border: 1px solid rgba(94, 231, 240, 0.35);
    border-right: 0;
    border-radius: 0.65rem 0 0 0.65rem;
    background: linear-gradient(160deg, #152036 0%, #0a1221 100%);
    color: #f4f6f8;
    font-family: var(--body);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    box-shadow: none; /* no multi-layer glow */
    transform: translateX(0);
    transition: transform 0.35s var(--ease);
  }

  .wl-dock__mark {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 1px; /* square tick — brand, not pill blob */
    background: var(--cyan);
  }

  .wl-dock__sheet {
    pointer-events: auto;
    position: fixed;
    inset: auto 0 0;
    padding: 0.75rem 1.15rem calc(1.1rem + env(safe-area-inset-bottom, 0px));
    background: var(--paper-2);
    border-top: 1px solid var(--line);
    /* atmosphere without card soup */
    background-image:
      linear-gradient(180deg, rgba(21, 32, 54, 0.04), transparent 40%),
      radial-gradient(120% 80% at 100% 100%, rgba(94, 231, 240, 0.08), transparent 55%);
  }

  .wl-dock__grab {
    width: 2.25rem;
    height: 3px;
    margin: 0.15rem auto 0.85rem;
    border-radius: 2px;
    background: rgba(10, 18, 33, 0.18);
  }

  .wl-dock__title {
    font-family: var(--display);
    font-size: 1.25rem;
    margin: 0 0 0.25rem;
  }

  .wl-dock__sub {
    margin: 0 0 0.9rem;
    color: var(--mute);
    font-size: 0.9rem;
  }

  .waitlist--dock {
    display: grid;
    gap: 0.65rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .wl-dock__peek {
      transition: none;
    }
  }
}
```

### JS sketch (behavior only)

```js
// Pseudocode — IntersectionObserver on .hero and #waitlist
// show dock when hero out AND waitlist out; hide otherwise
// peek toggles sheet; Escape / Close collapses
// reuse existing [data-waitlist] mailto / confirm flow
```

### Pros vs bottom sticky bar

| | Edge peek + sheet (B) | Full-width sticky bar (A typical) |
| --- | --- | --- |
| Hero budget | Never overlaps first viewport | Often peeks under hero or fights lede |
| Content occlusion | Minimal; right rail only | Covers last ~56–72px of every section |
| Conversion path | Sheet = email in 1 tap | Scroll to `#waitlist` still required (or second hop) |
| Craft / anti-slop | Feels like a cash-desk tool tip, not App Store banner | Reads as generic “sticky CTA” SaaS |
| Safe area | Sheet owns home-indicator padding once | Bar permanently fights iOS chrome |
| Brand | Cyan tick + steel gradient; thesis whisper in sheet | Usually one flat button, no thesis |

### Cons / risks

- Slightly more JS than a static `<a>` bar (must be dead-simple; no framework).
- Peek can be missed by left-thumb users — mitigate with short label + high-contrast cyan tick; optional left-edge for RTL later.
- Sheet must not look like a “card stack” — no shadow pile, no pill cluster, one job.
- Critic must verify dock is **off** in hero and **off** at `#waitlist` (double-CTA fail).

### Rubric bet (why B might win)

- **Mobile conversion:** higher — form travels with the thumb; fewer scroll-hunt failures on long digest/contrast bands.
- **Hero budget / brand first:** higher — zero chrome until after thesis lands.
- **Non-slop craft:** higher — edge tool, not banner; cyan/navy only; thesis line keeps religion in the CTA surface.
- **Thesis clarity:** neutral-to-plus — sheet subline restates `sales ÷ spend` at the moment of intent.

Ship B over A if critic mean ≥ A and mobile conversion ≥ 4 with verifier proof (dock absent in hero screenshot; sheet submit path works).

---

## Candidate C — next hero leap after deploy

**Author:** GPT Sol  
**Date:** 2026-07-22  
**Status:** design note only — deploy and verify the current hero first; no `site/**` changes in this tick  
**Working name:** The reconciliation receipt

### Thesis

Replace the familiar split-screen SaaS dashboard hero with one proprietary editorial object: a tall **reconciliation receipt** that makes the category problem visible before it explains it.

Meta claims `$146k`. Google claims `$118k`. Other platforms claim `$31k`. A thin rule totals those claims at `$295k`; the Shopify till below records `$221k`. The claim total is visibly struck, the till total survives, and the receipt resolves to:

```text
$221,296 sales ÷ $63,658 spend = 3.48× cash MER
break-even 2.86× · above by 0.62×
MONDAY CALL: protect the mix; test one shift
```

The copy side remains brand-first and disciplined:

- **Brand:** Mcfly Ads
- **Headline:** Your platforms cannot all have driven the same sale.
- **Lede:** Reconcile ad spend to what Shopify actually sold. Know break-even. Make one budget call.
- **Primary CTA:** Get early access
- **Proof whisper:** No pixels. No path credit. Just sales ÷ spend.

This is not a receipt gimmick or a retro checkout illustration. It should feel like an audited cash artifact: warm paper against Mcfly navy, sharp mono numerals, one cyan truth rule, one red claim strike, restrained grain, and no floating cards. The visual owns the first viewport; the product desk can appear below as evidence of the weekly ritual.

### Motion story

One quiet sequence, then stillness:

1. Platform claim lines print in quickly.
2. Their impossible combined total resolves.
3. A single diagonal strike cancels the claim total.
4. The Shopify till line and cash MER equation print in cyan.
5. The Monday call stamps once.

Reduced motion shows the fully reconciled receipt immediately. On mobile, the receipt crops to the contradiction and equation — claim total, till total, cash MER — rather than shrinking the whole artifact.

### Why it could beat Triple Whale marketing craft

Triple Whale can outnumber Mcfly with dashboards, integrations, and attribution surfaces. It is harder for them to own a visual that says **their category’s claimed revenue does not reconcile to the till**. The receipt turns Mcfly’s religion into a recognizable brand asset instead of another software screenshot.

The idea wins through:

- **Category compression:** one object explains over-claiming, reconciliation, cash MER, break-even, and the Monday action.
- **Visual ownership:** the receipt can recur in launch graphics, social cuts, App Store narrative frames, and sales material.
- **Product honesty:** every number is visibly labeled sample data; no fake customer logo, uplift claim, or “AI” flourish.
- **Memorability:** “the receipt that cancels claimed revenue” is easier to recall than a polished KPI grid.
- **Anti-suite confidence:** Mcfly looks deliberately smaller and sharper, not like a thin version of a larger attribution suite.

### Pros vs current hero

| Dimension | Candidate C — reconciliation receipt | Current hero — Monday desk |
| --- | --- | --- |
| Distinctiveness | Ownable editorial symbol; uncommon in SaaS | Excellent execution of a recognizable dashboard pattern |
| Religion at a glance | Shows why platform claims fail, then resolves to cash | States the contrast in copy and proof strike |
| Hero budget | One dominant object with one narrative | Desk contains KPIs, chart, mix, and recommendation |
| Emotional force | Creates a clean “that cannot reconcile” realization | Feels calm, useful, and product-real |
| Mobile | Can crop to three decisive lines | Desk must defer detail and manage density |
| Extensibility | Becomes a campaign system and proof motif | Best suited to product demonstration |
| Product credibility | More conceptual; desk moves below fold | Stronger immediate evidence that software exists |

### Cons / risks

- The current hero is already locally scored around **4.9/5**; changing it before live deployment and visual evidence would replace proven craft with a hypothesis.
- Receipt styling can collapse into diner nostalgia, fintech cliché, or Dribbble theater. It needs art direction closer to an audit artifact than a novelty prop.
- The contradiction must not imply that Shopify sales are incrementality or that Mcfly knows which channel caused a sale. It proves only that platform claims cannot be summed and cash must reconcile.
- Sample numbers need explicit labeling and exact arithmetic. A single mismatch destroys the trust premise.
- Moving the Monday desk below the fold weakens immediate product tangibility; the next band must reveal the real cash-desk ritual without delay.
- The strike animation is the only theatrical beat allowed. Extra stamps, paper curls, cursor effects, or sound would cheapen it.
- “Your platforms cannot all have driven the same sale” is sharper and more defensible than saying every individual platform report is simply false; final copy should preserve that distinction.

### Test against the current hero

Do not replace the current hero on taste alone. After the current build is live and verified, prototype Candidate C in isolation and compare at 1440×900 and 390×844.

Candidate C advances only if reviewers can answer these within three seconds:

1. What is wrong? **Platform claims do not reconcile.**
2. What does Mcfly measure? **Shopify sales ÷ ad spend.**
3. What do I do next? **Compare with break-even and make one budget call.**

It must beat the current hero on distinctiveness and religion comprehension without scoring lower on brand-first hierarchy, mobile CTA visibility, or product trust. Otherwise, keep the Monday desk and reuse the receipt as a campaign/proof band rather than the hero.
