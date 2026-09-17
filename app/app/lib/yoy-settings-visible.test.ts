import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

/** Merchant chrome only — comments may name a retired OAuth zoo. */
function chrome(rel: string) {
  return read(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const yoy = read("../routes/app.yoy.tsx");
const settings = read("../routes/app.settings.tsx");
const connections = read("../routes/app.connections.tsx");
const connectionsChrome = chrome("../routes/app.connections.tsx");
const dataMode = read("../routes/app.data-mode.tsx");
const advanced = read("../routes/app.advanced.tsx");

describe("YoY is the comparison desk", () => {
  it("names this month vs last month vs last year vs last 7", () => {
    expect(yoy).toMatch(/This month/i);
    expect(yoy).toMatch(/Last month/i);
    expect(yoy).toMatch(/Last year/i);
    expect(yoy).toMatch(/Last 7/);
    expect(yoy).toContain("YOY_ANALYTICS_LEDE");
  });

  it("missing last year is OVERVIEW_YOY_MISSING (~60 days), not $0", () => {
    expect(yoy).toContain("OVERVIEW_YOY_MISSING");
    expect(yoy).toMatch(/id === "lastYear"/);
    expect(yoy).toMatch(/sales == null/);
    expect(yoy).not.toContain("byId.has(\"lastYear\")");
  });

  it("salesPending keeps the comparison grid with — still loading", () => {
    expect(yoy).toContain("salesPending");
    expect(yoy).toContain("OVERVIEW_YOY_PENDING");
    expect(yoy).toContain("still loading");
    expect(yoy).toContain("mcfly-yoy__grid");
    expect(yoy).not.toMatch(/if \(salesPending\) return null/);
  });
});

describe("Settings Sample | Live", () => {
  it("still has Sample and Live as the view switch", () => {
    expect(settings).toContain("Sample | Live");
    expect(settings).toContain("Sample data");
    expect(settings).toContain("Live data");
    expect(settings).toContain("SAMPLE dollars do not transfer");
    expect(settings).toContain('name="intent" value="use-sample"');
    expect(settings).toContain('name="intent" value="use-real"');
  });

  it("hides Live CTAs while the Sample-only freeze is on", () => {
    expect(settings).toContain("Live is parked until launch");
    expect(settings).toContain("sampleOnlyFreeze");
    expect(settings).toContain("Snowdevil");
    expect(settings).toMatch(/!sampleOnlyFreeze/);
    expect(settings).toContain('sampleOnlyFreeze ? "Sample data" : "Sample | Live"');
    expect(settings).not.toContain("Harbor");
  });

  it("keeps margin optional and 7-day then $39 billing", () => {
    expect(settings).toMatch(/margin optional/i);
    expect(settings).toMatch(/7-day/);
    expect(settings).toMatch(/\$39/);
  });
});

describe("Connections has no Meta OAuth", () => {
  it("says no ad accounts to connect and spend is typed/CSV", () => {
    expect(connectionsChrome).toMatch(/no ad accounts to connect/i);
    expect(connectionsChrome).toMatch(/typed or CSV/i);
    expect(connectionsChrome).not.toMatch(/oauth/i);
    expect(connectionsChrome).not.toMatch(/\bConnect Meta\b|\bConnect Google\b/i);
    expect(connectionsChrome).not.toMatch(/oauth\/authorize/i);
    expect(connections).toMatch(/RETIRED/);
    expect(connections).toContain('redirect("/app/spend")');
    expect(connections).toContain("requireAdmin");
  });
});

describe("Data-mode is not a second Sample | Live door", () => {
  it("GET redirects to Settings; POST keeps Sample data | Live data intents", () => {
    expect(dataMode).toContain('redirect(`/app/settings${url.search}`)');
    expect(dataMode).toContain("Sample data | Live data");
    expect(dataMode).toContain("applySampleDeskIntent");
    expect(dataMode).toContain("export default function DataModeRoute");
  });
});

describe("Advanced is order-depth extras, not empty theater", () => {
  it("keeps real order stats and points at Orders, with no stacked-bar fake", () => {
    expect(advanced).toContain("no spend upload");
    expect(advanced).toContain("/app/orders");
    expect(advanced).toContain("salesPending");
    expect(advanced).toMatch(/No stacked-bar theater/);
    expect(advanced).not.toContain("<canvas");
    expect(advanced).not.toContain("attribution");
  });
});
