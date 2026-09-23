# Aesthetic plan — light + sky blue (SoT for craft ship)

**Written:** 2026-09-22 ~21:00 America/Denver  
**Thesis pick (Marty):** light surfaces + sky blue accent — **not** Triple Whale dark.  
**Implements craft from:** `05-HOSTILE_VISUAL_AUDIT.md`, `06-APP_AESTHETIC_REBUILD.md`, `07-SITE_AESTHETIC_REBUILD.md`  
**Does not reopen:** `REBUILD_SPEC.md` product/copy/religion (From orders, $68,457 lock, 90/24, SAMPLE_ONLY, no `read_reports`)  
**Ship tree:** `marketing-mix-model/` @ `cursor/spend-trust-recurring`  
**Probed tip:** site **v43** · Fly **446** · SHA `a47be4f` · Phase D live  

**Supersedes for craft execution:** vague “make it world class” loops.  
**Does not supersede:** `CURSOR_OPTIMAL_PLAN.md` for money/religion/Marty gates E–G.

---

# 0. One-page verdict

**What we are shipping.** One light, sky-blue craft system on site + Admin desk so a stranger feels a finished $39 product — Lifetimely **composition** (one morning number, ranked density, calm paper) without TW dark cockpit or their features.

**What “done” means (one publish, curl + browser once):**

1. Site stamp **v44** (or v45 if v44 taken) live on mcflyads.com from one commit on `cursor/spend-trust-recurring`.
2. Fly new version from the **same** commit; `/demo` first fold is **one composition**: display hero $, YoY on the same beat, ≤3 inline support facts, chart as second beat — **not** a soft equal-card farm.
3. Soft KPI language is no longer the default on Overview / Orders / Customers / Spend first folds (`.mcfly-kpi--soft` / soft hero wrappers demoted or unused on first fold).
4. Site home first viewport: brand + locked H1 + one sub + Install/Demo + **one** product frame — no proof-chip farm, no mono apology strip, no second interactive desk in the hero.
5. Opus critic returns **Ship** once; Living Board restamped; cash-machine canvas updated.
6. Product locks unchanged: From orders, Snowdevil lock numbers, empty spend **—**, SAMPLE_ONLY true, no `read_reports`, no invented reviews.

**What we refuse (usage killers):**

- A second research wave or “compare Lifetimely again” agent fleet  
- Dark mode / purple glow / glass / neon TW cosplay  
- Religion or copy rewrites (“Shopify Total Sales” back on Overview hero, Analytics parity)  
- Per-tab micro-PRs or “polish pass 2…12”  
- Opus/Fable on CSS; two browser visual audits of the same build  
- Touching `fly.toml` scopes, billing, Prisma, sales-facts semantics  
- Redesigning Settings / advanced / LTV depth pages in this ship  

---

# 1. Visual thesis (locked)

**Sentence:** Cool paper room, navy ink, one sky accent — a morning desk that looks inevitable, not an ops wiki.

| Axis | Lock | Steal from | Refuse |
| --- | --- | --- | --- |
| Light | Page `#F2F5F8`, paper `#FFFFFF`, ink `#0A1221` / desk `#0F1720` | Lifetimely calm surfaces | TW `#0A0A0A` cockpit |
| Blue | Accent `#0284c7` (site well + desk already); soft `#EEF6FB`; ink accent `#0369A1` | Shopify-native sky | Purple, cyan glow, multi-hue chip farms |
| Hierarchy | One display $, then quiet meta | Lifetimely command number; TrueProfit ≤5 pin | Equal soft tiles |
| Type | Site: Bricolage display + Figtree body. Desk: Fraunces display + Source Sans 3 | Editorial authority | Inter/Roboto defaults; mono kickers |
| Cards | First fold: **no card grid**. Hairline rules + paper plane | Linear/Attio product theater | Soft rounded KPI farms |
| Motion | ≤3 intentional fades/slides, `prefers-reduced-motion` | Presence | Decorative bounce |

**Reference principles only (not layout clones):**

