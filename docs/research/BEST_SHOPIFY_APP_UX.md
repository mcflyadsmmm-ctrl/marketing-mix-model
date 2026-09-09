# Best Shopify App UX — platform patterns for Mcfly (research)

**Lane:** Research (docs only) · **Date:** 2026-09-09  
**Scope:** How Shopify wants **embedded App Home** structured — nav, empty states, primary actions, first-session flow.  
**Sources:** Shopify MCP (`learn_shopify_api` → `polaris-app-home` / `app-store-review`) + `search_docs_chunks` + public shopify.dev pages cited below.  
**Not in scope:** Code edits under `app/**` or `site/**`, commits, deploys, inventing reviews/install counts.

**Religion lock (do not expand silently):**

- Total ROAS = Shopify Total Sales ÷ entered spend  
- No Meta/Google OAuth spend connectors  
- Reviews stay **0** until honest merchants leave them — never invent ratings or install counts  
- Flat $39/store/mo after 7-day trial  

---

## 1. Platform patterns (blessed)

### 1.1 App Home is the product, not a splash page

Shopify expects App Home to answer, on first glance: **Is this set up? Is it working? What should I do next?**

Blessed behaviors ([App Home page](https://shopify.dev/docs/apps/design/user-experience/app-home-page), [Built for Shopify — helpful homepage](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)):

- **Status** — clear setup / working state (not a static welcome).  
- **Immediate needs** — surface what needs action today.  
- **Clear CTAs** — one dominant next step visible without hunting.  
- **Metrics when the domain has them** — homepage should show app-relevant performance numbers once data exists ([metrics card composition](https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/metrics-card)).  
- **Dismissible chrome** — after banners/guides are dismissed, the home must still be useful (not only links or a static hello).  
- **Support discoverable but out of the way** — nav item, footer help, or consistent secondary placement.

Layout: wrap home in `s-page` with sections; prefer **large** inline size for analytics-style desks ([Page](https://shopify.dev/docs/api/app-home/v1.1-rc/web-components/layout-and-structure/page)). Use Polaris web components (`s-*`) / App Bridge so the UI matches admin chrome ([App Design Guidelines](https://shopify.dev/docs/apps/design)).

Canonical compositions/templates: [Homepage template](https://shopify.dev/docs/api/app-home/v1.0/patterns/templates/homepage), [Patterns index](https://shopify.dev/docs/api/app-home/v1.0/patterns).

### 1.2 Navigation: `s-app-nav` / App Bridge nav (not in-body IA)

Primary navigation belongs in the **Shopify admin shell**, not a custom left nav inside the iframe.

| Pattern | Rule |
| --- | --- |
| Component | `s-app-nav` with `s-link` children ([App nav](https://shopify.dev/docs/api/app-home/v1.0/app-bridge-web-components/app-nav), [Navigation design](https://shopify.dev/docs/apps/design/navigation)) |
| Home | App name in the sidebar already goes home (`/` default). Do **not** add a duplicate “Home” nav item. If home is `/app`, use one `s-link` with `rel="home"` (hidden from the menu) |
| Labels | Short nouns (1–2 words): Settings, Spend, Reports — not “Manage spend” |
| Count | Keep ≤7 visible items; extras collapse to “View more” |
| Depth | Single level only — no nested nav items |
| Order | Most-used sections first; labels match destination page titles |
| Tabs | Secondary only: change content **below** tabs, never above; no wrap; tabs don’t jump ([BFS changelog](https://shopify.dev/changelog/new-built-for-shopify-design-requirements)) |
| Header | Page header / title bar is for **in-page actions**, not main nav |
| Body | Do **not** replicate the nav as a card of page links |

JS navigation: App Bridge Navigation API when leaving declarative links.

### 1.3 Primary actions

Shopify’s hierarchy is strict:

- **One primary** per context (`variant="primary"`). Supporting actions = secondary/tertiary ([button-group best practices](https://shopify.dev/docs/api/app-home/v1.0/web-components/actions/button-group)).  
- Page-level ops live in **title bar / `s-page` slots**: `primary-action`, `secondary-actions`, breadcrumbs ([Title bar](https://shopify.dev/docs/api/app-home/v1.0/app-bridge-web-components/title-bar)).  
- In related action groups, the **most logical** action is visually dominant ([BFS 4.2.5](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)).  
- Destructive = critical tone, separated.  
- Forms that edit persisted resources should use the **Contextual Save Bar** when reasonable ([BFS 4.1.5](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)).  
- Modals: heading + `primary-action` / `secondary-actions` slots ([BFS 4.1.6](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)).

Empty-state / onboarding CTAs: primary = the unblocker (e.g. “Enter spend”); secondary = “Learn more” — not the reverse ([Empty state](https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/empty-state)).

### 1.4 Empty states

Every blank list/page is a **guided first action**, not a dead void ([Empty state composition](https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/empty-state)):

- Explain what will appear here.  
- Centered illustration + heading + short paragraph.  
- Primary CTA to create/configure; optional secondary for docs.  
- Also used for zero search/filter results and “feature not activated yet.”

This aligns with Built for Shopify “feel native” design quality.

### 1.5 First-session / onboarding flow

Blessed path ([Onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding), [Setup guide](https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/setup-guide), [BFS 4.2.2](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)):

1. Land on **App Home** with a **setup guide** (checklist + progress: “N of M completed”).  
2. Discrete steps, auto-check when done; expand one step at a time.  
3. **≤5 steps** — more causes drop-off.  
4. Ask for merchant input **only when necessary**, with justification copy.  
5. Non-essential onboarding = **dismissible** (X / Cancel). Offer “later” if long.  
6. After completion, **remove** onboarding UI (don’t leave forever-zombie guides).  
7. Do **not** make installing another app a required onboarding step.  
8. Goal: merchant knows the core loop after first session — for analytics apps, that means seeing a trusted number and the next edit action.

Homepage template wires setup guide + metrics for returning sessions ([Homepage](https://shopify.dev/docs/api/app-home/v1.0/patterns/templates/homepage)).

### 1.6 Familiar admin chrome (Polaris / App Bridge)

- Card-like containers, admin-like buttons, spacing, WCAG AA contrast ([BFS 4.1.1](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)).  
- Mobile-friendly: stack columns; no unreachable content ([BFS 4.1.2](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)).  
- Sub-pages need a **back** path to parent.  
- Errors: red, persistent (not toast-only), next to the field ([BFS 4.2.4](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)).  
- Prefer Polaris App Home web components; types via `@shopify/polaris-types` / `@shopify/app-bridge-types` (not legacy `@shopify/polaris` React package for new App Home).

---

## 2. Anti-patterns Shopify rejects or merchants hate

### 2.1 Explicit Built for Shopify / review rejection patterns

From [Built for Shopify requirements §4 Design](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements) (and design guidelines):

| Anti-pattern | Why it fails |
| --- | --- |
| Custom in-iframe primary nav instead of `s-app-nav` | Fails “use the nav menu” |
| Extra nav item that only opens Home | App name already is Home |
| Emojis in admin nav | Rejected |
| Tabs as primary IA; tabs that change content above | Rejected / BFS |
| Replicating nav links as a body card | Misleading + noisy ([Navigation](https://shopify.dev/docs/apps/design/navigation)) |
| Main nav in page header | Header is for actions |
| Non-Polaris primary colors (e.g. green/purple CTAs), serif/script body, black/alien backgrounds | Unfamiliar admin |
| Flicker / layout thrash / unpolished load | Design quality rejection |
| Homepage = only static welcome or link farm after dismissals | Fails helpful homepage |
| Metrics-capable app with **no** homepage metrics when data exists | Fails helpful homepage |
| Onboarding too long, hard to find, or never removable | Fails helpful onboarding |
| Onboarding that requires installing another app | Rejected |
| Asking for data without justification | Rejected |
| Equal visual weight on Save vs Leave without saving | Wrong action hierarchy |
| Errors only in auto-dismiss toast; non-red errors; pre-interaction field errors | Helpful errors |
| Outcome guarantees (“increase sales 18%”), fake/average star ratings in-app | Dark patterns / false claims ([BFS 4.3.1](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)) |
| No back button on sub-pages | Familiarity fail |
| Horizontal scroll / inaccessible content on mobile | Mobile fail |

### 2.2 Merchant-hate patterns (UX reality, still religion-safe)

Aligned with Shopify guidance + Mcfly friction research themes (no invented social proof):

- **OAuth zoo before value** — forcing Meta/ad-account connect before any number appears (Shopify doesn’t require it; Mcfly religion forbids it).  
- **Empty desk with no primary unblocker** — cold Overview with nowhere to type spend.  
- **Hostile honesty** — critical banners / 60-day scolds before the merchant has a chance to enter first spend.  
- **Decision paralysis** — many equal CTAs (“Sample”, “Automate”, “Connect”, “Upgrade”) with no single primary.  
- **Dead destinations** — listing or CTA points at missing tabs/routes.  
- **Pressure / dark patterns** — review nagging before trust; fake scarcity; invented social proof.

---

## 3. Implications for Mcfly (cash desk) — religion-safe only

Map Shopify’s blessed structure onto Mcfly without expanding religion.

### 3.1 App Home = cash desk status + Total ROAS

- Home should answer: **Have you entered spend? What’s Total ROAS (Shopify sales ÷ entered spend)? What’s the one next action?**  
- Once spend exists: show **metrics cards** (Total sales, entered spend, Total ROAS, coverage/honesty) — not pixel “true ROAS.”  
- Zero spend: **empty state / setup guide**, not a blank analytics shell. Primary: **Enter spend** (manual). Secondary: honesty/docs — never “Connect Meta.”  
- After dismissible trial/trust banners: home must still show live desk numbers or the empty-state CTA.

### 3.2 Nav (`s-app-nav`) — few nouns, no Home duplicate

Suggested shape (Desk may refine labels; research only):

- App name → Home (desk)  
- Nouns only, e.g. Spend · (optional) Goals / Allocation · Settings  
- Avoid verb stacks and link-farm cards that duplicate those items  
- Don’t advertise a tab the route doesn’t implement (listing/smoke honesty)

### 3.3 First-session flow (≤5 steps, no OAuth)

Religion-safe setup guide sketch:

1. Confirm Shopify sales are loading (read-only Admin data).  
2. Enter first spend period (manual amount + channel label as needed).  
3. See Total ROAS on Home.  
4. Optional: coverage / date-range honesty (non-critical tone until after first trusted number).  
5. Optional: ReviewAsk **only after** trust — never invent reviews; keep public count **0** until real.

Hard no: Meta OAuth, pixel/MTA setup, “install SyncWith/another app to finish onboarding” as a required primary step. Optional sheet craft stays secondary/docs ([SPEND_INGEST_LADDER](./SPEND_INGEST_LADDER.md)).

### 3.4 Primary actions

| State | Page primary | Avoid |
| --- | --- | --- |
| No spend | Enter spend | Sample/demo as equal primary |
| Spend present | Update spend / period controls | Connect ads OAuth |
| Settings forms | Contextual Save Bar when editing persisted config | Orphan Save that fights CSB |
| Review | Soft ask after value | Fake stars, guaranteed outcomes |

### 3.5 Empty states & honesty

- Empty Overview → centered empty state → Enter spend.  
- Zero filter results → empty composition, not a broken chart.  
- Coverage / 60-day honesty: informative, not a first-paint critical wall that blocks TTFV (see LOVE_SCORECARD L3/L14).  
- Never show fabricated install counts or star ratings in desk or listing copy.

### 3.6 What this research does *not* authorize

- Meta/Google spend OAuth (L12 refuse)  
- Pixel / MTA / “true ROAS” (L13 refuse)  
- Inventing reviews, ratings, or install counts  
- Partner Submit / Fly deploy (Conductor + Marty)

---

## 4. Source index (cite these)

| Topic | URL |
| --- | --- |
| App Design Guidelines | https://shopify.dev/docs/apps/design |
| Navigation | https://shopify.dev/docs/apps/design/navigation |
| App Home page UX | https://shopify.dev/docs/apps/design/user-experience/app-home-page |
| Onboarding | https://shopify.dev/docs/apps/design/user-experience/onboarding |
| Built for Shopify requirements | https://shopify.dev/docs/apps/launch/built-for-shopify/requirements |
| BFS design requirements changelog | https://shopify.dev/changelog/new-built-for-shopify-design-requirements |
| App Home overview | https://shopify.dev/docs/api/app-home/v1.0 |
| `s-app-nav` / App nav | https://shopify.dev/docs/api/app-home/v1.0/app-bridge-web-components/app-nav |
| Title bar / page actions | https://shopify.dev/docs/api/app-home/v1.0/app-bridge-web-components/title-bar |
| Page layout | https://shopify.dev/docs/api/app-home/v1.1-rc/web-components/layout-and-structure/page |
| Empty state | https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/empty-state |
| Setup guide | https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/setup-guide |
| Metrics card | https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/metrics-card |
| Homepage template | https://shopify.dev/docs/api/app-home/v1.0/patterns/templates/homepage |
| App Store best practices | https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices |

---

## 5. Desk handoff (one paragraph)

Ship App Home as a **Polaris-native cash desk**: `s-app-nav` nouns, setup guide ≤5 steps ending in **entered spend → Total ROAS**, empty states with a single primary **Enter spend**, metrics on return visits, no OAuth, no invented social proof. Treat BFS §4 rejection list as the QA checklist before any design polish that fights the admin.
