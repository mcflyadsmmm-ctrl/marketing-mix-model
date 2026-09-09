# Visual craft — Shopify App Home (Mcfly Analytics)

**Lane:** Research (docs only) · **Date:** 2026-09-09  
**Exclusive write:** this file.  
**Audience:** Conductor + Desk — how Mcfly should *look*, *read*, and *feel* as a high-quality embedded Admin app.  
**Not in scope:** Marketing landing pages (`site/**`), Fly deploy, Partner Submit, inventing reviews/install counts, `app/**` edits from this lane.

**Companions:**

- [`BEST_SHOPIFY_APP_UX.md`](./BEST_SHOPIFY_APP_UX.md) — platform IA / empty / primary actions  
- [`MCFLY_NAV_AUDIT.md`](./MCFLY_NAV_AUDIT.md) — nav + cold-path reachability  
- [`PEER_APP_IA_SKETCHES.md`](./PEER_APP_IA_SKETCHES.md) — peer flow steal/refuse (IA; this doc is **visual only**)

**Sources:** Shopify MCP (`learn_shopify_api` → `polaris-app-home`) + `search_docs_chunks` + desk scan of `app._index.tsx`, `app.spend.tsx`, `app.tsx`, `styles/mcfly-desk.css`, banner components. Cited shopify.dev URLs in §8.

---

## Religion lock (do not expand silently)

- **Total ROAS** = Shopify Total Sales ÷ entered spend (not pixel / MTA / channel “truth”)  
- **No Meta/Google OAuth** spend connectors as product identity  
- **Reviews = 0** until honest merchants leave them — never invent ratings, stars, or install counts in UI or copy  
- Flat **$39**/store/mo after 7-day trial  

Visual polish that implies OAuth, causal ROAS, or fake social proof is out of bounds.

---

## 1. What “looks the part” means in Admin (not consumer SaaS)

Mcfly lives **inside Shopify Admin**, in the App Home iframe. Success is **familiarity**, not brand theater.

