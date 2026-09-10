import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_SPEND_EMPTY_LINE,
  overviewNoticeSentence,
} from "./overview-first-viewport";

const here = dirname(fileURLToPath(import.meta.url));

describe("overview first viewport", () => {
  it("leads with returning-sales share when the split exists", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 1184,
        returningSalesShare: 0.42,
        discountedOrderShare: 0.19,
        medianDaysToSecond: 23,
        salesPending: false,
      }),
    ).toBe(
      "Returning customers generated 42% of sales in this window.",
    );
  });

  it("does not invent a window when there are no orders", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 0,
        returningSalesShare: null,
        discountedOrderShare: null,
        medianDaysToSecond: null,
        salesPending: false,
      }),
    ).toBe("No orders in this window yet.");
  });

  it("does not treat pending sales as $0", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 0,
        returningSalesShare: null,
        discountedOrderShare: null,
        medianDaysToSecond: null,
        salesPending: true,
      }),
    ).toBe("Sales for closed days are still loading — not $0.");
  });

  it("falls back to days-to-second, then discount share", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 40,
        returningSalesShare: null,
        discountedOrderShare: 0.4,
        medianDaysToSecond: 18,
        salesPending: false,
      }),
    ).toBe("Typical wait to a second order was 18 days.");
    expect(
      overviewNoticeSentence({
        orderCount: 40,
        returningSalesShare: null,
        discountedOrderShare: 0.4,
        medianDaysToSecond: null,
        salesPending: false,
      }),
    ).toBe("40% of orders used a discount.");
  });

  it("coverage line names the 60-day order window and returns", () => {
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/60 days/);
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/returns included/i);
    expect(OVERVIEW_SPEND_EMPTY_LINE).toMatch(/works without it/i);
    expect(OVERVIEW_SPEND_EMPTY_LINE).not.toMatch(/0×/);
    expect(OVERVIEW_SPEND_EMPTY_LINE).not.toMatch(/0x/i);
  });

  it("Overview mounts the first viewport above section doors", () => {
    const overview = readFileSync(
      join(here, "../routes/app._index.tsx"),
      "utf8",
    );
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<MarketingSnapSection");
    expect(overview).not.toContain("mcfly-tab-snaps--solo");
    expect(overview).toContain("mcfly-tab-snaps--below");
    const firstAt = overview.indexOf("<OverviewFirstViewport");
    const doorsAt = overview.indexOf("<OverviewSectionIndex");
    const belowAt = overview.indexOf("mcfly-tab-snaps--below");
    expect(firstAt).toBeGreaterThan(-1);
    expect(doorsAt).toBeGreaterThan(firstAt);
    expect(belowAt).toBeGreaterThan(doorsAt);
  });

  it("first viewport has no spend CTA", () => {
    const firstView = readFileSync(
      join(here, "../components/OverviewFirstViewport.tsx"),
      "utf8",
    );
    expect(firstView).toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).not.toContain("setupAddSpend");
    expect(firstView).not.toContain("Upload Spend");
    expect(firstView).not.toContain("spendHref");
    expect(firstView).not.toContain("<s-link");
    expect(firstView).not.toMatch(/0×/);
  });
});
