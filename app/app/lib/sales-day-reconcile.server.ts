/**
 * Live Shopify spot-check vs SalesDayFact for recent closed days.
 * On mismatch: enqueue per-day reconcile + refreshExisting backfill.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { enqueueJob } from "./job-queue.server";
import { clearOrderFactDayCompleteSeal } from "./order-facts.server";
import { RECONCILE_SALES_DAY_JOB } from "./order-webhook";
import { enqueueSalesFactsBackfill } from "./sales-backfill-kick.server";
import { getSalesFactRowsByDay } from "./sales-facts.server";
import { fetchShopifySales } from "./shopify-sales.server";
import { fetchShopifyQlSalesByDay } from "./shopifyql-sales.server";
import { shopLocalDayRange } from "./shop-local-day";
import {
  assessSalesDayReconcile,
  selectSalesDayReconcileTargets,
  type SalesDayReconcileAssessment,
} from "./sales-day-reconcile";

/** Keep Sales paint snappy — 3 newest closed days with facts. */
export const SALES_DAY_RECONCILE_SPOT_CHECK_LIMIT = 3;

export async function spotCheckSalesDayFacts(args: {
  shopId: string;
  admin: AdminApiContext;
  timeZone: string;
  expectedClosedDayKeys: string[];
  presentDayKeys: Iterable<string>;
  openDayKey?: string | null;
  range: { start: Date; end: Date };
  grantedScopes?: string | null;
  /** When true, enqueue repair jobs on mismatch. */
  enqueueRepair?: boolean;
  limit?: number;
}): Promise<SalesDayReconcileAssessment> {
  const targets = selectSalesDayReconcileTargets({
    expectedClosedDayKeys: args.expectedClosedDayKeys,
    presentDayKeys: args.presentDayKeys,
    openDayKey: args.openDayKey,
    limit: args.limit ?? SALES_DAY_RECONCILE_SPOT_CHECK_LIMIT,
  });

  if (targets.length === 0) {
    return assessSalesDayReconcile({ facts: [], live: [] });
  }

  const factRows = await getSalesFactRowsByDay(
    args.shopId,
    args.range,
    args.timeZone,
  );

  const facts = targets.flatMap((dayKey) => {
    const row = factRows.get(dayKey);
    if (!row) return [];
    return [
      {
        dayKey,
        sales: row.sales,
        orderCount: row.orderCount,
      },
    ];
  });

  // Prefer ShopifyQL (Admin Analytics grain) so refunds/edits match what
  // merchants see in Shopify — order-created crawls rewrite history the wrong way.
  const live: Array<{ dayKey: string; sales: number; orderCount: number }> = [];
  const newest = targets[0]!;
  const oldest = targets[targets.length - 1]!;
  const qlDays = await fetchShopifyQlSalesByDay(args.admin, {
    sinceDayKey: oldest,
    untilDayKey: newest,
  });
  if (qlDays) {
    for (const dayKey of targets) {
      const row = qlDays.get(dayKey);
      // Missing QL row ≠ live $0 — inventing zeros falsely trips mismatch + reseal.
      if (!row) continue;
      live.push({
        dayKey,
        sales: row.totalSales,
        orderCount: row.orderCount,
      });
    }
  } else {
    for (const dayKey of targets) {
      const dayRange = shopLocalDayRange(dayKey, args.timeZone);
      try {
        const sales = await fetchShopifySales(args.admin, dayRange);
        live.push({
          dayKey,
          sales: sales.totalSales,
          orderCount: sales.orderCount,
        });
      } catch {
        // Fail open on transient Shopify errors — coverage strip still owns holes.
        // Do not invent a mismatch from a failed probe.
        return assessSalesDayReconcile({ facts: [], live: [] });
      }
    }
  }

  const assessment = assessSalesDayReconcile({ facts, live });

  if (args.enqueueRepair && assessment.status === "mismatch") {
    await enqueueSalesDayReconcileRepairs({
      shopId: args.shopId,
      dayKeys: assessment.mismatches.map((m) => m.dayKey),
      grantedScopes: args.grantedScopes,
    });
  }

  return assessment;
}

export async function enqueueSalesDayReconcileRepairs(args: {
  shopId: string;
  dayKeys: string[];
  grantedScopes?: string | null;
  reason?: string;
  /** Default true for mismatch repair; seal skips the shop-wide refresh. */
  refreshExistingBackfill?: boolean;
}): Promise<void> {
  const unique = [...new Set(args.dayKeys)].sort();
  const reason = args.reason ?? "sales_day_spot_check";
  for (const dayKey of unique) {
    await enqueueJob({
      shopId: args.shopId,
      type: RECONCILE_SALES_DAY_JOB,
      dedupeKey: dayKey,
      payload: { day: dayKey, reason },
    });
  }
  const wantBackfill = args.refreshExistingBackfill !== false;
  if (unique.length > 0 && wantBackfill) {
    // Spot-check caught Admin drift (refund/edit). SalesDayFact will rewrite via
    // reconcile + refreshExisting — but OrderFact day seals would otherwise keep
    // stale nets until a webhook. Clear seals so the order crawl re-opens.
    for (const dayKey of unique) {
      await clearOrderFactDayCompleteSeal(args.shopId, dayKey);
    }
    await enqueueSalesFactsBackfill({
      shopId: args.shopId,
      grantedScopes: args.grantedScopes ?? undefined,
      reason: "sales_day_reconcile_mismatch",
      refreshExisting: true,
    });
  }
}

/**
 * Re-arm the newest closed shop-local day so midnight seals cannot sit stale
 * until a refund webhook or a mismatch spot-check. Job dedupe coalesces visits.
 * Does not kick a shop-wide refreshExisting crawl — one day reconcile is enough.
 */
export async function enqueueNewestClosedDaySeal(args: {
  shopId: string;
  expectedClosedDayKeys: string[];
  openDayKey?: string | null;
  grantedScopes?: string | null;
}): Promise<string | null> {
  const open = args.openDayKey ?? null;
  const newest = [...args.expectedClosedDayKeys]
    .filter((k) => k !== open)
    .sort((a, b) => b.localeCompare(a))[0];
  if (!newest) return null;
  await enqueueSalesDayReconcileRepairs({
    shopId: args.shopId,
    dayKeys: [newest],
    grantedScopes: args.grantedScopes,
    reason: "sales_day_seal",
    refreshExistingBackfill: false,
  });
  return newest;
}
