# Admin feature map

Short selector index for the Mcfly Analytics desk on branch `cursor/spend-trust-recurring` and descendants. Source of truth is the code cited below. Recipes and proof commands live in [`.cursor/skills/verify-mcfly/`](../.cursor/skills/verify-mcfly/SKILL.md).

Public drive origin: `https://mcfly-analytics.fly.dev`. Marketing `https://mcflyads.com/demo` iframes `https://mcfly-analytics.fly.dev/demo?hosted=1`.

`GET /app` without `shop`, `host`, or a bearer token renders the recovery shell, not this tablist.

## Tab order

Painted order from `DESK_PRIMARY_NAV` in `app/app/lib/desk-nav.ts`. The lock test expects these labels and paths, and expects Growth, LTV, CPA, and Spend Upload to be absent from the nav.

| # | Label | Admin path | Public path | Where the label is rendered |
| --- | --- | --- | --- | --- |
| 1 | Overview | `/app` | `/demo` | `s-app-nav` and `a[role="tab"]` |
| 2 | Orders | `/app/orders` | `/demo/orders` | same |
| 3 | Customers | `/app/customers` | `/demo/customers` | same |
| 4 | Spend | `/app/spend` | `/demo/spend` | same |
| 5 | Goals | `/app/goals` | `/demo/goals` | same |
| 6 | Settings | `/app/settings` | `/demo/settings` | Admin: `s-app-nav` only. Public: `DeskTopTabs` passes `includeSettings`, so the pill row includes Settings. |

Iframe analysis pills (`DESK_IFRAME_NAV`) are the first five. Settings stays on the Admin side nav.

## Stable selectors

| Selector | Meaning |
| --- | --- |
| `nav[aria-label="Desk pages"]` | Pill tablist (`DeskTopTabs`). |
| `a[role="tab"][aria-current="page"]` | Open tab. Accessible name is the label in the table above. |
| `nav[aria-label="On this page"]` | Panel chips (`DeskPanelRail`). Absent on Goals and Settings. |
| `a.mcfly-desk-panel-rail__chip--on` | Selected chip. |
| `s-page[heading="Overview"]` (and Orders, Customers, Spend, Goals, Settings) | Page heading attribute. |
| `.mcfly-ctx__brand` | Shop. Public text: `Snowdevil`. |
| `[aria-label="Trust and freshness"]` | SAMPLE chip plus freshness. |
| `.mcfly-data-mode[role="status"]` | Sample-data status when SAMPLE is forced (public demo, or Admin shot/freeze). |
| `.mcfly-public-install__note` | `SAMPLE Snowdevil · same desk as the Shopify app · not a live client`. Hidden when `shot=1`, `embed` is set, or `hosted=1`. |

## Panel chips

From `DESK_PANEL_RAIL_BY_ADMIN_PATH` in `app/app/lib/desk-panel-rail.ts`. `?panel=` scrolls to `#mcfly-<panel>` when that id exists (`DeskBookPage`).

| Page | Chip label | `panel` | Element id in the route |
| --- | --- | --- | --- |
| Overview | YoY glance | `yoy-glance` | `mcfly-yoy-glance` |
| Overview | Chart | `chart` | `mcfly-chart` |
| Overview | Mix close | `mix-close` | `mcfly-mix-close` |
| Overview | YoY year | `yoy-year` | `mcfly-yoy-year` |
| Orders | Typical | `typical` | not stamped |
| Orders | Clock | `clock` | not stamped |
| Orders | Timing | `timing` | not stamped |
| Customers | Returning | `returning` | `mcfly-returning` |
| Customers | LTV | `ltv` | `mcfly-ltv` |
| Customers | Growth | `growth` | `mcfly-growth` |
| Customers | Depth | `depth` | `mcfly-depth` |
| Spend | Total ROAS | `roas` | `mcfly-roas` |
| Spend | Explorer | `explorer` | `mcfly-explorer` |
| Spend | Mix | `mix` | `mcfly-mix` |
| Spend | CPA | `cpa` | `mcfly-cpa` |
| Spend | Add spend | `spend-add` | `mcfly-spend-add` on Admin `app.spend.tsx` only. Public `demo.spend.tsx` does not render it. |

## Lane labels used as `aria-label`

| Page | Label |
| --- | --- |
| Overview | `Typical order, returning $, weekends, typical day` |
| Orders | `Typical order vs Shopify’s average` |
| Orders | `Sales clock and intelligence` |
| Orders | `Weekday and hour` |
| Customers | `Returning dollars vs new` |
| Customers / LTV | `What a new buyer is worth` |
| Customers / Growth | `Days to a second order` |
| Spend | `Sales, spend, and Total ROAS` |
| Spend | `Customer acquisition cost` |

Other regions: `Trust and freshness`, `What new customers spend`, `Entered spend mix`, `Shopify sales this period`.

## Redirects

| From | To | Auth |
| --- | --- | --- |
| `/demo/growth` | `/demo/customers?panel=growth` | none |
| `/demo/ltv` | `/demo/customers?panel=ltv` | none |
| `/app/growth` | `/app/customers?panel=growth` | Admin |
| `/app/ltv` | `/app/customers?panel=ltv` | Admin |
| `/demo/roas` | `/demo/spend?panel=roas` | none |
| `/demo/allocation` | `/demo/spend?panel=mix` | none |
| `/demo/cpa` | `/demo/spend?panel=cpa` | none |
| `/app/roas` | `/app/spend?panel=roas` | Admin |
| `/app/allocation` | `/app/spend?panel=mix` | Admin |
| `/app/cpa` | `/app/spend?panel=cpa` | Admin |
| `/demo/yoy` | `/demo?panel=yoy-year` | none |
| `/app/yoy` | `/app?panel=yoy-year` | Admin |
| `/app/buyers` | `/app/customers` | Admin |
| `/app/timing` | `/app/orders` | Admin |
| `/app/close` | `/app` | Admin. Monday Close UI is retired. |

`/app/connections` is a page that says ad accounts are not connected. It does not redirect.

## Not product promises

Do not treat these as pass criteria: Meta pixels, path credit, break-even fixed at 40%. Plan copy is a 7-day trial, then $39/store/month (`demo.settings.tsx`, `pricing.tsx`).
