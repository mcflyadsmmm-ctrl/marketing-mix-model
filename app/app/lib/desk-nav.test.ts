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
  it("keeps core ritual first: Overview · Spend · Settings", () => {
    expect(deskNavCoreIds()).toEqual(["overview", "spend", "settings"]);
    expect(deskNavItems().slice(0, 3).map((i) => i.href)).toEqual([
      "/app",
      "/app/spend",
      "/app/settings",
    ]);
  });

  it("keeps later pages listed — no maze, no hidden tabs", () => {
    expect(deskNavLaterIds()).toEqual([
      "goals",
      "allocation",
      "ltv",
      "advanced",
    ]);
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
