import { describe, expect, it } from "vitest";
import {
  DESK_HISTORY_YEARS_BACK,
  deskHistoryCaption,
  deskHistoryFloorKey,
  deskHistoryFloorYear,
} from "./desk-history";

describe("desk history horizon", () => {
  it("is five calendar years back to January 1", () => {
    expect(DESK_HISTORY_YEARS_BACK).toBe(5);
    const now = new Date(Date.UTC(2026, 7, 26));
    expect(deskHistoryFloorYear(now)).toBe(2021);
    expect(deskHistoryFloorKey(now)).toBe("2021-01-01");
    expect(deskHistoryCaption(now)).toBe(
      "Daily spend by channel, back to January 2021.",
    );
  });
});
