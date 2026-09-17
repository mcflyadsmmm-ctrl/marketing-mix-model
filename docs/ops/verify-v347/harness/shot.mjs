#!/usr/bin/env node
/**
 * Screenshot fixtures with system Chrome (no Shopify Admin session).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fixtures = path.join(root, "fixtures");
const out = root;

const TABS = [
  "overview",
  "orders",
  "customers",
  "growth",
  "ltv",
  "spend",
  "roas",
  "allocation",
  "yoy",
  "cpa",
  "goals",
  "settings",
];

const chrome =
  process.env.CHROME_PATH ||
  ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) =>
    fs.existsSync(p),
  );

if (!chrome) {
  console.error("No Chrome/Chromium found");
  process.exit(1);
}

const priority = ["overview", "customers", "spend"];
const order = [...priority, ...TABS.filter((t) => !priority.includes(t))];

for (const id of order) {
  const html = path.join(fixtures, `${id}.html`);
  const png = path.join(out, `${id}.png`);
  if (!fs.existsSync(html)) {
    console.error("missing", html);
    process.exit(1);
  }
  const url = pathToFileURL(html).href;
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=1280,1600`,
    `--screenshot=${png}`,
    url,
  ];
  const r = spawnSync(chrome, args, { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(id, "failed", r.status, r.stderr?.slice(0, 400));
    process.exit(1);
  }
  const st = fs.statSync(png);
  console.log("SHOT", id, `${(st.size / 1024).toFixed(1)}KB`, png);
}
console.log("all shots ok");
