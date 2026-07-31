import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "CashTrustBanners.tsx"), "utf8");

describe("CashTrustBanners today honesty", () => {
  it("surfaces capped open-day sales (truncated) and unavailable today", () => {
    expect(source).toContain("todaySalesTruncated");
    expect(source).toContain("todaySalesUnavailable");
    expect(source).toMatch(/Today.?s sales may be incomplete/i);
    expect(source).toMatch(/Today.?s sales unavailable/i);
    expect(source).toMatch(/~100 orders/);
  });

  it("does not claim Ads Manager gross when grossSalesKnown is false", () => {
    expect(source).toContain("grossSalesKnown");
    expect(source).toMatch(/still backfilling/i);
    expect(source).toContain("!grossSalesKnown");
  });
});
