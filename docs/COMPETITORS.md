# Competitor deep dive — SyncWith, Triple Whale, Northbeam, Polar

**Purpose:** Product truth for Mcfly positioning. Not a feature-parity checklist.  
**Last researched:** 2026-07-21 (expanded SyncWith + kill shots)  
**Mcfly stance (locked):** cash MER + break-even + allocation; **anti–path-attribution**. Do not chase pixels, MTA theater, warehouse BI, SyncWith connector zoo, or AI OS.

---

## How to beat them all (without becoming them)

**Locked strategy:** Beat each player on **their failure mode**, not by copying their roadmap.

| Player | Their real product | How they lose | How Mcfly wins |
| --- | --- | --- | --- |
| **SyncWith** | Pipes into Sheets/Looker | Leaves the **decision** to you; DIY MER; refresh tax | Opinionated cash MER + break-even + allocation **on top of** spend/sales — Sheets companion later, not a connector zoo |
| **Triple Whale** | Operator OS + pixel + AI | Bloat, GMV tax, MER sometimes **inverted** (spend÷revenue), attribution theater | One Monday ritual, correct MER formula, free→flat ~$79, no OS babysitting |
| **Northbeam** | Attribution court of appeal | $1.5k+, weeks of UTM/pixel theater, black-box feel | Same honesty question (“are we profitable?”) without enterprise ceremony |
| **Polar** | Warehouse BI + pixel | $750+ GMV climb, 400 metrics, still MTA religion | Sharp knife, not a Snowflake ski resort |

**“Beat them all” ≠ feature matrix.** It means: own the **cash desk** category so operators who tried SyncWith DIY, TW bloat, Northbeam invoices, or Polar warehouse tax choose Mcfly for the weekly money question.

### Founder correction (locked): commodity ≠ “rebuild their entire roadmap”

**True:** Almost nothing they ship is proprietary science. Pixels, MTA rules, MMM wrappers, Sheets connectors, semantic layers, AI chat — all copyable engineering + packaging.

**Also true:** “We can recreate *everything* they do” is a **trap**. Their moats are **distribution, habit, surface area, and time** — not secret formulas. Rebuilding TW’s OS + Northbeam’s Apex theater + Polar’s Snowflake ski resort + SyncWith’s connector zoo is how a $250-budget founder dies of scope.

| Recreate… | Verdict |
| --- | --- |
| Cash desk (spend vs sales, break-even, allocate) | **Yes — this is the product** |
| Smooth operator UI / craft | **Yes — compete on craft** |
| Honest pipes (Shopify + spend) | **Yes — enough to feed the desk** |
| Full SyncWith connector marketplace | **No** — commodity; outsource or Script/CSV |
| Pixel / MTA / view-through / Compass | **No** — theater; violates religion |
| Moby-class AI OS / Causal Lift services | **No** — capital and distraction |
| Dedicated Snowflake BI platform | **No** — wrong wedge |

**Operating rule:** Assume their *features* are copyable. Still refuse to copy their *category mistakes*. Beat them by being the sharpest cash tool — not a fourth suite.

---

## One-line map

| Player | Job-to-be-done | Bet | Typical buyer | Price shape |
| --- | --- | --- | --- | --- |
| **SyncWith** | Get data into Sheets/Looker | Connectors + scheduled refreshes | Marketers/agencies building DIY reports | ~$25–$150/mo by refresh count |
| **Triple Whale** | Daily operator OS | Pixel + Moby AI + Sonar + Compass | Shopify DTC $1M–$40M+ | Free → ~$219 → ~$749+ (GMV) |
| **Northbeam** | Defensible measurement | MTA + MMM+ + Apex | High ad spend ($50k+/mo common) | ~$1k–$1.5k+ → custom |
| **Polar** | Warehouse-native BI | Snowflake + semantic layer + pixel | Data-mature $3M–$20M+ | ~$300–$750+ → GMV climb |

