---
name: verify-mcfly
description: Drive the Mcfly Analytics Snowdevil SAMPLE desk (public /demo on Fly, iframed from mcflyads.com/demo) and capture proof for Overview, Orders, Customers, Growth, LTV, Spend, Goals, and Settings. Use when a change to the embedded Admin desk needs a user-path check. Partner login is required only for the live /app iframe.
---

# Verify Mcfly Analytics

Mcfly Analytics is a Shopify embedded Admin app (order-history LTV desk). The user-facing surface agents can drive without a Partner session is the public Snowdevil SAMPLE desk. It is the same React UI as Admin, served at `/demo` on `https://mcfly-analytics.fly.dev`. `https://mcflyads.com/demo` only iframes that URL (`?hosted=1`).

Admin `/app` inside the Shopify iframe needs `shop` / `host` (or a bearer session). A bare `GET /app` is the recovery shell, not the desk. Do not Fly-deploy from this skill. Do not paste Partner Dashboard copy. Do not POST spend, settings, or billing at the shared Fly host.

Pricing copy on the desk is a 7-day trial, then $39/store/month. Do not treat Meta pixels, path credit, or a fixed 40% break-even as product promises. Break-even on Goals and Settings is margin math (`Break-even Total ROAS`), not a 40% pledge. Scopes the live shop uses, and this demo does not call, are `read_orders`, `read_customers`, `read_all_orders`, and `read_reports`.

Read `features/README.md` before driving. One feature file is the recipe. Tab order and selectors are also in `docs/ADMIN_FEATURE_MAP.md`.

## Launch

Default: nothing to start. The SAMPLE desk is already served.

Ready when both are true:

- `GET https://mcfly-analytics.fly.dev/health` returns HTTP 200 and JSON `"ok": true`, `"service": "mcfly-analytics"`, `"db": "up"`.
- `GET https://mcfly-analytics.fly.dev/demo` returns HTTP 200, title `Full Snowdevil SAMPLE demo | Mcfly Analytics`, and a tablist `aria-label="Desk pages"`.

Override the origin with `MCFLY_DEMO_ORIGIN` (no trailing slash). There is no teardown for the hosted desk. Do not stop Fly.

Local embedded app, only when a human has already completed Shopify Partner login:

```bash
npm install
npm run build --workspace=@mcfly/mer-engine
cd app
cp .env.example .env
npm run setup
npm run dev
```

`npm run dev` is `shopify app dev`. Ready when that CLI prints its preview URL. Teardown is Ctrl-C in the terminal you started. Record that PID. Do not kill `node` or `shopify` by process name.

Local production-shaped server, after a repo `npm run build` and `app/.env` (see `app/README.md`):

```bash
cd app && npm run start
```

`app/scripts/serve-with-site.mjs` listens on `PORT` or 3000. `/demo` does not call Prisma. `/health` does, so `npm run setup` must have migrated `DATABASE_URL` (default `file:./dev.sqlite`) or doctor fails. Point the helper at it with `MCFLY_DEMO_ORIGIN=http://127.0.0.1:3000`. Stop the PID you started.

Two `shopify app dev` sessions must not share one Partner app. Two readers of public `/demo` are fine because that book is in-memory and the public spend page does not save.

## Doctor

Read-only. Run this before any drive, and again when a page looks wrong.

```bash
node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs doctor
```

Exit 0 means the origin is worth driving. The report is `artifacts/verify-mcfly/<run-id>/doctor.json`. It must show:

- `/health` ok, service `mcfly-analytics`, db `up`
- `/demo` paints Overview, shop `Snowdevil`, the SAMPLE trust chip, and `aria-label="Desk pages"`
- `GET /app` without `shop`, `host`, or bearer does **not** paint that tablist (recovery shell)
- `localShopifyDev.attempted` is `false` and `localShopifyDev.skip` names the Partner-login gate

That skip is expected in a cloud VM with no Partner session. Do not invent a local Admin URL to get past it. A non-zero doctor means stop. Do not drive.

## Drive

Harness is `verify-mcfly`. It GETs the public URL and opens it in headless Chrome (`CHROME_PATH`, default `google-chrome`) with a private `/tmp/verify-mcfly-chrome-<run-id>` profile. Prefer the tab and chip accessible names below. Do not click by coordinates.

Same run id as doctor when you set `MCFLY_RUN_ID`. Otherwise the helper reuses `artifacts/verify-mcfly/current.json`.

```bash
node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive overview
```

