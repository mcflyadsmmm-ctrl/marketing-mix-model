-- Level-1 customers/data_request package (opaque order fields only). No Shop FK.
CREATE TABLE "ComplianceDataExport" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopId" TEXT,
    "customerNumericId" TEXT NOT NULL,
    "orderFactCount" INTEGER NOT NULL,
    "packageJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceDataExport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComplianceDataExport_shopDomain_idx" ON "ComplianceDataExport"("shopDomain");
CREATE INDEX "ComplianceDataExport_shopDomain_customerNumericId_idx" ON "ComplianceDataExport"("shopDomain", "customerNumericId");
