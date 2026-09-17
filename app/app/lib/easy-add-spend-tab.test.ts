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

  it("keeps the Spend route titled Spend Upload under that nav tab", () => {
    expect(labels).toContain('uploadSpend: "Upload Spend"');
    expect(labels).toContain('setupAddSpend: "Upload Spend"');
    expect(appShell).toContain("DESK_PRIMARY_NAV");
    expect(read("./desk-nav.ts")).toContain('label: "Spend Upload"');
    expect(spend).toContain('heading="Spend Upload"');
    expect(spend).not.toContain("heading={PRODUCT_NOUN.marketingSection}");
    expect(spend).toContain("/app/roas");
    expect(spend).toContain("Same numbers on Total ROAS");
    expect(spend).not.toContain("Same numbers on Overview");
  });

  it("contrasts Shopify Analytics with typed, uploaded, or daily-rate spend, not Ads Manager login", () => {
    expect(spend).toContain('heading="Spend Upload"');
    expect(spend).toContain("/app/roas");
    expect(spend).toContain("Same numbers on Total ROAS");
    expect(spend).toContain(
      "Shopify Analytics shows sales, not a spend ledger. This page records typed, uploaded, or daily-rate spend — not Ads Manager login.",
    );
    expect(spend).toContain("Days with no row have no spend entered");
    expect(spend).not.toContain("<SpendExplorer");
    expect(spend).not.toContain("<DualCloseLine");
    expect(spend).not.toContain("<MarketingSpendRoom");
  });

  it("labels recent rows as typed, uploaded, or daily-rate", () => {
    expect(spend).toContain("spendEntrySourceLabel");
    expect(spend).toContain("Fills empty days through");
    expect(spend).toContain("Typed, uploaded, or already-filled days stay");
    expect(spend).not.toContain("Typed days are corrections");
  });

  it("leads with yesterday’s day card and keeps Backfill off the first fold", () => {
    expect(spend).toContain('id="mcfly-spend-add"');
    expect(spend).toContain('id="mcfly-spend-backfill"');
    expect(spend).toContain("/app/spend/import");
    expect(spend).toContain("SPEND_BACKFILL_DOOR");
    expect(spend).toContain("Yesterday");
    expect(spend).toContain("name=\"spendDate\"");
    expect(spend).toContain("Billboard, radio, agency…");
    expect(spend).not.toContain("Three ways to add spend");
    expect(spend).not.toContain("<h2>Period spend</h2>");
    expect(spend).not.toContain("SpendExportWalkthrough");
    const addAt = spend.indexOf('id="mcfly-spend-add"');
    const backfillAt = spend.indexOf('id="mcfly-spend-backfill"');
    expect(addAt).toBeGreaterThan(-1);
    expect(backfillAt).toBeGreaterThan(addAt);
  });

  it("keeps Spend Upload input-only while retaining the coverage strip", () => {
    expect(spend).toContain("dayCoverage.total");
    expect(spend).toContain("shotMode ? (");
    expect(spend).toContain("<PeriodControl");
    expect(spend).toContain("Your spend is on the desk");
    expect(spend).toContain("Days with no row have no spend entered");
    expect(spend).not.toContain("<SpendExplorer");
    expect(spend).not.toContain("<MarketingSpendRoom");
    expect(spend).not.toContain("<DualCloseLine");
  });

  it("keeps explorer drill-down on Spend when embedded", () => {
    expect(explorer).toContain(
      'basePath?: "/app" | "/app/spend" | "/app/allocation" | "/app/roas"',
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

  it("defaults the yesterday card to continue $X/day and keeps Edit + Delete on recent rows", () => {
    expect(spend).toContain('name="continueDaily"');
    expect(spend).toContain("Continue this $X/day until I change it");
    expect(spend).toContain("shouldContinueDailyAmount");
    expect(spend).toContain("continueDailyCheckedDefault");
    expect(spend).toMatch(/>\s*Edit\s*</);
    expect(spend).toContain('name="intent" value="delete-entry"');
    expect(spend).toContain("Delete");
    const helperAt = spend.indexOf('className="mcfly-spend-helper"');
    const addAt = spend.indexOf('id="mcfly-spend-add"');
    const backfillAt = spend.indexOf('id="mcfly-spend-backfill"');
    expect(helperAt).toBeGreaterThan(-1);
    expect(addAt).toBeGreaterThan(helperAt);
    expect(backfillAt).toBeGreaterThan(addAt);
  });

  it("holds coverage and status back until a day of spend exists", () => {
    expect(spend).toContain("const strangerEmpty =");
    const gated = spend.split("{strangerEmpty ? null : (")[1] ?? "";
    expect(gated).toContain("mcfly-spend-cal");
    expect(gated).toContain("mcfly-spend-lean__status");
  });

  it("hides spend-tool footer links until a day of spend exists", () => {
    const footerAt = spend.lastIndexOf('aria-label="Marketing tools"');
    expect(footerAt).toBeGreaterThan(-1);
    expect(spend.slice(Math.max(0, footerAt - 80), footerAt)).toMatch(
      /entries\.length > 0/,
    );
    expect(spend).toContain('<s-link href="/app/roas">');
    expect(spend).toContain("PRODUCT_NOUN.spendAllocation");
    expect(spend).not.toContain("/app/advanced");
  });

  it("paints Total ROAS, mix, and coverage after a typed day — never a 0.00× empty ratio", () => {
    const snap = read("../components/MarketingSnapSection.tsx");
    expect(spend).toContain("<MarketingSnapSection");
    expect(spend).toContain("strangerEmpty || !metrics ? null");
    expect(spend).toContain("SAMPLE_LEDGER_HANDOFF");
    expect(spend).toContain("spend is never 0×");
    expect(spend).not.toContain("0.00×");
    expect(spend).not.toContain("<SpendExplorer");
    expect(spend).not.toContain("<MarketingSpendRoom");
    expect(spend).not.toContain("<DualCloseLine");
    expect(snap).toContain("PRODUCT_NOUN.totalRoas");
    expect(snap).toContain('id="mcfly-spend-mix"');
    expect(snap).toContain("hasSpend &&");
    expect(snap).toContain("!salesPending");
    expect(snap).toContain(': "—"');
    expect(snap).not.toContain("0.00×");
    expect(snap).not.toMatch(/(?<![.\d])0×/);
  });

  it("says no ad login once, not as a manifesto", () => {
    expect(spend).toContain("Shopify sales are already here");
    expect(spend).toContain("Empty spend");
    expect(spend).toContain("$0");
    expect(spend).toContain("No ad-account login");
    expect(spend).toContain("deleted day stays $0");
    expect(spend).not.toContain("Empty days are not $0");
    expect(spend).not.toContain("Empty spend is $0");
    expect(spend).not.toContain("Ad-platform logins often fail");
    expect(spend).not.toContain("Why no ad-account connection?");
  });
});

describe("Import or backfill", () => {
  const spendImport = read("../routes/app.spend.import.tsx");

  it("sends merchants to Total ROAS after import, without remounting the explorer", () => {
    expect(spendImport).toContain("PRODUCT_NOUN.openTotalRoas");
    expect(spendImport).not.toContain("Open {PRODUCT_NOUN.marketingSection}");
    expect(spendImport).not.toContain("<SpendExplorer");
    expect(spendImport).toContain("Charts live on Total ROAS");
    expect(spendImport).toContain("An active daily rate will not overwrite those days");
  });

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

describe("Total ROAS page", () => {
  it("owns the explorer and formula, not spend entry", () => {
    const roas = read("../routes/app.roas.tsx");
    expect(roas).toContain("<SpendExplorer");
    expect(roas).toContain("<DualCloseLine");
    expect(roas).toContain("<MonthlyPacing");
    expect(roas).toContain("PRODUCT_NOUN.definition");
    expect(roas).toContain("quiet={false}");
    expect(roas).toContain('href="/app/spend"');
    expect(roas).not.toContain("mcfly-spend-add");
    expect(roas).not.toContain("0.00×");
    expect(roas).not.toContain("export const action");
  });

  it("dashes pending sales and pairs the equation only when spend is on file", () => {
    const roas = read("../routes/app.roas.tsx");
    expect(roas).toContain("salesCoverage");
    expect(roas).toContain("NUMBER_HONESTY.salesPending");
    expect(roas).toContain("metrics.salesPending ? \"—\"");
    expect(roas).toContain("formatTotalRoasEquation");
    expect(roas).toContain("!metrics.salesPending");
    expect(roas).not.toContain("0.00×");
  });
});

describe("Goals, CPA, and Allocation honesty", () => {
  it("keeps Goals pace on a certified $0 month instead of a pending shell", () => {
    const goals = read("../routes/app.goals.tsx");
    expect(goals).toContain("salesCoverage: periodSalesCoverage");
    expect(goals).toContain("Still loading — not $0");
    expect(goals).toContain("pace vs your typed plan");
    expect(goals).toContain("Certified $0");
    expect(goals).toContain("<SalesGoalGauges");
    expect(goals).toContain("formatSalesOrDash(row.actual, currency)");
  });

  it("keeps CPA/CAC as dashes without spend and cards once spend exists", () => {
    const cpa = read("../routes/app.cpa.tsx");
    expect(cpa).toContain("hasSpend ? (");
    expect(cpa).toContain("<CpaWindowCards");
    expect(cpa).toContain("<CpaPaybackDesk");
    expect(cpa).toContain("CPA_EMPTY_SPEND");
    expect(cpa).not.toContain("0.00×");
    expect(cpa).not.toContain("<BookFactGrid");
  });

  it("shows Allocation snapshot cards and dashes sales while pending", () => {
    const allocation = read("../routes/app.allocation.tsx");
    expect(allocation).toContain("salesCoverage");
    expect(allocation).toContain("salesPending={metrics.salesPending}");
    expect(allocation).toContain("salesPending ? \"—\"");
    expect(allocation).toContain("mcfly-alloc-v2__snap-grid");
    expect(allocation).not.toMatch(/0×/);
  });
});
