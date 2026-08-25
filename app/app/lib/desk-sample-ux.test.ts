import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Sample | Your store UX (no demo theater)", () => {
  it("top toggle labels Sample vs Your store", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("Your store");
    expect(bar).toContain("Practice numbers");
    expect(bar).not.toMatch(/Turn SAMPLE preview OFF/);
    expect(bar).not.toContain("Before App Store review");
  });

  it("Pro upsell previews Sample via data-mode POST, not /app/demo", () => {
    const upsell = read("../components/ProUpsellBlock.tsx");
    expect(upsell).toContain("UseSampleCta");
    expect(upsell).not.toContain('href="/app/demo"');
    const cta = read("../components/UseSampleCta.tsx");
    expect(cta).toContain('name="intent" value="use-sample"');
    expect(cta).toContain('action="/app/data-mode"');
  });

  it("Spend shows sample source when Sample is on and gates CSV upload", () => {
    const spend = read("../routes/app.spend.tsx");
    expect(spend).toMatch(/source:\s*"sample"/);
    expect(spend).toContain("SAMPLE_DESK_IMPORT_BLOCK");
    expect(spend).toContain("Upload is paused on Sample");
    expect(spend).toContain("Step 3 — Upload your CSV");
    expect(spend).toContain("Switch to Your store to upload");
  });

  it("data-mode reseeds Sample when noon stamps are missing", () => {
    const dataMode = read("../routes/app.data-mode.tsx");
    expect(dataMode).toContain("sampleDeskNeedsSeed");
    expect(dataMode).toContain("seedThreeYearSampleDesk");
  });

  it("Overview empty states do not send merchants to /app/demo", () => {
    const overview = read("../routes/app._index.tsx");
    expect(overview).not.toContain('href="/app/demo"');
    expect(overview).toContain("Switch to Sample at the top");
  });

  it("Goals and Advanced preview Sample in place, not /app/demo", () => {
    expect(read("../routes/app.goals.tsx")).not.toContain('href="/app/demo"');
    expect(read("../routes/app.advanced.tsx")).not.toContain('href="/app/demo"');
    expect(read("../routes/app.goals.tsx")).toContain("UseSampleCta");
    expect(read("../routes/app.advanced.tsx")).toContain("UseSampleCta");
  });
});
