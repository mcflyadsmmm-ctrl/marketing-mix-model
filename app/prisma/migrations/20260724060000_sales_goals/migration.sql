-- CreateTable
CREATE TABLE IF NOT EXISTS "SalesGoal" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "salesGoal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SalesGoal_shopId_year_month_key"
  ON "SalesGoal"("shopId", "year", "month");

CREATE INDEX IF NOT EXISTS "SalesGoal_shopId_year_idx"
  ON "SalesGoal"("shopId", "year");

DO $$ BEGIN
  ALTER TABLE "SalesGoal" ADD CONSTRAINT "SalesGoal_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
