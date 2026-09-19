/**
 * Period / YoY / growth delta chrome — up affirms green, down is quiet grey.
 * Never danger red on a change. Formulas stay honest; this is paint only.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const css = read("../styles/mcfly-desk.css");
const scoreboard = read("../components/CertifiedScoreboard.tsx");

const DELTA_DOWN_SELECTORS = [
  ".mcfly-kpi__delta--down",
  ".mcfly-sales-gauges__yoy--down",
  ".mcfly-explorer__compare-delta--down",
  ".mcfly-alloc-v2__snap-delta--down",
  ".mcfly-goals-delta--down",
  ".mcfly-goal-row__yoy--down",
  ".mcfly-scoreboard__delta--down",
  ".mcfly-yoy__vs--down",
  ".mcfly-yoy__v--down",
  ".mcfly-yoy--glance .mcfly-yoy__delta--down",
  ".mcfly-chart__vs--down",
  ".mcfly-orders-intel__delta--down",
  ".mcfly-orders-ledger__delta--down",
  ".mcfly-chart__stat-delta--down",
  // Polish FAIL #4 — Goals pace / table / bar missed by #103 sales-five
  ".mcfly-goals-pace--down",
  ".mcfly-goal-row__pace.mcfly-goals-pace--down",
  ".mcfly-goals-table__row--down",
  ".mcfly-goals-table__row--current.mcfly-goals-table__row--down",
  ".mcfly-goals-month-bar__fill--down",
];

function ruleBody(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThan(-1);
  const end = css.indexOf("}", start);
  return css.slice(start, end + 1);
}

describe("desk delta tokens — green up, grey down", () => {
  it("declares shared period-delta tokens (up=truth, down=mute, never lie)", () => {
    expect(css).toMatch(/--mcfly-delta-up:\s*var\(--mcfly-truth\)/);
    expect(css).toMatch(/--mcfly-delta-down:\s*var\(--mcfly-mute\)/);
    expect(css).toMatch(/--mcfly-delta-flat:\s*var\(--mcfly-mute\)/);
    expect(css).toContain("--mcfly-lie: #b91c1c");
    expect(css).toContain("--mcfly-mute: #5a6f85");
  });

  it("paints period / YoY / growth downs with the grey token — not danger red", () => {
    for (const selector of DELTA_DOWN_SELECTORS) {
      const body = ruleBody(selector);
      expect(body, selector).toContain("var(--mcfly-delta-down)");
      expect(body, selector).not.toContain("var(--mcfly-lie)");
      expect(body, selector).not.toContain("var(--mcfly-warn)");
      expect(body, selector).not.toMatch(/#b91c1c|#dc2626|#b45309|#fff7ed/i);
    }
  });

  it("reaffirms wins in green and paints scoreboard YoY ups", () => {
    expect(ruleBody(".mcfly-kpi__delta--up")).toContain("var(--mcfly-delta-up)");
    expect(ruleBody(".mcfly-yoy--glance .mcfly-yoy__delta--up")).toContain(
      "var(--mcfly-delta-up)",
    );
    expect(ruleBody(".mcfly-scoreboard__delta--up")).toContain(
      "var(--mcfly-delta-up)",
    );
    expect(scoreboard).toContain("mcfly-scoreboard__delta--up");
    expect(scoreboard).toContain("mcfly-scoreboard__delta--down");
  });

  it("keeps Goals pace / table / bar wins green — only downs go grey", () => {
    expect(ruleBody(".mcfly-goals-pace--up")).toContain("var(--mcfly-truth)");
    expect(ruleBody(".mcfly-goals-pace--up")).not.toContain("var(--mcfly-lie)");
    expect(ruleBody(".mcfly-goal-row__pace.mcfly-goals-pace--up")).toContain(
      "var(--mcfly-truth)",
    );
    expect(ruleBody(".mcfly-goals-table__row--up")).toContain(
      "var(--mcfly-truth-soft)",
    );
    expect(ruleBody(".mcfly-goals-month-bar__fill--up")).toContain(
      "var(--mcfly-truth)",
    );
    expect(ruleBody(".mcfly-goals-month-bar__fill--up")).not.toContain(
      "var(--mcfly-lie)",
    );
  });
});
