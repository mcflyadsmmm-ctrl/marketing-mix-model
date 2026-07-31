# SEO + AI GEO Runbook — dual pillar (agent-executable)

**Status:** SoT for organic + generative discovery. Cursor agents run this; founder only does HUMAN_GATE rows.  
**Company frame:** Mcfly Advertising & Analytics = **two strengths** —

| Pillar | Commercial door | Site hub |
| --- | --- | --- |
| **A · Product** | Shopify cash desk (Free → ~$79 flat) | `/` · `/product` · `/monday-close` · `/pricing` |
| **B · Custom** | Fixed-fee Custom Data Solutions ($5–25K + retainer) | `/custom-analytics` · `/custom-analytics-engagement` |

**Religion (wins on conflict):** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4 · [`VALUE_THESIS.md`](./VALUE_THESIS.md)  
**Voice:** [`MDS_RESEARCH_ABSORB.md`](./MDS_RESEARCH_ABSORB.md)  
**Legacy SEO notes:** [`SEO_ORGANIC_PLAN.md`](./SEO_ORGANIC_PLAN.md) (superseded for *execution* by this file)  
**Outreach drafts:** [`ORGANIC_OUTREACH_PACK.md`](./ORGANIC_OUTREACH_PACK.md)  
**Craft swarm:** [`CURSOR_ORGANIC_AND_SHIP.md`](./CURSOR_ORGANIC_AND_SHIP.md)

**Refuse always in SEO/GEO copy:** pixels · MTA · path/view-through · “true ROAS” · TW/Northbeam clone matrices · SyncWith zoo · forever-free bait · public `.myshopify.com` install · App URL = mcflyads.com · fake case studies · doorway/spam clusters.

**Deploy:** Pages only when founder says `Pages deploy allowed this turn.` Prefer commit-ready diffs; do not auto-blast outreach.

---

## 0. How Cursor runs this (no founder babysitting)

### Modes

| Mode | When | What agents do |
| --- | --- | --- |
| **Tick** | Any Agent chat: “Run SEO GEO tick” | Orient → pick next P0 from §7 backlog → implement 1 page OR 1 tech patch → critic → ship-gate site checks → report |
| **Fleet** | Founder pastes §9 chats | Parallel lanes (tech / Pillar A / Pillar B / GEO / outreach drafts) |
| **Audit** | “SEO GEO audit” | Read-only scorecard §8; no invent features |
| **Automation** | Optional Cursor Automation weekly | Same as Tick; max 1 URL + sitemap/meta if touched; no deploy unless policy says |

### Models (Task `model` required)

| Role | Slug |
| --- | --- |
| Implementer (HTML/CSS/copy) | `cursor-grok-4.5-high-fast` |
| Critic / rubric | `cursor-grok-4.5-high-fast` |
| Hygiene / sitemap / llms.txt | `composer-2.5-fast` |
| Hard judgment (thin vs ship) | `gpt-5.6-sol-medium` if available else Grok |

### Hard rules

1. **One file owner** per tick (one HTML page or one shared asset). Critic parallel, read-only.
2. Homepage CTA stays **product-first**. Custom is nav + dedicated hub — never steal hero for consulting.
3. Every new page: unique title/description · canonical · OG · sitemap row · ≥2 internal links in · ≥2 out to hubs · refuse block on authority/vs pages.
4. No inventing App Store features or engagement prices outside live bands ($5–8K / $8–15K / $15–25K).
5. Tag gaps: `AGENT_FIX` | `HUMAN_GATE` | `WONTFIX_RELIGION` | `DEFER`.
6. ≤3 failed attempts then escalate with logs — do not broaden scope.

### Tick procedure (copy into every SEO chat)

