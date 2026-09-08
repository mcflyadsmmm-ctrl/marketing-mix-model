-- Persist Ads Manager–comparable gross on SalesDayFact so desk facts do not
-- mislabel closed-day net as gross (refund haircut honesty).
ALTER TABLE "SalesDayFact" ADD COLUMN IF NOT EXISTS "grossSales" DOUBLE PRECISION;
