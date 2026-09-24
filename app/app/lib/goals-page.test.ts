import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const goals = readFileSync(join(here, "../routes/app.goals.tsx"), "utf8");
const demoGoals = readFileSync(join(here, "../routes/demo.goals.tsx"), "utf8");
const page = goals.slice(goals.indexOf("export default"));

describe("Goals page", () => {
  it("is its own route with one saved target", () => {
    expect(goals).toContain('name="targetMer"');
    expect(goals).toContain("Save target");
    expect(goals).toContain("No target saved.");
    expect(goals).toContain("targetMerSavedAt");
    expect(goals).not.toContain("redirect(`/app/settings");
    expect(goals).not.toContain("SpendExplorer");
    expect(goals).not.toContain("OrderHistoryGoalsBoard");
  });

  it("does not say at goal against a target the merchant never set", () => {
    expect(page).not.toMatch(/at goal/i);
    expect(goals).toContain("does not compare you to a target you never set");
  });

  it("does not point the target field at Settings", () => {
    expect(goals).not.toContain('href="/app/settings"');
    expect(goals).not.toMatch(/add spend on Marketing/i);
    expect(goals).not.toContain("UnlockFullHistoryBanner");
  });

  it("public /demo/goals does not invent a twelve-month $0 plan", () => {
    expect(demoGoals).toMatch(/throw redirect/);
    expect(demoGoals).not.toMatch(
      /Array\.from\(\{\s*length:\s*12\s*\},\s*\(\)\s*=>\s*0\)/,
    );
  });
});
