import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Spend day card", () => {
  const spend = read("../routes/app.spend.tsx");
  const appShell = read("../routes/app.tsx");
  const labels = read("./product-labels.ts");
  const explorer = read("../components/SpendExplorer.tsx");
  const css = read("../styles/mcfly-desk.css");

  it("names the spend route Upload Spend and the nav tab Marketing", () => {
    expect(labels).toContain('uploadSpend: "Upload Spend"');
    expect(labels).toContain('setupAddSpend: "Upload Spend"');
    expect(labels).toContain('marketingSection: "Marketing"');
    expect(appShell).toContain("DESK_PRIMARY_NAV");
    expect(read("./desk-nav.ts")).toContain('label: "Marketing"');
    expect(spend).toContain("heading={PRODUCT_NOUN.uploadSpend}");
  });

  it("keeps typed-day, recurring, and import on the main Spend surface", () => {
    expect(spend).toContain('id="mcfly-spend-add"');
    expect(spend).toContain('id="mcfly-spend-recurring"');
    expect(spend).toContain("/app/spend/import");
    expect(spend).toContain("SPEND_DOORS");
    expect(spend).toContain("Three ways to add spend");
    expect(spend).toContain("name=\"spendDate\"");
    expect(spend).toContain("Billboard, radio, agency…");
    expect(spend).not.toContain("<h2>Period spend</h2>");
    expect(spend).not.toContain("SpendExportWalkthrough");
  });

  it("covers closed days as a visual strip and embeds the explorer", () => {
    expect(spend).toContain("dayCoverage.total");
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
    expect(explorer).toContain(
      'basePath?: "/app" | "/app/spend" | "/app/allocation"',
    );
    expect(explorer).toContain("pathname: basePath");
    expect(explorer).toContain("compareExplorerBuckets");
    expect(explorer).toContain('hash: "mcfly-spend-csv"');
    expect(explorer).toContain("explorerEmptyCopy");
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

  it("submits the day card through a native control, not a web component", () => {
    const actionsAt = spend.indexOf('className="mcfly-spend-add__actions"');
    expect(actionsAt).toBeGreaterThan(-1);
    const actions = spend
      .slice(actionsAt, actionsAt + 1200)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(actions).toContain("<button");
    expect(actions).toContain('type="submit"');
    expect(actions).toContain("mcfly-spend-submit");
    expect(actions).not.toContain("<s-button");
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
    const doorsAt = spend.indexOf('className="mcfly-spend-doors"');
    const helperAt = spend.indexOf('className="mcfly-spend-helper"');
    expect(doorsAt).toBeGreaterThan(-1);
    expect(doorsAt).toBeLessThan(helperAt);
  });

  it("says no ad login once, not as a manifesto", () => {
    expect(spend).toContain("Shopify sales are already here");
    expect(spend).toContain("Empty spend");
    expect(spend).toContain("$0");
    expect(spend).toContain("No ad-account login");
    expect(spend).not.toContain("Empty days are not $0");
    expect(spend).not.toContain("Ad-platform logins often fail");
    expect(spend).not.toContain("Why no ad-account connection?");
  });
});

