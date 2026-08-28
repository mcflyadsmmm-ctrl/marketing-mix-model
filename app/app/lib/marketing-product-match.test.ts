import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Marketing matches the Shopify app (one product)", () => {
  const index = read("site/index.html");
  const chrome = read("site/assets/chrome.js");
  const support = read("site/support.html");
  const advanced = read("app/app/routes/app.advanced.tsx");

  it("leads with custom DS they keep and never sells a Free vs Pro split", () => {
    expect(index).toContain("<h1>Custom data science they keep.</h1>");
    expect(index).not.toMatch(/Email Overview \(Free\)/);
    expect(index).not.toMatch(/Goals \+ LTV \(Pro\)/);
    expect(index).not.toMatch(/Free \+ Pro|Free vs Pro/i);
    expect(index).not.toMatch(/Advanced Marketing Data Science/);
  });

  it("names studio chrome Mcfly Ads; Shopify demo stays a quiet wedge", () => {
    expect(chrome).toContain('aria-label="Mcfly Ads"');
    expect(chrome).toContain("brand-name-sub\">Ads");
    expect(chrome).not.toContain('aria-label="Mcfly Analytics home"');
    expect(chrome).not.toContain("brand-name-sub\">Analytics");
    // Desk modes are Sample data | Live data — Practice is retired.
    expect(index).not.toContain("Practice desk →");
    expect(index).toMatch(/Try the demo/i);
    expect(index).toContain('id="app-wedge"');
  });

  it("lists Gmail before invites on the public Support page", () => {
    const gmail = support.indexOf("mcflyadsmmm@gmail.com");
    const invites = support.indexOf("invites@mcflyads.com");
    expect(gmail).toBeGreaterThan(-1);
    expect(invites).toBeGreaterThan(gmail);
  });

  it("tells first-session merchants Advanced is optional after spend", () => {
    expect(advanced).toContain("Optional. Add spend on Spend first");
  });
});
