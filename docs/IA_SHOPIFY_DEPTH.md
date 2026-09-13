# App IA — Black Clover base + Shopify depth

**Status:** active · 2026-09-13  
**Companions:** `docs/BC_BASE_PARITY.md`, `docs/DESK_IA_SKELETON.md`, `app/app/lib/shopify-depth-catalog.ts`

## Top nav (core)

| Tab | Route | Job |
| --- | --- | --- |
| **Overview** | `/app` | **Black Clover scoreboard** — decision · KPIs · till-read · insights (home) |
| **Sales** | `/app/sales` | Shopify period story — rhythm, mix, change charts |
| **Customers** | `/app/customers` | Repeat, concentration, buyer depth |
| **Goals** | `/app/goals` | Sales pace board |
| **Upload Spend** | `/app/spend` | **Entry only** — day / bill / CSV |
| **Allocation** | `/app/allocation` | BC cut / hold / shift (needs spend) |
| **Settings** | `/app/settings` | Margin, target MER, SAMPLE, privacy, exports |

**Spend subnav:** Upload Spend · Allocation · Spend insights (`/app/advanced`)  
**Next wave:** Days · Orders · Cohorts

## Rules

1. Overview is the BC home — never redirect `/app` away to Sales.  
2. Sales + Customers never require spend.  
3. Spend empty states stay honest (no fake 0× MER).  
4. Line-item charts may show empty until ingest — still listed.  
5. Mcfly **improves on** BC with Shopify ledgers; it does not delete the scoreboard.

## Catalog coverage

Every id in `SHOPIFY_DEPTH_CATALOG` must render on its tab (live or emptyReason).
