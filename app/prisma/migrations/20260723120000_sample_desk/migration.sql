-- AlterTable
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "useSampleDesk" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SpendEntry" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
CREATE INDEX IF NOT EXISTS "SpendEntry_shopId_source_idx" ON "SpendEntry"("shopId", "source");

-- CreateTable
CREATE TABLE IF NOT EXISTS "SampleSalesDay" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "sales" DOUBLE PRECISION NOT NULL,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "returningCustomers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SampleSalesDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SampleSalesDay_shopId_day_key" ON "SampleSalesDay"("shopId", "day");
CREATE INDEX IF NOT EXISTS "SampleSalesDay_shopId_day_idx" ON "SampleSalesDay"("shopId", "day");

DO $$ BEGIN
  ALTER TABLE "SampleSalesDay" ADD CONSTRAINT "SampleSalesDay_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
