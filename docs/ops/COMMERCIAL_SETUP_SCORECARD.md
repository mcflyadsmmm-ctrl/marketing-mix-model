# SCORECARD — commercial + sync 1–3

**Date:** 2026-09-17 · ship target Fri Sep 18 Denver  
**Branch:** `cursor/sync-law-oneshot-webhook-6eb3`  
**Parent:** `cursor/spend-trust-recurring`  
**Method:** tip-code + vitest. No Admin session. No Fly deploy. `MCFLY_SAMPLE_ONLY` not flipped.

**PASS_BAR:** sync #1–#3 + commercial path green in tests. Desk pills/charts untouched. Flat $39. No GMV cliffs.

---

## Overall

| Bucket | Verdict | Why |
| --- | --- | --- |
| Sync #1 one-shot seal | **PASS** | Sealed shop does not re-enqueue/burst on tab; OAuth / first-session still kicks |
| Sync #2 webhook OrderFact | **PASS** | `webhooks.orders` enqueues shop-deduped `backfill_order_facts` after seal clear |
| Sync #3 billing hard-stop | **PASS** | Unpaid + billing on → ≤90d remaining; paid / host-not-charging → full Jan-1 book |
| Commercial CTA | **PASS** | LTV locked Live shows **Unlock full history** → billing; SAMPLE has no lock banner |
| Locks | **PASS** | Flat $39; price does not rise with sales; no GMV; SAMPLE_ONLY unchanged |

**Desk verdict (code):** **PASS_BAR met** for sync + commercial. Not Marty Admin PASS. Not a Fly unpark.

---

## Scorecard (one line each)

| Surface | Verdict | Why (≤20 words) |
| --- | :---: | --- |
| One-shot gate | **PASS** | Progress remaining-work / status complete; paid unfinished years still enqueue |
| Order webhook | **PASS** | After `__day_complete__` clear, shop-deduped `backfill_order_facts` |
| Unpaid Live window | **PASS** | `live-ingest-depth` trial_slice min(90, granted); no multi-year free crawl |
| Paid subscribe | **PASS** | `proBillingActive` / partner override → paid_full immediately |
| LTV Unlock | **PASS** | Banner on `liveHistoryLocked`; ProUpgradeButton top-frame; not in spend forms |
| SAMPLE | **PASS** | Banner hidden on sample; SAMPLE_ONLY not flipped |
| Pills / charts | **PASS** | No period-control, chart, or desk-craft files in this diff |

---

## Evidence tests

```
app/lib/first-session-shopify-window.test.ts
app/lib/webhooks-orders.test.ts
app/lib/live-ingest-depth.test.ts
app/lib/sales-facts.server.test.ts
app/lib/ltv-sales-spine.test.ts
app/lib/app-store-resubmit.test.ts
app/lib/desk-claims-guard.test.ts
```

---

## Remaining human gates

1. Partner Managed Pricing still one plan $39 · 7-day trial (not git).
2. Marty Admin smoke on Live after SAMPLE_ONLY unpark — not this PR.
3. Metering (#4) later.
