# Mcfly ship build plan — Cursor megaplan

**Status:** Locked for agent + founder execution (2026-07-28)  
**Budget ceiling:** ≤ **$200/mo** infra (domain already owned)  
**Outcome:** App Store Free submit + world-class cash desk + mcflyads.com that sells the Monday till — then grow toward Domination Bar (≥4.7 WTP)  
**Religion SoT:** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §1 · Delivery: [`MASTER_DIRECTIVE.md`](./MASTER_DIRECTIVE.md)  
**Human runbook:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · Domination paste: [`CATEGORY_DOMINATION_MEGAPROMPT.md`](./CATEGORY_DOMINATION_MEGAPROMPT.md)  
**Pipe wedge:** [`PIPE_AUTOMATION_WEDGE.md`](./PIPE_AUTOMATION_WEDGE.md)

**Models (redesign):** Grok 4.5 implementer + Grok critic in parallel; Composer for hygiene/docs. Skip Claude if quota-blocked. Explicit `model` on Task spawns.

**Refuse always:** pixels, MTA, path/view-through/“true ROAS,” SyncWith **connector zoo inside Mcfly**, App URL = mcflyads.com, forever-free bait, inventing TW Compass/Moby clones.

---

## 0. North star (what “ready to ship” means)

| Gate | Definition |
| --- | --- |
| **Submit-ready** | Listing Free + PCD Level 1 + shots + smoke + Submit clicked — human |
| **Desk-ready** | Cold path &lt;10 min: margin → spend (CSV or pipe template) → Total ROAS → Monday Close |
| **Site-ready** | Trust URLs + install honesty + automation story (optional pipes) live on Pages |
| **Scale-ready** | Fly + Neon + CF under $200; path to `app.mcflyads.com` + non-Shopify adapters documented — not built until pulled |

**Current honest score (approx):** submit-human ~30 · agent craft ~90 · Domination critic ~3.5/5. Ship ≠ Domination done.

---

## 1. Current inventory (do not rebuild)

### Already live / mostly done

| Asset | Evidence |
| --- | --- |
| App host | `https://mcfly-analytics.fly.dev` health ok |
| Site | `https://mcflyads.com` Cloudflare Pages (`?v=20260728d`+) |
| Cash desk | Net Total ROAS, BE, allocation, period rail |
| Monday Close | `/app/close` ritual + lock + CSV |
| Spend Free path | Multi-platform CSV, combine, Bill→daily, coverage/recon |
| Pipe Automate UI | Spend `#mcfly-spend-automate` + template `?pipe=long\|wide` (finish polish this plan) |
| Meta/Google clients | Live Insights/GAQL code; creds/App Review = human |
| Billing scaffold | `MCFLY_BILLING` default off · ~$79 Pro copy |
| Compliance | GDPR webhooks, Level-1 export, spotcheck |

### Open fatals (ranked)

| # | Gap | Tag |
| --- | --- | --- |
| 1 | Partner Distribution → Submit | **HUMAN_GATE** |
| 2 | Listing shots 0/5 + screencast | **HUMAN_GATE** |
| 3 | Paste death (merchant Meta/Google OAuth) | **HUMAN_GATE** + light AGENT |
| 4 | Pipe wedge unfinished (tests, docs, listing, site, CSS) | **AGENT_FIX** |
| 5 | Design-partner Monday Close × N + WTP | **HUMAN_GATE** |
| 6 | `app.mcflyads.com` browser login (TW shape) | **DEFER** until after Submit |
| 7 | Google Sheet live pull (vs CSV download today) | **DEFER** post-Submit |
| 8 | Non-Shopify / lead-gen adapters | **DEFER** revenue-pulled |

---

## 2. Cost analysis

### 2.1 Monthly OpEx (infra) — stay ≤ $200

| Line item | Now (Free listing) | Comfortable | Stress (&lt;$200 cap) |
| --- | ---: | ---: | ---: |
| Cloudflare Pages + DNS | $0–5 | $5 | $20 (Pro optional) |
| Fly.io app (1× shared 1GB, always-on) | $10–35 | $35–50 | $80 (2 machines / more RAM) |
| Postgres (Neon free → Launch) | $0–19 | $19–25 | $50–70 |
| Email (Resend/Postmark) | $0 | $0–15 | $20 |
| Sentry | $0 | $0–26 | $26 |
| Domains / SSL | **owned** | $0 | $0 |
| **Total** | **~$15–60** | **~$60–120** | **~$150–196** |

**Rule:** Do not buy AWS “enterprise,” second BI hosts, or Apps Script as product UI. Scale Fly/Neon **with paid seats**, not vanity.

**Break-even math:** ~$79 flat → **≈3 paying stores** cover a fat infra month. Hosting is not the risk; Free flood + connector support is — hence CSV + merchant-paid SyncWith-class pipes.

### 2.2 One-time / soft costs (not infra)

| Item | Cost | Who |
| --- | --- | --- |
| Meta App Review / Google Ads developer token | $0 fees; **weeks calendar** | Human |
| Shopify Partner / App Store | $0 submit | Human |
| Loom / screenshot tooling | $0–15 | Human |
| Affiliate to SyncWith (optional later) | $0 if none; FTC disclose if yes | Policy |
| Engineering (Cursor + founder) | Time, not $200 budget | This plan |

