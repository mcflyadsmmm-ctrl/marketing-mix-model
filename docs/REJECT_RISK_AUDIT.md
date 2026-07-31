# Reject-risk audit — Mcfly Analytics (App Store)

**Auditor lane:** B1 App Store compliance + B2 legal/trust.  
**Re-audit date:** 2026-07-30 (~03:46 UTC)  
**Prior pass:** 2026-07-26 evening · critic [`ops/SUBMIT_CRITIC_20260729.md`](./ops/SUBMIT_CRITIC_20260729.md)  
**Verdict:** Still **not submit-ready** until human gates A–E. **Agent hygiene + live host are green.** **Not App Store approved.**

**Companion:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · [`ops/SUBMIT_HANDOFF.md`](./ops/SUBMIT_HANDOFF.md) · [`ops/MAKE_MONEY_20260729.md`](./ops/MAKE_MONEY_20260729.md) · listing [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)

---

## Evidence snapshot (re-verify 2026-07-30)

| Check | Result |
| --- | --- |
| Fly image | **v88** (`app` + `worker` started, iad) |
| `GET https://mcfly-analytics.fly.dev/health` | **200** `ok` + `db:up` |
| Trust URLs: `/support` `/privacy` `/pricing` `/terms` | **200** — Free voice; privacy PCD Level 1 |
| `bash scripts/mcfly-compliance-spotcheck.sh` | **PASSED** |
| Fly bare `/` | App Bridge · **App Store (Free)** · **never** ask to type `.myshopify.com` |
| `/auth/login` | **302 → mcflyads.com** (no domain harvest) |
| Icon `docs/listing-assets/mcfly-app-icon-1200.png` | **1200×1200** PNG; **M-only** ✅ |
| Listing shots 1–5 | **5/5 on disk** — `05-spend-csv.png` is **1600×900 mock** (Polaris-faithful); prefer Admin re-capture ([`ops/SHOT5_20260729.md`](./ops/SHOT5_20260729.md)). Do **not** upload HOLD. |
| SAMPLE strip | `SampleDeskBanner` + `.mcfly-sample-strip` on Home / Spend / Allocation / Settings / Goals / Close / LTV / Connections when SAMPLE ON; shot=`1` hides banner only |
| Billing charges in code | **None live** — behind `MCFLY_BILLING=1` + founder announce ([`BILLING_TIERS.md`](./BILLING_TIERS.md)) |
| Reject-phrase grep (app + site) | No positive claims of invite-only / forever-free bait / true ROAS product / Works with Meta / GMV tax / shop-domain harvest — refuse language only |

**Regression one-liner (trust voice):**

```bash
curl -sS https://mcflyads.com/support | grep -qi 'invite-only' && echo 'BLOCK: invite-only' || echo 'OK: Free listing voice'
```

2026-07-30: **OK** (no invite-only on live support).

---

## Top remaining risks (ranked) — all HUMAN

| # | Risk | Severity | Agent / human | Why it still matters |
| --- | --- | --- | --- | --- |
| 1 | Partner **Distribution** ≠ Shopify App Store | **Critical** | **HUMAN_GATE** | No public listing path |
| 2 | **PCD** questionnaire not submitted | **Critical** | **HUMAN_GATE** (answers in listing §PCD) | Scope / under-disclose reject |
| 3 | **Install smoke** on `devmcflyads` not closed | **Critical** | **HUMAN_GATE** | Broken CSV/MER = instant reject |
| 4 | **Sample desk ON** during reviewer smoke | **Critical** | **HUMAN_GATE** process | 1.1.4 factual-info reject |
| 5 | Listing package incomplete in Partner | **High** | **HUMAN_GATE** | Upload 5 shots + icon + screencast + Free + automated checks |
| 6 | **Demo screencast** (4.5.3) missing | **High** | **HUMAN_GATE** | Required listing package |
| 7 | **Emergency contact** email+phone (4.5.6) | **High** | **HUMAN_GATE** | Partner Settings |
| 8 | `shopify app deploy` for orders webhooks | **High** | **HUMAN_GATE** | Toml topics need Partner registration |

**Closed for agent (do not re-litigate):** invite-only trust lag · shop-domain form · App URL = mcflyads.com · compliance spotcheck · shot #5 missing on disk · SAMPLE strip missing · Fly pre–Free landing · forever-free / true ROAS / Works-with-Meta positive claims in copy.

---

## What’s green (do not re-litigate)

| Gate | Status |
| --- | --- |
| Hosted health + DB (Fly **v88**) | Green |
| App URL on Fly (not mcflyads.com) | Green |
| URL lock `automatically_update_urls_on_dev = false` | Green |
| `AppDistribution.AppStore` in code | Green (Partner flip still human) |
| Compliance topics + spotcheck | Green |
| Uninstall + compliance + orders routes | Green (Partner `shopify app deploy` still human for topic registration) |
| No public shop-domain install form (2.3.1) | Green |
| No Shopify Billing charges until announce | Green |
| Sales GraphQL avoids name/email/phone/address | Green |
| App Bridge CDN on Fly `/` | Green |
| Live trust pages Free + PCD | Green |
| CSV-first Free = Meta + Google | Green |
| Listing icon 1200×1200 M-only | Green (upload still human) |
| Shots 1–5 on disk (shot 5 = mock) | Green (upload + optional re-capture still human) |
| SAMPLE ON strip | Green (human must turn **OFF** before review) |

---

## Exact human gates left

Follow [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) / [`ops/MAKE_MONEY_20260729.md`](./ops/MAKE_MONEY_20260729.md) in order:

1. **A. Distribution** → Shopify App Store → `distribution done`  
2. **B. PCD Level 1** → paste listing §PCD → `pcd done`  
3. **B2. Emergency contact** → email + phone → `emergency contact done`  
4. **C. Install smoke** sample **OFF** → `install works`  
5. **D. Listing assets** — 5 shots + icon + screencast + Free + paste + automated checks → `assets uploaded`  
6. **Ops.** `shopify app deploy` — register orders webhook topics  
7. **E. Submit** → `submitted`  

**Agent cannot fake these.** Honest readiness: agent hygiene ~92% · human Partner path ~32% · **not approval-ready.** **Do not claim approved.**

---

## Historical note (2026-07-24 evening — superseded)

Prior audit correctly flagged live Pages invite-only / soft-launch pricing / missing PCD privacy copy. Fixed by Pages publishes (verified 2026-07-26+). Prior “4/5 shots / need #5” row is **superseded** — `05-spend-csv.png` exists as mock (2026-07-29).
