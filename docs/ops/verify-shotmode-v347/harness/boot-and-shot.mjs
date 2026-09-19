#!/usr/bin/env node
/**
 * verify-shotmode-v347 — shoot REAL tip React desk with ?shot=1 (SAMPLE Snowdevil).
 *
 * Preferred path (Mac): local tip app already on cursor/spend-trust-recurring,
 * SAMPLE parked (MCFLY_SAMPLE_ONLY), Chrome/Playwright against localhost /app/*?shot=1.
 *
 * Fallback: static HTML fixtures under docs/ops/verify-v347/fixtures/ — NOT SoT.
 * Set ALLOW_FIXTURE_FALLBACK=1 to enable. Always bold-disclaimer in SCORECARD.
 *
 * Usage (from repo root on Marty's Mac):
 *   node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs
 *   BASE_URL=http://127.0.0.1:3458 node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs
 *   ALLOW_FIXTURE_FALLBACK=1 node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");
const outDir = path.resolve(__dirname, "..");
const fixtureDir = path.resolve(repoRoot, "docs/ops/verify-v347/fixtures");

const SURFACES = [
  { id: "overview", route: "/app" },
  { id: "orders", route: "/app/orders" },
  { id: "customers", route: "/app/customers" },
  { id: "growth", route: "/app/growth" },
  { id: "ltv", route: "/app/ltv" },
  { id: "goals", route: "/app/goals" },
  { id: "spend", route: "/app/spend" },
  { id: "cpa", route: "/app/cpa" },
  { id: "yoy", route: "/app/yoy" },
  { id: "roas", route: "/app/roas" },
  { id: "allocation", route: "/app/allocation" },
  { id: "settings", route: "/app/settings" },
];

const chrome =
  process.env.CHROME_PATH ||
  [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].find((p) => fs.existsSync(p));

if (!chrome) {
  console.error("No Chrome found. Set CHROME_PATH.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

function waitHttp(url, ms = 120_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on("error", () => {
        if (Date.now() - start > ms) reject(new Error(`timeout waiting for ${url}`));
        else setTimeout(tick, 800);
      });
    };
    tick();
  });
}

function shotUrl(url, png) {
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1280,1600",
    `--screenshot=${png}`,
    url,
  ];
  const r = spawnSync(chrome, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`shot failed ${url}: ${r.stderr?.slice(0, 400)}`);
  }
  const st = fs.statSync(png);
  console.log("SHOT", path.basename(png), `${(st.size / 1024).toFixed(1)}KB`);
}

async function shootLive(baseUrl) {
  const methodPath = path.join(outDir, "METHOD.txt");
  fs.writeFileSync(
    methodPath,
    `method=real-tip-react-shotMode\nbase=${baseUrl}\nshot=1\nsample=Snowdevil\ntime=${new Date().toISOString()}\n`,
  );
  for (const s of SURFACES) {
    const u = new URL(s.route, baseUrl);
    u.searchParams.set("shot", "1");
    u.searchParams.set("period", "mtd");
    const png = path.join(outDir, `${s.id}.png`);
    shotUrl(u.href, png);
  }
}

function shootFixtures() {
  if (process.env.ALLOW_FIXTURE_FALLBACK !== "1") {
    throw new Error(
      "Live tip React base unreachable. Re-run with a BASE_URL serving tip /app/*?shot=1, or set ALLOW_FIXTURE_FALLBACK=1 (NOT SoT).",
    );
  }
  console.warn("WARNING: fixture fallback — NOT craft SoT. Admin tip on Fly remains SoT.");
  fs.writeFileSync(
    path.join(outDir, "METHOD.txt"),
    `method=STATIC-HTML-FIXTURE-FALLBACK\nNOT_SOT=1\ntime=${new Date().toISOString()}\n`,
  );
  for (const s of SURFACES) {
    const html = path.join(fixtureDir, `${s.id}.html`);
    if (!fs.existsSync(html)) throw new Error(`missing fixture ${html}`);
    shotUrl(pathToFileURL(html).href, path.join(outDir, `${s.id}.png`));
  }
}

async function main() {
  const base = process.env.BASE_URL;
  if (base) {
    console.log("Using BASE_URL", base);
    await waitHttp(base).catch(() => null);
    await shootLive(base.replace(/\/$/, "") + "/");
    return;
  }

  // Try common local tip ports
  const candidates = [
    process.env.TIP_URL,
    "http://127.0.0.1:3458",
    "http://127.0.0.1:3000",
    "http://localhost:3458",
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      await waitHttp(c, 3_000);
      console.log("Found tip server at", c);
      await shootLive(c.replace(/\/$/, "") + "/");
      return;
    } catch {
      /* try next */
    }
  }

  // Optional: spawn vite shot mount if present
  const mount = path.join(__dirname, "react-mount", "serve.mjs");
  if (fs.existsSync(mount)) {
    console.log("Starting react-mount fallback (real tip components + SAMPLE props + shotMode)");
    const child = spawn(process.execPath, [mount], {
      cwd: repoRoot,
      env: { ...process.env, PORT: "3460" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    try {
      await waitHttp("http://127.0.0.1:3460/", 60_000);
      await shootLive("http://127.0.0.1:3460/");
    } finally {
      child.kill("SIGTERM");
    }
    return;
  }

  shootFixtures();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
