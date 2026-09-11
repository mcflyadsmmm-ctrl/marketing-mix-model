import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deskNavCoreIds,
  deskNavItems,
  deskNavLaterIds,
} from "./desk-nav";

const here = dirname(fileURLToPath(import.meta.url));

describe("deskNavItems", () => {
  it("keeps core first: Overview · Customers · Spend · Settings", () => {
    expect(deskNavCoreIds()).toEqual([
      "overview",
      "ltv",
      "spend",
      "settings",
    ]);
    expect(deskNavItems().slice(0, 4).map((i) => i.href)).toEqual([
      "/app?stay=1",
      "/app/ltv",
      "/app/spend",
      "/app/settings",
    ]);
    expect(deskNavItems().find((i) => i.id === "ltv")?.label).toMatch(
      /Customers/i,
    );
  });

  it("Overview nav uses stay=1 so cold desk is reachable", () => {
    const overview = deskNavItems().find((i) => i.id === "overview");
    expect(overview?.href).toBe("/app?stay=1");
  });

  it("keeps later pages listed — no maze, no hidden tabs", () => {
    expect(deskNavLaterIds()).toEqual(["goals", "allocation", "advanced"]);
    const hrefs = deskNavItems().map((i) => i.href);
    expect(hrefs).toContain("/app/goals");
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
