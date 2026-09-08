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
    // Coverage must be computed in the loader — never call sales-facts.server
    // from the client component (breaks react-router build).
    expect(source).toContain("factsIncomplete = salesFactsBlockLock(coverage)");
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
