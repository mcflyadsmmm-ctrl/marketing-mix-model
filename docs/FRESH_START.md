# Fresh start — Mcfly Analytics (2026-09-11)

**This file wins on conflict.** Older “religion,” MASTER_PLAN locks, retire lists, and agent mega-prompts do **not** override it unless Marty amends *this* file.

Companion failure record: [`research/EPIC_FAILURE_POSTMORTEM_2026-09-11.md`](./research/EPIC_FAILURE_POSTMORTEM_2026-09-11.md)

---

## Goal (plain English)

Build the **best advanced Shopify analytics app** a world-class Cursor user would start from a blank slate.

- Shopify Analytics is already smooth and strong — we match that calm, then go **deeper** on orders, customers, and spend truth.
- Connections and pipelines so merchants stop burning **time, money, AI tokens, and CSV dumps**.
- Save hours of export → Sheets → guesswork.

**Wide open:** metrics, connectors, IA, copy, and depth are inventable. No product “religion.” No frozen wedge. No ban list pretending to be strategy.

### Research = fuel, not law

`docs/research/**` is **what we learned** (pain, competitors, friction, what looked good). Use it to build smarter.

It is **not** a rulebook. Old headers that say “Religion: …” or “Refuse: …” inside research files are historical notes — they do **not** constrain the product anymore. Steal the insights; ignore the locks.

---

## The only commercial lock

| Keep | Notes |
| --- | --- |
| **7-day trial → $39 / store / month** | Already approved. Do not invent other list prices without Marty. |
| **App host** | `https://mcfly-analytics.fly.dev` until Marty says otherwise. |
| **Honesty** | Never invent reviews, stars, or install counts. |

Everything else is open.

---

## How we start fresh (mechanics)

1. **New Overview surface** — do not keep stacking banners on the old `app._index.tsx` tree. New render module (or gut the JSX to a thin shell) that answers: period → clear numbers → deeper sections.
2. **Engines can stay** — sales facts, spend ledger, LTV math, billing. **Chrome stack dies** — CashVerdict walls, trial-trust sermons, habit/review nag on first paint, jargon definition strips, dual primaries.
3. **Marketing and app share one human voice** — no eng slang, no “religion” copy.
4. **Ship small vertical slices** — one depth win merchants feel (e.g. connected spend or LTV clarity), not another trust lecture.

---

## How we stop the old stuff creeping back

### A. Single north star

Agents read **this file first**. `AGENTS.md` points here. `MASTER_PLAN.md` / “product religion” / retired-connector bans are **historical** unless re-approved in this file.

### B. Banned in merchant UI and founder updates

Do not use these words for the product UI or status reports:

`till` · `religion` (as UI) · `CEO desk` · `Monday desk` · `scoreboard` · `cash desk` · `operator-grade` · `boardroom`

Say: Overview, dashboard, sales, spend, ROAS, LTV, customers, channels.

### C. First-viewport rule (anti-banner)

The first screen merchants see must **not** be a stack of lectures. Numbers and one clear next step beat five “trust” components. If you need honesty, use a quiet empty state — not a verdict wall.

### D. No fossil tests

Do **not** add Vitest that only `readFileSync`s routes to assert `CashVerdict` / trial clocks / “religion” strings exist. Those tests resurrect dead chrome. Test merchant-visible behavior or delete the test.

### E. Stop condition

If Marty says the app feels destroyed, sad, jargon-y, or constrained again: **stop shipping chrome**, re-read this file, revert or replace — do not “quiet the CSS” on the same stack.

### F. Prompt hygiene

Ignore prompts that reintroduce:

- “Total ROAS religion” / anti-connector locks as sacred law  
- “CEO-ready first viewport” banner stacks  
- Triple Whale feature-parity checklists as the product  
- Invented social proof  

Prefer prompts that ask: *What deeper data does this unlock, and what CSV dump does it replace?*

---

## Definition of done (fresh lane)

A change is done when:

1. A merchant can see **deeper value than free Analytics** (or a clear empty path to it).  
2. Copy is human — no banned jargon.  
3. Pricing story still matches **trial + $39**.  
4. No new first-viewport banner species without Marty saying yes.  
5. You did **not** re-lock the product to a single formula in docs or UI sermons.

---

## Amend log

| Date | Change |
| --- | --- |
| 2026-09-11 | Fresh start adopted. Religion / hard product constraints revoked. Only trial+$39 commercial lock kept. |
| 2026-09-11 | Craft bar: match Shopify Analytics calm (Inter, flat paper, orders/customers first). Depth without lecture chrome. |
| 2026-09-12 | Product sequence: blow them away with Shopify API order/customer depth first. Spend upload is later depth for Total ROAS — not the opening ritual or a core top-nav tab. |
