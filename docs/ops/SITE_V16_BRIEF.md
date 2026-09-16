# Site v16 brief — match Fly 238 desk

**Date:** 2026-09-10 · America/Denver  
**Status:** Implemented in `site/` 2026-09-10. **Pages not live** until Direct Upload (Wrangler blocked this turn). Product truth is Fly **239**.  
**Authority:** [`plans/2026-09-10-world-class-attack.md`](../plans/2026-09-10-world-class-attack.md) Phase 4 · skill [`.cursor/skills/mcfly-site/SKILL.md`](../../.cursor/skills/mcfly-site/SKILL.md) · [`LIVING_BOARD.md`](../LIVING_BOARD.md)

| Layer | Value |
| --- | --- |
| **Live site today** | v15 · https://mcflyads.com · `mcfly-version` v15 |
| **Product truth** | Fly **238** · https://mcfly-analytics.fly.dev |
| **Listing CTA** | https://apps.shopify.com/mcfly-analytics-public (fully visible — do not invent another handle) |
| **Reviews** | **0** — never invent reviews or install counts |
| **Public mark** | **Mcfly Analytics** (`<title>`, OG, chrome, favicon) |
| **Firm** | **Mcfly Ads** (footer, Organization schema, domain) |
| **App URL (Partner)** | Fly (`mcfly-analytics.fly.dev`) — not mcflyads.com |
| **Website (Partner)** | https://mcflyads.com |

---

## One job (v16)

After Marty approves **Phase 2** Admin shots from Fly 238, rewrite **home**, **demo**, **pricing**, and **product** so a stranger sees the **same desk story as the embedded app**: **typical order, weekends, returning dollars, days to second** — Shopify order intelligence that **works at $0 spend**. Marketing (Total ROAS, mix, allocation) stays **optional**, below or beside — not the first viewport sell.

**Not the sell:** a spend-first **Northline** widget with **$98,500 / 4.19×** Total ROAS as the hero (demo today). **Not on `/` ever:** Northline **$98,500** or **4.19×** in hero or above-the-fold marketing copy.

**Still locked on home (below the fold):** Harbor Home Co SAMPLE — spend **$23,414** · sales **$82,068** · **3.51×** · BE **2.50×** @ 40% · not a live client.

---

## Ship gate (hard stop)

| Phase | Owner | v16 may deploy when |
| --- | --- | --- |
| **2 · Evidence** | Marty | Hard-refresh Admin on Fly **238**, **Live data**, screenshot pack: Overview, Orders, Buyers, Timing, Goals, Marketing empty, Marketing with one day. Cursor captions from [`LISTING_VISUAL_PACK.md`](../LISTING_VISUAL_PACK.md). |
| **4 · Site v16** | Conductor / Site lane | Phase 2 shots **exist and are approved** for use on site (static `<img>` or honest “as in Admin” frames — no fake UI). |

Do **not** Pages-deploy a v16 rewrite before Phase 2. Do **not** paste listing copy that the live desk cannot show. Listing paste remains Marty-only ([`ops/LISTING_LIVE_PASTE.md`](./LISTING_LIVE_PASTE.md)).

---

## Spine & nav (unchanged)

| Rule | Value |
| --- | --- |
| Primary path | `/` → **Install** (App Store) |
| Nav (≤4) | **Demo** · **Pricing** · **About** · **Install** → `https://apps.shopify.com/mcfly-analytics-public` |
| Custom / suite / `/lab` | **301** home (`site/_redirects`) |
| Tier A craft | `site/assets/mcfly/mcfly.css` + `site/assets/mcfly/chrome.js` on spine pages where skill applies |
| Refuse | Custom packages on home/nav · Ads↔Analytics toggle · inventing App Store handles · new SEO landers |

---

## Fly 238 desk — what the site must mirror

**Admin nav (truth):** Overview · Orders · Buyers · Timing · Goals · Marketing · Settings.

**Overview first viewport (Sample or Live, $0 spend OK):**

