import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("public /demo phone Snowdevil Overview", () => {
  const css = readSite("site/assets/demo-desk.css");
  const html = readSite("site/demo.html");
  const mark = "P0 phone / Snowdevil /demo narrow";

  it("ships the phone cache-bust and keeps Snowdevil SAMPLE dollars", () => {
    expect(html).toContain("demo-desk.css?v=20260918v21");
    expect(html).toContain("$68,457");
    expect(html).toContain("$19,023");
    expect(html).toContain("3.60");
    expect(html).toContain("$631");
    expect(html).not.toMatch(/\$98,?500/);
    expect(html).not.toMatch(/>—</);
  });

  it("stacks Snowdevil KPIs at 430px and keeps nav finger-sized", () => {
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