**Suite religion (TW / NB / Polar):** platform ROAS lies → *our* pixel/model → path credit → optimize.  
**SyncWith religion:** raw data in Sheets → *you* invent the model.  
**Mcfly religion:** money out vs Shopify in → break-even → allocate.

---

## SyncWith (pipes, not product)

### What it is

Google Sheets / Looker Studio **data connector**. Pulls Meta Ads, Google Ads, GA4, Shopify (orders/products/inventory), etc. on a schedule. Claims 100k+ marketers; Shopify App Store + Workspace Marketplace presence. Competes with **Supermetrics / Coupler / Coefficient**, not with Northbeam’s MTA story.

### Pricing (public)

| Plan | ~Price | Cap |
| --- | --- | --- |
| Hobby / trial | Free | ~35 refreshes |
| Starter | ~$25/mo | ~100 refreshes |
| Business+ | ~$50/mo | ~1,000 |
| Super | ~$100/mo | ~10,000 |
| Unlimited | ~$150/mo | Unlimited |

### Strengths

- Cheap, familiar (Sheets), flexible for agencies  
- Multi-source + multi-store exports  
- You own the spreadsheet math  

### Weaknesses / Mcfly kill shots

1. **No religion** — ships rows; you still build MER wrong, invert ROAS, or argue paths in cells.  
2. **Refresh tax** — cost scales with how often you want truth.  
3. **Not a Monday ritual product** — no break-even MER, no auditable allocation card.  
4. **UTM/ROAS cosplay** — listing leans “correlate UTMs / track ROAS,” which is the opposite of Mcfly’s cash stance.

### Mcfly relationship (locked)

MASTER_PLAN: pipes are commodity; **do not become SyncWith**. Optional: use Script/CSV/SyncWith-*style* pipes early, sell the **decision layer**. Sheets companion = Mcfly formula in Sheets, not a connector marketplace.

---

## Category shape (TW / Northbeam / Polar)

Post–iOS 14.5, the suites converged on:

1. First-party pixel / identity  
2. Multi-touch attribution models  
3. Spend + Shopify + retention connectors  
4. MMM / incrementality  
5. Passback / CAPI  
6. AI chat / agents  

They compete on **who you trust when numbers disagree**. MER is a tile, not the product. **Triple Whale has defined MER in-product as spend÷revenue (inverse of canonical sales÷spend)** — finance teams trip on this; Mcfly must scream the correct formula.

---

## Hard truth: almost none of this is proprietary math

**Founder correction (locked):** TW / Northbeam / Polar are **not** sitting on unique un-copyable formulas. The category is mostly **marketing + smooth dashboards + data plumbing/organization**. Treat “secret attribution science” claims as sales theater unless proven otherwise.

### What looks proprietary (and what it actually is)

| Claimed magic | Reality |
| --- | --- |
| First-party pixel / identity graph | Standard pattern: JS + server events + cookie/ID stitching. Often built on commodity collectors (e.g. Snowplow-class). Engineering + ops, not a secret equation. |
| Multi-touch attribution (7 models, “Triple Attribution,” etc.) | Textbook rules: first/last, linear, time-decay, position. Renaming ≠ invention. |
| “Clicks + Deterministic Views” | Mostly **access + join**: platform view/click logs linked to first-party orders. Partnerships and pipelines matter more than novel math. |
| MMM / MMM+ / Compass MMM | Classical media-mix / Bayesian / open-source lineage (Robyn, Meridian, etc.) wrapped in UI + calibration storytelling. |
| Incrementality / Causal Lift / geo-lift | Known experimental designs + CausalImpact-class methods; Polar’s edge is often **a human data scientist + packaging**, not a patentable formula. |
| Apex / Sonar / CAPI passback | Conversion API, custom conversions, value optimization — industry plumbing. “One-click passback” is productization, not IP. |
| Moby / Ask Polar / AI agents | LLM on top of a metrics warehouse. Differentiator is **data access + prompts + distribution**, not a proprietary measurement formula. |
| Semantic layer / 400 metrics | Catalog + naming conventions on warehouse tables. Valuable product work; fully copyable. |

