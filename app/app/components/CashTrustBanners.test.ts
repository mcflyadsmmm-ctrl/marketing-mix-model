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
    expect(source).not.toMatch(/Reconfirm profit margin/);
  });

  it("discloses the ~60-day Shopify order window, not five years", () => {
    expect(source).toMatch(/~60-day Shopify order window/i);
    expect(source).not.toMatch(/five years/i);
  });

  it("discloses truncated closed-day OrderFact crawls as still loading, not $0", () => {
    expect(source).toContain("orderFactsTruncated");
    expect(source).toContain("truncatedOrderFactsMessage");
    expect(source).not.toMatch(/about 60 days/i);
    expect(source).not.toMatch(/5-star|five.?star/i);
    expect(source).not.toContain("ReviewAsk");
  });

  it("treats a day with no spend row as $0, not a missing-invoice panic", () => {
    expect(source).toContain("Days with no spend row are $0");
    expect(source).not.toContain("Empty days are not $0");
  });

  it("paints OrderFact progress and keeps Overview sales-first", () => {
    expect(source).toContain("orderHistoryProgressMessage");
    expect(source).toContain("orderBackfillProgress");
    expect(source).toContain("hasSpend");
    expect(source).toContain("salesFactsIncompleteMessage");
  });

  it("collapses Home pending into one banner and bans engineer ingest copy", () => {
    expect(source).toContain("singlePendingSurface");
    expect(source).toContain("homePendingBannerMessage");
    expect(source).not.toMatch(/reports scope|sales totals ingest|not an orders crawl/i);
  });
});

