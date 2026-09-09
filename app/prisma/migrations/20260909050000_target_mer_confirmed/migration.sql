-- Optional operating target. `targetMer` stays non-null (allocation, pacing, Goals
-- and SAMPLE all need a numeric rail); this timestamp is what makes it a merchant
-- target rather than a hidden default.
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "targetMerConfirmedAt" TIMESTAMP(3);

-- Installed shops are already steering by a visible target on Overview. Backfill
-- every existing row so migrate does not silently drop their goal rail; merchants
-- can clear an inherited target from Settings. New rows begin unconfirmed.
UPDATE "Settings"
SET "targetMerConfirmedAt" = "updatedAt"
WHERE "targetMerConfirmedAt" IS NULL;
