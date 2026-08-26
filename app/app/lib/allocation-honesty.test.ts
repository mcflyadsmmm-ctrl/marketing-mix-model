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
    expect(source).toContain("factsIncompleteSuffix");
    // Till suffix must branch before the live-sales default.
    expect(source).toMatch(
      /sales unavailable[\s\S]*factsIncompleteSuffix[\s\S]*live sales/,
    );
  });

  it("suppresses allocation suggestion when salesError", () => {
    expect(source).toContain("salesError ? null : metrics.allocation");
  });

  it("keeps the Sample data path distinct from live sales", () => {
    expect(source).toContain("samplePeriodSuffix");
    expect(source).toContain("SampleDeskBanner");
  });

  it("paints period snapshot cards and interactive windows", () => {
    expect(source).toContain("This period");
    expect(source).toContain("Where the money went");
    expect(source).toContain("Best windows");
    expect(source).toContain("Recent pace");
    expect(source).toContain("selectWindowsForGrain");
    expect(source).toContain("defaultWindowGrain");
    expect(source).toContain("windowGrainLabel");
    expect(source).toContain("mcfly-alloc-v2__snap-grid");
    expect(source).toContain("spend share, not channel ROAS");
  });
});
