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
    expect(desk).not.toMatch(/>—</);

    expect(desk).not.toContain("Harbor Home Co");
    expect(desk).not.toContain("Northline Supply");
    expect(desk).not.toMatch(/\$98,?500/);
    expect(desk).not.toMatch(/4\.19×/);
    expect(js).not.toContain("0.00×");
    expect(js).toContain('return "—"');
    expect(html).toMatch(/SAMPLE|not a live merchant/i);
    expect(html).toContain("hosted=1");
  });

  it("sales page hero still is order-book Snowdevil — spend copy stays below the fold", () => {
    const html = readSite("site/index.html");
    const heroStart = html.indexOf('class="ov-still"');
    expect(heroStart).toBeGreaterThan(-1);
    const hero = html.slice(heroStart, heroStart + 2200);
    expect(hero).toMatch(/This month/i);
    expect(hero).toMatch(/vs last year/i);
    expect(hero).toMatch(/Typical order|returning/i);
    expect(hero).toContain("From orders");
    expect(hero).toContain("$68,457");
    expect(hero).not.toMatch(/Total ROAS|Ad spend/i);
    expect(html).not.toContain('data-dd-period="l7d"');
  });

  it("Pages /demo iframes the Fly SAMPLE desk", () => {
    const html = readSite("site/demo.html");
    expect(html).toContain('src="https://mcfly-analytics.fly.dev/demo?hosted=1"');
    expect(html).toContain("demo-live-frame");
    expect(html).toContain('get("tab")');
    expect(html).toContain("/demo/spend");
  });

  it("home price band links to SAMPLE desk without wireframe live-slice bars", () => {
    const html = readSite("site/index.html");
    const redirects = readSite("site/_redirects");
    expect(html).toContain('href="/demo"');
    expect(html).toContain("Open the SAMPLE desk");
    expect(html).not.toContain("/demo?tab=spend");
    expect(html).not.toContain("Spend demo");
    expect(html).not.toContain('href="/demo/spend"');
    expect(redirects).toContain("/demo/spend /demo?tab=spend 301");
  });
});
