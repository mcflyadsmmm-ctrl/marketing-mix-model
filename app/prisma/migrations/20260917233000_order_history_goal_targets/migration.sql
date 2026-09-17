-- Soft order-history Goals: LTV + returning-$ targets. Null = unset.
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "ltvTarget" DOUBLE PRECISION;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "returningSalesTarget" DOUBLE PRECISION;
