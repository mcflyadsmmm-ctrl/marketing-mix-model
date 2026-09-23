import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MORNING_HABIT_FLOOR_SENTENCE,
  growthCopyLine,
  habitMorningGoalLine,
  morningSentence,
} from "./morning-habit";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const FULL_SENTENCE =
  "Typical order around $84. Returning buyers carry 42% of sales. Returning buyers carry $120,000 this year — 40% of your $300,000 target.";

describe("morningSentence", () => {
  it("returns the floor sentence when history is thin or pending", () => {
    expect(morningSentence({ history: "thin" })).toBe(
      MORNING_HABIT_FLOOR_SENTENCE,
    );
    expect(
      morningSentence({
        history: "pending",
        typicalOrderLabel: "$84",
        returningSalesShare: 0.42,
        goalLine: "Returning buyers carry $120,000 this year.",
      }),
    ).toBe(MORNING_HABIT_FLOOR_SENTENCE);
    expect(morningSentence({ history: "thin", typicalOrderLabel: "$0" })).toBe(
      MORNING_HABIT_FLOOR_SENTENCE,
    );
    expect(MORNING_HABIT_FLOOR_SENTENCE).not.toMatch(/\$0/);
    expect(MORNING_HABIT_FLOOR_SENTENCE).not.toMatch(/0×/);
    expect(MORNING_HABIT_FLOOR_SENTENCE).not.toMatch(/last year/i);
  });

  it("writes a full sentence from a typical order, returning share, and goal line", () => {
    expect(
      morningSentence({
        history: "ready",
        typicalOrderLabel: "$84",
        returningSalesShare: 0.42,
        goalLine:
          "Returning buyers carry $120,000 this year — 40% of your $300,000 target.",
      }),
    ).toBe(FULL_SENTENCE);
    expect(FULL_SENTENCE).not.toMatch(/\$0/);
    expect(FULL_SENTENCE).not.toMatch(/0×/);
    expect(FULL_SENTENCE).not.toMatch(/last year/i);
  });

  it("drops $0, a zero multiple, and a fake last year instead of painting them", () => {
    expect(
      morningSentence({
        history: "ready",
        typicalOrderLabel: "$0",
        returningSalesShare: 0,
        goalLine: "Up 0× vs last year after $0 spend.",
      }),
    ).toBe(
      "Returning buyers are not carrying sales in this window.",
    );
    expect(
      morningSentence({
        typicalOrderLabel: "$84",
        goalLine: "Up vs last year.",
      }),
    ).toBe("Typical order around $84.");
    const kept = morningSentence({
      typicalOrderLabel: "$84",
      returningSalesShare: 0.42,
      goalLine: "A new buyer is worth $120 in the first year.",
    });
    expect(kept).toContain("first year");
    expect(kept).not.toMatch(/last year/i);
    expect(kept).not.toMatch(/\$0/);
    expect(kept).not.toMatch(/0×/);
    expect(morningSentence({ history: "ready" })).toBe(
      "Typical order and returning sales are not on this read.",
    );
    expect(morningSentence({ history: "ready" })).not.toBe(
      MORNING_HABIT_FLOOR_SENTENCE,
    );
  });
});

describe("growthCopyLine", () => {
  it("copies the one-order count and drops the not-$0 hedge", () => {
    const onScreen =
      "12 one-order buyers are still waiting on a second order. Typical wait needs 5 second orders on file — not $0.";
    expect(growthCopyLine(onScreen)).toBe(
      "12 one-order buyers are still waiting on a second order. Typical wait needs 5 second orders on file",
    );
    expect(
      morningSentence({
        history: "ready",
        goalLine: growthCopyLine(onScreen),
      }),
    ).toBe(
      "12 one-order buyers are still waiting on a second order. Typical wait needs 5 second orders on file.",
    );
    expect(
      morningSentence({ history: "ready", goalLine: onScreen }),
    ).toBe("Typical order and returning sales are not on this read.");
    expect(growthCopyLine(onScreen)).not.toMatch(/\$0/);
  });
});

describe("habitMorningGoalLine", () => {
  it("paints shop currency on the returning target", () => {
    expect(
      habitMorningGoalLine({
        returningActual: "$120,000",
        returningTarget: "$300,000",
        returningPct: 0.4,
        returningMet: false,
        targetSource: "typed",
      }),
    ).toBe(
      "Returning buyers carry $120,000 this year — 40% of your $300,000 target.",
    );
  });

  it("drops a bare amount and a $0 label", () => {
    expect(
      habitMorningGoalLine({
        returningActual: "120,000",
        returningTarget: "$300,000",
        returningPct: 0.4,
        targetSource: "typed",
      }),
    ).toBeNull();
    expect(
      habitMorningGoalLine({
        returningActual: "$0",
        returningTarget: "$300,000",
        returningPct: 0,
        targetSource: "typed",
      }),
    ).toBeNull();
  });
});

describe("Morning habit strip and copy mounts", () => {
  it("keeps three first-win hrefs in MorningHabitStrip", () => {
    const strip = read("../components/MorningHabitStrip.tsx");
    const hrefs = [...strip.matchAll(/deskHref\("([^"]+)"\)/g)].map(
      (match) => match[1],
    );
    expect(hrefs).toEqual([
      "/app",
      "/app/customers?panel=growth",
      "/app/goals",
    ]);
    expect(strip).toContain("Month close");
    expect(strip).toContain("Who to save");
    expect(strip).toContain("Set a target");
    expect(strip).not.toMatch(/oauth/i);
    expect(strip).not.toMatch(/\/app\/settings/);
  });

  it("mounts the strip from the book page and hides it in shot mode", () => {
    const book = read("../components/DeskBookPage.tsx");
    expect(book).toContain("{shotMode ? null : <MorningHabitStrip />}");
  });

  it("copies morningSentence on the three Today’s reads", () => {
    for (const file of [
      "../components/OverviewMixForecast.tsx",
      "../components/OrderHistoryGoalsBoard.tsx",
      "../components/GrowthTt2Board.tsx",
    ]) {
      const src = read(file);
      expect(src).toContain("Today’s read");
      expect(src).toContain("morningSentence(");
      expect(src).toContain("<CopyMorningSentence");
    }
    const overview = read("../components/OverviewMixForecast.tsx");
    expect(overview).toContain("typicalOrder");
    expect(overview).toContain("Month close is");
    const goals = read("../components/OrderHistoryGoalsBoard.tsx");
    expect(goals).toContain("habitMorningGoalLine");
    expect(goals).toContain("formatCurrency");
    const growth = read("../components/GrowthTt2Board.tsx");
    expect(growth).toContain("goalLine: growthCopyLine(read.line)");
    expect(growth).toContain("{read.line}");
    expect(growth).not.toMatch(/morningSentence\(\{\s*history:\s*"ready"\s*\}\)/);
  });
});
