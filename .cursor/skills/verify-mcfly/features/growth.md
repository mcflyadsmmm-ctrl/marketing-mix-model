# Growth

Growth is the Customers section for days to a second order: first-time dollars and who came back within 30 days. It is order history, not an email list and not ads. The top-level tab stays Customers.

## Sub-features

- `growth-redirect` sends `/demo/growth` to `/demo/customers?panel=growth`.
- `growth-chip` marks the `Growth` chip selected.
- `growth-lane` shows `#mcfly-growth` with lane `Days to a second order`.

## How to get to it (user POV)

- On Customers, choose the `Growth` chip under `On this page`.
- Open `/demo/growth` (or `/app/growth` when embedded). The server redirects to the Customers URL with `panel=growth`.
- Overview and Orders footers link `Growth` to `?panel=growth`.

## Driving it with verify-mcfly

Preconditions:

- Doctor exited 0.
- Customers itself is not a substitute. This recipe requires the Growth chip to be current.

- **Old URL.** The helper requests `/demo/growth` with redirects off. Status is 302 and `Location` contains `/demo/customers?panel=growth`. That pair is `growth.redirect.json`.
- **Open the section.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive growth`. Final HTTP 200. Heading stays `Customers`. Active tab stays `Customers`. Active chip is `Growth`.
- **Lane.** `#mcfly-growth` contains `aria-label="Days to a second order"` and the sentence `Shopify Analytics Overview shows a returning-customer rate.` The lede ends with `Order history, not an email list.`
- **Proof.** `growth.proof.json` is `"ok": true` and the aria file says `active chip: Growth` and `id: mcfly-growth`.

## Gotchas

- `/app/growth` calls `authenticate.admin` before the redirect. The public proof is `/demo/growth` only.
- The Growth block is also in the Customers HTML when `panel` is absent. A proof that never selects the chip has not opened Growth.
- `panel=growth` scrolls to `#mcfly-growth`. The heading does not change to Growth.
- Do not look for a Meta pixel or a path-credit column. They are not this feature.
