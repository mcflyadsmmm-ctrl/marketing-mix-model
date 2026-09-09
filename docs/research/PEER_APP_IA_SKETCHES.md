# Peer app IA sketches — tabs, nav, first 60s

**Lane:** Research (docs only) · **Written:** 2026-09-09  
**Exclusive write path:** this file.  
**Companion baseline:** [`CAPABILITY_MAP.md`](./CAPABILITY_MAP.md) (Mcfly nav + cold path).  
**Scope:** Information architecture and onboarding **flow** — not feature cloning.  
**Religion lock:** Total ROAS = Shopify Total Sales ÷ entered spend. No pixels / MTA / Meta OAuth. Reviews live = **0** — this file invents neither review nor install counts.

**Method:** Public help centers, product blogs, App Store listing copy, and vendor marketing pages (Sep 2026). First-minute rituals are tagged **`hypothesis`** wherever they are inferred from setup guides rather than a timed lab walkthrough. Nav labels are **best-known public names**, not a claim of pixel-perfect current UI.

---

## Mcfly baseline (from CAPABILITY_MAP)

| Layer | Labels | Notes |
| --- | --- | --- |
| **Core nav** | Overview · Spend · Settings | Always visible (`desk-nav.ts`) |
| **Depth nav** | Goals · Spend Allocation · LTV · Advanced | Soft-gated with `FirstTrustedRoasGate`, not hidden |
| **Cold path** | First `/app` with no live spend → **`/app/spend?activate=1`** | SAMPLE / `?stay=1` / shot mode skip bounce |
| **Hidden jobs** | Pipe templates, period ledger CSV, combine & import | Real capability, weak front door |

**Mcfly first-minute intent (shipped):** land on Spend → type/paste one spend day → return to Overview for a trusted (or honesty-gated) Total ROAS. Depth tabs wait.

---

## Cross-cutting patterns (what “good” looks like)

1. **One primary verb in minute one** — connect / import / type / open inbox — not “explore the suite.”
2. **Home = checklist or scoreboard, not a feature zoo** — Judge.me Setup Guide; Matrixify Home Import+Export; Gorgias Inbox; Mcfly Overview (after spend).
3. **Settings absorb the long tail** — widgets, emails, scopes, billing live under Settings so core nav stays short.
4. **Fail-closed jobs with progress** — Matrixify analyze→import→results; Mcfly fail-closed CSV (keep).
5. **Depth behind trust** — Recharge Analytics after subscriptions exist; Mcfly depth after first trusted ROAS (keep).
6. **Refuse the connector zoo as product identity** — SyncWith/Keel/Kipify/TW win on OAuth breadth; Mcfly wins on till÷entered spend. Steal their *habit clarity*, not their *integration tree*.

---

## 1. Klaviyo (ESP / CRM — suite benchmark)

### Nav labels (best-known)

Public account IA (Klaviyo web app, not only the Shopify embed): **Home · Campaigns · Flows · Lists & Segments · Signup Forms · Analytics · Profiles · Integrations · Settings**. Shopify-specific work also lives under **Integrations → Shopify** (sync, onsite tracking, app embed).

### First-minute ritual (`hypothesis`)

1. Create/open account → **Integrations → Shopify** → OAuth install.  
2. Confirm sync / list assignment.  
3. Theme **App embeds → Klaviyo ON** (onsite tracking).  
4. Only then: Flows / Campaigns feel “alive.”

Value in 60s is **connection health**, not a campaign send.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| Integrations as an explicit **health gate** before the money UI | Building a second product (Flows/Campaigns-class surface) |
| One “turn on embed / tracking” CTA that unblocks the rest | Collecting shop domain outside Admin OAuth (Shopify 2.3.1) |
| Home that summarizes *whether the pipe is live* | Treating OAuth breadth as the product |

**Mcfly mapping:** Spend coverage strip + cold redirect already act as the “integration health” gate — keep that metaphor in copy (“Spend isn’t connected yet — type today’s Meta/Google totals”).

---

## 2. Recharge (subscriptions — operator portal)

### Nav labels (best-known)

Merchant portal left nav: **Home · Analytics · Customers · Products · Discounts · Cross-Sell & Upsell · Loyalty · Churn tools · Email**, plus **Storefront · Tools and apps · Settings · Help**. Analytics nests **Dashboards** (Revenue / Customers / Subscriptions / Performance families) and **Reports**.

### First-minute ritual (`hypothesis`)

