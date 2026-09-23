# App craft plan — Shopify-native quality (after quality-v45 P0)

**Written:** 2026-09-22 ~21:25 MT  
**Why:** Marty screenshots + judgment: desk is not a $39 product. Niche is real; current IA/prose density is the failure.  
**Depends on:** `QUALITY_RESCUE_PLAN.md` P0 shipping first (overlap + wireframe bars + YoY essay).

## Honest diagnosis

Cursor can ship CSS and TSX. What failed is **product craft discipline**: too many explaining sentences, equal-weight cards, custom chrome fighting Shopify Admin, and version stacking without a single information architecture.

**We do not need random downloaded skills.** We already have:
- Shopify Dev MCP (`polaris-app-home`, Admin API) — use it every craft ship  
- Research `05`–`07` + Lifetimely composition steal  
- Short-prompt Conductor OS  

Installing unknown third-party “Shopify skills” without review is refused (shadow MCP / skill risk). If Marty wants a **local skill file** we write ourselves from Polaris docs, that is fine.

## Shopify-informed craft rules (locked)

From Polaris App Home patterns (Metrics card, Homepage template, `s-page` / `s-section` / `s-paragraph`):

1. **One primary metric** owns the first fold — not a farm.  
2. **Admin chrome is the frame** — our UI should feel like a native Analytics report, not a marketing microsite inside Admin. Prefer Polaris web components (`s-page`, `s-section`, `s-stack`, `s-box`, `s-text`, `s-badge`) for structure; custom CSS only for the order-book plane.  
3. **Prose is rare** — subdued `s-paragraph` once; numbers carry meaning. Kill “describing sentences” that repeat the KPI.  
4. **Sections have headings, not essays** — `s-section heading="…"`.  
5. **Empty states are patterns** — not yellow banners + helper paragraphs.  
6. **Tabs = jobs** — Overview (morning cash), Orders (ticket), Customers (returning $), Spend (ROAS), Goals (plan). Nothing else on the first scroll of each.

## Program (two ships, not 40)

### Ship Q (tonight) — `cursor/quality-v45`
P0 site + Overview density already in branch. Publish after tests + one Opus Ship.

### Ship R — App craft v1 (next, exclusive Desk)
**Exclusive:** `app/app/routes/app._index.tsx`, `demo._index.tsx`, `OverviewFirstViewport`, `OverviewYoyCards`, `OverviewSalesChart`, `DeskLane`, `mcfly-desk.css` (Overview only), tests.  
**Do:** Overview = Polaris-shaped page: hero plane → compact YoY list → one chart section. No mix/shareables/depth on first two scrolls (push `rank="more"` or delete from home). Strip remaining ledes.  
**Model:** Composer implements to this file; Opus Ship once.  
**Done:** `/demo` first 2 viewports = number + compare + strip + YoY list + chart only; `rg` for essay phrases = 0 on Overview first lanes.

### Ship S — Tab pass (Orders → Customers → Spend)
One tab per PR max. Same rules. No Goals until those three read finished.

## What Marty decides later
Unpark, listing Save, ads — unchanged. App craft does not wait on them.

## Refuse
New research fleet · downloading unverified skills · TW dark mode · religion changes · “world class” without a done bar.
