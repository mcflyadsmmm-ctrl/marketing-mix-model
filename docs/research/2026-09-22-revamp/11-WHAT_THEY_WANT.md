# 11 — What they want (day 1 / day 30) — order-history analytics niche

**Lane:** Research · WHAT THEY WANT  
**Date:** 2026-09-22  
**Only output:** this file. No product code. No invented Mcfly reviews (listing reviews = **0**).  
**Product lock:** Total ROAS = Shopify sales ÷ **entered** spend · no pixels · trial shows **90 closed days** of live orders · paid keeps **≤24 months** of order rows · **PCD L2 pending** → Analytics-identical day totals are **not** available yet.  
**Sources:** Fresh web 2026-09-22 + sibling pack as check (`02`, `03`, `08`). Competitor review counts below are **theirs**, not Mcfly’s.

---

## Verdict in one paragraph

Shopify merchants who buy ads will pay **$39/mo** in this niche for a **calm order-book desk** that kills the export→Sheets loop for sales *quality* and repeat dollars — then, once they type spend, for **cash Total ROAS / MER** (sales ÷ entered spend) that matches Shopify, not Meta. They will **not** pay $39 for path attribution, an AI analyst, or sessions. Day 1 is won by painting **from orders in 60 seconds at $0 spend** while L2 day totals stay dark. Day 30 is won by a **morning habit** (typical order + returning $ + early LTV) plus a **weekly spend ritual** that replaces the MER spreadsheet.

---

## 1. Day-1 job (60 seconds or uninstall)

**Job:** “Prove this is useful before I connect anything or paste a CSV.”

