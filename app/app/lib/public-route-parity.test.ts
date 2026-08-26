/**
 * `/demo` used to be a static `site/demo.html` with no Remix route at all:
 * `/demo` answered 200 HTML while `/demo.data` answered a 404 "No route
 * matches URL". A page whose data sibling does not exist is how a client
 * navigation ends up trying to decode something that is not turbo-stream.
 *
 * Static files deliberately shadow the Remix trust pages (see
 * `scripts/serve-with-site.mjs`: missing `site/` files fall through to Remix),
 * so overlap is fine. What is never fine is a React Router `<Link>` pointing
 * at a path no Remix route can serve.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const siteRoot = join(repoRoot, "site");
const routesRoot = join(here, "../routes");

/** Flat-routes file that would serve a public path, if any. */
function remixRouteFor(path: string): string | null {
  const slug = path.replace(/^\//, "");
  if (slug === "") {
    return existsSync(join(routesRoot, "_index")) ? "_index" : null;
  }
  for (const candidate of [`${slug}.tsx`, `${slug}.ts`, slug]) {
    if (existsSync(join(routesRoot, candidate))) return candidate;
  }
  // Flat routes use dots for slashes: /app/spend → app.spend.tsx
  const flat = slug.replace(/\//g, ".");
  for (const candidate of [`${flat}.tsx`, `${flat}.ts`]) {
    if (existsSync(join(routesRoot, candidate))) return candidate;
  }
  return null;
}

/** Static file express.static would serve for a public path, if any. */
function staticFileFor(path: string): string | null {
  const slug = path.replace(/^\//, "");
  for (const candidate of [slug, `${slug}.html`, join(slug, "index.html")]) {
    if (candidate && existsSync(join(siteRoot, candidate))) return candidate;
  }
  return null;
}

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkTsx(full, out);
      continue;
    }
    if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

describe("client navigation targets exist as Remix routes", () => {
  it("no <Link>/navigate points at a path Remix cannot serve", () => {
    const problems: string[] = [];
    const appDir = join(here, "..");
    for (const file of walkTsx(appDir)) {
      const src = readFileSync(file, "utf8");
      const targets = new Set<string>();
      for (const m of src.matchAll(/\bto=\{?"(\/[^"#?]*)"/g)) {
        targets.add(m[1]!);
      }
      for (const m of src.matchAll(/pathname:\s*"(\/[^"#?]*)"/g)) {
        targets.add(m[1]!);
      }
      for (const m of src.matchAll(/\bnavigate\(\s*"(\/[^"#?]*)"/g)) {
        targets.add(m[1]!);
      }
      for (const target of targets) {
        const path = target.replace(/\/$/, "") || "/";
        if (!remixRouteFor(path)) {
          problems.push(`${relative(repoRoot, file)} → <Link to="${path}">`);
        }
      }
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
});

describe("/demo", () => {
  it("is a Remix route, so /demo.data matches the page", () => {
    expect(remixRouteFor("/demo")).toBe("demo.tsx");
    // The stale static page is gone; nothing shadows the route.
    expect(staticFileFor("/demo")).toBeNull();
  });

  it("drops the retired pitch and keeps the locked packaging", () => {
    const demo = readFileSync(join(routesRoot, "demo.tsx"), "utf8");
    expect(demo).not.toMatch(/Northline|SyncWith|Coupler/i);
    expect(demo).not.toMatch(/Ads Manager.comparable/i);
    expect(demo).not.toMatch(/Free vs Pro|Upgrade to Pro|waitlist/i);
    expect(demo).toContain("$39");
    expect(demo).toMatch(/7-day/);
    // The locked desk vocabulary a Sample page has to carry.
    expect(demo).toMatch(/Sample data/);
    expect(demo).toMatch(/Live data/);
    expect(demo).toMatch(/Cash left after ads/i);
    expect(demo).toMatch(/billboard/i);
    expect(demo).toMatch(/\$0/);
  });

  it("does not client-navigate a logged-out visitor into the embedded app", () => {
    // Every control on the real chart is a Link into /app/*, which would send
    // a visitor with no Shopify session through an auth bounce on click.
    const demo = readFileSync(join(routesRoot, "demo.tsx"), "utf8");
    expect(demo).not.toContain("SpendExplorer");
    expect(demo).not.toMatch(/<Link\b/);
  });
});

describe("no linked public path is dead", () => {
  it("every root-relative marketing link is served by something", () => {
    const sources = readdirSync(siteRoot)
      .filter((f) => f.endsWith(".html"))
      .map((f) => join(siteRoot, f));
    sources.push(join(routesRoot, "_index/OriginShell.tsx"));

    const problems: string[] = [];
    for (const file of sources) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/href="(\/[^"#?]*)"/g)) {
        const path = m[1]!.replace(/\/$/, "") || "/";
        if (
          /\.(css|js|png|jpe?g|svg|webp|ico|xml|txt|webmanifest|pdf)$/i.test(
            path,
          )
        ) {
          continue;
        }
        if (path.startsWith("/assets")) continue;
        if (!remixRouteFor(path) && !staticFileFor(path)) {
          problems.push(`${relative(repoRoot, file)} → ${path}`);
        }
      }
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
});
