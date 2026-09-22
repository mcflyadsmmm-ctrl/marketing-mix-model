# Mcfly Analytics — ADD Backlog Ranked (Compete Scout)
**Owner:** Mcfly Compete Scout · **For:** Galaxy Master / product Cursor fleet  
**Date:** 2026-09-22 (America/Denver)  
**Tip SoT:** `cursor/spend-trust-recurring` @ `5b33d67` (merge of #138) · Fly **v407** · Live PARKED · Reviewer PASS on #138 
**Lock:** Shopify-only · $39 flat · ADD only · painted IA Overview→Orders→Customers→Spend→Goals · Growth/LTV = Customers chips  
**Hard never:** COGS / shipping P&L · Meta pixels / path credit / MTA · invented Partner metrics · off-Shopify (Amazon/Recharge MRR)  
**Inputs:** `COMPETE_COMPLAINTS_PACK.md` · `COMPETITOR_REVIEW_THEMES.md` (both 2026-09-21) · plan `docs/plans/2026-09-22-shopifyql-wait-queue.md`

---

## Absorb status (Compete Scout) — 2026-09-22 · tip `5b33d67`

| Wave | Status | Notes |
|------|--------|-------|
| P0 #1–3 (cohort LTV, returning $, Growth densify) | **SHIPPED** | PRs **#124** / **#125** / **#126** |
| P1 #4–7 (product→LTV, whale/RFM, refunds honesty, predictive LTV) | **SHIPPED** | PRs **#127**–**#130** |
| P2 forecast + insight cards | **SHIPPED** | PRs **#132** (order-history forecast) · **#133** (Slack/shareable insight cards) |
| Unpaid Live ingest clamp | **SHIPPED** | PR **#134** — unpaid Live hard-stop ~90 closed days |
| Promo depth bands (discount $) | **SHIPPED** | PR **#135** — Light/Typical/Deep on promo LTV from first-order discount dollars |
| Spend paste densify (cash trio) | **SHIPPED** | PR **#138** merged @ `5b33d67` · Reviewer PASS · Fly **v407** |
| **Next PASS cook** | **READY — named** | **Customers open-lane starter value** (plan Ship 2 / v408): move `LtvPromoBoard` up onto “What a new buyer is worth”; LTV by Online/POS/Shop from stored `sourceName`; store `discountCode` on Live `OrderFact` (SAMPLE already names codes) |
| HOLD | discount **titles** crawl (`discountApplications`) · country/tag LTV while PCD L2 · sessions/visitor “fix native” | |
| REFUSE | COGS / shipping P&L · pixels / path credit / MTA · GMV or per-order pricing · sixth tab | |

**Do not list SHIPPED rows as next cook.** Do not invent extra craft PRs beyond the named Ship 2.

**Plan SoT for next cook:** `docs/plans/2026-09-22-shopifyql-wait-queue.md` (Ship 2 — starter value on the open LTV lane).  
**P2 briefs (historical):** `docs/ops/P2_CURSOR_BRIEFS.md` / `docs/ops/ADD_BRIEFS_PROMO_LTV_SPEND_PASTE_20260922.md` — promo depth + spend paste are absorbed as shipped; do not re-queue.

**Next PASS line (only):** Customers open-lane starter value — move `LtvPromoBoard` up · LTV by Online/POS/Shop from `sourceName` · store `discountCode` on Live.

---


## How to read

| Column | Meaning |
|--------|---------|
| **pain** | What operators complain about / will pay to fix |
| **competitor weakness** | Who fails them and how (cited themes) |
| **Mcfly now / next / never** | Scope posture for product fleet |
| **tab/chip** | Painted IA landing |
| **sources** | Public URLs only — no invented metrics |

**PASS** = ship-worthy ADD for $39 Shopify order-LTV niche. **FAIL** = out of niche or anti-job.

---

## Ranked backlog (pay-willingness × niche fit)

| Rank | PASS/FAIL | pain | competitor weakness | Mcfly now / next / never | tab/chip | sources |
|------|-----------|------|---------------------|--------------------------|----------|---------|
| 1 | **PASS** | Cohort / order LTV as daily product — not a buried report or suite upsell | Native cohort “clunky”; Lifetimely order-band price for “just LTV”; Peel Essentials ~$499 for retention depth | **Now (SHIPPED #125):** Customers → LTV 30/90/365 · **Next:** open-lane starter value (promo up + source LTV + Live codes) · **Never:** Meta path-credit LTV | Customers → **LTV** | https://ecommrumble.com/fighters/lifetimely · https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports · https://eightx.co/blog/compare/reviews/peel-insights-for-ecommerce-review |
| 2 | **PASS** | Flat predictable price — growth must not raise the bill | Lifetimely order ladders (~$49→$149→$299); TW GMV bands + contracts (~$219/$749); TrueProfit per-order overage; Putler revenue slabs; Peel order floors | **Now:** $39 flat / store / mo · 7-day trial (Pricing + listing) · **Next:** Multi-store clarity (per-store flat, no hidden quota) · **Never:** GMV/order surcharges; annual lock as default | Pricing / listing (not a craft tab) | https://useamp.com/pricing/ · https://eightx.co/blog/compare/reviews/triple-whale-for-ecommerce-review · https://trueprofit.io/pricing · https://www.putler.com/pricing/ · https://appnavigator.io/app/trueprofit/reviews/?rating=1 |
| 3 | **PASS** | Returning $ mix as a front-door habit metric | Native hides returning mix; TW frames new/returning for ads; Putler has RFM but not Admin desk craft | **Now (SHIPPED #124):** Overview + Customers returning-$ explorer · **Never:** Require ad login to see returning $ | Overview · Customers | https://www.reddit.com/r/shopify/comments/1u5hel2/shopify_analytics/ · https://revenuegeeks.com/software/putler · COMPETE pack §3 |
| 4 | **PASS** | Native Analytics can’t answer basic **order/sales** questions (UX / NO DATA / product×date hard) | New Analytics “analyst-designed”; product sales by range hard; traffic/session distrust (Mcfly does **not** claim to fix sessions) | **Now:** Orders tab — typical order / density; Overview glance · **HOLD:** Promise to replace Shopify visitors/sessions accuracy | Orders · Overview | https://www.reddit.com/r/shopify/comments/1i2jh0a/what_the_fuck_happened_to_shopify_analytics/ · https://community.shopify.com/t/shopify-needs-to-revert-back-to-old-analytics/418200 · https://community.shopify.com/t/shopify-dashboard-showing-wrong-data/339172/5 |
| 5 | **PASS** | Product → LTV / first-product drivers (stop optimizing first-order only) | Operators still optimize first-order ROAS; Lifetimely product/promo LTV lives behind price/suite wall | **Now (SHIPPED #127 + #135):** First-product drivers + promo depth bands · **Next:** Move promo board onto open lane; Live `discountCode` · **Never:** COGS-adjusted product profit as launch hero | Customers → **LTV** | https://ecommrumble.com/fighters/lifetimely · COMPETITOR_REVIEW_THEMES §1 Mcfly angle |
| 6 | **PASS** | Days-to-second / win-back / whale watch (actionable repurchase timing) | Peel RFM valued but $499+; Putler RFM praised but multichannel/metered; native weak habit | **Now (SHIPPED #126 + #129):** Growth densify + whale/RFM-lite · **Never:** Subscription MRR/churn (Recharge/Skio) as must-have | Customers → **Growth** · Customers | https://revenuegeeks.com/software/putler · https://eightx.co/blog/compare/reviews/peel-insights-for-ecommerce-review · https://www.attnagency.com/blog/peel-insights-shopify-review |
| 7 | **PASS** | Zero-setup value — full desk on orders/customers alone (no COGS, no ad OAuth, no pixel) | TrueProfit/Lifetimely need cost config; TW needs Pixel + ads; Peel best with sub+ads stack | **Now (SHIPPED #138 · Fly v407):** Optional spend paste → cash Total ROAS / CPA / payback · **Never:** Pixel install; Meta OAuth; “true multi-touch” | Spend (honest empty) · whole desk | https://trueprofit.io/pricing · https://eightx.co/blog/compare/reviews/triple-whale-for-ecommerce-review · COMPETITOR_REVIEW_THEMES §2–4 Avoid |
| 8 | **PASS** | Trust / honesty in numbers — refunds in LTV; formulas shown; no fake attribution | TW attribution disputes / marketplace ghosts; Lifetimely post-purchase upsell skew; TrueProfit wrong-until-config; native half-orders incidents | **Now (SHIPPED #128 + #130):** Predictive LTV formula shown + refunds honesty · **Never:** Audited-books claim; invent Partner conversion rates | Customers → **LTV** · Spend | https://www.trustpilot.com/review/triplewhale.com · https://taranker.com/shopify-lifetimely-lifetime-value-and-profit-analytics-app-customer-reviews?filter-by=1 · https://community.shopify.com/t/due-to-a-technical-issue-data-is-missing-starting-around-2pm-utc-on-october-17-2024/367340/1 · https://appnavigator.io/app/trueprofit/reviews/?rating=1 |
| 9 | **PASS** | Goals / forecast / shareables **without** spend required | Peel Slack digests loved at ~$499; Lifetimely forecast behind tier; TW goals assume ad stack | **Now (SHIPPED #132 + #133):** Order-history forecast + insight cards · **Never:** Goals that hard-require ad ROAS | Goals · Overview | https://apps.shopify.com/peel-insights · https://eightx.co/blog/compare/reviews/peel-insights-for-ecommerce-review · COMPETE pack §10 |
| 10 | **PASS** | Mobile Admin + simple pill IA (not analyst maze / 20%-used suite) | Native New Analytics maze; TW “pay for dashboard you use 20% of” (Reddit); Peel CSM-built dependency | **Now:** Painted IA pills; mobile-friendly craft · **Never:** Kitchen-sink nav outside painted five | All tabs | https://www.reddit.com/r/FacebookAds/comments/1u86440/triple_whale_feels_like_im_paying_for_a_dashboard/ · https://www.reddit.com/r/shopify/comments/1i2jh0a/what_the_fuck_happened_to_shopify_analytics/ |
| 11 | **PASS** | Which **first-order pattern** is worth more — discount depth + where placed + code when on file | Lifetimely promo/product LTV behind price wall; native discount report stops at orders/sales; source mix on Orders is not LTV | **Next PASS (only cook):** Open-lane starter value — `LtvPromoBoard` up · Online/POS/Shop LTV from `sourceName` · Live `discountCode` · **Never:** Path credit / ad source as LTV | Customers → **LTV** (open lane) | Plan Ship 2 · https://ecommrumble.com/fighters/lifetimely · https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports |

---

## Top ADDs for product Cursor fleet (action queue)

**SHIPPED — do not re-queue as next cook**

| # | ADD (ship language) | PR | Priority |
|---|---------------------|-----|----------|
| 1 | Cohort LTV depth — 30/90/365 + retention triangle + revenue-by-cohort | **#125** | P0 |
| 2 | Returning $ mix explorer + win-back ActionCards | **#124** | P0 |
| 3 | Days-to-second / weekends densify on Growth | **#126** | P0 |
| 4 | Product → LTV / first-product drivers | **#127** | P1 |
| 5 | Whale watch + RFM-lite labels from orders only | **#129** | P1 |
| 6 | Refunds honesty in LTV/cohorts | **#130** | P1 |
| 7 | Transparent predictive LTV (formula shown) | **#128** | P1 |
| 8 | Order-history Overview forecast + insight cards | **#132** / **#133** | P2 |
| — | Unpaid Live ingest clamp (~90 closed days) | **#134** | — |
| — | Promo depth bands (Light/Typical/Deep from discount $) | **#135** | P2 |
| — | Spend paste densify → cash Total ROAS / CPA / payback | **#138** (tip `5b33d67`; Fly may still be v406) | P2 |

**Next PASS cook only (named in wait-queue plan — do not invent others)**

| # | ADD (ship language) | tab/chip | Priority | Why it wins vs named weakness |
|---|---------------------|----------|----------|-------------------------------|
| 9 | **Customers open-lane starter value** — move `LtvPromoBoard` onto “What a new buyer is worth”; LTV by Online/POS/Shop from `sourceName`; store `discountCode` on Live | Customers → **LTV** (open lane) | **PASS next** | Lifetimely promo/source LTV behind price wall; native discount report stops at orders; promo board still folded under depth |

---

## Explicit FAIL / HOLD (do not queue to fleet)

| Item | Verdict | Reason |
|------|---------|--------|
| COGS / shipping / net profit P&L | **FAIL / HOLD** | TrueProfit/Lifetimely lane; anti-job |
| Meta pixel / path credit / MTA / “true ROAS” | **FAIL / NEVER** | Triple Whale lane; anti-job |
| Amazon / Recharge-Skio MRR as must-have | **FAIL / HOLD** | Off-Shopify / sub tax |
| GMV or per-order surcharges | **FAIL** | Rage theme across Lifetimely/TW/TrueProfit/Putler |
| Fix Shopify session/visitor accuracy | **FAIL** | Out of niche; own order-history truth instead |
| Invented Partner review counts / conversion metrics | **FAIL** | Anti-job |
| Sixth analysis tab | **FAIL** | Painted five only |
| Country or customer-tag → LTV | **HOLD** | Not on `OrderFact`; wait while PCD L2 |
| Discount **titles** via `discountApplications` | **HOLD** | Codes on Live are Ship 2; titles crawl is separate |

---

## Public niche gaps (from existing packs / URLs — no invented stars/installs)

Themes only; re-verify live before listing paste. Packs cited as `COMPETE_COMPLAINTS_PACK.md` / `COMPETITOR_REVIEW_THEMES.md` (Galaxy paths; not re-fetched here).

| Gap vs $39 Shopify-only order-LTV desk | Who leaves it open | Public URLs already on this board |
|----------------------------------------|--------------------|-----------------------------------|
| Cohort / order LTV as daily Admin habit, not suite upsell | Native cohorts “clunky”; Lifetimely/Peel price wall for Shopify-half LTV | https://ecommrumble.com/fighters/lifetimely · https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports · https://eightx.co/blog/compare/reviews/peel-insights-for-ecommerce-review |
| Flat price when growth rises | Lifetimely ladders; TW GMV bands; TrueProfit overage; Putler slabs | https://useamp.com/pricing/ · https://trueprofit.io/pricing · https://www.putler.com/pricing/ · https://eightx.co/blog/compare/reviews/triple-whale-for-ecommerce-review |
| Returning $ + repurchase timing without ad login | Native buries mix; TW frames for ads; Peel RFM ~$499+ | https://www.reddit.com/r/shopify/comments/1u5hel2/shopify_analytics/ · https://apps.shopify.com/peel-insights · https://revenuegeeks.com/software/putler |
| Trust: refunds / formulas vs attribution theater | TW Trustpilot themes; Lifetimely upsell skew; native missing-data threads | https://www.trustpilot.com/review/triplewhale.com · https://taranker.com/shopify-lifetimely-lifetime-value-and-profit-analytics-app-customer-reviews?filter-by=1 · https://community.shopify.com/t/due-to-a-technical-issue-data-is-missing-starting-around-2pm-utc-on-october-17-2024/367340/1 |
| Zero-setup desk (no COGS, no pixel) | TrueProfit/Lifetimely cost config; TW Pixel + ads | https://trueprofit.io/pricing · https://eightx.co/blog/compare/reviews/triple-whale-for-ecommerce-review |
| Still open on Mcfly tip after #135/#138 | Promo board still folded; Live `discountCode` null; source→LTV not on open lane | Plan Ship 2 · tip `5b33d67` |

---

## Source index (packs + primary URLs)

### Packs
- `/workspace/galaxy-money/mcfly-company/COMPETE_COMPLAINTS_PACK.md`
- `/workspace/galaxy-money/mcfly-company/COMPETITOR_REVIEW_THEMES.md`

### Shopify native
- https://community.shopify.com/t/due-to-a-technical-issue-data-is-missing-starting-around-2pm-utc-on-october-17-2024/367340/1
- https://community.shopify.com/t/why-are-my-shopify-analytics-not-recording-accurate-data/294814/17
- https://community.shopify.com/t/shopify-completely-misreporting-my-analytics/307039/1
- https://community.shopify.com/t/shopify-dashboard-showing-wrong-data/339172/5
- https://community.shopify.com/t/shopify-needs-to-revert-back-to-old-analytics/418200
- https://www.reddit.com/r/shopify/comments/1i2jh0a/what_the_fuck_happened_to_shopify_analytics/
- https://www.reddit.com/r/shopify/comments/1u5hel2/shopify_analytics/
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports

### Competitors
- Lifetimely: https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics · https://useamp.com/pricing/ · https://ecommrumble.com/fighters/lifetimely · https://taranker.com/shopify-lifetimely-lifetime-value-and-profit-analytics-app-customer-reviews?filter-by=1
- Triple Whale: https://eightx.co/blog/compare/reviews/triple-whale-for-ecommerce-review · https://www.trustpilot.com/review/triplewhale.com · https://www.reddit.com/r/FacebookAds/comments/1u86440/triple_whale_feels_like_im_paying_for_a_dashboard/
- Peel: https://apps.shopify.com/peel-insights · https://eightx.co/blog/compare/reviews/peel-insights-for-ecommerce-review · https://www.attnagency.com/blog/peel-insights-shopify-review
- TrueProfit: https://trueprofit.io/pricing · https://appnavigator.io/app/trueprofit/reviews/?rating=1
- Putler: https://www.putler.com/pricing/ · https://revenuegeeks.com/software/putler

---

## Caveats

- Peel App Store 1–3★ corpus is **thin** (mostly 5★ at fetch) — price/scale themes from agency/site, not a low-star majority.
- Lifetimely/TrueProfit low-star counts are small vs 5★ corpus — treat as **theme clusters**, not star averages for marketing claims.
- Pricing bands cited from public pages at pack research time (2026-09-21) — **re-verify live** before listing paste.
- No Partner Dashboard metrics invented or claimed.

*Compete Scout · tip `cursor/spend-trust-recurring` @ `5b33d67` · report path: `docs/ops/ADD_BACKLOG_RANKED.md`*