### 2.3 Unit economics (target)

| | Free CSV desk | Pro ~$79 (after WTP) |
| --- | --- | --- |
| COGS infra | pennies/shop | pennies/shop |
| Support risk | Paste help | Lower if pipe template + Meta/Google OAuth |
| Pipe tools | Merchant pays SyncWith/etc. | Same |
| Kill if | Sheets enough after 4 closes; paste churn | Support &gt; contribution |

### 2.4 Scale ladder (when it catches)

```text
0–50 shops     → current Fly + Neon free/launch
50–500         → Neon paid + optional 2nd Fly machine
500–5k         → bigger DB + overnight worker isolate
Non-Shopify    → adapters on same brain — same hosts
```

---

## 3. Legal / App Store guardrails (pipe + site)

| Risk | Rule |
| --- | --- |
| Shopify **1.1.14** agencies | Recommend **SaaS pipe tools**, not freelancers/agencies |
| Fake “Works with SyncWith” | Say **optional export into Mcfly template** unless real partner deal |
| Affiliate links | Default **no commission**; if added → FTC disclosure next to the link |
| Core app must work alone | Free CSV path never requires SyncWith |
| Billing | Never bill SyncWith through Mcfly; Shopify Billing only for Mcfly Pro |
| Trademarks | Nominative use OK; don’t put their logos in App Store “Works with” without permission |
| App URL | Fly / `app.mcflyads.com` — never marketing Pages |

Full wedge: [`PIPE_AUTOMATION_WEDGE.md`](./PIPE_AUTOMATION_WEDGE.md).

---

## 4. Build phases (Cursor ticks)

Each tick: **ORIENT → IMPLEMENT (minimal) → `bash scripts/agent-ship-gate.sh` → REPORT**.  
Compliance touched → also `bash scripts/mcfly-compliance-spotcheck.sh`.  
**No** `fly deploy` / Pages deploy / commit / push unless founder asks that turn.

### Phase A — Finish pipe automation wedge (P0 agent) · ~1–2 ticks

**Goal:** Advertise “automation available” honestly; template downloads perfect; instructions everywhere.

| # | Work | Files / surfaces |
| --- | --- | --- |
| A1 | Harden `buildPipeAutomationLong/Wide` + tests; `parseSpendCsv` round-trip | `app/app/lib/spend-csv.ts`, `*.test.ts` |
| A2 | Template route `?pipe=long\|wide` filenames stable | `app.spend.template.tsx` |
| A3 | Spend Automate section polish + CSS | `app.spend.tsx`, `mcfly-desk.css` |
| A4 | Connections + empty states point to `#mcfly-spend-automate` | `app.connections.tsx`, banners |
| A5 | Public sample CSV on site (optional download without Admin) | `site/assets/mcfly-pipe-spend-long-example.csv` |
| A6 | Docs + listing + support FAQ | `PIPE_AUTOMATION_WEDGE.md`, `APP_STORE_LISTING.md`, `APP_FEATURES.md`, `site/support.html`, `site/product.html` |
| A7 | Critic: “would a merchant find Automate in &lt;30s?” | Grok critic |

**Paste prompt:**

```text
Implement Phase A of docs/SHIP_BUILD_PLAN.md (pipe automation wedge).
Religion: Free CSV always works; SyncWith-class optional; no fake Works-with; no pixels.
Finish templates, tests, Spend Automate UX, listing/support/site copy, PIPE doc legal section.
Ship-gate. No deploy unless asked.
```

---

### Phase B — App desk ship polish (P0 agent) · ~2–3 ticks

**Goal:** Submit-grade craft; no CSS circles if scorecard ≥4.7.

| # | Work | Notes |
| --- | --- | --- |
| B1 | TTFV audit cold path sample OFF → Close | Empty states only |
| B2 | Monday Close craft verify vs Apps Script scorecard | No Fraunces on Close chrome |
| B3 | Coverage/recon shop-IANA already done — regression tests only | |
| B4 | Listing First-10-min + reviewer notes include Automate optional | `APP_STORE_LISTING.md` |
| B5 | Reject-risk / scorecard update with evidence | |

**Anti-circle:** Do not re-polish Cash MER CSS without new reject risk.

---

### Phase C — Site enterprise look (P1 agent) · ~2 ticks · after or parallel A

**Goal:** mcflyads.com sells cash close + automation honesty; convert without shop-domain form.

| # | Work |
| --- | --- |
| C1 | Home/product/pricing: Free CSV + “Automation available (you pay SyncWith-class)” |
| C2 | Support FAQ: pipe template steps; Meta/Google near-term honesty |
| C3 | Trust pages stay Free when listed / Partner invite |
| C4 | Cache bump `?v=` + **founder asks** Pages deploy |
| C5 | Visual QA: one composition heroes; brand first; no purple AI slop |

**Pause rule:** During redesign, site ticks are allowed when founder asks ship/site — this plan authorizes Phase C.

