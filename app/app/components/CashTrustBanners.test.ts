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

  it("keeps fail-closed trust banners and omits sales-basis info card", () => {
    expect(source).toContain("salesFactsIncomplete");
    expect(source).toContain("marginStale");
    expect(source).toContain("spendCoverage");
    expect(source).toContain("spendRecon");
    expect(source).not.toContain("showSalesBasis");
    expect(source).not.toMatch(/Ads Manager often ignores returns/i);
    expect(source).not.toMatch(/not Platform ROAS/i);
  });

  it("treats a day with no spend row as $0, not a missing-invoice panic", () => {
    expect(source).toContain("Days with no spend row are $0");
    expect(source).not.toContain("Empty days are not $0");
  });
});
