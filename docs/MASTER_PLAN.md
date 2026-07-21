# Mcfly Marketing Analytics — Master Plan

**Domain:** mcflyads.com  
**Working email:** mcflyadsmmm@gmail.com (owner/backup); public `hello@` / `support@` on domain when ready  
**Status:** Planning → Phase 0 setup  

---

## 1. Master directive

**Mcfly is an anti-attribution marketing cockpit for Shopify operators.**

- Ad platforms over-claim conversions. Multi-touch / pixel “truth” is mostly theater.
- Triple Whale / Northbeam–style path attribution brainwashes teams into optimizing a model instead of the bank account.
- Mcfly only reconciles **real ad spend (money out) vs Shopify sales (money in)** → **MER (Marketing Efficiency Ratio)**.
- Then Mcfly helps **allocate spend across channels** from that truth — not from who “won” the click.

**One-liner:** *Stop buying attribution. Start managing spend against sales.*

**Formula (north star):**

```text
MER = Total Shopify sales (period) ÷ Total ad spend (same period)
```

Break-even MER ≈ `1 / contribution margin` (merchant-configured).  
Operate above the line; allocate toward mix that protects it.

---

## 2. What we are / are not

| We are | We are not |
| --- | --- |
| Spend-vs-sales operating system | SyncWith / Supermetrics clone |
| Opinionated MER + allocation | Triple Whale / Polar / Northbeam clone |
| Anti-path, anti-pixel-causality (v1) | MTA / “true ROAS” path product |
| Shopify-first product | Sheets-only hobby script as the business |
| Inspired by deep internal dashboards (e.g. BC Apps Script) | Obligated to ship that full surface on day one |

The Black Clover–style Apps Script MER dashboard is a **ceiling example** of how rich Shopify + spend data can get — not the v1 spec.

---

## 3. Product surfaces

| Surface | Priority | Role |
| --- | --- | --- |
| **Shopify embedded app** | P0 — primary product | Connect store, MER, mix, allocation, connections, billing |
| **Backend API + workers** | P0 | OAuth, daily sync, metrics engine, jobs |
| **Marketing site (mcflyads.com)** | P0 — thin | Positioning, pricing, privacy, terms, install CTA |
| **Google Sheets add-on** | P1 — companion | Live/export MER tables for sheet-native operators |
| **Internal Apps Script lab** | Optional R&D | Prototype logic; not customer-facing host |
| Looker / public warehouse API | P2+ | Only if paid demand |

**Architecture rule:** One brain (API + DB). Thin clients (Shopify, later Sheets). Site sells; it does not compute MER.

---

## 4. Recommended stack

### Marketing site (free)
- **Host:** GitHub Pages (preferred) or Cloudflare Pages — **static only**
- **DNS:** Stay on Cloudflare (free DNS); do **not** burn Worker quotas on the brochure site
- **Pages:** `/`, `/pricing`, `/privacy`, `/terms`, `/support`

### App + API
- **Build:** Cursor + Shopify Remix app template (`shopify app init`)
- **UI:** Polaris (embedded Admin)
- **Runtime:** Node on Railway / Render / Fly
- **DB:** Postgres
- **Jobs:** cron / queue worker (daily Meta + Google pulls)
- **Monitor:** Sentry (free tier OK early)
- **Repo:** GitHub under Mcfly identity

### Connectors (v1)
- Shopify Admin API — sales / refunds as needed
- Meta Marketing API — spend (`ads_read`)
- Google Ads API — spend (developer token + OAuth)

### Explicitly later
- TikTok Ads, Klaviyo, Asana, creative analytics, pixels, MMM/incrementality holdouts

### Accounts / identity
- Shopify Partner on Mcfly email
- Meta Developer + Business Manager (Mcfly BM)
- Google Cloud + Ads API
- Domain email: Cloudflare Email Routing → Gmail, or Google Workspace later  
  (`hello@mcflyads.com`, `support@mcflyads.com`)

---

## 5. v1 scope (ship this, nothing else)

**In**
- Shopify OAuth + embedded app
- Period selectors: MTD / QTD / YTD (and custom range if cheap)
- Total sales, total spend, **MER**, **break-even MER** (from margin input)
- Channel mix (at least Meta + Google + “other/manual”)
- Freshness + recon hints (“last synced”; flag if connectors fail)
- **One allocation recommendation card** (rules-based: e.g. shift toward channel with better cash efficiency vs break-even — no path attribution)
- Settings: margin %, target MER, connected accounts
- Marketing site + privacy/terms
- Shopify Billing (simple paid plan + trial)

**Out of v1**
- Pixel / MTA / view-through
- Creative cockpit
- Full BC feature set (Media Lab, Asana, Klaviyo depth, Hill curves, portfolio of 4 brands — unless one design partner needs a thin slice)
- SyncWith-level connector catalog
- Perfect parity with TW/Polar

---

## 6. Phased roadmap

### Phase 0 — Foundation (week 0)
**Goal:** Company plumbing ready; site off Worker limits.

- [ ] Mcfly Google account 2FA; Partner org intentional
- [ ] DNS: point mcflyads.com to **GitHub Pages** (or CF Pages static)
- [ ] Publish stub pages: home (directive), privacy, terms
- [ ] Email routing: `support@mcflyads.com` → working inbox
- [ ] GitHub repo + Shopify app scaffold
- [ ] Hosting + Postgres project created
- [ ] Dev store connected

