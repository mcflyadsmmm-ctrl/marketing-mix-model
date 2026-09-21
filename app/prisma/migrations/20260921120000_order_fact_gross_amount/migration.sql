-- Order revenue before refunds (totalPriceSet). Null until a crawl sends it.
ALTER TABLE "OrderFact" ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION;
