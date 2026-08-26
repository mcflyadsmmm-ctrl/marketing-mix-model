import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

const overview = read("../routes/app._index.tsx");
const explorer = read("../components/SpendExplorer.tsx");

describe("Cash left after ads", () => {
  const cash = read("./desk-cash.ts");

  it("Overview shows sales minus spend and never while sales are loading", () => {
    expect(overview).toContain("CASH_LEFT_LABEL");
    expect(overview).toMatch(
      /cashLeftAfterAds\s*=\s*metrics\.salesPending\s*\?\s*null/,
    );
    expect(overview).toContain("totalSalesDisplay - metrics.totalSpend");
  });

  it("the chart repeats it against the same window and per bucket", () => {
    expect(explorer).toContain("CASH_LEFT_LABEL");
    expect(explorer).toContain("explorerReadout");
    expect(explorer).toContain("Shopify sales");
    expect(explorer).toContain("mcfly-explorer__cash-bar");
  });

  it("is never called profit, because Shopify cost per item is not read", () => {
    expect(cash).toContain('CASH_LEFT_LABEL = "Cash left after ads"');
    expect(cash).toContain("canCallItProfit");
    // No surface may nag for a cost the app does not ingest.
    for (const [name, src] of [
      ["overview", overview],
      ["explorer", explorer],
    ] as const) {
      expect(src, name).not.toMatch(/cost per item/i);
      expect(src, name).not.toMatch(/add your cost|enter your cost/i);
    }
  });
});

describe("Goals vs leftover cash", () => {
  it("restates the Total ROAS goal in dollars on Overview", () => {
    expect(overview).toContain("goalVsLeftoverCash");
    expect(overview).toContain("goalVsLeftoverCopy");
    expect(overview).toContain("mcfly-hero-compact__goalcash");
  });
});

describe("Week over week", () => {
  it("the chart can ghost last week on the same plot", () => {
    expect(explorer).toContain("exWow");
    expect(explorer).toContain("priorPeriodLine");
    expect(explorer).toContain("Last week");
  });
});

describe("Mix percent is budget share, not attribution", () => {
  it("Overview labels the channel mix as where money went", () => {
    expect(overview).toContain("not who caused the sale");
    expect(overview).toContain("mixVsPrior");
    expect(overview).toContain("pp");
  });

  it("the chart legend carries mix percent with the same caveat", () => {
    expect(explorer).toContain("explorerMixShares");
    expect(explorer).toContain("mcfly-explorer__ch-mix");
    expect(explorer).toMatch(/not who caused\s+the sale/);
  });

  it("neither surface assigns sales to a channel", () => {
    for (const [name, src] of [
      ["overview", overview],
      ["explorer", explorer],
    ] as const) {
      expect(src, name).not.toMatch(/attributed sales|sales by channel/i);
      expect(src, name).not.toMatch(/\bpixel\b|multi[- ]?touch|view[- ]?through/i);
    }
  });
});

describe("New vs returning vs spend", () => {
  it("Overview shows the split beside spend and never blanks it", () => {
    expect(overview).toContain("newVsReturningSplit");
    expect(overview).toContain("New customers");
    expect(overview).toContain("Returning");
    expect(overview).toContain("newVsReturningPendingCopy");
  });

  it("labels the spend as calendar-aligned, not attribution", () => {
    expect(overview).toMatch(/dates aligned, not attribution/);
  });
});

describe("Spend chart mark toggle", () => {
  it("offers stacked bar and line as a URL-driven control", () => {
    expect(explorer).toContain("EXPLORER_MARK_OPTIONS");
    expect(explorer).toContain("exMark");
    for (const route of ["../routes/app._index.tsx", "../routes/app.spend.tsx"]) {
      const src = read(route);
      expect(src, route).toContain("parseExplorerMark");
      expect(src, route).toContain("mark: exMark");
    }
  });

  it("routes default the grain to the range and leave the sales line on", () => {
    for (const route of ["../routes/app._index.tsx", "../routes/app.spend.tsx"]) {
      const src = read(route);
      expect(src, route).toContain("defaultExplorerGranularity(exRange)");
      expect(src, route).toContain("explorerShowSalesDefault");
    }
  });

  it("never writes a raw bucket key into an id", () => {
    expect(explorer).not.toMatch(/explorer-col-\$\{(selected|bucket|col)\.key\}/);
    expect(explorer).toContain("explorer-col-${col.safeId}");
    expect(explorer).toContain("explorerSafeId(selected.key)");
  });
});

describe("Empty Live window", () => {
  it("draws $0 days instead of swapping the plot for a white box", () => {
    expect(explorer).toContain("const hasPlot = allBuckets.length > 0");
    expect(explorer).toContain("mcfly-explorer__hole-tick");
    expect(explorer).toContain("is $0 —");
  });
});
