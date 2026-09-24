# Live unpark — one glance

**Audience:** Marty, before any real-data demo claim.  
**Tip:** `cursor/spend-trust-recurring` · git kill-switch in `fly.toml` stays `MCFLY_SAMPLE_ONLY=true` and `MCFLY_LIVE_STAGE=parked` (do **not** flip in git).  
**Production 2026-09-23 America/Denver:** Fly secrets override that default — `MCFLY_SAMPLE_ONLY=false`, `MCFLY_LIVE_STAGE=overview_orders`. Health **200** at 22:22Z (`db: up`). Recent release **~v460**. Customers and LTV stay locked. SAMPLE book stays. After a deploy, Marty re-asserts those secrets so `[env]` does not park production again.  
**Open gate — Marty only.** `DESK_FEATURE_BULLETS` sells "Customer LTV and payback on your store" at $39, and production pins `MCFLY_LIVE_STAGE=overview_orders`, so a paying merchant's Customers tab currently reads "locked". Steps 4–5 below close that gap. Code default is now the whole desk, so clearing the secret also works — but changing or clearing it is a Marty action on Fly, never an agent's.

**This page is the ladder.** It does not deploy and it does not change secrets. It does not go Live wide (`customers` / `ltv`).

| Kill switch | Keep SAMPLE | No fake Live |
| --- | --- | --- |
| `MCFLY_SAMPLE_ONLY=true` (or `1`) on Fly | Snowdevil book + Sample \| Live **forever** | Never label Snowdevil as this shop |

**OUT of this lane:** website · ads · Partner paste (Galaxy) · metering polish · flipping `MCFLY_SAMPLE_ONLY` on Fly.

---

## 0. Do this, in this order

| Step | Action | Stop if |
| ---: | --- | --- |
| 0 | Parked rung. Freeze on (`MCFLY_SAMPLE_ONLY=true` or stage `parked`) means the SAMPLE watermark and no Live ingest. Confirm `/health` 200 before any stage change. Production on 2026-09-23 is **past** this rung (`overview_orders` via secrets). | Health not 200 |
| 1 | One-shop **accuracy scorecard** (§4) on a real shop in Admin — SAMPLE still on is fine for the *path*; Live numbers need Live mode. | Any §4 row FAIL |
| 2 | Overview + Orders rung. Production secrets are already `MCFLY_SAMPLE_ONLY=false` and `MCFLY_LIVE_STAGE=overview_orders` (2026-09-23). Do not set `customers` or `ltv`. Re-assert the same secrets after a deploy. | You skipped §4 before calling it a real-data demo |
| 3 | Overview + Orders vs Admin (sales, typical ticket, refunds, shop TZ). | Numbers disagree |
| 4 | `MCFLY_LIVE_STAGE=customers` — returning $, guests, whales. | SAMPLE mixed in |
| 5 | `MCFLY_LIVE_STAGE=ltv` — first-90 on file; **year / full LTV only if paid $39**. | Year painted as $0 |
| 6 | Only then say “real-data demo.” | §4 incomplete |

**Revert any time:** `MCFLY_SAMPLE_ONLY=true` (and/or `MCFLY_LIVE_STAGE=parked`). SAMPLE stays. Live switch no-ops. Ingest does not re-arm.

---

## 1. Progressive unlock

Code: `app/app/lib/live-unpark.ts`. Env: `MCFLY_LIVE_STAGE`.

| Stage | Env | Live tabs | What you are proving |
| --- | --- | --- | --- |
| **parked** | freeze on, **or** `MCFLY_LIVE_STAGE=parked` | none | SAMPLE only. Git `[env]` default. Not current production. |
| _(unset)_ | freeze **off** + no `MCFLY_LIVE_STAGE` | whole desk | Default since `cursor/forward-desk-gap`. Parking a rung is an explicit act; a deploy no longer falls back to a partial desk, and a stage string that names no rung serves the whole desk and warns instead of going dark. |
| **overview_orders** | freeze **off** + `overview_orders` | Overview · Orders | **Current production** (Fly secrets, 2026-09-23). Sales / typical ticket / clock vs Admin. |
| **customers** | `customers` | + Customers · Growth | Returning $, guests out, win-back |
| **ltv** | `ltv` | + LTV | Paid $39 = full history LTV. Unpaid/trial Live = **90 closed days** (honest empties, not $0 year) |

