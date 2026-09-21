# Customers

Customers shows returning dollars next to new dollars for SAMPLE Snowdevil. Shopify Analytics Customers is a customer list. Growth, LTV, and depth are sections on this page, not separate top-level tabs.

## Sub-features

- `customers-open` selects the Customers tab and heading `Customers`.
- `customers-returning` shows `#mcfly-returning` and the first lane `Returning dollars vs new`.
- `customers-chips` exposes `Returning`, `LTV`, `Growth`, and `Depth`.

## How to get to it (user POV)

- Choose the `Customers` tab (`/demo/customers`).
- On Admin, choose `Customers` (`/app/customers`). `/app/buyers` redirects to `/app/customers`.
- Overview’s footer link named `Customers` goes to the same path.

## Driving it with verify-mcfly

Preconditions:

- Doctor exited 0.

- **Open Customers.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive customers`. HTTP 200. Heading `Customers`. Active tab `Customers`.
- **Sample book.** The lede contains `Customer depth below reads SAMPLE Snowdevil order history`.
- **First lane.** `aria-label="Returning dollars vs new"` wraps `#mcfly-returning`. Copy states that Shopify Analytics Customers is a customer list.
- **Chips.** Labels are `Returning`, `LTV`, `Growth`, `Depth`, linking to `?panel=returning|ltv|growth|depth`.
- **Proof.** `customers.proof.json` is `"ok": true`. The aria file lists `#mcfly-returning`, `#mcfly-ltv`, `#mcfly-growth`, and `#mcfly-depth`.

## Gotchas

- With no `panel` query, no chip has `mcfly-desk-panel-rail__chip--on`. Growth and LTV recipes are the ones that require an active chip.
- Customer names, emails, and phones are not on this page. Do not go looking for a Shopify customer list.
- Spend and Total ROAS are not this tab. `CUSTOMERS_SPEND_BANS` in code keeps Upload Spend and Total ROAS off the Customers helpers.
