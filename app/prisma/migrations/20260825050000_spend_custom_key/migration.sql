-- Multiple named "other" channels (billboards, radio, a podcast…) on the same
-- day. customKey is "" for named digital platforms and unlabeled Other.

ALTER TABLE "SpendEntry" ADD COLUMN IF NOT EXISTS "customKey" TEXT NOT NULL DEFAULT '';

UPDATE "SpendEntry"
SET "customKey" = left(
  trim(both '-' from regexp_replace(lower(btrim("note")), '[^a-z0-9]+', '-', 'g')),
  48
)
WHERE "channel" = 'other'
  AND "note" IS NOT NULL
  AND btrim("note") <> ''
  AND "note" NOT LIKE 'sync:%'
  AND "note" NOT LIKE 'api:%'
  AND "note" NOT LIKE 'sample:%';

UPDATE "SpendEntry"
SET "customKey" = ''
WHERE "customKey" IN ('other', 'other-ads', 'other-spend');

DROP INDEX IF EXISTS "SpendEntry_shopId_channel_periodStart_key";

CREATE UNIQUE INDEX IF NOT EXISTS "SpendEntry_shopId_channel_customKey_periodStart_key"
  ON "SpendEntry"("shopId", "channel", "customKey", "periodStart");
