import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureShop = vi.fn();
const loadDeskSalesForPeriod = vi.fn();
const unauthenticatedAdmin = vi.fn();

vi.mock("../shopify.server", () => ({
  unauthenticated: {
    admin: (...args: unknown[]) => unauthenticatedAdmin(...args),
  },
}));

vi.mock("./mer-dashboard.server", () => ({
  ensureShop: (...args: unknown[]) => ensureShop(...args),
}));

vi.mock("./sales-facts.server", () => ({
  loadDeskSalesForPeriod: (...args: unknown[]) => loadDeskSalesForPeriod(...args),
}));

import {
  apiQueryDateRange,
  fetchShopifySalesForShop,
  isSalesFactsIncompleteForApi,
} from "./shopify-sales-api.server";

const here = dirname(fileURLToPath(import.meta.url));
const apiSource = readFileSync(join(here, "shopify-sales-api.server.ts"), "utf8");
const merRouteSource = readFileSync(
  join(here, "../routes/v1.mer.tsx"),
  "utf8",
);
const allocRouteSource = readFileSync(
  join(here, "../routes/v1.allocation.tsx"),
  "utf8",
);

describe("apiQueryDateRange (TZ honesty)", () => {
  it("uses UTC calendar-day bounds when shop TZ is unknown (not host-local)", () => {
    const range = apiQueryDateRange("2026-07-01", "2026-07-15", null);
    expect(range.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-15T23:59:59.999Z");
    expect(range.label).toBe("2026-07-01 → 2026-07-15");
  });

  it("uses shop IANA day bounds when timezone is known", () => {
    const range = apiQueryDateRange(
      "2026-07-01",
      "2026-07-01",
      "America/Denver",
    );
    // Denver is UTC-6 in July
    expect(range.start.toISOString()).toBe("2026-07-01T06:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-02T05:59:59.999Z");
  });
});

describe("isSalesFactsIncompleteForApi", () => {
  it("is true when closed days expected, incomplete, inside fact window", () => {
    expect(
      isSalesFactsIncompleteForApi({
        expectedClosedDays: 7,
        factDays: 3,
        complete: false,
        periodExceedsFactWindow: false,
      }),
    ).toBe(true);
  });

  it("is false when period exceeds fact window (disclose via warning, not this gate)", () => {
    expect(
      isSalesFactsIncompleteForApi({
        expectedClosedDays: 60,
        factDays: 40,
        complete: false,
        periodExceedsFactWindow: true,
      }),
    ).toBe(false);
  });

  it("is false when complete or no closed days expected", () => {
    expect(
      isSalesFactsIncompleteForApi({
        expectedClosedDays: 7,
        factDays: 7,
        complete: true,
        periodExceedsFactWindow: false,
      }),
    ).toBe(false);
    expect(
      isSalesFactsIncompleteForApi({
        expectedClosedDays: 0,
        factDays: 0,
        complete: false,
        periodExceedsFactWindow: false,
      }),
    ).toBe(false);
    expect(isSalesFactsIncompleteForApi(null)).toBe(true);
  });
});

describe("fetchShopifySalesForShop (facts HARD-STOP)", () => {
  beforeEach(() => {
    ensureShop.mockReset();
    loadDeskSalesForPeriod.mockReset();
    unauthenticatedAdmin.mockReset();
    ensureShop.mockResolvedValue({
      id: "shop_1",
      domain: "demo.myshopify.com",
      ianaTimezone: "UTC",
    });
    unauthenticatedAdmin.mockResolvedValue({ admin: { graphql: vi.fn() } });
  });

  it("returns ok:false when desk salesError is set (never silent zero success)", async () => {
    loadDeskSalesForPeriod.mockResolvedValue({
      sales: {
        totalSales: 0,
        grossSales: 0,
        netSales: 0,
        orderCount: 0,
        newCustomers: 0,
        returningCustomers: 0,
        guestOrders: 0,
      },
      salesError: "Failed to load sales facts",
      factsCoverage: null,
      todaySalesUnavailable: false,
      todaySalesTruncated: false,
    });

    const result = await fetchShopifySalesForShop("demo.myshopify.com", {
      from: "2026-07-01",
      to: "2026-07-15",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.warning).toMatch(/Failed to load sales facts/);
    }
    expect(loadDeskSalesForPeriod).toHaveBeenCalledTimes(1);
  });

  it("returns ok:false on session/admin failure (no silent $0)", async () => {
    unauthenticatedAdmin.mockRejectedValue(new Error("No offline session"));

    const result = await fetchShopifySalesForShop("demo.myshopify.com", {
      from: "2026-07-01",
      to: "2026-07-07",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.warning).toMatch(/No offline session/);
    }
    expect(loadDeskSalesForPeriod).not.toHaveBeenCalled();
  });

  it("returns ok:true with factsCoverage and truncation warning", async () => {
    loadDeskSalesForPeriod.mockResolvedValue({
      sales: {
        totalSales: 1200,
        grossSales: 1300,
        netSales: 1200,
        orderCount: 4,
        newCustomers: 0,
        returningCustomers: 0,
        guestOrders: 0,
      },
      salesError: null,
      factsCoverage: {
        expectedClosedDays: 14,
        factDays: 14,
        complete: true,
        periodExceedsFactWindow: false,
      },
      todaySalesUnavailable: false,
      todaySalesTruncated: true,
    });

    const result = await fetchShopifySalesForShop("demo.myshopify.com", {
      from: "2026-07-01",
      to: "2026-07-15",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.totalSales).toBe(1200);
      expect(result.warning).toMatch(/truncated/i);
      expect(result.factsCoverage?.complete).toBe(true);
    }
  });

  it("includes periodExceedsFactWindow warning on ok:true (machine-readable disclosure)", async () => {
    loadDeskSalesForPeriod.mockResolvedValue({
      sales: {
        totalSales: 500,
        grossSales: 550,
        netSales: 500,
        orderCount: 2,
        newCustomers: 0,
        returningCustomers: 0,
        guestOrders: 0,
      },
      salesError: null,
      factsCoverage: {
        expectedClosedDays: 60,
        factDays: 45,
        complete: false,
        periodExceedsFactWindow: true,
      },
      todaySalesUnavailable: false,
      todaySalesTruncated: false,
    });

    const result = await fetchShopifySalesForShop("demo.myshopify.com", {
      from: "2025-01-01",
      to: "2026-07-15",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.factsCoverage?.periodExceedsFactWindow).toBe(true);
      expect(result.warning).toMatch(/exceeds SalesDayFact ingest window/i);
    }
  });

  it("source never calls unbounded fetchShopifySales directly", () => {
    expect(apiSource).toContain("loadDeskSalesForPeriod");
    expect(apiSource).not.toMatch(
      /import\s*\{[^}]*fetchShopifySales[^}]*\}\s*from\s*["']\.\/shopify-sales\.server["']/,
    );
    expect(apiSource).toContain("HARD-STOP");
    expect(apiSource).toContain("ok: false");
  });
});