- **Lifetimely:** one morning number owns the fold; everything else subordinates.  
- **Triple Whale:** ranked density and confident type scale — **steal density discipline, not dark UI**.  
- **Linear / Attio (site):** product frame is the proof; sections each do one job.

---

# 2. Token lock (implement once — no palette debates mid-ship)

## Site (`site/assets/mcfly/mcfly.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#F2F5F8` | Page |
| `--paper` | `#FFFFFF` | Surfaces |
| `--ink` | `#0A1221` | Text + primary Install |
| `--mute` | `#5F6B78` | Subcopy |
| `--sky` / well accent | `#0284C7` | Focus, SAMPLE chrome, links — sparingly |
| `--sky-soft` | `#EEF6FB` | Soft wells only |
| Radius | `2px` product language (keep sharp) | No pill farms |
| Section rhythm | `clamp(4rem, 10vw, 7rem)` | Between major sections |

## Desk (`app/app/styles/mcfly-desk.css`)

Keep existing `--mcfly-*` names; **enforce usage**:

| Role | Token / rule |
| --- | --- |
| Hero $ | `--mcfly-kpi-hero` (already `clamp(2.45rem…3.4rem)`) on **one** number per first fold |
| Support | sans ~0.95–1.05rem inline; muted labels |
| Soft mode | `.mcfly-kpi--soft` / `.mcfly-*-hero--soft` **forbidden on Overview/Orders/Customers/Spend first fold** after this ship |
| Accent | `--mcfly-accent: #0284c7` only on period, focus, positive delta |
| Shadow | Keep `--mcfly-shadow` hairline only — no multi-layer glow |

**No new font families.** Load what is already branded.

---

# 3. Model routing (hard caps — no 100 passes)

| Job | Model | Max | Escalate | Banned |
| --- | --- | --- | --- | --- |
| Conductor / probes / merge / deploy | inherit | 1 chat | — | New “finalize craft” chats |
| This plan / thesis conflicts | already done | 0 more | — | Re-research Lifetimely |
| Site CSS + home/pricing/demo HTML structure | **`composer-2.5-fast`** | 1 lane | Same test fails twice → Grok rewrites prompt | Opus on CSS |
| Desk first-fold CSS + TSX composition | **`composer-2.5-fast`** | 1 lane (parallel with Site) | Same | Opus on CSS |
| Ship/HOLD before Pages+Fly | **`claude-opus-5-5-medium`** | **1** | HOLD → one Composer fix → **one** re-Ship only | Fable; second visual audit |
| Browser proof | Conductor `cursor-ide-browser` | **1** pass after green tests | Unclear regression → one screenshot only | Parallel browser agents |
| Smoke curls | Conductor shell | — | — | Agent to curl |

**Pass budget for the whole program:**

| Pass | Allowed |
| --- | --- |
| Implementation | 1 Site + 1 Desk (parallel) |
| Conductor test + commit | 1 |
| Opus critic | 1 |
| Fix after HOLD | ≤1 Composer pass, then re-Ship |
| Publish | 1 (Pages `--branch main` from temp + Fly) |
| **Total frontier calls** | ≤2 (Ship + optional re-Ship) |

If still “sloppy” after Ship + one fix, stop and ask Marty — do not invent pass 3.

---

# 4. Phases (compressed)

## Phase A0 — Branch + freeze (Conductor, 10 min)

- [ ] `git fetch` · confirm `HEAD == origin/cursor/spend-trust-recurring` (or ff).  
- [ ] `git switch -c cursor/aesthetic-v44`.  
- [ ] Do **not** merge cloud PRs. Do **not** touch scopes / SAMPLE_ONLY.  
- [ ] Snapshot done bar baseline: curl home + `/demo` class fingerprints into the PR description only if useful.

## Phase A1 — Desk first folds (Composer Desk lane)

**Exclusive files:**

