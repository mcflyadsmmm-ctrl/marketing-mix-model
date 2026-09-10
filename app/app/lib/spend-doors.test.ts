import { describe, expect, it } from "vitest";
import { SPEND_DOORS, SPEND_IMPORT_DOORS } from "./spend-doors";

describe("SPEND_DOORS", () => {
  it("names exactly the three doors the product promises", () => {
    expect(SPEND_DOORS).toHaveLength(3);
    expect(SPEND_DOORS.map((d) => d.title)).toEqual([
      "Add a day",
      "Daily amount until I change it",
      "Import or backfill",
    ]);
  });

  it("puts typed-day first and import last", () => {
    expect(SPEND_DOORS[0].href).toBe("#mcfly-spend-add");
    expect(SPEND_DOORS[2].href).toBe("/app/spend/import");
  });

  it("does not promise a platform OAuth connection", () => {
    const corpus = JSON.stringify(SPEND_DOORS).toLowerCase();
    expect(corpus).not.toContain("connect meta");
    expect(corpus).not.toContain("oauth");
    expect(corpus).not.toContain("pixel");
  });
});

describe("SPEND_IMPORT_DOORS", () => {
  it("keeps template, CSV, and one-bill on the import surface", () => {
    expect(SPEND_IMPORT_DOORS.map((d) => d.href)).toEqual([
      "#mcfly-spend-platforms",
      "#mcfly-spend-csv",
      "#mcfly-spend-add",
    ]);
  });
});
