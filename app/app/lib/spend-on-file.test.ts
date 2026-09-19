import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatSpendOnFile,
  hasSpendOnFile,
  NO_SPEND_ENTERED,
  spendOnFileHint,
} from "./spend-on-file";

const here = dirname(fileURLToPath(import.meta.url));

describe("spend on file vs certified $0", () => {
  it("treats missing / non-positive spend as not on file", () => {
    expect(hasSpendOnFile(0)).toBe(false);
    expect(hasSpendOnFile(-1)).toBe(false);
    expect(hasSpendOnFile(null)).toBe(false);
    expect(hasSpendOnFile(Number.NaN)).toBe(false);
    expect(hasSpendOnFile(40)).toBe(true);
  });

  it("paints — instead of $0 when no spend is on file", () => {
    expect(formatSpendOnFile(0, "USD")).toBe("—");
    expect(formatSpendOnFile(0, "CAD")).toBe("—");
    expect(formatSpendOnFile(1200, "USD")).toBe("$1,200");
    expect(spendOnFileHint(0)).toBe(NO_SPEND_ENTERED);
    expect(spendOnFileHint(40)).toBe("Entered ad spend");
  });

  it("Total ROAS Spend tile and Allocation snap use the on-file helper", () => {
    const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
    const mix = readFileSync(
      join(here, "../components/SpendMixSection.tsx"),
      "utf8",
    );
    expect(spend).toContain("formatSpendOnFile");
    expect(spend).toContain("spendOnFileHint");
    expect(spend).not.toContain("formatCurrency(metrics.totalSpend");
    expect(mix).toContain("metrics.totalSpend");
    expect(mix).not.toMatch(
      /mcfly-alloc-v2__snap-label">Spend[\s\S]*formatCurrency\(spend/,
    );
  });

  it("Spend ledger copy no longer claims empty spend is $0", () => {
    const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
    const spendImport = readFileSync(
      join(here, "../routes/app.spend.import.tsx"),
      "utf8",
    );
    expect(spend).not.toContain("Empty spend is $0");
    expect(spend).not.toContain("Days with no row are $0");
    expect(spend).toMatch(/no spend entered/i);
    expect(spend).toMatch(/deleted day stays \$0/i);
    expect(spendImport).not.toContain("Empty spend is $0");
    expect(spendImport).not.toContain("Days with no row are $0");
    expect(spendImport).toMatch(/no spend entered/i);
  });
});