| Admin-native (aim) | Consumer SaaS (refuse) |
| --- | --- |
| Polaris web components (`s-page`, `s-section`, `s-banner`, `s-button`, `s-heading`, `s-paragraph`, …) | Custom marketing hero, purple gradients, glow, serif body everywhere |
| Paper surfaces, admin spacing, WCAG AA contrast | Dark “product OS,” black alien backgrounds |
| One primary action per context; page actions in `s-page` slots | Equal-weight CTA clusters, landing-page button stacks |
| Status → needs attention → clear next step ([App Home](https://shopify.dev/docs/apps/design/user-experience/app-home-page)) | Splash, feature zoo, “explore the suite” |
| Metrics when data exists ([metrics card](https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/metrics-card)) | Empty chrome with only welcome copy after dismissals |
| Nav in `s-app-nav` (Admin shell) | In-iframe left nav, emoji nav labels, Home duplicate |
| Tone via `s-banner` / badges (info / success / warning / critical) | Custom colored callout cards that fight Admin chrome |

**Cash-desk metaphor (Mcfly-specific):** Overview is a **till scoreboard** (sales ÷ entered spend), Spend is the **ops verb**, Settings is the long tail. Visual craft serves that ritual — not Triple Whale workspace theater.

**Typography rule already in desk CSS:** Admin-near paper; Fraunces/display only on scoreboard heroes (Total ROAS / break-even lock); chrome pages (`mcfly-desk--chrome`) stay Source Sans / Polaris. Do not turn Spend/Settings into a marketing landing.

---

## 2. Visual craft principles

### 2.1 Density

- Prefer **admin density**: readable, scannable, not sparse “SaaS whitespace desert,” not spreadsheet crush.  
- Analytics desks use `s-page` **`inlineSize="large"`** (already on Overview / Spend).  
- Stack **one job per band**: context bar → definition → hero metrics → secondary glances → optional explorer.  
- Soft-gated depth (Goals / Allocation / LTV / Advanced) may stay in nav, but **first viewport** on Overview must not look like seven products.

### 2.2 Tone hierarchy

Use Polaris banner tones as semantic, not decorative ([Banner](https://shopify.dev/docs/api/app-home/v1.1-rc/web-components/feedback-and-status-indicators/banner)):

| Tone | Use for | Avoid |
| --- | --- | --- |
| `critical` | Fail-closed honesty that blocks trust (mock-as-live, spend gaps that distort ROAS) | First-paint scolds before any spend entered; marketing urgency |
| `warning` | Incomplete today, recon drift, margin stale, untrusted zero | Yellow “announcements” |
| `info` | Activation teach, backfill progress, almost-ready | Competing with the primary empty CTA |
| `success` | Day saved / import confirmed | Green CTAs to entice upgrades ([Visual design](https://shopify.dev/docs/apps/design/visual-design)) |

Never rely on color alone — heading + body + iconography/actions.

### 2.3 One primary CTA

- **One** `variant="primary"` per visible context (page slot **or** empty state **or** banner — not all three fighting).  
- Supporting = `secondary` / links / tertiary.  
- Page-level ops → `slot="primary-action"` on `s-page`.  
- Cold empty: primary = Enter / add spend; secondary = learn / margin — never Sample as equal primary on live empty.

### 2.4 Whitespace & sections

- Prefer `s-section` / `s-stack` / `s-grid` with Polaris gaps over ad-hoc card forests.  
- Custom `mcfly-*` scoreboard islands are OK **inside** Polaris page chrome; do not wrap the whole app in a second card nav.  
- Collapse optional depth (`<details>` for Spend Explorer is the right visual pattern — progressive, not deleted).

### 2.5 Banner budget

**Hard budget for Conductor/Desk:**

1. At most **one critical** banner visible above the fold on cold/first session (preferably zero until after first spend).  
2. At most **two** non-dismissible status banners competing with the hero; extras go below KPIs or into chips.  
3. Non-essential chrome = **`dismissible`** on `s-banner` when product allows.  
4. SAMPLE honesty = compact stamp (`SampleDeskBanner` / `mcfly-sample-money-mark`) + DataModeBar — not a full-width critical wall when SAMPLE is on (except import-blocked).  
5. After banners dismiss, home must still show empty CTA or live metrics ([BFS helpful homepage](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)).

Stacking many `CashTrustBanners` + trial clock + deep history + coverage is the main “looks unfinished / hostile” risk.

### 2.6 Charts

- Charts are **supporting evidence**, not the first-session hero.  
- Overview: Total ROAS gauge + sales/spend tiles first; daily explorer behind “optional.”  
- Prefer quiet motion (`prefers-reduced-motion` already respected in `mcfly-desk.css`); no enter theater.  
- Empty / loading chart regions use `mcfly-state` compositions — never a broken SVG void.  
- Do not imply channel attribution from stacked bars; channel list = **entered spend allocation**, labeled honestly.

---

## 3. Comprehension craft

### 3.1 Labels

- Match nav nouns to page headings (Overview / Spend / Settings…).  
- Metric labels: **Shopify Total Sales**, **Total Spend**, **Total ROAS** — not vague “ROAS” or “blended truth.”  
- Buttons: sentence case verbs — Save this day, Update spend, Fill spend gaps ([button hierarchy](https://shopify.dev/docs/api/app-home/v1.0/web-components/actions/button-group)).

### 3.2 Definitions

- Keep the one-line formula visible near the hero (`OVERVIEW_TOTAL_ROAS_DEFINITION` / `mcfly-topbar__def`).  
- Title attributes / footnotes for “cash not attribution” (`CASH_NOT_ATTRIBUTION`) — do not bury religion in Settings-only FAQ.  
- Chips for trust state (“Period not trusted”, “Sales facts loading”) beat another critical banner when the number is already gated.

### 3.3 Progressive disclosure

| Layer | Show when | Visual form |
| --- | --- | --- |
| Cold empty | No live spend / first session | Centered empty (`s-heading` + `s-paragraph` + one primary) |
| Scoreboard | Spend present + facts ready | Gauge + sales/spend tiles |
| Acquisition / LTV snaps | `cashActionReady` | Secondary sections below hero |
| Explorer | Always optional | `<details>` |
| Depth tabs | Soft gate copy, not hidden | Gate overlay — keep honest, keep quiet |

### 3.4 SAMPLE honesty

- SAMPLE on → numbers must be **impossible to mistake for live cash** (stamp + DataModeBar + `mcfly-desk--sample`).  
- Block live CSV/paste while SAMPLE on (critical banner with one primary: Real store) — correct.  
- Never show SAMPLE totals as if they unlock paid reviews or live Total ROAS readiness.  
- Shot/listing mode (`?shot=1`) may strip banners — keep listing captures honest (no fake stars).

---

## 4. Smoothness

### 4.1 Loading

- Prefer App Bridge / Polaris loading cues; desk uses `mcfly-desk--loading` + polite copy (“Refreshing sales and spend…”).  
- Dim KPI boards while loading; avoid layout thrash / flicker (BFS design quality).  
- Prefer `s-button loading` / disabled+explanation over silent dead clicks.  
- Sales facts backfill → info banner or chip, not a blank zero that looks like “your store did $0.”

### 4.2 Forms

- Spend day form owns the first viewport on activation; page primary-action optional when the card already has Save.  
- Persist edits with Contextual Save Bar when editing settings resources (BFS 4.1.5) — Settings should feel Admin-native.  
- Field errors: red, persistent, next to the field — not toast-only.  
- CSV fail-closed: critical banner with fix CTAs; never silent partial import.

### 4.3 Success feedback

- Day saved / import success → `tone="success"` banner + clear next link to Overview (`?stay=1`).  
- Toast OK for lightweight confirms; durable success that changes ritual → banner or inline confirmation.  
- Do not auto-redirect away from the form mid-type.

### 4.4 No jank redirects

From nav audit — visual/smoothness implications:

- Bare `/app` → Spend bounce is product ritual; Overview nav uses `?stay=1`. Any in-page link to Overview **without** `stay=1` after cold install feels like a **broken Home tab**.  
- Post-save CTAs must land on a stable scoreboard, not immediately re-bounce.  
- Prefer soft empty on Overview over thrashing between routes when teaching (or keep bounce but make Spend first paint calm: one teach banner, one form).  
- Retired redirects (`/app/close`, `/app/connections`) must not drop merchants into bounce loops.

---

## 5. Mcfly visual gap list (ranked)

Tags: **(hyp)** = hypothesis for Desk validation · file hints are read-only anchors.

### P0 — hurts “feels native / trustworthy” this week

| # | Gap | File hints | Notes |
| --- | --- | --- | --- |
| P0.1 | **Banner stack density** on Overview when multiple trust signals fire (coverage critical + trial + deep history + facts) | `CashTrustBanners.tsx`, `app._index.tsx` (trial clock, deep history, trust placement) | Budget §2.5. Prefer chips / below-KPI for info; reserve critical for true blockers. Aligns LOVE L14 (early red hole banner). |
| P0.2 | **Cold empty vs bounce dual Home** — visual inconsistency: nav Home needs `stay=1`; bare home jumps | `install-stickiness.ts`, `desk-nav.ts`, `app._index.tsx` cold empty | (hyp) Merchants perceive “broken Overview.” Visually: empty state must be as calm as Spend teach when `stay=1`. |
| P0.3 | **Multiple primaries in hero actions** when scoreboard ready (Update spend + Goals secondary + Share + ledger) | `app._index.tsx` `mcfly-hero-compact__actions` | One primary in the cluster; demote Share/ledger. |
| P0.4 | **Custom scoreboard vs Polaris metrics card** — hero tiles are craft CSS, not `s-*` metrics composition | `mcfly-desk.css` hero / `TotalRoasGauge`, homepage metrics pattern | (hyp) Fine if polished; risk if shadows/tints feel “non-Admin.” Prefer Polaris tokens (`--p-color-bg-surface`) already used — keep expanding that, not Fraunces everywhere. |

### P1 — polish / comprehension

| # | Gap | File hints | Notes |
| --- | --- | --- | --- |
| P1.1 | **DataModeBar + Sample stamp + Settings SAMPLE + Demo** = four SAMPLE stories | `DataModeBar.tsx`, `SampleDeskBanner.tsx`, `/app/demo` | Visually collapse to one chrome pattern (nav audit §7 #5). |
| P1.2 | **Seven always-visible nav items** including soft-gated depth | `desk-nav.ts`, `app.tsx` | Visual noise vs cash-desk three. Soft gates OK; consider quieter “later” affordance (hyp — IA may stay). |
| P1.3 | **Cold empty lacks Polaris empty illustration** | `app._index.tsx` `mcfly-cold-empty` | Platform empty composition recommends illustration + heading + paragraph + CTA. |
| P1.4 | **Spend teach + activation banner + SAMPLE critical** can stack | `app.spend.tsx` banners ~1429+ | Cap to one teach surface above the day form. |
| P1.5 | **Custom period control** vs Admin segmented patterns | `PeriodControl` + `.mcfly-period` | Works; ensure focus-visible / contrast stay AA. |
| P1.6 | **Link farm footer** on Overview (“Allocation · Goals · Settings”) | `mcfly-overview-more` | Duplicates nav — feels pre-App-Bridge. Prefer remove or single “More in nav” note. |

### P2 — later / nice-to-have

| # | Gap | File hints | Notes |
| --- | --- | --- | --- |
| P2.1 | Settings long scroll + `<details>` vs Polaris Settings template / tabs | `app.settings.tsx` (hyp) | Visual IA, not religion. |
| P2.2 | Allocation / LTV tint surfaces (`--mcfly-tint-ltv` purple-ish) | `mcfly-desk.css` | Stay away from purple-on-white SaaS cliché; keep subtle. |
| P2.3 | Chart tooltip motion / explorer density | `SpendExplorer`, explorer CSS | Keep optional; reduce when SAMPLE/shot. |
| P2.4 | ReviewAsk placement after trust | `ReviewAsk.tsx` | Soft only; never fake stars. |
| P2.5 | Loading uses custom state, not always `s-spinner` | `mcfly-state--loading` | Align with Polaris spinner where cheap. |

---

## 6. Steal vs refuse from peer apps (**visual only**)

IA steals stay in [`PEER_APP_IA_SKETCHES.md`](./PEER_APP_IA_SKETCHES.md). Here: **pixels and comprehension chrome**.

| Peer | Steal (visual) | Refuse (visual) |
| --- | --- | --- |
| **Judge.me** | Calm checklist / setup guide blocks; dismissible chrome; Home remains useful after dismiss | Coupon/referral badge walls; review-widget marketing cards in App Home |
| **Matrixify** | Job progress + results clarity; Home as two clear verbs; fail-closed error panels | Bulk-editor density as default Overview |
| **Gorgias** | Job surface dominance (Inbox calm); secondary chrome collapsed | Ticket chrome, view trees, AI agent side panels |
| **Recharge** | Home as status; ops mid-nav; Analytics as depth visual quiet | Subscription feature forests, upsell modules as first paint |
| **Triple Whale** | Summary scoreboard focus; metric definition honesty | Workspace zoo, dark OS, pixel/MTA dashboards, creative cockpits |
| **Keel / Kipify** | Glanceable single blended number | OAuth connector walls, KPI tile explosion, AI analyst panels |
| **Klaviyo** | Connection-health strip before “alive” UI | ESP suite marketing layout inside embed |
| **SyncWith** | Honest “pipe vs decision” labeling | Field-picker report builder UI as Mcfly identity |

**Mcfly visual identity to protect:** paper desk, cyan/navy accents on explorer only, honesty stamps, Total ROAS gauge — not Meta blue OAuth buttons.

---

## 7. Checklist for every Desk PR — “definition of visually done”

Ship only if the PR meets **all** applicable rows:

### Native Admin

- [ ] Primary UI uses Polaris `s-*` for page chrome (page, banners, buttons, headings, paragraphs, sections).  
- [ ] No new in-iframe primary nav; no emoji in `s-app-nav`.  
- [ ] No non-Admin primary colors on CTAs (no purple/green “marketing” primaries).  
- [ ] Text contrast aims WCAG AA; status not color-only ([Visual design](https://shopify.dev/docs/apps/design/visual-design)).  
- [ ] Mobile: no unreachable actions / horizontal trap on first viewport.

### Hierarchy & banners

- [ ] ≤1 primary CTA in the focused viewport.  
- [ ] Banner budget respected (§2.5); new banners justify tone.  
- [ ] Non-essential banners dismissible when product allows.  
- [ ] After dismiss, page still has empty CTA or live metrics.

### Comprehension

- [ ] Total ROAS labeled as sales ÷ **entered** spend wherever a hero number appears.  
- [ ] SAMPLE mode clearly stamped; no live/sample mix.  
- [ ] No invented reviews, star ratings, or install counts in UI copy.  
- [ ] Empty states explain what will appear + one unblocker CTA ([Empty state](https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/empty-state)).

### Smoothness

- [ ] Loading/error states polite and non-flicker; untrusted zeros not shown as $0.00 success.  
- [ ] Form success feedback present; destructive actions critical + separated.  
- [ ] Links to Overview after cold install include `stay=1` when needed.  
- [ ] `prefers-reduced-motion` not broken by new animation.

### Religion

- [ ] No Meta/Google OAuth UI introduced as the visual primary.  
- [ ] No pixel / MTA / “true ROAS” chrome.  
- [ ] ReviewAsk remains soft and post-trust only.

---

## 8. Source index

| Topic | URL |
| --- | --- |
| App Design Guidelines | https://shopify.dev/docs/apps/design |
| Visual design (color / contrast) | https://shopify.dev/docs/apps/design/visual-design |
| App Home page UX | https://shopify.dev/docs/apps/design/user-experience/app-home-page |
| Built for Shopify requirements | https://shopify.dev/docs/apps/launch/built-for-shopify/requirements |
| BFS design requirements changelog | https://shopify.dev/changelog/new-built-for-shopify-design-requirements |
| Empty state composition | https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/empty-state |
| Metrics card | https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/metrics-card |
| Homepage template | https://shopify.dev/docs/api/app-home/v1.0/patterns/templates/homepage |
| Banner component | https://shopify.dev/docs/api/app-home/v1.1-rc/web-components/feedback-and-status-indicators/banner |
| Patterns index | https://shopify.dev/docs/api/app-home/v1.0/patterns |
| App Home web components | https://shopify.dev/docs/api/app-home/v1.0/web-components |

---

## 9. Desk handoff (one paragraph)

Treat Mcfly as a **Polaris-native cash desk**: large `s-page`, calm empty → Enter spend, then a readable Total ROAS scoreboard with one primary “Update spend,” definitions on-canvas, SAMPLE stamped, charts optional, banners on a budget. Steal Judge.me/Matrixify calm guidance and TW metric honesty; refuse OAuth walls, KPI zoos, and consumer-SaaS hero theater. Use §7 as the PR gate before any visual flourish that fights Admin.

---

*Research lane · docs only · no `app/**` edits · no commit · no deploy.*