describe("Import or backfill", () => {
  const spendImport = read("../routes/app.spend.import.tsx");

  it("puts the five-year template first, then CSV and one-bill helpers", () => {
    const pickAt = spendImport.indexOf('id="mcfly-spend-platforms"');
    const addAt = spendImport.indexOf('id="mcfly-spend-add"');
    const csvAt = spendImport.indexOf('id="mcfly-spend-csv"');
    expect(pickAt).toBeGreaterThan(-1);
    expect(csvAt).toBeGreaterThan(pickAt);
    expect(addAt).toBeGreaterThan(csvAt);
    expect(spendImport).toContain("<h2>Download Template and Upload</h2>");
    expect(spendImport).toContain("<h2>Upload an Ads Manager CSV</h2>");
    expect(spendImport).toContain("<h2>Add one bill</h2>");
    expect(spendImport).toContain("billSaveLabel");
  });

  it("does not bury CSV import in a closed details drawer", () => {
    expect(spendImport).toContain('id="mcfly-spend-csv"');
    expect(spendImport).not.toMatch(/<details[^>]*id="mcfly-spend-csv"/);
  });

  it("uses one explicit When vocabulary and labels the seven-day window", () => {
    expect(spendImport).toContain("PRIMARY_SPEND_WHEN_OPTIONS");
    expect(spendImport).toContain("MORE_SPEND_WHEN_OPTIONS");
    expect(spendImport).toContain("When did this spend happen?");
    expect(spendImport).toContain("First of 7 days");
    expect(spendImport).toContain('billWhen === "custom"');
    expect(spendImport).not.toContain('<option value="week">Week</option>');
  });

  it("wires the selected template range into the proud download", () => {
    expect(spendImport).toContain("SPEND_TEMPLATE_RANGE_OPTIONS");
    expect(spendImport).toContain("spendTemplateRangeQuery");
    expect(spendImport).toContain("selectedBlankTemplateHref");
    expect(spendImport).toContain("Pick at least one channel");
    expect(spendImport).toMatch(
      /useState<SpendTemplateRangeId>\(\s*"60d",?\s*\)/,
    );
    expect(spendImport).toContain("Upload the filled template");
    expect(spendImport).toContain("mcfly-spend-template-upload-form");
  });

  it("lets merchants paste daily rows, not only upload a file", () => {
    expect(spendImport).toContain('id="mcfly-spend-csv-paste"');
    expect(spendImport).toContain("Paste daily rows");
    expect(spendImport).toContain('name="csv"');
  });

  it("force-channel allowlist is every SPEND_CHANNELS member, not Meta/Google only", () => {
    expect(spendImport).toContain("parseForceChannel");
    expect(spendImport).not.toMatch(
      /forceRaw === "meta" \|\| forceRaw === "google"/,
    );
    expect(spendImport).not.toMatch(
      /setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*mcfly-spend-csv-submit/,
    );
    expect(spendImport).toMatch(/This looks like a single-platform/);
    expect(spendImport).toContain("SPEND_CHANNELS");
    expect(spendImport).toContain("mcfly-spend-csv-form");
  });

  it("submits CSV and template through native controls", () => {
    const csvSubmitAt = spendImport.indexOf('id="mcfly-spend-csv-submit"');
    expect(csvSubmitAt).toBeGreaterThan(-1);
    expect(spendImport.slice(csvSubmitAt - 120, csvSubmitAt)).toContain("<button");
    expect(spendImport).toMatch(
      /<a\s+className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"/,
    );
  });

  it("confirms overlapping days with a real form post, not a hidden-button click", () => {
    expect(spendImport).toContain('name="confirm_replace" value="1"');
    expect(spendImport).toContain("Replace overlapping days");
    expect(spendImport).not.toContain("submitCsvReplaceConfirm");
  });

  it("keeps reviewer smoke copy aligned with the action-oriented save button", () => {
    const reviewer = read("../../../docs/PARTNER_TESTING_INSTRUCTIONS.md");
    expect(reviewer).not.toMatch(/That['’]s \$X per day/i);
    expect(reviewer).toMatch(/Save\s+Billboard \$400 for Aug 26/);
  });

  it("offers honest optional automation without claiming a partnership", () => {
    expect(spendImport).toContain("Want a more automated routine?");
    expect(spendImport).toContain("merchant-paid tool such as SyncWith");
    expect(spendImport).toContain("Mcfly is not partnered");
    expect(spendImport).toContain("Ad APIs and OAuth connections break");
    expect(spendImport).toMatch(/never\s+receives their ad-account tokens/);
  });

  it("does not repeat the no-login manifesto — that lives once on Spend", () => {
    expect(spendImport).not.toContain("Why no ad-account connection?");
  });
});
