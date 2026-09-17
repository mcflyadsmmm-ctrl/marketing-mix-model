# Static HTML fixtures — DEPRECATED as craft SoT

**Bold disclaimer:** `fixtures/*.html` are an interim fallback only.

- Craft SoT remains **Admin tip on Fly** (`mcfly-analytics`, embedded `/app/*`, SAMPLE Snowdevil).
- Prefer **real tip React + `?shot=1`** via `docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs`.
- Do not score fixtures as Marty-ready Admin PASS.
- Marketing `/demo` remains non-SoT.

Re-run shotMode (Mac):

```bash
# With tip React already serving SAMPLE + shotMode routes:
BASE_URL=http://127.0.0.1:3458 node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs

# Fixture fallback only (NOT SoT):
ALLOW_FIXTURE_FALLBACK=1 node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs
```
