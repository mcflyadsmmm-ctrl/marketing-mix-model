# Mcfly Analytics — App feature inventory

Cash MER + break-even MER + rules-based allocation from **spend vs sales**.  
**Not in product:** pixels, multi-touch attribution (MTA), path credit, or platform ROAS theater.

Status legend: **Shipped** · **Planned** · **Later**

---

## Truth MVP (v1) — shipped / in progress

| Feature | Status | Notes |
| --- | --- | --- |
| **Dashboard** | **Shipped** | Period presets (MTD / QTD / YTD); Shopify sales vs manual ad spend; MER; break-even MER; channel mix; anti-attribution aside |
| **Allocation (card)** | **Shipped** | One recommendation card on Dashboard via `@mcfly/mer-core` `suggestAllocation`; auditable inputs (sales, spend, MER, break-even, test window) |
| **Allocation (detail)** | **Shipped** | `/app/allocation` — actions, channel efficiency table, cash-view assumptions |
| **Spend** | **Shipped** | Manual Meta / Google / Other spend entry + recent list |
| **Settings** | **Shipped** | Contribution margin % → break-even MER; target MER |
| **Connections** | **Shipped (stubs)** | Meta / Google connector UI stubs; OAuth deferred to Phase 2 |
| **Shopify OAuth / embedded** | **Shipped** | React Router + Shopify app bridge; session storage via Prisma |
| **Seed sample data** | **Shipped** | `npm run seed` — warehouse snapshots or inline fallback for `demo-store.myshopify.com` (needs `DATABASE_URL`) |

---

## v2 — live spend + polish

| Feature | Status | Notes |
| --- | --- | --- |
| **Meta Marketing API spend sync** | **Planned** | Daily cash spend pull after App Review |
| **Google Ads API spend sync** | **Planned** | Same; Connections page enables Connect |
| **Freshness / recon hints** | **Planned** | Last sync age, spend gaps vs sales period |
| **Custom date ranges** | **Planned** | Beyond MTD / QTD / YTD when cheap |
| **CSV spend import** | **Planned** | Bulk “Other / Manual” for agencies |
| **Manual sales contribution per channel** | **Planned** | Optional operator input into allocation — still not MTA |

---

## Enterprise / launch layer

| Feature | Status | Notes |
| --- | --- | --- |
| **Billing** | **Planned** | Shopify Billing / trial; App Store listing |
| **Multi-store** | **Planned** | Portfolio view across shops — revenue-pulled, not default v1 |
| **SSO** | **Later** | Enterprise IdP; after multi-store demand |
| **Sheets companion** | **Planned** | Thin client → same MER brain / API; after app brain is stable |
| **PWA / downloadable** | **Later** | Installable / offline-friendly shell; not blocking design partners |
| **Alerts** | **Later** | MER below break-even notifications — revenue-pulled |
| **TikTok / other pipes** | **Later** | Only if pulled by paying operators |

---

## Explicit non-goals (all tiers)

- Pixel / view-through / MTA / “true ROAS”
- Creative cockpits, Media Lab, Asana, full Klaviyo parity
- SyncWith-scale connector catalog in v1/v2
- Consulting checkout / diagnostic product pricing on the SaaS surface

---

## Route map (current app)

| Route | Feature |
| --- | --- |
| `/app` | Dashboard + allocation card |
| `/app/allocation` | Allocation detail |
| `/app/spend` | Manual spend |
| `/app/settings` | Margin + target MER |
| `/app/connections` | Connector stubs |

---

## Related docs

- [MASTER_PLAN.md](./MASTER_PLAN.md) — product directive and phases
- [ARCHITECTURE.md](./ARCHITECTURE.md) — one-brain packages and clients
