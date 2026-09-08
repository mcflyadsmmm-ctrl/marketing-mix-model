-- Separate live vs sample till LTV cohorts (demo must not overwrite live).
ALTER TABLE "CohortFact" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'shopify_order_v1';

DROP INDEX IF EXISTS "CohortFact_shopId_cohortMonth_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CohortFact_shopId_cohortMonth_source_key"
  ON "CohortFact"("shopId", "cohortMonth", "source");

CREATE INDEX IF NOT EXISTS "CohortFact_shopId_source_cohortMonth_idx"
  ON "CohortFact"("shopId", "source", "cohortMonth");
