-- One saved Goals target. Null until the merchant saves it.
ALTER TABLE "Settings" ADD COLUMN "targetMerSavedAt" TIMESTAMP(3);
