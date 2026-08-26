import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Desk period labels and Overview clocks", () => {
  const periodControl = read("../components/PeriodControl.tsx");
  const overview = read("../routes/app._index.tsx");

  it("spells out Last month and Last 12 months instead of LM / L12M", () => {
    expect(periodControl).toContain('label: "Last month"');
    expect(periodControl).toContain('label: "Last 12 months"');
    expect(periodControl).not.toContain('label: "LM"');
    expect(periodControl).not.toContain('label: "L12M"');
  });

  it("ties Overview explorer to the scoreboard when exRange is unset", () => {
    expect(overview).toContain("explorerQueryMatchingScoreboard");
    expect(overview).not.toContain('exRange") || "14d"');
    expect(overview).toMatch(
      /if \(entitlements\.canUseLtv\) \{\s*void runOrderFactsBackfill/,
    );
  });

  it("keeps Spend on the same date slicer after the first save", () => {
    const spend = read("../routes/app.spend.tsx");
    expect(spend).toContain("explorerQueryMatchingScoreboard");
    expect(spend).toContain("<PeriodControl");
    expect(spend).toContain("Same dates as Overview");
    expect(spend).not.toContain("Overview stays 14d");
  });
});
