-- SalesDayFact.netSales (Shopify Net / currentSubtotalPriceSet) + Settings.salesBasis
ALTER TABLE "SalesDayFact" ADD COLUMN IF NOT EXISTS "netSales" DOUBLE PRECISION;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "salesBasis" TEXT NOT NULL DEFAULT 'total';
