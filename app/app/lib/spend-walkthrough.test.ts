import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CSV_CLEANUP_HINT,
  LONG_FORMAT_EXAMPLE,
  META_NATIVE_EXAMPLE,
  formatTemplatePreviewCsv,
} from "./spend-walkthrough";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("spend walkthrough examples", () => {
  it("formats a Day + channel preview CSV", () => {
    expect(
      formatTemplatePreviewCsv(
        ["Day", "Meta", "Google"],
        [
          ["2026-08-01", "120.00", "80.00"],
          ["2026-08-02", "95.50", "70.00"],
        ],
      ),
    ).toBe("Day,Meta,Google\n2026-08-01,120.00,80.00\n2026-08-02,95.50,70.00");
  });

  it("ships native Meta and long-format samples with Day + amount only", () => {
    expect(META_NATIVE_EXAMPLE).toMatch(/^Day,Amount spent\n/);
    expect(LONG_FORMAT_EXAMPLE).toMatch(/^date,channel,amount\n/);
    expect(CSV_CLEANUP_HINT).toMatch(/Total row/i);
  });

  it("renders Ads Manager export steps on Spend (not dead in spend-export-guides)", () => {
    const spend = read("../routes/app.spend.tsx");
    const walkthrough = read("../components/SpendExportWalkthrough.tsx");
    expect(spend).toContain("SpendExportWalkthrough");
    expect(spend).toContain("example=1");
    expect(spend).toContain("Save as daily spend");
    expect(spend).not.toContain("Combine & import");
    expect(walkthrough).toContain("platform.steps");
    expect(walkthrough).toContain("columnsNeeded");
    expect(walkthrough).toContain("How to export the right file");
  });
});
