# Submit tomorrow — agent-fixed vs human gates

**Last agent pass:** 2026-07-30 — reject-risk re-audit (Fly **v88**, shot 5 mock on disk, SAMPLE strip, compliance green); pricing title → Mcfly Analytics; Connections SAMPLE strip.  
**Goal:** public App Store submit for **Free** cash MER desk.  
**Reject scorecard:** [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md) · money path [`ops/MAKE_MONEY_20260729.md`](./ops/MAKE_MONEY_20260729.md)

---

## Fixed in code / host (agent) — evidence

| Issue | Fix | Evidence |
| --- | --- | --- |
| Privacy lag vs new/returning | Privacy discloses `read_orders` + minimal `read_customers` (opaque id / numberOfOrders); GDPR empty-CRM | `site/privacy.html` (**Pages Free closed**) |
| Pricing vs Free listing conflict | Pricing leads with **App Store Free now**; ~$79 later via Billing | `site/pricing.html` (**Pages Free closed**) |
| Support invite-only vs Free listing | Meta + body: App Store Free + Partner invite; no shop-domain form | `site/support.html` (**Pages Free closed**) |
| Bare App URL invite-only voice | Fly `/` says App Store Free · never type `.myshopify.com` | `app/app/routes/_index/route.tsx` (**Fly v88 live**) |
| App Bridge head (2.2.3) | CDN `app-bridge.js` + `shopify-api-key` meta | `app/app/root.tsx` (**Fly v88 live**) |
| Demo OFF / shot deception | Shot hides banner; numbers stay sample until OFF — called out on Demo | `app.demo.tsx` |
| AppDistribution + URL lock | `AppDistribution.AppStore`; `automatically_update_urls_on_dev = false` | code + toml |
| Compliance HMAC | Invalid HMAC header → **401**; empty POST w/o headers → **400** | curl 2026-07-23 |
| Trust URLs respond | privacy / support / terms / pricing **200** | curl (copy may lag) |
| Premium desk UI | Lifetimely-clean scoreboard; tabs Cash MER / Spend / Allocation / Settings / Demo | `mcfly-desk.css` + routes |
| Spend CSV UX | Wide template all channels incl. Other | `spend-csv.ts`, spend routes |
| Sales metrics | sales, orders, new, returning, AOV, guest | `shopify-sales.server.ts` |
| Listing icon 1200×1200 M-only | No wordmark | `docs/listing-assets/mcfly-app-icon-1200.png` |
| Listing visual story | Captions + shot list; sample ON + shot=`1`; **OFF before review** | `LISTING_VISUAL_PACK.md`, Demo tab |
| Fly boot false-fail | Health grace_period **90s** | `fly.toml` |
| Scopes on Fly + examples | `SCOPES=read_orders,read_customers` | `fly.toml`, `shopify.app.toml`, `.env.example` |
| Compliance skill | Minimal `read_customers` allowed | `.cursor/skills/mcfly-shopify-compliance/` |
| Ship-gate / compliance | Scripts pass before claim | spotcheck exit **0** this re-audit |

---

## Agent-fixable still open (not inventing product)

| Issue | Recommended fix | Owner lane |
| --- | --- | --- |
| Live mcflyads.com trust pages Free + PCD copy | **Closed** — re-curl before Submit | Spot-check only |
| Fly Free landing + App Bridge | **Closed** — Fly **v88** | Spot-check only |
| Connections SAMPLE strip | **Closed** this tick — **needs Fly deploy** for reviewer | Parent deploy |
| Pricing title Mcfly Analytics | **Closed** this tick — **needs Pages deploy** | Parent deploy |
| Optional: default sample desk OFF after seed | Only if founder asks | App |

Prior open items (support meta Free, skill `read_customers`, listing Other, SCOPES examples, bare-URL Free voice, privacy PCD wording, App Bridge CDN, Demo OFF clarity, Pages Free, shot 5 on disk) are **done in repo**.

---

## YOU must do (cannot be automated)

### A. Partner — Distribution
https://dev.shopify.com/dashboard/227535001/apps/400772497409 → **Shopify App Store**

### B. Protected Customer Data
Request access for **orders +** opaque customer **id / numberOfOrders** (no name/email/address).  
Paste answers from `docs/APP_STORE_LISTING.md` §PCD.

### C. Install smoke on `devmcflyads`
**Demo → sample desk OFF** (live Shopify till).  
Settings → CSV template → Cash MER (sales/orders/new/returning) → Allocation → reply **`install works`**

### D. Listing assets
1. Upload icon: `docs/listing-assets/mcfly-app-icon-1200.png` (M-only 1200×1200)  
2. Capture 5 screenshots per `LISTING_VISUAL_PACK.md` (sample ON + shot mode OK for captures only)  
3. Pricing **Free**; paste reviewer notes  

### E. Submit
Submit for review. Approval is still **days–weeks**.

### F. Pages publish (before reviewer opens trust URLs)
**Closed** — Pages Free lag closed 2026-07-26. Before Submit, spot-check live `/support` `/pricing` `/privacy` still match Free + PCD voice (re-publish only if curl shows drift).

---

## Out of scope for this Submit
BigQuery / LTV ZIP history / live ad OAuth / Billing charges / `read_all_orders`
