# Black Clover = Mcfly base (then we beat it)

**Marty lock (2026-09-13):** Port everything useful Black Clover’s MER Dashboard does as the **floor**. Mcfly then **improves** with Shopify-native depth BC never had (Days / Orders / Customers / Cohorts ledgers).

**Craft source:** `docs/APPS_SCRIPT_CRAFT_SPEC.md` + clasp pull at `vendor/mer-apps-script/` (when available).  
**Do not port:** Domo, multi-brand portfolio, Meta/Google/Klaviyo OAuth zoo, CRM LTV seeds, Asana, Monday Close ritual.

---

## What Black Clover actually is

Cash MER operator desk:

> **Cash MER = sales ÷ total ad spend · not platform ROAS**

| Surface | BC behavior | Mcfly status | Action |
| --- | --- | --- | --- |
| **Overview home** | Decision strip + KPI rail + channel mix + equation + sticky context | Built (`ScoreboardHero`, desk CSS) but **`/app` redirects to Sales** | **Restore Overview as `/app`** |
| **Fonts / sky paper** | Fraunces + Source Sans 3, `#e8f2fa` paper | Ported in craft CSS | Keep / harden |
| **Period control** | Segmented MTD / windows | `PeriodControl` | Keep shared |
| **Sticky context rail** | Brand · as-of · MER/BE chips | Present on Overview | Keep on Overview |
| **Decision strip** | One takeaway + why + CTAs | `ScoreboardHero` + OpsDesk | Keep; wire CTAs to Spend / Sales |
| **4-up KPIs** | MER · Sales · Spend · EOM / secondary | Overview metrics | Keep; show honest empty when no spend |
| **Channel mix bars** | Pastel Google/Meta/… | Spend / Allocation | Keep under Spend wing |
| **Target MER rail** | Settings target vs actual | Settings + Overview | Keep |
| **Break-even from margin** | Margin → BE MER | Settings margin | Keep |
| **Closed days only** | No fake today spend | SalesDayFact closed-day religion | Keep everywhere |
| **Spend CSV / entry** | Daily spend spine | `/app/spend` | Keep as BC spend desk |
| **Allocation Cut/Hold/Shift** | Channel badges + recommendation | `/app/allocation` | Keep under Spend |
| **Export CSV** | Operator export | Period ledger / exports | Keep / surface |
| **Control pacing** | Sales vs calendar | Overview control strip | Keep when spend trusted |
| **Copy religion** | “Not platform ROAS” | Product labels | Keep |

### Explicitly NOT BC (Mcfly advantages — build after base)

| Desk | Why it beats BC |
| --- | --- |
| **Sales** | Shopify rhythm / mix / change charts |
| **Days** | Full day ledger from Shopify facts |
| **Orders** | Per-order economics table |
| **Customers** | Buyer ledger + repeat (Level-1 opaque keys) |
| **Cohorts** | First-order month LTV table |
| **Products** | Line-item ingest (Phase B) |
| **Goals** | Shopify pace board |

---

## Product sequence (locked)

1. **Restore BC Overview as home** — remove `/app` → Sales redirect; Overview in top nav first.  
2. **Harden BC Spend + Allocation** — same craft language, honest empty states.  
3. **Shopify depth desks** — Sales / Days / Orders / Customers / Cohorts as improvements.  
4. **Craft polish pass** — scorecard ≥ 4.0 on Overview + Spend.  
5. **Products** after line-item ingest.

---

## Top nav (BC base + clear spend split)

| Order | Tab | Role |
| --- | --- | --- |
| 1 | **Overview** | Black Clover scoreboard (home) — MER when spend exists |
| 2 | **Sales** | Shopify period story |
| 3 | **Customers** | Buyers + repeat |
| 4 | **Goals** | Pace board |
| 5 | **Upload Spend** | **Only** get spend in (day / bill / CSV) |
| 6 | **Allocation** | BC cut / hold / shift once spend exists |
| 7 | **Settings** | Margin, target MER, sample, exports |

**Spend subnav** (on Upload / Allocation / Insights pages): Upload Spend · Allocation · Spend insights  

**Next wave:** Days · Orders · Cohorts  
**Still under subnav (not top):** Spend insights (`/app/advanced`)

### Why Upload ≠ Marketing Spend mega-tab

Spend was the trickiest surface because entry + MER + allocation competed on one desk.  
Black Clover separates the ritual (get spend in) from the readouts (scoreboard / allocation / explorer). Mcfly mirrors that:

1. **Upload Spend** — operator work surface  
2. **Overview** — MER / decision when coverage exists  
3. **Allocation** — portfolio call  
4. **Spend insights** — advanced formulas (subnav)

---

## Ship gate for “BC base restored”

- [ ] `/app` loads Overview (no redirect to Sales)  
- [ ] Nav shows Overview first  
- [ ] ScoreboardHero visible: formula · decision · hero cards · till-read · insights  
- [ ] Period control works  
- [ ] No spend → honest empty MER (not fake 0×)  
- [ ] With spend → MER · Sales · Spend KPIs + link to Allocation  
- [ ] Typecheck / Overview tests green  
- [ ] Fly deploy smoke

Then continue Days / Orders ledgers as the Mcfly improvement layer.
