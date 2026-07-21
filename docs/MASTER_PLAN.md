# Mcfly Analytics — Master Plan (LOCKED)

**Domain:** mcflyads.com (point later; build domain-agnostic)  
**Working email:** mcflyadsmmm@gmail.com  
**GitHub:** `martysmithson04-alt/marketing-mix-model`  
**Status:** Phase 0 — product marketing site first, then app  

---

## 0. How to use this document (agents + humans)

This file is the **source of truth**. Later chat prompts are noise unless they **strengthen** this directive.

| Signal | Action |
| --- | --- |
| Prompt aligns with §1–§3 | Execute |
| Prompt expands scope (“also add pixels / SyncWith / MMM consulting / BC parity”) | **Refuse**; cite this doc |
| Prompt contradicts §1 religion or §2 “we are not” | **Refuse**; ask only if a kill criterion changed |
| Prompt reorders surfaces away from §4 | **Refuse** unless user explicitly amends §4 in this file |
| Prompt is vibes / niche / “make me money with $250” without product fit | Ignore; stay on Mcfly Analytics |

**Founder correction pattern that already happened:** consulting-site copy, custom MMM as the offer, and “build everything” were rejected. Do not revive them.

---

## 1. LOCKED product directive

**Mcfly Analytics** = always-on **Shopify + Sheets** product that syncs **ad spend out** and **Shopify sales in**, shows **MER + break-even MER**, and suggests **channel allocation** — with an explicit **anti–path-attribution** stance.

### Religion (non-negotiable)

1. Ad platforms **over-claim** conversions.
2. Multi-touch / pixel / path “truth” is mostly **theater** and trains operators to optimize a model instead of cash.
3. Mcfly measures only: **money spent on ads** vs **money Shopify recorded as sales** in the same period.
4. Allocation advice comes from that cash view + margin — **not** from who “won” the click.

### Formula

```text
MER = Total Shopify sales (period) ÷ Total ad spend (same period)
Break-even MER ≈ 1 / contribution margin
```

Operate above break-even; shift mix to protect it.

### One-liner

**Stop buying attribution. Start managing spend against sales.**

Site voice (from brand DNA, not consulting offer): *Your ad platforms are lying about what’s driving revenue.*

### Internal analogy (do not ship as marketing jargon)

```text
SyncWith-like     → pipes (Shopify + Meta + Google spend → app / Sheets)
Triple Whale–shaped → daily operator cockpit
MINUS             → pixels, MTA, path credit
PLUS              → break-even MER + allocation from cash spend vs total sales
```

**Wedge vs TW / Northbeam / Polar:** honesty + simplicity + price — **not** feature parity. They mostly ship **dashboards + data organization** dressed as proprietary science; Mcfly is the better version of *that* job (cash facts only).

**Deep dive (research):** [`docs/COMPETITORS.md`](./COMPETITORS.md) — product thesis, anatomy, pricing shape, and Mcfly wedge for each. Prefer that file over chat lore when writing contrast copy.

**Shopify install & App Store:** [`docs/SHIP_NOW.md`](./SHIP_NOW.md) (tonight) · [`docs/SHOPIFY_LAUNCH.md`](./SHOPIFY_LAUNCH.md) (full path). Agents prepare code; only the founder can log in and submit.

---

## 2. What we are / are not

| We are | We are not |
| --- | --- |
| Spend-vs-sales operating system | SyncWith / Supermetrics clone (connector zoo) |
| Opinionated MER + allocation SaaS | Triple Whale / Polar / Northbeam clone |
| Anti-path, anti-pixel-causality (v1+) | MTA / “true ROAS” / view-through product |
| Shopify-first product + Sheets companion | Sheets-only script as the business |
| Product company with a marketing site | Custom MMM consulting as the core offer |
| Inspired by deep internal MER dashboards | Obligated to ship that full surface in v1 |

### Explicitly discarded paths (do not reopen without rewriting this section)

