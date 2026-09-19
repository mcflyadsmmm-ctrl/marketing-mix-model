import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepo(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const CHARCOAL = ["#0c1219", "#141c26", "#101820", "#161f2a"];

describe("operator desk wells are paper/sky, not marketing charcoal", () => {
  it("locks Admin well tokens to white cards + navy ink + sky accent", () => {
    const css = readRepo("app/app/styles/mcfly-desk.css");
    expect(css).toContain("--mcfly-well-bg: #ffffff");
    expect(css).toContain("--mcfly-well-bg-elev: #f7fbfe");
    expect(css).toContain("--mcfly-well-ink: #0f1720");
    expect(css).toContain("--mcfly-well-mute: #5b6b7c");
    expect(css).toContain("--mcfly-well-accent: #0284c7");
    expect(css).toContain("--mcfly-well-truth: #047857");
    for (const hex of CHARCOAL) {
      expect(css, `desk still has marketing charcoal ${hex}`).not.toContain(hex);
    }
  });

  it("locks homepage live-slice wells to the same operator surface", () => {
    const demo = readRepo("site/assets/demo-desk.css");
    const mcfly = readRepo("site/assets/mcfly/mcfly.css");
    expect(demo).toContain("--dd-well-bg: #ffffff");
    expect(demo).toContain("--dd-well-ink: #0f1720");
    expect(demo).toContain("--dd-well-accent: #0284c7");
    expect(mcfly).toContain("--well-bg: #ffffff");
    expect(mcfly).toContain("--well-ink: #0f1720");
    for (const hex of CHARCOAL) {
      expect(demo, `demo-desk still has ${hex}`).not.toContain(hex);
      expect(mcfly, `mcfly.css still has ${hex}`).not.toContain(hex);
    }
  });

  it("pricing and product desk mocks are not charcoal wells", () => {
    const pricing = readRepo("site/pricing.html");
    const product = readRepo("site/product.html");
    for (const hex of CHARCOAL) {
      expect(pricing, `pricing.html still has ${hex}`).not.toContain(hex);
      expect(product, `product.html still has ${hex}`).not.toContain(hex);
    }
    expect(pricing).not.toMatch(/float-card__v--accent[^}]*#5ee7f0/);
    expect(product).not.toMatch(/float-card__v--accent[^}]*#5ee7f0/);
  });
});
