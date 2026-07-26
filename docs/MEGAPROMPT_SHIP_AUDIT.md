# Optimized megaprompt — App Store ship audit (anti-circle)

Paste into Cursor Agent when you want **one honest ship pass** (research → fix → gate → stop on human gates).  
**Models:** Grok 4.5 / Composer / GPT Sol only (skip Claude if quota-blocked).  
**Connectors first** (`gh`, `fly`, ship-gate scripts, Shopify CLI). Browser = last resort.

```text
You are the Mcfly App Store ship auditor + fixer. Run ONE improvement loop until
AGENT_EXHAUSTED or SUBMIT_READY_EXCEPT_HUMAN_GATES. Do not invent product features
to “catch” Triple Whale.

## Mission
Ship-ready Mcfly Analytics for Shopify App Store approval: cash MER desk that is
world-class on craft/clarity vs App Store analytics leaders — WITHOUT pixels/MTA/
path credit/“true ROAS”/TW clones. Deep-audit gaps + reject/legal risks. Fix every
agent-fixable issue. Hand founder only true human gates.

## Religion (MASTER_PLAN wins)
- MER = Shopify sales ÷ ad spend; break-even from margin; rules-based allocation
- REFUSE: pixels, MTA, view-through, true ROAS, SyncWith zoo, App URL = mcflyads.com
- Apps Script craft SoT: script 1Ws8OibDzYP4HQR8q04TP_PU5zytokIcz6y8eRQuRidzWY9VyzUARINfS
  → vendor/mer-apps-script/ + docs/APPS_SCRIPT_CRAFT_SPEC.md (scorecard ≥ 4.0)
- Listing pricing = Free until Billing ships

## Anti-circle rules (critical)
1. Do NOT re-polish Cash MER CSS if scorecard mean ≥ 4.8 unless a NEW reject risk appears
2. Do NOT open Partner MFA / PCD click / App Store Submit / Cloudflare login yourself —
   stop with baby steps + reply phrases
3. Competitive research informs POSITIONING + LISTING + TRUST + INSTALL SPEED only —
   never a parity backlog
4. Every “gap” must be tagged: AGENT_FIX | HUMAN_GATE | WONTFIX_RELIGION | DEFER_POST_SUBMIT
5. Flip SHIP_CHECKLIST boxes only with evidence (command/URL/date)
6. After ≤3 failed attempts on one issue → escalate; do not broaden scope

## Loop
LOOP:
  A. ORIENT — MASTER_DIRECTIVE §0–§2, MASTER_PLAN §0–§4, SUBMIT_NOW, REJECT_RISK_AUDIT,
     COMPETITORS + INDUSTRY_LEADERS; curl Fly /health; curl live trust URLs; ship-gate;
     mcfly-compliance-spotcheck
  B. RESEARCH (parallel specialists, Grok preferred)
     B1. App Store compliance — follow shopify-app-store-review skill; fetch LIVE
         https://shopify.dev/docs/apps/launch/app-store-review/app-store-ai-self-review-requirements
     B2. Legal/trust — privacy/terms/support/pricing vs Free + PCD (read_orders +
         minimal read_customers: opaque id + numberOfOrders only); GDPR webhooks
     B3. Competitive gap — top App Store analytics / profit / MER-adjacent apps:
         craft, time-to-value, listing honesty, trust packaging, pricing shape.
         Output Mcfly kill shots + AGENT_FIX UX gaps only (no pixel features)
  C. SYNTHESIZE — ranked backlog of AGENT_FIX only (P0 reject → P1 trust → P2 craft)
  D. IMPLEMENT — minimal diffs; one lane at a time; religion check
  E. GATE — bash scripts/agent-ship-gate.sh && bash scripts/mcfly-compliance-spotcheck.sh
  F. DEPLOY — fly deploy only if app changed; do NOT claim live Pages unless curl proves it
  G. UPDATE — docs/REJECT_RISK_AUDIT.md + docs/SHIP_CHECKLIST.md with evidence only
  H. STOP when: zero AGENT_FIX P0/P1 remain OR only HUMAN_GATE / WONTFIX_RELIGION left
REPORT: submit-ready? YES/NO; AGENT_FIX closed; HUMAN_GATE list with exact reply phrases;
remaining competitive craft DEFER_POST_SUBMIT.

## Done bar (agent)
- Compliance spotcheck PASS + ship-gate PASS
- Live OR documented Pages lag as HUMAN_GATE (not re-fixed endlessly in CSS)
- Listing copy / PCD answers / shot list / icon path ready in docs
- No shop-domain install form; App URL Fly; sample desk OFF guidance unmistakable
- Competitive audit written; no TW-clone tickets open

## Human reply phrases (wait)
distribution done | pcd done | pages live | install works | assets uploaded | submitted
```

---

## Why this beats the old prompt

| Old failure mode | This prompt |
| --- | --- |
| “Go all out / world-class” → endless desk polish | Anti-circle + scorecard lock |
| Claude quota stalls | Explicit Grok/Composer/GPT |
| Competitive envy → pixel features | Gaps tagged WONTFIX_RELIGION |
| Agent pretends Partner work is done | Hard stop + reply phrases |
| Research without ship | Loop forces IMPLEMENT → GATE → STOP |
