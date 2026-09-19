# Mcfly well tokens — hybrid Admin craft

**When:** 2026-09-18 · Visual blowaway vs Lifetimely / TW  
**SoT CSS:** `app/app/styles/mcfly-desk.css`

## Direction

- Outer shell: Polaris-light (Shopify iframe).
- Inner scoreboards: **dark wells** (`--mcfly-well-*`).
- One accent: `--mcfly-well-accent` (cyan) for hero KPIs / At goal / chart.
- Empty stays **—** via `--mcfly-well-empty` — never `0.00×`.

## Tokens

| Token | Role |
| --- | --- |
| `--mcfly-well-bg` | Well canvas |
| `--mcfly-well-bg-elev` | Elevated KPI tiles |
| `--mcfly-well-ink` | Primary type |
| `--mcfly-well-mute` | Labels / hints |
| `--mcfly-well-line` | Hairlines |
| `--mcfly-well-accent` | Hero / truth accent |
| `--mcfly-well-truth` | Positive deltas |
| `--mcfly-well-empty` | Em dash empties |
| `--mcfly-kpi-display` / `--mcfly-kpi-hero` | Type scale |

## Classes

- `.mcfly-well` / `.mcfly-well--scoreboard` — explicit wrappers
- Auto-mapped: `.mcfly-kpi-grid--peeks-lead`, `.mcfly-yoy--glance`, `.mcfly-chart--sales`, `.mcfly-book__glance--kpis`, `.mcfly-spend-glance`, first-lane depth grids, named scoreboard peeks
- Hero: first child of peeks-lead, `.mcfly-kpi--hero`, `.mcfly-book__kpi--lead`

## Religion

Zero spend/ROAS on Overview. No purple glow. No attribution theater.
