# Competitor deep dive — Triple Whale, Northbeam, Polar Analytics

**Purpose:** High-level product truth for Mcfly positioning. Not a feature-parity checklist.  
**Last researched:** 2026-07-21  
**Mcfly stance (locked):** cash MER + break-even + allocation; **anti–path-attribution**. Do not chase pixels, MTA theater, warehouse BI, or AI OS.

---

## One-line map

| Player | Job-to-be-done | Bet | Typical buyer |
| --- | --- | --- | --- |
| **Triple Whale** | Daily operator OS — see everything, act faster | Pixel + dashboards + **Moby AI** + activation (Sonar); Compass for “unified measurement” at top tier | Shopify DTC operators, $1M–$40M+, media buyers living in Slack |
| **Northbeam** | Defensible measurement for serious spend | First-party **MTA** + **MMM+** + **Apex** passback; rigor over convenience | High-spend DTC / omnichannel ($50K+/mo ads common), analytics-minded growth teams |
| **Polar Analytics** | Warehouse-native ecommerce BI | Dedicated **Snowflake** + semantic layer + pixel/MTA + Causal Lift + AI/MCP | Data-mature Shopify brands ($3M–$20M+), teams that want ownership + custom reports |

**Shared industry religion (all three):** “Platform ROAS lies after iOS → install *our* pixel / model → credit journeys → optimize ads / budgets.”  
**Mcfly religion:** platforms over-claim; path credit is theater; measure **ad dollars out vs Shopify sales in**.

---

## Category shape (why they look similar)

Post–iOS 14.5, DTC measurement fragmented. Three products converged on the same stack:

1. **First-party pixel / identity** (fill tracking gaps)  
2. **Multi-touch attribution models** (who “owns” the order)  
3. **Spend + Shopify + retention connectors** (one cockpit)  
4. **MMM / incrementality** (triangulate when MTA disagrees)  
5. **Passback / CAPI** (feed “truth” back into Meta/Google so algorithms optimize to *their* model)  
6. **AI chat / agents** (ask questions, automate reports, eventually act)

They compete on **who you trust when numbers disagree** — Meta Ads Manager vs their pixel vs MMM vs lift tests — and on **how much of the operating system** they own (TW wants the whole OS; Northbeam wants the measurement layer; Polar wants the data platform).

MER appears in some of their UIs, but it is **not** their product center. Some TW surfaces historically framed MER as spend÷revenue (inverse of Mcfly’s sales÷spend). Mcfly must keep the definition explicit and loud.

---

## Triple Whale

### Origin & thesis

- Founded **2021** (Columbus) by **AJ Orbach, Maxx Blank, Ivan Chernykh** — operators who wanted their internal Shopify reporting productized.  
- Shopify-backed growth story; claims **50k–60k+** brands.  
- Arc: blended dashboards → **Triple Pixel** attribution → warehouse/SQL → **Moby** AI → **Sonar** activation → **Compass** (MTA+MMM+incrementality) → **Moby 2** “AI operating system” (execute, not just report).

**Thesis:** Become the default **ecommerce OS** — measurement is table stakes; the win is *acting* (automations, creative, media, retention) on one data graph.

### Product anatomy

| Layer | What it is |
| --- | --- |
| **Triple Pixel** | First-party identity / cross-device tracking; fuel for attribution models |
| **Attribution** | First/last click on free; multi-touch models on paid (Linear, Triple Attribution, Total Impact, Clicks & Deterministic Views, etc.) |
| **BI** | Blended dashboards, custom metrics, segments, SQL editor, multi-store (higher tiers) |
| **Compass** | “Unified measurement”: MTA + MMM + incrementality, calibrated together; Enterprise / add-on narrative |
| **Moby** | Conversational + agentic AI (Slack, reports, creative, monitoring); Specialists / Automate tier |
| **Sonar** | Activation: Send (retention enrichment) + Optimize (CAPI / attribution passback) — bundled on paid plans |

### Pricing shape (public / market — verify at quote time)

Published base packages (scale with **trailing 12‑mo GMV**):

| Package | Rough public floor | Positioning |
| --- | --- | --- |
| Free | $0 | Pixel, first/last click, basic view, limited lookback |
| Foundation | ~$179–$219+/mo | Full MTA + BI + Moby as teammate + Sonar |
| Automate | ~$749+/mo | Automations, Moby Specialists, creative/ops action loops |
| Enterprise | Custom | Compass, multi-brand, security/procurement |

Independent reviews still quote older Starter/Advanced ladders (~$179 / ~$259 / custom from ~$539). **Treat GMV slider + sales quote as truth**; list prices are marketing floors.

### Strengths

