import { describe, expect, it } from "vitest";
import { SPEND_DOORS } from "./spend-doors";

describe("SPEND_DOORS", () => {
  it("names exactly the three doors the product promises", () => {
    expect(SPEND_DOORS).toHaveLength(3);
    expect(SPEND_DOORS.map((d) => d.title)).toEqual([
      "Download Template and Upload",
      "Upload an Ads Manager CSV",
      "Add one bill",
    ]);
  });

  it("puts the fill-in-the-blank workflow first and says so", () => {
    expect(SPEND_DOORS[0].href).toBe("#mcfly-spend-platforms");
    expect(SPEND_DOORS[0].hint.toLowerCase()).toContain("start here");
  });

  it("points every door at a section that exists on Spend", () => {
    expect(SPEND_DOORS.map((d) => d.href)).toEqual([
      "#mcfly-spend-platforms",
      "#mcfly-spend-csv",
      "#mcfly-spend-add",
    ]);
  });

  it("does not promise a platform OAuth connection", () => {
    const corpus = JSON.stringify(SPEND_DOORS).toLowerCase();
    expect(corpus).not.toContain("connect meta");
    expect(corpus).not.toContain("oauth");
    expect(corpus).not.toContain("pixel");
  });
});
