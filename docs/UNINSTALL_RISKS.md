# Uninstall risk matrix — Mcfly Analytics

**Status:** Agent SoT · 2026-07-30  
**Product SoT:** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4 · TTFV &lt;10 min  
**Companions:** [`RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md`](./RESEARCH_ABSORB_SHOPIFY_FAILURE_VECTORS.md) · [`COMPETITIVE_APP_STORE_GAP_AUDIT.md`](./COMPETITIVE_APP_STORE_GAP_AUDIT.md) · [`PREMIUM_NATIVE_UX_RESEARCH.md`](./PREMIUM_NATIVE_UX_RESEARCH.md)

---

## 0. Verdict

Week-1 uninstalls are mostly **onboarding / packaging**, not missing pixels. Shopify Partner reasons (mandatory since 2026) map poorly in the wild (“Testing multiple apps” is often the first click). Protect **activation**: Sample → Real → margin → spend → trusted Total ROAS before Pro walls.

**Refuse as “retention fixes”:** pixels, MTA, SyncWith zoo, guilt modals, red upgrade CTAs.

---

## 1. Shopify uninstall reasons → Mcfly protections

| Partner reason | Typical real cause | Mcfly protection |
| --- | --- | --- |
| Testing multiple apps | Installed, never saw value in &lt;10 min | Cold empties + sticky Real checklist + SAMPLE practice |
| Not using app now | Lost after Sample or blank spend | Persist Real 3-step until margin + spend; ritual nav |
| Not satisfied with features | Expected auto-sync / TW attribution | Honest CSV + “sales automatic” copy; refuse theater |
| Too expensive | Hit Pro ($39) before first MER | Demote Goals/LTV nav + Spend upsell until cash-ready |
| Not working properly | SAMPLE mistaken for live; incomplete facts | Sample \| Real bar; facts honesty banners |
| Not satisfied with support | Can’t find next step / support | Checklist CTAs + Settings support; site FAQ |
| Store closing / Other | Not product-fixable | Uninstall purge hygiene only |

Sources: [Shopify changelog — uninstall reasons](https://shopify.dev/changelog/update-to-app-uninstall-reasons) · failure-vector absorb §1 · industry churn = activation failure.

---

## 2. Ranked risk matrix (week-1)

| # | Risk | Status | Fix lane |
| --- | --- | --- | --- |
| 1 | Real checklist ephemeral (`?guide=real` only) | **AGENT_FIX** — sticky until margin+spend | `DataModeBar` + `app.tsx` loader |
| 2 | Goals/LTV in primary nav before first MER | **AGENT_FIX** — ritual nav until cash-ready | `app.tsx` |
| 3 | Empty Spend leads with $39 Pro primary | **AGENT_FIX** — Add spend owns empty | `app.spend.tsx` |
| 4 | CSV vs auto-sync expectation | **PARTIAL** — copy + listing FAQ | Spend / Home empties |
| 5 | Incomplete spend → harsh Close lock | **SHIPPED** honesty; soften CTA later | `CashTrustBanners` |
| 6 | Sample without Real habit | **PARTIAL** — sticky guide | DataModeBar |
| 7 | Sales error feels broken | **PARTIAL** — retry + support path | Home / banners |
| 8 | Cold empty one-CTA TTFV | **SHIPPED** | `app._index.tsx` |
| 9 | Sample \| Real global toggle | **SHIPPED** | `DataModeBar` |
| 10 | Add spend + Sample write block | **SHIPPED** | `app.spend.tsx` |
| 11 | Uninstall webhook purge | **SHIPPED** | `webhooks.app.uninstalled.tsx` |
| 12 | Partner uninstall feedback loop | **HUMAN** weekly | Partner Dashboard |

---

## 3. Agent DoD (this file)

When claiming uninstall-protection work:

1. Sticky Real guide shows when Real + (!marginConfirmed \|\| !hasLiveSpend)  
2. Primary nav is Overview · Memo · Spend · Settings until cash-ready (Goals/LTV deep-linkable)  
3. Empty Spend does **not** use Pro unlock as the primary CTA  
4. `DataModeBar` hidden when `?shot=1`  
5. Sample-ON spend/CSV block copy points at **Real store** (not Demo tab)  
6. `bash scripts/agent-ship-gate.sh` green  
7. No pixels / MTA / connector zoo added  

**Deploy:** apply migration `20260731030000_sample_preview_allowed` (Fly boot `prisma migrate deploy`) before this layout hits production — column is read on every app page.

---

## 4. Human gates (cannot agent-fix)

- Read Partner uninstall reasons weekly once live  
- Listing / Distribution / PCD submit  
- Design-partner smoke (`install works`)  
- Support SLA / email response  
