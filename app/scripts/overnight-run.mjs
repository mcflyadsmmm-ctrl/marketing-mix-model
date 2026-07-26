#!/usr/bin/env node
/**
 * Mcfly overnight orchestrator — wires Prisma + connectors + worker.
 * Run from repo root: npm run overnight
 */
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { syncShopSpend } from "@mcfly/connectors";
import {
  computeBreakEvenMer,
  computeMer,
  sumSpend,
} from "@mcfly/mer-engine";
import { suggestAllocation } from "@mcfly/mer-core";
import { formatReportMarkdown, runOvernightOrchestrator } from "@mcfly/worker";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");

const prisma = new PrismaClient();

const CHANNEL_LABELS = {
  meta: "Meta",
  google: "Google",
  other: "Other / Manual",
};

function parseDateRange(from, to) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return {
    start: new Date(fy, fm - 1, fd),
    end: new Date(ty, tm - 1, td, 23, 59, 59, 999),
  };
}

function mapChannel(channel) {
  const n = channel.toLowerCase();
  if (n === "meta" || n === "facebook") return "meta";
  if (n === "google" || n === "google_ads") return "google";
  return "other";
}

function createSpendRepository() {
  return {
    async upsertSpendDays(shopId, rows) {
      let written = 0;
      let skipped = 0;
      for (const row of rows) {
        const channel = mapChannel(row.channel);
        const [y, m, d] = row.date.split("-").map(Number);
        const start = new Date(y, m - 1, d);
        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
        // Must match SpendEntry @@unique([shopId, channel, periodStart]) upsert path.
        const existing = await prisma.spendEntry.findUnique({
          where: {
            shopId_channel_periodStart: { shopId, channel, periodStart: start },
          },
          select: { amount: true },
        });
        if (existing && existing.amount === row.amount) {
          skipped += 1;
          continue;
        }
        await prisma.spendEntry.upsert({
          where: {
            shopId_channel_periodStart: { shopId, channel, periodStart: start },
          },
          create: {
            shopId,
            channel,
            amount: row.amount,
            periodStart: start,
            periodEnd: end,
            note: `sync:${row.source}`,
          },
          update: {
            amount: row.amount,
            periodEnd: end,
            note: `sync:${row.source}`,
          },
        });
        written += 1;
      }
      return { written, skipped };
    },
  };
}

const repository = createSpendRepository();

async function getOrCreateSettings(shopId) {
  return prisma.settings.upsert({
    where: { shopId },
    create: { shopId },
    update: {},
  });
}

async function getSpendByChannel(shopId, range) {
  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: range.end },
      periodEnd: { gte: range.start },
    },
  });
  const totals = { meta: 0, google: 0, other: 0 };
  for (const entry of entries) {
    totals[entry.channel] += entry.amount;
  }
  return (["meta", "google", "other"]).map((channel) => ({
    channel,
    amount: totals[channel],
  }));
}

function buildAllocationResult(spends, sales, totalSpend, breakEvenMer) {
  if (breakEvenMer === null) return null;
  return suggestAllocation({
    channels: spends
      .filter((s) => s.amount > 0)
      .map((s) => ({
        name: CHANNEL_LABELS[s.channel],
        spend: s.amount,
        isManual: s.channel === "other",
      })),
    breakEvenMer,
    totalSales: sales,
    totalSpend,
  });
}

