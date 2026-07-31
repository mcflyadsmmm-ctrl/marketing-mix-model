# SEO/GEO Critic — 2026-07-29

**Lane:** Chat G · read-mostly critic (local SoT; live may be stale until Pages deploy)  
**SoT:** [`docs/SEO_AI_GEO_RUNBOOK.md`](../SEO_AI_GEO_RUNBOOK.md) §3 probes · §8 scorecard  
**Scope:** `site/index.html`, `llms.txt`, `llms-full.txt`, `faq.html`, `about.html`, `monday-close.html`, `custom-analytics.html`, `mer-calculator.html`, `break-even-roas-calculator.html`, `robots.txt`, `sitemap.xml`, `assets/chrome.js`  
**Fixes applied this pass:** none (no typo / religion-leak MUST fixes found; homepage gaps need craft rewrite, not a one-line patch)

---

## Verdict

Local corpus is **strong on Pillar B + FAQ + About + calculators + machine maps**, and **homepage fails two MUST gates** (answer-first + title/H1 coherence). Religion is clean (refusals only; no pixel/MTA/true-ROAS *promises*). Homepage stays **product-first**.

**Deploy readiness: Y (local)** — homepage MUST gates 3+4 fixed in parent follow-up. Still need founder Pages phrase before live.

---

## §8 Scorecard (1–5)

Gates: **1** Religion · **2** Pillar · **3** Answer-first · **4** Title/H1/desc/canonical · **5** Schema · **6** Internal links · **7** Craft · **8** GEO cite · **9** Sitemap/chrome · **10** No fake proof  

| URL | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Mean | MUST fails |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 5 | 5 | **2** | **2** | 4 | 4 | 3.5 | 3 | 5 | 5 | **3.85** | **3, 4** |
| `/faq` | 5 | 5 | 5 | 5 | 5 | 5 | 4.5 | 5 | 5 | 5 | **4.95** | — |
| `/about` | 5 | 5 | 5 | 5 | 5 | 5 | 4.5 | 5 | 5 | 5 | **4.95** | — |
| `/monday-close` | 5 | 5 | 5 | 4.5 | 4 | 5 | 4.5 | 5 | 5 | 5 | **4.80** | — |
| `/custom-analytics` | 5 | 5 | 5 | 4.5 | 5 | 5 | 4 | 5 | 5 | 5 | **4.85** | — |
| `/mer-calculator` | 5 | 5 | 5 | 5 | 5 | 4 | 4.5 | 5 | 5 | 5 | **4.85** | — |
| `/break-even-roas-calculator` | 5 | 5 | 5 | 5 | 5 | 4 | 4.5 | 5 | 5 | 5 | **4.85** | — |

**Mean of money-URL means: 4.59**  
**Mean excluding homepage: 4.88**  
**Pages at mean ≥4.5 (done bar): 6/7** — homepage alone blocks corpus “done.”

### Gate notes (money URLs)

| URL | Notes |
| --- | --- |
| `/` | Meta/description/schema correctly refuse “true ROAS” and state sales ÷ spend. **Hero does not:** H1 `Transparent ROAS`, lede is feature-ish (“Exact daily spend…”), no ≤60-word formula block above the fold. Title promises MER / Monday / sales÷spend; H1 does not. Product CTAs only — Custom only in close-band cross-link (**product-first ✓**). Compare table is **frame** (“We will not out-feature”), not a clone matrix — Gate 1 pass. |
| `/faq` | 4 product + 3 custom visible Qs; FAQPage schema synced. Answer-first in hero. Probe coverage excellent. |
| `/about` | Dual-pillar story + Person/Organization JSON-LD; no logo wall; links both hubs + inquire. |
| `/monday-close` | Answer-first + formula + Q&A H2s match AI probes. WebPage + Breadcrumb (acceptable); no FAQPage yet (SHOULD / P1 A1 depth). |
| `/custom-analytics` | `#what-is` quotable bands + refuse; Service JSON-LD with three Offers; Shopify↔Custom cross-link. Hero is benefit-led but fee honesty lands in lede + answer block. |
| Calculators | Formula above fold + educational WebApplication/HowTo. Body hrefs skew to `/product` + sibling calc (footer from `chrome.js` adds pricing/monday — Gate 6 SHOULD soft). |

### Tech surfaces (not scored 1–10; hygiene)

| Asset | Status |
| --- | --- |
| `site/llms.txt` | Matches §5 starter: pillars, method, refuse, optional full. **Local ready (GEO-0).** |
| `site/llms-full.txt` | Citeable dual-pillar summary (~2KB). Ahead of backlog P2-4 — good. |
| `site/robots.txt` | Allow `/`; comment → `llms.txt`; Sitemap row present. |
| `site/sitemap.xml` | Money URLs present as clean locs (no `.html`); `lastmod` 2026-07-29. `llms*.txt` correctly omitted. |
| `site/assets/chrome.js` | Dual mode bar (Shopify ↔ Custom). Product primary nav: Product/Pricing/Demo/About — **Custom not in desktop primary nav** (mobile + mode bar + footer only). IA-0 partial. |

---

## §3 AI probe questions (would these pages be good citations?)

