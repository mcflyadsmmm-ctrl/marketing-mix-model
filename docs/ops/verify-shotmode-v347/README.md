# verify-shotmode-v347 — real tip React + shotMode

Upgrade of the interim `verify-v347` HTML-fixture packet.

**Method (target):** tip React desk with SAMPLE Snowdevil + `?shot=1` for all 12 surfaces.  
**Craft SoT:** Admin tip on Fly (`mcfly-analytics`) — this packet is **not** Marty-ready Admin PASS.  
**Non-SoT:** marketing `/demo`. Static `docs/ops/verify-v347/fixtures/` are **deprecated as SoT** (fallback only).

## Surfaces

overview · orders · customers · growth · ltv · goals · spend · cpa · yoy · roas · allocation · settings

## Re-run (Marty's Mac)

Repo: `~/Documents/MCFLY ANALYTICS APP/marketing-mix-model`  
Branch tip: `cursor/spend-trust-recurring` (or this PR branch).

### A) Preferred — live tip React + shotMode

1. Boot tip app locally with SAMPLE parked (`MCFLY_SAMPLE_ONLY=true`) so `/app/*` paints Snowdevil.
2. Confirm a page loads, e.g. `http://127.0.0.1:3458/app?shot=1&period=mtd`.
3. Shoot:

```bash
BASE_URL=http://127.0.0.1:3458 node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs
```

Outputs: `docs/ops/verify-shotmode-v347/*.png` + `METHOD.txt` (`method=real-tip-react-shotMode`).

### B) Fixture fallback (NOT SoT)

```bash
ALLOW_FIXTURE_FALLBACK=1 node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs
```

**Bold disclaimer:** fixture PNGs are chrome/CSS hygiene only — not Admin craft proof.

## Do not

- Fly deploy from this packet
- Partner Submit
- Score marketing `/demo`
- Claim Marty-ready Admin PASS without live Admin re-shoot
