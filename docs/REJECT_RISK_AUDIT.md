# Reject-risk audit — Mcfly Analytics (App Store)

**Auditor lane:** B1 App Store compliance (live Shopify AI self-review requirements) + B2 legal/trust.  
**Re-audit date:** 2026-07-26 (evening refresh)  
**Prior pass:** 2026-07-24 evening  
**Verdict:** Still **not submit-ready** until human gates A–E. **Agent hygiene + live trust URLs are green** (Pages Free + PCD lag from 2026-07-24 is **closed**).

**Companion runbook:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · listing draft [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)

---

## Evidence snapshot (re-verify 2026-07-26)

| Check | Result |
| --- | --- |
| `GET https://mcfly-analytics.fly.dev/health` | **200** `ok` + `db:up` |
| Trust URLs: `/support` `/privacy` `/pricing` `/terms` | **200** — **Free** voice; privacy discloses `numberOfOrders` / `read_customers` |
| `POST /webhooks/compliance` empty body | **400** |
| `POST /webhooks/compliance` + fake HMAC | **401** ✅ |
| Fly bare `/` | App Bridge CDN + Free voice; **no** shop-domain form |
| `/auth/login` | **302 → mcflyads.com** (no domain harvest) |
| Icon `docs/listing-assets/mcfly-app-icon-1200.png` | **1200×1200** PNG; **M-only** ✅ |
| Scopes | `read_orders,read_customers,read_all_orders` (opaque id + `numberOfOrders` only; deep history for till LTV — Partner must approve `read_all_orders`) |
| Sample / `?shot=1` | Banners on desk tabs; shot hides banner only — numbers stay sample until OFF |
| Billing charges in code | **None** |
| Listing screenshots | **0/5** — `docs/listing-assets/shots/` empty (human) |

**Regression one-liner (trust voice):**

```bash
curl -sS https://mcflyads.com/support | grep -qi 'invite-only' && echo 'BLOCK: invite-only' || echo 'OK: Free listing voice'
```

2026-07-26: **OK** (no invite-only on live support).

---

## Top remaining risks (ranked) — all HUMAN

| # | Risk | Severity | Agent / human | Why it still matters |
| --- | --- | --- | --- | --- |
| 1 | Partner **Distribution** ≠ Shopify App Store | **Critical** | **HUMAN_GATE** | No public listing path |
| 2 | **PCD** questionnaire not submitted | **Critical** | **HUMAN_GATE** (answers in listing §PCD) | Scope / under-disclose reject |
| 3 | **Install smoke** on `devmcflyads` not closed | **Critical** | **HUMAN_GATE** | Broken CSV/MER = instant reject |
| 4 | **Sample desk ON** during reviewer smoke | **Critical** | **HUMAN_GATE** process | 1.1.4 factual-info reject |
| 5 | **5 listing screenshots** missing | **High** | **HUMAN_GATE** | Listing incomplete |
| 6 | **Demo screencast** (4.5.3) missing | **High** | **HUMAN_GATE** | Required listing package — now in SUBMIT_NOW |
| 7 | **Emergency contact** email+phone (4.5.6) | **High** | **HUMAN_GATE** | Partner Settings — now in SUBMIT_NOW |
| 8 | Partner paste: Pricing **Free** + copy + icon + automated checks | **High** | **HUMAN_GATE** | Wrong pricing / empty fields |

**Closed since 2026-07-24:** Live trust-URL Free + PCD lag (Pages publish done). Spot-check before Submit; do not block on stale “Pages lag” claims.

---

## What’s green (do not re-litigate)

| Gate | Status |
| --- | --- |
| Hosted health + DB | Green |
| App URL on Fly (not mcflyads.com) | Green |
| URL lock `automatically_update_urls_on_dev = false` | Green |
| `AppDistribution.AppStore` in code | Green (Partner flip still human) |
| Compliance topics + bad HMAC → 401 | Green |
| Uninstall + compliance routes | Green |
| No public shop-domain install form (2.3.1) | Green |
| No Shopify Billing charges in app | Green |
| Sales GraphQL avoids name/email/phone/address | Green |
| App Bridge CDN on Fly `/` | Green |
| Live trust pages Free + PCD | Green (2026-07-26 curl) |
| CSV-first spend (no fake Meta/Google OAuth) | Green |
| Listing icon 1200×1200 M-only | Green (upload still human) |

---

## Exact human gates left

Follow [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) in order:

1. **A. Distribution** → Shopify App Store → `distribution done`  
2. **B. PCD Level 1** → paste listing §PCD (no name/email/phone) → `pcd done`  
3. **B2. Emergency contact** → email + phone → `emergency contact done`  
4. **C. Install smoke** sample **OFF** → `install works`  
5. **D. Listing assets** — 5 shots + icon + screencast + Free + paste + automated checks → `assets uploaded`  
6. **E. Submit** → `submitted`  

**Agent cannot fake these.** Honest readiness: agent hygiene ~85–90% · human gates ~35% · **not approval-ready** until A–E close. **100% compliance cannot be proven from code alone.**

---

## Historical note (2026-07-24 evening — superseded)

Prior audit correctly flagged live Pages invite-only / soft-launch pricing / missing PCD privacy copy. Those live mismatches were fixed by subsequent Pages publishes (verified 2026-07-26). Keep old detail only for archaeology — **do not treat Pages lag as open**.
