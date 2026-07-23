# Submit tomorrow — agent-fixed vs human gates

**Last agent pass:** 2026-07-23 (reject-risk **re-audit** after Free support / M-only icon / SCOPES / skill / craft swarm)  
**Goal:** public App Store submit for **Free** cash MER desk.  
**Reject scorecard:** [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md)

---

## Fixed in code / host (agent) — evidence

| Issue | Fix | Evidence |
| --- | --- | --- |
| Privacy lag vs new/returning | Privacy discloses order totals + opaque customer id / numberOfOrders; no CRM | `site/privacy.html` (**local**; live Pages still lagging) |
| Pricing vs Free listing conflict | Pricing leads with **App Store Free now**; ~$79 later via Billing | `site/pricing.html` (**local**; live lagging) |
| Support invite-only vs Free listing | Body: App Store Free + Partner invite; no shop-domain form | `site/support.html` (**local**; live still invite-only) |
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
| Live mcflyads.com trust pages lag local Free + PCD copy | **Publish Cloudflare Pages** (`site/**`) — see `SITE_CRAFT_NEXT.md` | **Human deploy** (P0 before review) |
| `support.html` meta/OG still say “Invite-only” | Align meta with App Store Free body | Site (P2 cosmetic) |
| Optional: default sample desk OFF after seed | Only if founder asks | App |

Prior open items (support body Free, skill `read_customers`, listing Other, SCOPES examples) are **done in repo**.

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
Deploy local `site/support.html` + `pricing.html` + `privacy.html` so live no longer says invite-only / omits `numberOfOrders` disclosure.

---

## Out of scope for this Submit
BigQuery / LTV ZIP history / live ad OAuth / Billing charges / `read_all_orders`
