import { describe, expect, it } from "vitest";
import {
  comebackPendingLine,
  namedDeskScreenFromPath,
  namedDeskTitle,
  refreshingSalesLine,
  returningMixPendingLine,
  salesWindowPendingHeading,
} from "./desk-request-screen";

describe("named desk screens", () => {
  it("keeps the request on its own address and title", () => {
    expect(namedDeskScreenFromPath("/demo/allocation")).toBe("allocation");
    expect(namedDeskScreenFromPath("/app/yoy")).toBe("year-over-year");
    expect(namedDeskScreenFromPath("/demo/ltv")).toBe("ltv");
    expect(namedDeskScreenFromPath("/app/growth")).toBe("growth");
    expect(namedDeskScreenFromPath("/demo/cpa")).toBe("cpa");
    expect(namedDeskScreenFromPath("/app/roas")).toBe("roas");
    expect(namedDeskScreenFromPath("/demo/who-to-save")).toBe("who-to-save");
    expect(namedDeskScreenFromPath("/app/close")).toBe("month-close");
    expect(namedDeskScreenFromPath("/demo")).toBeNull();
    expect(namedDeskScreenFromPath("/app/customers")).toBeNull();
    expect(namedDeskTitle("allocation")).toBe("Allocation");
    expect(namedDeskTitle("year-over-year")).toBe("Year over year");
    expect(namedDeskTitle("who-to-save")).toBe("Who to save");
    expect(namedDeskTitle("month-close")).toBe("Month close");
  });
});

describe("loading lines name the window", () => {
  it("names sales and this month on the first tab", () => {
    expect(refreshingSalesLine("Month to date")).toBe(
      "Refreshing this month’s sales…",
    );
    expect(refreshingSalesLine("Last month")).toBe(
      "Refreshing Last month’s sales…",
    );
  });

  it("names Shopify Total Sales and the window while spend is already on the page", () => {
    expect(salesWindowPendingHeading("This month")).toBe(
      "Shopify Total Sales for this month still loading",
    );
  });

  it("names the week and the come-back months", () => {
    expect(returningMixPendingLine("the weeks in This month")).toBe(
      "Returning dollars for the weeks in This month are still loading — not $0.",
    );
    expect(comebackPendingLine("This month")).toBe(
      "Come-back months for This month are still loading — not $0.",
    );
  });
});
