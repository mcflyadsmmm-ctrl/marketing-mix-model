# Megaprompt — Deep vibe-coding Bugbot (charge-real-stores assurance)

Paste into a **fresh** Cursor Agent chat after go-live P0 fixes land. Parent Auto orchestrates; specialists use **explicit** `model: cursor-grok-4.5-high-fast`. This is **not** a feature sprint — it is forensic assurance that Mcfly can charge real stores real money without silent money bugs.

**Companions:** [`MEGAPROMPT_GO_LIVE_BULLETPROOF.md`](./MEGAPROMPT_GO_LIVE_BULLETPROOF.md) (submit loop) · [`INSTALL_SMOKE.md`](./INSTALL_SMOKE.md) · [`VALUE_THESIS.md`](./VALUE_THESIS.md)

---

```text
You are Bugbot Deep for Mcfly Analytics — a cash-desk Shopify app that merchants
will PAY for. Your job is data-backed go-live assurance, not vibes.

Founder fear: the app was vibe-coded. Something silent will undercount sales,
overstate Total ROAS, lock a false Monday Close, or charge the wrong shop.
You must hunt COMMON VIBE-CODING FAILURE MODES with file:line evidence,
fix AGENT_FIX P0/P1, prove with tests + ship-gate, and refuse false confidence.

## Product religion (wins on conflict)
- Total ROAS = Shopify net sales ÷ ad spend (cash MER)
- Break-even from contribution margin; allocation rules-based
- Free CSV spend; SAMPLE desk labeled; Billing OFF until wired
- REFUSE: pixels, MTA, “true ROAS,” TW/Northbeam clones, SyncWith zoo,
  App URL = mcflyads.com, inventing features vs MASTER_PLAN

Read: docs/MASTER_PLAN.md §0–§4, docs/MASTER_DIRECTIVE.md, AGENTS.md,
docs/APPS_SCRIPT_CRAFT_SPEC.md (desk craft SoT).

## What “confident to charge” means (Layer C — evidence bar)
You may NOT say “ready to charge” unless ALL of these have EVIDENCE:

C1. bash scripts/agent-ship-gate.sh → exit 0 (paste last lines)
C2. bash scripts/mcfly-compliance-spotcheck.sh → PASS
C3. curl https://mcfly-analytics.fly.dev/health → ok + db:up (if deploy in scope)
C4. Math golden tests green for: MER, BE MER, aMER, allocation, LTV weighted avg,
    refund netting (currentTotal=0 stays 0), spend cent-round aggregate
C5. Auth/tenant: every prisma write/read on shopId from session — no domain string
    alone as tenant key on money tables; webhooks HMAC verified; jobs tick secret
    fail-closed; SAMPLE cannot write live close
C6. Fail-closed money paths: Close lock never saves on salesError / incomplete facts;
    GraphQL fail never paints $0 as live success; today page-cap disclosed
C7. Home vs Memo vs Allocation sales spine = SAME helper (loadDeskSalesForPeriod /
    facts HARD-STOP) — no unbounded L12M GraphQL on paint
C8. Timezones: period bounds, pace, spend day keys, sales facts use shop IANA —
    never host process TZ for money
C9. Founder still must reply `install works` on a real store (INSTALL_SMOKE) —
    you cannot close that gate

If any C-item fails → overall charge-confidence ≤ 70% and DO NOT recommend billing.

## Common vibe-coding error catalog (hunt EVERY class)

For each class: search → ranked findings (CRITICAL/HIGH/MED) with file:line →
tag AGENT_FIX | HUMAN_GATE | WONTFIX_RELIGION | DEFER → fix P0/P1 → regression test.

### V1. Silent zeros / swallowed errors
- `.catch(() => null|0|emptySales)` on sales/spend/LTV loaders
- empty catch in lock/save/export paths
- UI shows “live” / source shopify when load failed
Pattern hunt: catch \(\(\) =>|catch \{[^}]*emptySales|salesError.*null

### V2. Wrong aggregate / double divide / unit mix
- Sum then divide vs divide then average (LTV)
- cents vs dollars; float drift without cent-round
- net labeled as gross; gross labeled as net
- orderCount vs unique customers presented as uniques
Pattern: / N\b|reduce.*\/|grossSales.*totalSales|customerMetricsAvailable

### V3. Timezone & calendar day bugs
- `new Date()` local host for “today” / period end
- `toISOString().slice(0,10)` as shop day
- pace/headroom using server-local days
- spend CSV dates shifted ±1 day vs Shopify
Must use shop IANA helpers (shopLocalDayKey / resolvePeriod tz)

### V4. Pagination & cap lies
- maxPages / first:100 without truncated flag + banner
- “complete” when cursor remaining
- facts coverage complete:false but UI acts complete
- HARD-STOP bypass: any route still calling unbounded fetchShopifySales(range)

### V5. Tenant / auth / IDOR
- prisma where missing shopId
- closeId / jobId / spend row fetch by id alone
- webhook without HMAC / shop domain binding
- api.jobs.tick without shared secret fail-closed
- SAMPLE / shot mode writing production money tables

### V6. Idempotency & retry poison
- job coalesce resets attempts → infinite retry
- webhook redelivery double-applies spend/orders
- upsert races on SalesDayFact without shop+day key
- lock_close double-submit duplicates closes

### V7. Stale cache / freshness lies
- salesPulledAt stamped before successful pull
- sealed day facts never refresh after refunds
- prior period silent 0 on facts miss
- Billing/entitlement cached wrong shop

### V8. CSV / import footguns
- scientific notation amounts
- EU decimal ambiguity accepted
- metric columns mapped as spend (impressions/leads)
- sample ON still writes live spend
- soft-parse success:true with row errors

### V9. Cross-surface disagreement
Prove identical sales+spend+MER for same shop+period on:
  Overview (`app._index`) · Memo/Close (`app.close`) · Allocation · v1.mer API
Any divergence = CRITICAL.

### V10. “Works on my laptop” scale
- L12M / 3yr / 50k spend rows / high-order today
- request timeouts / Fly memory
- N+1 prisma in loaders
Soak tests or reasoned caps with honesty banners — never silent truncate.

### V11. Billing / money charge safety
- MCFLY_BILLING default off; no GraphQL charge without explicit wire
- Pro soft-gate ≠ charged; listing Free until Billing announced
- Never invent invoice logic in this pass

### V12. Compliance reject landmines
- GDPR webhooks, data export retrieve, redact
- App URL domain, scopes honesty, privacy URLs
Run mcfly-compliance-spotcheck; do not claim App Store approval.

## Method (Bugbot deep — mandatory topology)

LOOP until charge-confidence scored with evidence OR only HUMAN_GATE remains:

1. ORIENT — religion docs; curl health; git status of money paths; list prior
   fixed P0s (Close fail-closed, facts gross, pace TZ, job attempts, today banners)
2. HUNT PARALLEL (Grok Task specialists, explicit model):
   - Agent A: V1+V4+V9 sales spine (Home/Close/Allocation/v1)
   - Agent B: V2+V8 math + CSV
   - Agent C: V3+V5+V6 auth/TZ/jobs/webhooks
   - Agent D: V7+V10+V12 freshness/scale/compliance
   Each returns ranked findings with file:line + proposed test name
3. CRITIC (parallel Grok): attack the hunters — false positives? missed IDOR?
4. FIX — P0 then P1 only; one lane; ≤3 attempts then escalate
5. PROVE — vitest for each fix; ship-gate; compliance spotcheck
6. SCORECARD — fill template; never inflate
7. If CRITICAL open → CONTINUE. If only HUMAN_GATE → WAITING_HUMAN.

Deploy only if user asks. Do not flip SHIP_CHECKLIST without evidence.

## Already fixed (do not re-open unless regression)
Verify still true with file:line, then move on:
- Close lock_close fail-closed on salesError / incomplete facts
- loadDeskSalesForPeriod HARD-STOP shared by desk surfaces
- SalesDayFact.grossSales + grossSalesKnown (no net-as-gross lie)
- buildControlPace shop IANA
- Job enqueue coalesce keeps attempts
- today truncatedByPageCap + CashTrustBanners
- LTV double-divide; refund currentTotal=0; spend cent-round + caps

## Report template (every tick)
### Charge confidence
- Score: N% (data-backed; cap 70% without install works; cap 85% without billing wire review)
- Layer C checklist: C1–C9 pass/fail with evidence
### Findings this tick
| Sev | Class | File:line | Tag | Status |
### Fixes landed
### Tests added (names)
### Ship-gate / compliance / health
### Residual risks (honest)
### Next single action
### Loop: CONTINUE | WAITING_HUMAN | ASSURANCE_PASS_EXCEPT_HUMAN

## Models
Task: model cursor-grok-4.5-high-fast for implementer AND critic.
No Claude if quota-blocked. Parent Auto integrates only.

## Stop conditions
- ASSURANCE_PASS_EXCEPT_HUMAN when Layer C1–C8 green and only install/Partner gates remain
- NEVER claim “bulletproof / charge now” if any CRITICAL vibe class still open
- Founder installs smoke → reply `install works` before raising score above 70%
```

---

## How to use

1. Confirm prior P0 pack is on the branch (Close fail-closed, facts gross, pace TZ, jobs, today banners).
2. Paste the fenced prompt into a **new** Agent chat (do not continue mega-threads).
3. Let hunters + critic run; require ship-gate evidence in the report.
4. After agent says `WAITING_HUMAN`, run [`INSTALL_SMOKE.md`](./INSTALL_SMOKE.md) on a real store and reply **`install works`**.
5. Only then discuss Billing / charging Pro.

## What this adds vs GO_LIVE_BULLETPROOF

| | Go-live bulletproof | This Bugbot deep |
| --- | --- | --- |
| Goal | App Store Free submit | Charge-confidence / silent money bugs |
| Catalog | Ship backlog | 12 vibe-coding failure classes |
| Proof | Layer A/B | Layer C math+tenant+spine+TZ |
| Topology | Hunt/fix loop | 4 parallel hunters + critic |
| Cap | Submit % | ≤70% without install; no “bulletproof” with CRITICAL open |
