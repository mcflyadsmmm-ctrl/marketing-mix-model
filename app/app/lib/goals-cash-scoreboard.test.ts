import { describe, expect, it } from "vitest";
import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";
import {
  GOALS_BE_NEEDS_MARGIN,
  GOALS_NO_TARGET_LINE,
  resolveGoalsCashScoreboard,
} from "./goals-cash-scoreboard";
import { PRODUCT_NOUN } from "./product-labels";

const BELOW_BE = /below break-even/i;
const ZERO_HERO = /0\.00\s*×/;

function base(
  overrides: Partial<Parameters<typeof resolveGoalsCashScoreboard>[0]> = {},
) {
  return resolveGoalsCashScoreboard({
    ytdSales: 120_000,
    ytdSpend: 40_000,
    ytdMer: 3,
    targetMer: 3.5,
    breakEvenMer: 2.5,
    salesError: null,
    hasLiveSpend: true,
    useSampleDesk: false,
    ...overrides,
  });
}

describe("resolveGoalsCashScoreboard — fail closed", () => {
  it("never says below break-even when year sales facts are incomplete", () => {
    const board = base({
      ytdSales: 0,
      ytdMer: 0,
      salesError: "Sales day facts incomplete (3/31 days) — YoY baselines withheld",
    });
    expect(board.kind).toBe("untrusted_sales");
    expect(board.mer).toBeNull();
    expect(board.merLabel).toBe("—");
    expect(board.vsBreakEven).toBe("unknown");
    expect(board.vsTarget).toBe("unknown");
    expect(board.heading).not.toMatch(BELOW_BE);
    expect(board.body).not.toMatch(BELOW_BE);
    expect(board.vsBreakEvenLine).not.toMatch(BELOW_BE);
    expect(board.heading).not.toMatch(ZERO_HERO);
    expect(board.body).toMatch(/not a trusted multiple/i);
  });

  it("does not hero 0.00× as a live multiple when spend exists but sales errored", () => {
    const board = base({
      ytdSales: 0,
      ytdSpend: 12_000,
      ytdMer: 0,
      salesError: "Failed to load sales facts",
      breakEvenMer: 2.86,
    });
    expect(board.kind).toBe("untrusted_sales");
    expect(board.mer).toBeNull();
    expect(`${board.heading} ${board.merLabel}`).not.toMatch(ZERO_HERO);
    expect(board.vsBreakEven).not.toBe("below");
  });

  it("asks for spend instead of a fake 0.00× / below-BE call", () => {
    const board = base({
      ytdSpend: 0,
      ytdMer: null,
      hasLiveSpend: false,
      breakEvenMer: 2.5,
    });
    expect(board.kind).toBe("needs_spend");
    expect(board.mer).toBeNull();
    expect(board.heading).not.toMatch(BELOW_BE);
    expect(board.vsBreakEven).toBe("unknown");
    expect(board.nextAction?.href).toMatch(/\/app\/spend/);
  });

  it("treats live spend count 0 as needs-spend even if a $0 month map slipped through", () => {
    const board = base({
      ytdSpend: 0,
      ytdMer: null,
      hasLiveSpend: false,
      ytdSales: 80_000,
    });
    expect(board.kind).toBe("needs_spend");
    expect(board.body).toMatch(/Spread one ad invoice/i);
  });
});

describe("resolveGoalsCashScoreboard — trusted year", () => {
  it("says cleared break-even when YTD MER is above the confirmed floor", () => {
    const board = base({ ytdMer: 3, breakEvenMer: 2.5, targetMer: 4 });
    expect(board.kind).toBe("ready");
    expect(board.vsBreakEven).toBe("above");
    expect(board.heading).toMatch(/cleared break-even/i);
    expect(board.vsBreakEvenLine).toMatch(/Cleared break-even/);
    expect(board.vsTarget).toBe("below");
  });

  it("says below break-even only when sales and spend are trusted", () => {
    const board = base({ ytdMer: 1.8, breakEvenMer: 2.5, targetMer: 3 });
    expect(board.kind).toBe("ready");
    expect(board.vsBreakEven).toBe("below");
    expect(board.heading).toMatch(BELOW_BE);
    expect(board.nextAction?.href).toBe("/app/allocation");
  });

  it("withholds the BE call when margin is unconfirmed", () => {
    const board = base({ breakEvenMer: null, ytdMer: 1.2, targetMer: 3 });
    expect(board.kind).toBe("ready");
    expect(board.vsBreakEven).toBe("unknown");
    expect(board.heading).not.toMatch(BELOW_BE);
    expect(board.vsBreakEvenLine).toBe(GOALS_BE_NEEDS_MARGIN);
    expect(board.nextAction?.href).toBe("/app/settings");
  });

  it("does not invent a target rail", () => {
    const board = base({ targetMer: null, breakEvenMer: 2.5, ytdMer: 3 });
    expect(board.vsTarget).toBe("unknown");
    expect(board.vsTargetLine).toBe(GOALS_NO_TARGET_LINE);
  });
});

describe("resolveGoalsCashScoreboard — SAMPLE", () => {
  it("stamps practice numbers and never reads as live money", () => {
    const board = base({
      useSampleDesk: true,
      hasLiveSpend: false,
      ytdMer: 4.4,
      targetMer: 4.4,
      breakEvenMer: 1 / 0.35,
    });
    expect(board.kind).toBe("sample");
    expect(board.heading).toContain(SAMPLE_MONEY_MARK);
    expect(board.body).toMatch(/practice/i);
    expect(board.body).toMatch(/Real store/);
    expect(board.useSampleDesk).toBe(true);
    expect(board.mer).toBe(4.4);
  });

  it("does not let a salesError on SAMPLE hide the practice till", () => {
    const board = base({
      useSampleDesk: true,
      salesError: "should not apply on SAMPLE",
      ytdMer: 4.4,
    });
    expect(board.kind).toBe("sample");
    expect(board.mer).toBe(4.4);
  });
});

describe("resolveGoalsCashScoreboard — religion", () => {
  it("does not mention pixels, MTA, or true ROAS", () => {
    const blob = [
      base(),
      base({ salesError: "incomplete" }),
      base({ hasLiveSpend: false, ytdSpend: 0, ytdMer: null }),
      base({ useSampleDesk: true }),
    ]
      .map((b) => `${b.heading} ${b.body} ${b.vsBreakEvenLine} ${b.vsTargetLine}`)
      .join("\n");
    expect(blob).not.toMatch(/pixel|mta|true roas|view-through|path credit/i);
    expect(blob).toContain(PRODUCT_NOUN.totalRoas);
  });
});
