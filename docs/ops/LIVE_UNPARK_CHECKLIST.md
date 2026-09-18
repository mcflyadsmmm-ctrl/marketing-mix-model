# Live unpark — one glance

**Audience:** Marty, before any real-data demo claim.  
**Tip:** `cursor/spend-trust-recurring` · Fly **v364 SAMPLE Done** · `MCFLY_SAMPLE_ONLY=true` (do **not** flip in git).  
**This PR does not go Live wide.** It parks the path so tomorrow’s unpark is progressive, honest, and cheap.

| Kill switch | Keep SAMPLE | No fake Live |
| --- | --- | --- |
| `MCFLY_SAMPLE_ONLY=true` (or `1`) on Fly | Snowdevil book + Sample \| Live **forever** | Never label Snowdevil as this shop |

**OUT of this lane:** website · ads · Partner paste (Galaxy) · metering polish · flipping `MCFLY_SAMPLE_ONLY` on Fly.

---

## 0. Do this, in this order

| Step | Action | Stop if |
| ---: | --- | --- |
| 0 | Leave Fly at `MCFLY_SAMPLE_ONLY=true`. Confirm `/health` 200. SAMPLE watermark on. | Health not 200 |
| 1 | One-shop **accuracy scorecard** (§4) on a real shop in Admin — SAMPLE still on is fine for the *path*; Live numbers need Live mode. | Any §4 row FAIL |
| 2 | Human: `MCFLY_SAMPLE_ONLY=false` **and** `MCFLY_LIVE_STAGE=overview_orders` on Fly. Do not set `ltv` yet. | You skipped §4 |
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
| **parked** | freeze on, **or** `MCFLY_LIVE_STAGE=parked` | none | Current Fly. SAMPLE only. |
| **overview_orders** | freeze **off** + `overview_orders` (also the default if freeze is off and stage is unset) | Overview · Orders | Sales / typical ticket / clock vs Admin |
| **customers** | `customers` | + Customers · Growth | Returning $, guests out, win-back |
| **ltv** | `ltv` | + LTV | Paid $39 = full history LTV. Unpaid/trial Live = **90 closed days** (honest empties, not $0 year) |

Billing is **not** a tab gate. Trial and paid both see the whole desk. The difference is **ingest depth**, not a hidden LTV paywall.

---

## 2. Commercial (flat $39 · full paid LTV)

SoT on tip: [`docs/BILLING_TIERS.md`](../BILLING_TIERS.md) · `PRO_PLAN` = **$39** / 30 days / **7-day** Shopify trial.  
`COMMERCIAL_SETUP` was not a file on this tip — the lock below is the glance.

| Who | Desk | Live ingest |
| --- | --- | --- |
| SAMPLE / demo | Full Snowdevil wow | **None** (freeze / parked) |
| Trial or unpaid Live | Whole desk (no feature gate) | **90 closed days** — cheap slice, not a fake year |
| Paid **$39** | Whole desk | **Full** order-history LTV (Jan-1 × 5 when `read_all_orders`) |

`liveIngestPolicy()` is the stub. The **billing hard-stop clamp** (actually cutting the crawl to 90 vs full) is **not** on tip — honor it when the sync PR merges. Do not treat paid as a 90-closed-day book.

---

## 3. Cheap-ops · sync HARD law (summary)

`SAMPLE_TO_LIVE.md` / `cheap-ops` were not files on this tip. Law from first-session + sibling `cursor/sync-law-oneshot-webhook-6eb3` (open, **not merged** 2026-09-17):

1. **One-shot.** Finish the granted Shopify window once. Sealed shop → Live tabs do **not** enqueue/burst again.
2. **OAuth / first paint never await the crawl.** Enqueue + fire-and-forget. Pending ≠ $0.
3. **Refunds / cancels** re-arm OrderFact via webhook after the day seal clears — do not wait for a tab click.
4. **No IANA TZ → do not invent days.** Resume when TZ exists.
5. **SAMPLE freeze skips Live ingest** (this PR). Kill switch is cheap.
6. **Do not re-pull the book on every Admin load.** Worker / job tick resumes.

Until the sync PR lands, tip still re-enqueues the public window on Live tabs. Checklist + `LIVE_SYNC_LAW_PR_REF` point at that PR. Do not re-implement the crawl here.

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
| Freeze | `isSampleOnlyFreeze()` / `fly.toml` | `MCFLY_SAMPLE_ONLY=true` — **unchanged** |
| Stage + commercial stub | `app/app/lib/live-unpark.ts` | parked → no Live ingest; unpaid = 90 closed days policy; paid = full |
| Ingest skip | `scheduleFirstSessionShopifyWindow` | No-ops when freeze or stage parked |
| Sync clamp | upcoming `cursor/sync-law-oneshot-webhook-6eb3` | One-shot + webhook; must call `liveIngestPolicy()` — **not on tip** |

---

## 6. Never

- Flip `MCFLY_SAMPLE_ONLY` in `fly.toml` from an agent PR.
- Delete or “replace” SAMPLE after unpark.
- Paint SAMPLE as Live (no fake Live).
- Jump to `MCFLY_LIVE_STAGE=ltv` to impress a demo.
- Call 365 / first-year LTV on an unpaid 90-closed-day book.
- Re-crawl a sealed shop from every tab.
- Website, ads, Partner Galaxy paste, or metering in this lane.
