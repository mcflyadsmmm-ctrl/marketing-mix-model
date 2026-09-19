#!/usr/bin/env node
/**
 * Capture Snowdevil SAMPLE desk product shots from /demo.
 * Owns: site/assets/product-shots/** (plus this script).
 *
 * Usage:
 *   node site/scripts/capture-demo-product-shots.mjs
 *   DEMO_URL=http://127.0.0.1:8788/demo.html node site/scripts/capture-demo-product-shots.mjs
 *
 * Requires: playwright + chromium. One-time:
 *   npx playwright install chromium
 */
import { createRequire } from "node:module";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(__dirname, "..");
const OUT = path.join(SITE, "assets", "product-shots");
const VIEWPORT = { width: 1440, height: 900 };
const MIN_BYTES = 80 * 1024;
const SAMPLE = { spend: "$19,023", sales: "$68,457", totalRoas: "3.60×", shop: "Snowdevil" };

const SHOTS = [
  {
    file: "01-overview.png",
    nav: "overview",
    align: "start",
    scrollSel: "#dd-desk",
    note: "Overview chrome · YoY cards · Total Sales / typical / returning KPI row",
  },
  {
    file: "02-total-roas.png",
    nav: "overview",
    align: "center",
    scrollSel: ".dd-spend-optional",
    note: "Desk Total ROAS snapshot · $19,023 / $68,457 / 3.60× · BE 2.50×",
  },
  {
    file: "03-goals.png",
    nav: "goals",
    align: "start",
    scrollSel: "#dd-sec-goals",
    note: "Goals tab · this-month sales + optional Total ROAS + break-even",
  },
  {
    file: "04-customers-ltv.png",
    nav: "overview",
    align: "center",
    scrollSel: ".dd-compact[aria-label='Shopify-five peek']",
    note: "Returning dollars KPI + Shopify-five peek · 90-day LTV $890",
  },
];

const HIDE_MARKETING_CSS = `
  .skip,
  [data-chrome],
  header.page-hero,
  .demo-howto,
  .demo-seeing,
  .demo-float-desk,
  .demo-mer-loud,
  [data-footer],
  footer {
    display: none !important;
  }
  html, body.demo-page {
    background: #e8f2fa !important;
    margin: 0 !important;
  }
  main#main {
    padding: 28px 40px 40px !important;
  }
  .demo-stage {
    padding: 0 !important;
    margin: 0 auto !important;
    width: min(1160px, 100%) !important;
  }
  #dd-desk {
    animation: none !important;
  }
`;

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [
    path.resolve(SITE, "..", "node_modules", "playwright"),
    "playwright",
  ];
  for (const id of candidates) {
    try {
      return require(id);
    } catch {
      // try next
    }
  }
  try {
    const { execSync } = await import("node:child_process");
    const root = execSync("npm root -g", { encoding: "utf8" }).trim();
    return require(path.join(root, "playwright"));
  } catch {
    // fall through
  }
  throw new Error(
    "playwright not found. Run: npx --yes playwright install chromium",
  );
}

function candidateUrls() {
  if (process.env.DEMO_URL) return [process.env.DEMO_URL];
  return [
    "http://127.0.0.1:8788/demo.html",
    "http://127.0.0.1:8788/demo",
    "https://mcflyads.com/demo",
  ];
}

async function openDemo(page) {
  let lastErr;
  for (const url of candidateUrls()) {
    try {
      console.log("Navigating", url);
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForSelector("#dd-desk", { timeout: 20000 });
      await page.waitForSelector("#dd-kpi-sales", { timeout: 20000 });
      return url;
    } catch (err) {
      lastErr = err;
      console.warn("  failed", url, String(err.message || err).split("\n")[0]);
    }
  }
  throw lastErr || new Error("Could not open demo");
}

async function hideMarketing(page) {
  await page.addStyleTag({ content: HIDE_MARKETING_CSS });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
}

async function assertSample(page) {
  const sales = ((await page.locator("#dd-kpi-sales").textContent()) || "").trim();
  if (!sales.includes("68,457")) {
    throw new Error(`SAMPLE sales not on desk (got "${sales}"). Abort — no fake shots.`);
  }
}

async function showNav(page, key) {
  const navBtn = page.locator(`[data-dd-nav="${key}"]`);
  if (await navBtn.count()) {
    await navBtn.click();
    await pause(350);
  }
  const sec = page.locator(`[data-dd-section="${key}"]`);
  if (await sec.count()) {
    await sec.waitFor({ state: "visible", timeout: 10000 });
  }
}

async function frameShot(page, shot) {
  const target = page.locator(shot.scrollSel).first();
  await target.waitFor({ state: "visible", timeout: 15000 });
  await page.evaluate(
    ({ sel, align }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.scrollIntoView({ block: align, inline: "nearest" });
      const desk = document.querySelector("#dd-desk");
      if (desk && align === "start") {
        const top = desk.getBoundingClientRect().top + window.scrollY - 28;
        window.scrollTo(0, Math.max(0, top));
      }
    },
    { sel: shot.scrollSel, align: shot.align },
  );
  await pause(280);
}

async function writeReadme(demoUrl, results) {
  const rows = results
    .map(
      (r) =>
        `| \`${r.file}\` | ${(r.bytes / 1024).toFixed(1)} KB | ${r.bytes} | ${r.note} |`,
    )
    .join("\n");
  const md = `# Product shots — Snowdevil SAMPLE desk

Captured from the **real** \`/demo\` desk UI (tables, KPI rows, tab chrome).
Not the marketing float wells on the demo hero.

| | |
|---|---|
| Shop | Snowdevil SAMPLE · not a live client |
| Spend | $19,023 |
| Sales | $68,457 |
| Total ROAS | 3.60× · $68,457 ÷ $19,023 |
| Break-even | 2.50× @ 40% |
| Viewport | 1440×900 CSS · deviceScaleFactor **2** (~2880×1800 PNG) |
| Source | ${demoUrl} |
| Recapture | \`node site/scripts/capture-demo-product-shots.mjs\` (or \`site/scripts/capture-demo-product-shots.sh\`) |

## Files

| File | Size | Bytes | What's in the frame |
|---|---|---|---|
${rows}

Religion: no fake logos, no invented reviews, no live-client claim.
`;
  await writeFile(path.join(OUT, "README.md"), md);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "reduce",
  });

  const demoUrl = await openDemo(page);
  await hideMarketing(page);
  await assertSample(page);

  const results = [];

  for (const shot of SHOTS) {
    await showNav(page, shot.nav);
    await frameShot(page, shot);

    const outPath = path.join(OUT, shot.file);
    await page.screenshot({
      path: outPath,
      type: "png",
      fullPage: false,
      animations: "disabled",
    });

    const st = await stat(outPath);
    if (st.size < MIN_BYTES) {
      await browser.close();
      throw new Error(
        `${shot.file} is ${st.size} bytes (< ${MIN_BYTES}). Capture failed — not a usable product shot.`,
      );
    }
    results.push({ file: shot.file, bytes: st.size, note: shot.note });
    console.log(`wrote ${shot.file} ${st.size} bytes — ${shot.note}`);
  }

  await browser.close();

  const manifest = {
    capturedAt: new Date().toISOString(),
    demoUrl,
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    sample: {
      spend: 19023,
      sales: 68457,
      totalRoas: 3.6,
      breakEven: 2.5,
      shop: "Snowdevil",
      note: "SAMPLE · not a live client",
    },
    minBytes: MIN_BYTES,
    shots: results,
  };
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeReadme(demoUrl, results);
  console.log("Done.", results.length, "shots →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
