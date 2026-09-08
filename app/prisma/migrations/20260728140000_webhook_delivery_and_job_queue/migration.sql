-- Enterprise P0: idempotent webhook delivery ledger + Postgres-backed job queue.
-- Level 1 only — no customer PII, no payload bodies persisted.

CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'dead');

-- Idempotency ledger for inbound Shopify webhooks. No Shop FK: deliveries can land
-- before the Shop row exists and must outlive shop/redact to suppress retries.
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "deliveryKey" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "resourceId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebhookDelivery_deliveryKey_key" ON "WebhookDelivery"("deliveryKey");

CREATE INDEX "WebhookDelivery_shopDomain_topic_receivedAt_idx" ON "WebhookDelivery"("shopDomain", "topic", "receivedAt");

-- Retention sweep: one row per order event would otherwise grow without bound.
CREATE INDEX "WebhookDelivery_receivedAt_idx" ON "WebhookDelivery"("receivedAt");

-- Postgres job queue. Unique (shopId, type, dedupeKey) coalesces repeat webhooks for
-- the same unit of work onto one re-armed row instead of N duplicate recomputes.
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Job_shopId_type_dedupeKey_key" ON "Job"("shopId", "type", "dedupeKey");

-- Claim scan: pending rows whose runAfter has passed.
CREATE INDEX "Job_status_runAfter_idx" ON "Job"("status", "runAfter");

-- Per-shop concurrency-1 gate: "does this shop already have a running job?"
CREATE INDEX "Job_shopId_status_idx" ON "Job"("shopId", "status");

ALTER TABLE "Job" ADD CONSTRAINT "Job_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
