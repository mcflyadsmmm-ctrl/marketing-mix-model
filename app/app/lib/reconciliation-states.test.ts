import { describe, expect, it } from "vitest";
import {
  FAILED_LOAD,
  LTV_UNAVAILABLE,
  PRIOR_YEAR_MISSING,
  emptyOrdersLine,
  liveHeaderRange,
  loadingLine,
  spendNote,
  totalRoasDisplay,
  trialEndLine,
} from "./reconciliation-states";

describe("reconciliation honest states", () => {
  it("names a loading range and never a percent", () => {
    const line = loadingLine([
      { status: "loading", since: "2026-09-19", until: "2026-09-25" },
      { status: "checked", since: "2026-09-01", until: "2026-09-25" },
    ]);
    expect(line).toBe("Loading your Shopify order history. 2026-09-19 – 2026-09-25");
    expect(line).not.toMatch(/%|countdown|second/i);
  });

  it("names empty dates and says spend will not change the orders", () => {
    expect(emptyOrdersLine("2026-09-19", "2026-09-25")).toContain("2026-09-19 to 2026-09-25");
    expect(emptyOrdersLine("2026-09-19", "2026-09-25")).toContain(
      "Adding spend will not change the orders.",
    );
  });

  it("keeps Total ROAS as an em dash until spend produces a ratio", () => {
    expect(totalRoasDisplay(null)).toBe("—");
    expect(totalRoasDisplay(Number.NaN)).toBe("—");
    expect(spendNote({ spendEntered: false, spendPartial: false, totalRoas: null })).toBe(
      "Need spend",
    );
    expect(spendNote({ spendEntered: false, spendPartial: false, totalRoas: 0 })).toBe(
      "Need spend",
    );
    expect(spendNote({ spendEntered: true, spendPartial: true, totalRoas: 4.2 })).toBe(
      "This ratio only covers the spend you entered.",
    );
    expect(totalRoasDisplay(4.2)).not.toBe("—");
  });

  it("does not invent a trial end", () => {
    expect(trialEndLine(null)).toBeNull();
    expect(trialEndLine("")).toBeNull();
    expect(trialEndLine("not-a-date")).toBeNull();
    expect(trialEndLine("2026-10-02T15:04:00.000Z")).toBe(
      "Trial ends 2026-10-02T15:04:00.000Z. Then $39/store/month. Uninstall before that time to avoid the first charge.",
    );
  });

  it("uses the required missing-year and LTV lines", () => {
    expect(PRIOR_YEAR_MISSING).toBe("No comparable history loaded for last year.");
    expect(LTV_UNAVAILABLE).toContain("not available with Live data yet");
    expect(LTV_UNAVAILABLE).not.toMatch(/\d{4}|unlock/i);
    expect(FAILED_LOAD).toContain("failed");
    expect(FAILED_LOAD).not.toMatch(/\$0|zero sales/i);
    expect(liveHeaderRange([{ since: "2026-09-01", until: "2026-09-25" }])).toBe(
      "2026-09-01 – 2026-09-25",
    );
  });
});
