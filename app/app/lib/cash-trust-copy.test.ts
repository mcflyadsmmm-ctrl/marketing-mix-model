import { describe, expect, it } from "vitest";
import {
  orderHistoryProgressMessage,
  salesFactsIncompleteMessage,
} from "./cash-trust-copy";

describe("salesFactsIncompleteMessage", () => {
  it("reassures on 0-of-N coverage instead of reading like a broken desk", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading.toLowerCase()).toContain("sales are still loading");
    expect(copy.heading.toLowerCase()).not.toContain("spend is saved");
    expect(copy.body).toContain("0 of 23");
    expect(copy.body.toLowerCase()).toContain("nothing is wrong");
    expect(copy.body.toLowerCase()).toContain("not $0");
    expect(copy.body.toLowerCase()).not.toMatch(/refused to connect|404|500/);
  });

  it("keeps spend / 0× language only when spend is on file", () => {
    const salesOnly = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 25,
      periodLabel: "month to date",
    });
    expect(salesOnly.body.toLowerCase()).not.toContain("0×");
    expect(salesOnly.body.toLowerCase()).not.toContain("your spend is already");

    const withSpend = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 25,
      periodLabel: "month to date",
      hasSpend: true,
    });
    expect(withSpend.body.toLowerCase()).toContain("0×");
    expect(withSpend.body.toLowerCase()).toContain("your spend is already");
  });

  it("keeps partial coverage honest without a spend lecture", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 9,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading).toContain("9 of 23");
    expect(copy.body.toLowerCase()).toContain("not $0");
    expect(copy.body.toLowerCase()).toContain("still filling in");
    expect(copy.body.toLowerCase()).not.toContain("your spend is already");
  });
});

describe("orderHistoryProgressMessage", () => {
  it("is quiet once the window is sealed", () => {
    expect(
      orderHistoryProgressMessage({
        completeDays: 90,
        windowDays: 90,
        remainingDays: 0,
      }),
    ).toBeNull();
  });

  it("names 0-of-N pending days so a whale does not rage-quit", () => {
    const copy = orderHistoryProgressMessage({
      completeDays: 0,
      windowDays: 90,
      remainingDays: 90,
    });
    expect(copy?.heading.toLowerCase()).toContain("order history still loading");
    expect(copy?.body).toContain("0 of 90");
    expect(copy?.body.toLowerCase()).toContain("not $0");
  });

  it("paints partial sealed days as progress, not a blank book", () => {
    const copy = orderHistoryProgressMessage({
      completeDays: 12,
      windowDays: 90,
      remainingDays: 78,
    });
    expect(copy?.heading).toContain("12 of 90");
    expect(copy?.body).toContain("78 closed days left");
    expect(copy?.body.toLowerCase()).toContain("not $0");
  });
});