- `app/app/styles/mcfly-desk.css`  
- `app/app/components/OverviewFirstViewport.tsx`  
- `app/app/components/OverviewYoyCards.tsx`  
- `app/app/components/OverviewSalesChart.tsx` (placement/CSS only)  
- `app/app/components/DeskLane.tsx` (kill babysitter chrome on Overview if still present)  
- `app/app/components/OrdersFirstViewport.tsx`  
- `app/app/components/CustomersFirstViewport.tsx`  
- `app/app/routes/app._index.tsx`, `demo._index.tsx` (composition order only)  
- `app/app/routes/app.orders.tsx`, `demo.orders.tsx`, `app.customers.tsx`, `demo.customers.tsx` (first-fold stack only)  
- `app/app/routes/app.spend.tsx` (first DeskLane only)  
- Matching `*.test.ts` that assert class names / first-fold structure  

**Do:**

1. Overview: one display hero (From orders $) + YoY on same optical beat + ≤3 inline supports + chart second. No soft grid.  
2. Orders: median ticket display $ + mean contrast subline + one band/split — peeks not soft cards.  
3. Customers: returning $ display + new/share subline + one split — no soft peek farm.  
4. Spend: Total ROAS display **or** giant **—**; sales/spend secondary inline; one primary add CTA when empty.  
5. Goals: **out of scope** unless a 10-line CSS-only rebalance is free; prefer skip.  
6. Kill dual “On this page” jump chips from competing with the hero if still in first optical fold (Opus noted Mix close / YoY glance — remove from first fold chrome).  

**Done bar (Desk):**

```bash
cd app && npx vitest run app/lib/overview-first-viewport.test.ts app/lib/book-coverage-honesty.test.ts \
  app/lib/orders-first-viewport.test.ts app/lib/customers-first-viewport.test.ts
# After local serve or Fly preview:
# /demo HTML: no mcfly-kpi--soft in first ~80KB of body (or count ≤0 on Overview root)
rg -n "LOOK HERE FIRST|Look here first" app/app/components app/app/routes/demo._index.tsx app/app/routes/app._index.tsx  # none on Overview
```

