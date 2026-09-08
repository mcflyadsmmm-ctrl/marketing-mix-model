-- First-class paid channels (avoid dumping X / LinkedIn / Amazon / ASA into Other)
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'x';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'linkedin';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'amazon';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'apple_search';
