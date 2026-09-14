import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CUSTOMERS_DEPTH_LINKS,
  SALES_DEPTH_LINKS,
  deskNavAllItems,
  deskNavCoreIds,
  deskNavItems,
  deskNavLaterIds,
} from "./desk-nav";

const here = dirname(fileURLToPath(import.meta.url));

describe("deskNavItems", () => {
  it("top nav is BC-tight: Overview · Sales · Customers · Goals · Upload Spend · Allocation · Settings", () => {
    expect(deskNavCoreIds()).toEqual([
      "overview",
      "sales",
      "customers",
      "goals",
      "spend",
      "allocation",
      "settings",
    ]);
    expect(deskNavItems().map((i) => i.href)).toEqual([
      "/app",
      "/app/sales",
      "/app/customers",
      "/app/goals",
      "/app/spend",
      "/app/allocation",
      "/app/settings",
    ]);
    expect(deskNavItems().map((i) => i.id)).not.toContain("days");
    expect(deskNavItems().map((i) => i.id)).not.toContain("orders");
    expect(deskNavItems().map((i) => i.id)).not.toContain("cohorts");
    expect(deskNavItems().map((i) => i.id)).not.toContain("advanced");
    expect(deskNavItems().find((i) => i.id === "spend")?.label).toBe(
      "Upload Spend",
    );
  });

  it("Days · Orders live under Sales; Cohorts under Customers; insights stay deep-linkable", () => {
    expect(deskNavLaterIds()).toEqual([
      "days",
      "orders",
      "cohorts",
      "advanced",
    ]);
    expect(SALES_DEPTH_LINKS.map((l) => l.href)).toEqual([
      "/app/sales",
      "/app/days",
      "/app/orders",
    ]);
    expect(CUSTOMERS_DEPTH_LINKS.map((l) => l.href)).toEqual([
      "/app/customers",
      "/app/cohorts",
    ]);
    const hrefs = deskNavAllItems().map((i) => i.href);
    expect(hrefs).toContain("/app/days");
    expect(hrefs).toContain("/app/orders");
    expect(hrefs).toContain("/app/cohorts");
    expect(hrefs).toContain("/app/advanced");
  });
});

describe("desk nav shell", () => {
  it("renders from deskNavItems so IA cannot drift", () => {
    const shell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(shell).toContain("deskNavItems");
    expect(shell).toContain("listingCaptureHref");
    expect(shell).not.toContain("cashReady");
  });

  it("Sales and Customers wings mount depth subnav", () => {
    const sales = readFileSync(join(here, "../routes/app.sales.tsx"), "utf8");
    const days = readFileSync(join(here, "../routes/app.days.tsx"), "utf8");
    const orders = readFileSync(join(here, "../routes/app.orders.tsx"), "utf8");
    const customers = readFileSync(
      join(here, "../routes/app.customers.tsx"),
      "utf8",
    );
    const cohorts = readFileSync(join(here, "../routes/app.cohorts.tsx"), "utf8");
    expect(sales).toContain("SalesDepthNav");
    expect(days).toContain("SalesDepthNav");
    expect(orders).toContain("SalesDepthNav");
    expect(customers).toContain("CustomersDepthNav");
    expect(cohorts).toContain("CustomersDepthNav");
  });
});