| Must be on screen in ≤60s | Why | Constraint |
| --- | --- | --- |
| **Typical (median) ticket** vs Shopify’s mean AOV | Native AOV is a mean; Community still asks for median as a front-page metric ([Community 254046](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046)); Shopify’s own AOV education admits mean ≠ typical ([Shopify AOV](https://www.shopify.com/blog/average-order-value)) | Order GraphQL / OrderFact — **not** blocked on L2 |
| **Returning $ vs new $** (dollars, not headcount rate) | Native Overview pushes returning **rate**; operators plan acquisition vs retention in dollars ([Ivy_4 formula thread](https://community.shopify.com/t/how-is-the-returning-customer-rate-calculated-in-analytics/217973); Solutions 8 new/return $ report craft) | Order-book split on file; QL New/Returning Total Sales = post-L2 enrichment only |
| **Coverage line in human English** — trial = 90 closed days | Missing history painted as $0 / “full year” is Sidekick-class distrust; commercial window is the product truth (`BILLING_TIERS` / sibling `08`) | Never imply Analytics This-month parity while L2 is denied |
| **One calm next door** (Orders depth or Customers LTV peek) | Competitor day-one walls (pixel, OAuth, blank ROAS) uninstall in minutes ([02](./02-COMPLAINTS_AND_JOBS.md) TW/Polar themes) | No second login; live orders paint immediately |
| Quiet: “Add spend later for Total ROAS” — empty = **—** not 0× | MER is the paid job *after* trust; blank ROAS on home = “broken ads app” | Religion: sales ÷ entered spend only |

**Day-1 fail (uninstall in minutes):** blank Total ROAS / spend wall; waiting for ShopifyQL day totals; missing painted as $0; looking like Triple Whale without connectors; AI sentence that disagrees with Shopify.

**Day-1 pass:** Merchant thinks “I don’t need Sheets for the typical ticket / returning dollars” — still at **$0 spend**, with L2 clocks correctly dark.

---

## 2. Day-30 job (why they keep $39 after trial)

**Job:** “Open this instead of exporting orders and reconciling Meta ROAS in a sheet.”

| Habit that retains | What they do | Evidence |
| --- | --- | --- |
| **Morning sales-quality read** | Glance median / weekend-hour mix / returns honesty before scaling or panicking | Native redesign / buried Group-by → export ([r/shopify Analytics](https://www.reddit.com/r/shopify/comments/1i2jh0a/what_the_fuck_happened_to_shopify_analytics/); Community compare pain) |
| **Weekly cash Total ROAS / MER** | Type or CSV spend → sales ÷ that spend over 7 / 28 / MTD; decide budget from **rolling** MER, not Ads Manager ROAS | [MHI MER guide](https://mhigrowthengine.com/blog/dtc-mer-guide/); [Nuso blended MER](https://nuso.co.uk/blog/how-to-calculate-blended-mer); [Shopify MER explainer](https://www.shopify.com/blog/marketing-efficiency-ratio); [Ad-Lab ROAS vs MER sheet](https://www.ad-lab.io/resources/templates/roas-vs-mer-reconciliation) — the spreadsheet *is* the competitor |
| **Early LTV / second-order timing** | First-90 worth + days-to-second + 2nd-in-30 to set CAC ceilings and win-back clocks | Lifetimely repurchase / time-between-orders craft ([Amp help](https://help.useamp.com/article/675-repurchase-rate-report-walkthrough), [1800D2C Lifetimely review](https://www.1800d2c.com/review/lifetimely)); Amp listing praise centers daily KPIs + LTV, not path ROAS |
| **Deeper history after pay** | Paid keeps **≤24 months** of order rows so LTV / YoY-ish windows improve vs trial’s **90 closed days** | Commercial lock — do not sell “trial includes 24 months” |

**Day-30 fail:** Still a thin ROAS widget; LTV buried under densify soup; trial/paid history story lied; product asks for pixels to “unlock” value.

**Day-30 pass:** They open Mcfly on Monday for MER vs target and mid-week for “are returning dollars holding?” — without opening Sheets or Sidekick.

---

## 3. Ranked wants table

| Rank | Want | Evidence | We can show it from orders **now**? | Pretty enough to pay $39? |
| ---: | --- | --- | --- | --- |
| 1 | **Typical (median) order + timing** (weekend/hour, basket, discount share) | Community median gap; Shopify mean-skew education; buried hour/DOW reports | **Yes** — OrderFact | **Yes** if hero composition, not scoreboard soup |
| 2 | **Returning $ vs new $** (not rate) | Native rate misleads; returning-$ often plan-gated / export; agency “new vs return $” reports | **Yes** from order book + customer order counts | **Yes** as Customers / Overview hero |
| 3 | **Cash Total ROAS / MER** = Shopify sales ÷ **typed** spend | MER playbooks; Sheets reconciliation industry; TW/Polar sell path ROAS that ≠ Shopify | **Partial** — spend ledger + formula exist; **sales denom not Analytics-certified until L2** (use honest coverage / — for dark day totals; never invent QL totals) | **Yes** as chapter two — not day-1 fold |
| 4 | **Early observed LTV (30/90) + days-to-second** | Lifetimely / RCI / Peel reason-to-pay; Amp repurchase + time-lag docs | **Yes** inside trial **90d** / paid **≤24mo** — label window | **Yes** as one “Today’s read,” not 365 theater on trial |
| 5 | **Morning “up/down” sales YoY from Analytics Total Sales** | Polar “basic YoY” complaint class; Sidekick distrust | **No** as certified ShopifyQL clocks while L2 pending | **Not yet** — keep — with reason; do not fake from order-sum |
| 6 | **Returns / edits honesty on a hot day** | Operators celebrate gross that reverses; Northbeam-class revenue definition fights | **Yes** from order money fields | **Yes** as peek, not a tax app |
| 7 | **Typed channel mix / cash CPA** (where they *said* dollars went) | Allocation after MER habit | **Partial** after spend entered | **Maybe** after 1–3 hold; not the wedge |
| 8 | **Goals / plan vs actual** | Native is descriptive | **Partial** | **Maybe** — secondary |
| 9 | Deep cohort / RFM / predictive LTV / subscription churn BI | Peel / Lifetimely mid–high ASP | Shallow only | **No** at $39 vs Peel ~$499 — refuse depth |
| 10 | Path / MTA / “true ROAS” / platform ROAS parity | TW / TrueROAS / Peakmerce ($399) / AttributionApp | **No** by religion | **Trap** — different buyer |
| 11 | Sessions / conversion / traffic hero | Native Marketing + Analytics | **No** (orders ≠ sessions) | **Trap** |
| 12 | AI analyst / Sidekick clone | Sidekick hallucination threads; Profit Agent theater | **No** | **Trap** |
| 13 | Full COGS / Amazon / warehouse P&L | Lifetimely Profit / Polar | **No** | **Refuse** |

---

## 4. Wants that are traps

| Trap | Why merchants ask | Why paying Mcfly for it fails |
| --- | --- | --- |
| **Attribution / MTA / “true ROAS” / path credit** | Meta over-reports; platforms never agree ([Karbon Meta vs Shopify](https://karbonanalytics.com/blog/facebook-ads-shopify-numbers-never-match/); [TrueROAS Meta over-reporting](https://www.trueroas.com/problems/meta-over-reporting); Reddit TW bake-offs) | Never converges; invites 1-stars when ≠ Shopify; breaks religion; ASP of TW/TrueROAS/Peakmerce |
| **AI analyst answers sales questions** | Sidekick / “paste CSV into ChatGPT” workflow | Hallucination scar tissue ([r/shopify Sidekick](https://www.reddit.com/r/shopify/comments/1m4169l/be_extremely_careful_with_sidekick/)); support liability; not auditable |
| **Sessions / conversion / funnel as hero** | Marketing performance reports show sessions + ROAS together ([Shopify marketing performance](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/marketing-performance)) | Needs session schema / QL; native already owns traffic; not the order-history wedge; dilutes $39 story |

Also refuse as claims: pixel/OAuth day-one unlock, ShopifyQL / Analytics parity while L2 pending, “replaces Triple Whale,” invented Mcfly reviews/installs.

---

## 5. The one screen (if we rebuild only one)

**Overview first viewport — order-book morning desk at $0 spend.**

Composition (one job, few numbers):

1. **Median ticket** (+ Shopify average as hint)  
2. **Returning $ vs new $** from orders on file  
3. **Days-to-second** or weekend mix peek  
4. Coverage: **90 closed days** (trial) / **≤24 months** (paid) — never missing as $0  
5. Period Total Sales / Analytics YoY stay **—** until L2 (explicit “reports access” reason)  
6. **Zero** blank ROAS / spend KPI on this fold — quiet link: add spend later for Total ROAS  

**Why this screen alone:** Day-1 uninstall is Overview. OrderFact already can feed the heroes while SalesDayFact is dark (`08` Needs A/B/C). Spend / Total ROAS / deep LTV only retain if day-1 trust exists. Rebuild Customers or Spend first and strangers still bounce on a hollow home.

---

## Product lock reminder (do not drift)

| Lock | Implication for wants |
| --- | --- |
| Total ROAS = Shopify sales ÷ entered spend | Sell MER-class honesty, never path credit |
| No pixels | Day-1 must work without ads connect |
| Trial = 90 closed days · paid ≤24 months order rows | Day-30 retention = habit + deeper history, not “lifetime” lies |
| PCD L2 pending | Do not sell Analytics-identical day totals; order-book heroes carry day 1 |

---

## Source check (web + pack)

| Kind | Link / path |
| --- | --- |
| Sibling JTBD | [`02-COMPLAINTS_AND_JOBS.md`](./02-COMPLAINTS_AND_JOBS.md) |
| Sibling niche | [`03-COMPETITORS_AND_NICHE.md`](./03-COMPETITORS_AND_NICHE.md), [`08-NICHE_NEEDS.md`](./08-NICHE_NEEDS.md) |
| MER / blended | [MHI](https://mhigrowthengine.com/blog/dtc-mer-guide/), [Nuso](https://nuso.co.uk/blog/how-to-calculate-blended-mer), [Shopify MER](https://www.shopify.com/blog/marketing-efficiency-ratio), [Ad-Lab sheet](https://www.ad-lab.io/resources/templates/roas-vs-mer-reconciliation) |
| Native gaps | [Community median](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046), [returning rate](https://community.shopify.com/t/how-is-the-returning-customer-rate-calculated-in-analytics/217973) |
| LTV habit | [Lifetimely listing](https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics), [1800D2C review](https://www.1800d2c.com/review/lifetimely), Amp repurchase / time-lag docs |
| Attribution trap | [Karbon](https://karbonanalytics.com/blog/facebook-ads-shopify-numbers-never-match/), TrueROAS / Peakmerce listings |
| Mcfly listing | https://apps.shopify.com/mcfly-analytics-public · reviews **0** |

---

*End of WHAT THEY WANT. Return: path + one screen only for parent packet.*
