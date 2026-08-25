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
    expect(source).toContain("sales unavailable");
    expect(source).toContain("facts incomplete");
    // Till suffix must branch before the live-sales default.
    expect(source).toMatch(
      /sales unavailable[\s\S]*facts incomplete[\s\S]*live sales/,
    );
  });

  it("suppresses allocation suggestion when salesError", () => {
    expect(source).toContain("salesError ? null : metrics.allocation");
  });

  it("keeps Practice path distinct from live sales", () => {
    expect(source).toContain("practicePeriodSuffix");
    expect(source).toContain("SampleDeskBanner");
  });
});
