import { describe, expect, it } from "vitest";
import {
  CLOSED_DAY_NOTE,
  NO_TARGET_LINE,
  confirmedTargetMer,
  parseTargetMerInput,
  resolveTargetMerComparison,
  targetMerFieldValue,
  targetMerSavedCopy,
  TARGET_MER_CLEARED_COPY,
} from "./target-mer";

describe("parseTargetMerInput", () => {
  it("treats blank as a valid clear operation", () => {
    expect(parseTargetMerInput("")).toEqual({
      ok: true,
      operation: "clear",
      targetMer: null,
    });
  });

  it("treats whitespace-only and a missing field as clear", () => {
    expect(parseTargetMerInput("   ")).toEqual({
      ok: true,
      operation: "clear",
      targetMer: null,
    });
    expect(parseTargetMerInput(null)).toEqual({
      ok: true,
      operation: "clear",
      targetMer: null,
    });
  });

  it("parses 4 and 4.0 to the same numeric target", () => {
    expect(parseTargetMerInput("4")).toEqual({
      ok: true,
      operation: "set",
      targetMer: 4,
    });
    expect(parseTargetMerInput("4.0")).toEqual({
      ok: true,
      operation: "set",
      targetMer: 4,
    });
    expect(parseTargetMerInput("4.0×")).toEqual({
      ok: true,
      operation: "set",
      targetMer: 4,
    });
  });

  it("rejects text, zero, negatives, Infinity, and NaN", () => {
    for (const raw of [
      "four",
      "abc",
      "0",
      "0.0",
      "-4",
      "-0.5",
      "Infinity",
      "-Infinity",
      "NaN",
      "1e999",
    ]) {
      const parsed = parseTargetMerInput(raw);
      expect(parsed.ok, `expected ${raw} to be rejected`).toBe(false);
      if (!parsed.ok) expect(parsed.error).toMatch(/greater than 0/);
    }
    expect(parseTargetMerInput(Number.NaN).ok).toBe(false);
    expect(parseTargetMerInput(Number.POSITIVE_INFINITY).ok).toBe(false);
  });

  it("never returns a zero or NaN sentinel for a cleared target", () => {
    const parsed = parseTargetMerInput("");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.targetMer).toBeNull();
  });
});

describe("targetMerFieldValue", () => {
  it("loads a confirmed target and leaves an unconfirmed one blank", () => {
    expect(
      targetMerFieldValue({
        targetMer: 4,
        targetMerConfirmedAt: new Date("2026-09-08T00:00:00.000Z"),
      }),
    ).toBe("4");
    expect(
      targetMerFieldValue({ targetMer: 3, targetMerConfirmedAt: null }),
    ).toBe("");
  });
});

describe("confirmedTargetMer", () => {
  it("returns null for the unconfirmed DB default and the confirmed value when stamped", () => {
    expect(
      confirmedTargetMer({ targetMer: 3, targetMerConfirmedAt: null }),
    ).toBeNull();
    expect(
      confirmedTargetMer({
        targetMer: 4.5,
        targetMerConfirmedAt: new Date("2026-09-08T00:00:00.000Z"),
      }),
    ).toBe(4.5);
  });
});

