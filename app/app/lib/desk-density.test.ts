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

describe("A merchant-named channel is its own series", () => {
  const fill = read("./channel-fill.ts");

  it("Billboard does not fall back to the Other fill", () => {
    expect(fill).toContain("namedExtraFillKey");
    expect(fill).toContain("sliceFillKey");
    // Slug and label must normalize to the same colour.
    expect(fill).toContain("normalizeExtra");
    expect(explorer).toContain("sliceFillKey(channel)");
    expect(explorer).not.toMatch(
      /return "mcfly-explorer__seg--other";/,
    );
  });

  it("Overview colours a named extra the same way the chart does", () => {
    expect(overview).toContain("namedExtraFillKey(entry.customLabel)");
  });

  it("the palette has a fill for every extra slot", () => {
    const css = read("../styles/mcfly-desk.css");
    for (let i = 1; i <= 6; i += 1) {
      expect(css, `--mcfly-extra-${i}`).toContain(`--mcfly-extra-${i}:`);
      expect(css, `seg--extra-${i}`).toContain(
        `.mcfly-explorer__seg--extra-${i}`,
      );
      expect(css, `spend-dot--extra-${i}`).toContain(
        `.mcfly-spend-dot--extra-${i}`,
      );
    }
  });
});

describe("Line hover", () => {
  it("takes the column from the hit rect, never from the selection", () => {
    // Bands are painted under the per-column hit rects and take no pointer
    // events, so a line-mode hover cannot report a guessed column.
    expect(explorer).toContain('pointerEvents="none"');
    expect(explorer).not.toMatch(/bucketKey:\s*activeKey\s*\?\?/);
    expect(explorer).not.toMatch(/const col = model\.columns\[0\]/);
  });
});

describe("Nothing on the desk exceeds shop sales", () => {
  it("every cash view is clamped to the shop's own sales", () => {
    const cash = read("./desk-cash.ts");
    const ltv = read("./contrib-ltv.ts");
    const explorerLib = read("./spend-explorer.ts");
    // The readout floors at 0 and the split scales down to the sales ceiling.
    expect(explorerLib).toContain("the shop's own sales");
    expect(ltv).toContain("ceiling / combined");
    // Goal figures are labelled as a goal, never merged into reported sales.
    expect(cash).toContain("cashLeftAtGoal");
    expect(cash).toContain("salesAtGoal");
  });
});

describe("Sample desk", () => {
  it("ships a named Billboard series so offline spend is visible in Sample", () => {
    const demo = read("./demo-sample-desk.server.ts");
    const sample = read("./sample-desk.server.ts");
    expect(demo).toContain("SAMPLE_BILLBOARD_LABEL");
    expect(demo).toContain("namedExtras");
    expect(sample).toContain("customKey: extra.slug");
    // Named extras live outside spendByChannel, so totals must go through the helper.
    expect(sample).toContain("sampleDayTotalSpend");
    // An older sample without the Billboard row re-seeds rather than staying stale.
    expect(sample).toContain('customKey: { not: "" }');
  });
});

describe("Empty Live window", () => {
  it("draws $0 days instead of swapping the plot for a white box", () => {
    expect(explorer).toContain("const hasPlot = allBuckets.length > 0");
    expect(explorer).toContain("mcfly-explorer__hole-tick");
    expect(explorer).toContain("is $0 —");
  });
});