1. Period rail + **Shopify Total Sales** hero (Fraunces on the number only in app; site uses paper/sky stills or demo default tab).
2. Four quiet cards — merchant English, not analyst zoo: typical order, returning sales, weekend mix, days to second (exact labels follow live Admin strings).
3. One short “what to notice” sentence — not “Upload spend to fix the app.”
4. Deeper book below: customer value 30/90/365, goals vs calendar, sales explorer, then **Marketing** invitation when spend exists.

**Marketing when spend exists:** Total ROAS = Shopify Total Sales ÷ entered spend; empty spend is **not** 0×.

**Voice bans (site + demo chrome):** Monday, cash desk, till, cohort, ARPU, p25–p75, 500-seat theater, “beats SaaS.”

Use Phase 2 PNGs as the visual SoT for product/pricing bands and optional home “see the desk” frame — cropped app body only, no browser chrome (per visual pack).

---

## Page scope

| Page | v15 problem | v16 direction |
| --- | --- | --- |
| **`/`** | Copy already sales-first (v15); may lack Fly-aligned still | Keep Harbor below fold; add/refresh **Admin-aligned** desk visual if shots allow; hero stays order intelligence |
| **`/demo`** | **Spend-first:** “Total ROAS desk”, Northline, 4.19× lead KPI, old tab zoo | Reframe hero + **default Overview** to match Fly; demote Total ROAS to Marketing tab; align tab names with Admin where the interactive demo can |
| **`/pricing`** | Mixed: good “typical order…” proof line; body still “Spend, Overview…” order and tax band leads Total ROAS | Sales-first H1/lede; plan bullets match **238 tab order**; Total ROAS in optional Marketing bullet |
| **`/product`** | **“Your Total ROAS desk”** spend-first thesis, Monday line, spend CSV hero | Product page = **order intelligence desk** + optional marketing module; rip spend-first hero and Monday opener |

---

## H1 / lede / CTA candidates

Titles must end **`| Mcfly Analytics`**. Canonical + OG URLs = `https://mcflyads.com/...` only.

### Home (`/`)

**Recommended (keep v15 spine — tune lede only if shots add a desk frame):**

| Element | Candidate |
| --- | --- |
| **Kicker** | `Mcfly Analytics · Shopify app` |
| **H1-A (keep)** | **Deeper Shopify numbers Analytics does not show.** |
| **H1-B (alt)** | **Typical order, weekends, and repeat buyers — from Shopify orders.** |
| **H1-C (alt)** | **Order intelligence that works before you add ad spend.** |
| **Lede-A (keep)** | Typical order, weekend mix, and repeat buyers — from the orders you already have. Add spend when you want sales ÷ spend. No ad-network login. 7-day trial, then $39/store/mo. |
| **Lede-B** | Install inside Admin. Read Total Sales, typical order, and returning dollars in about ten minutes — no Meta or Google login. Add spend later for Total ROAS. 7-day trial, then $39/store/mo. |
| **Primary CTA** | **Install** → `https://apps.shopify.com/mcfly-analytics-public` |
| **Secondary CTA** | **Try the demo** → `/demo` |
| **Below-fold SAMPLE** | Harbor Home Co · `$23,414` / `$82,068` / `3.51×` / BE `2.50×` — unchanged |

### Demo (`/demo`)

| Element | Candidate |
| --- | --- |
| **Title** | `Demo — Shopify order desk` **or** `Demo — Overview & optional spend` **\| Mcfly Analytics** (drop “Total ROAS” from title) |
| **H1-A** | **See the same Overview as the Shopify app.** |
| **H1-B** | **Typical order, weekends, returning sales — SAMPLE desk.** |
| **H1-C** | **Walk the Mcfly desk before you install.** |
| **Lede-A** | Toggle periods on SAMPLE data. Overview first; add spend on Marketing when you want sales ÷ spend. No install required. |
| **Lede-B** | Same math as Fly **238**: Total Sales and order stats from Shopify; Total ROAS only after you add spend. SAMPLE — not a live client. |
| **Primary CTA** | **Open the desk** → `#dd-desk` **or** **Install** → App Store |
| **Secondary CTA** | **Pricing — $39/mo** → `/pricing` |

