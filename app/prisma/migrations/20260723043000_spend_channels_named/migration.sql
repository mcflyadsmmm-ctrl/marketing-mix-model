-- AlterEnum: named ad platforms for CSV template (no live ad APIs required)
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'microsoft';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'tiktok';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'affiliate';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'email';
