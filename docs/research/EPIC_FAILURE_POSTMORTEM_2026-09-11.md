# Epic failure postmortem — Overview / desk agent era

**Date:** 2026-09-11  
**Branch tip at writing:** `cursor/review-ready-finalize-3706`  
**Owner intent (Marty):** Stop patching. Record the failure. Start over with what still matters.

This is not a soft retrospective. The product that merchants would pay for got buried under agent chrome, internal jargon, and “religion” UI. The listing shot that once looked good is the proof of what we had — and lost.

---

## 1. Verdict

**We did not lack a product idea.**  
Shopify Total Sales ÷ entered spend, deeper than Analytics (LTV, allocation, spend coverage honesty), marketing that speaks human — that wedge is still real.

**We lacked restraint.**  
Thousands of agent iterations added banners, verdicts, clocks, guides, trust chips, CEO copy, and tests that *locked the junk in*. Each commit claimed to “fix craft” or “CEO-ready.” The first viewport got uglier and harder to use.

**Starting from scratch means:** new Overview surface, plain English only, listing-gold composition as the visual north star — **not** another layer on `app._index.tsx` (~1.4k lines) and `mcfly-desk.css` (~11k lines).

---

## 2. What actually worked (keep)

| Keep | Why |
| --- | --- |
| **Total ROAS = Shopify Total Sales ÷ merchant-entered spend** | The only religion that belongs in the *math*, not in the chrome. Honest vs pixels / MTA. |
| **Listing shot 01** (`docs/listing-assets/shots/01-total-roas-vs-breakeven.png`) | Proof the desk can look Shopify-native and useful: period → three cards (ROAS / Sales / Spend) → LTV. No lecture wall. |
| **Manual spend as identity** | Bill → daily rows, CSV, typed day. Differentiator vs OAuth zoo — when the empty Spend path is calm. |
| **$39/store/mo · 7-day trial · Fly app URL** | Pricing and host stay. Never invent reviews or install counts. |
| **Depth beyond Analytics** | LTV / CAC, allocation, coverage honesty, order economics *as depth under the hero* — not as competing first-viewport chrome. |
| **Hostile critique truths** ([HOSTILE_SHIP_CRITIQUE_2026-09-10.md](./HOSTILE_SHIP_CRITIQUE_2026-09-10.md)) | Activation arithmetic, one primary, don’t duplicate free Analytics tiles — still correct. |

---

## 3. What failed (burn or never reintroduce)

### 3.1 Agent jargon leaked into the product and the conversation

Words that made the founder sad and must **never** appear in merchant UI (or as the team’s default metaphor for the UI):

- **Till** — cashier slang agents used for the three-card hero. Merchants say Overview, dashboard, or nothing.
- **Religion** (as UI) — formula lectures, “cash not attribution” walls, definition strips above the numbers.
- **CEO desk / Monday desk / boardroom / operator-grade** — roleplay, not craft.
- **Scoreboard / cash action ready / cash desk** — eng dialect on the surface.
- **CashVerdict** as a **hero wall** — a second story above the gauge that already answers the question.

Internal code names can stay in `lib/` if needed. **Merchant chrome and founder-facing status updates must use plain English.**

### 3.2 Composition inverted against the listing gold

Listing SoT order:

1. Period context  
2. Three-card hero (gauge · sales · spend)  
3. LTV band  

What agents shipped instead (in various commits):

1. Sample / deep-history / trust banners  
2. Trial trust clock  
3. Period trust note with primary CTA  
4. Order economics / first-session guide  
5. **CashVerdict** (“am I making money…”)  
6. *Then* the hero — sometimes **gated off in shot mode** so listing capture itself went blank  
7. Habit nudge, review ask, acquisition, LTV, explorer…

Result: first viewport = sermon. Useful product = below the fold or missing.

### 3.3 “One primary” religion became two or three primaries

Every lane added *its* primary:

- Page slot Update spend  
- Hero Update spend  
- PeriodTrustNote Spread bill  
- Trial clock Fill gaps  
- Order economics unlock  
- CashVerdict next step  

Tests were written to **preserve** these patterns (`cash-desk-ux.test.ts` style source asserts). Bad UX got CI protection.

### 3.4 Docs and “Love / VISUAL / CEO” prompts overfitted agents

Research that was meant to help (`VISUAL_CRAFT`, `LOVE_SCORECARD`, hostile critiques) got treated as **chrome checklists**. Agents optimized for:

- Trust banners above the dial  
- Verdict copy  
- Religion one-liners  
- Stickiness (habit / review)

…instead of **looks good + answers sales÷spend in three seconds**.

### 3.5 Patch loops instead of reverts

When the founder said the app was destroyed, agents:

1. Moved CashVerdict under the hero  
2. Quieted CSS  
3. Renamed comments  

That is **furniture rearrangement in a burned room**. It does not restore the product that looked good.

### 3.6 Scale of the scar tissue

