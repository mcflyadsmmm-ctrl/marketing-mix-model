# Submit-ready scorecard — 2026-07-27 (go-live loop)

**Purpose:** Honest craft vs human-gate readiness for first **Free** App Store submit.  
**SoT:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) · [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md)  
**Bug-hunter loop:** [`MEGAPROMPT_GO_LIVE_BULLETPROOF.md`](./MEGAPROMPT_GO_LIVE_BULLETPROOF.md)

---

## Scorecard

| Lane | Score | Notes / evidence |
| --- | ---: | --- |
| **Agent hygiene** (HMAC, Bridge, scopes, no domain form, CSV religion) | **~88** | Health ok; compliance historically PASS — **P0 vibe bugs still open** (CSV TZ/sci notation, sample collision, sales failure UX, sealed facts) |
| **Site / trust URLs live** | **~95** | mcflyads.com 200; cache **`20260728a`** deployed 2026-07-27; Free support voice |
| **App UX craft** | **~80** | Desk + LTV tab + pacing shipped — install smoke **not** proven; bulletproof pass not done |
| **Listing package** | **~40** | Copy + icon ready; **0/5 shots**; screencast missing |
| **Submit-human** | **~30** | Distribution / PCD / emergency contact / smoke / shots / Submit open |
| **Overall submit-ready** | **~38%** | Site green; agent P0 hardening incomplete; **human gates dominate** — **do not Submit** |

### Layer score (from go-live megaprompt)

| Layer | Progress |
| --- | --- |
| **A — Agent** (9 checks) | **~5/9** — health + site live; ship-gate/compliance need re-run after P0 fixes; vibe P0 open; listing docs ready; install not agent-claimable |
| **B — Human** (7 phrases) | **0/7** — none of: `distribution done` · `pcd done` · `emergency contact done` · `pages live` · `install works` · `assets uploaded` · `submitted` |

---

## What’s missing (ranked)

### Agent-fixable before claiming “ready”
1. Bulletproof CSV + shop-local day stamps + sample-ON block  
2. Honest sales failure / freshness / historyLimited classification  
3. Sales honesty label (gross · refunds not netted; cancel/test disclosure)  
4. Re-run ship-gate + compliance; optional Fly redeploy after app P0  
5. (P1) recon ±5%, allocation copy, below-BE in-app only when margin known  

### Human-only (blocks 100%)
1. Partner **Distribution** → Shopify App Store → `distribution done`  
2. **PCD Level 1** → `pcd done`  
3. **Emergency contact** → `emergency contact done`  
4. Spot-check trust pages → `pages live`  
5. **Install smoke** sample OFF on `devmcflyads` → `install works`  
6. 5 shots + icon + screencast + Free pricing → `assets uploaded`  
7. Submit → `submitted`  

---

## Single next actions

**Agent (this loop):** start [`MEGAPROMPT_GO_LIVE_BULLETPROOF.md`](./MEGAPROMPT_GO_LIVE_BULLETPROOF.md) P0 vibe fixes.  

**Human (parallel):** Partner → Distribution = Shopify App Store, then reply **`distribution done`**.

Do **not** Submit until smoke + shots + PCD + Distribution are done.
