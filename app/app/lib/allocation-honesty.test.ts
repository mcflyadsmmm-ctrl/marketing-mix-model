import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  join(here, "../routes/app.allocation.tsx"),
  "utf8",
);

describe("Allocation desk sales honesty", () => {
  it("wires facts coverage into CashTrustBanners like Overview (server-side)", () => {
    // Same honesty as Overview — complete $0 is not trusted. Client-safe helper
    // (not sales-facts.server) so the React Router client build stays clean.
    expect(source).toContain("factsIncomplete = salesFactsIncompleteForDesk(deskCoverage");
    expect(source).toContain("salesUntrustedZero: deskSalesUntrustedZero");
    expect(source).toContain("shopOrdersSeen: deskShopOrdersSeen");
    expect(source).toContain("salesFactsIncomplete={salesFactsIncomplete}");
    expect(source).toContain(
      "shopifyOrderWindowLimited={shopifyOrderWindowLimited}",
    );
    expect(source).toContain("periodExceedsFactWindow");
  });

  it("does not label error or incomplete facts as live sales", () => {
    expect(source).toContain("formatListingTillLabel");
    expect(source).toMatch(/salesError:\s*Boolean\(salesError\)/);
    expect(source).toContain("factsIncomplete");
  });

  it("suppresses allocation suggestion when salesError", () => {
    expect(source).toContain("salesError ? null : metrics.allocation");
  });

  it("keeps SAMPLE path distinct from live sales", () => {
    expect(source).toContain("formatListingTillLabel");
    expect(source).toContain("useSampleDesk");
    expect(source).toContain("SampleDeskBanner");
  });
});