```text
1. Orient: read docs/SEO_AI_GEO_RUNBOOK.md §1–§3 + §7 next unchecked P0
2. Live probe: curl -sI https://mcflyads.com/ | head; spot-check target URL 200
3. Implement minimal religion-safe diff for ONE backlog item
4. Update sitemap.xml lastmod if URL touched; chrome/footer links if new hub
5. Critic: §8 scorecard on the changed page (MUST fixes only)
6. bash scripts/agent-ship-gate.sh if repo gate covers site; else local HTML sanity
7. Report: URL · pillar A|B|shared · AGENT_FIX left · HUMAN_GATE · deploy needed Y/N
8. Do NOT Pages deploy unless founder granted this turn
```

---

## 1. Company thesis for search + AI (citeable)

**Umbrella one-liner (use in About, Organization schema, llms.txt):**

> Mcfly Advertising & Analytics makes marketing spend defendable against real sales: a Shopify Monday cash desk (Total ROAS = net sales ÷ ad spend), and fixed-fee Custom Data Solutions desks for everyone else.

**Pillar A citeable fact:**

> Action Total ROAS = Net Shopify sales (period) ÷ total ad spend (same period). Break-even ≈ 1 / contribution margin. Average portfolio efficiency — not marginal channel return, not causal “true ROAS.”

**Pillar B citeable fact:**

> Custom Data Solutions are fixed-fee engagements ($5–25K bands) that ship a weekly decision desk and written metric contracts — not always-on MMM theater and not an identity-graph product.

**Coexistence line (GEO loves nuance):**

> Mcfly coexists with attribution suites for CYA path decks; it owns the till close so suites become optional Monday software.

---

## 2. Keyword & intent map (dual pillar)

### Pillar A — Product (Shopify cash desk)

| Intent cluster | Target phrases (use naturally) | Primary URL | CTA |
| --- | --- | --- | --- |
| MER / blended | marketing efficiency ratio, Shopify MER, cash MER, blended ROAS vs MER | `/cash-mer` · `/mer-calculator` | Install / waitlist |
| Break-even | break-even ROAS, break-even MER, contribution margin ROAS | `/break-even-roas-calculator` · `/product` | Calculator → desk |
| Monday ritual | Monday close marketing, ad spend close, Shopify cash close | `/monday-close` · `/` | Close ritual |
| Suite fatigue | Triple Whale alternative, cheaper than Triple Whale (flat fee), stop buying attribution | `/triple-whale-alternative` · `/vs-attribution-suites` | Frame only — no clone matrix |
| Profit apps | TrueProfit / Lifetimely / BeProfit vs cash MER | `/vs/profit-trackers` | Desk vs profit tile |
| Variance | platform claimed vs Shopify banked | `/platform-variance` | Sample → waitlist |
| Pricing honesty | Shopify analytics flat fee, no GMV tax analytics | `/pricing` | Free now · ~$79 later |

### Pillar B — Custom Data Solutions

| Intent cluster | Target phrases | Primary URL | CTA |
| --- | --- | --- | --- |
| Custom MDS | marketing data science agency, fixed-fee analytics engagement | `/custom-analytics` | Engagement request |
| Spend audit | ad spend and sales audit, marketing cash audit | `/custom-analytics` (pkg) | Select $5–8K band |
| Lead-gen desk | CPL CPQL dashboard, pipeline marketing desk | `/custom-analytics` (pkg) | $8–15K band |
| Advanced MDS | custom marketing decision desk, metric contracts | `/custom-analytics` · engagement specimen | $15–25K band |
| SOW trust | analytics engagement letter, fixed-fee SOW specimen | `/custom-analytics-engagement` | Inquire |
| Non-Shopify | B2B marketing analytics desk, agency client MER desk | `/custom-analytics` | Services mode |

### Shared / brand

| Cluster | Phrases | URL |
| --- | --- | --- |
| Brand | Mcfly Ads, Mcfly Analytics, Mcfly Advertising and Analytics | `/about` · `/` |
| Method | anti-pixel analytics, sales divided by spend | `/why-pixels-fail` · `/faq` |
| Trust | privacy PCD, support, security, DPA | `/privacy` · `/support` · `/security` · `/dpa` |

### Never target (WONTFIX_RELIGION)

