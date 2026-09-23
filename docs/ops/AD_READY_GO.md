# Ad-ready GO — Mcfly Analytics (2026-09-23)

**Goal:** Product + site finished enough to advertise. Cursor cannot buy ads, Submit Partner forms, deploy Fly from this box, or invent reviews.

**Product state (git):** PCD **L2 Approved**. Phase G in tree: `read_reports` + `SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE=true`. SAMPLE still does not paint QL clocks. Live stays **PARKED** until you unpark. Site live **v45** H1 = Spend next to real Shopify sales · Install → App Store · `/demo` iframe → Fly SAMPLE.

---

## You tap these (order)

| # | Tap | Done when you reply |
| --- | --- | --- |
| 1 | **Merge** this finalize PR (or #215 + the L2 Orders-test fix) onto `cursor/spend-trust-recurring` | `merged` |
| 2 | **Mac:** `cd app && npx shopify app deploy --allow-updates` (Public app) — pushes scopes incl. `read_reports` | `scopes deployed` |
| 3 | **Mac:** `flyctl deploy --app mcfly-analytics --remote-only` from the merged tip | `fly live` |
| 4 | **Re-auth** every installed shop (scope change forces it) — start with demcflyads | `reauth done` |
| 5 | **Partner Listing Save** — paste [`LISTING_LIVE_PASTE.md`](./LISTING_LIVE_PASTE.md) (sales-first). Confirm **one** plan $39 / 7-day, **no Free**. App URL / privacy / support / terms stay **Fly** | `listing saved` |
| 6 | **Admin smoke** on demcflyads: Home · Customers · Spend paint; type **one** spend day; Start trial CTA opens plan page | `admin smoke pass` |
| 7 | Paste **one organic week** into [`money/FUNNEL_WEEKLY.md`](./money/FUNNEL_WEEKLY.md) (visits / installs / trials) | `funnel pasted` |
| 8 | **Unpark** only when you want paying shops to see their store (not SAMPLE): set `MCFLY_SAMPLE_ONLY=false` + stage — see accuracy checklist | `unparked` (optional for first ads) |

---

## Advertising — honest gates

From [`money/APP_STORE_ADS.md`](./money/APP_STORE_ADS.md):

| Gate | Status after this ship | Notes |
| --- | --- | --- |
| 1 Admin smoke | **YOU** (step 6) | Product is ready to smoke |
| 2 ≥3 honest reviews | **RED (0)** | Do not invent. Founder risk if you buy App Store ads anyway |
| 3 Funnel week pasted | **YOU** (step 7) | Empty until you paste |
| 4 P0 desk on Fly | **GREEN** after step 3 | `/health` already 200; deploy scopes |

**Cursor will not start campaigns or set a budget.**

### Fastest path to spend (founder choice)

1. Finish taps **1–6**.
2. **Shopify App Store search ads** — only after you accept gate 2 risk **or** get ≥3 reviews. Land on `https://apps.shopify.com/mcfly-analytics-public`. Tiny daily cap. Bid: ad spend · billboard · marketing spend · ROAS. Kill clicks with zero installs.
3. **External Meta/Google** — land on the **listing** (not a mismatched homepage). Site is already Install-led; use it as Learn more, not as the paid destination until listing Save matches.

---

## Do not block on

- Extra densify micro-PRs
- Country / tag LTV (optional later)
- Accuracy F1–F4 cold “matches Analytics” claims until after deploy + one Live shop smoke
- Custom / hire landers (301 home)

---

## Probe bar (already true on live curl 2026-09-23)

- `mcflyads.com` → H1 Spend next to real Shopify sales · Install CTA · v45 · 90/24 history line
- `mcfly-analytics.fly.dev/` → **301** → mcflyads.com
- Fly `/demo` → From orders · $68,457 · no “Live is parked” / “Look here first”
- Listing 200 · $39 · reviews still **0**
