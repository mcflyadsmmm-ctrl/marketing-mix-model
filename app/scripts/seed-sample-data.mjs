#!/usr/bin/env node
/**
 * Seed sample spend (and optional settings) for Mcfly Truth MVP demos.
 *
 * Requires DATABASE_URL (e.g. in app/.env):
 *   DATABASE_URL="file:./dev.sqlite"
 *
 * Prefer warehouse demo snapshots when present:
 *   /workspace/data/warehouse/demo-dtc/period_snapshots.json
 *
 * Fallback: inline Meta / Google / Other spend for shop demo-store.myshopify.com.
 *
 * Usage (from repo root or app/):
 *   npm run seed --workspace=app
 *   npm run seed
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const DEMO_SHOP = "demo-store.myshopify.com";
const SNAPSHOT_PATH = resolve(
  appRoot,
  "../data/warehouse/demo-dtc/period_snapshots.json",
);

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is required. Set it in app/.env (e.g. DATABASE_URL=\"file:./dev.sqlite\") then re-run.",
  );
  process.exit(1);
}

const prisma = new PrismaClient();

/** @typedef {"meta"|"google"|"other"} SpendChannel */

/**
 * @typedef {{ channel: SpendChannel, amount: number, periodStart: Date, periodEnd: Date, note: string|null }} SeedSpend
 * @typedef {{ spends: SeedSpend[], marginPct?: number, targetMer?: number }} SeedBundle
 */

/**
 * @returns {SeedBundle|null}
 */
function loadFromSnapshots() {
  if (!existsSync(SNAPSHOT_PATH)) {
    return null;
  }

  const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  /** @type {SeedSpend[]} */
  const spends = [];
  let marginPct;
  let targetMer;

  // Shape A: { mtd, qtd, ytd } warehouse demo (preferred)
  const namedPeriods = ["mtd", "qtd", "ytd"]
    .map((key) => raw[key])
    .filter((row) => row && typeof row === "object");

  // Shape B: array / { periods|snapshots: [] }
  const listPeriods = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.periods)
      ? raw.periods
      : Array.isArray(raw.snapshots)
        ? raw.snapshots
        : [];

  const rows = namedPeriods.length > 0 ? namedPeriods : listPeriods;
  if (rows.length === 0) {
    console.warn("Snapshot file found but empty; using inline fallback.");
    return null;
  }

  for (const row of rows) {
    const start = parseDate(row.period_start ?? row.periodStart ?? row.start);
    const end = parseDate(row.period_end ?? row.periodEnd ?? row.end);
    if (!start || !end) continue;

    if (typeof row.margin_pct === "number") marginPct = row.margin_pct;
    if (typeof row.marginPct === "number") marginPct = row.marginPct;
    if (typeof row.target_mer === "number") targetMer = row.target_mer;
    if (typeof row.targetMer === "number") targetMer = row.targetMer;

    const channels = row.channels ?? row.spend ?? {};
    const pairs = [
      ["meta", channels.meta ?? row.metaSpend ?? row.meta],
      ["google", channels.google ?? row.googleSpend ?? row.google],
      ["other", channels.other ?? row.otherSpend ?? row.other ?? row.manual],
    ];

    for (const [channel, amount] of pairs) {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) continue;
      spends.push({
        channel: /** @type {SpendChannel} */ (channel),
        amount: n,
        periodStart: start,
        periodEnd: end,
        note: `Seeded from warehouse snapshot (${SNAPSHOT_PATH})`,
      });
    }
  }

  if (spends.length === 0) {
    console.warn("Snapshot file had no usable channel spend; using inline fallback.");
    return null;
  }

  return { spends, marginPct, targetMer };
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function parseDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Inline fallback when warehouse snapshots are missing.
 * @returns {SeedBundle}
 */
function inlineFallbackSpend() {
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const periodEnd = now;

  return {
    spends: [
      {
        channel: "meta",
        amount: 12000,
        periodStart,
        periodEnd,
        note: "Seed fallback — Meta Ads Manager total (MTD)",
      },
      {
        channel: "google",
        amount: 6500,
        periodStart,
        periodEnd,
        note: "Seed fallback — Google Ads total (MTD)",
      },
      {
        channel: "other",
        amount: 1500,
        periodStart,
        periodEnd,
        note: "Seed fallback — influencer / CSV other (MTD)",
      },
    ],
    marginPct: 0.35,
    targetMer: 3.0,
  };
}

async function main() {
  const fromFile = loadFromSnapshots();
  const bundle = fromFile ?? inlineFallbackSpend();
  const source = fromFile ? "warehouse snapshots" : "inline fallback";
  const marginPct = bundle.marginPct ?? 0.35;
  const targetMer = bundle.targetMer ?? 3.0;

  console.log(`Seeding shop ${DEMO_SHOP} from ${source}…`);
  console.log(`DATABASE_URL=${process.env.DATABASE_URL}`);

  const shop = await prisma.shop.upsert({
    where: { domain: DEMO_SHOP },
    create: { domain: DEMO_SHOP },
    update: {},
  });

  await prisma.settings.upsert({
    where: { shopId: shop.id },
    create: {
      shopId: shop.id,
      marginPct,
      targetMer,
    },
    update: {
      marginPct,
      targetMer,
    },
  });

  // Replace prior seed notes for a clean demo re-run
  await prisma.spendEntry.deleteMany({
    where: {
      shopId: shop.id,
      OR: [
        { note: { startsWith: "Seeded from warehouse" } },
        { note: { startsWith: "Seed fallback" } },
      ],
    },
  });

  for (const entry of bundle.spends) {
    // Upsert on shopId+channel+customKey+periodStart —
    // re-running the seed updates existing rows instead of hitting the unique index.
    await prisma.spendEntry.upsert({
      where: {
        shopId_channel_customKey_periodStart: {
          shopId: shop.id,
          channel: entry.channel,
          customKey: "",
          periodStart: entry.periodStart,
        },
      },
      create: {
        shopId: shop.id,
        channel: entry.channel,
        customKey: "",
        amount: entry.amount,
        periodStart: entry.periodStart,
        periodEnd: entry.periodEnd,
        note: entry.note,
      },
      update: {
        amount: entry.amount,
        periodEnd: entry.periodEnd,
        note: entry.note,
      },
    });
  }

  console.log(
    `Done. Upserted shop + settings (margin=${marginPct}, targetMer=${targetMer}); inserted ${bundle.spends.length} spend entries.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
