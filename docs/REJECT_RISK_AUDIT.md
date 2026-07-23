# Reject-risk audit — Mcfly Analytics (App Store)

**Auditor lane:** documentation + evidence only (no product invention).  
**Re-audit date:** 2026-07-23 (post-fixes pass — support Free copy, M-only 1200 icon, SCOPES examples, compliance skill, craft swarm)  
**Prior pass:** earlier 2026-07-23 (same day)  
**Verdict:** Still **not submit-ready** until human gates A–E close. Agent hygiene for listing/scopes/demo guidance is largely closed in-repo; **live Cloudflare Pages lag** is the main remaining agent-adjacent trust risk.

**Companion runbook:** [`SUBMIT_TOMORROW.md`](./SUBMIT_TOMORROW.md) · listing draft [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)

---

## Evidence snapshot (re-audit 2026-07-23)

| Check | Result |
| --- | --- |
| `GET https://mcfly-analytics.fly.dev/health` | **200** `{"ok":true,"service":"mcfly-analytics","db":"up",...}` |
| Trust URLs live: `/` `/support` `/privacy` `/terms` `/product` `/pricing` | **200** |
| `POST /webhooks/compliance` empty body, no HMAC | **400** |
| `POST /webhooks/compliance` + fake `X-Shopify-Hmac-Sha256` | **401** ✅ |
| `bash scripts/mcfly-compliance-spotcheck.sh` | **exit 0** PASSED |
| Icon `docs/listing-assets/mcfly-app-icon-1200.png` | **1200×1200** PNG; **M-only** (no wordmark) ✅ |
| `shopify.app.toml` + `fly.toml` + `app/.env.example` SCOPES | `read_orders,read_customers` ✅ |
| Compliance skill | Allows minimal `read_customers` (id + `numberOfOrders`) ✅ |
| Live `mcflyads.com/support` vs local `site/support.html` | **LAG** — live still “invite-only / listing after partners”; local says **App Store Free now** |
| Live `/pricing` vs local | **LAG** — live “free launch / join waitlist”; local “Free on the App Store now” |
| Live `/privacy` vs local | **LAG** — live omits opaque id / `numberOfOrders` new-returning method; local discloses it |
| Demo / shot / sample OFF | In-product: Demo tab ON/OFF; shot=`1` hides SAMPLE banner; as-of still “sample till”; reviewer notes say OFF before live smoke ✅ |

---

## What was RED → NOW GREEN (agent fixes this pass)

| Was (earlier same day) | Now |
| --- | --- |
| Support body claimed invite-only / listing later (**High** reject-copy) | **Green in repo** — `site/support.html` App Store Free + Partner-invite honesty |
| Compliance skill banned `read_customers` | **Green** — skill matches TOML + PCD |
| `.env.example` / docs `SCOPES=read_orders` only | **Green** — examples = `read_orders,read_customers` |
| Listing Other channel under-mentioned | **Green** in `APP_STORE_LISTING.md` |
| Icon not verified M-only | **Green** — 1200×1200 M-only asset in `docs/listing-assets/` |
| Spotcheck / craft demo guidance unclear | **Green** — spotcheck exit 0; Demo + shot mode + **OFF before review** documented in UI + playbook |

**Not green live:** Cloudflare Pages has not published the fixed trust pages — see risk #4.

---

## Top remaining risks (ranked)

| # | Risk | Severity | Agent / human | Evidence | Why it still matters |
| --- | --- | --- | --- | --- | --- |
| 1 | Partner **Distribution** not flipped to Shopify App Store | **High** | **Human-only** | `SUBMIT_TOMORROW` §A open | Cannot complete public listing while Custom/unlisted. |
| 2 | **Protected Customer Data** questionnaire not submitted (`read_orders` + `read_customers`) | **High** | **Human-only** (answers ready in listing §PCD) | TOML + sales loader; listing markets new/returning | Under-disclose → delay/reject; over-claim CRM → reject. |
| 3 | **Sample desk left ON** (or Demo treated as live) during reviewer smoke | **High** | **Human** process | `app.demo.tsx`, `app._index.tsx`; playbook | Mock metrics → functional reject. Shot mode hides banner but as-of still says sample till — must **OFF** for live smoke. |
| 4 | **Live trust-URL copy lag** (support / pricing / privacy) vs local Free + PCD honesty | **Med–High** | **Human Pages deploy** (agent already fixed local) | Live support: “installs are invite-only”; live privacy lacks `numberOfOrders` disclosure | Reviewer opens trust URLs from listing → invite-only + thin privacy contradicts Free public submit. |
| 5 | **Install smoke on `devmcflyads` not done** | **High** | **Human-only** | Checklist open | Broken install / blank MER / CSV fail = instant reject. |
| 6 | **Listing screenshots missing** (5 unique Admin shots) | **Med–High** | **Human** capture (pack ready) | `LISTING_VISUAL_PACK.md` | Empty/duplicate/marketing-site shots fail 4.4.x. |
| 7 | **Partner pricing must stay Free** (no Billing yet) | **Med** | **Human** in Partner UI | Local pricing honesty ready; live pricing still soft-launch voice | Paid without Billing = hard reject. |
| 8 | Local support **meta** still says “Invite-only install” | **Low** | **Agent-fixable** (meta only) | `site/support.html` lines ~7, ~16 | Body is Free; meta/OG lag can confuse scrapers after Pages deploy. |
| 9 | Optional: default sample desk OFF after seed | **Low** | Agent only if founder asks | Demo flow | Process notes already cover OFF. |

