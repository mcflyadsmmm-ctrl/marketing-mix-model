import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Easy Add Spend tab (history + drill-down)", () => {
  const spend = read("../routes/app.spend.tsx");
  const explorer = read("../components/SpendExplorer.tsx");
  const css = read("../styles/mcfly-desk.css");

  it("keeps one-day Add spend above history CSV", () => {
    const addAt = spend.indexOf('id="mcfly-spend-add"');
    const csvAt = spend.indexOf('id="mcfly-spend-csv"');
    expect(addAt).toBeGreaterThan(-1);
    expect(csvAt).toBeGreaterThan(addAt);
  });

  it("does not bury history import in a closed details drawer", () => {
    expect(spend).toContain('id="mcfly-spend-csv"');
    expect(spend).toContain("Fill history");
    expect(spend).not.toMatch(
      /<details[^>]*id="mcfly-spend-csv"/,
    );
    expect(spend).toContain("&span=${span}");
    expect(spend).toContain('historySpanHref("90d")');
    expect(spend).toContain('historySpanHref("12m")');
    expect(spend).toContain("historyFirst");
    expect(spend).toContain("mcfly-spend-lean__stack--history-first");
    expect(spend).not.toContain("<h2>Period spend</h2>");
    expect(spend).not.toContain("CSV spend in three steps");
  });

  it("covers 90 closed days and embeds day/week/month explorer on this tab", () => {
    expect(spend).toContain("const SPEND_COVERAGE_DAYS = 90");
    expect(spend).toContain("exRange") ;
    expect(spend).toContain('parseExplorerRange(url.searchParams.get("exRange") || "90d")');
    expect(spend).toContain("<SpendExplorer");
    expect(spend).toContain('basePath="/app/spend"');
    expect(spend).toContain("compare");
    expect(spend).toContain('variant="spend"');
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

  it("does not nest Upgrade inside the Add spend form", () => {
    const formStart = spend.indexOf(
      '<Form method="post" className="mcfly-spend-add__form"',
    );
    const formEnd = spend.indexOf("</Form>", formStart);
    expect(formStart).toBeGreaterThan(-1);
    expect(spend.slice(formStart, formEnd)).not.toContain("ProUpsellBlock");
  });
});
