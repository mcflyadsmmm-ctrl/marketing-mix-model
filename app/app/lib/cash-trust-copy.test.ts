import { describe, expect, it } from "vitest";
import { salesFactsIncompleteMessage } from "./cash-trust-copy";

describe("salesFactsIncompleteMessage", () => {
  it("reassures on 0-of-N coverage instead of reading like a broken desk", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading.toLowerCase()).toContain("spend is saved");
    expect(copy.body).toContain("0 of 23");
    expect(copy.body.toLowerCase()).toContain("nothing is wrong");
    expect(copy.body.toLowerCase()).not.toMatch(/refused to connect|404|500/);
  });

  it("says why the ratio is withheld rather than showing 0x", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 25,
      periodLabel: "month to date",
    });
    expect(copy.body.toLowerCase()).toContain("0×");
  });

  it("keeps partial coverage honest and names the $0 empty-day rule", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 9,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading).toContain("9 of 23");
    expect(copy.body.toLowerCase()).toContain("$0");
    expect(copy.body.toLowerCase()).toContain("still filling in");
  });
});