Billing is **not** a tab gate. Once a stage is open, trial and paid both see that rung. The difference is **ingest depth**, not a hidden LTV paywall.

**Wired on the desk:** `liveDeskTabAllowed` (`app/app/lib/live-desk-surface.ts`) drives Admin nav and the Customers, Growth, and LTV loaders. At `overview_orders`, `/app/customers` (and Growth / LTV redirects) render a locked empty — not Live returning dollars, whales, or LTV. SAMPLE freeze still paints the Snowdevil book and the SAMPLE watermark. Overview and Orders stay open on that rung. Git `fly.toml` stays `parked`. Do not set stage to `ltv` in git.

---

## 2. Commercial (flat $39 · full paid LTV)

SoT on tip: [`docs/BILLING_TIERS.md`](../BILLING_TIERS.md) · `PRO_PLAN` = **$39** / 30 days / **7-day** Shopify trial.  
`COMMERCIAL_SETUP` was not a file on this tip — the lock below is the glance.

| Who | Desk | Live ingest |
| --- | --- | --- |
| SAMPLE / demo | Full Snowdevil wow | **None** (freeze / parked) |
| Trial or unpaid Live | Whole desk (no feature gate) | **90 closed days** — cheap slice, not a fake year |
| Paid **$39** | Whole desk | **Full** Shopify-visible order history, still cut at **24 months** of order rows |
| Host not charging | Whole desk | Same window as paid. Billing off is not a trial slice. |

`liveIngestPolicy()` names the slice. The crawl enforces it on this tip: `resolveLiveIngestWindowDays` and `scheduleFirstSessionShopifyWindow` stop unpaid/trial at **90 closed days** (`LIVE_UNPAID_INGEST_DAYS`). Paid keeps the Shopify-visible window; order rows still stop at 24 months. Do not treat paid as a 90-closed-day book.

Sibling note: `cursor/sync-law-oneshot-webhook-6eb3`. The unpaid hard-stop does not wait on that PR.

---

## 3. Cheap-ops · sync HARD law (summary)

`SAMPLE_TO_LIVE.md` / `cheap-ops` were not files on this tip. Law on this tip (sibling note `cursor/sync-law-oneshot-webhook-6eb3`):

1. **One-shot.** Finish the granted Shopify window once. Sealed shop → Live tabs do **not** enqueue/burst again.
2. **OAuth / first paint never await the crawl.** Enqueue + fire-and-forget. Pending ≠ $0.
3. **Refunds / cancels** re-arm OrderFact via webhook after the day seal clears — do not wait for a tab click.
4. **No IANA TZ → do not invent days.** Resume when TZ exists.
5. **SAMPLE freeze skips Live ingest** (this PR). Kill switch is cheap.
6. **Do not re-pull the book on every Admin load.** Worker / job tick resumes.

One-shot seal is on this tip: a sealed shop does not re-enqueue from Live tabs. Unpaid/trial ingest is **90 closed days**. Paid order rows stay inside the Shopify-visible window and the 24-month cap. `cursor/sync-law-oneshot-webhook-6eb3` is the sibling note for one-shot + webhook. Do not flip `MCFLY_SAMPLE_ONLY`.

---

## 4. Accuracy scorecard — **one shop** before “real-data demo”

**Runnable sheet:** [`ACCURACY_ONE_SHOP_SCORECARD.md`](./ACCURACY_ONE_SHOP_SCORECARD.md) — fill that page on one Admin shop. Helpers: `app/app/lib/accuracy-one-shop.ts` (empty vs zero · SAMPLE guards · Admin compare). Same 10 rows as below.

