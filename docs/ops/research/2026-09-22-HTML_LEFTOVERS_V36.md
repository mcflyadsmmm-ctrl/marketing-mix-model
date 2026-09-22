# HTML leftovers — live v36 vs git vs listing — 2026-09-22

**Live:** https://mcflyads.com Pages `8ddad52e` · `mcfly-version` **v36**  
**Git compared:** `cursor/site-world-class-5bc6`  
**Listing:** https://apps.shopify.com/mcfly-analytics-public  
**Did not:** Pages deploy · Partner Submit · ShopifyQL-wait · fly deploy

Probed apex (not `*.pages.dev`). Fly wrap checked because listing App URL / Privacy / Support / Terms are `mcfly-analytics.fly.dev`.

## v36 kill-list (live apex) — already gone

| URL | Quote / status | Verdict |
| --- | --- | --- |
| https://mcflyads.com/ | H1 `Deeper Shopify numbers Analytics does not show.` · `ShopifyQL can show returning sales $` · `TrueProfit from $35/mo` · `Free / Foundation $219 / Automate $749` · `We do not invent Polar $1,020` · `Mcfly reviews: 0` | PASS |
| https://mcflyads.com/ | no `Shopify itself is all-or-nothing Admin` · no Harbor Home Co · no Northline · no `$98,500` · no `4.19×` | PASS |
| https://mcflyads.com/faq | 14 Qs including COGS · `Shopify Admin can export Orders CSV` | PASS |
| https://mcflyads.com/pricing | no `$0.30/order` / `$0.3 per extra order` | PASS (TrueProfit listing still prints `$0.3`; do not copy that leftover onto pricing) |
| https://mcflyads.com/demo | `Native Overview can set start and end times` | PASS |
| https://mcflyads.com/assets/brand/og-cash-mer.jpg | **301** → `/assets/brand/og-analytics.jpg` | PASS |
| https://mcflyads.com/lab | **301** `/` | PASS |
| https://mcflyads.com/lab.html | **308** `/lab` then 301 `/` (Pages pretty-URL). HTML not served. | PASS on apex |
| https://mcflyads.com/support | exact `There is no Sample\|Live toggle.` | KEEP |
| https://mcflyads.com/ | `The live App Store card still leads with ad spend next to store sales` | KEEP disclosure |

Polar listing live: **4.9 / 117**, `$750/month`, no `$1,020`. TW: **4.1 / 91**, Free / `$219` / `$749`. RCI: **5.0 / 14**, from `$59`. Better Reports from `$19.90`. Mcfly listing reviews **0.0** / “No reviews yet”.

## Still a lie, a 200, or an index bug (live)

