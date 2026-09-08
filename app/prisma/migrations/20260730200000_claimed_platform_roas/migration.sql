-- Optional platform-claimed ROAS for Till Truth claimed-vs-banked education.
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "claimedPlatformRoas" DOUBLE PRECISION;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "claimedPlatformRoasLabel" TEXT;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "claimedPlatformRoasUpdatedAt" TIMESTAMP(3);
