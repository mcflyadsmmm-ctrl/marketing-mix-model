# Settings

Settings on the public desk explains that the book is SAMPLE Snowdevil, states the Total ROAS formula, and shows the plan price. It cannot switch the demo to a live shop.

## Sub-features

- `settings-open` selects the Settings tab and heading `Settings`.
- `settings-sample-only` says there is no Sample | Live toggle.
- `settings-plan` shows `7-day trial, then $39/store/month`.

## How to get to it (user POV)

- Choose the `Settings` tab on the public pill row (`/demo/settings`).
- In Shopify Admin, Settings is in `s-app-nav` (`/app/settings`), not in the five analysis pills.

## Driving it with verify-mcfly

Preconditions:

- Doctor exited 0.

- **Open Settings.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive settings`. HTTP 200. Heading `Settings`. Active tab `Settings`.
- **Sample lock.** Body contains `Snowdevil example sales so you can click around.` and `cannot switch to a live shop.` and `No Sample | Live toggle`.
- **Plan.** Body contains `7-day trial, then $39/store/month`.
- **Formula.** `Shopify Total Sales ÷ spend you added` is on the page, from the same honesty line as Spend.
- **Proof.** `settings.proof.json` is `"ok": true`.

## Gotchas

- There is no `On this page` rail on Settings.
- Do not click Install or Support as a proof of Settings. Those leave the desk.
- Admin Settings can save margin and open billing. The public page cannot. A drive that POSTs `/app/settings` is out of this recipe.
- The price line is the product promise. A 40% break-even, a Meta pixel, or path credit is not.
