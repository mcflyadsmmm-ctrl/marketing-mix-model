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
  it("top nav is API-first: Overview · Customers · Goals · Settings (Spend later)", () => {
    expect(deskNavCoreIds()).toEqual([
      "overview",
      "ltv",
      "goals",
      "settings",
    ]);
    expect(deskNavItems().map((i) => i.href)).toEqual([
      "/app?stay=1",
      "/app/ltv",
      "/app/goals",
      "/app/settings",
    ]);
    expect(deskNavItems().find((i) => i.id === "ltv")?.label).toMatch(
      /Customers/i,
    );
    // Spend is later depth — not the first chrome merchants hit.
    expect(deskNavItems().map((i) => i.id)).not.toContain("spend");
    expect(deskNavItems().map((i) => i.id)).not.toContain("allocation");
    expect(deskNavItems().map((i) => i.id)).not.toContain("advanced");
  });

  it("Overview nav uses stay=1 so cold desk is reachable", () => {
    const overview = deskNavItems().find((i) => i.id === "overview");
    expect(overview?.href).toBe("/app?stay=1");
  });

  it("later pages stay deep-linkable — not deleted, just off the top nav", () => {
    expect(deskNavLaterIds()).toEqual(["spend", "allocation", "advanced"]);
    const hrefs = deskNavAllItems().map((i) => i.href);
    expect(hrefs).toContain("/app/goals");
    expect(hrefs).toContain("/app/spend");
    expect(hrefs).toContain("/app/allocation");
    expect(hrefs).toContain("/app/ltv");
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
});
