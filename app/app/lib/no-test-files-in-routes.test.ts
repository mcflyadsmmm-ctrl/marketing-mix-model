/**
 * Fly v164 crash-looped to its restart cap because a test file lived in
 * `app/routes/`. flatRoutes turned it into a route module, the production
 * server bundle imported Vitest, and `npm run start` exited 1 with
 * "Vitest failed to access its internal state".
 *
 * Two locks: nothing test-shaped in the route directory, and a route config
 * that ignores test files even if something slips in.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const routesRoot = join(appRoot, "routes");
const repoRoot = join(here, "../../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, out);
      continue;
    }
    out.push(full);
  }
  return out;
}

describe("route modules never carry test code into production", () => {
  it("has no test or spec file anywhere under app/routes", () => {
    const offenders = walk(routesRoot)
      .filter((f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f))
      .map((f) => relative(repoRoot, f));
    expect(
      offenders,
      `${offenders.join(", ")}\nThese become route modules and ship to production. Move them to app/app/lib or app/app/components.`,
    ).toEqual([]);
  });

  it("the route config ignores test files as a second lock", () => {
    const config = readFileSync(join(appRoot, "routes.ts"), "utf8");
    expect(config).toContain("ignoredRouteFiles");
    expect(config).toContain("**/*.test.*");
    expect(config).toContain("**/*.spec.*");
  });

  it("no route module imports a test runner", () => {
    const offenders: string[] = [];
    for (const file of walk(routesRoot)) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
      const src = readFileSync(file, "utf8");
      if (/from\s+["'](vitest|@testing-library|jsdom)["']/.test(src)) {
        offenders.push(relative(repoRoot, file));
      }
    }
    expect(offenders, offenders.join(", ")).toEqual([]);
  });
});

/**
 * The build artifact check only runs when a build is present — the ship gate
 * runs tests before `npm run build`, so on a clean tree there is nothing to
 * inspect yet. `scripts/agent-ship-gate.sh` re-checks the fresh bundle after
 * the build, which is the enforcing copy.
 */
describe("production bundle is free of test runtime", () => {
  const serverBuild = join(appRoot, "../build/server/index.js");

  it("carries no vitest import when a build exists", () => {
    let bundle: string;
    try {
      bundle = readFileSync(serverBuild, "utf8");
    } catch {
      return; // No build in this tree; the ship gate covers the fresh one.
    }
    expect(bundle).not.toMatch(/["']vitest["']/);
    expect(bundle).not.toMatch(/Vitest failed to access its internal state/);
  });
});