| URL | Quote | Why it is still a lie or a 404/200 bug | Smallest cook |
| --- | --- | --- | --- |
| https://mcflyads.com/ | `TrueProfit listing 5.0 (880)` | Live TrueProfit JSON-LD is **4.9 / 898** | Replace with `4.9 (898)` (patched in git on this branch) |
| https://mcflyads.com/ · /pricing | `Lifetimely $149/mo at 3,000 orders` as a from-price | Listing from is **$49/mo**; $149 is the 3,000-order tier | `Lifetimely from $49; $149/mo at 3,000 orders` (patched) |
| https://mcflyads.com/cookies · /privacy · Fly `/privacy` (listing trust URL) | `Google Fonts — font files loaded from Google’s CDN` | Spine loads `/assets/fonts-local.css` woff2 only. Indexed trust lie. | Delete CDN processor; name self-hosted fonts (patched) |
| https://mcflyads.com/cookies · /dpa | `Waitlist form` · `FormSubmit.co (waitlist fallback)` | Listing is live. No waitlist on Tier A. | Support mail only; drop FormSubmit (patched) |
| https://mcfly-analytics.fly.dev/lab.html | title `SAMPLE lab — $98,500 spend, cash 4.19×` HTTP **200** v10 | Pages 308+301 hides this. Fly `express.static` serves `lab.html` because `_redirects` matches `/lab` not `/lab.html`. Northline book still public on the App URL host. robots is already `noindex,follow`. | Strip `.html` in `matchSiteRedirect` so parked rules fire (patched; **needs Fly wrap**, not this hunt) |
| https://mcfly-analytics.fly.dev/custom-analytics.html | Close Memo / Pipeline / Hired System · `$98,500` HTTP **200**, **no robots meta** | Same Fly `.html` hole. Indexable Custom packages on the app host. | Same `.html` strip (patched) |
| https://mcfly-analytics.fly.dev/custom-analytics-engagement.html | `<meta name="robots" content="index,follow" />` HTTP **200** | Parked SOW page asks to be indexed. Apex 301s the pretty URL. | `noindex` + canonical `/` + Fly `.html` 301 (patched) |
| https://mcfly-analytics.fly.dev/lead-gen-desk.html | `SAMPLE Northline · invoice $98,500 · cash 4.19×` HTTP **200**, no robots | Same hole. | Same (patched) |
| https://mcfly-analytics.fly.dev/cash-mer.html · /monday-close.html · /why-pixels-fail.html | HTTP **200** `noindex` · canonical still the parked path | Pretty URL 301s; `.html` does not on Fly | `.html` strip covers these (patched) |
| https://mcflyads.com/faq | TW answer `No. No pixel, no MTA.` with no Free/$219/$749 | Home already names the TW ladder. FAQ still under-discloses. | Add `Free / Foundation $219 / Automate $749` (patched) |
| https://mcflyads.com/ | `Days-to-second is on this board, not a separate LTV app.` | Contradicts RCI from $59 as the closer LTV/latency app | Name RCI on the card (patched) |
| https://apps.shopify.com/mcfly-analytics-public | title/og `Ad spend next to store sales` · `Put Meta, Google, TikTok, and billboard spend next to Shopify sales` | Site discloses this. Listing body is still spend-first. **UNDISCLOSED on the listing itself.** | Marty Save [`ops/LISTING_LIVE_PASTE.md`](../../ops/LISTING_LIVE_PASTE.md). Cursor does not Submit. |
| https://mcflyads.com/support | loads `site.css?v=20260829v13` **and** `mcfly.css?v=20260922v36` | Tier B stacking both chrome systems. Not a copy lie. | Drop `site.css` on support only after a phone+desktop paint check |
| https://mcfly-analytics.fly.dev/mds-made-easy/index.html | HTTP **200** `noindex,nofollow` | `_redirects` splat `/mds-made-easy/*` is not implemented in the Fly matcher | Optional: treat `/index` like `.html` or add an explicit rule. Course is already noindex. |

## Not leftovers (do not cook)

| Item | Why keep |
| --- | --- |
| `We do not invent Polar $1,020` | Kept on purpose |
| Support `no Sample\|Live toggle` | Exact KEEP |
| `true ROAS` / pixels / MTA on FAQ product/support | Refusal copy, not a claim |
| `Not sessions or visitors` on /product | Refusal |
| Amazon Ads CSV on /product · /about | Real spend channel in `spend-csv.ts`; FAQ still forbids bare Amazon |
| Empty spend `—` / `never 0×` | Honesty |
| `No Free plan` for Mcfly | True |
| `$39 stays $39 at $5M` | Anti-GMV, not a Mcfly GMV ladder |
| fly.dev `/` canonical `https://mcflyads.com/` | Correct |
| `site.css` on privacy/terms/cookies | Skill: collage stays on trust pages; do not stack Tier A rules into it |
| CSS comment `v35` in `mcfly.css` | Not user-facing |

## Git vs live

Git on world-class already had the v36 harvest (`884fbbe`) plus CFO card in the pricing fold (`aac3891`). Live HTML still had TrueProfit **5.0 (880)**, Google Fonts CDN on listing Privacy, FAQ TW without Free/$749, Lifetimely from-price as $149 only.

This branch patches those HTML lies and the Fly `.html` park matcher. **It does not deploy.** Apex parked pretty-URLs are already 301. Fly `.html` 200s stay until a Fly wrap.