| Surface | Approx size | Problem |
| --- | --- | --- |
| `app._index.tsx` | ~1,380 lines | Loader + every banner species + hero + depth |
| `mcfly-desk.css` | ~11,000 lines | Years of class fossils (`--v2`, shot, CEO, till, verdict…) |
| Source-reading Vitest | many files | Assert string presence of components → freeze failures in |

---

## 4. Root causes (honest)

1. **No hard visual SoT gate** — listing PNGs existed; agents were not required to match them before merge.  
2. **Prompt inflation** — “Shopify engineer grade / CEO usable / religion / trust above dial” → more chrome every turn.  
3. **Fear of “dishonest” ROAS** solved with **UI lectures** instead of quiet empty states and one spend path.  
4. **Tests as fossil record** — source greps rewarded keeping CashVerdict, trial clocks, definition lines.  
5. **No revert culture** — forward-only “fix” commits; rare hard reset to the last beautiful frame.  
6. **Jargon as status** — saying “till” and “religion” felt precise to agents; it felt like the product was dying to the founder.

---

## 5. Lessons (non-negotiable for a clean start)

1. **Merchant words only in UI.** If a founder flinches at the word, delete it from chrome and from status updates.  
2. **Listing shot 01 is the Overview contract.** Period → three cards → LTV. Anything else is secondary or gone.  
3. **Math religion ≠ chrome religion.** Keep sales÷spend. Do not paint it as banners.  
4. **One primary in the first viewport.** Full stop. Other actions are secondary/links.  
5. **Do not source-grep components into immortality.** Test behavior and copy strings merchants see — or delete the test.  
6. **Prefer revert / replace over soften.** If the first viewport is wrong, rip the stack; don’t `margin` it.  
7. **Cold path = one screen, one job.** Get spend next to sales. No dual unlock + guide + clock.  
8. **Depth after the answer.** LTV, allocation, explorer, order economics — *under* the three cards.  
9. **Marketing and app share one voice:** no jargon, no invented social proof, benefit-first.  
10. **Agent stop condition:** if the founder says it’s destroyed / sad / jargon, **stop shipping chrome** and reset composition.

---

## 6. What “start from scratch” means (scope)

### In scope (new Overview)

- New route module (or gut `app._index.tsx` render to a thin shell) that **only** mounts:
  - Period control  
  - Three-card hero (gauge + sales + spend + channel list)  
  - LTV band  
  - One Update spend primary  
- Plain English empty states when sales or spend missing  
- SAMPLE as a quiet mode chip — not an orange verdict wall  
- Shot mode **must** paint the same hero (listing capture)

### Explicitly out of first viewport (delete or defer)

- CashVerdict  
- Trial trust clock banner  
- PeriodTrustNote as a primary CTA wall (inline chip max)  
- Habit nudge / Review ask on Overview  
- Solo “religion definition” paragraph above the hero (formula lives in the gauge aside only)  
- Dual first-session guide + order-economics unlock competing  

### Keep engines, rewrite chrome

Do **not** throw away: spend ledger, sales facts, MER math, LTV cohorts, allocation engine, billing.  
Do throw away: the Overview **presentation stack** and the jargon-locked tests around it.

### Marketing

Separate pass: site copy with **zero** eng/religion jargon; same Total ROAS promise; no fake reviews.

---

## 7. Failure timeline (compressed)

| Phase | Intent | Outcome |
| --- | --- | --- |
| Listing gold | Three-card desk for App Store | Looked useful and good |
| Trust / activation | Bill-first spend, period honesty | Engines OK; banners multiplied |
| “CEO desk” | One answer, one next step | CashVerdict **above** hero; jargon peak |
| “Restore till” | Put hero first again | Still called it till; verdict remained; founder still sad |
| This postmortem | Stop lying that patches heal it | Reset authorized |

---

## 8. Decision log

| Decision | Status |
| --- | --- |
| Stop patching Overview chrome on the failed stack | **Accepted 2026-09-11** |
| Treat listing shot 01 as Overview SoT | **Accepted** |
| Ban till / religion-as-UI / CEO-desk language in merchant UI + founder updates | **Accepted** |
| Keep Total ROAS math + $39 + Fly URL + no invented reviews | **Accepted** |
| New Overview surface (scratch render) before more “craft” commits | **Accepted — next build** |

---

## 9. Next build checklist (when work resumes)

- [ ] New Overview render file (or empty the JSX tree and remount listing-gold only)  
- [ ] Delete Overview mounts of CashVerdict, trial clock, habit, review ask, definition solo line  
- [ ] Rename internal `showTill` → `showHero` (or delete the name)  
- [ ] Rewrite / delete source-grep tests that require CashVerdict on Overview  
- [ ] Visual check: SAMPLE Overview matches shot 01 structure  
- [ ] Founder review **before** another “trust” or “CEO” prompt lane  

---

## 10. One-line moral

**The product was never the banners. The product was three honest numbers and the depth underneath — and we talked ourselves into burying it.**
