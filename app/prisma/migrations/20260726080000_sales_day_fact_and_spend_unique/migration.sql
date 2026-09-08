-- AlterTable: Shop needs timezone + currency for local-day sales-fact boundaries.
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "ianaTimezone" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "currencyCode" CHAR(3);

-- CreateTable: daily Shopify sales fact (real store). Desk wiring is a separate ticket.
CREATE TABLE IF NOT EXISTS "SalesDayFact" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "sales" DOUBLE PRECISION NOT NULL,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "returningCustomers" INTEGER NOT NULL DEFAULT 0,
    "guestOrders" INTEGER NOT NULL DEFAULT 0,
    "customerMetricsAvailable" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT,
    "asOf" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'shopify',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesDayFact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SalesDayFact_shopId_day_key" ON "SalesDayFact"("shopId", "day");
CREATE INDEX IF NOT EXISTS "SalesDayFact_shopId_day_idx" ON "SalesDayFact"("shopId", "day");

DO $$ BEGIN
  ALTER TABLE "SalesDayFact" ADD CONSTRAINT "SalesDayFact_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dedupe SpendEntry BEFORE adding the (shopId, channel, periodStart) unique index,
-- so upsert call sites (spend-repository, app.spend.tsx, v1.spend.tsx) have a safe
-- target. Archive losing rows first (never hard-delete history), keep the row with
-- the newest updatedAt, then newest createdAt, then highest id as final tiebreak.
CREATE TABLE IF NOT EXISTS "_SpendEntryDedupArchive" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "channel" "SpendChannel" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_SpendEntryDedupArchive_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_SpendEntryDedupArchive"
  ("id", "shopId", "channel", "amount", "periodStart", "periodEnd", "note", "source", "createdAt", "updatedAt")
SELECT
  "id", "shopId", "channel", "amount", "periodStart", "periodEnd", "note", "source", "createdAt", "updatedAt"
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY "shopId", "channel", "periodStart"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
    ) AS rn
  FROM "SpendEntry"
) ranked
WHERE rn > 1
ON CONFLICT ("id") DO NOTHING;

DELETE FROM "SpendEntry"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "shopId", "channel", "periodStart"
        ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
      ) AS rn
    FROM "SpendEntry"
  ) ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "SpendEntry_shopId_channel_periodStart_key"
  ON "SpendEntry"("shopId", "channel", "periodStart");