- Lowest friction / largest Shopify footprint; free tier as top-of-funnel.  
- Operator UX: mobile, Slack, “Monday morning” cockpit.  
- Breadth: attribution + creative + retention hooks + AI execution ambition.  
- Price entry undercuts Polar and Northbeam for mid-market.

### Weaknesses / wedge openings

- **Complexity tax:** more surface area → more disagreement between Meta, Moby, Compass, and finance.  
- Attribution still trains teams to optimize a **model**, not cash.  
- AI OS narrative dilutes a clear single KPI religion.  
- GMV-scaled pricing gets expensive as you grow (same trap as Polar).  
- Does not own “cash MER + break-even + honest allocation” as identity.

### Who wins with TW

Media buyers and founders who want **one login** for spend/ROAS/creative/alerts and trust “good enough” attribution to move budget daily.

---

## Northbeam

### Origin & thesis

- Founded **2019** by **Austin Harrison** (media/analytics operator) + **Dan Huang** (Stanford ML / eng).  
- Series A era (~$15M, Silversmith) framed around **privacy-safe first-party measurement**.  
- Arc: rigorous MTA → view-through science → **MMM+** → **Apex** (send Northbeam signals into Meta/Axon) → automated incrementality roadmap.

**Thesis:** Be the **independent measurement authority** — not Meta’s scoreboard. When platforms disagree, Northbeam is the court of appeal. Then close the loop by pushing that court ruling back into the algorithm (**Apex**).

### Product anatomy

| Layer | What it is |
| --- | --- |
| **MTA** | First-party multi-touch; long lookback windows; creative/product analytics |
| **Clicks + Deterministic Views** | View-through + clicks tied to first-party revenue; partnered with Meta/TikTok/etc. narrative |
| **MMM+** | Browser/scenario MMM for mix, seasonality, promos, forecasting |
| **Apex** | Passback of Northbeam performance (incl. order-level) into Meta/Axon; marketed as free for customers, large ROAS lift claims |
| **Incrementality** | Lift / geo-style testing (self-serve automation marketed as expanding) |
| **Ops** | CSM-heavy onboarding, UTM discipline, iOS app, SOC 2 |

### Pricing shape (market reports — demo-quoted)

| Tier | Rough market | Fit |
| --- | --- | --- |
| Starter | ~$999–$1,500+/mo | Core MTA; spend-gated |
| Professional | ~$2,500+/mo typical | MMM+, deeper analytics |
| Enterprise | Custom | Warehouse/API, SLAs, multi-brand |

Often **annual contracts**; pricing scales with **ad spend**, not just GMV. Onboarding **2–4 weeks** calibration common in reviews. Poor fit under ~$20K–$50K/mo ad spend (models starve).

### Strengths

- Clearest “serious measurement” brand among the three.  
- Triangulation story (MTA ↔ MMM ↔ incrementality) that finance / growth leads respect.  
- Apex is a **moat narrative**: measurement that *changes* Meta delivery, not just reporting.  
- Built for complex mixes (paid social + upper funnel + sometimes offline).

### Weaknesses / wedge openings

- **Price + process:** CSM, UTMs, wait for model maturity.  
- Overkill for operators who only need “are we profitable on ads this month?”  
- Still attribution-religion: Apex optimizes platforms to *Northbeam’s* path truth.  
- Smaller review volume / less “mass Shopify OS” gravity than TW.  
- Not trying to be cheap or simple.

### Who wins with Northbeam

Brands with **large media budgets** who got burned by Meta ROAS and need a board-/finance-defensible second opinion — and will pay for it.

---

## Polar Analytics

### Origin & thesis

- Shopify-centric analytics company (Paris / EU roots in market narrative); **~2020** era product.  
- Positioned as **all-in-one data stack**: warehouse + BI + attribution + activations + AI agents.  
- Strong G2 support reputation; “you keep the Snowflake” ownership pitch.

**Thesis:** Own the **governed ecommerce data foundation** (dedicated Snowflake + semantic layer of 400+ metrics). Dashboards and AI are consumers of that layer; incrementality and CAPI are modules on top.

### Product anatomy

| Layer | What it is |
| --- | --- |
| **Data platform** | Dedicated Snowflake per customer; ~15‑min refresh narrative; history import |
| **Semantic layer** | Pre-built ecommerce metrics/dimensions; custom metrics |
| **Polar Pixel** | First-party / server-side; multi-touch models (marketing claims ~10 models) |
| **BI** | Dashboard library, alerts, scheduled reports, Ask Polar AI |
| **Causal Lift / Incrementality** | Geo/lift tests with dedicated data scientist; often **per-test** pricing |
| **Activations** | Klaviyo audience recovery; Advertising Signals (Meta/Google CAPI) |
| **Polar MCP / Headless** | Expose governed metrics to Claude/ChatGPT/agents |

