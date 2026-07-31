-- Immutable Monday cash close — period snapshot + one recorded decision.
CREATE TABLE "CashClose" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "netSales" DOUBLE PRECISION NOT NULL,
    "grossSales" DOUBLE PRECISION NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "mer" DOUBLE PRECISION,
    "breakEvenMer" DOUBLE PRECISION,
    "marginPct" DOUBLE PRECISION,
    "coveragePct" INTEGER,
    "reconStatus" TEXT,
    "cashActionReady" BOOLEAN NOT NULL DEFAULT false,
    "exceptionsJson" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decisionNote" TEXT,
    "cutPct" DOUBLE PRECISION,
    "priorCloseId" TEXT,
    "deltaSales" DOUBLE PRECISION,
    "deltaSpend" DOUBLE PRECISION,
    "deltaMer" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashClose_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashClose_shopId_periodStart_periodEnd_key" ON "CashClose"("shopId", "periodStart", "periodEnd");

CREATE INDEX "CashClose_shopId_lockedAt_idx" ON "CashClose"("shopId", "lockedAt");

ALTER TABLE "CashClose" ADD CONSTRAINT "CashClose_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
