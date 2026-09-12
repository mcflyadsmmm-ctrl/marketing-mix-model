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
  it("top nav is Sales · Customers · Goals · Marketing Spend · Settings", () => {
    expect(deskNavCoreIds()).toEqual([
      "sales",
      "customers",
      "goals",
      "spend",
      "settings",
    ]);
    expect(deskNavItems().map((i) => i.href)).toEqual([
      "/app/sales",
      "/app/customers",
      "/app/goals",
      "/app/spend",
      "/app/settings",
    ]);
    expect(deskNavItems().find((i) => i.id === "customers")?.label).toBe(
      "Customers",
    );
    expect(deskNavItems().find((i) => i.id === "spend")?.label).toBe(
      "Marketing Spend",
    );
    expect(deskNavItems().map((i) => i.id)).not.toContain("allocation");
    expect(deskNavItems().map((i) => i.id)).not.toContain("advanced");
  });

  it("later pages stay deep-linkable — not deleted, just off the top nav", () => {
    expect(deskNavLaterIds()).toEqual(["allocation", "advanced"]);
    const hrefs = deskNavAllItems().map((i) => i.href);
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
