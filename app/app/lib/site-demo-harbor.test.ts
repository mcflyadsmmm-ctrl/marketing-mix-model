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

  it("sales page live Overview slice has YoY / Shopify-five (spend stays off Overview)", () => {
    const html = readSite("site/index.html");
    expect(html).toMatch(/This month/i);
    expect(html).toMatch(/This quarter|This year/i);
    expect(html).toMatch(/vs last year/i);
    expect(html).toMatch(/Typical order|returning/i);
    const overviewIdx = html.indexOf('data-dd-section="overview"');
    expect(overviewIdx).toBeGreaterThan(0);
    expect(html.indexOf("Typical order", overviewIdx)).toBeGreaterThan(overviewIdx);
    expect(html.slice(overviewIdx, overviewIdx + 1800)).not.toMatch(/Total ROAS|Ad spend/i);
    expect(html).not.toContain('data-dd-period="l7d"');
  });

  it("Pages /demo iframes the Fly SAMPLE desk", () => {
    const html = readSite("site/demo.html");
    expect(html).toContain('src="https://mcfly-analytics.fly.dev/demo?hosted=1"');
    expect(html).toContain("demo-live-frame");
    expect(html).toContain('get("tab")');
    expect(html).toContain("/demo/spend");
  });

  it("sales page live slices stay on /demo?tab= so Pages does not 404", () => {
    const html = readSite("site/index.html");
    const redirects = readSite("site/_redirects");
    expect(html).toContain("/demo?tab=spend");
    expect(html).toContain("/demo?tab=roas");
    expect(html).toContain("/demo?tab=goals");
    expect(html).toContain("/demo?tab=yoy");
    expect(html).not.toContain('href="/demo/spend"');
    expect(redirects).toContain("/demo/spend /demo?tab=spend 301");
  });
});
