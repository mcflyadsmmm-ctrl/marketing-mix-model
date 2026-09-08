import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { impliedSpendCeiling } from "./implied-spend-ceiling";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Desk value previews", () => {
  it("never paywalls LTV on Overview or the LTV tab", () => {
    const ltv = read("../routes/app.ltv.tsx");
    const overview = read("../routes/app._index.tsx");
    // Founder lock: whole desk on trial and paid — LTV is not a Pro teaser.
    for (const src of [ltv, overview]) {
      expect(src).not.toContain("ProPaybackPreview");
      expect(src).not.toContain("ProUpsellBlock");
      expect(src).not.toMatch(/Upgrade to Pro/);
    }
  });

  it("keeps the implied spend ceiling math the Goals board reports", () => {
    expect(impliedSpendCeiling(80_000, 4)).toBe(20_000);
  });

  it("shows the full-year Goals board outright, with no plan teaser", () => {
    const goals = read("../routes/app.goals.tsx");
    expect(goals).not.toContain("GoalsYearTeaser");
    expect(goals).not.toContain("canUseYearBoard");
    expect(goals).not.toContain("canUseAdvancedGoals");
    expect(goals).not.toMatch(/Year board — Pro/);
  });
});
