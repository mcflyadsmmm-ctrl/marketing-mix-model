-- Cash-safe repair for SpendEntry dedupe (see critic on 20260726080000).
-- Prior migration kept newest row only and archived losers without summing amounts.
-- Old writers often create()'d additive same-day lines — restore cash totals:
--   • all amounts equal in (live ∪ archive) → keep survivor amount (idempotent retry)
--   • amounts differ → set survivor to SUM(live + archived)

WITH combined AS (
  SELECT "shopId", "channel", "periodStart", "amount" FROM "SpendEntry"
  UNION ALL
  SELECT "shopId", "channel", "periodStart", "amount" FROM "_SpendEntryDedupArchive"
),
agg AS (
  SELECT
    "shopId",
    "channel",
    "periodStart",
    SUM("amount") AS total_amount,
    COUNT(DISTINCT "amount") AS distinct_amounts
  FROM combined
  GROUP BY "shopId", "channel", "periodStart"
),
touched AS (
  SELECT DISTINCT "shopId", "channel", "periodStart"
  FROM "_SpendEntryDedupArchive"
)
UPDATE "SpendEntry" AS s
SET
  "amount" = CASE
    WHEN a.distinct_amounts <= 1 THEN s."amount"
    ELSE a.total_amount
  END,
  "updatedAt" = CURRENT_TIMESTAMP
FROM agg a
INNER JOIN touched t
  ON t."shopId" = a."shopId"
 AND t."channel" = a."channel"
 AND t."periodStart" = a."periodStart"
WHERE s."shopId" = a."shopId"
  AND s."channel" = a."channel"
  AND s."periodStart" = a."periodStart";
