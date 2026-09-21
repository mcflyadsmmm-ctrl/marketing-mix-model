#!/usr/bin/env node
/**
 * Drive the Mcfly Analytics public Snowdevil SAMPLE desk.
 *
 *   node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs doctor
 *   node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive <feature>
 *   node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs cleanup
 *
 * GET only. Does not start Shopify CLI, does not deploy, does not POST.
 * Evidence stays under artifacts/verify-mcfly/. Cleanup removes only the
 * Chrome profile this run created.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../../..");
const origin = (process.env.MCFLY_DEMO_ORIGIN || "https://mcfly-analytics.fly.dev").replace(
  /\/$/,
  "",
);
const evidenceRoot = resolve(
  process.env.MCFLY_EVIDENCE_DIR || join(repoRoot, "artifacts/verify-mcfly"),
);
const statePath = join(evidenceRoot, "current.json");
const chromeBin = process.env.CHROME_PATH || "google-chrome";

const LOCAL_SHOPIFY_SKIP =
  "shopify app dev (npm run dev in app/) needs a Shopify Partner login. app/README.md calls that a human gate. This run does not start it. Drive the public SAMPLE desk at MCFLY_DEMO_ORIGIN/demo.";

const FEATURES = {
  overview: {
    path: "/demo",
    heading: "Overview",
    tab: "Overview",
    must: [
      "Full Snowdevil SAMPLE demo | Mcfly Analytics",
      "SAMPLE Snowdevil · same desk as the Shopify app · not a live client",
      'aria-label="Desk pages"',
      'class="mcfly-ctx__brand">Snowdevil',
      'aria-label="Trust and freshness"',
      ">SAMPLE<",
      'id="mcfly-overview"',
      'aria-label="Typical order, returning $, weekends, typical day"',
      "Shopify Analytics Overview is Total Sales and a returning-customer rate.",
    ],
    chips: ["YoY glance", "Chart", "Mix close", "YoY year"],
  },
  orders: {
    path: "/demo/orders",
    heading: "Orders",
    tab: "Orders",
    must: [
      'heading="Orders"',
      "Typical order vs Shopify",
      'aria-label="Sales clock and intelligence"',
      'aria-label="Weekday and hour"',
      "Shopify Analytics shows the average order.",
    ],
    chips: ["Typical", "Clock", "Timing"],
  },
  customers: {
    path: "/demo/customers",
    heading: "Customers",
    tab: "Customers",
    must: [
      'heading="Customers"',
      'aria-label="Returning dollars vs new"',
      'id="mcfly-returning"',
      "Customer depth below reads SAMPLE Snowdevil order history",
      "Shopify Analytics Customers is a customer list.",
    ],
    chips: ["Returning", "LTV", "Growth", "Depth"],
  },
  growth: {
    path: "/demo/customers?panel=growth",
    heading: "Customers",
    tab: "Customers",
    activeChip: "Growth",
    redirectFrom: "/demo/growth",
    redirectTo: "/demo/customers?panel=growth",
    must: [
      'id="mcfly-growth"',
      'aria-label="Days to a second order"',
      "Shopify Analytics Overview shows a returning-customer rate.",
      "Order history, not an email list.",
    ],
    chips: ["Returning", "LTV", "Growth", "Depth"],
  },
  ltv: {
    path: "/demo/customers?panel=ltv",
    heading: "Customers",
    tab: "Customers",
    activeChip: "LTV",
    redirectFrom: "/demo/ltv",
    redirectTo: "/demo/customers?panel=ltv",
    must: [
      'id="mcfly-ltv"',
      'aria-label="What a new buyer is worth"',
      'aria-label="What new customers spend"',
      "What a new buyer is worth is from SAMPLE Snowdevil orders.",
    ],
    chips: ["Returning", "LTV", "Growth", "Depth"],
  },
  spend: {
    path: "/demo/spend",
    heading: "Spend",
    tab: "Spend",
    must: [
      'heading="Spend"',
      'id="mcfly-roas"',
      'aria-label="Sales, spend, and Total ROAS"',
      "Example spend is on",
      "Read-only SAMPLE ledger.",
      "This demo does not save spend.",
      'id="mcfly-explorer"',
      'id="mcfly-mix"',
      'id="mcfly-cpa"',
      'aria-label="Customer acquisition cost"',
      "Shopify Total Sales ÷ spend you added",
    ],
    chips: ["Total ROAS", "Explorer", "Mix", "CPA", "Add spend"],
    absent: ['id="mcfly-spend-add"'],
  },
  goals: {
    path: "/demo/goals",
    heading: "Goals",
    tab: "Goals",
    rail: false,
    must: [
      'heading="Goals"',
      "Read-only SAMPLE.",
      "This month sales",
      "Break-even Total ROAS",
    ],
    chips: [],
  },
  settings: {
    path: "/demo/settings",
    heading: "Settings",
    tab: "Settings",
    rail: false,
    must: [
      'heading="Settings"',
      "Snowdevil example sales so you can click around.",
      "This public demo",
      "cannot switch to a live shop.",
      "No Sample | Live toggle",
      "7-day trial, then $39/store/month",
    ],
    chips: [],
  },
};

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function runIdNow() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readState() {
  if (!existsSync(statePath)) return null;
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function writeState(next) {
  mkdirSync(evidenceRoot, { recursive: true });
  writeFileSync(statePath, JSON.stringify(next, null, 2));
}

async function request(path, { redirect = "follow" } = {}) {
  const url = `${origin}${path}`;
  const response = await fetch(url, {
    redirect,
    headers: {
      accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      "user-agent": "verify-mcfly",
    },
  });
  const body = await response.text();
  return {
    url,
    status: response.status,
    location: response.headers.get("location"),
    contentType: response.headers.get("content-type"),
    body,
  };
}

function tablist(html) {
  const start = html.indexOf('aria-label="Desk pages"');
  if (start < 0) return "";
  const end = html.indexOf("</nav>", start);
  return end < 0 ? "" : html.slice(start, end);
}

function activeTab(html) {
  const nav = tablist(html);
  const match = nav.match(
    /<a role="tab"[^>]*aria-current="page"[^>]*>([^<]+)<\/a>/,
  );
  return match?.[1] ?? null;
}

function rail(html) {
  const start = html.indexOf('aria-label="On this page"');
  if (start < 0) return "";
  const end = html.indexOf("</nav>", start);
  return end < 0 ? "" : html.slice(start, end);
}

function chipLabels(html) {
  const block = rail(html);
  return [...block.matchAll(/>([^<]+)<\/a>/g)].map((match) => match[1]);
}

function activeChip(html) {
  const block = rail(html);
  const match = block.match(
    /mcfly-desk-panel-rail__chip--on"[^>]*>([^<]+)<\/a>/,
  );
  return match?.[1] ?? null;
}

function pageHeading(html) {
  const match = html.match(/<s-page\b[^>]*\bheading="([^"]*)"/);
  return match?.[1] ?? null;
}

function ariaSnapshot(html) {
  const lines = [];
  const title = html.match(/<title>([^<]*)<\/title>/);
  if (title) lines.push(`title: ${title[1]}`);
  const heading = pageHeading(html);
  if (heading) lines.push(`s-page heading: ${heading}`);
  lines.push(`active tab: ${activeTab(html) ?? "(none)"}`);
  const nav = tablist(html);
  for (const match of nav.matchAll(/<a role="tab"[^>]*>([^<]+)<\/a>/g)) {
    const current = match[0].includes('aria-current="page"') ? " current" : "";
    lines.push(`tab:${current} ${match[1]}`);
  }
  const active = activeChip(html);
  lines.push(`active chip: ${active ?? "(none)"}`);
  for (const label of chipLabels(html)) {
    lines.push(`chip: ${label}${label === active ? " current" : ""}`);
  }
  const labels = new Set();
  for (const match of html.matchAll(/aria-label="([^"]+)"/g)) {
    labels.add(match[1]);
  }
  for (const label of labels) {
    if (/^Sep \d+ \$/.test(label)) continue;
    lines.push(`aria-label: ${label}`);
  }
  const ids = new Set();
  for (const match of html.matchAll(/\bid="(mcfly-[^"]+)"/g)) {
    ids.add(match[1]);
  }
  for (const id of ids) lines.push(`id: ${id}`);
  return `${lines.join("\n")}\n`;
}

function assertFeature(name, html) {
  const feature = FEATURES[name];
  const errors = [];
  if (pageHeading(html) !== feature.heading) {
    errors.push(
      `heading: expected ${feature.heading}, got ${pageHeading(html) ?? "(none)"}`,
    );
  }
  if (activeTab(html) !== feature.tab) {
    errors.push(`tab: expected ${feature.tab}, got ${activeTab(html) ?? "(none)"}`);
  }
  if (feature.activeChip && activeChip(html) !== feature.activeChip) {
    errors.push(
      `chip: expected ${feature.activeChip}, got ${activeChip(html) ?? "(none)"}`,
    );
  }
  if (feature.rail === false && rail(html).includes("mcfly-desk-panel-rail__chip")) {
    errors.push("unexpected On this page chip rail");
  }
  for (const chip of feature.chips) {
    if (!chipLabels(html).includes(chip)) {
      errors.push(`missing chip: ${chip}`);
    }
  }
  for (const needle of feature.must) {
    if (!html.includes(needle)) errors.push(`missing: ${needle}`);
  }
  for (const needle of feature.absent ?? []) {
    if (html.includes(needle)) errors.push(`unexpected: ${needle}`);
  }
  return errors;
}

function evidenceDirFor(runId) {
  return join(evidenceRoot, runId);
}

async function doctor(runId) {
  const dir = evidenceDirFor(runId);
  mkdirSync(dir, { recursive: true });
  const health = await request("/health");
  let healthJson = null;
  try {
    healthJson = JSON.parse(health.body);
  } catch {
    healthJson = null;
  }
  const demo = await request("/demo");
  const admin = await request("/app");
  const demoErrors = [];
  if (health.status !== 200) demoErrors.push(`/health status ${health.status}`);
  if (!healthJson || healthJson.ok !== true) demoErrors.push("/health ok is not true");
  if (healthJson?.service !== "mcfly-analytics") {
    demoErrors.push(`/health service is ${healthJson?.service ?? "(unparsed)"}`);
  }
  if (healthJson?.db !== "up") demoErrors.push(`/health db is ${healthJson?.db ?? "(missing)"}`);
  if (demo.status !== 200) demoErrors.push(`/demo status ${demo.status}`);
  demoErrors.push(...assertFeature("overview", demo.body));
  const adminHasDesk = admin.body.includes('aria-label="Desk pages"');
  const report = {
    ok: demoErrors.length === 0 && !adminHasDesk,
    origin,
    checkedAt: new Date().toISOString(),
    health: {
      status: health.status,
      body: healthJson ?? health.body.slice(0, 500),
    },
    demo: {
      status: demo.status,
      title: demo.body.match(/<title>([^<]*)<\/title>/)?.[1] ?? null,
      activeTab: activeTab(demo.body),
      heading: pageHeading(demo.body),
    },
    adminWithoutSession: {
      status: admin.status,
      hasDeskPages: adminHasDesk,
      note: adminHasDesk
        ? "/app responded with the desk tablist and no Shopify session. Do not drive it from this script."
        : "GET /app without shop, host, or bearer is the recovery shell, not the SAMPLE desk. Drive /demo.",
    },
    localShopifyDev: {
      attempted: false,
      skip: LOCAL_SHOPIFY_SKIP,
    },
    errors: [
      ...demoErrors,
      ...(adminHasDesk
        ? ["/app without a session painted Desk pages; refusing to treat it as SAMPLE"]
        : []),
    ],
  };
  writeFileSync(join(dir, "doctor.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(dir, "overview.http.html"), demo.body);
  writeState({
    runId,
    origin,
    evidenceDir: dir,
    chromeDir: null,
    chromePid: null,
  });
  console.log(JSON.stringify({ ok: report.ok, doctor: join(dir, "doctor.json") }, null, 2));
  if (!report.ok) {
    for (const error of report.errors) console.error(`doctor: ${error}`);
    process.exit(1);
  }
}

function runChrome(url, dir, chromeDir, basename) {
  mkdirSync(chromeDir, { recursive: true });
  const png = join(dir, `${basename}.png`);
  const domPath = join(dir, `${basename}.dom.html`);
  const shot = spawnSync(
    chromeBin,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${chromeDir}`,
      "--window-size=1280,900",
      "--hide-scrollbars",
      "--virtual-time-budget=8000",
      "--timeout=30000",
      `--screenshot=${png}`,
      url,
    ],
    { encoding: "utf8", timeout: 45000 },
  );
  const dumped = spawnSync(
    chromeBin,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${chromeDir}-dom`,
      "--virtual-time-budget=8000",
      "--timeout=30000",
      "--dump-dom",
      url,
    ],
    { encoding: "utf8", timeout: 45000 },
  );
  const dom = dumped.stdout || "";
  if (dom) writeFileSync(domPath, dom);
  return {
    png,
    domPath: dom ? domPath : null,
    screenshotStatus: shot.status,
    screenshotError: (shot.stderr || "").slice(-500),
    dumpStatus: dumped.status,
    dumpError: (dumped.stderr || "").slice(-500),
    dom,
  };
}

async function drive(featureName, runId) {
  const feature = FEATURES[featureName];
  if (!feature) {
    die(
      `unknown feature ${featureName}. Known: ${Object.keys(FEATURES).join(", ")}`,
    );
  }
  const dir = evidenceDirFor(runId);
  mkdirSync(dir, { recursive: true });
  const chromeDir = `/tmp/verify-mcfly-chrome-${runId}`;
  writeState({
    runId,
    origin,
    evidenceDir: dir,
    chromeDir,
    chromePid: null,
  });

  if (feature.redirectFrom) {
    const redirected = await request(feature.redirectFrom, { redirect: "manual" });
    const location = redirected.location || "";
    const redirectOk =
      redirected.status === 302 && location.includes(feature.redirectTo);
    writeFileSync(
      join(dir, `${featureName}.redirect.json`),
      JSON.stringify(
        {
          from: `${origin}${feature.redirectFrom}`,
          status: redirected.status,
          location,
          expect: feature.redirectTo,
          ok: redirectOk,
        },
        null,
        2,
      ),
    );
    if (!redirectOk) {
      die(
        `redirect ${feature.redirectFrom} → ${redirected.status} ${location}, expected 302 ${feature.redirectTo}`,
      );
    }
  }

  const page = await request(feature.path);
  const httpPath = join(dir, `${featureName}.http.html`);
  writeFileSync(httpPath, page.body);
  const errors = [];
  if (page.status !== 200) errors.push(`status ${page.status}`);
  errors.push(...assertFeature(featureName, page.body));
  writeFileSync(join(dir, `${featureName}.aria.txt`), ariaSnapshot(page.body));

  const chrome = runChrome(`${origin}${feature.path}`, dir, chromeDir, featureName);
  if (chrome.dom) {
    const domErrors = assertFeature(featureName, chrome.dom);
    if (domErrors.length) {
      errors.push(...domErrors.map((error) => `dump-dom: ${error}`));
    }
    writeFileSync(join(dir, `${featureName}.dom.aria.txt`), ariaSnapshot(chrome.dom));
  } else {
    errors.push(
      `chrome dump-dom failed status ${chrome.dumpStatus}: ${chrome.dumpError}`,
    );
  }
  if (chrome.screenshotStatus !== 0 || !existsSync(chrome.png)) {
    errors.push(
      `chrome screenshot failed status ${chrome.screenshotStatus}: ${chrome.screenshotError}`,
    );
  }

  const proof = {
    ok: errors.length === 0,
    feature: featureName,
    url: `${origin}${feature.path}`,
    httpStatus: page.status,
    heading: pageHeading(page.body),
    activeTab: activeTab(page.body),
    activeChip: activeChip(page.body),
    evidence: {
      http: httpPath,
      aria: join(dir, `${featureName}.aria.txt`),
      screenshot: chrome.png,
      dom: chrome.domPath,
    },
    errors,
  };
  writeFileSync(join(dir, `${featureName}.proof.json`), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ ok: proof.ok, proof: join(dir, `${featureName}.proof.json`) }, null, 2));
  if (!proof.ok) {
    for (const error of errors) console.error(`drive: ${error}`);
    process.exit(1);
  }
}

function cleanup() {
  const state = readState();
  if (!state) {
    console.log(JSON.stringify({ ok: true, cleaned: false, reason: "no current.json" }));
    return;
  }
  if (state.chromePid) {
    try {
      process.kill(state.chromePid, "SIGTERM");
    } catch {
      // already exited
    }
  }
  const removed = [];
  for (const dir of [state.chromeDir, state.chromeDir ? `${state.chromeDir}-dom` : null]) {
    if (!dir || !dir.startsWith("/tmp/verify-mcfly-chrome-")) continue;
    rmSync(dir, { recursive: true, force: true });
    removed.push(dir);
  }
  const note = {
    ok: true,
    removedChromeDirs: removed,
    evidenceDir: state.evidenceDir,
    evidenceKept: state.evidenceDir ? existsSync(state.evidenceDir) : false,
  };
  if (state.evidenceDir && existsSync(state.evidenceDir)) {
    writeFileSync(join(state.evidenceDir, "cleanup.json"), JSON.stringify(note, null, 2));
  }
  writeState({ ...state, chromeDir: null, chromePid: null, cleanedAt: note });
  console.log(JSON.stringify(note, null, 2));
}

const [command, featureArg] = process.argv.slice(2);
const runId = process.env.MCFLY_RUN_ID || readState()?.runId || runIdNow();

if (command === "doctor") {
  await doctor(runId);
} else if (command === "drive") {
  if (!featureArg) die("drive requires a feature name");
  await drive(featureArg, runId);
} else if (command === "cleanup") {
  cleanup();
} else {
  die(
    "usage: verify-mcfly.mjs doctor | drive <overview|orders|customers|growth|ltv|spend|goals|settings> | cleanup",
  );
}