describe("v1 MER / allocation fail-closed (source)", () => {
  it("does not build ranges with host-local T00:00:00", () => {
    expect(merRouteSource).not.toContain("T00:00:00`");
    expect(merRouteSource).not.toMatch(/\$\{from\}T00:00:00(?!\.000Z)/);
    expect(allocRouteSource).not.toMatch(/\$\{from\}T00:00:00(?!\.000Z)/);
    expect(merRouteSource).toContain("apiQueryDateRange");
    expect(allocRouteSource).toContain("apiQueryDateRange");
  });

  it("returns 503 sales_unavailable on sales failure — never MER on silent $0", () => {
    for (const src of [merRouteSource, allocRouteSource]) {
      expect(src).toContain('jsonError(result.warning, 503, "sales_unavailable")');
      expect(src).toContain('!result.ok');
      expect(src).toContain("isSalesFactsIncompleteForApi");
      expect(src).toContain('"sales_facts_incomplete"');
      // Must not assign sales=0 in catch then continue to buildMer/Allocation
      expect(src).not.toMatch(/catch\s*\([^)]*\)\s*\{[^}]*sales\s*=\s*0/s);
      expect(src).toMatch(
        /catch\s*\([^)]*\)\s*\{\s*return\s+jsonError\(/s,
      );
    }
  });

  it("never calls buildMerResponse / buildAllocationResponse before sales ok gate", () => {
    // Live path: check !result.ok before using totalSales
    expect(merRouteSource.indexOf("!result.ok")).toBeLessThan(
      merRouteSource.indexOf("result.totalSales"),
    );
    expect(allocRouteSource.indexOf("!result.ok")).toBeLessThan(
      allocRouteSource.indexOf("result.totalSales"),
    );
  });
});
