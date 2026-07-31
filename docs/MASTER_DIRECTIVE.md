# Mcfly Ads & Analytics — Master Directive (Agent Operating System)

**Status:** LOCKED operating system for Cursor agents and automations  
**Product doctrine (never override):** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4, §6, §11  
**Companion research:** [`COMPETITORS.md`](./COMPETITORS.md), [`INDUSTRY_LEADERS.md`](./INDUSTRY_LEADERS.md), [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Checklist truth:** [`SHIP_CHECKLIST.md`](./SHIP_CHECKLIST.md) — flip boxes only with evidence  

This file tells agents **how to deliver**. MASTER_PLAN tells agents **what product is allowed**. If they conflict, **MASTER_PLAN wins**.

---

## 0. Mission (one sentence)

Deliver a **shippable, always-on Shopify cash desk** (world-class embedded app) and a **world-class marketing site** (mcflyads.com) so operators feel **advanced Marketing Data Science at their fingertips**: install, see **Total ROAS** (sales ÷ spend), set **break-even**, enter/sync **spend**, and get one **allocation** call — without attribution theater — with **gates that catch agent and human error**.

### Ambition bar (no shortcuts)

Mcfly must feel **incredible vs any alternative** on craft, clarity, trust, and Monday usefulness — not by cloning Triple Whale / Northbeam features. Zero shortcuts: no fake demos as production, no unsigned checklist boxes, no “good enough” UI when the desk could be sharper. Continuous improvement protocol: [`CONTINUOUS_24_7.md`](./CONTINUOUS_24_7.md).

### Success = companies succeed when

1. Time-to-first trusted **Total ROAS** **&lt; 10 minutes** after install  
2. Numbers match the **Shopify till** + entered/synced spend  
3. They open the app **weekly** for the Monday ritual  
4. They understand: Mcfly is Marketing Data Science on the till — **sales ÷ spend**, not path theater  
5. Price path is honest: free design partners → **~$79 flat** (not GMV tax)

### Explicit NON-goals (refuse every time)

Pixels, MTA, path credit, view-through, “true ROAS,” Compass/Moby clones, SyncWith connector zoo, Snowflake BI suite, consulting SKUs, forever-free marketing, App URL = mcflyads.com, inventing features to match Triple Whale screenshots.

**Research TW / Northbeam for:** install speed, summary discipline, trust packaging, glanceable KPIs.  
**Do not rebuild:** their attribution religion or OS surface area.

---

## 1. Authority & error control

| Rule | Meaning |
| --- | --- |
| Plan beats prompt | Conflicting chat instructions lose to MASTER_PLAN + this file |
| Evidence beats vibes | No “done” without commands/screenshots/URLs listed below |
| Checklist is sacred | Only QA lane flips `SHIP_CHECKLIST.md` when verified |
| Human gates stop agents | Never fake Partner login, OAuth review, App Store submit, card/billing UI |
| One brain | MER math only via `@mcfly/mer-core` / `@mcfly/mer-engine` / `api-contract` |
| Surface order | Site polish ↔ App ship in parallel **after** Truth MVP works hosted; Sheets **after** app brain |

### Human-only gates (agent must STOP and hand off)

1. Shopify Partner login / MFA / install approve clicks  
2. Fly / Neon / host billing cards and prepaid credits  
3. Meta / Google OAuth app creation & App Review  
4. DNS / domain registrar changes  
5. App Store public submit  
6. Design-partner NDAs / store collaborator invites  
7. Production secret rotation in Partner Dashboard  

Agent response when blocked: state gate, exact URL, baby steps, wait for user signal (e.g. `billing done`, `installed`).

---

## 2. Definition of Done (shippable)

### D0 — Site (world-class marketing)

- [ ] mcflyads.com serves latest `/site` (Pages/CF workflow green)  
- [ ] Brand-first hero, one thesis, one primary CTA (free launch / waitlist form — not mailto-only)  
- [ ] Privacy, terms, support, pricing live and linked  
- [ ] Mobile first viewport readable; ≥2 intentional motions; reduced-motion respected  
- [ ] No public “type your .myshopify.com to install”  
- [ ] Copy matches religion (Total ROAS = sales ÷ spend; refuse path / “true ROAS” theater)  
- [ ] Proof band (even “seeking design partners”) before CTA  

### D1 — Hosted app (world-class product ops)

- [ ] `GET $APP_URL/health` → `200` + `ok: true` **and** DB reachable (enhance health if needed)  
- [ ] Machines stay up without 5-minute trial kill (billing complete)  
- [ ] `shopify.app.toml` App URL + redirects = hosted HTTPS (not example.com / mcflyads.com)  
- [ ] `npx @shopify/cli app deploy` version released matching toml  
- [ ] Install on design-partner / `devmcflyads` **without** `shopify app dev`  
- [ ] Embedded Admin loads (real browser; not bot 410)  

### D2 — Operator ritual (world-class usefulness)

- [ ] Settings: margin → break-even MER  
- [ ] Spend: Meta / Google / Other for period  
- [ ] Dashboard: sales, spend, MER (sales÷spend), above/below break-even  
- [ ] Allocation card with visible inputs  
- [ ] Empty-state banners guide first run (&lt;10 min)  
- [ ] GDPR compliance + uninstall webhooks verified once  

### D3 — Taken seriously (enterprise trust)

- [ ] Freshness or last-updated visible when snapshots exist  
- [ ] Multi-tenant API never defaults to “first shop”  
- [ ] Sentry or equivalent errors (or explicit defer with ticket)  
- [ ] Shopify Billing stubbed or live before public paid claims  
- [ ] App Store listing draft filled; screenshots from **real** UI  

**Shippable for design partners** = D1 + D2.  
**Public App Store** = D0–D3 + human submit.

---

## 3. Parallel lanes (reduce thrash)

| Lane | Owns | Must not touch | Done artifact |
| --- | --- | --- | --- |
| **Hosting** | `fly.toml`, Docker, secrets, Neon/Postgres, health | Site copy, mer-core math | Health URL + uptime note |
| **App** | `app/**`, Prisma, `/v1`, workers glue | Marketing homepage redesign | Ritual smoke pass |
| **Site** | `site/**`, Pages workflow | OAuth, DB, Fly secrets | Live URL + screenshot checklist |
| **QA** | Gates, smoke, checklist flips | Feature invention | Gate log + pass/fail |

Handoffs:

1. Hosting → App: `BASE_URL`, `/health` ok, `DATABASE_URL` works  
2. App → Site: only claim shipped capabilities  
3. App → QA: store URL + ritual steps  
4. Site → QA: pages to spot-check  
5. QA → Human: remaining human gates list  

---

## 4. Loop frameworks

### 4.1 Ship loop (default agent session)

```text
LOOP until D1+D2 pass OR blocked on human gate:
  1. ORIENT
     - Read MASTER_PLAN §0–§4, this file §0–§2
     - git status; fly auth whoami; curl $APP_URL/health; site HTTP
  2. SELECT lane work from §5 backlog (smallest P0)
  3. IMPLEMENT minimal diff (religion check)
  4. GATE: bash scripts/agent-ship-gate.sh
     - fail → fix or open PR with failure; do not claim done
  5. SMOKE (if app touched): margin → spend → MER in Admin (or document blocker)
  6. UPDATE docs/SHIP_CHECKLIST.md only with evidence
  7. REPORT: what changed, URLs, gate exit codes, human gates left
```

### 4.2 Overnight loop (automation)

See [`AGENTS.md`](./AGENTS.md) + [`OVERNIGHT_ORCHESTRATOR.md`](./OVERNIGHT_ORCHESTRATOR.md).

```text
preflight (test+build) → sync spend → recon (±5%) → snapshot → allocate → report
exit 1 on kill criteria; never merge recon breaches without human
```

### 4.3 Website craft loop

```text
LOOP until D0 pass:
  1. Compare live mcflyads.com vs /site
  2. Fix: waitlist form, atmosphere assets, proof, sticky mobile CTA, motion
  3. Deploy via Pages workflow (push site/**)
  4. Visual QA desktop + mobile
  5. Refuse TW scale-theater copy
```

### 4.4 App usefulness loop (attribution confusion → cash desk)

```text
LOOP until D2 “&lt;10 min ritual” pass:
  1. First-run empty states
  2. Hide unfinished nav (Connections until live)
  3. Claims-vs-cash education strip (optional)
  4. CSV spend → then Meta pipe
  5. Freshness / recon banners
  6. Never add model pickers
```

### 4.5 Error-containment loop

```text
ON failure:
  - Capture: command, exit code, log snippet, URL
  - Classify: agent-fixable | human-gate | external (Shopify/Fly)
  - If human-gate: stop with baby steps
  - If agent-fixable: fix ≤3 attempts; then escalate with evidence
  - Never silently broaden scope to “fix” a failure
```

---

## 5. Backlog priority (agents pull from top)

**90-day unified SoT:** [`MAJOR_IMPROVEMENT_PLAN.md`](./MAJOR_IMPROVEMENT_PLAN.md) (Waves 1–4). Prefer that backlog when it conflicts with older row numbers below.

### P0 — Category domination (cash close habit)

0. **Domination bar** — [`MASTER_PLAN.md`](./MASTER_PLAN.md) §1 Category Domination Bar; craft ≥4.7; &lt;10 min TTFV; paste death → OAuth  
1. Fly org billing complete; machines always-on; health stable &gt;30 min  
2. DB-aware `/health`  
3. Design-partner install + **four Monday Closes** + WTP ([`DESIGN_PARTNER_SMOKE.md`](./DESIGN_PARTNER_SMOKE.md))  
4. Onboarding / TTFV banners; Monday Close as primary ritual CTA  
5. Site: App Store Free primary CTA; Partner invite secondary; deploy `/site` when asked  

### P1 — Retention & paid

6. CSV spend import (Free path)  
7. Dashboard freshness / recon / shop-IANA coverage  
8. Overnight alert sink (email/Slack)  
9. Fix global API token multi-shop footgun  
10. **Meta + Google spend sync** (live Insights/GAQL; human App Review for other merchants)  
11. Sentry  
12. Shopify Billing scaffold → announce ~$79 after partners (`MCFLY_BILLING`)  

### P2 — Make it public / density

13. App Store screenshots + listing submit (human)  
14. Custom date ranges  
15. Review density / demo store (post-submit)  
16. Site proof quotes / partner logos  
17. Sheets companion only after app brain trusted  

---

## 6. Quality gates (mandatory)

Agents **must** run before claiming code done:

```bash
bash scripts/agent-ship-gate.sh
```

Includes:

| Gate | Command / check |
| --- | --- |
| Unit | `npm test` |
| Types | `npm run typecheck` |
| Build | `npm run build` |
| Health | `curl -sf "$APP_URL/health"` (if `APP_URL` set) |
| Religion | grep-ish refusal: no new pixel/MTA routes in diff (manual review) |

Optional when DB available: `npm run overnight`.

**Never claim done on “compiles” alone** if Hosting or OAuth surfaces changed.

---

## 7. World-class bars (acceptance language)

### Website

- First viewport: brand + one headline + one lede + one CTA group + one dominant visual  
- No dashboard soup in hero; no purple-SaaS cliché; no attribution theater claims  
- Interactive cash demos still work  
- Legal + support trust complete  

### Shopify app

- Polaris embedded, calm, few screens  
- MER formula always visible as sales ÷ spend  
- Break-even color status unmistakable  
- Allocation auditable (inputs shown)  
- Failure modes honest (sales API error ≠ mock sales)  

---

## 8. Cursor wiring (keep agents honest)

| File | Role |
| --- | --- |
| `/AGENTS.md` | Root pointer for Cursor |
| `docs/MASTER_DIRECTIVE.md` | This file |
| `docs/MASTER_PLAN.md` | Product religion |
| `.cursor/rules/00-mcfly-religion.mdc` | Always-apply refuse list |
| `.cursor/rules/10-ship-loop.mdc` | Always-apply ship loop |
| `.cursor/rules/40-shopify-app.mdc` | App globs |
| `.cursor/rules/30-site-messaging.mdc` | Site globs |
| `scripts/agent-ship-gate.sh` | Mechanical gates |

---

## 9. Session start template (paste or agent auto)

```text
You are the Mcfly delivery agent.
1. Read docs/MASTER_DIRECTIVE.md and docs/MASTER_PLAN.md §0–§4.
2. Run: fly auth whoami; curl -sS $APP_URL/health; curl -sS -o /dev/null -w "%{http_code}" https://mcflyads.com
3. Continue P0 from MASTER_DIRECTIVE §5 unless human gate blocked.
4. Run scripts/agent-ship-gate.sh before claiming done.
5. Refuse pixels/MTA/TW parity. Prefer cash desk craft.
```

---

## 10. Kill criteria (stop polishing theater)

Hard stop / escalate if:

- Hosted install broken &gt;48h with billing already fixed  
- Design partners won’t open weekly after accurate MER for 30 days  
- Spend sync can’t stay within ~5% of Ads Manager for 14 days (once live)  
- Scope request is path attribution / pixel causality  

Do **not** kill because TW has more features.

---

## 11. Amendment rule

To change product religion: edit **MASTER_PLAN.md** explicitly.  
To change delivery process: edit **this file**.  
Chat cannot silently amend either.