1. Land on **Home** (store stats + announcements).  
2. If products aren’t subscription-enabled → **Products** (plan assignment) before Analytics means anything.  
3. Recurring ritual is **Customers** (skip / cancel / edit) more than dashboards.

Analytics is a **second-week** habit; day-one is “can I operate a subscription?”

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| **Home as status**, ops verbs in the middle of nav, Analytics as depth | Cloning subscription churn / loyalty / upsell trees |
| Permission-aware empty sections (“you can’t see X”) | Expanding nav to 10+ peer-class nouns |
| Tools & apps / Exports as a **Toolbox** drawer, not primary tabs | Shipping a second “portal” outside embedded Admin |

**Mcfly mapping:** Keep Overview (status) + Spend (ops verb) as the Recharge Home+Customers pair; Goals/LTV/Allocation stay Analytics-class depth.

---

## 3. Gorgias (support — ticket-first IA)

### Nav labels (best-known)

Helpdesk 2.0-style areas: **Inbox · AI Agent · Marketing · Analytics · Workflows · Customers**, with **Settings** bottom-left. Inbox sidebar = **Views** (default / shared / private). Ticket **right sidebar** = Shopify + partner widgets (Recharge, etc.).

### First-minute ritual (`hypothesis`)

1. Open **Inbox** → pick a View → open a ticket.  
2. Reply / macro / Shopify sidebar action — **one closed ticket** is TTFV.  
3. Workflows (Rules / Macros) and Analytics come after the agent can work.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| **One job surface owns the first minute** (Inbox ≈ Mcfly Spend→Overview loop) | Helpdesk chrome, views trees, AI Agent nav |
| Right-rail context without leaving the job | Building a ticket product |
| Collapse/focus chrome so the job dominates | Multi-area dropdown that hides the primary verb |

**Mcfly mapping:** Cold redirect to Spend is Gorgias-grade “open Inbox first.” Do not let Overview become a blank dashboard when spend is empty — keep the bounce (or an Overview empty state that *is* Spend).

---

## 4. Judge.me (reviews — checklist onboarding)

### Nav labels (best-known)

2025 redesign: left sidebar inside Shopify Admin. Public help paths emphasize **Home** (Setup Guide), **Reviews**, and **Settings →** Widgets · Request Reviews · Request Scheduling · Email Templates · Import Reviews · Social Sharing · Google/SEO · Coupons · Referrals · Integrations · Advanced. Reports / request dashboards sit near review ops.

### First-minute ritual (help-documented; timing still `hypothesis`)

1. Open app → **Home Setup Guide** checklist.  
2. Install Review Widget + Star Rating Badge (theme).  
3. Customize widget / logo / email styling.  
4. Set request schedule + personalize email.  
5. Optional: import past reviews; start trial upsell last.

Checklist items auto-check; guide is dismissible.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| **Dismissible Setup Guide on Home** with auto-complete | Coupons / referrals / social syndication product surface |
| Theme-widget install as a first-class checklist step | Packing Settings children into top-level tabs |
| Import + request as **jobs**, not buried FAQ | Upsell trial as step 1 of the checklist |

**Mcfly mapping (highest EV copy/IA steal):** Overview empty / first session = 3–5 item guide: (1) Enter one spend day, (2) Confirm margin optional, (3) Read Total ROAS on Overview, (4) Optional pipe template, (5) Optional deep-history grant. Auto-check from real state.

---

## 5. Triple Whale (analytics suite — workspace zoo)

### Nav labels (best-known)

Left sidebar: **business selector · Moby · History · Automations · Favorites · Search**, then Core Workspaces: **Summary · Marketing Acquisition · Creative Analysis · Website Conversion · Customer Retention · Discovery**, then Custom Workspaces; bottom **Data · Help · Settings**. Data flyout: Integrations · Warehouse · APIs · Data Upload · enrichment · dictionary · SQL.

### First-minute ritual (`hypothesis` from onboarding guides)

1. Connect Shopify (orders as the rocket boosters).  
2. Install **Triple Pixel** / tracking.  
3. Connect ad platforms + cost settings.  
4. Land **Summary** as daily OS (revenue, spend, blended ROAS, MER, new customers…).

