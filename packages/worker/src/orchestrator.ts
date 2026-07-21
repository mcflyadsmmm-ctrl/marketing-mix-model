import { computeBreakEvenMer, computeMer } from "@mcfly/mer-engine";
import type {
  OrchestratorDeps,
  OrchestratorOptions,
  OrchestratorPhase,
  OrchestratorReport,
  PhaseResult,
  PhaseStatus,
} from "./types.js";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function newRunId(now: Date): string {
  return `overnight_${now.toISOString().replace(/[:.]/g, "-")}`;
}

async function runPhase(
  deps: OrchestratorDeps,
  runId: string,
  phase: OrchestratorPhase,
  shopId: string | undefined,
  fn: () => Promise<Record<string, unknown>>,
): Promise<PhaseResult> {
  const startedAt = new Date();
  await deps.logPhase({
    runId,
    shopId,
    phase,
    status: "running",
  });

  try {
    const metrics = await fn();
    const finishedAt = new Date();
    const result: PhaseResult = {
      phase,
      status: "success",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      metrics,
    };
    await deps.logPhase({
      runId,
      shopId,
      phase,
      status: "success",
      metrics,
    });
    return result;
  } catch (err) {
    const finishedAt = new Date();
    const errors = [err instanceof Error ? err.message : String(err)];
    const result: PhaseResult = {
      phase,
      status: "failed",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      errors,
    };
    await deps.logPhase({
      runId,
      shopId,
      phase,
      status: "failed",
      errors,
    });
    return result;
  }
}

/**
 * Enterprise overnight loop:
 * preflight → per-shop sync → recon → snapshot → allocate → report.
 * Designed to run unattended via cron, Railway, GitHub Actions, or Cursor Automation.
 */
export async function runOvernightOrchestrator(
  deps: OrchestratorDeps,
  options: OrchestratorOptions = {},
): Promise<OrchestratorReport> {
  const now = deps.now?.() ?? new Date();
  const runId = newRunId(now);
  const runStarted = new Date();
  const phases: PhaseResult[] = [];

  const lookbackDays = options.lookbackDays ?? 14;
  const reconThreshold = options.reconThreshold ?? 0.05;
  const maxShops = options.maxShops ?? 50;

  const toDate = options.toDate ?? isoDate(addDays(now, -1));
  const to = new Date(`${toDate}T12:00:00Z`);
  const fromDate = isoDate(addDays(to, -(lookbackDays - 1)));

  const killCriteria = {
    reconBreaches: 0,
    belowBreakEven: 0,
    noAllocationWhenSpend: 0,
  };

  const shopResults: OrchestratorReport["shops"] = [];

  const preflight = await runPhase(deps, runId, "preflight", undefined, async () => {
    const result = await deps.runPreflight();
    if (!result.passed) {
      throw new Error(result.details.join("; "));
    }
    return { checks: result.details.length };
  });
  phases.push(preflight);
  if (preflight.status === "failed") {
    return finalize(runId, runStarted, phases, shopResults, killCriteria, false);
  }

  const shops = (await deps.listShops()).slice(0, maxShops);

  for (const shop of shops) {
    const warnings: string[] = [];
    let sales = 0;
    let spend = 0;
    let mer: number | null = null;
    let reconStatus = "ok";
    let reconDelta: number | null = null;
    let allocationActions = 0;
    let breakEvenMer = 0;
    let channelMix: unknown = [];
    let allocation: unknown | null = null;

    const syncPhase = await runPhase(deps, runId, "sync", shop.id, async () => {
      const sync = await deps.syncSpend(shop.id, fromDate, toDate);
      return {
        totalRows: sync.totalRows,
        metaWritten: sync.metaWritten,
        googleWritten: sync.googleWritten,
      };
    });
    phases.push(syncPhase);

    const salesResult = await deps.fetchSales(shop, fromDate, toDate);
    sales = salesResult.sales;
    if (salesResult.warning) warnings.push(salesResult.warning);

    spend = await deps.fetchSpendTotal(shop.id, fromDate, toDate);
    mer = computeMer(sales, spend);

    const reconPhase = await runPhase(deps, runId, "recon", shop.id, async () => {
      const previous = await deps.fetchPreviousSnapshotSpend(shop.id, fromDate, toDate);
      if (previous === null || previous === 0) {
        reconStatus = "baseline";
        return { previous: null, current: spend };
      }
      reconDelta = Math.abs(spend - previous) / previous;
      if (reconDelta > reconThreshold) {
        reconStatus = "breach";
        killCriteria.reconBreaches += 1;
      }
      return { previous, current: spend, reconDelta };
    });
    phases.push(reconPhase);

    const snapshotPhase = await runPhase(deps, runId, "snapshot", shop.id, async () => {
      allocation = await deps.buildAllocation({
        shopId: shop.id,
        sales,
        spend,
        from: fromDate,
        to: toDate,
      });

      if (allocation && typeof allocation === "object" && "actions" in allocation) {
        const actions = (allocation as { actions: unknown[] }).actions;
        allocationActions = Array.isArray(actions) ? actions.length : 0;
        if (spend > 0 && allocationActions === 0) {
          killCriteria.noAllocationWhenSpend += 1;
        }
      }

      if (allocation && typeof allocation === "object" && "breakEvenMer" in allocation) {
        breakEvenMer = Number((allocation as { breakEvenMer: number }).breakEvenMer) || 0;
        const isAbove = (allocation as { isAboveBreakEven?: boolean | null }).isAboveBreakEven;
        if (isAbove === false) killCriteria.belowBreakEven += 1;
      }

      if (allocation && typeof allocation === "object" && "inputs" in allocation) {
        const inputs = (allocation as { inputs: { channelEfficiencies?: unknown } }).inputs;
        channelMix = inputs.channelEfficiencies ?? [];
      }

      await deps.writeSnapshot({
        shopId: shop.id,
        from: fromDate,
        to: toDate,
        sales,
        spend,
        mer,
        breakEvenMer,
        channelMix,
        allocation,
        reconStatus,
        reconDelta,
      });

      return { sales, spend, mer, reconStatus };
    });
    phases.push(snapshotPhase);

    await runPhase(deps, runId, "allocate", shop.id, async () => ({
      actions: allocationActions,
    }));

    shopResults.push({
      shopId: shop.id,
      domain: shop.domain,
      sales,
      spend,
      mer,
      reconStatus,
      reconDelta,
      allocationActions,
      warnings,
    });
  }

  const reportPhase = await runPhase(deps, runId, "report", undefined, async () => ({
    shops: shopResults.length,
    killCriteria,
  }));
  phases.push(reportPhase);

  const ok =
    preflight.status === "success" &&
    killCriteria.reconBreaches === 0 &&
    reportPhase.status === "success";

  return finalize(runId, runStarted, phases, shopResults, killCriteria, ok);
}

