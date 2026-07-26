# Reject-risk audit — Mcfly Analytics (App Store)

**Auditor lane:** B1 App Store compliance (live Shopify AI self-review requirements) + B2 legal/trust.  
**Re-audit date:** 2026-07-24 **evening** (~04:57–05:00 UTC; MT evening 2026-07-23)  
**Prior pass:** 2026-07-24 04:15 UTC  
**Verdict:** Still **not submit-ready** until human gates A–E (+ Pages publish). In-repo agent hygiene closed for Free listing voice, PCD privacy wording, App Bridge CDN, Demo OFF clarity across desk tabs.

**Companion runbook:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · listing draft [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)

---

## Evidence snapshot (re-verify 2026-07-24 evening)

| Check | Result |
| --- | --- |
| `GET https://mcfly-analytics.fly.dev/health` | **200** `{"ok":true,"service":"mcfly-analytics","db":"up","ts":"2026-07-24T04:57:35.926Z"}` |
| Trust URLs HTTP: `/` `/support` `/privacy` `/terms` `/pricing` | **200** |
| `POST /webhooks/compliance` empty body, no HMAC | **400** |
| `POST /webhooks/compliance` + fake `X-Shopify-Hmac-Sha256` | **401** ✅ |
| `bash scripts/mcfly-compliance-spotcheck.sh` | **exit 0** PASSED (incl. hosted `/health`) |
| Icon `docs/listing-assets/mcfly-app-icon-1200.png` | **1200×1200** PNG; **M-only** ✅ |
| `app/shopify.app.toml` + SCOPES | `application_url` = Fly; `read_orders,read_customers`; URL lock `automatically_update_urls_on_dev = false` ✅ |
| Compliance skill | Allows minimal `read_customers` (id + `numberOfOrders`) ✅ |
| Live `mcflyads.com/support` vs local `site/support.html` | **LAG on live only** — live still “installs are invite-only”; **local GREEN:** App Store Free |
| Live `/pricing` vs local | **LAG** — live: “Free during launch / Join free launch”; local: “Free on the App Store now” |
| Live `/privacy` vs local | **LAG** — live: no `numberOfOrders` / opaque-id / `read_customers` disclosure; local discloses scopes + GDPR empty-CRM honesty |
| Demo / shot / sample OFF | Demo OFF alert + Cash MER / Spend / Allocation / Settings SAMPLE banners; shot=`1` hides banner but **numbers stay sample** until OFF ✅ |
| App Bridge CDN in live Fly `/` HTML | **Green live** — `cdn.shopify.com/shopifycloud/app-bridge.js` + `shopify-api-key` meta present |
| Bare App URL (`/`) voice | **Green live** — App Store Free + Partner invite; no shop-domain form |
| Billing charges in code | **None** — no `appSubscriptionCreate` / Billing API ✅ |
| Shop-domain install form | **None** — `auth.login` redirects to mcflyads.com; bare `/` refuses domain collection ✅ |

---

## What was RED → NOW GREEN (agent fixes this evening pass)

| Was | Now |
| --- | --- |
| Allocation only had a “Sample desk” chip (weak 1.1.4) | **Fixed** — warning banner + OFF → Demo + shot=`1` honesty |
| Cash MER / Spend SAMPLE copy soft on shot vs OFF | **Fixed** — explicit: shot hides banner only; OFF required for review |
| Settings silent when sample desk ON elsewhere | **Fixed** — warning banner when sample enabled |
| Reviewer notes less structured for Free + CSV + PCD | **Fixed** — paste block in `APP_STORE_LISTING.md` §Reviewer notes |

**Not green live:** Cloudflare Pages has not published fixed trust pages — see risk #4. **Local repo trust HTML is green** (support/pricing/privacy Free + PCD).

---

## Local vs live — agent stop signal

Do **not** treat local `site/support.html` meta as “Invite-only” RED. Remaining mismatch is **Pages deploy only** (`HUMAN_GATE`).

**Regression one-liner** (run before editing site CSS for “invite-only” bugs):

```bash
curl -sS https://mcflyads.com/support | grep -qi 'invite-only' && echo 'BLOCK: live support still invite-only → publish site/** to Pages' || echo 'OK: live support voice matches Free listing'
```

Evening evidence: **BLOCK** (live still invite-only). If local grep passes but curl fails → **stop agent fixes**; publish Pages ([`SUBMIT_NOW.md`](./SUBMIT_NOW.md) §F).

