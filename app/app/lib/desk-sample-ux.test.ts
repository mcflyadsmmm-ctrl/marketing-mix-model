import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRO_UPSELL } from "./entitlements";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Practice | Your store UX (no demo theater)", () => {
  it("top toggle labels Practice vs Your store", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("yourStore");
    expect(bar).toContain("practiceDesk");
    expect(bar).toContain("practiceHint");
    expect(bar).toContain("yourStoreHint");
    expect(bar).not.toMatch(/Turn SAMPLE preview OFF/);
    expect(bar).not.toContain("Before App Store review");
    const labels = read("../lib/product-labels.ts");
    expect(labels).toContain("Example numbers so you can click around");
    expect(labels).toContain("Practice | Your store");
  });

  it("Pro upsell previews Practice via data-mode POST, not /app/demo", () => {
    const upsell = read("../components/ProUpsellBlock.tsx");
    expect(upsell).toContain("UseSampleCta");
    expect(upsell).toContain("See it on Practice");
    expect(upsell).toContain("<details");
    expect(upsell).not.toContain('href="/app/demo"');
    const cta = read("../components/UseSampleCta.tsx");
    expect(cta).toContain('name="intent" value="use-sample"');
    expect(cta).toContain('action="/app/data-mode"');
  });

  it("Spend shows sample source when Practice is on and gates CSV upload", () => {
    const spend = read("../routes/app.spend.tsx");
    expect(spend).toMatch(/source:\s*"sample"/);
    expect(spend).toContain("SAMPLE_DESK_IMPORT_BLOCK");
    expect(spend).toContain("Upload is paused on Practice");
    expect(spend).toContain("Step 3 — Upload your CSV");
    expect(spend).toContain("Switch to Your store to upload");
    expect(spend).not.toContain("Sample spend is on this page");
  });

  it("data-mode reseeds Sample when noon stamps are missing", () => {
    const dataMode = read("../routes/app.data-mode.tsx");
    expect(dataMode).toContain("sampleDeskNeedsSeed");
    expect(dataMode).toContain("seedThreeYearSampleDesk");
  });

  it("Overview empty states do not send merchants to /app/demo", () => {
    const overview = read("../routes/app._index.tsx");
    expect(overview).not.toContain('href="/app/demo"');
    expect(overview).toContain("Switch to Practice at the top");
  });

  it("Goals and Advanced preview Practice in place, not /app/demo", () => {
    expect(read("../routes/app.goals.tsx")).not.toContain('href="/app/demo"');
    expect(read("../routes/app.advanced.tsx")).not.toContain('href="/app/demo"');
    expect(read("../routes/app.goals.tsx")).toContain("UseSampleCta");
    expect(read("../routes/app.advanced.tsx")).toContain("UseSampleCta");
  });

  it("Settings puts Your plan on the main page and Practice in More", () => {
    const settings = read("../routes/app.settings.tsx");
    expect(settings).toContain("Your plan");
    expect(settings).toContain("Practice desk");
    expect(settings).toContain("More — Practice desk and privacy");
    expect(settings).not.toContain("Sample vs real store");
    expect(settings).not.toContain("More — sample desk, billing, privacy");
  });
});
