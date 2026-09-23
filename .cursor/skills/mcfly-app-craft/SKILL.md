---
name: mcfly-app-craft
description: >-
  Shopify-native desk craft for Mcfly Analytics App Home. Use when editing
  Overview/Orders/Customers/Spend UI, Polaris patterns, empty states, first-fold
  density, or when Marty says the app looks terrible / not worth $39.
---

# Mcfly App craft (Shopify-informed)

## Source of truth

- Plan: `docs/research/2026-09-22-revamp/APP_CRAFT_PLAN.md`
- Shopify Dev MCP: `learn_shopify_api` → `polaris-app-home` then `search_docs_chunks`
- Patterns: [Metrics card](https://shopify.dev/docs/api/app-home/v1.0/patterns/compositions/metrics-card), Homepage / Empty state compositions
- Do **not** download unverified third-party “Shopify skills.” Write local skills from docs + MCP only.

## Product locks (never violate)

- Religion: Total ROAS = Shopify sales ÷ entered spend; empty spend = **—** not 0×
- Overview first fold: order-book sales only — **no** spend/ROAS, **no** “Shopify Total Sales”
- Trust line: **From orders**
- SAMPLE_ONLY / no `read_reports` until Marty Phase G
- Public mark Mcfly Analytics · $39 / 7-day trial

## First-fold IA (every tab)

1. **One primary metric** owns the fold — not a KPI farm.
2. **Compare next** — compact YoY / prior line (label + $ + quiet prior). No essay ledes.
3. **One chart or table section** — section heading, not a paragraph farm.
4. Mix / shareables / depth / forecast → `rank="more"` or another tab. Not first two scrolls.

Tabs = jobs: Overview (morning cash) · Orders · Customers · Spend · Goals (last).

## Polaris web components — Mac reality

Ideal shape: `s-page` / `s-section` / `s-stack` / `s-text` / `s-badge` (Metrics card).

**Hard rule for this repo today:** React 18 does **not** map `className` → `class` on custom elements. Polaris CDN (`polaris.js`) is **not** loaded on public `/demo`. Until App Bridge + Polaris scripts are on both `/app` and `/demo`:

- Prefer native `<section className="…" aria-label="…">` + small `<h3>`
- Do **not** ship `<s-section className=…>` — CSS and headings will silently die
- Tests must **forbid** `s-section` in Overview components until polaris.js is loaded and React custom-element class handling is verified

When polaris.js lands: re-validate with Shopify `validate_component_codeblocks`, then migrate section-by-section.

## Prose discipline

- Numbers carry meaning. Kill sentences that restate the KPI.
- One subdued meta line max under the hero (From orders · prior).
- Empty / pending: short pattern line, never reports-scope theater.
- Drill drawers may explain; first fold may not.

## Done bar (Ship R+)

- `/demo` first two viewports = hero $ + YoY list + chart only
- `rg` essay phrases on Overview first lanes = 0 visible
- `npm test` green · Opus Ship once · Conductor merges + Fly
- Screenshot `/demo` 1280×720 before calling live quality done

## Refuse

Random skill downloads · TW dark mode · religion changes · “world class” without done bar · stacking version CSS without deleting ledes.
