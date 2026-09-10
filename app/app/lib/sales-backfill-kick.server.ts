import { enqueueJob } from "./job-queue.server";
import { DEEP_HISTORY_BACKFILL_JOB } from "./scopes-update.server";

/**
 * Coalesced SalesDayFact (+ OrderFact) resume for cold / incomplete desks.
 * Same handler as grant-triggered deep history — newest-first + period priority
 * live in `runSalesFactsBackfill`. Dedupe is shop-wide so first-open + ticks
 * re-arm one row instead of stacking.
 */
export const SALES_FACTS_BACKFILL_JOB = DEEP_HISTORY_BACKFILL_JOB;

export const SALES_FACTS_BACKFILL_DEDUPE_KEY = "sales_facts";

/**
 * First Overview paint — fill recent selected-period days before the hero.
 * Cap stays low so MTD paint cannot serial-crawl a fortnight of GraphQL;
 * `enqueueSalesFactsBackfill` resumes the rest on the job tick.
 */
export const FIRST_PAINT_SALES_BACKFILL_DAYS = 7;

export async function enqueueSalesFactsBackfill(args: {
  shopId: string;
  grantedScopes?: string | null;
  reason?: string;
  /** Re-fetch existing fact days (grant / live-probe repair). Tick resume stays missing-only. */
  refreshExisting?: boolean;
}): Promise<void> {
  await enqueueJob({
    shopId: args.shopId,
    type: SALES_FACTS_BACKFILL_JOB,
    dedupeKey: SALES_FACTS_BACKFILL_DEDUPE_KEY,
    payload: {
      reason: args.reason ?? "desk_incomplete",
      grantedScopes: args.grantedScopes ?? "",
      refreshExisting: Boolean(args.refreshExisting),
    },
  });
}

/**
 * Job ticks only drain queued work. Re-arm when this chunk left missing or
 * failed days so a cold shop cannot sit on $0 sales until the next page load.
 * Skip when timezone is unknown — the next auth/desk open retries metadata.
 */
export function salesFactsBackfillShouldContinue(result: {
  remainingMissingDays: number;
  failed: readonly string[];
  skippedReason: "no_timezone" | null;
}): boolean {
  if (result.skippedReason === "no_timezone") return false;
  return result.remainingMissingDays > 0 || result.failed.length > 0;
}