---

### Phase D — Human Submit pack (founder) · calendar days

Follow [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) exactly. Reply phrases:

`distribution done` · `pcd done` · `emergency contact done` · `pages live` · `install works` · `assets uploaded` · `submitted`

Agent: verify curls / checklists only — do not fake Partner clicks.

---

### Phase E — Retention pipes (post-Submit or parallel human) · weeks

| # | Work | Tag |
| --- | --- | --- |
| E1 | Meta Ads App Review + tokens on Fly | HUMAN |
| E2 | Google Ads developer token + OAuth | HUMAN |
| E3 | Enable `MCFLY_SPEND_OAUTH=1` live path; mock never silent | AGENT after E1/E2 |
| E4 | Design partners: [`DESIGN_PARTNER_SMOKE.md`](./DESIGN_PARTNER_SMOKE.md) | HUMAN |
| E5 | Billing GraphQL behind `MCFLY_BILLING=1` after ≥2/5 WTP yes | AGENT after WTP |

---

### Phase F — TW-shape browser desk (post-Submit) · 1–2 weeks eng

| # | Work |
| --- | --- |
| F1 | DNS `app.mcflyads.com` → Fly |
| F2 | Same app: Shopify OAuth login outside Admin |
| F3 | No second MER brain; Pages stays marketing only |

**Cost:** ~$0–5 DNS; same Fly bill.

---

### Phase G — Sheet live sync (nice) · after F or with E

Merchant connects Google Sheet that SyncWith fills → Mcfly pulls on schedule. CSV path remains. Optional.

---

### Phase H — Non-Shopify / lead gen (revenue-pulled only)

| # | Work |
| --- | --- |
| H1 | `SalesAdapter` interface (Shopify \| CSV orders \| Stripe later) |
| H2 | Same spend + MER + Close |
| H3 | No new host — same Fly/Neon |

**Do not start H until Shopify paid WTP proven.**

---

## 5. Cursor operating rules (every tick)

1. Read this plan + MASTER_PLAN §1 before coding  
2. Tag gaps: `AGENT_FIX` \| `HUMAN_GATE` \| `WONTFIX_RELIGION` \| `DEFER`  
3. Topology: 1 Grok implementer (file owner) + 1 Grok critic  
4. Ship-gate before “done”  
5. Stop on human gates with exact reply phrases  
6. ≤3 fix attempts then escalate with logs  
7. No commit/deploy/push unless asked  

### Master paste (full stack)

Use [`CATEGORY_DOMINATION_MEGAPROMPT.md`](./CATEGORY_DOMINATION_MEGAPROMPT.md) **plus**:

```text
Also execute docs/SHIP_BUILD_PLAN.md Phases A→B (then C if site asked).
Pipe wedge + Submit polish. Cost ceiling $200/mo infra — no new hosts.
Advertise automation as optional merchant-paid SyncWith-class → Mcfly template.
```

---

## 6. Definition of done by milestone

### M1 — Agent ship (Phases A–B)

- [ ] Pipe templates tested + Automate UX + docs/listing/support  
- [ ] Ship-gate PASS · compliance PASS if touched  
- [ ] Critic ≥4.0 on “Automate discoverable + Free alone works”

### M2 — Submit (Phase D)

- [ ] All SUBMIT_NOW reply phrases received  
- [ ] Listing Free · App URL Fly · sample OFF for reviewers  

### M3 — Retention (Phase E)

- [ ] Live Meta and/or Google for at least founder account  
- [ ] ≥3 partner closes · WTP signal  

### M4 — Growth surface (F–G)

- [ ] `app.mcflyads.com` same desk  
- [ ] Optional Sheet pull  

### M5 — Expansion (H)

- [ ] First non-Shopify adapter behind flag  

---

## 7. Founder weekly checklist

1. Run next **HUMAN_GATE** from SUBMIT_NOW  
2. Paste reply phrase in Cursor  
3. Ask agent for **one** Phase tick (A → B → C)  
4. Approve deploy only when you want live Pages/Fly updated  
5. Watch OpEx &lt; $200 (Fly dashboard + Neon)

---

## 8. Related docs

| Doc | Use |
| --- | --- |
| [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) | Baby human steps |
| [`PIPE_AUTOMATION_WEDGE.md`](./PIPE_AUTOMATION_WEDGE.md) | Automation economics + legal |
| [`DESIGN_PARTNER_SMOKE.md`](./DESIGN_PARTNER_SMOKE.md) | WTP evidence |
| [`BILLING_TIERS.md`](./BILLING_TIERS.md) | Free → ~$79 |
| [`GO_LIVE.md`](./GO_LIVE.md) | Fly/Neon/CF |
| [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md) | Reviewer risk |
| [`SHIP_CHECKLIST.md`](./SHIP_CHECKLIST.md) | Evidence-only boxes |

---

## 9. One-line summary

**Ship the Shopify cash close + honest automation story on the stack you already pay for (&lt;$200/mo); founder closes App Store gates; Cursor finishes pipe/desk/site polish; browser login and non-Shopify wait until paid proof.**