function finalize(
  runId: string,
  runStarted: Date,
  phases: PhaseResult[],
  shops: OrchestratorReport["shops"],
  killCriteria: OrchestratorReport["killCriteria"],
  ok: boolean,
): OrchestratorReport {
  const finishedAt = new Date();
  return {
    runId,
    startedAt: runStarted.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - runStarted.getTime(),
    phases,
    shops,
    killCriteria,
    ok,
  };
}

export function formatReportMarkdown(report: OrchestratorReport): string {
  const lines = [
    `# Mcfly overnight report`,
    ``,
    `- **Run ID:** ${report.runId}`,
    `- **Started:** ${report.startedAt}`,
    `- **Finished:** ${report.finishedAt}`,
    `- **Duration:** ${Math.round(report.durationMs / 1000)}s`,
    `- **Status:** ${report.ok ? "✅ OK" : "❌ ATTENTION"}`,
    ``,
    `## Kill criteria`,
    `- Recon breaches (>${(0.05 * 100).toFixed(0)}%): ${report.killCriteria.reconBreaches}`,
    `- Below break-even shops: ${report.killCriteria.belowBreakEven}`,
    `- Spend but no allocation: ${report.killCriteria.noAllocationWhenSpend}`,
    ``,
    `## Shops (${report.shops.length})`,
  ];

  for (const shop of report.shops) {
    lines.push(
      `### ${shop.domain}`,
      `- Sales: $${shop.sales.toFixed(0)} · Spend: $${shop.spend.toFixed(0)} · MER: ${shop.mer?.toFixed(2) ?? "—"}`,
      `- Recon: ${shop.reconStatus}${shop.reconDelta != null ? ` (${(shop.reconDelta * 100).toFixed(1)}%)` : ""}`,
      `- Allocation actions: ${shop.allocationActions}`,
    );
    if (shop.warnings.length) {
      lines.push(`- Warnings: ${shop.warnings.join("; ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
