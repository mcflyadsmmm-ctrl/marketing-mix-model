-- Explicit margin confirmation (replaces updatedAt-createdAt > 500ms heuristic).
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "marginConfirmedAt" TIMESTAMP(3);

-- Backfill shops that already saved Settings under the old heuristic so activation
-- does not reset to "unconfirmed" on migrate.
UPDATE "Settings"
SET "marginConfirmedAt" = "updatedAt"
WHERE "marginConfirmedAt" IS NULL
  AND "updatedAt" > "createdAt" + INTERVAL '500 milliseconds';