**Do not:** change money formulas, greeting copy religion, lock numbers, scopes, site/**.

## Phase A2 — Site craft (Composer Site lane, parallel)

**Exclusive files:**

- `site/assets/mcfly/mcfly.css`  
- `site/index.html`  
- `site/pricing.html`  
- `site/demo.html`  
- `site/about.html` (light touch: type/spacing only)  
- `site/assets/mcfly/chrome.js` only if nav brand weight requires it  
- Stamp: meta `mcfly-version` → **v44**, `mcfly-build` → `aesthetic-light-sky-v44`, bump `?v=` cache keys  

**Do:**

1. Home hero = one composition (already mostly locked copy) — tighten CSS: more paper air, product frame as dominant plane, Install ink button, sky only on focus/SAMPLE.  
2. Remove leftover chip/mono apology styling if any classes remain.  
3. Pricing: one calm plan card; no competitor fee table revival.  
4. Demo shell: thin SAMPLE label; iframe owns product; delete apology essay captions if still present.  
5. Section rhythm + type scale per §2.  

**Done bar (Site):**

```bash
rg -c "Spend next to real Shopify sales" site/index.html   # ≥1
rg -n "Click for detail|still says ad spend|Reviews 0" site/index.html  # none in hero (faq/footer ok once)
rg -o 'mcfly-version" content="v44' site/index.html
rg -n "trial includes 24 months" site/   # none
```

**Do not:** invent reviews, change listing URL, edit `app/**`, deploy Pages.

## Phase A3 — Conductor integrate

- [ ] Both lanes return → `cd app && npm test` (full suite green).  
- [ ] One conventional commit on `cursor/aesthetic-v44` (or two: desk then site — still one PR).  
- [ ] Open one PR → `cursor/spend-trust-recurring`.  

## Phase A4 — Opus Ship (once)

Prompt: diff vs spend-trust-recurring; verify thesis light+sky; first-fold composition; no religion drift; SCOPES untouched. Verdict Ship|HOLD only. Write `docs/research/2026-09-22-revamp/AESTHETIC_CRITIC.md`.

## Phase A5 — One publish (Conductor)

Only after Ship:

1. Merge PR.  
2. Pages: temp copy of `site/` → `wrangler pages deploy <tmp> --project-name mcflyads --branch main` (production; do not leave Preview-only).  
3. `flyctl deploy -a mcfly-analytics` from ship branch.  
4. §5 smoke.  
5. Restamp `docs/LIVING_BOARD.md` + `cash-machine.canvas.tsx`.  

**Rollback:** previous Pages deployment; Fly image from v446.

---

# 5. Publish bar (smoke)

```bash
# tip
git rev-list --left-right --count HEAD...origin/cursor/spend-trust-recurring   # 0 0

# site
curl -s https://mcflyads.com/ | rg -o 'mcfly-version" content="v44'
curl -s https://mcflyads.com/ | rg -c "Spend next to real Shopify sales"
curl -s https://mcflyads.com/ | rg -n "Click for detail|still says ad spend"   # none

# desk
curl -s -o /dev/null -w "%{http_code}\n" https://mcfly-analytics.fly.dev/health   # 200
curl -s https://mcfly-analytics.fly.dev/demo > /tmp/demo.html
rg -c "From orders" /tmp/demo.html
rg -c 'This month is \$68,457' /tmp/demo.html
rg -c -F "Shopify Total Sales" /tmp/demo.html   # 0
rg -c "Look here first" /tmp/demo.html           # 0
# soft farm: Overview first fold should not be a grid of equal soft KPIs
rg -c "mcfly-kpi--soft" /tmp/demo.html           # prefer 0 on first screen; document if residual below fold

# config drift
~/.fly/bin/flyctl config show -a mcfly-analytics | rg "SCOPES|MCFLY_SAMPLE_ONLY"
```

**Browser (once):** home desktop + mobile width; `/demo` Overview fold — screenshot only if Ship unclear.

---

# 6. Lane prompts (paste ready)

## Desk

```text
Task: Aesthetic Desk lane — Phase A1. Model: composer-2.5-fast.
Repo: marketing-mix-model on cursor/aesthetic-v44. Read docs/research/2026-09-22-revamp/AESTHETIC_PLAN.md §1–§2 and §4 A1.
EXCLUSIVE: app/app/styles/mcfly-desk.css + listed first-fold components/routes/tests in the plan. No site/**, no fly.toml, no scopes.
Thesis: light paper + sky #0284c7. One display hero per tab first fold. Kill soft equal KPI farms on Overview/Orders/Customers/Spend first folds. Keep From orders + Snowdevil lock + empty —.
Done: plan §4 A1 done bar + tests green. Do not commit, deploy, or open PRs.
Return: files changed, greps, test output.
```

## Site

```text
Task: Aesthetic Site lane — Phase A2. Model: composer-2.5-fast.
Repo: marketing-mix-model on cursor/aesthetic-v44. Read AESTHETIC_PLAN.md §1–§2 and §4 A2.
EXCLUSIVE: site/** only (css + index/pricing/demo/about). Stamp v44 aesthetic-light-sky-v44.
Thesis: light + sky. Hero = one composition; product frame dominant; no chip apology farm. Keep locked H1/sub/CTAs from REBUILD_SPEC.
Done: plan §4 A2 greps. Do not deploy Pages, commit, or touch app/**.
Return: files changed, greps.
```

---

# 7. Marty gates (unchanged by this ship)

Partner listing Save · support@ MX · reviews · FUNNEL · unpark · L2/`read_reports` stay on `CURSOR_OPTIMAL_PLAN` Phases E–G. This craft ship does **not** wait on them.

---

# 8. Conductor now

1. Get Marty **Approve** on this file (reply “run aesthetic” / “go”).  
2. Branch `cursor/aesthetic-v44`.  
3. Spawn Site + Desk Composer lanes with §6 prompts.  
4. Integrate → Opus Ship → publish once.  

**Do not** start implementation in the same turn as writing this plan unless Marty already said go.
