import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  HABIT_NUDGE_COPY,
  HABIT_NUDGE_DISMISS_KEY,
  HABIT_NUDGE_SESSION_KEY,
  decideHabitNudgeEligible,
  decideHabitNudgeReveal,
  habitAllocationHref,
} from "./habit-nudge";

const here = dirname(fileURLToPath(import.meta.url));
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const nudge = readFileSync(join(here, "../components/HabitNudge.tsx"), "utf8");
const bannerBudget = readFileSync(
  join(here, "./overview-banner-budget.ts"),
  "utf8",
);

const ready = {
  cashActionReady: true,
  periodTrusted: true,
  useSampleDesk: false,
  shotMode: false,
  scoreboardReady: true,
} as const;

describe("decideHabitNudgeEligible", () => {
  it("shows only when cashActionReady and period trusted on a live desk", () => {
    expect(decideHabitNudgeEligible(ready)).toEqual({
      eligible: true,
      reason: "ok",
    });
  });

  it("fails closed for sample, shot, empty, untrusted, and not ready", () => {
    expect(
      decideHabitNudgeEligible({ ...ready, useSampleDesk: true }).reason,
    ).toBe("sample");
    expect(decideHabitNudgeEligible({ ...ready, shotMode: true }).reason).toBe(
      "shot",
    );
    expect(
      decideHabitNudgeEligible({ ...ready, scoreboardReady: false }).reason,
    ).toBe("empty");
    expect(
      decideHabitNudgeEligible({ ...ready, periodTrusted: false }).reason,
    ).toBe("untrusted");
    expect(
      decideHabitNudgeEligible({ ...ready, cashActionReady: false }).reason,
    ).toBe("not_ready");
  });
});

describe("decideHabitNudgeReveal", () => {
  it("hides while hydrating, dismissed, or session already consumed", () => {
    expect(
      decideHabitNudgeReveal({
        eligible: true,
        dismissed: false,
        sessionConsumed: false,
        hydrated: false,
      }).reason,
    ).toBe("hydrating");
    expect(
      decideHabitNudgeReveal({
        eligible: true,
        dismissed: true,
        sessionConsumed: false,
        hydrated: true,
      }).reason,
    ).toBe("dismissed");
    expect(
      decideHabitNudgeReveal({
        eligible: true,
        dismissed: false,
        sessionConsumed: true,
        hydrated: true,
      }).reason,
    ).toBe("session_done");
  });

  it("reveals when eligible, hydrated, and not soft-hidden", () => {
    expect(
      decideHabitNudgeReveal({
        eligible: true,
        dismissed: false,
        sessionConsumed: false,
        hydrated: true,
      }),
    ).toEqual({ show: true, reason: "ok" });
    expect(
      decideHabitNudgeReveal({
        eligible: false,
        dismissed: false,
        sessionConsumed: false,
        hydrated: true,
      }).reason,
    ).toBe("off");
  });
});

describe("HABIT_NUDGE_COPY religion + habit", () => {
  it("stays till-math and Monday-habit, not a suite nag", () => {
    expect(HABIT_NUDGE_COPY.heading).toMatch(/Monday/i);
    expect(HABIT_NUDGE_COPY.body).toMatch(/Update spend/i);
    expect(HABIT_NUDGE_COPY.body).toMatch(/break-even/i);
    expect(HABIT_NUDGE_COPY.body).toMatch(/sales ÷/i);
    expect(HABIT_NUDGE_COPY.body.toLowerCase()).not.toMatch(
      /triple whale|northbeam|pixel|oauth|mta|true roas/,
    );
    expect(HABIT_NUDGE_COPY.updateSpendHref).toContain("/app/spend");
    expect(HABIT_NUDGE_COPY.goalsHref).toBe("/app/goals");
    expect(habitAllocationHref("mtd")).toBe("/app/allocation?period=mtd");
    expect(habitAllocationHref("  ")).toBe("/app/allocation?period=mtd");
  });
});

describe("HabitNudge Overview wiring (L10 / Love-V1)", () => {
  it("keeps HabitNudge off Overview — Shopify depth owns the seat (FRESH_START)", () => {
    // Fresh start stripped Monday-habit chrome from Overview so order/LTV
    // craft stays the first job. Component + pure gates remain for Spend later.
    expect(overview).not.toContain('from "../components/HabitNudge"');
    expect(overview).not.toContain("<HabitNudge");
    expect(nudge).toContain('tone="info"');
    expect(nudge).toContain("dismissible");
    expect(nudge).toContain("HABIT_NUDGE_DISMISS_KEY");
    expect(nudge).toContain("HABIT_NUDGE_SESSION_KEY");
    expect(nudge).toContain("decideHabitNudgeReveal");
    expect(HABIT_NUDGE_DISMISS_KEY).toBe("mcfly-habit-nudge");
    expect(HABIT_NUDGE_SESSION_KEY).toBe("mcfly-habit-nudge-session");
    expect(nudge).not.toMatch(/variant="primary"/);
    expect(bannerBudget).not.toMatch(/habit_nudge|"habit"/);
  });
});
