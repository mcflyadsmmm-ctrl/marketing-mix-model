# Competitive App Store gap audit — Mcfly Analytics (B3)

**Megaprompt:** [`MEGAPROMPT_SHIP_AUDIT.md`](./MEGAPROMPT_SHIP_AUDIT.md) §B3  
**Researched:** 2026-07-23 (App Store listings + vendor pages + repo SoT)  
**Religion:** cash MER = Shopify sales ÷ ad spend; break-even from margin; rules-based allocation. **No pixels / MTA / path credit / “true ROAS” / TW clones.**  
**Purpose:** Listing craft, time-to-first-value, trust packaging, pricing honesty, screenshot quality, install friction — **not** feature parity.  
**Companions:** [`INDUSTRY_LEADERS.md`](./INDUSTRY_LEADERS.md) · [`COMPETITORS.md`](./COMPETITORS.md) · [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) · [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md)

Every gap is tagged: **AGENT_FIX** | **HUMAN_GATE** | **WONTFIX_RELIGION** | **DEFER_POST_SUBMIT**.

---

## 1. Leader table (App Store signals that matter)

| App | Job sold (listing voice) | Price shape (App Store) | App Store signals (craft / trust) | Mcfly kill shot |
| --- | --- | --- | --- | --- |
| **Triple Whale** | “AI operating system for ecommerce” — pixel + Moby + Compass | **Free plan available**; Foundation ~$219; Automate ~$749; **External charges** may bill outside Shopify; GMV-scaled | ~**4.1★ / 86 reviews** (noisy 1★ cluster); **View demo store**; Works-with logos; Featured-in Shopify guides; gallery thin vs profit apps; install ≈ one click then pixel onboarding | “We won’t invert MER or sell you an AI OS. Sales ÷ spend. Break-even. Allocate — Free listing, flat later.” |
| **TrueProfit** | Instant **net profit** autopilot — COGS + fees + ad sync | **From $35/mo** + order overage; **14-day trial** on every tier | **5.0★ / ~799 reviews** (trust juggernaut); 8+ gallery shots; “Popular with stores like yours”; multi-language; Featured-in guides; aggressive support replies | “40 cost tiles ≠ Monday’s money question. Mcfly is one desk: cash MER, break-even, next dollar — no pixel, no order tax.” |
| **BeProfit** | Real-time P&L across shops / products / countries | **From $49/mo**; trial; order caps → Unlimited | **4.3★ / ~172**; **View demo store**; 6+ gallery; Works-with ad logos; cancel/billing 1★ risk visible | “Report sprawl + UTM later. Mcfly ships the allocation call, not a second BI zoo.” |
| **Lifetimely** | **AI Profit Agent** + LTV / cohorts | **Free to install** (≤50 orders) → $79 / $149 / $299 by orders | **4.9★ / ~459**; Free entry; heavy **PCD** (email, address, pixels in data access); Slack agent narrative | “Lifetimely predicts customer worth someday. Mcfly answers what ads did **this week** — no customer CRM on first listing.” |
| **Metorik** | True profit + 500+ filters / exports | **From $25/mo** order tiers | Smaller review base (~47); “trusted dashboard” voice; BI density | “Analyst filters ≠ cash ritual. Mcfly is the decision layer, not a slice engine.” |
| **Polar** | Warehouse BI + MER tile + **server-side pixel** | **From $750/mo** GMV; **External charges** | **4.9★ / ~101**; demo store; premium gallery; Works-with breadth | “You don’t need a private Snowflake (or a pixel) to answer Monday’s money question.” |
| **CashDash** | Multi-region profit — MER / CM / CPA | **$5.99/mo** + trial | Niche / thin review count; MER-adjacent commodity pricing | “Cheap MER tile without break-even + allocation is a calculator. Mcfly is the Monday ritual.” |
| **Bloom** | True profit + **multitouch** attribution creeping in | **From $20/mo** | Commodity profit + MTA ladder | “Profit apps that bolt on MTA become TW-lite. We refuse the bolt-on.” |
| **Kipify** | KPI screen: MER / blended ROAS / AI analyst | Free → $35 / $150 / $290 | MER as one KPI among inventory/AI | “MER as a tile in a KPI zoo. Mcfly makes cash MER the product.” |

