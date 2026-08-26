import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Marketing matches the Shopify app (Wave B)", () => {
  const index = read("site/index.html");
  const chrome = read("site/assets/chrome.js");
  const support = read("site/support.html");
  const advanced = read("app/app/routes/app.advanced.tsx");

  it("does not sell year Goals as a free homepage step", () => {
    expect(index).not.toContain("<h3>Goals + Email</h3>");
    expect(index).toContain("<h3>Email Overview (Free)</h3>");
    expect(index).toContain("<h3>Goals + LTV (Pro)</h3>");
  });

  it("names the Shopify chrome Mcfly Analytics and Practice, not Ads/Sample", () => {
    expect(chrome).toContain('aria-label="Mcfly Analytics home"');
    expect(chrome).toContain("brand-name-sub\">Analytics");
    expect(chrome).not.toContain("brand-name-sub\">Ads");
    expect(index).toContain("Practice desk →");
    expect(index).not.toContain("Sample desk →");
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
