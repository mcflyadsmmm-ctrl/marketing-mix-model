import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isSpendYmd, resolveManualSpendRange } from "./spend-day-entry";

const here = dirname(fileURLToPath(import.meta.url));
const spendSource = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");

describe("Spend one-bill helper", () => {
  it("keeps the one-day helper available after the template workflow", () => {
    expect(spendSource).toContain("resolveManualSpendRange");
    expect(spendSource).toContain('id="mcfly-spend-add"');
    expect(spendSource).toContain('name="spendDate"');
    expect(spendSource).toContain("Billboard, radio, agency…");
    expect(spendSource).toContain("mcfly-spend-csv");
    expect(spendSource).not.toContain("ProUpsellBlock");
    const formStart = spendSource.indexOf(
      '<Form method="post" className="mcfly-spend-add__form"',
    );
    const formEnd = spendSource.indexOf("</Form>", formStart);
    expect(formStart).toBeGreaterThan(-1);
    expect(formEnd).toBeGreaterThan(formStart);
    expect(spendSource.slice(formStart, formEnd)).not.toContain("ProUpsellBlock");
  });
});

describe("isSpendYmd", () => {
  it("accepts calendar dates", () => {
    expect(isSpendYmd("2026-08-25")).toBe(true);
    expect(isSpendYmd(" 2026-08-25 ")).toBe(true);
  });

  it("rejects junk", () => {
    expect(isSpendYmd("")).toBe(false);
    expect(isSpendYmd("08/25/2026")).toBe(false);
    expect(isSpendYmd("2026-8-25")).toBe(false);
  });
});

describe("resolveManualSpendRange", () => {
  it("uses a single shop-local day when spendDate is set", () => {
    const range = resolveManualSpendRange({
      spendDate: "2026-08-20",
      periodPreset: "ytd",
      timeZone: "America/Denver",
    });
    expect(range.label).toBe("2026-08-20");
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    expect(range.end.getTime() - range.start.getTime()).toBeLessThan(
      25 * 60 * 60 * 1000,
    );
  });

  it("falls back to the period preset without a date", () => {
    const range = resolveManualSpendRange({
      spendDate: "",
      periodPreset: "mtd",
      now: new Date("2026-08-25T18:00:00.000Z"),
      timeZone: "UTC",
    });
    expect(range.label).toBe("Month to date");
  });
});
