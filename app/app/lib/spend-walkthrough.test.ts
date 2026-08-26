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

  it("keeps the Ads Manager door on Spend without a separate walkthrough drawer", () => {
    const spend = read("../routes/app.spend.tsx");
    // Founder lock: Spend is three doors on one screen, no export drawer.
    expect(spend).toContain("Paste or upload Ads Manager CSV");
    expect(spend).not.toContain("SpendExportWalkthrough");
    expect(spend).not.toContain("Combine & import");
  });
});
