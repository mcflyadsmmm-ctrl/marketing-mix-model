# Mcfly Analytics — App feature inventory

Total ROAS + Break-even Total ROAS + rules-based allocation from **spend vs sales**.  
**Not in product:** pixels, multi-touch attribution (MTA), path credit, platform ROAS theater, **Monday Close lock UI**, **Meta/Google spend OAuth**.

**Retired SoT:** [`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md)

Status legend: **Shipped** · **Planned** · **Later** · **Retired**

---

## Truth MVP (v1) — shipped

| Feature | Status | Notes |
| --- | --- | --- |
| **Dashboard (Overview)** | **Shipped** | Period presets; Shopify sales vs CSV/manual spend; Total ROAS; break-even; channel mix; Share Overview (mailto) |
| **Allocation (card)** | **Shipped** | One recommendation card via `@mcfly/mer-core` `suggestAllocation` |
| **Allocation (detail)** | **Shipped** | `/app/allocation` — mix, history, cash-view assumptions |
| **Spend** | **Shipped** | Multi-platform CSV (combine + wide template), Bill → daily, manual entry, coverage strip, export guides; optional pipe templates |
| **Settings** | **Shipped** | Margin % → break-even; Total ROAS target |
| **Connections** | **Retired** | Redirects to `/app/spend` — no OAuth UI |
| **Monday Close** | **Retired** | Redirects to `/app` — use Share Overview on Home |
| **Shopify OAuth / embedded** | **Shipped** | Install/session only (not ads OAuth) |
| **Seed sample data** | **Shipped** | `npm run seed` / SAMPLE desk |

---

## v2 — polish (no live ads OAuth)

| Feature | Status | Notes |
| --- | --- | --- |
| **Meta / Google spend OAuth sync** | **Retired** | Out of product; CSV + optional merchant-paid pipes only — see `RETIRED_SURFACES.md` |
| **Freshness / recon hints** | **Shipped** | Coverage strip + optional Ads Manager ±5% declared recon |
| **Custom date ranges** | **Planned** | Beyond presets when cheap |
| **CSV spend import** | **Shipped** | Platform export guides + combine; wide/long formats |
| **Pipe automation templates** | **Shipped** | SyncWith-class templates; merchant pays pipe vendor |
| **Manual sales contribution per channel** | **Planned** | Optional operator input — still not MTA |

---

## Enterprise / launch layer

| Feature | Status | Notes |
| --- | --- | --- |
| **Billing** | **Planned** | Shopify Billing / trial; App Store listing |
| **Multi-store** | **Planned** | Portfolio view — revenue-pulled |
| **SSO** | **Later** | After multi-store demand |
| **Sheets companion** | **Planned** | Thin client → same Total ROAS brain |
| **Alerts** | **Shipped (in-app)** | Below break-even banner when margin known + spend > 0 |
| **Spend recon** | **Shipped** | Optional declared Ads Manager total vs desk CSV ±5% |
| **Sales basis** | **Shipped** | Total Sales action default; Net toggle; gross Ads Manager–comparable secondary |

---

## Explicit non-goals (all tiers)

- Pixel / view-through / MTA / “true ROAS”
- Creative cockpits, Media Lab, Asana, full Klaviyo parity
- SyncWith-scale connector catalog **inside** Mcfly
- Meta/Google (or other) **spend OAuth** owned by Mcfly
- Monday Close lock ritual UI
- Consulting checkout / diagnostic product pricing on the SaaS surface

---

## Route map (current app)

| Route | Feature |
| --- | --- |
| `/app` | Overview + Share Overview |
| `/app/close` | **Redirect → Home** (retired) |
| `/app/allocation` | Spend Allocation |
| `/app/spend` | CSV / manual spend + pipe templates |
| `/app/spend/template` | CSV / pipe template downloads |
| `/app/settings` | Margin + target Total ROAS |
| `/app/connections` | **Redirect → Spend** (retired) |
| `/app/goals` | Goals / pace |
| `/app/ltv` | LTV / Acquisition (Pro-gated live) |
| `/app/advanced` | Advanced metrics |

---

## Related docs

- [MASTER_PLAN.md](./MASTER_PLAN.md) — product directive
- [RETIRED_SURFACES.md](./RETIRED_SURFACES.md) — Close + ads OAuth out
- [DESK_REFINEMENT_PRD.md](./DESK_REFINEMENT_PRD.md) — CSV-first Free desk
- [ARCHITECTURE.md](./ARCHITECTURE.md) — one-brain packages