**Exit:** `https://mcflyads.com` live static; empty Remix app runs locally / preview.

### Phase 1 — Truth MVP (weeks 1–3)
**Goal:** Trusted number on one store without live ad APIs.

- [ ] Ingest Shopify sales for selected period
- [ ] Manual / CSV / Sheet paste for Meta + Google spend
- [ ] Compute MER + break-even; simple KPI UI
- [ ] Channel mix chart (manual split OK)

**Exit:** Daily use on **one real store**; merchant trusts the MER vs their own mental math.

### Phase 2 — Live spend pipes (weeks 3–7)
**Goal:** Automatic daily spend.

- [ ] Meta OAuth + daily insights spend sync + cache
- [ ] Google Ads OAuth + daily cost sync + cache
- [ ] `install`/cron triggers; retries; freshness badges
- [ ] Recon warnings when sync fails or data is stale
- [ ] Start Meta App Review + Google token access upgrades for third-party

**Exit:** No manual spend entry for Meta/Google on design-partner store(s).

### Phase 3 — Allocation layer (weeks 6–9)
**Goal:** Differentiation beyond a calculator.

- [ ] Rules engine: break-even-aware allocation suggestion
- [ ] Plain-language “why” + suggested test window (e.g. 7 days)
- [ ] Optional: simple pacing vs monthly spend/sales goal

**Exit:** Operators act on the card at least weekly; suggestion is auditable (inputs shown).

### Phase 4 — Public launch (weeks 8–12)
**Goal:** Installable paid app.

- [ ] App Store listing copy (anti-attribution positioning)
- [ ] Billing: trial → paid
- [ ] Support path (`support@mcflyads.com`)
- [ ] Soft launch to small DTC / agency list
- [ ] Collect 3–5 design partners

**Exit:** First external paid install OR clear waitlist with deposit intent.

### Phase 5 — Sheets companion (post-revenue)
**Goal:** Meet operators where they live without becoming SyncWith.

- [ ] Workspace add-on or Apps Script bound to Mcfly API
- [ ] Refresh MER / spend / sales into a template sheet
- [ ] Refresh quotas on free vs paid

**Exit:** Sheet users sync from Mcfly brain; site/Shopify remain source of truth for accounts.

### Phase 6+ — Depth (only if pulled by revenue)
Pick from the “ceiling” menu as paid demand dictates:

- Multi-brand / agency portfolio
- TikTok spend
- Promo calendar overlays
- Diminishing-return / frontier style sims (from internal R&D)
- Anomaly alerts (MER breach)
- Deeper Shopify finance (fees, refunds, COGS imports)

---

## 7. Positioning & messaging

**Enemy:** Attribution theater; platform ROAS as P&L.  
**Promise:** Cash MER + allocation guardrails.  
**Proof:** Design-partner case (anonymized): spend, sales, MER vs break-even, decision taken.  
**Price intuition (starting point, validate later):** below TW suite pricing — e.g. mid-two-digits to low-three-digits $/mo for single store; agency seat later.

**Homepage thesis (draft):**  
Platforms lie about what they drove. Paths can’t be resolved. Mcfly only measures what you spent against what Shopify sold — then helps you move budget.

---

## 8. Cost model (DIY)

| Item | Estimate |
| --- | --- |
| Phase 0–1 cash | ~$50–150 (domain already owned; hosting + tools) |
| Through public listing | ~$100–300 total cash + Shopify $19 registration |
| Monthly run (early) | ~$30–80 (Cursor, host, DB, email) |
| Time to credible v1 | ~80–150 focused hours + OAuth review wall-clock |

Agency rebuild of full vision: not the plan.

---

## 9. Team / operating principles

1. **Religion over features** — if a feature needs path attribution, it doesn’t ship.
2. **One brain** — Shopify and Sheets never diverge on MER definition.
3. **Reliability > charts** — stale/wrong spend kills trust forever.
4. **Ceiling ≠ roadmap** — internal dashboards inspire; customers pull scope.
5. **Design partners before scale** — one serious store beats 100 tire-kickers.

---

## 10. Kill / pivot criteria

**Kill or hard pivot if:**
- Design partners won’t open the app weekly after 30 days of accurate MER.
- Meta + Google spend cannot stay within ~5% of Ads Manager for 14 consecutive days.
- Differentiation collapses into “another blended ROAS tile” with no allocation action.
- Support load from connector breakage exceeds time available before any revenue.

**Do not kill because:** TW has more features; Sheets users ask for 40 connectors; someone wants a pixel.

---

## 11. Immediate next actions (this week)

1. Move **mcflyads.com** to **GitHub Pages** (static); keep Cloudflare for DNS only.  
2. Add `/privacy` and `/terms` (required for OAuth/App Store).  
3. Create Shopify Partner app scaffold in this repo.  
4. Create Meta + Google Cloud projects under Mcfly identity.  
5. Pick **one** design-partner store (can be BC or another).  
6. Ship Phase 1 Truth MVP (manual spend OK).

---

## 12. Success definition (12 months)

- Paying Shopify merchants using Mcfly as **weekly spend-vs-sales** source of truth.  
- Brand association: “anti-attribution / cash MER,” not “cheaper Triple Whale.”  
- Sheets companion optional; core revenue from app subscriptions.  
- Roadmap pressure from customers, not from competitor feature matrices.

---

*Document owner: Mcfly*  
*Living plan — update phase checkboxes as execution proceeds.*
