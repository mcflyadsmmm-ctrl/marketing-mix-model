# Apps Script → Mcfly desk craft spec (FORCE)

**Source of truth for look/feel:** clasp pull at `vendor/mer-apps-script/` (gitignored)  
**Script ID:** `1Ws8OibDzYP4HQR8q04TP_PU5zytokIcz6y8eRQuRidzWY9VyzUARINfS`  
**Access/refresh:** [`APPS_SCRIPT_ACCESS.md`](./APPS_SCRIPT_ACCESS.md)  
**Product religion still wins:** MASTER_PLAN — cash MER = sales ÷ spend; no pixels/MTA/LTV zoo as product.

Agents editing Cash MER / desk CSS **must** read this file + `vendor/mer-apps-script/Stylesheet.html` + Overview markup in `Index.html` before shipping UI.

---

## Must port (scoreboard craft)

| # | Pattern | Apps Script evidence | Mcfly target |
| --- | ---: | --- | --- |
| 1 | **Fonts** | `--font: Source Sans 3`; `--display: Fraunces` | Load both; Fraunces on titles + KPI values + decision takeaway |
| 2 | **Tokens** | `--bg #e8f2fa`, `--ink #0c1929`, `--accent #0284c7`, one cool `--shadow` | Match `:root` in `mcfly-desk.css` (no purple slop) |
| 3 | **Topbar** | Brand left + uppercase micro definition + segmented time window | Title + `Cash MER · Shopify sales ÷ ad spend · not platform ROAS` + period segmented |
| 4 | **Sticky context rail** | Brand · as-of · quiet MER/freshness chips (dot, not pill soup) | Sticky bar under topbar |
| 5 | **Decision strip** | Left accent border, kicker, Fraunces takeaway, quiet actions | One sentence: vs target / break-even + headroom; CTAs → Spend / Allocation |
| 6 | **4-up KPI grid** | MTD MER (emphasized) · Sales · Spend · EOM/secondary | Cash MER · Sales · Spend · **EOM projected MER** (BE in lead delta + ctx chip) with `.delta.up/down/flat` |
| 7 | **Panels** | White surface, border, Fraunces `panel-head h2` | Channel mix + equation panel |
| 8 | **Channel bars** | Soft pastel channel colors (google/meta/microsoft/klaviyo) | Keep named channels; same pastel language |
| 9 | **Motion** | Short `--motion: 160ms`; no noisy enter theater | Prefer Apps Script quiet motion over flashy rises |
| 10 | **Copy religion** | “not platform ROAS” / cash scoreboard | Never claim path/ROAS theater |

## Must NOT port

Multi-brand portfolio tabs · Domo spines · Meta/Google Trends · LTV/Customers CRM · Klaviyo boards · Asana · seed dumps · spreadsheet IDs · API tokens.

### Monday Close (`/app/close`) — hybrid note

**Polaris owns** the whole Close surface (chrome, exceptions banners, lock form, CSV). Do **not** wrap Close in sky-paper + Fraunces scoreboard. Ritual rail = Exceptions → Lock → Variance → Decision → CSV; decision copy must say illustrative step-test / average ≠ marginal ROAS.

---

## Parity scorecard (agent must self-score before “done”)

Score 1–5 each. **Ship only if mean ≥ 4.0** or list explicit gaps.

| Dimension | Score | Notes |
| --- | ---: | --- |
| Fonts (Fraunces + Source Sans 3) | **5** | Loaded in `root.tsx`; CSS `--mcfly-display` / `--mcfly-font` |
| Token match (bg/ink/accent/shadow) | **5** | `#e8f2fa` desk paper / `#0284c7` / one cool shadow; chrome soft on Spend/Settings only |
| Decision strip present + useful | **5** | MER strip + Allocation **recommendation hero** + why line + Spend/Settings CTAs |
| 4-up KPI grid + delta lines | **5** | MER · Sales · Spend · EOM; formula line under lead KPI; prior deltas |
| Sticky context rail (not chip soup) | **5** | Sticky blur rail + MER/target + BE + freshness dots |
| Segmented periods like script | **5** | Shared `PeriodControl`; bordered group + accent-soft active |
| Panel heads Fraunces | **5** | Equation “Shopify sales ÷ ad spend” + channel + control + next |
| Control pacing visual | **5** | Sales-vs-calendar bars + daily sales needed (CSS only); hidden in shot |
| Channel Cut/Hold/Shift badges | **5** | Larger bordered badges; empty mix → primary Spend CTA; alloc eff badges |
| Religion (no theater features) | **5** | No LTV/Domo/pixels; digestible loading/error/zero-margin states |
| Listing shot readability | **5** | Shot keeps formula + decision+KPIs+stack+eq; hides state strips/control |
| **Mean** | **~4.9** | Pass 2026-07-23 hybrid scoreboard craft (states / alloc hero / formula / badges) |

---

## Read order (every desk craft pass)

1. This file  
2. `vendor/mer-apps-script/Stylesheet.html` (`:root` → `.overview-decision` → `.kpi-grid` → `.context-bar` → `.panel`)  
3. `vendor/mer-apps-script/Index.html` (`#view-overview` only)  
4. `vendor/mer-apps-script/JavaScript.html` → `renderOverviewDecision_` + KPI `innerHTML` block (~2140–2240)  
5. Then edit `app/app/routes/app._index.tsx` + `app/app/styles/mcfly-desk.css`

If `vendor/mer-apps-script/` missing: fall back `/tmp/mcfly-mer-script2` and tell human to `clasp pull` per ACCESS doc.

---

## Force Cursor to apply this

You cannot “force” the model with hope — you force it with **files + rules + a done bar**:

1. Keep source on disk: `vendor/mer-apps-script/` (`clasp pull`)  
2. Commit the **craft spec** (this file) — agents must score against it  
3. Rule `65-apps-script-mer-craft.mdc` fires on desk file edits  
4. Skill `mcfly-apps-script-craft` when you say “Apps Script parity”  
5. Spawn **Fable/Opus** only for Cash MER (swarm rule)  
6. Optional: paste `webapp: <exec url>` or screenshots for visual QA  

Chat phrase that triggers a full port pass:

> **Apps Script parity — scorecard ≥ 4.0, Fable lane, ship-gate**
