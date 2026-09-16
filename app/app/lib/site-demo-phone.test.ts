import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("public /demo phone Harbor Overview", () => {
  const css = readSite("site/assets/demo-desk.css");
  const html = readSite("site/demo.html");
  const mark = "P0 phone / Harbor /demo narrow";

  it("ships the phone cache-bust and keeps Harbor SAMPLE dollars", () => {
    expect(html).toContain("demo-desk.css?v=20260916phone");
    expect(html).toContain("$82,068");
    expect(html).toContain("$23,414");
    expect(html).toContain("3.51");
    expect(html).not.toMatch(/\$98,?500/);
    expect(html).not.toMatch(/>—</);
  });

  it("stacks Harbor KPIs at 430px and keeps nav finger-sized", () => {
    expect(css.lastIndexOf(mark)).toBeGreaterThan(-1);
    const phone = css.slice(css.lastIndexOf(mark));
    expect(phone).toMatch(/@media \(max-width: 430px\)/);
    expect(phone).toContain(".dd-kpi-grid");
    expect(phone).toMatch(
      /\.dd-kpi-grid[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("min-height: 2.75rem");
    expect(css).toContain(".dd-nav");
  });
});