### Pricing shape

| Signal | Detail |
| --- | --- |
| Shopify App Store | Core from **~$750/mo**; GMV-based |
| Market estimates | ~$720/mo near $5M GMV → ~$1.6k at $10–15M → five figures at $20M+ |
| Packaging | Core (BI + agents + activations) vs Custom (add Causal Lift, Headless MCP, extras) |
| Add-ons | Intraday refresh, SQL, Sheets mirroring, demographic enrichment |

Unlimited users/history is a sales point vs seat-limited tools.

### Strengths

- Best **data ownership / BI customization** story of the three.  
- Support quality; agency multi-brand friendliness.  
- MCP/AI-on-governed-metrics is a forward-looking platform play.  
- MER/CAC/LTV/cohorts in one warehouse-backed place (if you want breadth).

### Weaknesses / wedge openings

- **Price floor high** vs TW free/Foundation; GMV tax as you scale.  
- Still sells pixel + MTA as truth; Causal Lift is extra cost/complexity.  
- Heavier than needed for “cash MER Monday ritual.”  
- Warehouse story attracts data teams — Mcfly’s buyer is often the **operator**, not the analytics eng.

### Who wins with Polar

Brands (and agencies) that outgrew Lifetimely/Shopify Analytics, want **SQL + custom KPIs + owned warehouse**, and will pay ~1%‑of‑mindshare GMV tax for a full stack.

---

## Head-to-head (operator questions)

| Question | Triple Whale | Northbeam | Polar |
| --- | --- | --- | --- |
| “What should I do in Meta today?” | Strongest (Moby + Sonar + UX) | Strong via Apex + MTA | Good via dashboards + CAPI signals |
| “What can I defend to finance?” | Compass (top tier) | Strongest default | Strong if warehouse/SQL trusted |
| “Do we own our data?” | Export/warehouse options; vendor app first | Vendor measurement first | Strongest (dedicated Snowflake narrative) |
| “Can we start free / cheap?” | Yes | No | Rarely (~$750+) |
| “Will this replace my spreadsheet MER?” | Partially (buried among ROAS models) | No (different religion) | Partially (one metric among hundreds) |
| “Setup pain?” | Low–medium | High | Medium |

---

## What they all leave on the table (Mcfly wedge)

1. **Cash definition as product, not a tile** — sales÷spend, period-matched, auditable to Shopify + spend exports.  
2. **Break-even MER** from contribution margin — the only number that tells you if blended is healthy.  
3. **Allocation from cash + margin**, not from who won the path.  
4. **Anti-theater positioning** — refuse pixels/MTA as the roadmap center.  
5. **Price honesty** — fixed mid-market SaaS (~$79 positioning in Mcfly plan) vs GMV/spend taxes.  
6. **Sheets + Shopify** as surfaces operators already trust — not another AI OS to babysit.

**Do not compete by:** building a better Triple Pixel, cloning Compass, selling Causal Lift, or shipping Moby-like agents first.  
**Compete by:** being the boring, sharp knife for “are we making money on ads, and where should the next dollar go?”

---

## Messaging contrast (use on site / sales)

| Them | Mcfly |
| --- | --- |
| “True ROAS / true attribution” | “Cash MER — Shopify sales ÷ ad spend” |
| “7 models / Compass / Causal Lift” | “One formula. Break-even. Allocate.” |
| “AI operator for ecommerce” | “Monday ritual, not another OS” |
| “Passback to Meta” | “Don’t train Meta on theater; watch cash” |
| “Starts at $219 / $750 / $1,500” | “Serious tool, not enterprise theater pricing” |

---

## Sources & confidence

- Primary: northbeam.io (Apex, MMM+, MTA), triplewhale.com (pricing, Compass, Moby), polaranalytics.com (pricing, platform).  
- Market: SalesHive / WorkflowAutomation Northbeam reviews; Shopify App Store Polar listing; Saras / Talk Shop / Fairview / Improvado / Rule1 comparisons; TechCrunch / PR Newswire founding stories.  
- **Confidence:** High on product shape and positioning; **medium** on exact dollar quotes (all three custom/GMV/spend-scale; pages change). Re-verify before publishing competitor price claims on mcflyads.com.

---

## Agent rules

- Prefer this doc over chat lore when writing contrast copy.  
- If a prompt says “add pixel to compete with TW,” **refuse** (MASTER_PLAN §1).  
- Update this file when public packaging changes; do not expand Mcfly scope to match.