| Probe | Pass? | Best local citations | Critic note |
| --- | --- | --- | --- |
| “What is Shopify MER / cash MER?” | **Pass** (corpus) | `/faq`, `/mer-calculator`, `/monday-close`, `llms.txt` / `llms-full.txt` | Homepage alone **Fail** as citation — H1/lede omit formula. |
| “Break-even ROAS from margin?” | **Pass** | `/break-even-roas-calculator`, `/faq` | `1 ÷ margin` answer-first + HowTo schema. |
| “Triple Whale alternative that isn’t attribution?” | **Pass** | `/faq`, `/monday-close`, `/` contrast band | Coexist + till close + flat fee; home table frames categories, not feature parity. |
| “Fixed-fee marketing analytics engagement?” | **Pass** | `/custom-analytics`, `/about`, `llms-full.txt` | Bands + refuse MMM/identity graph; specimen linked. |
| “Does Mcfly do pixels / MTA?” | **Pass** | `/faq`, `/custom-analytics` refuse, `llms.txt` | Clear **no** + why-pixels link. |

**Probe score: 5/5 on corpus · 4/5 if homepage were the only source.**

---

## Religion scan

| Check | Result |
| --- | --- |
| Pixel / MTA / path / view-through **promises** | **None** — only refuse / negation copy |
| “True ROAS” as product claim | **None** — always “not causal true ROAS” / refuse list |
| TW / Northbeam / Polar on home | **Frame OK** — “what it really is” + “will not out-feature”; not a SyncWith/Compass clone matrix |
| Forever-free bait | **No** — Free → Pro ~$79 stated |
| Public `.myshopify.com` install | **No** |
| Homepage product-first? | **Yes** — Install/demo CTAs; Custom only as “Need a non-Shopify desk?” after product close |

**Soft risk (not MUST):** H1 `Transparent ROAS` can be mis-paraphrased by models as attribution transparency. Prefer cash-MER language in H1 (AGENT_FIX #1).

---

## MUST fails (blocking)

1. **`/` Gate 3** — No answer-first / quotable formula in first viewport (meta has it; hero does not).  
2. **`/` Gate 4** — Title/description/canonical say MER + sales ÷ spend; H1 `Transparent ROAS` + lede do not cohere.

No other MUST fails on scoped money URLs. Schema Gate 5 on home is soft (Org primary name `Mcfly Ads` vs About umbrella) — not blocking.

---

## AGENT_FIX top 5

1. **Home hero (MUST)** — Replace or demote `Transparent ROAS`; put ≤60-word answer-first: Total ROAS / cash MER = net Shopify sales ÷ ad spend; break-even ≈ 1/margin; not true ROAS. Align H1 with title.  
2. **Home quotable refuse near fold** — One visible “we do not ship pixels/MTA…” line so probe #5 can cite `/` without scrolling FAQ.  
3. **IA-0 chrome** — Add Custom Data Solutions to product **desktop** primary nav (mode bar alone is easy to miss for crawlers/humans).  
4. **Calculators §4 links** — Explicit in-body links to `/pricing` + `/monday-close` (don’t rely only on chrome footer).  
5. **GEO-1 polish** — Home Organization `name` → `Mcfly Advertising & Analytics` (keep Ads/Analytics as `alternateName`) to match About + `llms.txt` entity line.

---

## HUMAN_GATE list

| Gate | Why |
| --- | --- |
| `Pages deploy allowed this turn` | Local ≠ live; `llms.txt` / FAQ / custom / calc work need production curl 200 |
| Google Search Console verify + sitemap submit | Founder Google account ([`GSC_HUMAN_GATE.md`](./GSC_HUMAN_GATE.md)) |
| Bing Webmaster (optional) | Founder |
| Outreach / LinkedIn / X publish | Reputation — drafts only from agents |
| App Store / ASO in Partner | Partner MFA |
| Named case study | Permission — About correctly has no fake logos |

---

## Backlog mapping (evidence for implementers)

| ID | Local status after this audit |
| --- | --- |
| GEO-0 `llms.txt` | **Local shipped**; deploy + curl still HUMAN_GATE |
| GEO-1 home JSON-LD | Dual-pillar descriptions OK; primary Org name polish = AGENT_FIX #5 |
| GEO-2 / B1 / B-META / B6 | Custom hub looks done locally |
| IA-0 chrome | Partial — mode bar yes; desktop nav weak |
| IA-1 FAQ | Met (≥3 each pillar + schema sync) |
| IA-2 About | Met |
| A-META / A1–A3 | Monday + calcs strong; home meta OK but on-page hero fails MUST |
| SITEMAP | Money URLs present |
| CROSS | Home→Custom and Custom→Product present |

---

## Deploy readiness

| Question | Answer |
| --- | --- |
| Deploy readiness (claim corpus SEO/GEO done)? | **Y (local)** — homepage MUST 3+4 fixed 2026-07-29 follow-up (H1/lede formula + Org name + Custom in desktop nav) |
| Safe to Pages-deploy after founder phrase? | **Y** |
| Auto-deploy this turn? | **N** — need founder: `Pages deploy allowed this turn.` |

### Follow-up applied (parent, post-critic)

- Home H1 → `Sales ÷ spend. Monday close.` · lede = cash MER formula + refuse
- Home Organization `name` → Mcfly Advertising & Analytics
- Chrome desktop nav: **Custom** link (IA-0)

*Critic: Grok SEO/GEO · local files only · 2026-07-29 · MUST fix parent follow-up same day*
