import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deskNavAllItems,
  deskNavCoreIds,
  deskNavItems,
  deskNavLaterIds,
} from "./desk-nav";

const here = dirname(fileURLToPath(import.meta.url));

describe("deskNavItems", () => {
  it("top nav is Overview · Sales · Days · Orders · Customers · Cohorts · Goals · Upload Spend · Allocation · Settings", () => {
    expect(deskNavCoreIds()).toEqual([
      "overview",
      "sales",
      "days",
      "orders",
      "customers",
      "cohorts",
      "goals",
      "spend",
      "allocation",
      "settings",
    ]);
    expect(deskNavItems().map((i) => i.href)).toEqual([
      "/app",
      "/app/sales",
      "/app/days",
      "/app/orders",
      "/app/customers",
      "/app/cohorts",
      "/app/goals",
      "/app/spend",
      "/app/allocation",
      "/app/settings",
    ]);
    expect(deskNavItems().find((i) => i.id === "overview")?.label).toBe(
      "Overview",
    );
    expect(deskNavItems().find((i) => i.id === "days")?.label).toBe("Days");
    expect(deskNavItems().find((i) => i.id === "orders")?.label).toBe(
      "Orders",
    );
    expect(deskNavItems().find((i) => i.id === "cohorts")?.label).toBe(
      "Cohorts",
    );
    expect(deskNavItems().find((i) => i.id === "spend")?.label).toBe(
      "Upload Spend",
    );
    expect(deskNavItems().find((i) => i.id === "allocation")?.label).toBe(
      "Allocation",
    );
    expect(deskNavItems().map((i) => i.id)).not.toContain("advanced");
  });

  it("later pages stay deep-linkable — not deleted, just off the top nav", () => {
    expect(deskNavLaterIds()).toEqual(["advanced"]);
    const hrefs = deskNavAllItems().map((i) => i.href);
    expect(hrefs).toContain("/app");
    expect(hrefs).toContain("/app/days");
    expect(hrefs).toContain("/app/orders");
    expect(hrefs).toContain("/app/cohorts");
    expect(hrefs).toContain("/app/goals");
    expect(hrefs).toContain("/app/spend");
    expect(hrefs).toContain("/app/allocation");
    expect(hrefs).toContain("/app/customers");
    expect(hrefs).toContain("/app/advanced");
    expect(hrefs).toContain("/app/sales");
  });
});

describe("desk nav shell", () => {
  it("renders from deskNavItems so IA cannot drift", () => {
    const shell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(shell).toContain("deskNavItems");
    expect(shell).toContain("listingCaptureHref");
    expect(shell).not.toContain("cashReady");
  });
});
