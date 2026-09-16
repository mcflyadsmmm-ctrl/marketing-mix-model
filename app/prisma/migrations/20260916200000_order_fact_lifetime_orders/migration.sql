-- Shopify customer.numberOfOrders at ingest. Distinguishes first-on-file from lifetime first.
ALTER TABLE "OrderFact" ADD COLUMN IF NOT EXISTS "lifetimeOrders" INTEGER;
