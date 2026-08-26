import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Sample data | Live data UX", () => {
  it("shot mode still labels Sample data (App Store 1.1.4)", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("shotMode");
    expect(bar).toMatch(/if \(shotMode\)/);
    expect(bar).toContain("mcfly-data-mode--shot");
    expect(bar).toContain("sampleHint");
    const shell = read("../routes/app.tsx");
    expect(shell).toContain("shotMode={shotMode}");
    expect(shell).not.toMatch(/\{!shotMode \? \(/);
    const css = read("../styles/mcfly-desk.css");
    expect(css).toMatch(/mcfly-desk--shot\.mcfly-desk--sample::after/);
    expect(css).toMatch(/content:\s*"SAMPLE DATA"/);
  });

  it("top toggle labels Sample data vs Live data", () => {
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("liveData");
    expect(bar).toContain("sampleData");
    expect(bar).toContain("sampleHint");
    expect(bar).toContain("liveDataHint");
    expect(bar).not.toMatch(/Turn SAMPLE preview OFF/);
    expect(bar).not.toContain("Before App Store review");
    const labels = read("../lib/product-labels.ts");
    expect(labels).toContain('sampleData: "Sample data"');
    expect(labels).toContain('liveData: "Live data"');
  });

  it("Sample data preview uses the data-mode POST, not /app/demo", () => {
    const cta = read("../components/UseSampleCta.tsx");
    expect(cta).toContain('name="intent" value="use-sample"');
    expect(cta).toContain('action="/app/data-mode"');
    expect(cta).not.toContain('href="/app/demo"');
  });

  it("Spend switches Sample to Live when saving spend", () => {
    const spend = read("../routes/app.spend.tsx");
    expect(spend).toMatch(/source:\s*"sample"/);
    expect(spend).toContain("setSampleDeskEnabled(shop.id, false)");
    expect(spend).toContain("Or upload a CSV");
    expect(spend).not.toContain("Upload is paused on Practice");
    expect(spend).not.toContain("Switch to Your store to upload");
  });

  it("data-mode reseeds Sample when noon stamps are missing", () => {
    const dataMode = read("../routes/app.data-mode.tsx");
    expect(dataMode).toContain("sampleDeskNeedsSeed");
    expect(dataMode).toContain("seedThreeYearSampleDesk");
  });

  it("Overview empty states do not send merchants to /app/demo", () => {
    const overview = read("../routes/app._index.tsx");
    expect(overview).not.toContain('href="/app/demo"');
    expect(overview).toContain("Switch to Sample data at the top");
  });

  it("Goals and Advanced preview Sample in place, not /app/demo", () => {
    expect(read("../routes/app.goals.tsx")).not.toContain('href="/app/demo"');
    expect(read("../routes/app.advanced.tsx")).not.toContain('href="/app/demo"');
  });

  it("Settings puts Your plan on the main page and Sample data in More", () => {
    const settings = read("../routes/app.settings.tsx");
    expect(settings).toContain("Your plan");
    expect(settings).toContain("Sample data");
    expect(settings).toContain("More — Sample data and privacy");
    expect(settings).toContain("ProUpgradeButton");
    expect(settings).not.toContain("Practice desk");
  });
});
