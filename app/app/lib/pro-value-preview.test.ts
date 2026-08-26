import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { impliedSpendCeiling } from "./implied-spend-ceiling";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Pro value previews", () => {
  it("shows a worked Cash CAC sentence and 90-day ghost tiles on LTV/Overview", () => {
    const preview = read("../components/ProValuePreview.tsx");
    const ltv = read("../routes/app.ltv.tsx");
    const overview = read("../routes/app._index.tsx");
    expect(preview).toContain("Cash CAC =");
    expect(preview).toContain("On Pro, for those customers");
    expect(preview).toContain("October goal");
    expect(ltv).toContain("ProPaybackPreview");
    expect(overview).toContain("ProPaybackPreview");
  });

  it("Goals year teaser uses the same ceiling math as the board", () => {
    expect(impliedSpendCeiling(80_000, 4)).toBe(20_000);
    const goals = read("../routes/app.goals.tsx");
    expect(goals).toContain("GoalsYearTeaser");
  });
});
