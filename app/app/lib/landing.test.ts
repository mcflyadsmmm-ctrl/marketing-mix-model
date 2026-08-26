import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("bare Fly landing (mcflyads.com inner-page feel)", () => {
  const route = read("../routes/_index/route.tsx");
  const shell = read("../routes/_index/OriginShell.tsx");
  const css = read("../routes/_index/styles.module.css");

  it("uses paper tokens, not a full-bleed navy parking screen", () => {
    expect(css).toMatch(/--paper-2:\s*#f2f5f8/);
    expect(css).toMatch(/background:\s*var\(--paper-2\)/);
    expect(css).not.toMatch(/background:\s*var\(--navy\)/);
    expect(css).toMatch(/Bricolage Grotesque/);
    expect(css).toMatch(/Figtree/);
    expect(css).toMatch(/--truth-2:\s*#1aa37a/);
  });

  it("states one plan, never a Free tier, and uses on-origin trust URLs", () => {
    expect(route).toContain("How to install");
    // 7-day trial then $39 for the whole desk — no Free plan to install onto.
    expect(route).toContain("7-day free trial");
    expect(route).toContain("$39");
    expect(route).not.toContain("Install free");
    expect(route).not.toMatch(/\bPro adds\b/);
    expect(route).not.toMatch(/Free = every platform/);
    expect(route).toContain('href="/support"');
    expect(route).toContain('href="/pricing"');
    expect(route).toContain('href="/privacy"');
    expect(route).toContain('href="/terms"');
    expect(shell).toContain('href="/support"');
    expect(shell).toContain('href="/privacy"');
    expect(shell).not.toMatch(/until Billing/i);
    expect(route).not.toContain("Visit product site");
    expect(route).not.toContain("Contact support");
    expect(route).not.toContain("https://mcflyads.com/support");
  });

  it("never harvests a shop domain (App Store 2.3.1)", () => {
    expect(route).not.toMatch(/<input\b/i);
    expect(route).not.toMatch(/name=["']shop["']/i);
    expect(route).not.toMatch(/Enter your shop/i);
    expect(route).toMatch(/never ask\s+you to type a store domain/i);
  });

  it("sends embedded Admin entry to /app, not the public landing", () => {
    expect(route).toContain("isShopifyEmbeddedSearch");
    expect(route).toContain('throw redirect(`/app?${url.searchParams.toString()}`)');
  });
});
