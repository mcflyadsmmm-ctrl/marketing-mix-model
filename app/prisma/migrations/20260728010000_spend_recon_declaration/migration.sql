-- Optional Ads Manager declared total for CSV recon (±5%).
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "declaredAdsSpend" DOUBLE PRECISION;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "declaredAdsSpendPeriodStart" TIMESTAMP(3);
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "declaredAdsSpendPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "declaredAdsSpendUpdatedAt" TIMESTAMP(3);
