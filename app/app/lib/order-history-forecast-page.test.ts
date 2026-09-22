import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const overview = read("../routes/app._index.tsx");
const demoOverview = read("../routes/demo._index.tsx");
const goals = read("../routes/app.goals.tsx");
const demoGoals = read("../routes/demo.goals.tsx");
const board = read("../components/OrderHistoryForecast.tsx");
const lib = read("./order-history-forecast.ts");
const sample = read("./public-sample-page.server.ts");
const css = read("../styles/mcfly-desk.css");
const nav = read("./desk-nav.ts");

describe("P2-A order-history forecast — on the existing tabs", () => {
  it("sits on Overview after the mix board, still inside the open fold", () => {
    const order = [
      "<OverviewMixForecast",
      "<OrderHistoryForecast",
      "<ShareableInsightCards",
    ].map((tag) => overview.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(overview).toContain("buildOrderHistoryForecast");
    expect(demoOverview.indexOf("<OrderHistoryForecast")).toBeGreaterThan(
      demoOverview.indexOf("<OverviewMixForecast"),
    );
    expect(sample).toContain("buildOrderHistoryForecast");
  });

  it("densifies Goals from order history without a new tab", () => {
    const boardAt = goals.indexOf("<OrderHistoryGoalsBoard");
    const forecastAt = goals.indexOf("<OrderHistoryForecast");
    const heroAt = goals.indexOf("mcfly-goals-hero--soft");
    expect(boardAt).toBeGreaterThan(-1);
    expect(forecastAt).toBeGreaterThan(boardAt);
    expect(heroAt).toBeGreaterThan(forecastAt);
    expect(goals).toContain('variant="goals"');
    expect(demoGoals).toContain("<OrderHistoryForecast");
    expect(demoGoals).toContain('variant="goals"');
    expect(nav).toContain('{ path: "/app", label: "Overview" }');
    expect(nav).toContain('{ path: "/app/orders", label: "Orders" }');
    expect(nav).toContain('{ path: "/app/customers", label: "Customers" }');
    expect(nav).toContain('{ path: "/app/spend", label: "Spend" }');
    expect(nav).toContain('{ path: "/app/goals", label: "Goals" }');
    expect(nav).not.toContain('{ path: "/app/growth"');
    expect(nav).not.toContain('{ path: "/app/ltv"');
    expect(nav).not.toContain("Forecast");
  });

  it("shows the formula as text and blanks as a dash", () => {
    expect(board).toContain("data-p2a=\"order-history-forecast\"");
    expect(board).toContain("view.formula");
    expect(board).toContain("view.method");
    expect(board).toContain('view.estimate == null ? "—"');
    expect(lib).toContain("This month sales");
    expect(lib).toContain("Next month = typical day × days in that month");
    expect(lib).toContain("not a black box");
    expect(lib).toContain("Not $0.");
    expect(css).toContain(".mcfly-oh-forecast__delta--down");
    expect(css).toContain(".mcfly-oh-forecast__delta--up");
  });

  it("keeps a behind-goal delta grey, and stacks on a phone", () => {
    const block = css.slice(css.indexOf("P2-A order-history forecast"));
    expect(block.length).toBeGreaterThan(20);
    const down = block.slice(
      block.indexOf(".mcfly-oh-forecast__delta--down"),
      block.indexOf(".mcfly-oh-forecast__delta--flat"),
    );
    expect(down).toContain("var(--mcfly-delta-down)");
    expect(down).not.toContain("var(--mcfly-lie)");
    expect(down).not.toMatch(/#e11|#dc2626|#b91c1c|red/);
    expect(block).toContain("max-width: 420px");
  });

  it("is zero spend, zero ROAS — order history only", () => {
    for (const source of [board, lib]) {
      expect(source).not.toContain("Spend Upload");
      expect(source).not.toContain("Total ROAS");
      expect(source).not.toContain("Edit spend");
      expect(source).not.toContain("QuietSpendDoor");
      expect(source).not.toContain("0.00×");
      expect(source).not.toMatch(/\bROAS\b/);
      expect(source).not.toMatch(/\bCOGS\b/);
      expect(source).not.toMatch(/\bpixel/i);
      expect(source).not.toMatch(/\bMTA\b/);
      expect(source).not.toMatch(/Klaviyo/i);
    }
  });
});