describe("resolveTargetMerComparison", () => {
  it("resolves above when configured, trusted, and actual clears the target", () => {
    const c = resolveTargetMerComparison({
      actualMer: 4.51,
      targetMer: 4,
      periodTrusted: true,
    });
    expect(c.state).toBe("above");
    expect(c.verdictAllowed).toBe(true);
    expect(c.paused).toBe(false);
    expect(c.target).toBe(4);
    expect(c.line).toBe("Actual 4.51× vs target 4.00×");
    expect(c.closedDayNote).toBe(CLOSED_DAY_NOTE.trusted);
    expect(c.accessibleName).toMatch(/above target/);
  });

  it("resolves below when configured, trusted, and actual misses the target", () => {
    const c = resolveTargetMerComparison({
      actualMer: 3.51,
      targetMer: 4,
      periodTrusted: true,
    });
    expect(c.state).toBe("below");
    expect(c.verdictAllowed).toBe(true);
    expect(c.line).toBe("Actual 3.51× vs target 4.00×");
    expect(c.closedDayNote).toBe(CLOSED_DAY_NOTE.trusted);
    expect(c.accessibleName).toMatch(/below target/);
  });

  it("treats actual exactly at target as above, not below", () => {
    const c = resolveTargetMerComparison({
      actualMer: 4,
      targetMer: 4,
      periodTrusted: true,
    });
    expect(c.state).toBe("above");
  });

  it("stays neutral with no above/below verdict when the period is untrusted", () => {
    const c = resolveTargetMerComparison({
      actualMer: 3.51,
      targetMer: 4,
      periodTrusted: false,
    });
    expect(c.state).toBe("neutral");
    expect(c.verdictAllowed).toBe(false);
    expect(c.paused).toBe(true);
    expect(c.targetConfigured).toBe(true);
    expect(c.line).not.toMatch(/above|below/i);
    expect(c.accessibleName).not.toMatch(/above target|below target/);
    expect(c.accessibleName).toMatch(/paused/);
    expect(c.closedDayNote).toBe(CLOSED_DAY_NOTE.paused);
  });

  it("stays neutral and points at Settings when no target is configured", () => {
    for (const targetMer of [null, 0]) {
      const c = resolveTargetMerComparison({
        actualMer: 3.51,
        targetMer,
        periodTrusted: true,
      });
      expect(c.state).toBe("neutral");
      expect(c.targetConfigured).toBe(false);
      expect(c.target).toBeNull();
      expect(c.verdictAllowed).toBe(false);
      expect(c.paused).toBe(false);
      expect(c.line).toBe(NO_TARGET_LINE);
      expect(c.line).toMatch(/Settings/);
      expect(c.closedDayNote).toBe(CLOSED_DAY_NOTE.noTarget);
      expect(c.accessibleName).not.toMatch(/above|below/);
      expect(c.accessibleName).toMatch(/no target set/i);
    }
  });

  it("resolves unavailable — never above/below — when actual is missing", () => {
    const withTarget = resolveTargetMerComparison({
      actualMer: null,
      targetMer: 4,
      periodTrusted: true,
    });
    expect(withTarget.state).toBe("unavailable");
    expect(withTarget.verdictAllowed).toBe(false);
    expect(withTarget.line).not.toMatch(/^Actual/);
    expect(withTarget.accessibleName).toMatch(/unavailable/);
    expect(withTarget.accessibleName).not.toMatch(/above target|below target/);

    const withoutTarget = resolveTargetMerComparison({
      actualMer: null,
      targetMer: null,
      periodTrusted: false,
    });
    expect(withoutTarget.state).toBe("unavailable");
    expect(withoutTarget.line).toBe(NO_TARGET_LINE);
    expect(withoutTarget.verdictAllowed).toBe(false);
  });

  it("never prints a 0.00× vs target verdict on an untrusted hidden zero", () => {
    const c = resolveTargetMerComparison({
      actualMer: null,
      targetMer: 4,
      periodTrusted: false,
    });
    expect(c.line).not.toMatch(/0\.00× vs target/);
    expect(c.verdictAllowed).toBe(false);
    expect(c.closedDayNote).toBe(CLOSED_DAY_NOTE.paused);
  });
});

describe("target save copy", () => {
  it("states the saved target and never merges it with break-even", () => {
    expect(targetMerSavedCopy(4)).toBe("Target Total ROAS saved · 4.00×.");
    expect(targetMerSavedCopy(4)).not.toMatch(/break-even/i);
  });

  it("tells the merchant a cleared target leaves actual only", () => {
    expect(TARGET_MER_CLEARED_COPY).toBe(
      "Target cleared. Overview will show actual Total ROAS without a goal rail.",
    );
  });

  it("uses distinct closed-day copy for each rail state", () => {
    const notes = new Set(Object.values(CLOSED_DAY_NOTE));
    expect(notes.size).toBe(3);
    expect(CLOSED_DAY_NOTE.paused).toMatch(/paused/);
    expect(CLOSED_DAY_NOTE.trusted).toMatch(/Today can still move/);
    expect(CLOSED_DAY_NOTE.noTarget).toMatch(/Today can still move/);
  });
});
