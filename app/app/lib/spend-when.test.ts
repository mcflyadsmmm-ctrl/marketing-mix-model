import { describe, expect, it } from "vitest";
import {
  spendTemplateRangeQuery,
  spendWhenPeriodType,
  spendWhenUsesDate,
  spendWhenUsesMonth,
} from "./spend-when";

describe("Spend When vocabulary", () => {
  it("maps merchant labels onto existing allocation windows", () => {
    expect(spendWhenPeriodType("day")).toBe("day");
    expect(spendWhenPeriodType("days7")).toBe("week");
    expect(spendWhenPeriodType("month")).toBe("month");
    expect(spendWhenPeriodType("quarter")).toBe("quarter");
    expect(spendWhenPeriodType("half")).toBe("half_year");
    expect(spendWhenPeriodType("year")).toBe("year");
  });

  it("uses one control shape for each When option", () => {
    expect(spendWhenUsesDate("day")).toBe(true);
    expect(spendWhenUsesDate("days7")).toBe(true);
    expect(spendWhenUsesMonth("quarter")).toBe(true);
    expect(spendWhenUsesMonth("custom")).toBe(false);
  });
});

describe("spendTemplateRangeQuery", () => {
  it("serializes preset and custom template ranges", () => {
    expect(
      spendTemplateRangeQuery({ range: "90d", from: "", to: "" }),
    ).toBe("span=90d");
    expect(
      spendTemplateRangeQuery({
        range: "custom",
        from: "2026-01-01",
        to: "2026-08-26",
      }),
    ).toBe("from=2026-01-01&to=2026-08-26");
  });

  it("rejects incomplete or reversed custom ranges", () => {
    expect(
      spendTemplateRangeQuery({
        range: "custom",
        from: "",
        to: "2026-08-26",
      }),
    ).toBeNull();
    expect(
      spendTemplateRangeQuery({
        range: "custom",
        from: "2026-08-27",
        to: "2026-08-26",
      }),
    ).toBeNull();
  });
});
