import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("bare Fly landing (mcflyads.com inner-page feel)", () => {
  const route = read("./route.tsx");
  const css = read("./styles.module.css");

  it("uses paper tokens, not a full-bleed navy parking screen", () => {
    expect(css).toMatch(/--paper-2:\s*#f2f5f8/);
    expect(css).toMatch(/background:\s*var\(--paper-2\)/);
    expect(css).not.toMatch(/background:\s*var\(--navy\)/);
    expect(css).toMatch(/Bricolage Grotesque/);
    expect(css).toMatch(/Figtree/);
    expect(css).toMatch(/--truth-2:\s*#1aa37a/);
  });

  it("leads with Install free / demo like the marketing site", () => {
    expect(route).toContain("Install free");
    expect(route).toContain("Try the demo");
    expect(route).toContain('const SITE = "https://mcflyads.com"');
    expect(route).toContain("${SITE}/support");
    expect(route).toContain("${SITE}/demo");
    expect(route).toContain("${SITE}/product");
    expect(route).not.toContain("Visit product site");
    expect(route).not.toContain("Contact support");
  });

  it("never harvests a shop domain (App Store 2.3.1)", () => {
    expect(route).not.toMatch(/<input\b/i);
    expect(route).not.toMatch(/name=["']shop["']/i);
    expect(route).not.toMatch(/Enter your shop/i);
    expect(route).toMatch(/never ask\s+you to type a store domain/i);
  });
});
