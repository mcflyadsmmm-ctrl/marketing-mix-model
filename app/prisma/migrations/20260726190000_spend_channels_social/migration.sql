-- Named social channels for CSV cash desk (no live ad APIs)
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'pinterest';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'snapchat';
ALTER TYPE "SpendChannel" ADD VALUE IF NOT EXISTS 'reddit';
