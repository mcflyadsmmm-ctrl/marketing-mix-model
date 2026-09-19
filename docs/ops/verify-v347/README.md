> **Upgrade path:** Prefer `docs/ops/verify-shotmode-v347/` (real tip React + `?shot=1`).  
> Static HTML fixtures here are **deprecated as craft SoT** — see `FIXTURES_DEPRECATED.md`.

# verify-v347 — tip visual proof (interim)

Interim Admin-desk visual gate while Shopify Admin session-service is broken.
**Craft SoT remains Admin tip on Fly** (`mcfly-analytics`, embedded `/app/*`, SAMPLE Snowdevil).
Marketing `/demo` is **non-SoT** — do not score it.

## What this is

- SAMPLE-shaped HTML fixtures under `fixtures/` styled with tip `app/app/styles/mcfly-desk.css`
- Chrome headless PNGs of every analysis tab + Settings
- `SCORECARD.md` with PASS/FAIL vs multi-million bar

## Re-run

From repo root (Linux box with Google Chrome or Chromium):

```bash
node docs/ops/verify-v347/harness/build-fixtures.mjs
node docs/ops/verify-v347/harness/shot.mjs
```

Optional:

```bash
CHROME_PATH=/usr/bin/google-chrome node docs/ops/verify-v347/harness/shot.mjs
```

Outputs land in `docs/ops/verify-v347/*.png`. Fixtures regenerate into `fixtures/`.

## Prefer Playwright (optional)

If you want Playwright instead of system Chrome:

```bash
cd docs/ops/verify-v347 && npm i -D playwright-core
# then point a short shot script at chromium.launch({ channel: 'chrome' })
```

The checked-in `harness/shot.mjs` already uses system Chrome — no install required on this box.

## Do not

- Fly deploy
- Partner Submit
- Use marketing site `/demo` as tip proof
- Claim Marty-ready Admin PASS from this packet alone
