/**
 * Process lock — stops old agent chrome from creeping back via docs/tests.
 * Product metrics and connectors stay wide open.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const freshStart = readFileSync(join(repoRoot, "docs/FRESH_START.md"), "utf8");
const agents = readFileSync(join(repoRoot, "AGENTS.md"), "utf8");
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const cashDeskUx = existsSync(join(here, "./cash-desk-ux.test.ts"))
  ? readFileSync(join(here, "./cash-desk-ux.test.ts"), "utf8")
  : "";

const BANNED_IN_MERCHANT_STRINGS = [
  /ceo desk/i,
  /monday desk/i,
  /cash desk/i,
  /boardroom/i,
  /operator-grade/i,
  /product religion/i,
];

describe("Fresh start anti-creep", () => {
  it("keeps FRESH_START as the agent north star", () => {
    expect(freshStart).toMatch(/wins on conflict/i);
    expect(freshStart).toMatch(/\$39/);
    expect(freshStart).toMatch(/7-day trial/i);
    expect(freshStart).toMatch(/no product [“"']religion/i);
    expect(agents).toContain("docs/FRESH_START.md");
    expect(agents).toMatch(/historical/i);
  });

  it("does not let cash-desk UX tests require CashVerdict on Overview", () => {
    if (!cashDeskUx) return;
    expect(cashDeskUx).not.toMatch(
      /expect\(overview\)\.toContain\(["']CashVerdict["']\)/,
    );
  });

  it("flags banned jargon in Overview string literals", () => {
    const stringLiterals = [...overview.matchAll(/["'`]([^"'`]{0,160})["'`]/g)].map(
      (m) => m[1] ?? "",
    );
    const merchantCopy = stringLiterals.join("\n");
    for (const pattern of BANNED_IN_MERCHANT_STRINGS) {
      expect(merchantCopy).not.toMatch(pattern);
    }
  });

  it("ships the always-on Cursor rule for fresh start", () => {
    const rulePath = join(repoRoot, ".cursor/rules/fresh-start.mdc");
    expect(existsSync(rulePath)).toBe(true);
    const rule = readFileSync(rulePath, "utf8");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("FRESH_START");
  });
});
