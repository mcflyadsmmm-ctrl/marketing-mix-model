-- Paid-cycle remainder for Shopify App Pricing. No Shop FK.
-- Survives app/uninstalled. shop/redact deletes the row by domain.
-- Not a trial tombstone: no trial-consumed flag.
CREATE TABLE "ShopBillingCycle" (
    "shopDomain" TEXT NOT NULL,
    "paidCycleEndsAt" TIMESTAMP(3) NOT NULL,
    "cancelAtEndOfCycle" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopBillingCycle_pkey" PRIMARY KEY ("shopDomain")
);