TTFV to a *pretty* Summary can be fast; TTFV to a *trusted* Summary is a multi-step connector ritual.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| **Summary-as-daily-ritual** framing (one scoreboard) | Pixel, MTA, creative cockpit, Moby OS, SQL, warehouse |
| Favorites / “hide workspaces you don’t need” *idea* for power users | Core workspace explosion (6+ peer dashboards) |
| Cost settings as an explicit config (they need spend somewhere) | Mcfly-owned Meta/Google OAuth / “connect ads” as identity |
| Data Dictionary honesty about metric definitions | Claiming channel-level causal ROAS |

**Mcfly mapping:** Overview = Summary. Spend = Cost Settings + Data Upload in one tab. Refuse everything else as religion. Steal **metric-definition honesty** (already strong) into a one-line glossary chip, not a Data Dictionary page.

---

## 6. Keel (blended ROAS + mobile widgets — connector lite)

### Nav labels (best-known)

Public product story is thin on named Admin tabs: **desktop dashboard** + **native iOS / Home Screen widgets**. Setup marketed as: Connect Shopify → connect Meta / Google / Snapchat / Klaviyo → live blended ROAS / MER / profit (with COGS inputs).

### First-minute ritual (`hypothesis`)

1. Authorize Shopify read.  
2. Connect ad platforms (OAuth).  
3. See live blended ROAS; optional iOS widgets.

Minute-one promise = **glanceable blended number**, not a cash desk.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| Extreme focus on **one blended scoreboard** | Meta/Google OAuth as required path |
| Optional margin/COGS to estimate profit (Settings-adjacent) | Campaign-level “scale or pause” theater as core |
| Mobile glance habit *as a JTBD insight* | Shipping iOS widgets before paid retention exists |

**Mcfly mapping:** Keep Overview gauge as the glance. Entered spend replaces connectors. Optional margin already in Settings — don’t invent a profit OS.

---

## 7. Kipify (KPI / profit dashboard — metric zoo)

### Nav labels (best-known)

Listing/marketing surfaces: **KPI Dashboard · Custom reports · Inventory · AI analyst**, with connectors to Shopify / Google Ads / Meta / GA4. Exact embedded nav labels are sparsely documented publicly — treat as **dashboard-first, connector-gated**.

### First-minute ritual (`hypothesis`)

1. Connect store + ads + GA4.  
2. Land unified KPI screen (MER, blended ROAS, ACOS, margin, stock).  
3. Ask AI for “wasted spend” narrative.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| Single-screen **profit-adjacent** framing (margin next to MER) | Inventory OS, GA4, ACOS, Meta OAuth, AI analyst nav |
| Custom reports as *later* power | Letting MER be one tile among twenty |

**Mcfly mapping:** Overview already co-locates sales, spend, Total ROAS, aMER glance. Refuse metric zoo and AI analyst tab.

---

## 8. Matrixify (bulk import/export — job machine)

### Nav labels (best-known)

Embedded app: **Home** (Import + Export entry), **All Jobs**, **Settings** (security, notifications, servers, sheet permissions, scopes, MCP tokens…). Entity choice happens *inside* export/import jobs (Products, Orders, Menus, …), not as a dozen top tabs.

### First-minute ritual (help-documented; timing `hypothesis`)

1. Open **Home**.  
2. Start Export *or* drop a file on **Import**.  
3. App **analyzes** file → merchant confirms → runs job.  
4. Progress visible; email on finish; **Import Results** file for audit.  
5. Revisit via **All Jobs**.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| **Home = two verbs** (Import / Export) | Becoming a general Shopify bulk editor |
| Analyze → confirm → fail-closed / results artifact | Queued job OS as primary product |
| All Jobs history as trust theater | MCP / FTP / sheet-permission complexity in v1 nav |
| Templates + demos as first-class downloads | REPLACE/DELETE command surface for spend |

**Mcfly mapping:** Spend already mirrors analyze/confirm/fail-closed. Steal: make **pipe template download** and **last imports** as visible as Matrixify’s Home verbs; optional “Spend jobs” strip (last 3 entries already exist — elevate).

---

## 9. SyncWith (pipes — Sheets is the UI)

### Nav labels (best-known)

Two surfaces: (A) Embedded **Reports & Export** Shopify app — create report → fields/filters/date → schedule → export XLSX/CSV / share link. (B) **Google Sheets addon** sidebar — Extensions → SyncWith → connect Shopify/Meta/etc. → refresh. Shopify install often exists only to **authorize** the Sheet/Looker destination.

### First-minute ritual (`hypothesis`)