---

## What’s green (approval hygiene)

| Gate | Status |
| --- | --- |
| Hosted health + DB | Green |
| App URL on Fly (not mcflyads.com) | Green |
| URL lock `automatically_update_urls_on_dev = false` | Green |
| `AppDistribution.AppStore` in code | Green (Partner flip still human) |
| Compliance topics + bad HMAC → 401 | Green |
| Uninstall + compliance routes | Green (spotcheck) |
| No public shop-domain install form (2.3.1) | Green |
| Sales GraphQL avoids name/email/phone/address | Green |
| Connections OAuth stubs hidden | Green |
| CSV spend path + Other channel in listing | Green |
| Listing icon 1200×1200 **M-only** | Green (upload still human) |
| SCOPES examples + compliance skill | Green |
| Pricing / support / privacy honesty | **Green in repo**; **live Pages lag** |
| Demo + shot mode + sample OFF guidance | Green in-app |
| Compliance spotcheck | Green; optional `read_customers` |

---

## Exact human gates left

Unchanged blockers for Submit:

1. **A. Distribution** — Partner Dashboard → Shopify App Store  
2. **B. PCD** — request access; paste answers from `APP_STORE_LISTING.md` §PCD (**include `read_customers`**)  
3. **C. Install smoke** on `devmcflyads` — Settings → CSV → Cash MER → Allocation; reply `install works`; **Demo sample desk OFF**  
4. **D. Listing assets** — upload M-only icon; 5 screenshots per visual pack; Pricing **Free**; paste reviewer notes  
5. **E. Submit** — click Submit (approval still days–weeks)  

**Plus (publish before reviewer opens trust URLs):**

6. **Pages deploy** — publish `site/**` so live `/support` `/pricing` `/privacy` match local Free + PCD copy (see `SITE_CRAFT_NEXT.md`)

---

## Agent-fixable (docs-only audit — no invent product)

| Priority | Item | Status |
| --- | --- | --- |
| — | Support Free App Store body copy | **Done** (local) |
| — | Compliance skill + SCOPES examples | **Done** |
| — | Listing Other + PCD answers | **Done** |
| — | M-only 1200 icon in repo | **Done** |
| — | Craft swarm Demo / shot / OFF guidance | **Done** |
| **P0** | **Cloudflare Pages publish** so live trust URLs match repo | **Open — human deploy** (not inventable in app code) |
| **P2** | Align `support.html` meta/OG away from “Invite-only” | Open (cosmetic; after or with Pages) |
| **P2** | Optional default sample desk OFF | Only if founder asks |
| — | Do **not** add pixels, live ad OAuth, Billing charges, or `read_all_orders` for this Submit | Religion |

---

## Scorecard summary

| Category | Reject risk |
| --- | --- |
| Technical compliance (HMAC, health, scopes wiring, 2.3.1) | **Low** |
| PCD / scopes honesty (in-repo) | **Low** agent / **High until human submits PCD** |
| Listing ↔ product match | **Low** |
| Reviewer experience (sample desk / install smoke) | **High until human smoke + sample OFF** |
| Trust URLs live copy | **Med–High until Pages publish** (URLs 200; copy stale) |
| Pricing honesty | **Low in repo**; **Med live until Pages**; **Low if Partner marks Free** |

**Ready for Marty to click Submit?** **No** — close human gates A–E, and **publish Pages** before review so trust URLs do not contradict Free + PCD. Agent reject-hygiene for scopes/skill/icon/demo is closed in-repo.
