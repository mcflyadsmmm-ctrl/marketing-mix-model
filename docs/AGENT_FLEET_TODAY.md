# Agent fleet — ship today (fresh chats)

**Enterprise SoT (Wave 0+):** [`ops/FLEET_ENTERPRISE.md`](./ops/FLEET_ENTERPRISE.md) — failure audit, free-host ladder, Automations, queues under [`ops/fleet/`](./ops/fleet/). This file remains the **attended day map**; prefer enterprise queues for ongoing parallel work.

**Why:** Long chats lose edges. Open **new Agent chats** (or one parent + Task specialists). Do **not** continue mega-threads.

**Conductor chat:** Orchestrate only — spawn specialists with explicit `model`, integrate reports, hand HUMAN_GATE to founder. Do not implement in the conductor thread. Caps: Conductor + ≤4 chats; ≤6 background Tasks ([`ops/FLEET_ENTERPRISE.md`](./ops/FLEET_ENTERPRISE.md)).

**Religion:** Cash Total ROAS = net sales ÷ spend. **PCD Level 1 only** (no Level 2). Free CSV always works; SyncWith-class optional. Refuse pixels / MTA / connector zoo / App URL = mcflyads.com.

**Models (Task `model` required):**

| Role | Prefer |
| --- | --- |
| App / site implementer | `cursor-grok-4.5-high-fast` |
| Critic / BFS parallel | `cursor-grok-4.5-high-fast` or `gpt-5.6-sol-medium` |
| Hard judgment / ship odds | `gpt-5.6-sol-medium` |
| Desk craft (Polaris / TTFV) | `claude-sonnet-5-thinking-high` or `claude-fable-5-thinking-high` — **if quota fail → Grok, do not retry Claude** |
| Hygiene / docs | `composer-2.5-fast` |

**Deploy:** Only when founder/conductor grants that turn (`Fly deploy allowed` / `Pages deploy allowed`).

**Human SoT:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · PCD: [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) · Plan: [`SHIP_BUILD_PLAN.md`](./SHIP_BUILD_PLAN.md) · **Fleet OS:** [`ops/FLEET_ENTERPRISE.md`](./ops/FLEET_ENTERPRISE.md)

---

## Enterprise attended map (prefer after Wave 0)

| # | Chat name | Lane | Queue |
| --- | --- | --- | --- |
| **0** | `Orchestrator` | Conductor only | — |
| **1** | `Desk — Pro + ritual` | App Pro / retention | [`ops/fleet/QUEUE_DESK.md`](./ops/fleet/QUEUE_DESK.md) |
| **2** | `Services — custom factory` | Custom DS closes | [`ops/fleet/QUEUE_SERVICES.md`](./ops/fleet/QUEUE_SERVICES.md) |
| **3** | `Education — MDS go-live` | Course $79 | [`ops/fleet/QUEUE_EDU.md`](./ops/fleet/QUEUE_EDU.md) |
| **4** | `Gate — ship-gate + critic` | Quality | [`ops/fleet/QUEUE_GROWTH.md`](./ops/fleet/QUEUE_GROWTH.md) |
| **H** | *You (human)* | [`ops/fleet/HUMAN_GATE_BOARD.md`](./ops/fleet/HUMAN_GATE_BOARD.md) | — |

B2B chat only after Wave 2 unlock. Cloud schedules: [`ops/fleet/AUTOMATIONS_SETUP.md`](./ops/fleet/AUTOMATIONS_SETUP.md).

---

## Fleet map (open these as **separate** Agent chats) — legacy day map

| # | Chat name | Lane | Deploy? |
| --- | --- | --- | --- |
| **0** | `Orchestrator` | You + short status only — assign/merge, don’t implement | — |
| **1** | `App — Fly ship Sheets` | Deploy Spend Sheets wizard already in repo | **Yes Fly** if asked |
| **2** | `App — PCD L1 maximize` | Privacy disclosures + export TTL + log scrub + listing PCD paste polish | No unless asked |
| **3** | `Site — anti-slop sales voice` | Human salesman copy (MDS voice + ban list) | **Yes Pages** if asked |
| **4** | `Site — demo polish` | Drill-down QA vs Apps Script Overview; no new suites | Pages if asked |
| **5** | `Ship-gate / critic` | Read-only audit + scorecard; no feature invent | No |
| **H** | *You (human)* | Partner: Distribution → PCD L1 → emergency → smoke → shots → Submit | — |

Optional later (not today): Meta/Google OAuth App Review = **HUMAN**; Billing wire; `app.mcflyads.com`.

---

## How to launch in Cursor (2 minutes)

1. **Composer / Agent** → New Agent chat (one per row above).
2. Attach `@docs/AGENT_FLEET_TODAY.md` + the paste block for that chat.
3. Parent/Orchestrator chat stays thin: “Chat 1 status?” / “Merge blockers?”
4. When a chat finishes: run `bash scripts/agent-ship-gate.sh` if app touched; reply phrases for human gates only when true.
5. **Do not** reopen this long archived thread for implementation.

### Parallel tip

Start **1 + 2 + 3** together. Hold **4** until 3’s copy lands if they touch the same HTML. Run **5** after 1–3 report.

---

## Paste prompts

### Chat 1 — App Fly ship (Sheets wizard)

