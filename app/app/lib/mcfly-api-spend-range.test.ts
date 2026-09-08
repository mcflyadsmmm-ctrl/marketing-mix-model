import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "mcfly-api.server.ts"), "utf8");
const apiSource = readFileSync(join(here, "shopify-sales-api.server.ts"), "utf8");

describe("v1 MER spend window (shop IANA)", () => {
  it("buildMerResponse uses shop IANA spend bounds matching apiQueryDateRange", () => {
    expect(source).toContain("apiQueryDateRange");
    expect(source).toContain("merApiSpendRange");
    expect(source).toContain("shop.ianaTimezone");
    // Host-local Date(y, m-1, d) was the silent spend/MER drift vs Overview.
    expect(source).not.toMatch(
      /new Date\(\s*[a-zA-Z_]+,\s*[a-zA-Z_]+\s*-\s*1/,
    );
    expect(apiSource).toContain("export function apiQueryDateRange");
  });
});
