# Overview

Overview is the SAMPLE desk home. It shows Snowdevil’s typical order, returning dollars, weekends, and a sales chart. Shopify Analytics Overview is Total Sales and a returning-customer rate. This page is not that list.

## Sub-features

- `overview-open` lands on the Overview tab with the Snowdevil SAMPLE banner.
- `overview-first-lane` shows the first lane `Typical order, returning $, weekends, typical day`.
- `overview-yoy` shows the YoY glance block `#mcfly-yoy-glance`.
- `overview-chart` shows the sales chart `#mcfly-chart`.
- `overview-mix` shows mix and month close `#mcfly-mix-close`.
- `overview-year` shows the year board `#mcfly-yoy-year`.

## How to get to it (user POV)

- Open `https://mcfly-analytics.fly.dev/demo`.
- Choose the `Overview` tab in `Desk pages`.
- On the installed app, choose `Overview` in the Admin nav (`/app`). That path needs a Shopify session. This recipe does not.

## Driving it with verify-mcfly

Preconditions:

- `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs doctor` exited 0 for this origin.
- `MCFLY_RUN_ID` matches that doctor run when you need one evidence folder.

- **Open Overview.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive overview`. HTTP 200. `s-page` heading is `Overview`. The tab named `Overview` has `aria-current="page"`.
- **Identity.** The snapshot contains `SAMPLE Snowdevil · same desk as the Shopify app · not a live client`, `.mcfly-ctx__brand` text `Snowdevil`, and `SAMPLE` inside `aria-label="Trust and freshness"`.
- **First lane.** A section `aria-label="Typical order, returning $, weekends, typical day"` is present, inside `#mcfly-overview`. The greeting states that Shopify Analytics Overview is Total Sales and a returning-customer rate.
- **On this page.** The chip labels are `YoY glance`, `Chart`, `Mix close`, `YoY year`. They link to `/demo?panel=yoy-glance`, `chart`, `mix-close`, and `yoy-year`.
- **Proof.** `artifacts/verify-mcfly/<run-id>/overview.proof.json` has `"ok": true`. `overview.aria.txt` lists the heading, the current tab, and `#mcfly-overview`. `overview.png` shows the same desk.

## Gotchas

- Dollar amounts and the as-of line change with the calendar. Assert the lane label and the SAMPLE shop, not a frozen `$` figure.
- `?hosted=1` hides the install note. The drive URL does not set it.
- `?shot=1` hides the tab row and the page heading. Do not use it for this proof.
- Retired hashes `#mcfly-compare`, `#mcfly-ledger`, `#mcfly-mix`, and `#mcfly-plan` resolve to Overview home in `deskStageFromHash`. They are not panel chips.
- `/demo/yoy` redirects to `/demo?panel=yoy-year`. `/app/yoy` does the same under `/app` after Admin auth.