```text
@docs/AGENT_FLEET_TODAY.md @docs/PIPE_AUTOMATION_WEDGE.md

Lane: App — Fly ship Sheets wizard.
Evidence: #mcfly-spend-sheets already in app/app/routes/app.spend.tsx; template ?platforms=; ship-gate passed locally earlier.

DO:
1. Orient: git status; confirm wizard + tests exist
2. bash scripts/agent-ship-gate.sh
3. If PASS and founder said deploy in this message: fly deploy the app (mcfly-analytics) — only then
4. Smoke: health curl; document Admin QA: Spend → Get spend into Mcfly
5. Report: Fly URL, exit codes, HUMAN_GATE (master Sheet /copy later)

Religion: Free CSV always; SyncWith optional; no fake Works-with; PCD Level 1 only.
No Pages deploy. No new features. No Level 2 PCD.
Models on Task: cursor-grok-4.5-high-fast implementer + critic if you spawn.
```

**Founder first line if you want prod:** add `Fly deploy allowed this turn.`

---

### Chat 2 — PCD Level 1 maximize (best approval odds)

```text
@docs/AGENT_FLEET_TODAY.md @docs/PCD_AND_LTV.md @docs/APP_STORE_LISTING.md @docs/SUBMIT_NOW.md @.cursor/skills/mcfly-shopify-compliance/SKILL.md

Lane: Milk PCD Level 1 for approval odds. DO NOT request Level 2.

DO:
1. bash scripts/mcfly-compliance-spotcheck.sh
2. Harden agent-fixable trust:
   - privacy.html: staff Session fields; SyncWith as merchant processor; waitlist contact; export retention
   - ComplianceDataExport TTL if missing (30–90d)
   - Reduce compliance log PII (shop ok; no amount dumps)
3. Polish APP_STORE_LISTING.md §PCD + reviewer notes into a single COPY-PASTE block for Partner PCD form
4. Align site privacy cache ?v= ; Pages deploy ONLY if founder said so
5. Output: exact Partner click path + paste answers; remaining HUMAN_GATE list

Refuse: Level 2 fields, pixels, CRM. Tag gaps AGENT_FIX | HUMAN_GATE.
Ship-gate if app touched. Models: Grok implementer + Grok critic.
```

---

### Chat 3 — Site human sales voice (anti-slop)

```text
@docs/AGENT_FLEET_TODAY.md @docs/MDS_RESEARCH_ABSORB.md @docs/SITE_VISUAL_DIRECTION.md

Lane: Master SaaS salesman copy — human, sales-rep ready. Kill AI slop.

Ban: unlock, seamless, suite-grade, get excited, cash religion, world-class, theater (max 1), stamp “Advanced Marketing Data Science” on every lede.

DO:
1. Rewrite site/index.html, product.html, pricing.html, demo.html hero, support.html — structure/classes stay
2. Add product “Pitch in 30 seconds” talk-track box for sales reps
3. Bump ?v=20260728h; Pages deploy ONLY if founder said so
4. Return before/after of 5 worst lines + final 30s talk track

No app/ edits. No pixels. Models: Grok for copy craft + Composer hygiene OK.
```

---

### Chat 4 — Demo polish (after or parallel if no HTML clash)

```text
@docs/AGENT_FLEET_TODAY.md @docs/APPS_SCRIPT_CRAFT_SPEC.md

Lane: https://mcflyads.com/demo drill-downs already shipped (?v=20260728f).
Polish only: mobile bottom sheet, claim expand UX, align Sheets one-liner with #mcfly-spend-sheets wording.
Read vendor/mer-apps-script Overview for craft — refuse Click Allocation / Klaviyo.
Critic ≥4.7 or list gaps. Pages deploy if founder asked.
```

---

### Chat 5 — Ship-gate critic (read-mostly)

```text
@docs/AGENT_FLEET_TODAY.md @docs/REJECT_RISK_AUDIT.md @docs/SUBMIT_READY_SCORECARD.md @docs/SUBMIT_NOW.md

Lane: Honest approval odds. No new features.

1. curl health + trust URLs + demo + sheets guide
2. bash scripts/agent-ship-gate.sh && bash scripts/mcfly-compliance-spotcheck.sh
3. Update SUBMIT_READY_SCORECARD.md with evidence dates
4. Rank remaining fatals: AGENT vs HUMAN
5. Verdict: submit-ready % agent vs human — do not claim App Store approved

PCD: Level 1 only recommendation stands.
```

---

### Human chat (you) — Partner

Follow [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) in order. Reply phrases only when true:

`distribution done` · `pcd done` · `emergency contact done` · `pages live` · `install works` · `assets uploaded` · `submitted`

PCD: **Level 1 only** — leave name/email/phone/address **unchecked**.

---

## Optional: Cursor Automation (true 24/7)

Not a replacement for today’s fleet. Use for hourly **orient → ship-gate → report** on `redesign/enterprise-desk` with **no auto-deploy**.

If you want that created: say **`open ship automation editor`** and approve the draft in Automations UI.

---

## Done for “today”

- [ ] Chat 1: Sheets wizard on Fly (if deploy allowed)
- [ ] Chat 2: PCD L1 paste pack + privacy harden
- [ ] Chat 3: Human site copy live on Pages (if deploy allowed)
- [ ] Chat 5: Scorecard honest
- [ ] Human: Distribution + PCD L1 + emergency + smoke + shots underway

**Approval chance:** Agent craft can be ~90%+. Submit approval still needs your Partner clicks — fleet maximizes odds; it cannot click Submit for you.
