import { describe, expect, it } from "vitest";
import {
  INGEST_RECENT_CLOSED_DAYS,
  orderMissingIngestDays,
} from "./ingest-priority";

describe("orderMissingIngestDays", () => {
  const window = ["2024-01-01", "2024-06-01", "2026-06-01", "2026-09-21", "2026-09-22"];

  it("fills the recent slice before older history", () => {
    expect(INGEST_RECENT_CLOSED_DAYS).toBe(90);
    const next = orderMissingIngestDays(window, new Set(), 2);
    expect(next).toEqual(["2026-09-22", "2026-09-21"]);
  });

  it("moves to older days only after the recent slice is sealed", () => {
    const next = orderMissingIngestDays(
      window,
      new Set(["2026-09-22", "2026-09-21"]),
      2,
    );
    expect(next[0]).toBe("2026-06-01");
    expect(next).not.toContain("2026-09-22");
  });
});
