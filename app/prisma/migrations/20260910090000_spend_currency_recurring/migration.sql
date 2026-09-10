-- Shop currency on spend rows + cents-safe amount. Recurring fill-forward rules.

ALTER TABLE "SpendEntry"
  ALTER COLUMN "amount" TYPE DECIMAL(12,2)
  USING ROUND("amount"::numeric, 2);

ALTER TABLE "SpendEntry"
  ADD COLUMN IF NOT EXISTS "currency" CHAR(3) NOT NULL DEFAULT 'USD';

UPDATE "SpendEntry" AS e
SET "currency" = s."currencyCode"
FROM "Shop" AS s
WHERE e."shopId" = s.id
  AND s."currencyCode" IS NOT NULL
  AND char_length(btrim(s."currencyCode")) = 3;

CREATE TABLE IF NOT EXISTS "RecurringSpend" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "channel" "SpendChannel" NOT NULL,
  "customKey" TEXT NOT NULL DEFAULT '',
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RecurringSpend_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecurringSpend_shopId_channel_customKey_idx"
  ON "RecurringSpend"("shopId", "channel", "customKey");

CREATE INDEX IF NOT EXISTS "RecurringSpend_shopId_endDate_idx"
  ON "RecurringSpend"("shopId", "endDate");

ALTER TABLE "RecurringSpend"
  ADD CONSTRAINT "RecurringSpend_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
