/**
 * Merchant-visible Level-1 data_request package retrieval (ops / Settings).
 * Opaque order ids, amounts, dates, customerKey only — never name/email/phone.
 *
 * Retention: packages auto-purge after COMPLIANCE_EXPORT_TTL_DAYS (60).
 * Also erased on customers/redact, shop/redact, and uninstall.
 */
import prisma from "../db.server";

/** Max age for ComplianceDataExport rows (Shopify data_request packages). */
export const COMPLIANCE_EXPORT_TTL_DAYS = 60;

export type ComplianceExportListItem = {
  id: string;
  customerNumericId: string;
  orderFactCount: number;
  createdAt: string;
};

/** Delete Level-1 packages older than TTL. Safe to call on every list/retrieve. */
export async function purgeExpiredComplianceDataExports(
  now: Date = new Date(),
): Promise<number> {
  const cutoff = new Date(
    now.getTime() - COMPLIANCE_EXPORT_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  const result = await prisma.complianceDataExport.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function listComplianceDataExportsForShop(
  shopDomain: string,
  limit = 20,
): Promise<ComplianceExportListItem[]> {
  await purgeExpiredComplianceDataExports();
  const rows = await prisma.complianceDataExport.findMany({
    where: { shopDomain },
    orderBy: { createdAt: "desc" },
    take: Math.min(50, Math.max(1, limit)),
    select: {
      id: true,
      customerNumericId: true,
      orderFactCount: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    customerNumericId: r.customerNumericId,
    orderFactCount: r.orderFactCount,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getComplianceDataExportPackage(
  shopDomain: string,
  exportId: string,
): Promise<{ id: string; packageJson: string; orderFactCount: number } | null> {
  await purgeExpiredComplianceDataExports();
  const row = await prisma.complianceDataExport.findFirst({
    where: { id: exportId, shopDomain },
    select: { id: true, packageJson: true, orderFactCount: true },
  });
  return row;
}
