# Stranger smoke — 2026-09-15

**Lane:** Ops. Curl + briefs only. No Admin session, no Partner Pricing login, no deploy, no ads.

**Probe time:** 2026-09-15 ~22:34 America/Denver (`/health` `ts` `2026-09-16T04:34:12.565Z`).

Live listing: https://apps.shopify.com/mcfly-analytics-public  
Site: https://mcflyads.com  
App origin: https://mcfly-analytics.fly.dev

---

## Curl (follow redirects)

UA: `Mozilla/5.0 (compatible; McflyOpsSmoke/2026-09-15)`. Every URL below: **HTTP/2 200**, **0 redirects** (`num_redirects=0`).

| URL | HTTP | Redirects | Snippet / note |
| --- | --- | --- | --- |
| https://apps.shopify.com/mcfly-analytics-public | **200** | 0 | Title **Mcfly Analytics**. Header **Pricing $39/month. Free trial available.** Rating **0.0 (0 Reviews)** · **No reviews yet**. Pricing card **Mcfly Analytics $39 / month** · **7-day free trial, then $39/month**. **Not Pro** on this HTML (was **Pro** on 2026-09-08). String **Free plan** not in listing HTML. |
| https://mcflyads.com | **200** | 0 | Title + H1 still **Deeper Shopify numbers Analytics does not show.** ($39 and 7-day in body.) |
| https://mcflyads.com/pricing | **200** | 0 | H1 **7-day free trial. Then $39/month. Full desk.** One-plan copy. |
| https://mcflyads.com/demo | **200** | 0 | H1 **See the same Overview as the Shopify app.** SAMPLE · not a live client. |
| https://mcfly-analytics.fly.dev/health | **200** | 0 | `{"ok":true,"service":"mcfly-analytics","db":"up","ts":"2026-09-16T04:34:12.565Z"}` |
| https://mcfly-analytics.fly.dev/app | **200** | 0 | Public host page (no Admin session): **This is the app host. Open Mcfly Analytics from Shopify Admin after install.** **OK 200.** |
| https://mcfly-analytics.fly.dev/privacy | **200** | 0 | Title **Privacy — Mcfly Analytics** · H1 Privacy policy |
| https://mcfly-analytics.fly.dev/support | **200** | 0 | Title **Support — Mcfly Analytics**. Inbox: **mcflyadsmmm@gmail.com** (also invites@mcflyads.com). Leftover copy: **Partner review until listing is live**. |
| https://mcfly-analytics.fly.dev/terms | **200** | 0 | Title **Terms — Mcfly Analytics** · H1 Terms of use · 7-day then $39/store/mo |
| https://mcfly-analytics.fly.dev/auth/login | **200** | 0 | Heading **Install from Shopify**. Body: **Mcfly Analytics installs from the Shopify App Store.** |

---

## What Ops verified (curl only)

- Listing is **fully visible**. **$39** and **7-day** trial copy are on the public page.
- Public listing reviews: **0**. Do not invent a count. HTML: **0.0 (0 Reviews)** and **No reviews yet**.
- Public listing plan **label** on the $39 card is **Mcfly Analytics** (changed since 2026-09-08 **Pro**). Curl still cannot see Partner Pricing itself.
- Site H1 still matches **“Deeper Shopify numbers”** (full H1: **Deeper Shopify numbers Analytics does not show.**).
- Fly origin is up; DB reported **up**. `/app` without Admin is the public host page — **200**, expected.
- Trust URLs on Fly (`/privacy` `/support` `/terms`) return **200**.
- **No visits / installs / trials** in this file. Curl cannot see Partner Insights.

## What curl cannot see (HUMAN)

Partner **Pricing** (Shopify App Pricing) is not in the listing HTML. Ops **cannot** confirm from curl that Partner has **no Free plan**.

**Admin SAMPLE Result (2026-09-15, founder):** Overview **PASS** · blank ROAS/Ad spend first **NO** · Shopify five at $0 **PASS** · LTV First year — **PASS**. Live spend day **skipped**. Trial CTA **skipped**. Ops still did not type spend.

**Open Partner / founder items:**

1. **No Free plan** next to the paid plan in Partner (unverified).
2. Virgin / **non-sample** shop Admin path (Ops did not install):

   1. Install from https://apps.shopify.com/mcfly-analytics-public on a real shop (not SAMPLE as the live desk).
   2. Settings → **Start 7-day trial** → plan picker must open **top-frame** (`admin.shopify.com` in the iframe = fail).
   3. Spend: type **one day’s** spend (one channel is enough).
   4. Overview: **Total ROAS** = Shopify sales ÷ that spend for the period (honest zero if sales are empty — do not expect a fake multiple).
   5. Paste **Result** so gate 1 of [`money/APP_STORE_ADS.md`](./money/APP_STORE_ADS.md) can flip. SAMPLE greeting is PASSed; live spend + trial still needed for gate 1 green.

---

## Do not treat as done

| Claim | Status |
| --- | --- |
| Listing $39 + 7-day | **Seen on listing HTML** |
| Listing reviews | **0** |
| Partner: no Free plan | **Unverified** — human |
| Plan name on public card | **Mcfly Analytics** (was Pro on 2026-09-08) |
| Virgin shop install → trial → spend → Total ROAS | **SAMPLE greeting PASS. Live spend + trial skipped.** |
| Organic Partner funnel week | **Not pasted** — see [`money/FUNNEL_WEEKLY.md`](./money/FUNNEL_WEEKLY.md) |
| Site H1 “Deeper Shopify numbers” | **Still matches** |
| `/support` leftover “Partner review until listing is live” | **Still on Fly HTML** — not MX, not a listing claim |

**Do not buy ads from this lane.** Significant ad spend is illegal for this workspace until the four gates in [`money/APP_STORE_ADS.md`](./money/APP_STORE_ADS.md). Gate 1 amber; 2–3 red; Fly P0 green.
