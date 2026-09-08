-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "shopId" TEXT,
    "phase" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "metrics" JSONB,
    "errors" JSONB,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerSnapshot" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "sales" DOUBLE PRECISION NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "mer" DOUBLE PRECISION,
    "breakEvenMer" DOUBLE PRECISION NOT NULL,
    "channelMix" JSONB NOT NULL,
    "allocation" JSONB,
    "reconStatus" TEXT NOT NULL DEFAULT 'pending',
    "reconDelta" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_shopId_idx" ON "ApiToken"("shopId");

-- CreateIndex
CREATE INDEX "SyncRun_runId_idx" ON "SyncRun"("runId");

-- CreateIndex
CREATE INDEX "SyncRun_shopId_startedAt_idx" ON "SyncRun"("shopId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerSnapshot_shopId_periodStart_periodEnd_key" ON "MerSnapshot"("shopId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "MerSnapshot_shopId_createdAt_idx" ON "MerSnapshot"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerSnapshot" ADD CONSTRAINT "MerSnapshot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
