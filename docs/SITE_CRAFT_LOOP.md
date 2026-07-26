# Site craft loop — mcflyads.com

**Goal:** World-class marketing site that excites Shopify *and* non-Shopify audiences with accurate, easy-to-digest marketing analytics. App finalization waits until site craft is strong.

**Priority:** While D0 is open, the local orchestrator spends **≥80% of ticks** on `site/**`. App/QA only when site is blocked or a gate is red.

## Training-style multitask (how the swarm works)

Borrow the same loops used to train stronger models — applied to craft, not features:

| Role | Job | Parallel? |
| --- | --- | --- |
| **Generator** | Ship one curriculum step into `site/**` | Yes (disjoint files) — **Fable** for hero/authority; **Grok** for secondary/hygiene |
| **Critic / reward** | Score vs rubric below; refuse slop & product-religion breaks | Always parallel — prefer **Grok** |
| **Verifier** | Browser/mobile evidence (screenshot or DOM proof) | After generator — **Grok** or shell |
| **Distiller** | Turn critic fails → next tick brief (1 paragraph) | End of tick — **Fable** if strategic |

**Best-of-N (when stuck):** spawn 2 generators on isolated approaches for the *same* curriculum step; parent keeps the higher critic score. Prefer worktrees / non-overlapping edits over merge fights.

**Curriculum (in order — do not skip ahead):**

1. First-viewport thesis (brand → conflict headline → `sales ÷ spend` → CTA → desk)
2. Sticky mobile waitlist CTA
3. Proof band before primary CTA
4. Motion (≥2 intentional; reduced-motion safe)
5. Secondary pages (privacy/terms/support/pricing) parity + craft
6. Live deploy verify (`?v=` matches; hero matches local)

## Each tick

1. Orient: local `site/index.html` vs live https://mcflyads.com (`?v=`, h1)
2. Pick **next curriculum step** only
3. Spawn Generator + Critic in parallel; Verifier after Generator lands
4. Product religion: cash MER on the desk; never ship pixels/MTA — site **may** demystify them (`docs/POSITIONING_PIXEL_HONESTY.md`)
5. Audience bar: non-Shopify founder “gets it” in first viewport + digest
6. Anti-slop: no purple SaaS, no hero card soup, no Inter, cyan/navy accents only
7. Bump `?v=` on touched assets
8. Distiller writes next brief; ask human for taste pass when stuck on aesthetics

## Reward rubric (critic scores 1–5 each)

- Brand first (hero survives “remove nav” test)
- Thesis clarity (cash MER = sales ÷ spend in ≤3 seconds)
- Hero budget (no cards/stats/clutter in first viewport)
- Mobile conversion (waitlist reachable without hunting)
- Non-slop craft (not generic AI SaaS)
- Authority honesty (explains why path tools fail without selling a pixel/MMM product)
- Product religion (site CTA still cash desk / waitlist — not SyncWith/MMM/forever-free)

Fail any religion item → reject diff. Ship only if mean ≥ 3.5 or clear step win.

## Stop when

User says stop, or D0 in MASTER_DIRECTIVE is met and human says “site locked — app next.”