---

## Top remaining risks (ranked)

| # | Risk | Severity | Agent / human | Evidence | Why it still matters |
| --- | --- | --- | --- | --- | --- |
| 1 | Partner **Distribution** not flipped to Shopify App Store | **High** | **HUMAN_GATE** | `SUBMIT_NOW` §1 open | Cannot complete public listing while Custom/unlisted. |
| 2 | **Protected Customer Data** questionnaire not submitted (`read_orders` + `read_customers`) | **High** | **HUMAN_GATE** (answers ready in listing §PCD) | TOML + sales loader; listing markets new/returning | Under-disclose → delay/reject; over-claim CRM → reject. |
| 3 | **Sample desk left ON** (or Demo treated as live) during reviewer smoke | **High** | **HUMAN_GATE** process | Demo + desk banners; playbook | Mock metrics → functional / 1.1.4 reject. Shot mode hides banner but numbers stay sample — must **OFF** for live smoke. |
| 4 | **Live trust-URL copy lag** (support / pricing / privacy) vs local Free + PCD honesty | **Med–High** | **HUMAN_GATE** Pages deploy | Live support invite-only; live privacy lacks `numberOfOrders` / `read_customers` | Reviewer opens trust URLs from listing → contradicts Free public submit. |
| 5 | **Install smoke on `devmcflyads` not done** | **High** | **HUMAN_GATE** | Checklist open | Broken install / blank MER / CSV fail = instant reject. |

**Also open (human):**

| # | Risk | Severity | Agent / human | Evidence |
| --- | --- | --- | --- | --- |
| 6 | **Listing screenshots missing** (5 unique Admin shots) | **Med–High** | **HUMAN_GATE** | `LISTING_VISUAL_PACK.md` |
| 7 | **Partner pricing must stay Free** (no Billing yet) | **Med** | **HUMAN_GATE** | Local pricing honesty ready; live pricing still soft-launch voice |

---

## What’s green (approval hygiene)

| Gate | Status |
| --- | --- |
| Hosted health + DB | Green (2026-07-24T04:57:35.926Z) |
| App URL on Fly (not mcflyads.com) | Green |
| URL lock `automatically_update_urls_on_dev = false` | Green |
| `AppDistribution.AppStore` in code | Green (Partner flip still human) |
| Compliance topics + bad HMAC → 401 | Green |
| Uninstall + compliance routes | Green |
| No public shop-domain install form (2.3.1) | Green |
| No Shopify Billing charges in app | Green |
| Sales GraphQL avoids name/email/phone/address | Green |
| App Bridge CDN + `@shopify/app-bridge-react` (2.2.3) | Green **live** on Fly `/` |
| Bare App URL Free listing voice | Green **live** on Fly `/` |
| CSV spend path + Other channel in listing | Green |
| Listing icon 1200×1200 **M-only** | Green (upload still human) |
| SCOPES examples + compliance skill | Green |
| Pricing / support / privacy honesty | **Green in repo**; **live Pages lag** |
| Demo + shot mode + sample OFF guidance | Green in-app (all desk tabs) |
| Reviewer notes Free + CSV + minimal PCD | Green — paste-ready in listing SoT |
| Compliance spotcheck | Green — exit **0** (2026-07-24 evening) |

---

## Exact human gates left

1. **A. Distribution** — Partner Dashboard → Shopify App Store → reply **`distribution done`**  
2. **B. PCD** — request access; paste answers from `APP_STORE_LISTING.md` §PCD (**include `read_customers`**) → **`pcd done`**  
3. **C. Install smoke** on `devmcflyads` — Settings → CSV → Cash MER → Allocation; **Demo sample desk OFF** → **`install works`**  
4. **D. Listing assets** — upload M-only icon; 5 screenshots; Pricing **Free**; paste reviewer notes → **`assets uploaded`**  
5. **E. Submit** — click Submit → **`submitted`**  

**Plus (publish before reviewer opens trust URLs):**

6. **Pages deploy** — publish `site/**` so live `/support` `/pricing` `/privacy` match local Free + PCD copy → **`pages live`**

**Optional:** Fly redeploy so SAMPLE-banner copy hardenings from this evening pass are on production Admin HTML (health/App Bridge already live; desk banner text is in-repo until next deploy — parent owns Fly).

---

## Agent-fixable (this evening pass)

