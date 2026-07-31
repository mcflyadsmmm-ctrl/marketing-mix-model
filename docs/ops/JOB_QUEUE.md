# Order webhooks + Postgres job queue

Implements design §5 rows **Webhooks** and **Jobs** from
[`docs/superpowers/specs/2026-07-26-enterprise-redesign-design.md`](../superpowers/specs/2026-07-26-enterprise-redesign-design.md).

Scope is the **minimum viable scaffold**: ingest lag on edited/refunded/cancelled
orders drops from "next daily backfill" to "next worker tick," without adding Redis,
a second service, or overnight fan-out.

**Religion:** no pixels, no attribution, no Level 2 PCD. The order webhook reads the
order **id and timestamp only**. `customer`, `email`, `phone`, `billing_address`,
`shipping_address`, and `line_items` are never read, logged, or persisted.

---

## 1. Flow

```text
Shopify orders/create|updated|cancelled
        │  HMAC (authenticate.webhook)
        ▼
POST /webhooks/orders ─── WebhookDelivery claim (unique deliveryKey)
        │                       └─ replay? log + ACK 200, no work
        ▼
   Job upsert (shopId, "reconcile_sales_day", dayKey)  ← coalescing
        ▼
   ACK 200   (no GraphQL on the webhook path — well inside Shopify's 5s budget)

POST /api/jobs/tick  (scheduler or app/scripts/queue-worker.mjs)
        ▼
   reclaim stale locks → claim (per-shop concurrency 1) → reconcileSalesDayFact
        ▼
   SalesDayFact upsert on (shopId, day)
```

## 2. Migration

| | |
| --- | --- |
| Name | `20260728140000_webhook_delivery_and_job_queue` |
| File | `app/prisma/migrations/20260728140000_webhook_delivery_and_job_queue/migration.sql` |
| Adds | enum `JobStatus`; tables `WebhookDelivery`, `Job` |
| Touches existing tables | No — additive only, no backfill, no column changes |

### Applying it

**Local (AGENT-safe):**

```bash
npm run db:up                        # docker compose postgres
npm run db:migrate                   # prisma generate && prisma migrate deploy
```

**Production:** Fly `app` process runs `npm run setup` (`prisma generate && prisma migrate
deploy`) on every boot when `DATABASE_URL` is set. A `fly deploy` of
`mcfly-analytics` therefore applies `20260728140000_webhook_delivery_and_job_queue`
automatically. Manual Neon-only migrate is only needed if the DB is outside that
boot path:

```bash
DATABASE_URL="<production url>" npx prisma migrate deploy --schema app/prisma/schema.prisma
```

Verify:

```sql
SELECT to_regclass('"Job"'), to_regclass('"WebhookDelivery"');
```

## 3. Idempotency

`WebhookDelivery.deliveryKey` is unique. The route **inserts first and catches the
unique violation** rather than reading then writing, so two concurrent retries of the
same event cannot both conclude "unseen."

- Key = `X-Shopify-Webhook-Id` (Shopify reuses it across all retries of one event).
- Absent header (manual replay, test) → synthesized
  `shopDomain:TOPIC:resourceId:triggeredAt`.
- No `Shop` FK: deliveries can arrive before the `Shop` row exists (first order during
  install) and must outlive `shop/redact` long enough to suppress in-flight retries.
  `app/uninstalled` and `shop/redact` purge by domain explicitly.
- Retention: keys older than `WEBHOOK_DELIVERY_RETENTION_DAYS` (7) are swept, at most
  hourly, from the worker tick. Without it the ledger grows by one row per order event
  forever and becomes the largest table on a busy store.

Order events keep arriving after uninstall, so the route ACKs and skips when the
webhook context has **no offline session** — otherwise the `Shop` upsert would
resurrect a row `shop/redact` had just erased.

Second layer: `Job` is unique on `(shopId, type, dedupeKey)`, so twenty
`orders/updated` events for the same day collapse onto one row. Third layer:
`reconcileSalesDayFact` upserts on `(shopId, day)`, so even a duplicated job converges.

## 4. Job queue semantics

| Property | How |
| --- | --- |
| Coalescing enqueue | `@@unique([shopId, type, dedupeKey])`; re-arm to `pending` |
| Per-shop concurrency 1 | Claim SQL skips shops with a `running` job |
| Multi-worker safe | `FOR UPDATE SKIP LOCKED` on the claim |
| Retry | `pending` + exponential backoff (30s → 30m cap) |
| Dead letter | `dead` after `maxAttempts` (default 5) |
| Non-retryable | `failed` immediately (`NonRetryableJobError`: bad payload, shop gone) |
| Crashed worker | `reclaimStaleJobs` frees locks older than `JOB_LOCK_TTL_MS` (10m) |
| Ledger retention | Hourly sweep from the tick, 7-day window |

**Re-dirtied mid-flight.** Enqueue clears `lockedBy`. `completeJob` updates only
`WHERE lockedBy = <this worker>`, so it matches zero rows and the job stays `pending`
for another pass — a fact is never marked fresh using results computed before the
newest webhook.

A `Job` row is therefore the **current state of a unit of work**, not an append-only
attempt log. Run history lives in `SyncRun`.

## 5. What the worker reconciles

`reconcileSalesDayFact(admin, shopId, dayKey)` re-fetches one shop-local day and
overwrites its `SalesDayFact`. It is the counterpart to `runSalesFactsBackfill`, which
only fills days that are *missing*.

Three skips (all normal outcomes, so the job succeeds rather than retrying forever):

- `day_not_closed` — the shop's in-progress local today. Writing a partial row would
  poison the day permanently, since backfill would then see it as present and never
  correct it. Today reaches the desk through the live read path, and lands in facts
  via backfill once it closes.
