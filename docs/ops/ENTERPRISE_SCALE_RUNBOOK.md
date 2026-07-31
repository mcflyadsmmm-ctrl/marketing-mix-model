# Mcfly enterprise scale runbook

**Scope:** large Shopify order histories and spend files on the existing Fly + Postgres
stack. Postgres facts are the serving layer; Shopify and spend sources are ingest
systems. No BigQuery, pixels, MTA, or synchronous source crawl on a desk request.

## SLOs

Measure by shop and route; publish p50/p95/p99 plus error rate.

| Signal | Target | Breach action |
| --- | --- | --- |
| Cash desk loader, facts complete | p95 ≤2.0s, p99 ≤3.0s; 99.9% successful responses over 30d | Inspect DB/query latency and regressions; never restore live GraphQL fallback |
| Other facts-backed desk routes | p95 ≤3.0s; no Shopify/ads API calls in request path | Return an honest stale/backfilling state and enqueue work |
| Order webhook receipt | p95 ≤500ms from request arrival to durable receipt; acknowledge only after commit | Alert on 5xx or receipt insert failures |
| Order fact freshness | p95 ≤2 min, p99 ≤10 min from Shopify webhook receipt to `OrderFact`/`SalesDayFact` update | Retry; alert when oldest ready job >10 min |
| Scheduled reconciliation | Every active shop reconciled at least every 6h; 99% complete within 30 min of schedule | Queue a bounded repair window, not a full-history desk crawl |
| Spend sync freshness | Provider jobs p95 ≤6h after the provider day closes; CSV visible p95 ≤30s after accepted upload | Surface source timestamp and failed-row count |
| Queue reliability | ≥99.9% jobs succeed within 3 attempts; zero silent drops | Dead-letter after bounded retries and page on sustained growth |

“Fresh” always means the displayed `asOf` timestamp. Missing or stale facts must be
visible; they must never be presented as a complete period.

## Exact build order

Do not parallelize these migrations. Each stage must pass its exit gate before the
next stage starts.

### 1. Hard-stop live GraphQL on desk reads

1. Instrument current desk route duration, GraphQL call count, fact coverage, and
   selected period.
2. Make `SalesDayFact`/`OrderFact` and `SpendEntry` the only production read path for
   Cash MER, Close, Allocation, Goals, LTV, and `/v1` equivalents.
3. Remove request-time `fetchShopifySales*`, `runSalesFactsBackfill`, and
   `runOrderFactsBackfill` behavior. This includes today top-ups, L12M/3yr, prior
   period, explorer, and incomplete coverage.
4. When facts are incomplete, return stored partial totals only when explicitly
   labeled, the coverage interval, `asOf`, and a `backfilling`/`history_limited`
   state. Enqueue refresh asynchronously; do not wait.
5. SalesDayFact serving/backfill window is **Jan 1 of (UTC year − 4)** (e.g. mid-2026 →
   `2022-01-01`). Worker/overnight ticks fill missing closed days. Periods that start
   before that edge show an honesty banner; desk HARD-STOPs on incomplete facts inside
   the window. Do not widen further without Neon size + GraphQL cost review. Retain
   daily aggregates indefinitely; storage is small compared with per-order history.

**Exit gate:** an automated route test fails if any desk request invokes Shopify
GraphQL. Loaders meet the facts-backed SLO for MTD, L12M, and 3yr with incomplete and
complete datasets.

### 2. Add order webhook intake

1. Subscribe to the minimum order-change topics needed to keep till facts correct:
   `orders/create`, `orders/updated`, `orders/cancelled`, and `refunds/create`.
2. Authenticate with Shopify's webhook verifier. Capture Shopify webhook id, topic,
   shop, API version, received time, and the minimal Level-1 payload needed for facts.
3. Insert `WebhookDelivery` with a unique delivery id, then return 200 only after the
   transaction commits. Duplicate delivery ids return 200 without duplicate work.
4. Do not compute cohorts or rebuild long date ranges in the HTTP handler. Webhooks
   are a freshness signal, not the sole ledger; scheduled reconciliation remains
   authoritative for missed or out-of-order events.

**Exit gate:** invalid signatures are rejected; duplicate and out-of-order fixture
deliveries are idempotent; valid intake meets the receipt SLO.

### 3. Turn Postgres into the queue

1. Add `Job` and queue indexes. A dispatcher converts unprocessed
   `WebhookDelivery` rows to idempotent jobs in the same transaction that marks the
   delivery dispatched.
2. Run a worker process from the same deploy image. Claim bounded batches with
   `SELECT ... FOR UPDATE SKIP LOCKED`, set a lease, commit, then process outside the
   claim transaction.
3. Use deterministic idempotency keys such as
   `order:<shopId>:<orderGid>:<updatedAt>` and
   `reconcile:<shopId>:<windowStart>:<windowEnd>`.
4. On order change, upsert `OrderFact`, recompute only affected shop-local
   `SalesDayFact` dates, then update only affected cohorts. Never rebuild the whole
   shop.
5. Retry with exponential backoff plus jitter (for example 30s, 2m, 10m, 30m,
   2h), maximum 8 attempts. Expired leases are reclaimable. Terminal failures become
   `dead` with the last bounded error; no infinite retry loop.
6. Queue install backfills and six-hour reconciliation in small date windows. Apply
   per-shop concurrency 1 for order mutations and a global Shopify concurrency/rate
   limit.