Shop: ____________ · TZ: ____________ · Paid $39? ☐ yes ☐ no · Stage: ____________

| # | Check | How | ☐ |
| ---: | --- | --- | --- |
| 1 | **SAMPLE contamination** | Live mode: no Snowdevil watermark, no SAMPLE spend on Total ROAS, no `sample:` notes in live ledger. Sample mode: watermark on. Never mixed sources. | ☐ |
| 2 | **Kill switch** | Settings still says “Live is parked” while freeze is on; Switch to Live no-ops. | ☐ |
| 3 | **Shop TZ** | Period days match Admin in the shop IANA zone, not UTC-shifted “wrong yesterday.” | ☐ |
| 4 | **Refunds** | A refunded / cancelled order drops net sales the same way Admin does. Desk does not invent the refund. | ☐ |
| 5 | **Overview sales** | This month Total Sales ≈ Admin Overview (same basis). Missing last year is **—**, not $0. | ☐ |
| 6 | **Orders typical** | Median ticket vs a 10-order spot-check. Average labeled separately. | ☐ |
| 7 | **Sync / pending** | While backfill runs: pending copy, not a fake complete year. After seal: numbers stable on refresh (no second full crawl). | ☐ |
| 8 | **Customers** *(stage ≥ customers)* | Returning **$** (not headcount). Guests out of returning. | ☐ |
| 9 | **LTV** *(stage = ltv)* | Unpaid: first-90 on file; year/365 **not on file** (—). Paid $39: full book; year only when matured. | ☐ |
| 10 | **Empty vs zero** | No spend → **—** Total ROAS, never `0.00×`. Thin shop → honest empty, never SAMPLE dollars as Live. | ☐ |

**PASS** = all rows that apply to the current stage.  
**Do not claim a real-data demo** until 1–7 PASS (and 8–9 if you unlocked those stages).

Prior SAMPLE-only audits (v336 / v339) are **not** a Live pass.

---

## 5. Code hooks (already on this branch)

| Hook | File | Behavior now |
| --- | --- | --- |
| Freeze | `isSampleOnlyFreeze()` / `fly.toml` | Git default `MCFLY_SAMPLE_ONLY=true`. Production secrets are `false` and override `[env]`. Do not flip the git default in a PR. |
| Stage + commercial policy | `app/app/lib/live-unpark.ts` | parked → no Live ingest; unpaid/trial = 90 closed days; paid = full Shopify-visible |
| Ingest depth | `resolveLiveIngestWindowDays` | Unpaid/trial crawl stops at 90 closed days; paid keeps the granted window |
| Order rows | `resolveCommercialOrderWindowDays` | After the unpaid slice, rows still stop at 24 months |
| Schedule | `scheduleFirstSessionShopifyWindow` | No-ops when freeze or stage parked; unpaid_slice passes the 90 closed-day window |
| Sync note | `cursor/sync-law-oneshot-webhook-6eb3` | One-shot + webhook context. Unpaid hard-stop is on this tip. |

---

## 6. Never

- Flip `MCFLY_SAMPLE_ONLY` in `fly.toml` from an agent PR.
- Delete or “replace” SAMPLE after unpark.
- Paint SAMPLE as Live (no fake Live).
- Jump to `MCFLY_LIVE_STAGE=ltv` to impress a demo.
- Call 365 / first-year LTV on an unpaid 90-closed-day book.
- Re-crawl a sealed shop from every tab.
- Website, ads, Partner Galaxy paste, or metering in this lane.

---

## Deploy re-assert (Mac)

After any `flyctl deploy` of `mcfly-analytics`:

1. `./scripts/assert-live-secrets.sh --print-fix` (echo only)
2. Marty: `flyctl secrets set MCFLY_SAMPLE_ONLY=false MCFLY_LIVE_STAGE=overview_orders -a mcfly-analytics` if assert would fail
3. `./scripts/assert-live-secrets.sh` must **PASS** or roll back

Do not trust `fly secrets list` digests. Do not flip git `fly.toml` `[env]` kill-switch to Live.