| Priority | Item | Status |
| --- | --- | --- |
| **P1** | Demo OFF / shot-mode deception clarity (1.1.4) across desk | **Done** — Demo + Cash MER + Spend + Allocation + Settings |
| **P1** | Reviewer notes paste-perfect Free + CSV + minimal PCD | **Done** — `docs/APP_STORE_LISTING.md` |
| **P0** | **Cloudflare Pages publish** so live trust URLs match repo | **Open — HUMAN_GATE** |
| — | Bare App URL / App Bridge / privacy local | **Already green** (prior + live Fly verified) |
| — | Do **not** add pixels, live ad OAuth, Billing charges, or `read_all_orders` for this Submit | Religion |

---

## B1 skill-format summary (live requirements 2026-07-24 evening)

Fetched: https://shopify.dev/docs/apps/launch/app-store-review/app-store-ai-self-review-requirements

### Summary

✅ **Likely passing:** 28  
❌ **Likely failing:** 0  
⚠️ **Needs review:** 4  
⏭️ **Groups skipped:** 10 _(see below)_

### ⚠️ Requirements that need review

⚠️ **1.1.4 Use only factual information**

**Why this needs attention:** Sample desk injects deterministic demo sales/spend. Shot mode hides the SAMPLE banner while numbers remain sample — fine for listing captures if process is followed; risky if left ON during reviewer smoke. In-app OFF warnings hardened on all desk tabs this pass.

**What was detected:** `sample-desk.server.ts`, Demo OFF alert, SAMPLE banners on Cash MER / Spend / Allocation / Settings; reviewer notes require OFF.

⚠️ **1.2.1 Use Shopify App Pricing or the Shopify Billing API**

**Why this needs attention:** No Billing API in code (correct for Free). Site mentions ~$79 later — listing must stay Free until Billing ships. Live pricing still soft-launch voice until Pages publish.

**What was detected:** No `appSubscriptionCreate`; listing docs say Free; local pricing honest; live pricing lag.

⚠️ **2.2.3 Use the latest version of Shopify App Bridge**

**Why this needs attention:** Live Fly `/` HTML includes CDN script + api-key meta + `@shopify/app-bridge-react` / `AppProvider` in-repo.

**What was detected:** Live curl of Fly `/` shows `cdn.shopify.com/shopifycloud/app-bridge.js`; package `^4.2.4`.

⚠️ **3.1.1 Use a valid TLS/SSL certificate**

**Why this needs attention:** Fly serves HTTPS (`curl` health 200 over https). Certificate validity beyond curl not fully audited here.

**What was detected:** `https://mcfly-analytics.fly.dev/health` 200.

### ❌ Requirements that are likely failing

_(none found in codebase this pass)_

### Skipped groups

- **5.1 Online store** — No theme app extension (`shopify.extension.toml` type=theme not detected)
- **5.2 Payment** — No payment extension / `write_payment_gateway`
- **5.3 Payment facilitator** — Opt-in not requested
- **5.4 Purchase option** — No subscription / payment-mandate scopes
- **5.5 Product sourcing** — Opt-in not requested
- **5.6 Checkout customization** — No checkout UI extension targets
- **5.7 Sales channel** — No `channel_config` extension
- **5.8 Post purchase** — No post-purchase extension
- **5.9 Mobile app builders** — Opt-in not requested
- **5.10 Donation** — Opt-in not requested

### Resources

- [App Store requirements documentation](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Best practices for apps](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices)
- [About billing for your app](https://shopify.dev/docs/apps/launch/billing)
- [Submitting your app for review](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review)

---

## Scorecard summary

| Category | Reject risk |
| --- | --- |
| Technical compliance (HMAC, health, scopes wiring, 2.3.1, App Bridge live) | **Low** |
| PCD / scopes honesty (in-repo) | **Low** agent / **High until human submits PCD** |
| Listing ↔ product match | **Low** |
| Reviewer experience (sample desk / install smoke) | **High until human smoke + sample OFF** |
| Trust URLs live copy | **Med–High until Pages publish** (URLs 200; copy stale / invite-only) |
| Pricing honesty | **Low in repo**; **Med live until Pages**; **Low if Partner marks Free** |

**Ready for Marty to click Submit?** **No** — close human gates A–E, and **publish Pages** before review so trust URLs do not contradict Free + PCD. Agent B1/B2 P0/P1 hygiene closed in-repo this evening pass.
