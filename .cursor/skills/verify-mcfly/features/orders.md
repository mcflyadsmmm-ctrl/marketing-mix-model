# Orders

Orders shows the typical order (median) against Shopify’s average, then the sales clock and weekday or hour. It is a painted tab, not an Overview hash.

## Sub-features

- `orders-open` selects the Orders tab and heading `Orders`.
- `orders-typical` shows the first lane `Typical order vs Shopify’s average`.
- `orders-clock` shows the next lane `Sales clock and intelligence`.
- `orders-timing` shows the next lane `Weekday and hour`.

## How to get to it (user POV)

- From Overview, choose the `Orders` tab (`/demo/orders`).
- On Admin, choose `Orders` (`/app/orders`). `/app/timing` redirects to `/app/orders`.

## Driving it with verify-mcfly

Preconditions:

- Doctor exited 0.
- You are not asserting Admin order facts. This URL is the in-memory Snowdevil book.

- **Open Orders.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive orders`. HTTP 200. Heading `Orders`. Active tab `Orders`.
- **Lanes.** The page includes `Typical order vs Shopify`, `aria-label="Sales clock and intelligence"`, and `aria-label="Weekday and hour"`. The lede says Shopify Analytics shows the average order.
- **Chips.** `On this page` lists `Typical`, `Clock`, `Timing`.
- **Proof.** `orders.proof.json` is `"ok": true`. `orders.aria.txt` shows tab `Orders` current and those three lane labels.

## Gotchas

- The first-lane accessible name uses a typographic apostrophe in `Shopify’s`. Match the prefix `Typical order vs Shopify` if you search by hand.
- Chip targets `panel=typical`, `panel=clock`, and `panel=timing` scroll to `#mcfly-typical`, `#mcfly-clock`, and `#mcfly-timing`. Those ids are not stamped on `demo.orders.tsx` or `app.orders.tsx`. Prove the lane `aria-label`s. Do not invent the missing ids.
- `/app/orders` without a Shopify session is not this page.
