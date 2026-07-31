# Tonight optimal loop — one full cycle (2026-07-28)

**Cadence:** Outside audit → absorb filter → AGENT execute → ship-gate → report.  
**SoT backlog:** [`SITE_QUAD_AUDIT_ABSORB.md`](./SITE_QUAD_AUDIT_ABSORB.md) + app Close polish from Domination critic.  
**Religion:** cash Total ROAS; no pixels/MTA/TW clones; App URL ≠ mcflyads.com.  
**Deploy:** Pages OK for site AGENT; Fly only if app runtime needs it; no App Store claim.

## Loop steps

1. **Orient** — health + site 200 + branch `redesign/enterprise-desk`
2. **Outside view** — ≥2 specialists (different model families when possible); unconstrained “what did we miss after A1–A6 + B1–B4”
3. **Absorb** — consensus / discard / ranked AGENT (max 3 this loop) / HUMAN unchanged
4. **Execute** — Grok implementer(s); one owner per file cluster
5. **Gate** — curl live URLs; `agent-ship-gate.sh` if app touched; update absorb status
6. **Report** — shipped · critic · HUMAN still open · next wake

## Explicit idle rule

If auditors say the true P0 is HUMAN (Search Console / App Store / CF bots / DNS), report that first and only ship secondary AGENT capture/habit — do not invent busywork as domination.

---

## Loop report — 2026-07-28 evening (Free→Pro readiness)

**Orient:** health ok+db; site 200s; branch `redesign/enterprise-desk`; listing shots still **0/5**.

**Outside:** [App readiness audit](13c58c1e-4fa0-4a95-90aa-9c9ece062b0b) · [Site/funnel audit](2d8cb39b-662c-46dd-808a-a13d630a1ddf)

**Absorb top 3 AGENT (executed):**
1. Fail-closed spend write — repo + `/v1/spend`  
2. Fail-closed Free MER/API spend filter + Free Meta+Google templates  
3. Listing + site funnel honesty (kill “no paid gates” / all-platform Free CSV)

**Shipped:** [Spend fail-closed](1a5b8010-b296-4d11-8cee-156e02a39a82) · [Listing+funnel](72d5340c-8a4e-4aa0-b08c-9046a73ae384)  
**Gate:** `agent-ship-gate.sh` PASS · `mcfly-compliance-spotcheck.sh` PASS · Pages production (`--branch=main`) — apex `mcflyads.com/pricing` shows Free Meta+Google H1; **www.mcflyads.com still stale** (CF custom-domain / alias drift — HUMAN or next tick)  
**Fly:** NOT deployed — app entitlements need explicit `fly deploy` ask  

**HUMAN still open:** Distribution · PCD L1 · emergency contact · install smoke sample OFF · 5 shots + screencast · Submit · Fly redeploy for app gates · optional www→apex Pages alias  
**Next wake:** Fly deploy when asked; founder SUBMIT_NOW board; optional CSB on Settings (Med polish)

---

## Loop report — 2026-07-28 night (Admin desk ↔ demo parity)

**Orient:** Founder SoT = mcflyads.com/demo craft; Fly Admin must catch up for daily use + listing shots. Health ok.

**Outside:** [Admin vs demo audit](75faa13f-db7b-469b-a5de-46eaf009b425) · [Goals+pacing craft](732abaf4-7481-4b21-8d12-c15e421634ad)

**Absorb top 3 AGENT (executed):**
1. Overview decision strip + 4-up KPIs + deltas (pacing visible in shot)
2. Goals sales-only MTD/QTD/YTD semi-gauges + YoY + SAMPLE seed
3. Segmented PeriodControl (MTD/QTD/YTD)

**Shipped:** [Goals gauges](b567f783-2a23-4cc6-95fe-baf01ce6ca8e) · [Overview + periods](4d6cf429-cb04-4974-8f8c-caf7e637ac60)  
**Gate:** `agent-ship-gate.sh` PASS · `sales-goals.test.ts` 7/7  
**Fly:** NOT deployed — Admin craft needs `fly deploy` to appear on live store  

**Verify in Admin (after deploy):** Demo → sample ON → `/app?period=mtd&shot=1` · `/app/goals?shot=1`  
**HUMAN:** Capture 5 listing shots · SUBMIT_NOW board  
**Next wake:** Spend/Close/Mix tab craft parity; soft trust chips vs banner stack; site Goals tab sales-only mirror

---

## Deploy — 2026-07-28 night (founder ask)

**Preflight:** `agent-ship-gate.sh` PASS · `mcfly-compliance-spotcheck.sh` PASS · 291 unit tests · typecheck/build OK  
**Deferred (not blocking):** Spend/Close/Mix demo parity polish; duplicate-title chrome nits  
**Fly:** `fly deploy -a mcfly-analytics` exit 0 · image `deployment-01KYNY58R3XA3N7DCPE8EXQ6DY` · version **73** · health `{"ok":true,"db":"up"}` · worker tick `POST /api/jobs/tick` 200  
**Verify in Admin:** Demo → sample ON → `/app?period=mtd&shot=1` · `/app/goals?shot=1`
