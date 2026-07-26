# Premium Shopify-native UX research — Mcfly cash desk

**Researched:** 2026-07-23  
**Thesis (locked):** TW / Northbeam / Polar sell proprietary science; the real moat is usability, layout, digestible hierarchy, and habit. Mcfly competes on **craft + cash MER honesty** — not feature parity.  
**Religion:** cash MER = Shopify sales ÷ ad spend; break-even from margin; rules-based allocation. **Refuse** pixels, MTA, path / view-through / “true ROAS,” TW clones.  
**Scoreboard craft SoT:** [`APPS_SCRIPT_CRAFT_SPEC.md`](./APPS_SCRIPT_CRAFT_SPEC.md) + `vendor/mer-apps-script/` (script `1Ws8OibDzYP4HQR8q04TP_PU5zytokIcz6y8eRQuRidzWY9VyzUARINfS`).  
**Companions:** [`COMPETITORS.md`](./COMPETITORS.md) · [`INDUSTRY_LEADERS.md`](./INDUSTRY_LEADERS.md) · [`COMPETITIVE_APP_STORE_GAP_AUDIT.md`](./COMPETITIVE_APP_STORE_GAP_AUDIT.md) · [`CURSOR_DESIGNER_PLAYBOOK.md`](./CURSOR_DESIGNER_PLAYBOOK.md) · skill `.cursor/skills/mcfly-premium-native-ux/`.  
**Shopify sources:** [App Design Guidelines](https://shopify.dev/docs/apps/design) · [App structure](https://shopify.dev/docs/apps/design/app-structure) · [Layout](https://shopify.dev/docs/apps/design/layout) · [Built for Shopify — Design §4](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements#design) · Polaris App Home patterns (Homepage / Settings / Index / Empty state).

Tags on craft items: **STEAL_CRAFT** (legal/ethical UX patterns) · **NEVER_CLONE** (attribution theater / category mistakes).

---

## 1. Theater vs craft

### What they sell as science

| Claimed magic | Product packaging | What operators actually feel |
| --- | --- | --- |
| First-party pixel / identity | Setup wizard, “recover lost conversions,” install checklist | Friction + delayed TTFV; confidence theater until models disagree with finance |
| MTA model picker (7 models, Triple Attribution, Clicks + Views) | Dropdown science; “court of appeal” copy | Habit of **arguing paths** instead of asking “did ads clear the till?” |
| MMM / Compass / Causal Lift | Calibration narrative, enterprise badges | Weeks of onboarding; black-box when cash and model diverge |
| CAPI / Apex / Sonar passback | One-click “optimize the algorithm” | Plumbing productized as insight |
| Moby / Profit Agent / Ask Polar | Chat as OS; Slack agents | Surface area + prompt UX — not a new MER equation |
| 400-metric semantic layer (Polar) | Warehouse BI credibility | Analyst density; Monday anxiety, not a ritual |

**Founder correction (from COMPETITORS.md):** almost none of this is proprietary math. It is **access + joins + rules + packaging**. The hard-to-copy pieces are distribution, habit, CSM, and surface-area polish — not secret formulas.

### What is actually craft (and what Mcfly should beat)

Premium embedded apps win the first 10 seconds on:

1. **One dominant number** with a plain-language definition under it  
2. **Period control** that feels like Admin filters (segmented, sticky context)  
3. **Empty → first value** path that does not orphan the merchant  
4. **Density that matches the job** (scoreboard tight; settings airy)  
5. **Motion restraint** (no enter theater, no auto-modals)  
6. **Nav IA** that matches the Monday ritual, not a feature zoo  

TW’s OS, Northbeam’s court, Polar’s ski-resort BI **feel premium** because hierarchy and habit are productized — then they bolt science theater on top. Mcfly keeps the craft layer and **deletes the theater**.

### Implication

- Steal **information architecture and ritual UX**, not pixels / model pickers / GMV-tax pricing.  
- “World-class” for Mcfly = Apps Script scoreboard clarity **inside** Admin trust patterns — not a third SaaS skin fighting Polaris.

---

## 2. Steal list (legal / ethical craft)

| Pattern | What to steal | Tag |
| --- | --- | --- |
| **Information hierarchy** | One decision sentence → one hero KPI → supporting sales/spend → secondary panels. Leaders bury MER among ROAS tiles; reverse that. | **STEAL_CRAFT** |
| **First viewport** | Outcome first (cash MER vs break-even). No Settings-first screenshot energy in-product either. | **STEAL_CRAFT** |
| **Empty states** | Polaris Empty state composition: what is missing, why it matters, one primary CTA (Add spend / Set margin). TW’s blank dashboards kill retention — so does ours if copy is weak. | **STEAL_CRAFT** |
| **Period controls** | Segmented windows (MTD / YTD / custom presets) with sticky “as-of” context rail — Apps Script + Admin filter vibe. | **STEAL_CRAFT** |
| **KPI emphasis** | Emphasize one metric (Cash MER); others subordinate with quiet deltas. Not a 12-tile equal zoo. | **STEAL_CRAFT** |
| **Density** | Scoreboard = high density, short labels, tabular nums. Settings / Spend upload = lower density, Polaris sections. | **STEAL_CRAFT** |
| **Motion restraint** | ≤160ms fades; honor `prefers-reduced-motion`; no auto popovers / review nag modals (BFS 4.3.x). | **STEAL_CRAFT** |
| **Nav IA** | Ritual order: Cash MER · Spend · Allocation · Settings. Hide unfinished / ops-only surfaces from primary nav. | **STEAL_CRAFT** |
| **Onboarding as checklist** | Concise, dismissible setup steps (margin → spend → desk) — BFS “helpful onboarding,” not a pixel DNS ceremony. | **STEAL_CRAFT** |
| **Demo / sample data** | Leaders use “View demo store” + rich screenshots. Mcfly’s sample desk + `?shot=1` is the craft equivalent — keep SAMPLE labeled; OFF before review. | **STEAL_CRAFT** |
| Pixel / identity install | Triple Pixel, Polar Pixel, TrueProfit Pixel | **NEVER_CLONE** |
| Model picker / path credit UI | MTA dropdowns, view-through toggles, “true ROAS” | **NEVER_CLONE** |
| Compass / Causal Lift / MMM cockpit | Calibration theater as product spine | **NEVER_CLONE** |
| AI OS as identity | Moby / Profit Agent as the home metaphor | **NEVER_CLONE** |
| Connector zoo | SyncWith marketplace as Mcfly product | **NEVER_CLONE** |
| GMV / order-volume tax UX | Upgrade walls that punish growth | **NEVER_CLONE** |
| Inverted MER | TW spend÷revenue presentation | **NEVER_CLONE** |
| Customer PII LTV on first listing | Lifetimely-class CRM depth | **NEVER_CLONE** |

---

## 3. Shopify-native bar (“feels Admin”)

### Principles (shopify.dev)

- **Match Admin** — predictable over “different for its own sake” ([App Design Guidelines](https://shopify.dev/docs/apps/design)).  
- **App anatomy** — Admin chrome + **s-app-nav** + page header + app body ([App structure](https://shopify.dev/docs/apps/design/app-structure)).  
- **Polaris web components** (`s-*`) from CDN — evolve with Admin; framework-agnostic.  
- **Layouts** — Homepage / dashboard density; Settings template (label column + form); Index/full-width for tables; majority content in **card-like containers** / `s-section` ([Layout](https://shopify.dev/docs/apps/design/layout)).  
- **Mobile-first** — stack columns; no horizontal page scroll.  
- **Helpful homepage** — after dismissing banners, still show live metrics / setup status (BFS 4.2.3). Mcfly’s Cash MER homepage already aims here.

### App Bridge / Polaris patterns Mcfly should lean on

| Surface | Pattern | Mcfly mapping |
| --- | --- | --- |
| Primary nav | `s-app-nav` + `s-link` | Already in `app.tsx` — keep concise labels |
| Page chrome | `s-page` heading + actions | All ritual routes already wrap `s-page` |
| Forms | Contextual Save Bar (`shopify.saveBar`) | Settings still uses in-page submit — BFS gap |
| Feedback | `s-banner`, toast for transient success | Spend/Settings banners OK; avoid toast-only errors |
| Structure | `s-section`, `s-stack`, `s-box` | Spend/Demo stronger; Cash MER / Allocation heavier custom |
| Templates | Homepage · Settings · Index · Empty state | Use Polaris templates on Spend/Settings; reserve custom desk for scoreboard |

### Built for Shopify design landmines (relevant to Mcfly)

From BFS §4.1.1 rejection examples — **treat as constraints on the hybrid**:

1. Majority of content **not** in card-like containers  
2. Primary buttons that are **non-Polaris colors** (green/purple cosplay)  
3. **Serif/script as the majority typeface** for body content  
4. Background **significantly different** from Admin (full-page black / loud skins)  
5. Spacing / body text size far from Admin  
6. Sub-pages without a clear back path to parent  
7. Forms that **should** use Contextual Save Bar but ship a lone Save button  

**“Feels Admin” for Mcfly** = Polaris chrome + ritual IA + honest metrics homepage + scoreboard craft **contained** so it reads as a purpose-built instrument, not a second product skin.

---

## 4. Mcfly tension — Fraunces desk vs Polaris

### Current hybrid (repo truth)

| Layer | Implementation | Risk / strength |
| --- | --- | --- |
| Shell | `AppProvider` + `s-app-nav` + per-route `s-page` | Strength — native bones |
| Scoreboard | `.mcfly-desk` / Fraunces + Source Sans 3 / `#e8f2fa` paper (`mcfly-desk.css`) | Strength for listing shots + Apps Script parity; **BFS risk** if serif + sky paper dominate Settings/Spend too |
| Duplicate titles | `s-page heading` **and** `.mcfly-topbar__title` h1 on Cash MER / Allocation / Settings | Feels non-Admin; wastes first viewport |
| Settings | Custom lock instrument + in-page Save | Ritual clarity good; CSB + Settings template still missing |
| Spend | `s-section` + coverage strip + CSV | Closest to native; good model for other pages |
| Demo | Primary nav item | Ops/listing tool in merchant IA — trust/noise risk |
| Motion | 160ms fade, reduced-motion respected | Aligned with Apps Script + BFS restraint |

### When custom is OK

- **Cash MER homepage scoreboard** (decision strip, 4-up KPIs, channel bars, equation) — product identity; Apps Script SoT.  
- **Allocation decision strip + score cards** — same ritual language.  
- **Listing `?shot=1`** composition — conversion craft, not daily Admin chrome.

### When custom fights Admin trust

- Wrapping **Settings / Spend / Demo** in full sky-paper desk + Fraunces display for body UI.  
- Custom primary buttons that ignore Polaris `s-button`.  
- Chip soup / duplicate page titles under Admin’s title bar.  
- Demo / sample tooling in always-on primary nav for every merchant.  
- Treating the entire iframe as a branded SaaS product (BFS: don’t embed a marketing-site clone).

### Hybrid rule (locked for agents)

> **Polaris owns chrome, forms, tables, empty states, and save. Apps Script owns the cash scoreboard island.**  
> Soften or drop `.mcfly-desk` paper on Settings/Spend; keep Fraunces for KPI values + decision takeaways on Cash MER / Allocation only.

---

## 5. Skill stack for Cursor (research → implement loop)

### Shopify plugin skills (use by name)

| Skill | When |
| --- | --- |
| `shopify-polaris-app-home` | `s-page` / `s-section` / Empty state / Settings / Homepage templates |
| `shopify-app-store-review` | Before claiming BFS / approval readiness |
| `shopify-dev` | Fresh shopify.dev patterns (nav, save bar, App Bridge) |
| `shopify-use-shopify-cli` | Dev store install / deploy when verifying Admin feel |
| Mcfly `mcfly-apps-script-craft` | Cash MER scoreboard parity only |
| Mcfly `mcfly-premium-native-ux` | This research — hybrid + steal list + backlog |
| Mcfly `mcfly-shopify-compliance` | PCD / GDPR / listing — orthogonal but gate ship claims |

### Cursor moves

| Move | Role |
| --- | --- |
| **Design Mode** (`Cmd+Shift+D`) | Point at MER / period / empty state; spatial edits over CSS archaeology |
| **Research Task** (Grok / Composer / GPT Sol) | Re-read BFS + competitors; refresh this doc — **no Claude required** |
| **Craft implement** (Grok / GPT Sol / Composer) | One file owner per lane (see playbook) |
| **Critic Task** (Grok) | Score against BFS §4 + steal list + religion refuse |
| **Ship-gate** | `bash scripts/agent-ship-gate.sh` before “done” |

### Recommended loop (45–90 min)

1. Orient — this doc + `APPS_SCRIPT_CRAFT_SPEC.md` + target route.  
2. Spawn **craft** (one owner) + **Grok critic** in parallel.  
3. Design Mode pass on embedded Admin iframe.  
4. Critic: “Would BFS reject serif/background/CSB/nav?”  
5. Ship-gate; update checklist only with evidence.

Models for this lane (founder constraint): **Grok / Composer / GPT only** — do not stall on Claude quota.

---

## 6. Ranked AGENT_FIX backlog (top 8)

Concrete, religion-safe, **no attribution features**. Prefer hybrid polish over rewrite.

| Rank | P | AGENT_FIX | File targets | Done when |
| ---: | --- | --- | --- | --- |
| 1 | **P0** | **Kill duplicate page titles** — rely on `s-page heading` for Admin title bar; demote or remove `.mcfly-topbar__title` h1 (keep micro-definition + period). | `app._index.tsx`, `app.allocation.tsx`, `app.settings.tsx`, related CSS in `mcfly-desk.css` | One title in chrome; definition line remains |
| 2 | **P0** | **Settings → Contextual Save Bar** — dirty margin/target triggers App Bridge save bar; discard restores; block nav away while dirty (BFS 4.1.5). | `app.settings.tsx` (+ small App Bridge save-bar wiring) | No lone Save as only pattern; CSB works |
| 3 | **P0** | **Nav IA: Demo out of primary ritual** — keep route for listing ops; remove from `s-app-nav` (or gate to sample-enabled / staff). Ritual: Cash MER · Spend · Allocation · Settings. | `app.tsx` (optional deep-link from Cash MER / docs) | Merchant nav = 4 ritual items |
| 4 | **P1** | **Desk paper scope** — full `.mcfly-desk` sky paper + Fraunces body only on Cash MER (+ Allocation scoreboard). Settings/Spend: Admin-default background + `s-section` cards; Fraunces optional on BE lock value only. | `mcfly-desk.css`, `app.settings.tsx`, `app.spend.tsx`, `app.demo.tsx` | ✅ Done 2026-07-24 — `mcfly-desk--chrome` on Settings/Spend/Demo; sky paper on Cash MER / Allocation only |
| 5 | **P1** | **Polaris Empty state on zero-spend homepage** — replace/augment `.mcfly-guide-empty` with Empty state composition (heading, body, primary Add spend, secondary Settings). | `app._index.tsx` | ✅ Done 2026-07-24 — `s-section` empty state + primary Add spend + secondary Settings when `zeroSpendEmpty` |
| 6 | **P1** | **Settings template alignment** — description column (“Break-even locks from contribution margin”) + form column; keep live BE preview instrument. | `app.settings.tsx` | ✅ Done 2026-07-23 — `.mcfly-settings-template` desc + form; BE lock + `data-save-bar` kept |
| 7 | **P1** | **Shared period control component** — one segmented control used by Cash MER + Allocation (a11y tabs, URL `period`, shot mode). | new small component or shared partial; `app._index.tsx`, `app.allocation.tsx` | ✅ Done 2026-07-23 — `components/PeriodControl.tsx` + `parsePeriodPreset` |
| 8 | **P2** | **Mobile density pass** — KPI 4-up → 2×2; period buttons wrap without horizontal scroll; channel bars stack. | `mcfly-desk.css` (+ light markup if needed) | ✅ Done 2026-07-23 — ≤520px KPI 2×2, period wrap, channel stack |

### Explicitly not in this backlog

Pixels, MTA UI, connector zoo, AI OS home, GMV upgrade walls, LTV CRM, Connections nav until live OAuth — **WONTFIX_RELIGION** / defer per MASTER_PLAN.

---

## 7. Research megaprompt (paste for future cycles)

```
Deep RESEARCH cycle — Mcfly premium Shopify-native UX (NOT TW feature parity).

Repo: marketing-mix-model. Religion: cash MER = sales ÷ spend; refuse pixels/MTA/path ROAS.

Read: docs/PREMIUM_NATIVE_UX_RESEARCH.md, docs/APPS_SCRIPT_CRAFT_SPEC.md,
docs/COMPETITORS.md, docs/CURSOR_DESIGNER_PLAYBOOK.md,
app/app/routes/app.tsx + ritual routes, app/app/styles/mcfly-desk.css,
https://shopify.dev/docs/apps/design + Built for Shopify Design §4.

Update PREMIUM_NATIVE_UX_RESEARCH.md only:
1) Theater vs craft deltas since last research
2) STEAL_CRAFT vs NEVER_CLONE table (add/remove with evidence)
3) Shopify-native bar (Polaris web components / App Bridge / page patterns)
4) Fraunces desk vs Polaris tension — hybrid rule still valid?
5) Ranked AGENT_FIX top 8 with file targets (craft only)
6) Refresh megaprompt if process changed

Models: Grok / Composer / GPT only. Do NOT implement large UI rewrites unless a tiny P0 is obvious.
Do NOT commit unless asked. Return: paths + top 5 AGENT_FIX + 3 founder Cursor steps.
```

---

## How founder should use Cursor next (3 steps)

1. **Arm the skill** — in chat: “Follow `mcfly-premium-native-ux`; execute AGENT_FIX #1–#3 only.”  
2. **Design Mode in Admin** — open embedded Cash MER + Settings; multi-select duplicate titles / Save; apply hybrid rule visually.  
3. **Critic pass** — spawn Grok: “Score against BFS §4.1 + PREMIUM_NATIVE_UX_RESEARCH steal list; refuse pixels.” Then ship-gate.

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-07-24 | P1 #4 desk chrome scope, P1 #5 zero-spend Polaris empty state (code evidence in routes + `mcfly-desk.css`) |
| 2026-07-23 | Catch-up: P1 #6 Settings template, P1 #7 PeriodControl, P2 #8 mobile density |
| 2026-07-23 | Initial deep research cycle; hybrid rule + top 8 AGENT_FIX from repo + shopify.dev BFS Design §4 |