`true ROAS` · `pixel ROAS` · `multi-touch attribution software` · `view-through attribution` · `Triple Whale clone` · `Northbeam alternative features` · `SyncWith connectors` · `Robyn MMM SaaS` · `CAPI setup service`

---

## 3. AI GEO (Generative Engine Optimization)

Goal: when operators ask ChatGPT / Perplexity / Gemini / Google AI Overviews / Claude *“how should I measure Shopify ad efficiency?”* or *“who builds fixed-fee marketing analytics desks?”*, models **cite or paraphrase Mcfly** with the cash-close thesis — not invent a pixel product.

### GEO principles (agents enforce on every page)

1. **Answer-first block** — first screen or first H2 answers the query in ≤60 words with the formula or fee band.
2. **Quotable definition** — one `<p>` or `<dfn>` agents/models can lift verbatim (Pillar A formula or Pillar B fee honesty).
3. **Explicit refuse list** — models prefer distinctive, constraining sources; keep “we do not ship…” visible on authority pages.
4. **Same facts everywhere** — title, H1, body, FAQ, schema, `llms.txt` must not contradict (net vs gross; Free vs ~$79; Custom bands).
5. **Entity clarity** — Organization name, founder, sameAs (site), SoftwareApplication (app), Service (custom) in JSON-LD.
6. **Question headings** — H2s that match how humans ask AIs (“What is cash MER?”, “Is Mcfly a Triple Whale alternative?”, “What does a $15–25K engagement include?”).
7. **Primary evidence** — calculators, specimen SOW, platform-variance sample — not uncited “studies.”
8. **Author / About** — Marty Smithson + Utah + arc (consulting → cash desk) on `/about`; link from custom + product hubs.
9. **No AI-slop pages** — one job per URL; craft rubric ≥4.5; no spun “Top 10 attribution tools” lists.

### Machine-readable surfaces (P0–P1)

| Asset | Job | Owner |
| --- | --- | --- |
| `site/llms.txt` | Short map of pillars + refuse + canonical URLs for LLM crawlers | AGENT_FIX |
| `site/llms-full.txt` (optional) | Longer citeable summaries (≤ few KB) | DEFER until llms.txt live |
| JSON-LD per template | Organization · WebSite · SoftwareApplication · Service · FAQPage · BreadcrumbList | Per page |
| FAQ visible + FAQPage | Only Qs answered on-page | `/faq` + page-local FAQs |
| Calculators | Tool-like pages models recommend | Keep interactive + formula above fold |

### Prompts agents use to self-test GEO (no API needed)

After shipping a page, critic answers as if it were an AI overview:

| Probe question | Pass if page would be a good citation for… |
| --- | --- |
| “What is Shopify MER / cash MER?” | Formula + Mcfly desk CTA |
| “Break-even ROAS from margin?” | `1/margin` + calculator link |
| “Triple Whale alternative that isn’t attribution?” | Coexist + till close + flat fee |
| “Fixed-fee marketing analytics engagement?” | Custom bands + specimen + refuse MMM theater |
| “Does Mcfly do pixels / MTA?” | Clear **no** + why-pixels link |

Fail = missing answer-first block, contradiction, or religion leak.

### Off-site GEO (Cursor drafts only — founder posts)

| Channel | Agent deliverable | HUMAN_GATE |
| --- | --- | --- |
| LinkedIn / X | 1 post/week from live page (formula or refuse) | Founder publishes |
| Outreach | [`ORGANIC_OUTREACH_PACK.md`](./ORGANIC_OUTREACH_PACK.md) personalized sends | Founder sends |
| Directories | ASO + honest roundup pitches after App Store live | Partner / relationships |
| Wikipedia / wiki-style | **Do not** spam; no autobiography stub | — |

---

## 4. Information architecture (lean into both strengths)