async function runPreflight() {
  const details = [];
  try {
    execSync("npm test", { stdio: "pipe", cwd: repoRoot });
    details.push("npm test passed");
  } catch (err) {
    return {
      passed: false,
      details: [`npm test failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
  try {
    execSync(
      "npm run build --workspace=@mcfly/mer-core && npm run build --workspace=@mcfly/mer-engine && npm run build --workspace=@mcfly/worker",
      { stdio: "pipe", cwd: repoRoot },
    );
    details.push("package builds passed");
  } catch (err) {
    return {
      passed: false,
      details: [`build failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
  return { passed: true, details };
}

const report = await runOvernightOrchestrator({
  listShops: () =>
    prisma.shop.findMany({
      select: { id: true, domain: true },
      orderBy: { createdAt: "asc" },
    }),

  runPreflight,

  syncSpend: async (shopId, from, to) => {
    const result = await syncShopSpend(shopId, from, to, repository, {
      meta: { useMock: process.env.MCFLY_LIVE_META !== "1" },
      google: { useMock: process.env.MCFLY_LIVE_GOOGLE !== "1" },
    });
    return {
      totalRows: result.totalRows,
      metaWritten: result.meta.written,
      googleWritten: result.google.written,
    };
  },

  fetchSales: async (shop, from, to) => {
    // Overnight worker uses last snapshot sales when Shopify session unavailable.
    const range = parseDateRange(from, to);
    const snap = await prisma.merSnapshot.findFirst({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
    });
    if (snap) {
      return { sales: snap.sales, warning: "Using last snapshot sales (no live Shopify fetch in worker)" };
    }
    return { sales: 0, warning: "No sales data — install app on dev store" };
  },

  fetchSpendTotal: async (shopId, from, to) => {
    const spends = await getSpendByChannel(shopId, parseDateRange(from, to));
    return sumSpend(spends);
  },

  fetchPreviousSnapshotSpend: async (shopId, from, to) => {
    const range = parseDateRange(from, to);
    const snap = await prisma.merSnapshot.findUnique({
      where: {
        shopId_periodStart_periodEnd: {
          shopId,
          periodStart: range.start,
          periodEnd: range.end,
        },
      },
    });
    return snap?.spend ?? null;
  },

  writeSnapshot: async (input) => {
    const range = parseDateRange(input.from, input.to);
    await prisma.merSnapshot.upsert({
      where: {
        shopId_periodStart_periodEnd: {
          shopId: input.shopId,
          periodStart: range.start,
          periodEnd: range.end,
        },
      },
      create: {
        shopId: input.shopId,
        periodStart: range.start,
        periodEnd: range.end,
        sales: input.sales,
        spend: input.spend,
        mer: input.mer,
        breakEvenMer: input.breakEvenMer,
        channelMix: input.channelMix,
        allocation: input.allocation,
        reconStatus: input.reconStatus,
        reconDelta: input.reconDelta,
      },
      update: {
        sales: input.sales,
        spend: input.spend,
        mer: input.mer,
        breakEvenMer: input.breakEvenMer,
        channelMix: input.channelMix,
        allocation: input.allocation,
        reconStatus: input.reconStatus,
        reconDelta: input.reconDelta,
      },
    });
  },

  logPhase: async (input) => {
    await prisma.syncRun.create({
      data: {
        runId: input.runId,
        shopId: input.shopId,
        phase: input.phase,
        status: input.status,
        metrics: input.metrics ?? undefined,
        errors: input.errors ?? undefined,
        finishedAt: input.status === "running" ? undefined : new Date(),
      },
    });
  },

  buildAllocation: async ({ shopId, sales, spend, from, to }) => {
    const settings = await getOrCreateSettings(shopId);
    const spends = await getSpendByChannel(shopId, parseDateRange(from, to));
    const breakEvenMer = computeBreakEvenMer(settings.marginPct);
    return buildAllocationResult(spends, sales, spend, breakEvenMer);
  },
});

const reportsDir = join(repoRoot, "reports");
await mkdir(reportsDir, { recursive: true });
const jsonPath = join(reportsDir, `${report.runId}.json`);
const mdPath = join(reportsDir, `${report.runId}.md`);
await writeFile(jsonPath, JSON.stringify(report, null, 2));
await writeFile(mdPath, formatReportMarkdown(report));

console.log(formatReportMarkdown(report));
console.log(`\nWrote ${jsonPath}`);

await prisma.$disconnect();
process.exit(report.ok ? 0 : 1);
