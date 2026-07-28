-- Till LTV facts: OrderFact + CohortFact + OrderBackfillState (Level 1 — no PII).

CREATE TABLE IF NOT EXISTS "OrderFact" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "customerKey" TEXT NOT NULL,
    "orderedAt" TIMESTAMP(3) NOT NULL,
    "shopLocalDate" DATE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT,
    "asOf" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'shopify_order_v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderFact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrderFact_shopId_shopifyOrderId_key" ON "OrderFact"("shopId", "shopifyOrderId");
CREATE INDEX IF NOT EXISTS "OrderFact_shopId_orderedAt_idx" ON "OrderFact"("shopId", "orderedAt");
CREATE INDEX IF NOT EXISTS "OrderFact_shopId_customerKey_orderedAt_idx" ON "OrderFact"("shopId", "customerKey", "orderedAt");

DO $$ BEGIN
  ALTER TABLE "OrderFact" ADD CONSTRAINT "OrderFact_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CohortFact" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "cohortMonth" TEXT NOT NULL,
    "customers" INTEGER NOT NULL,
    "revenueD30" DOUBLE PRECISION NOT NULL,
    "revenueD90" DOUBLE PRECISION NOT NULL,
    "revenueD365" DOUBLE PRECISION NOT NULL,
    "ordersD30" INTEGER NOT NULL,
    "ordersD90" INTEGER NOT NULL,
    "ordersD365" INTEGER NOT NULL,
    "asOf" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohortFact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CohortFact_shopId_cohortMonth_key" ON "CohortFact"("shopId", "cohortMonth");

DO $$ BEGIN
  ALTER TABLE "CohortFact" ADD CONSTRAINT "CohortFact_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrderBackfillState" (
    "shopId" TEXT NOT NULL,
    "cursor" TEXT,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'idle',
    "lastError" TEXT,
    "historyLimited" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderBackfillState_pkey" PRIMARY KEY ("shopId")
);

DO $$ BEGIN
  ALTER TABLE "OrderBackfillState" ADD CONSTRAINT "OrderBackfillState_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
