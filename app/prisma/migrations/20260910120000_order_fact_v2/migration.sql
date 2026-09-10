-- OrderFact v2: discount $, POS/Online/Shop source, unit count (qty only).

ALTER TABLE "OrderFact" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION;
ALTER TABLE "OrderFact" ADD COLUMN IF NOT EXISTS "sourceName" TEXT;
ALTER TABLE "OrderFact" ADD COLUMN IF NOT EXISTS "unitCount" INTEGER;
