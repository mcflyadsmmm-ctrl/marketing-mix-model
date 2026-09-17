-- Guest-checkout depth for the Snowdevil SAMPLE book so the "Guest Checkouts"
-- tile shows real dollars (not —). Subset of orderCount; identified buyers
-- split into new vs returning.
ALTER TABLE "SampleSalesDay" ADD COLUMN IF NOT EXISTS "guestOrders" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SampleSalesDay" ADD COLUMN IF NOT EXISTS "guestNetSales" DOUBLE PRECISION NOT NULL DEFAULT 0;