1. Install Shopify app (connection proof).  
2. Jump to Sheets (or Reports) → pick fields → run once.  
3. Schedule refresh. Decision math stays in the Sheet.

### Steal vs refuse

| Steal | Refuse |
| --- | --- |
| Honest split: **pipe vs decision layer** | Building SyncWith inside Mcfly |
| Schedule language for *optional* automation | Refresh-metered pricing / field-picker report builder |
| Template headers merchants paste into pipes | Claiming “Works with SyncWith” logos without a deal |

**Mcfly mapping:** Already correct in `SPEND_INGEST_LADDER.md`. IA fix = discoverable **Automate / Pipe templates** under Spend (not a top-level SyncWith clone tab).

---

## Steal / refuse scoreboard (one glance)

| Peer | Steal (flow/IA) | Refuse |
| --- | --- | --- |
| Klaviyo | Connection-health gate before value | ESP suite / embed zoo |
| Recharge | Home status + mid-nav ops verbs | Subscription feature tree |
| Gorgias | Single primary job surface first | Inbox/views/AI helpdesk |
| Judge.me | Dismissible Setup Guide checklist | Reviews platform features |
| Triple Whale | Summary ritual + metric definitions | Pixel / MTA / AI OS / OAuth zoo |
| Keel | One-scoreboard focus | Ad OAuth + widgets-as-product |
| Kipify | Margin beside efficiency | KPI zoo + AI analyst |
| Matrixify | Home two-verbs + job results | Bulk-edit platform |
| SyncWith | Pipe≠decision; templates | Connector product |

---

## Ranked Mcfly flow / tab recommendations (≤8)

Tags: **`copy-only`** (words/checklist, no route) · **`small-desk`** (surface the existing capability) · **`challenge`** (needs religion/evidence brief before building)

| Rank | Recommendation | Tag | Why (from peers) |
| --- | --- | --- | --- |
| **1** | **Overview first-session Setup Guide** (3–5 auto-checked steps: enter spend → optional margin → read Total ROAS → optional pipe → optional deep history). Dismissible. | `small-desk` | Judge.me Home checklist; Gorgias “one job first” |
| **2** | **Spend front-door for pipe templates** (“Automate fill — optional” with long/wide downloads + SyncWith/Coupler/Supermetrics/Coefficient named as merchant-paid). No top-level Automate tab required. | `small-desk` | SyncWith honesty + Matrixify Home verbs; closes listing parity gap |
| **3** | **Cold-path copy as connection health** on Spend activate: “Shopify sales are already here. Total ROAS unlocks when spend is entered — no ad login.” | `copy-only` | Klaviyo integration gate without OAuth |
| **4** | **Keep core nav at Overview · Spend · Settings**; leave Goals / Allocation / LTV / Advanced as depth (soft-gate, never hide). Do not add Summary/Analytics/Integrations synonyms. | `copy-only` | Recharge/Gorgias short primary IA; anti-TW workspace zoo |
| **5** | **Elevate last import / coverage strip** on Spend (Matrixify “All Jobs” lite): last entries + missing days as the recurring ritual chrome. | `small-desk` | Matrixify job history; Recharge ops-first habit |
| **6** | **One-line metric definition on Overview** (“Total ROAS = Shopify Total Sales ÷ spend you entered — averages, not channel truth”). | `copy-only` | TW Data Dictionary honesty without a Data tab |
| **7** | **Settings absorbs SAMPLE, billing, privacy, margin, goal** — resist a top-level Demo / Connections / Integrations tab (Connections stays retired → Spend). | `copy-only` | Judge.me Settings long-tail; religion vs Keel/Kipify connectors |
| **8** | **Any Mcfly Meta/Google OAuth or “Integrations” nav item** | `challenge` | Keel/Kipify/TW first-minute; blocked by [`RELIGION_CHALLENGE_SPEND_CONNECTORS.md`](./RELIGION_CHALLENGE_SPEND_CONNECTORS.md) (**DEFER**) + ladder rungs 0–1 |

---

## Explicit non-goals (from this sketch)

- No new top-level tabs: Integrations, Automate, Analytics, Data, AI, Inbox, Widgets.  
- No Meta OAuth / pixel / MTA.  
- No inventing reviews, install counts, or competitor prices.  
- No editing `app/**` from this lane.

---

*Research lane · docs only · no commit · no deploy. Downstream: Desk can implement #1–#2/#5; Listing/copy can ship #3/#6; religion challenges own #8.*