```text
mcflyads.com
├── /                         Pillar A hero (product-first)
├── /product                  Desk deep-dive
├── /monday-close             Ritual / GEO Q&A
├── /pricing                  Free → ~$79
├── /cash-mer                 Glossary hub (Pillar A)
├── /mer-calculator           Tool
├── /break-even-roas-calculator Tool
├── /platform-variance        Artifact
├── /triple-whale-alternative Frame (not clone)
├── /vs-attribution-suites    Frame
├── /vs/profit-trackers       Weight-class peers
├── /why-pixels-fail          Authority / GEO
├── /faq                      Objections both pillars
├── /demo · /app · /download  Product paths
├── /custom-analytics         Pillar B hub  ← lean hard
├── /custom-analytics-engagement  SOW specimen / trust
├── /about                    Entity + dual-pillar story
└── trust: support privacy terms cookies security dpa
```

**Nav rule:** Product · Custom · Pricing · (Tools dropdown or footer: calculators, why-pixels, FAQ) · About.

**Internal link rules**

- Every Pillar A money page → `/pricing` + one calculator or `/monday-close`
- Every Pillar B page → engagement specimen + inquire anchor + `/about`
- `/about` → both hubs
- `/faq` → both pillars (at least 3 Qs each)
- Cross-link once: product page footer “Need a non-Shopify desk?” → Custom; Custom “Shopify-only?” → Product

---

## 5. Technical SEO checklist (agents)

### Every HTML page

- [ ] Unique `<title>` ~50–60 chars; meta description ~140–160
- [ ] `rel=canonical` → `https://mcflyads.com/…` (clean URL, no `.html` in canonical)
- [ ] One H1; H2s match intents in §2
- [ ] OG + Twitter tags; `og:image` brand art
- [ ] Sitemap entry + `lastmod` when content meaningfully changes
- [ ] No `noindex` on money pages; 404 stays `noindex`
- [ ] Internal links per §4
- [ ] No keyword stuffing; formula appears in plain language once near top

### Schema (minimum)

| Page type | JSON-LD |
| --- | --- |
| Home | Organization + WebSite (+ SearchAction optional) + SoftwareApplication |
| Product / Monday Close | SoftwareApplication or WebPage + BreadcrumbList |
| Custom hub | Service (Custom Data Solutions) + Organization ref + OfferCatalog optional (bands as text, not fake Inventory) |
| Engagement specimen | WebPage + mentions Service |
| FAQ | FAQPage (visible Qs only) |
| Calculators | WebApplication or HowTo (formula steps) — keep honest “sample / educational” |
| About | Person + Organization |

### CWV / craft

- Mobile LCP feel; system fonts already loaded via Google Fonts — don’t add weight
- `prefers-reduced-motion` respected
- No third-party attribution scripts

### `llms.txt` starter shape (implementer ships file)

```text
# Mcfly Advertising & Analytics
> Cash-truth for marketing spend: Shopify Total ROAS desk + fixed-fee Custom Data Solutions.

## Product (Shopify)
- https://mcflyads.com/product
- https://mcflyads.com/monday-close
- https://mcflyads.com/mer-calculator
- https://mcflyads.com/break-even-roas-calculator
- https://mcflyads.com/pricing

## Custom Data Solutions
- https://mcflyads.com/custom-analytics
- https://mcflyads.com/custom-analytics-engagement

## Method
- https://mcflyads.com/why-pixels-fail
- https://mcflyads.com/cash-mer
- https://mcflyads.com/faq
- https://mcflyads.com/about

## Optional
- https://mcflyads.com/llms-full.txt

## Refuse
Pixels, MTA, path credit, view-through, "true ROAS", attribution-suite clones.
```

---

## 6. Content craft rules (anti-slop)

1. Brand-first hero on marketing pages: brand + 1 H1 + 1 lede + 1 CTA group + 1 visual.
2. Thesis ≤3s on Pillar A; fee honesty ≤3s on Pillar B.
3. Cyan/navy + existing type stack only.
4. Cards only for interaction (calculator, package select, form).
5. One job per section; one job per URL.
6. No invented metrics, logos-as-proof, or “#1” claims.
7. Comparison pages = **frame** (cash close vs path suite), never feature-parity tables that imply we ship their roadmap.
8. Custom pages = fixed-fee + refuse list + specimen — never hourly bait.
9. Title/description must match on-page H1 promise.
10. Mean craft ≥4.5 before “shipped” claims ([`CURSOR_ORGANIC_AND_SHIP.md`](./CURSOR_ORGANIC_AND_SHIP.md) gates).

