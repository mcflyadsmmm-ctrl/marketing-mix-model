import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Easy Add Spend tab (three doors)", () => {
  const spend = read("../routes/app.spend.tsx");
  const explorer = read("../components/SpendExplorer.tsx");
  const css = read("../styles/mcfly-desk.css");

  it("puts channel picker, type-it, then Ads Manager CSV", () => {
    const pickAt = spend.indexOf('id="mcfly-spend-platforms"');
    const addAt = spend.indexOf('id="mcfly-spend-add"');
    const csvAt = spend.indexOf('id="mcfly-spend-csv"');
    expect(pickAt).toBeGreaterThan(-1);
    expect(addAt).toBeGreaterThan(pickAt);
    expect(csvAt).toBeGreaterThan(addAt);
    expect(spend).toContain("Pick the channels you buy");
    expect(spend).toContain("Type it");
    expect(spend).toContain("Paste or upload Ads Manager CSV");
    expect(spend).toContain("That’s ${formatCurrency(billPreview.dailyAmount)} per day.");
  });

  it("does not bury CSV import in a closed details drawer", () => {
    expect(spend).toContain('id="mcfly-spend-csv"');
    expect(spend).not.toMatch(/<details[^>]*id="mcfly-spend-csv"/);
    expect(spend).not.toContain("<h2>Period spend</h2>");
    expect(spend).not.toContain("SpendExportWalkthrough");
    expect(spend).not.toContain("Fill history");
  });

  it("covers 90 closed days as a visual strip and embeds the explorer", () => {
    expect(spend).toContain("const SPEND_COVERAGE_DAYS = 90");
    expect(spend).toContain("explorerQueryMatchingScoreboard");
    expect(spend).toContain("<PeriodControl");
    expect(spend).toContain("Your spend is on the desk");
    expect(spend).toContain("Days with no row are $0");
    expect(spend).toContain("<SpendExplorer");
    expect(spend).toContain('basePath="/app/spend"');
    expect(spend).toContain("compare");
    expect(spend).toContain('variant="spend"');
    expect(spend).toContain("Daily spend by channel");
  });

  it("keeps explorer drill-down on Spend when embedded", () => {
    expect(explorer).toContain('basePath?: "/app" | "/app/spend"');
    expect(explorer).toContain("pathname: basePath");
    expect(explorer).toContain("compareExplorerBuckets");
    expect(explorer).toContain('hash: "mcfly-spend-csv"');
    expect(explorer).toContain("explorerEmptyCopy");
  });

  it("lets merchants paste daily rows, not only upload a file", () => {
    expect(spend).toContain('id="mcfly-spend-csv-paste"');
    expect(spend).toContain("Paste daily rows");
    expect(spend).toContain('name="csv"');
  });

  it("shows From/To dates on the Spend explorer embed", () => {
    expect(css).toContain(".mcfly-explorer--compact .mcfly-explorer__dates");
    expect(css).not.toMatch(
      /\.mcfly-explorer--compact \.mcfly-explorer__dates \{\s*display:\s*none/,
    );
  });

  it("does not nest billing inside the Add spend form", () => {
    const formStart = spend.indexOf(
      '<Form method="post" className="mcfly-spend-add__form"',
    );
    const formEnd = spend.indexOf("</Form>", formStart);
    expect(formStart).toBeGreaterThan(-1);
    expect(spend.slice(formStart, formEnd)).not.toContain("ProUpsellBlock");
    expect(spend.slice(formStart, formEnd)).not.toContain("ProUpgradeButton");
  });

  it("force-channel allowlist is every SPEND_CHANNELS member, not Meta/Google only", () => {
    expect(spend).toContain("parseForceChannel");
    expect(spend).not.toMatch(
      /forceRaw === "meta" \|\| forceRaw === "google"/,
    );
    expect(spend).toContain("requestSubmit");
    expect(spend).not.toMatch(
      /setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*mcfly-spend-csv-submit/,
    );
    expect(spend).toMatch(/This looks like a single-platform/);
    expect(spend).toContain("SPEND_CHANNELS");
    expect(spend).toContain("mcfly-spend-csv-form");
  });

  /*
   * 2026-08-26 Admin smoke: the primary submit was an <s-button> whose host
   * measured 0×0, so the merchant's first click fell through to the channel
   * select instead of saving. Every door submits through a native control now.
   */
  it("submits each door through a native control, not a web component", () => {
    const actionsAt = spend.indexOf('className="mcfly-spend-add__actions"');
    expect(actionsAt).toBeGreaterThan(-1);
    // Drop JSX comments so prose about the old bug cannot fail the assertion.
    const actions = spend
      .slice(actionsAt, actionsAt + 1200)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(actions).toContain("<button");
    expect(actions).toContain('type="submit"');
    expect(actions).toContain("mcfly-spend-submit");
    expect(actions).not.toContain("<s-button");

    // CSV door.
    const csvSubmitAt = spend.indexOf('id="mcfly-spend-csv-submit"');
    expect(csvSubmitAt).toBeGreaterThan(-1);
    expect(spend.slice(csvSubmitAt - 120, csvSubmitAt)).toContain("<button");

    // Template door.
    expect(spend).toMatch(
      /<a\s+className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"/,
    );
  });

  it("gives the submit a real hit box that cannot collapse to zero", () => {
    expect(css).toContain(".mcfly-spend-submit");
    expect(css).toMatch(
      /\.mcfly-spend-submit \{[^}]*min-height:\s*2\.75rem/,
    );
    expect(css).toMatch(/\.mcfly-spend-submit \{[^}]*min-width:/);
    expect(css).toMatch(/\.mcfly-btn \{[^}]*display:\s*inline-flex/);
    expect(css).toMatch(/\.mcfly-btn \{[^}]*min-height:\s*2\.75rem/);
  });

  it("names the three doors up front so no tutorial is needed", () => {
    expect(spend).toContain("mcfly-spend-doors");
    expect(spend).toContain("SPEND_DOORS");
    expect(spend).toContain("Three ways to add spend");
    const doorsAt = spend.indexOf('className="mcfly-spend-doors"');
    const helperAt = spend.indexOf('className="mcfly-spend-helper"');
    expect(doorsAt).toBeGreaterThan(-1);
    // Signpost lands before the wall of explanation.
    expect(doorsAt).toBeLessThan(helperAt);
  });

  it("first-session how-to is Meta + billboard vs same-day sales, empty spend is $0", () => {
    expect(spend).toContain("yesterday’s Meta plus");
    expect(spend).toContain("billboard");
    expect(spend).toContain("Empty spend");
    expect(spend).toContain("$0");
    expect(spend).not.toContain("Empty days are not $0");
    expect(spend).toContain("We already load your Shopify sales");
    expect(spend).toContain("We do not ask you to connect Meta or Google");
  });
});
