import { describe, expect, it } from "vitest";
import { salesFactsIncompleteMessage } from "./cash-trust-copy";

describe("salesFactsIncompleteMessage", () => {
  it("treats 0-of-N coverage as expected install sync, not a broken desk", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading.toLowerCase()).toContain("expected after install");
    expect(copy.body).toContain("0 of 23");
    expect(copy.body.toLowerCase()).toContain("not an error");
    expect(copy.body.toLowerCase()).not.toMatch(/refused to connect|404|500/);
  });

  it("keeps partial coverage as a backfill, and says the desk still works", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 9,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading).toMatch(/backfilling/i);
    expect(copy.body).toContain("9 of 23");
    expect(copy.body.toLowerCase()).toContain("usable");
  });
});
