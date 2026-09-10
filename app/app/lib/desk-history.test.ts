import { describe, expect, it } from "vitest";
import {
  DESK_HISTORY_YEARS_BACK,
  deskHistoryCaption,
  deskHistoryFloorKey,
  deskHistoryFloorYear,
  formatPeriodDaySpan,
} from "./desk-history";

describe("desk history horizon", () => {
  it("is five calendar years back to January 1", () => {
    expect(DESK_HISTORY_YEARS_BACK).toBe(5);
    const now = new Date(Date.UTC(2026, 7, 26));
    expect(deskHistoryFloorYear(now)).toBe(2021);
    expect(deskHistoryFloorKey(now)).toBe("2021-01-01");
    expect(deskHistoryCaption(now)).toBe(
      "Shopify orders · last ~60 days available · returns included",
    );
    expect(deskHistoryCaption(now, "spend")).toBe(
      "Daily spend by channel · sales cover the last ~60 days.",
    );
  });

  it("prints the selected window as calendar days, not “this period”", () => {
    expect(formatPeriodDaySpan("2026-07-12", "2026-09-10")).toBe(
      "2026-07-12 – 2026-09-10",
    );
  });
});
