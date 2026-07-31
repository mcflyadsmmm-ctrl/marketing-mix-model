import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteManyComplianceDataExport = vi.fn();
const findManyComplianceDataExport = vi.fn();
const findFirstComplianceDataExport = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    complianceDataExport: {
      deleteMany: (...args: unknown[]) =>
        deleteManyComplianceDataExport(...args),
      findMany: (...args: unknown[]) => findManyComplianceDataExport(...args),
      findFirst: (...args: unknown[]) => findFirstComplianceDataExport(...args),
    },
  },
}));

import {
  COMPLIANCE_EXPORT_TTL_DAYS,
  listComplianceDataExportsForShop,
  purgeExpiredComplianceDataExports,
} from "./compliance-export-retrieve.server";

describe("ComplianceDataExport TTL", () => {
  beforeEach(() => {
    deleteManyComplianceDataExport.mockReset();
    findManyComplianceDataExport.mockReset();
    findFirstComplianceDataExport.mockReset();
    deleteManyComplianceDataExport.mockResolvedValue({ count: 2 });
    findManyComplianceDataExport.mockResolvedValue([]);
  });

  it("exports a 30–90 day TTL constant", () => {
    expect(COMPLIANCE_EXPORT_TTL_DAYS).toBeGreaterThanOrEqual(30);
    expect(COMPLIANCE_EXPORT_TTL_DAYS).toBeLessThanOrEqual(90);
  });

  it("purges rows older than TTL via createdAt", async () => {
    const now = new Date("2026-07-28T12:00:00.000Z");
    const purged = await purgeExpiredComplianceDataExports(now);
    expect(purged).toBe(2);
    expect(deleteManyComplianceDataExport).toHaveBeenCalledWith({
      where: {
        createdAt: {
          lt: new Date(
            now.getTime() - COMPLIANCE_EXPORT_TTL_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
      },
    });
  });

  it("list runs purge before querying shop packages", async () => {
    await listComplianceDataExportsForShop("example.myshopify.com");
    expect(deleteManyComplianceDataExport).toHaveBeenCalled();
    expect(findManyComplianceDataExport).toHaveBeenCalled();
  });
});