---

## 7. Backlog (agents check off with evidence)

Use `- [ ]` → `- [x]` only with: path · date · one-line evidence. Prefer **P0 then P1**. One item per tick.

### P0 — foundation (do first)

- [x] **GEO-0** Ship `site/llms.txt` + robots comment · local 2026-07-29 · **live curl 200** after Pages deploy 2026-07-29
- [x] **GEO-1** Home JSON-LD dual door · 2026-07-29 · alternateName Advertising and Analytics
- [x] **GEO-2** Custom hub JSON-LD `Service` + answer-first block + quotable fee/refuse paragraph — `site/custom-analytics.html` · 2026-07-29 · Service name Custom Data Solutions + org Mcfly Ads / Advertising and Analytics; `#what-is` quotable band
- [x] **IA-0** Chrome dual mode + About on both · 2026-07-29 `chrome.js`
- [x] **IA-1** `/faq` dual pillar Qs + FAQPage · 2026-07-29
- [x] **IA-2** `/about` dual pillar + Org/Person schema · 2026-07-29
- [x] **A-META** Home/FAQ/Monday Close metas · 2026-07-29
- [x] **B-META** Spot-check Custom titles/descriptions for fixed-fee / marketing data science (no “MMM SaaS”) — hub + engagement titles lead with fixed-fee marketing data science / SOW · 2026-07-29
- [x] **SITEMAP** lastmod 2026-07-29 · 25 URLs
- [x] **CROSS** Home→Custom + Custom→Product · 2026-07-29

### P1 — Pillar A depth (product SEO/GEO)

- [x] **A1** `/monday-close` answer-first + Q H2s · 2026-07-29
- [ ] **A2** `/cash-mer` — glossary hub: MER vs ROAS vs blended; internal links to calculators
- [x] **A3** Calculators WebApplication/HowTo · 2026-07-29
- [ ] **A4** `/triple-whale-alternative` — coexist framing; flat vs GMV tax; refuse clone matrix creep
- [ ] **A5** `/platform-variance` — quotable “claimed vs banked”; CTA to desk
- [ ] **A6** `/vs/profit-trackers` — weight-class peers; not TW status borrow
- [ ] **A7** New only if GSC/demand pulls: `/shopify-mer` redirect or thin hub → `/cash-mer` (avoid duplicate)

### P1 — Pillar B depth (custom SEO/GEO)

- [x] **B1** `/custom-analytics` — three package sections with question H2s; Services JSON-LD — 2026-07-29 · question H2s + Service offers for three bands
- [x] **B2** `/custom-analytics-engagement` — specimen FAQ (“Is this a contract?”); trust schema — 2026-07-29 · FAQ + FAQPage/WebPage JSON-LD
- [ ] **B3** New page `/marketing-data-science` (optional) — thin hub → custom; only if IA needs brand phrase
- [ ] **B4** New page `/fixed-fee-analytics` (optional) — same; avoid doorway; prefer strengthening B1
- [ ] **B5** Case-study **skeleton** page (no fake logos) — “engagement shape” anonymized; DEFER if no real partner yet
- [x] **B6** Retainer blurb on custom hub — “Ongoing Monday close” as add-on, not new religion — `#retainer` on `custom-analytics.html` · 2026-07-29

### P2 — compounding