Feature argument: `overview`, `orders`, `customers`, `growth`, `ltv`, `spend`, `goals`, `settings`.

Stable handles, public paths (Admin swaps `/demo` for `/app`):

| Handle | What it is |
| --- | --- |
| `nav[aria-label="Desk pages"]` | Pill tabs. Each tab is `a[role="tab"]`. The open page is `[aria-current="page"]`. |
| `nav[aria-label="On this page"]` | Panel chips. The selected chip has class `mcfly-desk-panel-rail__chip--on`. |
| `s-page[heading="…"]` | Page heading attribute: Overview, Orders, Customers, Spend, Goals, Settings. |
| `.mcfly-ctx__brand` | Shop label. Public demo text is `Snowdevil`. |
| `[aria-label="Trust and freshness"]` | Contains the `SAMPLE` chip. |
| `.mcfly-data-mode[role="status"]` | Sample-data status. Public demo freezes SAMPLE on. |
| `#mcfly-overview` and other `#mcfly-*` | Scroll targets. `?panel=` scrolls to `#mcfly-<panel>` when that id exists. |

Tab labels and hrefs on `/demo`: Overview `/demo`, Orders `/demo/orders`, Customers `/demo/customers`, Spend `/demo/spend`, Goals `/demo/goals`, Settings `/demo/settings`. Admin `s-app-nav` uses the same labels on `/app`, `/app/orders`, `/app/customers`, `/app/spend`, `/app/goals`, `/app/settings`. Settings is in the public pill row (`includeSettings`) and in Admin `s-app-nav`. The Admin iframe pills omit Settings.

Growth and LTV are Customers chips, not top-level tabs. `/demo/growth` is HTTP 302 to `/demo/customers?panel=growth`. `/demo/ltv` is HTTP 302 to `/demo/customers?panel=ltv`. The same redirects exist under `/app` after Admin auth.

A pass is the helper exit 0 plus `artifacts/verify-mcfly/<run-id>/<feature>.proof.json` with `"ok": true`. Assert labels, ids, the active tab, and the active chip. Do not assert today’s dollar amounts. They move with the calendar.

## Evidence

Directory: `artifacts/verify-mcfly/<run-id>/` (override with `MCFLY_EVIDENCE_DIR`). One run id per doctor/drive pair.

For the feature you drove, keep:

- `<feature>.http.html` — server HTML of the user URL
- `<feature>.aria.txt` — title, `s-page` heading, tabs, chips, `aria-label`s, `#mcfly-*` ids
- `<feature>.png` — Chrome screenshot of that URL
- `<feature>.dom.html` and `<feature>.dom.aria.txt` — Chrome dump after load
- `<feature>.proof.json` — URL, active tab, active chip, errors
- `doctor.json` — health, demo, Admin-without-session, local Shopify skip

Growth and LTV also write `<feature>.redirect.json` for the 302.

Proof standards:

- Open the real `/demo` path (or the redirect that lands on it). Do not call loaders, vitest, or test-only endpoints as the proof.
- Record the action (URL, and the 302 when the recipe starts from `/demo/growth` or `/demo/ltv`) and the resulting heading, tab, and chip.
- Public spend is read-only. Confirm the page says `This demo does not save spend.` Do not treat a missing network POST as optional color. The Admin add-spend form (`#mcfly-spend-add`) is not on `/demo/spend`.
- SAMPLE numbers are the production isolation for this desk (`loadPublicSamplePage` never calls Shopify). Do not mock a second layer on top.
- Do not pass a run because copy mentions pixels, path credit, or break-even at 40%.

## Cleanup

```bash
node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs cleanup
```

Deletes `/tmp/verify-mcfly-chrome-<run-id>` and the matching `-dom` profile recorded in `artifacts/verify-mcfly/current.json`. If `chromePid` was set, it signals that PID only. It does not delete `artifacts/verify-mcfly/`. It does not kill Chrome by name. It does not stop Fly or a `shopify app dev` process you did not record.

After cleanup, `<feature>.proof.json`, `<feature>.png`, and `<feature>.aria.txt` must still be on disk. A cleanup that removes them is a failed proof.

## Helpers

The helper script is executable. Invoke it with `node`:

```bash
node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs doctor
node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive overview
node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs cleanup
```

Environment: `MCFLY_DEMO_ORIGIN`, `MCFLY_EVIDENCE_DIR`, `MCFLY_RUN_ID`, `CHROME_PATH`.

When the desk changes, run `/maintain-verification-skill` against `.cursor/skills/verify-mcfly/`.