**Exit gate:** two workers process each idempotency key once, recover an expired
lease, and drain a 10× burst while desk latency remains within SLO.

### 4. Replace spend N+1 writes with batch upsert

1. Parse, normalize, validate, and deduplicate the upload in memory by
   `(shopId, channel, periodStart)`; last valid row wins, matching current semantics.
2. Write chunks of 500–2,000 rows with one parameterized Postgres
   `INSERT ... VALUES ... ON CONFLICT (shopId, channel, periodStart) DO UPDATE`.
   Update amount, period end, note, source, and `updatedAt`.
3. Compare existing values in SQL (`IS DISTINCT FROM`) so unchanged rows are counted
   as skipped without a per-row `findUnique`.
4. Keep one short transaction per chunk, cap upload rows/bytes, and return written,
   skipped, and rejected counts. Queue large provider syncs instead of holding an HTTP
   request open.

**Exit gate:** query count is O(chunks), not O(rows); duplicate semantics match the
current repository; 100k rows do not breach desk SLOs.

### 5. Run and retain the load matrix

Use synthetic Level-1 data only. Test cold and warm DB caches, one and two workers,
normal traffic, a 10× webhook burst, and worker restart/lease recovery.

| Shape | Shops | Orders/shop | Daily facts/shop | Spend rows/shop | Required assertions |
| --- | ---: | ---: | ---: | ---: | --- |
| Baseline | 50 | 10k | 1,095 | 10k | All SLOs; no request-time external API |
| Growth | 500 | 100k | 1,825 | 50k | Queue drains within 10 min; desk p95 holds |
| Large merchant | 1 | 5m | 3,650 | 500k | Bounded memory; no full table scan or timeout |
| Burst | 500 | — | — | — | 100k deliveries/10 min; no duplicate facts |
| Repair | 100 | 1m | 3,650 | 100k | Six-hour reconcile plus live webhooks without starvation |

Record app CPU/RAM, DB CPU/storage/IO, connection count, route percentiles, oldest
ready job, retry/dead counts, ingest lag, and rows/sec. Pass only when query plans use
shop/date or queue indexes and the desk SLO holds during ingestion. Re-run before
raising a machine or database tier.

## Prisma schema sketch

Neither model exists in the current schema. Keep raw payload retention short and
Level 1 only; `Job.payload` should normally reference a delivery/order/window rather
than duplicate customer data.

```prisma
model WebhookDelivery {
  id             String    @id @default(cuid())
  shopId         String?
  shop           Shop?     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopDomain     String
  shopifyEventId String    @unique
  topic          String
  apiVersion     String?
  payload        Json
  receivedAt     DateTime  @default(now())
  dispatchedAt   DateTime?
  expiresAt      DateTime

  @@index([dispatchedAt, receivedAt])
  @@index([shopDomain, receivedAt])
  @@index([expiresAt])
}

model Job {
  id             String    @id @default(cuid())
  shopId         String?
  shop           Shop?     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  kind           String
  status         String    @default("ready") // ready | running | succeeded | dead
  idempotencyKey String    @unique
  payload        Json
  priority       Int       @default(100)
  attempts       Int       @default(0)
  maxAttempts    Int       @default(8)
  runAt          DateTime  @default(now())
  lockedAt       DateTime?
  lockedBy       String?
  lastError      String?   @db.Text
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  finishedAt     DateTime?

  @@index([status, runAt, priority])
  @@index([shopId, status, runAt])
  @@index([lockedAt])
}
```

Add `jobs Job[]` and `webhookDeliveries WebhookDelivery[]` to `Shop`. Use a partial
Postgres index on ready jobs ordered by `(priority, runAt)` if Prisma cannot express
it. Purge successful jobs after 7–14 days and webhook payloads after the shortest
operationally useful period; retain aggregate facts, metrics, and dead-job metadata.

## HUMAN gates

- Shopify Partner approval for `read_all_orders` remains human. Until approved,
  ingest only the accessible history, keep `OrderBackfillState.historyLimited = true`,
  and label L12M/3yr/till-LTV coverage honestly. Do not repeatedly request denied
  history or imply complete deep history.
- Partner login/MFA, protected-customer-data declarations, app version release,
  production billing cards, and production secret changes remain human.
- Human approval is required before increasing recurring infrastructure spend or
  changing retention of protected order data.

## Cost guardrail: stay ≤$200/month until paid seats

- Use the existing Fly app image plus one worker process and the existing
  Postgres/Neon database. Postgres is the queue; add no Redis, Kafka, warehouse,
  BigQuery, or second analytics host.
- Operating envelope: Fly ≤$80, Postgres ≤$70, observability ≤$26, email ≤$20, and
  DNS ≤$5; total ceiling $200/month. Set provider budget alerts at $150 and $190.
- Start with one always-on app machine and a low-concurrency worker. Scale workers
  down when the queue is empty; cap DB connections with a pooler.
- Tune indexes, batching, retention, and query plans before adding compute. Archive
  nothing to a warehouse: purge webhook payloads/jobs while retaining compact daily
  facts.
- Add a second app/worker machine or larger Postgres tier only when measured SLO
  breaches persist after tuning **and** paid-seat revenue covers the step. At the
  planned ~$79 flat price, require at least three paying stores before operating near
  the ceiling.