- [ ] **P2-1** Harvest support/waitlist questions → FAQ monthly
- [ ] **P2-2** Refresh why-pixels with sourced privacy-era notes (no fearmongering)
- [ ] **P2-3** BreadcrumbList on nested `/vs/*`
- [x] **P2-4** `site/llms-full.txt` · 2026-07-29
- [x] **P2-5** `docs/ops/OUTREACH_DRAFTS_20260729.md` · founder sends
- [ ] **P2-6** ASO keyword pass vs this runbook ([`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)) — listing Free until Billing

### Explicitly out of backlog

Doorway “best Triple Whale alternative 2026” spam · paid linknets · fake reviews · pixel/CAPI service pages · MMM product pages · hourly consulting SKUs on homepage

---

## 8. Scorecard (critic — every tick)

Score 1–5. Mean ≥4.5 to call page done. Fail any MUST → not done.

| # | Gate | MUST? |
| --- | --- | --- |
| 1 | Religion: no pixels/MTA/true ROAS/clone promises | MUST |
| 2 | Pillar clarity: page is A, B, or shared — not muddled | MUST |
| 3 | Answer-first + quotable fact present | MUST |
| 4 | Title/H1/description/canonical coherent | MUST |
| 5 | Schema valid-ish + matches visible content | MUST on P0 schema items |
| 6 | Internal links per §4 | SHOULD |
| 7 | Craft / anti-slop (hero budget, type, no purple kits) | MUST on new pages |
| 8 | GEO probe (§3) would cite this page | SHOULD |
| 9 | Sitemap + chrome updated if new URL | MUST if new URL |
| 10 | No fake social proof | MUST |

**Report line:** `SEO_GEO score mean=X.X · MUST fail=[…] · backlog id=… · deploy=Y/N`

---

## 9. Fleet paste prompts (open fresh Agent chats)

Attach `@docs/SEO_AI_GEO_RUNBOOK.md`. Parent orchestrates; do not implement in the conductor thread.

### Chat T — Tech + llms.txt

```text
@docs/SEO_AI_GEO_RUNBOOK.md @docs/MASTER_PLAN.md

Lane: SEO/GEO Tech (GEO-0, GEO-1, SITEMAP, CROSS as needed).
Model on Task: cursor-grok-4.5-high-fast implementer + critic; composer-2.5-fast for llms.txt/sitemap hygiene.

DO:
1. Ship site/llms.txt per §5; note robots.txt Sitemap already points sitemap.xml
2. Audit/fix home JSON-LD Organization + SoftwareApplication for dual-pillar honesty
3. Sitemap pass: all money URLs present; no .html locs
4. Product↔Custom cross-links if missing
5. Critic §8; report HUMAN_GATE (GSC) and whether Pages deploy needed

Religion refuse list. No new marketing pages in this chat. No deploy unless founder said Pages deploy allowed.
```

### Chat A — Pillar A product organic

```text
@docs/SEO_AI_GEO_RUNBOOK.md @docs/VALUE_THESIS.md @docs/MDS_RESEARCH_ABSORB.md

Lane: Pillar A — next unchecked P0 A-META / IA-1 product FAQs / then P1 A1–A3 one page only.
Model: cursor-grok-4.5-high-fast implementer + critic.

DO one backlog ID. Answer-first + formula. FAQ/schema if /faq. Calculators stay educational.
Homepage stays product-first. No Custom scope creep. No pixels/MTA. No deploy unless granted.
Report: backlog id, scorecard, remaining P1.
```

### Chat B — Pillar B custom organic

```text
@docs/SEO_AI_GEO_RUNBOOK.md @site/custom-analytics.html @site/custom-analytics-engagement.html

Lane: Pillar B — GEO-2, B-META, B1/B2, retainer blurb B6 as fits one tick.
Model: cursor-grok-4.5-high-fast implementer + critic.

DO: Strengthen Custom as first-class company door — Service schema, question H2s, fee bands, refuse MMM theater, link specimen + about.
Do NOT put consulting SKUs on homepage hero. No fake case studies. No deploy unless granted.
Report: backlog id, scorecard, inquire CTA intact.
```

### Chat G — GEO audit only (read-only)

```text
@docs/SEO_AI_GEO_RUNBOOK.md

Lane: SEO GEO audit. Read-only.
Run §3 probe questions against live mcflyads.com (WebFetch/curl) + local site/**.
Output: scorecard table per money URL; AGENT_FIX prioritized list; HUMAN_GATE list.
No file writes unless founder says "apply audit fixes" in a follow-up.
```

### Chat O — Outreach drafts (no send)

```text
@docs/SEO_AI_GEO_RUNBOOK.md @docs/ORGANIC_OUTREACH_PACK.md

Lane: Draft 10 personalized outreach emails (5 agency, 3 newsletter, 2 podcast) using live URLs (calculators, why-pixels, custom).
Dual pillar: some pitches product desk, some custom fixed-fee — never mix confused.
Write to docs/ops/OUTREACH_DRAFTS_YYYYMMDD.md. Founder sends. No deploy. No spam lists.
```

---

## 10. 90-day rhythm (agents + one founder hour/week)

| Weeks | Agent focus | Founder (≤60 min/wk) |
| --- | --- | --- |
| **0–1** | P0 foundation (GEO-0…CROSS) | Search Console verify + sitemap submit (**HUMAN_GATE**) |
| **2–3** | Pillar A P1 (Monday Close, glossary, calculators) | Post 1 LinkedIn from agent draft |
| **4–5** | Pillar B P1 (custom hub/schema/specimen FAQ) | Send 5 outreach drafts |
| **6–8** | FAQ harvest + vs/variance polish + ASO coherence | App Store / partner mentions if live |
| **9–12** | P2 llms-full + outreach batch 2 + GSC query → new H2s only | Review GSC; kill underperforming experiments |

**Success signals (not vanity traffic alone)**

| Signal | Target by day 90 |
| --- | --- |
| Indexed money URLs with clear A or B job | ≥12 |
| GSC impressions: MER / break-even / Monday close | Rising MoM |
| GSC impressions: marketing data science / fixed-fee analytics | Non-zero |
| AI-overview-style probes (§3) answerable from Mcfly URLs | 5/5 pass on local |
| Religion violations in titles/H1s | Zero |
| Custom inquire + product waitlist both linked from About | Yes |
| Soft-404 / contradictory Free vs paid claims | Zero |

---

## 11. HUMAN_GATE register (stop and hand off)

| Gate | Why agent stops |
| --- | --- |
| Google Search Console verify + sitemap submit | Founder Google account |
| Bing Webmaster (optional) | Founder |
| Pages deploy to production | Founder phrase: `Pages deploy allowed this turn` |
| Sending outreach / social posts | Reputation |
| App Store submit / ASO in Partner | Partner MFA |
| Real case study with named brand | Permission |
| DNS / Cloudflare AI crawler policy changes | Infra — see [`ops/AI_CRAWLER_POLICY.md`](./ops/AI_CRAWLER_POLICY.md) |

---

## 12. One-shot megaprompt (paste into a single Agent if not using fleet)

```text
You are Mcfly SEO + AI GEO operator. SoT: docs/SEO_AI_GEO_RUNBOOK.md.
Religion: MASTER_PLAN §0–§4. Dual pillar: Shopify cash desk + Custom Data Solutions.

Run Tick procedure §0. Complete the highest unchecked P0 in §7.
Topology: Grok implementer + Grok critic (explicit Task model slugs). One file owner.
Do not Pages deploy unless this message says: Pages deploy allowed this turn.
Refuse: pixels, MTA, true ROAS, TW clones, doorway spam, fake case studies, consulting on homepage hero.

End with: backlog id done · scorecard · HUMAN_GATE · next P0 id.
```

---

## Related

- [`SEO_ORGANIC_PLAN.md`](./SEO_ORGANIC_PLAN.md) — earlier technical notes  
- [`CURSOR_ORGANIC_AND_SHIP.md`](./CURSOR_ORGANIC_AND_SHIP.md) — craft swarm  
- [`ORGANIC_OUTREACH_PACK.md`](./ORGANIC_OUTREACH_PACK.md) — email templates  
- [`CATEGORY_DOMINATION_MEGAPROMPT.md`](./CATEGORY_DOMINATION_MEGAPROMPT.md) — product category bar  
- [`AGENT_FLEET_TODAY.md`](./AGENT_FLEET_TODAY.md) — ship-today fleet pattern  