### Pricing (`/pricing`)

| Element | Candidate |
| --- | --- |
| **Title** | `Pricing — 7-day then $39` **\| Mcfly Analytics** (keep) |
| **H1-A (keep structure)** | **7-day free trial. Then $39/month. Full desk.** |
| **H1-B** | **One flat fee. Whole order desk.** |
| **Lede-A** | One plan: seven days full access, then $39/store/mo. Overview, Orders, Buyers, Timing, Goals — then optional Marketing when you add spend. Uninstall stops the charge. |
| **Lede-B** | Not a GMV tax. Read typical order and returning sales at $0 spend; add spend when you want Total ROAS. |
| **Proof line (keep idea)** | `Typical order, weekends, LTV — spend optional` |
| **Primary CTA** | **Install** → App Store |
| **Secondary CTA** | **Support** → `/support` **or** **Try the demo** → `/demo` |

### Product (`/product`)

| Element | Candidate |
| --- | --- |
| **Title** | `Order intelligence desk` **or** `Shopify order desk` **\| Mcfly Analytics** (replace “Total ROAS desk”) |
| **H1-A** | **Deeper than Shopify Analytics Overview.** |
| **H1-B** | **Your orders, readable in ten minutes.** |
| **H1-C** | **Total Sales, typical order, repeat buyers — spend optional.** |
| **Lede-A** | Period rail, Total Sales hero, and the questions you still export to ChatGPT — typical order, weekends, returning dollars, days to second. Add spend on Marketing for Total ROAS vs break-even. 7-day trial, then $39/store/mo. |
| **Lede-B** | Same tabs as Admin on Fly **238**: Overview · Orders · Buyers · Timing · Goals · Marketing · Settings. No pixels. No ad-network OAuth. |
| **Primary CTA** | **Install** → App Store |
| **Secondary CTA** | **Try the demo** → `/demo` |

---

## What to rip or demote from `demo.html`

Use this as a checklist when implementing v16 (do not ship until Phase 2 gate clears).

### Rip or replace (spend-first / wrong IA)

| Location | Current | v16 action |
| --- | --- | --- |
| `<title>` / OG | `Demo — Total ROAS` | Sales-first demo title (see candidates) |
| Hero `<h1>` | `Total ROAS desk` | Order-intelligence H1 |
| Hero lede | “sales after returns ÷ ad spend vs break-even” first | Total Sales + order stats first; spend optional |
| `page-hero` fine line | “Sample data shows the whole desk (Spend, Overview…)” | Tab order **Overview → … → Marketing**; match Admin names |
| `demo-howto` step 1 | `Overview → Spend → Goals → Mix → Explorer → Close → Settings` | Align with **Overview · Orders · Buyers · Timing · Goals · Marketing · Settings** (drop or map Mix/Explorer/Close to Marketing sub-areas or footnotes) |
| `dd-topbar__title` default | `Total ROAS` | Overview context or “Overview” when on overview section |
| `dd-decision__kicker` | `Budget call` | Only on Marketing/spend section — not Overview default |
| `dd-decision__takeaway` | “Above target on sales after returns ÷ spend” | Overview: order-intelligence takeaway; Marketing: ROAS takeaway |
| `dd-claim` block | Platform ~4.8× vs cash **4.19×** hero | Move to Marketing tab or collapse; **not** Overview fold |
| `dd-kpi--lead` on Total ROAS | **4.19×** lead KPI on Overview | Lead KPI on Overview = **Total Sales** or **typical order**; Total ROAS lead only on Marketing |
| Northline shop label | Primary sample brand in topbar | OK inside demo **if** Overview default is sales-first; do **not** use Northline **$98,500 / 4.19×** on `/` |
| `aria-label` on desk | `Sample desk — Northline Supply` | Update copy when SAMPLE story splits Harbor (home) vs demo book |
| Meta description | Total ROAS / break-even first | Match Fly 238 Overview promise |

