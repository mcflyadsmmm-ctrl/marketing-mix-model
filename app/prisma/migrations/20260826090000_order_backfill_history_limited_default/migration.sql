-- historyLimited means Shopify denied deep order history (ACCESS_DENIED /
-- no read_all_orders). New shops must start false so empty LTV is "syncing"
-- rather than a fake limited window before the first ingest kick.
ALTER TABLE "OrderBackfillState" ALTER COLUMN "historyLimited" SET DEFAULT false;