- `day_outside_window` — older than the Jan-1 × 4yr SalesDayFact window; the day can no
  longer be recomputed through this job.
- `no_timezone` — shop IANA timezone unknown. Server-local time is never substituted.

A Shopify fetch failure **throws**, so the queue retries and the existing fact row is
left alone rather than replaced with a partial read.

## 6. Running the worker

The tick runs **inside the app process** (`POST /api/jobs/tick`) so it reuses Prisma
and the Shopify offline-session clients instead of re-deriving auth in a second
service. Auth is a shared ops secret, not an `ApiToken` — a tick spans all shops and
`ApiToken` is deliberately per-shop. **The endpoint returns 404 until
`MCFLY_JOBS_TICK_SECRET` is set.**

No Redis. Postgres is the queue. Scheduling is an **external HTTP tick** so the web
dyno stays request-driven (not an in-process `setInterval`).

### Local / one-shot

```bash
# app env
MCFLY_JOBS_TICK_SECRET=<random 32+ chars>

# runner (same secret)
MCFLY_JOBS_TICK_SECRET=... MCFLY_APP_URL=https://mcfly-analytics.fly.dev \
  node app/scripts/queue-worker.mjs

# one drain and exit
MCFLY_QUEUE_ONCE=1 MCFLY_JOBS_TICK_SECRET=... node app/scripts/queue-worker.mjs
```

### Production (Fly) — process group `worker`

`fly.toml` defines two process groups on the **same image**, no second Redis service:

| Process | Command | Role |
| --- | --- | --- |
| `app` | `npm run docker-start` | Web + `prisma migrate deploy` on boot |
| `worker` | `node scripts/queue-worker.mjs` | Polls `POST /api/jobs/tick` every 15s |

```toml
[processes]
  app = "npm run docker-start"
  worker = "node scripts/queue-worker.mjs"

[env]
  MCFLY_APP_URL = "https://mcfly-analytics.fly.dev"
  MCFLY_QUEUE_INTERVAL_MS = "15000"

[http_service]
  processes = ["app"]   # worker has no public ports

[[vm]]
  processes = ["app"]
  memory = "1gb"
  …

[[vm]]
  processes = ["worker"]
  memory = "256mb"
  …
```

**Secrets (once):**

```bash
# Strong shared ops secret (app + worker read the same Fly secret)
fly secrets set MCFLY_JOBS_TICK_SECRET="$(openssl rand -hex 32)" -a mcfly-analytics

# Already required for the app; worker falls back to SHOPIFY_APP_URL if MCFLY_APP_URL unset
# fly secrets set SHOPIFY_APP_URL=https://mcfly-analytics.fly.dev -a mcfly-analytics
```

**Deploy + scale:**

```bash
fly deploy -a mcfly-analytics
fly scale count app=1 worker=1 -a mcfly-analytics   # if deploy did not create worker
fly status -a mcfly-analytics                        # expect app + worker started
```

**Prove the tick:**

```bash
# no secret → 404 (endpoint does not exist while secret unset; with secret set, missing/wrong Bearer → 401)
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://mcfly-analytics.fly.dev/api/jobs/tick

# with secret → 200 + drain JSON (empty queue is fine: claimed=0)
curl -sS -X POST https://mcfly-analytics.fly.dev/api/jobs/tick \
  -H "authorization: Bearer $MCFLY_JOBS_TICK_SECRET"
```

Migration `20260728140000_webhook_delivery_and_job_queue` applies on **app** boot via
`npm run setup` (`prisma migrate deploy`) whenever `DATABASE_URL` is present — no
separate Neon step required for Fly’s attached DB.

## 7. Live vs stub

**Live (tested, wired):**

- `WebhookDelivery` / `Job` schema + migration
- `POST /webhooks/orders` — HMAC, idempotent claim, dirty-day enqueue, fast ACK
- `enqueueJob` / `claimNextJob` / `completeJob` / `failJob` / `reclaimStaleJobs`
- `runJobWorkerTick` dispatch, backoff, dead-letter, supersede handling
- `reconcileSalesDayFact`
- `POST /api/jobs/tick`
- Ledger purge on `app/uninstalled` + `shop/redact`, plus the hourly retention sweep
- **Fly `worker` process** — `app/scripts/queue-worker.mjs` POSTs `/api/jobs/tick` every
  `MCFLY_QUEUE_INTERVAL_MS` (default 15s); secret via `MCFLY_JOBS_TICK_SECRET`

**Stub / not done:**

- **Webhook topics are declared in `shopify.app.toml` but not registered.** That takes
  `shopify app deploy` (**HUMAN GATE** — Partner auth).
- **No DLQ surface.** `dead` jobs are queryable but there is no admin UI or alert.
- **Claim's concurrency gate has a narrow race.** The `NOT EXISTS ... running` subquery
  is not itself locked, so two workers claiming in the same instant could in principle
  both get a job for one shop. Harmless today (single runner; the reconcile upsert is
  idempotent). A partial unique index on `(shopId) WHERE status = 'running'` closes it.
- **No enqueue debounce.** `runAfter` is always now. Deliberate: a debounce window
  could starve a job under continuous order flow, and coalescing already collapses
  bursts.
- **No Sentry / structured logs** for job failures (design §6, later slice).

## 8. Human gates

| Gate | Why |
| --- | --- |
| `shopify app deploy` | Registers the three `orders/*` topics; needs Partner auth |
| Manual Neon migrate (if not using Fly boot) | Only when DB is outside Fly’s `DATABASE_URL` boot path |