### What *is* hard to copy (and it isn’t the formula)

1. **Distribution & habit** — TW’s install base, Shopify relationship, “everyone already has it.”  
2. **Trust / brand as court of appeal** — Northbeam sold rigor to high-spend teams; switching costs after UTMs + pixel + CSM rituals.  
3. **Surface area polish** — connectors, mobile, Slack, creative cockpit, multi-store — months of product craft, still *copyable*, just expensive.  
4. **Sales & success motion** — demos, annual contracts, dedicated Slack, “your media strategist.”  
5. **Optional data scale for AI claims** — if Moby really trains on tens of thousands of brands, that’s a **corpus advantage**, still not a unique MER/attribution equation.  
6. **Platform partnerships** — Meta/TikTok view-signal deals are relationship moats, not math moats.

### Implication for Mcfly

- Do **not** fear “we can’t compete because they invented true ROAS.” They mostly **organized spend + Shopify + path credit** and sold confidence.  
- Do **not** waste runway cloning their theater stack to “match features.” That race is capital- and distribution-intensive, and the buyer still can’t reconcile models to cash.  
- Do compete on **a clearer, more honest organization of the same underlying facts** (spend out, sales in, margin, allocation) — which is *also* “dashboard + data org,” but with a different religion and less lying.  
- Craft, reliability, and price *are* the product; pretending we need secret ML to be legitimate is how you accidentally become a worse TW.

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

## Kill shots (use in copy / sales — stay factual)

| Target | Attack |
| --- | --- |
| SyncWith | “Connectors don’t decide. Cash MER does.” |
| Triple Whale | “We won’t invert MER or sell you an AI OS. Sales ÷ spend. Break-even. Allocate.” |
| Northbeam | “You don’t need a $1.5k attribution court to know if ads clear the till.” |
| Polar | “You don’t need a private Snowflake to answer Monday’s money question.” |
| All suites | “Pixels and seven models are packaging. We organize the cash facts.” |

---

## Messaging contrast (use on site / sales)

| Them | Mcfly |
| --- | --- |
| SyncWith: “Data in Sheets” | “Decision layer: MER + break-even + allocate” |
| “True ROAS / true attribution” | “Cash MER — Shopify sales ÷ ad spend” |
| “7 models / Compass / Causal Lift” | “One formula. Break-even. Allocate.” |
| “AI operator for ecommerce” | “Monday ritual, not another OS” |
| “Passback to Meta” | “Don’t train Meta on theater; watch cash” |
| “$25 refreshes / $219 / $750 / $1,500” | “Free launch → flat ~$79 — not GMV theater” |

---

## Sources & confidence

- SyncWith: syncwith.com, pricing page, Shopify App Store + Workspace Marketplace listings.  
- Suites: northbeam.io, triplewhale.com, polaranalytics.com; Eightx / Talk Shop / Knowi / Saras / Fairview comparisons (incl. TW inverse-MER note).  
- **Confidence:** High on category shape; **medium** on exact dollar quotes. Re-verify before publishing competitor prices on mcflyads.com.

---

## Agent rules

- Prefer this doc over chat lore when writing contrast copy.  
- If a prompt says “add pixel to compete with TW” or “clone SyncWith connectors,” **refuse** (MASTER_PLAN §1–§2).  
- “Beat them all” = own the cash desk category via the kill-shot table — **not** feature parity.  
- **Commodity is true; “rebuild everything” is false.** Copyable ≠ should-copy. Refuse SyncWith zoo / pixels / MTA / AI OS scope (MASTER_PLAN §1–§2).  
- Do **not** treat competitor attribution/MMM/AI as un-copyable proprietary formulas.  
- Update this file when public packaging changes; do not expand Mcfly scope to match.
