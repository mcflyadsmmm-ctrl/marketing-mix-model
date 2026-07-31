-- Goals optional: merchants can hide the sales goal plan and keep YoY metrics only.
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "goalsEnabled" BOOLEAN NOT NULL DEFAULT true;
