import { describe, expect, it } from "vitest";
import {
  deskNavigationRefreshesThisTab,
  deskPageShouldRevalidate,
  deskShellShouldRevalidate,
  deskTabPath,
} from "./desk-tab-flow";

function args(
  current: string,
  next: string,
  formMethod?: string,
): Parameters<typeof deskShellShouldRevalidate>[0] {
  return {
    currentUrl: new URL(current),
    nextUrl: new URL(next),
    currentParams: {},
    nextParams: {},
    defaultShouldRevalidate: true,
    formMethod,
  } as Parameters<typeof deskShellShouldRevalidate>[0];
}

describe("desk tab flow", () => {
  it("names Orders, Spend, Goals, Customers, and Settings", () => {
    expect(deskTabPath("/demo")).toBe("/demo");
    expect(deskTabPath("/demo/spend")).toBe("/demo/spend");
    expect(deskTabPath("/demo/goals")).toBe("/demo/goals");
    expect(deskTabPath("/demo/customers")).toBe("/demo/customers");
    expect(deskTabPath("/app/settings")).toBe("/app/settings");
    expect(deskTabPath("/demo/ltv")).toBeNull();
    expect(deskTabPath("/app/spend/import")).toBeNull();
  });

  it("keeps the loaded document when the tab address changes", () => {
    expect(
      deskShellShouldRevalidate(
        args("https://mcflyads.com/demo", "https://mcflyads.com/demo/spend"),
      ),
    ).toBe(false);
    expect(
      deskShellShouldRevalidate(
        args("https://mcflyads.com/app", "https://mcflyads.com/app/goals"),
      ),
    ).toBe(false);
    expect(
      deskShellShouldRevalidate(
        args("https://mcflyads.com/app/orders", "https://mcflyads.com/app/goals"),
      ),
    ).toBe(true);
    expect(
      deskShellShouldRevalidate(
        args(
          "https://mcflyads.com/app/spend",
          "https://mcflyads.com/app/goals",
          "POST",
        ),
      ),
    ).toBe(true);
    expect(
      deskPageShouldRevalidate(
        args(
          "https://mcflyads.com/demo/spend?period=mtd",
          "https://mcflyads.com/demo?period=mtd",
        ),
      ),
    ).toBe(false);
    expect(
      deskPageShouldRevalidate(
        args(
          "https://mcflyads.com/demo?period=mtd",
          "https://mcflyads.com/demo?period=lm",
        ),
      ),
    ).toBe(true);
  });

  it("does not paint a reload when the merchant leaves this tab", () => {
    expect(deskNavigationRefreshesThisTab("/demo", "/demo/customers", "loading")).toBe(
      false,
    );
    expect(deskNavigationRefreshesThisTab("/demo", "/demo", "loading")).toBe(true);
    expect(deskNavigationRefreshesThisTab("/app/spend", null, "idle")).toBe(false);
  });
});
