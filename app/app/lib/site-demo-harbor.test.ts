import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("public /demo matches Snowdevil Overview religion", () => {
  it("paints Snowdevil SAMPLE dollars — not Northline $98,500 / 4.19× and not all —", () => {
    const html = readSite("site/demo.html");
    const js = readSite("site/assets/demo-desk.js");
    const desk = html + "\n" + js;

    expect(desk).toContain("Snowdevil");
    expect(desk).toMatch(/\$68,?457/);
    expect(desk).toMatch(/\$19,?023/);
    expect(desk).toMatch(/3\.60/);
    expect(html).toContain("$68,457");
    expect(html).not.toMatch(/>—</);

    expect(desk).not.toContain("Harbor Home Co");
    expect(desk).not.toContain("Northline Supply");
    expect(desk).not.toMatch(/\$98,?500/);
    expect(desk).not.toMatch(/4\.19×/);
    expect(js).not.toContain("0.00×");
    expect(js).toContain('return "—"');
    expect(html).toMatch(/Live book only|Live-only/);
    expect(html).toContain("no Sample|Live toggle");
  });

  it("Overview desk still has YoY / Shopify-five — public SAMPLE may lead with spend+sales", () => {
    const html = readSite("site/demo.html");
    expect(html).toMatch(/This month/i);
    expect(html).toMatch(/This quarter|This year/i);
    expect(html).toMatch(/vs last year/i);
    expect(html).toMatch(/Typical order|returning/i);
    const overviewIdx = html.indexOf('data-dd-section="overview"');
    expect(overviewIdx).toBeGreaterThan(0);
    expect(html.indexOf("Total Sales", overviewIdx)).toBeGreaterThan(overviewIdx);
    expect(html).not.toContain('data-dd-period="l7d"');
  });
});
