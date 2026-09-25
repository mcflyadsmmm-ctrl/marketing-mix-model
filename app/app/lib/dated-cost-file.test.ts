import { describe, expect, it } from "vitest";
import { costChanges, parseCostFile, rankVariants, unitCostForDay } from "./dated-cost-file";

const fileText = [
  "closed_through,2026-01-31",
  "variant,start_date,unit_cost,status,invoice_date",
  "Hat,2026-01-01,10,provisional,",
  "Hat,2026-01-01,12,settled,2026-02-10",
  "Cap,2026-01-01,4,provisional,",
].join("\n");

describe("dated cost file", () => {
  it("keeps a closed day on the provisional cost and shows the later invoice", () => {
    const file = parseCostFile(fileText);
    expect(unitCostForDay(file, "Hat", "2026-01-15")).toEqual({
      unitCost: 10,
      status: "provisional",
    });
    expect(unitCostForDay(file, "Hat", "2026-02-15")).toEqual({
      unitCost: 12,
      status: "settled",
    });
    expect(costChanges(file, "2026-02-15").find((row) => row.variant === "Hat")).toMatchObject({
      closedUnitCost: 10,
      openUnitCost: 12,
      change: 2,
      status: "settled",
    });
  });

  it("ranks what is left after known costs and leaves a missing cost blank", () => {
    const file = parseCostFile(fileText);
    const ranked = rankVariants({
      file,
      asOf: "2026-01-20",
      lines: [
        {
          variantId: "hat",
          label: "Hat",
          netAfterReturns: 100,
          units: 4,
          restock: 3,
        },
        {
          variantId: "scarf",
          label: "Scarf",
          netAfterReturns: 80,
          units: 2,
          restock: null,
        },
      ],
    });
    expect(ranked[0]).toMatchObject({
      label: "Hat",
      left: 60,
      restock: 3,
      unitCost: 10,
      changePerUnit: null,
    });
    expect(ranked[1]).toMatchObject({
      label: "Scarf",
      left: null,
      unitCost: null,
      restock: null,
    });
    expect(ranked[1]?.left).not.toBe(0);
  });

  it("uses the settled cost on an open day and still shows the change", () => {
    const file = parseCostFile(fileText);
    const ranked = rankVariants({
      file,
      asOf: "2026-02-15",
      lines: [
        {
          variantId: "hat",
          label: "Hat",
          netAfterReturns: 100,
          units: 4,
          restock: 3,
        },
      ],
    });
    expect(ranked[0]?.left).toBe(52);
    expect(ranked[0]?.changePerUnit).toBe(2);
    expect(ranked[0]?.restock).toBe(3);
    expect(ranked[0]?.left).not.toBe(100 - 3 - 12 * 4);
  });

  it("ignores a settled row that has no invoice date", () => {
    const file = parseCostFile(
      ["variant,start_date,unit_cost,status,invoice_date", "Hat,2026-01-01,9,settled,"].join("\n"),
    );
    expect(file.rows).toEqual([]);
    expect(unitCostForDay(file, "Hat", "2026-01-15").status).toBe("missing");
  });
});
