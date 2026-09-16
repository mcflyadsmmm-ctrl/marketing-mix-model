import { describe, expect, it } from "vitest";
import { spendEntrySourceLabel } from "./spend-source-label";

describe("spendEntrySourceLabel", () => {
  it("names daily-rate rows separately from typed and uploaded truth", () => {
    expect(spendEntrySourceLabel("recurring")).toBe("Daily rate");
    expect(spendEntrySourceLabel("manual")).toBe("Typed");
    expect(spendEntrySourceLabel("csv")).toBe("Uploaded");
    expect(spendEntrySourceLabel("meta")).toBe("Uploaded");
    expect(spendEntrySourceLabel("google")).toBe("Uploaded");
    expect(spendEntrySourceLabel("sample")).toBe("Sample");
    expect(spendEntrySourceLabel("")).toBe("Typed");
  });
});