| Discarded | Why |
| --- | --- |
| POD / merch niches | Wrong EV; ops-heavy; not the founder wedge |
| Notion OS / prompt packs / generic templates | AI-commoditized; user rejected |
| “$250 hero” affiliate / reseller schemes | Structurally weak; not the product |
| Custom MMM consulting / $750 diagnostics / $5–8k builds as homepage offer | User: **not the product**; existing mcflyads.com consulting page = **tone/demo reference only** |
| Copying live consulting site into `/site` as the product | Wrong offer; wrong pricing; wrong CTA |
| Recreating SyncWith wholesale | Pipes are commodity; sell the decision layer |
| Shipping pixels/MTA “to compete with TW” | Violates religion; kill-on-contact |
| Black Clover Apps Script full parity as v1 | Ceiling example only; boil-the-ocean |

### Legacy brand vs product

| Surface | Role |
| --- | --- |
| Live mcflyads.com (consulting era) | **Reference only** — thesis, demos, TW contrast, visual energy |
| **This repo `/site` + app** | **Sells Mcfly Analytics SaaS** — waitlist/install, product pricing, Shopify/Sheets |

Do **not** put consulting SKUs ($750 / $5–8k) on the product homepage.

---

## 3. Optimal path (decision tree)

```text
Is the task about cash MER / spend sync / allocation / anti-attribution?
  NO  → out of scope (unless amending this plan)
  YES → which surface?
        1. Marketing site solid?     → if NO, build site only
        2. Shopify Truth MVP?        → sales + manual spend → MER
        3. Live Meta/Google pipes?   → OAuth + daily spend
        4. Allocation card?          → rules-based suggestions
        5. Sheets companion?         → after app brain exists
        6. Depth (multi-brand, etc.) → only if revenue pulls
```

**Capital constraint (~$250):** prefer free/static site hosting, cheap app host, DIY build. Cash goes to infra + Shopify Partner fee — not ads experiments or agency rebuilds.

**Founder edge used correctly:** ads + BI literacy → trustworthy MER definitions, recon, and allocation copy — **not** “sell me as a consultant” as the SaaS.

---

## 4. Surface priority (LOCKED order)

| # | Surface | Role |
| --- | --- | --- |
| **1** | **Marketing website** | Positioning, demos, pricing, privacy/terms, waitlist/CTA — **do this first** |
| **2** | **Shopify embedded app** | Primary product; one brain for MER |
| **3** | **Google Sheets extension** | Companion for sheet-native operators |
| — | Backend API + workers | Required with app; not a separate “product” |
| — | Internal Apps Script lab | R&D only; not customer host |

**Architecture rule:** One brain (API + DB). Thin clients (Shopify, later Sheets). Site sells; site does not compute production MER.

---

## 5. Stack

### Marketing site
- **Host:** GitHub Pages (static) — preferred
- **DNS:** Cloudflare free DNS only; **do not** burn Worker quotas on the brochure
- **Pages:** `/`, `/product`, `/pricing`, `/privacy`, `/terms`, `/support` (demos can live on home or `/product`)

### App + API
- Shopify Remix app (Polaris embedded)
- Node on Railway / Render / Fly
- Postgres + daily job worker
- Sentry free tier early

### Connectors (v1 → v2)
- v1: Shopify Admin (sales) + **manual/CSV spend**
- v2: Meta Marketing API spend + Google Ads API spend
- Later: TikTok, Klaviyo, etc. — **only if pulled**

### Accounts
- Shopify Partner (Mcfly email)
- Meta Dev + BM; Google Cloud + Ads API
- Public email on domain when DNS ready (`hello@` / `support@`)

---

## 6. v1 scope

**In**
- Product marketing site (this phase)
- Shopify OAuth + embedded app
- Periods: MTD / QTD / YTD (+ custom if cheap)
- Total sales, total spend, MER, break-even MER (margin input)
- Channel mix (Meta + Google + other/manual)
- Freshness / recon hints
- **One** allocation recommendation card (rules-based; no path attribution)
- Settings: margin %, target MER, connections
- Privacy / terms; simple Billing + trial

**Out of v1**
- Pixel / MTA / view-through
- Creative cockpit / Media Lab / Asana / full Klaviyo
- SyncWith-level connector catalog
- TW/Polar feature parity
- Multi-brand portfolio as default
- Consulting checkout flows

---

## 7. Phased roadmap