### Collective App Store craft pattern (what actually converts)

Leaders win installs with:

1. **Outcome-first gallery** (hero metric in shot 1 — profit / LTV / OS cockpit, not Settings)  
2. **Social proof density** (hundreds of reviews + Featured-in + “Popular with stores like yours”)  
3. **Low install friction** (Free / Free to install / 14-day trial; one-click Install; optional **View demo store**)  
4. **Trust packaging on the listing** (Works-with logos, languages, developer address, changelog age, support replies to 1★)  
5. **Pricing clarity on the card** (“From $X” or “Free plan available”) — even when the *real* bill is GMV/order-taxed later  
6. **TTFV story** implied by copy: “auto-sync ads / real-time / autopilot” (their religion)  

Mcfly’s equivalent weapons (religion-safe): **Free listing**, formula honesty, CSV-in-10-minutes, break-even + allocation as shot 4, minimal PCD, flat ~$79 later — **if** trust URLs and shots match the listing.

---

## 2. Ranked Mcfly gaps (APPROVAL + first-week retention)

Ranked by impact on **Shopify approval** and **week-1 “I got a trusted MER”**, not vanity feature score.

| Rank | Gap | Why it hurts | Tag |
| --- | --- | --- | --- |
| 1 | **Live trust URLs lag** — `mcflyads.com/support` still Partner-invite / “listing comes after”; `/pricing` soft-launch; `/privacy` omits `numberOfOrders` | Reviewer opens listing Website / Privacy / Support → contradicts **Free** public App Store + PCD answers → delay/reject | **HUMAN_GATE** (Cloudflare Pages publish; local already Fixed) |
| 2 | **Listing screenshots not uploaded** (5 unique Admin shots) | Leaders convert on galleries; empty/duplicate/marketing-site shots fail App Store 4.4.x | **HUMAN_GATE** (pack ready in [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md)) |
| 3 | **Partner Distribution / PCD / install smoke / Submit** not closed | Cannot be public-listed or reviewed | **HUMAN_GATE** ([`SUBMIT_NOW.md`](./SUBMIT_NOW.md)) |
| 4 | **Homepage primary CTA still waitlist / early access** while listing draft = Free App Store | After listing goes live, site→listing journey feels invite-only → bounce / “is this real?” | **AGENT_FIX** (`site/index.html` + CTA bands; keep no shop-domain form) |
| 5 | **Brand dual-name** — site “Mcfly Ads” vs listing “Mcfly Analytics” | Trust friction for reviewers & merchants comparing Privacy/Support titles to app name | **AGENT_FIX** (docs + site titles: keep product name **Mcfly Analytics** on trust pages; Ads as brand lockup OK) |
| 6 | **Shot 1 vs Shot 2 similarity risk** (same desk, Y3 vs YTD) | Shopify rejects near-duplicate screenshots/captions (4.4.4 / 4.4.5); leaders show distinct outcome → setup → depth | **AGENT_FIX** ([`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) — differentiate shot 2 composition/caption) |
| 7 | **TTFV perception vs auto-sync leaders** | TrueProfit/TW imply “numbers appear.” CSV-first is honest but needs a **&lt;10 min ritual** story in listing + empty-state / Demo path so week-1 retention doesn’t die on blank spend | **AGENT_FIX** (listing “First 10 minutes” + reviewer notes; empty-state copy only if clear bug — prefer docs) |
| 8 | **Stale reject-audit rows** still claim support meta “Invite-only” | Local `site/support.html` meta already Free App Store — audit noise steers agents into circles | **AGENT_FIX** ([`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md), [`SUBMIT_TOMORROW.md`](./SUBMIT_TOMORROW.md)) |
| 9 | **Partner listing field completeness** (Works with, languages, category exact, demo store?) | Leaders pack signal density; incomplete Partner fields look unfinished next to TrueProfit/Lifetimely | **AGENT_FIX** ([`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) — add paste checklist) |
| 10 | **Canonical/OG URLs use `.html`** on trust pages while listing prefers extensionless | Minor trust/SEO inconsistency once Pages is live | **AGENT_FIX** (`site/support.html`, `pricing.html`, `privacy.html`, `terms.html`) |
| 11 | **Zero reviews / no Featured-in / no demo store** | Cold-start vs 4.9★ / 459–799 review machines | **DEFER_POST_SUBMIT** (earn reviews; optional demo store later) |
| 12 | **No Meta/Google OAuth spend auto-sync on listing** | Leaders advertise “Works with Facebook/Google” | **WONTFIX_RELIGION** for v1 spine (CSV-first); optional pipes later without becoming SyncWith |
| 13 | **No pixel / MTA / LTV / AI OS on listing** | Category defaults expect them | **WONTFIX_RELIGION** |
| 14 | **Order-volume / GMV pricing theater** | Competitors use it as App Store card signal | **WONTFIX_RELIGION** (flat Free → ~$79) |
| 15 | **Customer PII LTV / cohort depth** | Lifetimely/BeProfit/TrueProfit sell it; heavier PCD | **WONTFIX_RELIGION** on first listing (Scale later per INDUSTRY_LEADERS) |
| 16 | **Support reply theater on App Store reviews** | Leaders reply to every 1★ within days | **DEFER_POST_SUBMIT** (process after public reviews exist) |
| 17 | **In-app video / App Store media beyond 5 PNGs** | Polar/TrueProfit depth galleries | **DEFER_POST_SUBMIT** |
| 18 | **Built for Shopify badge** | Credibility signal | **DEFER_POST_SUBMIT** (~50 paid installs + 5 reviews — listing already says so) |

**Approval verdict (competitive lens):** Mcfly is **not blocked by missing TW features**. It **is** blocked by human gates (Pages + shots + Partner) and a few **listing/site honesty** AGENT_FIX items that make Free + PCD read as one story.

---

## 3. Explicit WONTFIX list (religion)

Do **not** open tickets for these even if App Store leaders have them:

| Temptation | Why WONTFIX |
| --- | --- |
| Triple Pixel / Polar Pixel / TrueProfit Pixel / Bloom MTA | Theater; MASTER_PLAN §1–§2 |
| Path / view-through / “true ROAS” / Compass / Causal Lift | Attribution religion |
| Moby-class AI OS / Profit Agent as identity | Dilutes cash desk |
| SyncWith-style connector zoo as product | Commodity pipes; recommend externally |
| GMV / spend / order-volume tax pricing | Industry failure mode; Mcfly = flat |
| Customer PII LTV / email CRM on first listing | PCD weight + honesty moat |
| App URL = mcflyads.com | Shopify + religion refuse |
| Public “type your .myshopify.com” install form | 2.3.1 + religion |
| Forever-free marketing | Pricing honesty |
| Clone TrueProfit’s 40 cost tiles / BeProfit report sprawl | MER-as-tile trap |
| Chase 4.9★ volume before ship | Distribution, not product science |

---

## 4. Top 10 AGENT_FIX only (concrete file hints)

Prefer **docs / listing / trust copy**. Do not invent pixels. Do not polish Cash MER CSS unless a new reject risk appears.

| # | AGENT_FIX | File hints | Done when |
| --- | --- | --- | --- |
| 1 | **Close stale “Invite-only meta” rows** — local support meta is already Free App Store | `docs/REJECT_RISK_AUDIT.md` risk #8 / P2 row; `docs/SUBMIT_TOMORROW.md` open-agent table | Audit matches `site/support.html` lines 7–16 |
| 2 | **Homepage CTA path for App Store Free** — lead with find/install narrative (or dual: App Store + design-partner email); never shop-domain form | `site/index.html` hero CTA + `#waitlist` band; optional `site/download.html` | First viewport doesn’t read invite-only after listing ships |
| 3 | **Partner listing completeness checklist** — Languages=English; Works with=Checkout (honest; no fake Meta pixel); Category pick; developer display name; Free pricing; no External charges while Free | `docs/APP_STORE_LISTING.md` new §Partner fields | Paste-ready; no invented connectors |
| 4 | **First-10-minutes TTFV block** in long description / reviewer notes — Settings margin → CSV (incl. Other) → Cash MER → Allocation | `docs/APP_STORE_LISTING.md` long description + reviewer notes | Matches MASTER_PLAN &lt;10 min claim without promising auto-sync |
| 5 | **Differentiate listing shot 2** — not just period swap of shot 1; caption must prove formula, not “another scoreboard” | `docs/LISTING_VISUAL_PACK.md` shot table; optionally note UI affordance already present | 5 shots pass uniqueness smell-test vs 4.4.4 |
| 6 | **Trust-page name alignment** — titles/H1 use **Mcfly Analytics** (app name) with Ads lockup OK in chrome | `site/support.html`, `pricing.html`, `privacy.html`, `terms.html` | Listing name ↔ trust pages match |
| 7 | **Extensionless canonicals** on trust pages (308 already; prefer extensionless in meta) | same trust HTML `link rel=canonical` + `og:url` | Matches `APP_STORE_LISTING.md` Partner URL table |
| 8 | **Support FAQ: “Why no Meta/Google connect?”** — CSV-first honesty (religion) so week-1 expectations don’t churn | `site/support.html` FAQ section | One short honest answer; no connector promise |
| 9 | **Live-vs-local trust regression note** for agents — curl recipe that fails if invite-only returns | `docs/REJECT_RISK_AUDIT.md` or `scripts/` one-liner in ship notes | Agents stop “fixing” CSS when Pages lag is the issue |
| 10 | **Icon + shot upload runbook one-pager cross-links** — filenames, crop, sample OFF, M-only icon path | `docs/LISTING_VISUAL_PACK.md` ↔ `docs/SUBMIT_NOW.md` | Human gate D is click-only, zero ambiguity |

### Not in top 10 (tagged elsewhere)

- Pages publish, Partner MFA, PCD click, screenshot capture, Submit → **HUMAN_GATE**  
- Auto ad OAuth, pixels, LTV, review farming → **WONTFIX_RELIGION** / **DEFER_POST_SUBMIT**

---

## 5. Mcfly vs leaders — craft scorecard (honest)

| Signal | Leaders (best of) | Mcfly today | Gap tag |
| --- | --- | --- | --- |
| Pricing card honesty | Free / From $X / trial | Draft **Free** (correct until Billing) | Ready in docs · **HUMAN_GATE** Partner mark Free |
| Trust URLs match listing | Always | **Live lag** (invite-only) | **HUMAN_GATE** |
| Screenshot gallery | 5–10 outcome shots | Pack written; **not uploaded** | **HUMAN_GATE** |
| Review density | 100–800+ | 0 | **DEFER_POST_SUBMIT** |
| Demo store | Common | None | **DEFER_POST_SUBMIT** |
| TTFV story | Auto-sync theater | CSV ritual (honest) | **AGENT_FIX** packaging |
| Formula honesty | Weak / inverted MER risk (TW) | Strong (sales÷spend) | Advantage — keep |
| PCD posture | Heavy (Lifetimely) | Minimal (totals + opaque id) | Advantage — keep |
| Install friction | One-click + Free | Embedded Admin; no shop form | Advantage if Distribution flipped |

---

## 6. Sources

- Live App Store: [Triple Whale](https://apps.shopify.com/triplewhale-1), [TrueProfit](https://apps.shopify.com/trueprofit), [BeProfit](https://apps.shopify.com/beprofit-profit-tracker), [Lifetimely](https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics), [Metorik](https://apps.shopify.com/metorik), [Polar](https://apps.shopify.com/polar-analytics), [CashDash](https://apps.shopify.com/cashdash-pro), [Bloom](https://apps.shopify.com/bloom-analytics), [Kipify](https://apps.shopify.com/kipify) — fetched 2026-07-23  
- Repo: `INDUSTRY_LEADERS.md`, `COMPETITORS.md`, `APP_STORE_LISTING.md`, `LISTING_VISUAL_PACK.md`, `REJECT_RISK_AUDIT.md`, `MASTER_PLAN.md` §0–§4  
- Live curl: `mcflyads.com/support|pricing|privacy` still pre–App Store Free copy (Pages lag); Fly `/health` ok  

**Confidence:** High on craft patterns and Mcfly gaps. Medium on exact review counts (move weekly). Re-verify prices before publishing competitor dollars on mcflyads.com.

---

## 7. Agent rules

- Update this file when App Store packaging shifts; **never** turn it into a pixel backlog.  
- Next loop after B3: implement **§4 AGENT_FIX** only if still open; then ship-gate; stop on HUMAN_GATE.  
- Prefer kill shots from §1 over feature envy.
