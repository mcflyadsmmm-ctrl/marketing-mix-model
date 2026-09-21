# Mcfly Analytics verification map

This directory is the maintained source for verifying the user-facing Snowdevil SAMPLE desk. Read this index, then use one feature file as the recipe.

## Baseline preconditions

- Doctor the hosted desk before driving. Command: `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs doctor`.
- Default origin is `https://mcfly-analytics.fly.dev`. Public entry is `/demo`.
- `GET /health` must be `ok: true`, service `mcfly-analytics`, db `up`.
- Shop label on the page is `Snowdevil`. The trust region is `aria-label="Trust and freshness"` and includes `SAMPLE`.
- `GET /app` without `shop`, `host`, or a bearer token is the recovery shell. Do not drive it.
- Local `shopify app dev` stays skipped unless a Partner login already exists. The doctor file records that skip.
- `https://mcflyads.com/demo` iframes `https://mcfly-analytics.fly.dev/demo?hosted=1`. Drive the Fly URL. `hosted=1` hides the install note. Proof URLs omit it so `SAMPLE Snowdevil · same desk as the Shopify app · not a live client` stays visible.
- Never POST to Fly. Public spend does not save. Do not Fly-deploy.

## Driving conventions

- Start every recipe from a doctor-clean origin.
- Prefer `role="tab"` names, `aria-label`s, and `#mcfly-*` ids over CSS coordinates.
- Treat helper commands as literal.
- Run browser and HTTP checks through `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs`.
- Admin paths use `/app` where these recipes use `/demo`, and they require an embedded session. Do not report an Admin path as verified by the public desk.
- Keep proof files under `artifacts/verify-mcfly/`. Cleanup removes the Chrome profile only.

## Proof and skip reporting

- Capture the URL you opened and the resulting heading, active tab, and active chip.
- UI proof includes `<feature>.aria.txt` and `<feature>.png`.
- Redirect proof (Growth, LTV) includes `<feature>.redirect.json` with status 302.
- Record the feature id in `<feature>.proof.json`.
- If Partner login is missing, say `localShopifyDev` was skipped and the public desk was the path you drove. Do not mark `/app` verified.
- A skipped entry point is not verified by a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then exactly four H2 sections:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with verify-mcfly`
4. `Gotchas`

## Features

Painted tabs, in order: Overview, Orders, Customers, Spend, Goals, then Settings.

- [Overview](./overview.md) is `/demo`. First lane is typical order, returning dollars, weekends, and a typical day.
- [Orders](./orders.md) is `/demo/orders`. Median ticket versus Shopify’s average, then the sales clock and weekday/hour.
- [Customers](./customers.md) is `/demo/customers`. Returning dollars versus new.
- [Growth](./growth.md) is the Customers chip. `/demo/growth` redirects to `?panel=growth`.
- [LTV](./ltv.md) is the Customers chip. `/demo/ltv` redirects to `?panel=ltv`.
- [Spend](./spend.md) is `/demo/spend`. Total ROAS, explorer, mix, and CPA. The public page does not save spend.
- [Goals](./goals.md) is `/demo/goals`. Read-only month sales and break-even Total ROAS. No panel rail.
- [Settings](./settings.md) is `/demo/settings`. Sample-only copy, $39 after a 7-day trial, no Sample | Live toggle.

Selector index for agents: [`docs/ADMIN_FEATURE_MAP.md`](../../../../docs/ADMIN_FEATURE_MAP.md).