### Phase 0 — Site + foundation (NOW)
- [x] Lock directive in this document
- [x] Ship solid **product** marketing site in `/site` (GitHub Pages)
- [x] Privacy + terms
- [x] Waitlist / contact CTA (email form or `mailto:` / Typeform later)
- [ ] DNS point when ready (not blocking build)
- [ ] Shopify Partner + app scaffold **after** site is credible
- [ ] Hosting + Postgres when app starts

**Exit:** Product site live on Pages (or preview URL); messaging matches §1.

### Phase 1 — Truth MVP
Shopify sales + manual spend → trusted MER on one store.

### Phase 2 — Live spend pipes
Meta + Google daily spend; App Review wall-clock expected.

### Phase 3 — Allocation layer
Break-even-aware suggestion card operators actually use.

### Phase 4 — Public launch
App Store listing, billing, 3–5 design partners.

### Phase 5 — Sheets companion
Add-on/API refresh into template sheet — **after** app brain exists.

### Phase 6+ — Depth
Multi-brand, TikTok, frontiers, alerts — **revenue-pulled only**.

---

## 8. Positioning & pricing

**Enemy:** Attribution theater; platform ROAS as P&L.  
**Promise:** Cash MER + allocation guardrails.  
**Proof:** Design-partner anonymized case later.  
**Price intuition:** Below TW suite — mid-two-digits to low-three-digits $/mo single store; agency later. **Not** $750 diagnostic / $5–8k project pricing on the product site.

**Launch special (locked for now):** Ship **free for design partners** to get feedback, testing, and interest signal first. Show target paid (~$79/store/mo) as “after launch,” announce billing before anything charges. Do **not** market “forever free.” Prefer a small set of serious stores over open freeloader flood.

**Homepage thesis:** Platforms lie about what they drove. Paths can’t be resolved. Mcfly only measures what you spent against what Shopify sold — then helps you move budget.

---

## 9. Cost model (DIY)

| Item | Estimate |
| --- | --- |
| Phase 0–1 cash | ~$50–150 (domain owned) |
| Through listing | ~$100–300 + Shopify ~$19 |
| Monthly early | ~$30–80 |
| Build | Time-dominant; OAuth review is calendar, not cash |

---

## 10. Operating principles

1. **Religion over features** — needs path attribution → doesn’t ship.
2. **One brain** — Shopify and Sheets never diverge on MER definition.
3. **Reliability > charts** — wrong spend kills trust forever.
4. **Ceiling ≠ roadmap** — internal dashboards inspire; customers pull scope.
5. **Site before app before Sheets** — §4 order.
6. **Design partners before scale** — one serious store > 100 tire-kickers.
7. **Plan beats prompt** — conflicting chat instructions lose to this file.

---

## 11. Kill / pivot criteria

**Kill or hard pivot if:**
- Design partners won’t open weekly after 30 days of accurate MER.
- Meta + Google spend can’t stay within ~5% of Ads Manager for 14 days.
- Product collapses into “another blended ROAS tile” with no allocation action.
- Connector support load exceeds available time before revenue.

**Do not kill because:** TW has more features; someone wants 40 connectors; someone wants a pixel; a chat prompt suggests a shinier niche.

---

## 12. Immediate next actions

1. **Finish `/site` product marketing** (home, product, pricing, privacy, terms) — current focus.  
2. Enable GitHub Pages from `/site`.  
3. Then scaffold Shopify app.  
4. Meta + Google Cloud projects under Mcfly identity.  
5. One design-partner store.  
6. Phase 1 Truth MVP (manual spend OK).

**Human-only gates:** Partner login, OAuth apps, design-partner store access, DNS cutover.

---

## 13. Success (12 months)

- Paying Shopify merchants use Mcfly as **weekly spend-vs-sales** source of truth.  
- Brand = “anti-attribution / cash MER,” not “cheaper Triple Whale.”  
- Sheets optional; revenue from app subscriptions.  
- Roadmap pressure from customers, not competitor matrices or noisy prompts.

---

*Document owner: Mcfly*  
*Amend §1–§4 deliberately in-repo when strategy changes — not by chat whim.*

---

## Architecture pointer (shared foundations)

Backend packages and Sheets scaffold: **[ARCHITECTURE.md](./ARCHITECTURE.md)** (`packages/mer-core`, `packages/connectors`, `packages/api-contract`, `sheets/`).