### Keep (mechanics worth preserving)

- SAMPLE badge + “not a live client”
- Period toggles (Last 7d / MTD / QTD / YTD) where they still match app behavior
- Drill pattern on KPIs (formula + next move) — repoint default drills to order stats on Overview
- Install CTA inside desk region → App Store listing URL
- `demo-desk.css` / JS interactivity — refactor content, not necessarily delete the widget on day one

### Tier A / CSS note

Home stays **`mcfly.css` only** (sample lock). Demo/pricing/product today use **`site.css`** — v16 may migrate demo hero to Tier A for nav parity with home, but **never** stack Tier A rules into `site.css` (skill law).

---

## Pricing & product copy fixes (non-demo)

- **Pricing** plan list: reorder bullets to **Overview → Orders/Buyers/Timing → Goals → Marketing (spend)**; remove “Spend:” as first bullet unless Marketing is clearly optional.
- **Pricing** `tax-lede`: keep flat-fee story; optional Total ROAS mention stays in Marketing context, not the only hook.
- **Product**: remove **Monday** opener and spend-first `<h1>`; replace hero still with Phase 2 Overview shot when available.
- **Product** meta / schema: stop leading with “See ad spend next to sales” as the only description.

---

## SAMPLE lock reminder

Before **any** production Pages upload:

```bash
bash scripts/site-sample-lock.sh
```

Gate checks include (non-exhaustive):

- **`site/index.html`**: no `$98,500`, no `$84,200`; **Harbor** with `$23,414` and `3.51×`; `$39` and `/demo`; no Custom packages; no cash-desk voice; **`mcfly.css` only** (no `site.css` on home).
- **Chrome**: Install → `apps.shopify.com/mcfly-analytics-public`; nav Demo → `/demo`; product mark **Analytics**; footer **Mcfly Ads**.
- **`_redirects`**: `/custom-analytics` and `/lab` → `/`.

If v16 changes home title/H1, update **`site-sample-lock.sh`** expectations in the **same PR** as the copy change (today it asserts exact title string for v15).

---

## Deploy (production)

1. Phase 2 shots approved.
2. Implement v16 in repo; run sample lock + phone (390px) + desktop on `/`, `/demo`, `/pricing`, `/product`, `/about`.
3. Copy **`site/`** (+ **`functions/`** if present) to a **non-git temp directory** (merge ≠ live; avoid deploying dirty git state as the only copy step).
4. From that temp tree:

```bash
bash scripts/site-sample-lock.sh   # run against source repo before copy, or ensure copied tree passes equivalent checks
npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true
```

5. **Never** `wrangler pages deploy ... --branch` for production mcflyads.com.
6. After live probe: bump **`mcfly-version`** to **v16**, record Pages deployment id, journal entry under `docs/ops/journal/`, update [`LIVING_BOARD.md`](../LIVING_BOARD.md).

---

## Evidence checklist (implementer)

- [ ] Phase 2 Admin screenshot pack approved
- [ ] Home: sales-first H1; Harbor SAMPLE below fold unchanged
- [ ] Demo: Overview-default; Total ROAS not the hero sell; no Northline 4.19× above the fold as lead
- [ ] Pricing + product: tab order and voice match Fly 238
- [ ] All spine CTAs: Install → listing URL; no invented reviews
- [ ] `site-sample-lock.sh` PASS
- [ ] Live curl: `/`, `/demo`, `/pricing`, `/product` 200; Custom 301 home

---

## References

- Attack sequence: [`plans/2026-09-10-world-class-attack.md`](../plans/2026-09-10-world-class-attack.md)
- Desk IA: [`plans/2026-09-10-mcfly-analytics-rebuild.md`](../plans/2026-09-10-mcfly-analytics-rebuild.md)
- Fly 238 journal: [`ops/journal/STATUS_20260910_fly238.md`](./journal/STATUS_20260910_fly238.md)
- Listing visuals: [`LISTING_VISUAL_PACK.md`](../LISTING_VISUAL_PACK.md)
