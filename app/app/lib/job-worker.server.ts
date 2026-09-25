/**
 * Production OrderFact backfill handler — IO lives here so `job-worker.ts`
 * stays Prisma/Shopify-free. Register on `JOB_HANDLERS` in `job-runner.server.ts`.
 */
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import {
  BACKFILL_ORDER_FACTS_JOB,
  runOrderFactsBackfill,
} from "./order-facts.server";
import {
  BACKFILL_SALES_DAY_FACTS_JOB,
  runSalesFactsBackfill,
} from "./sales-facts.server";
import {
  orderFactsWindowShouldResume,
  salesDayFactsWindowShouldResume,
} from "./first-session-shopify-window.server";
import { NonRetryableJobError, type ClaimedJob } from "./job-worker";
import { recomputeDeskMetricSnapshot } from "./desk-metric-snapshot.server";

export { BACKFILL_ORDER_FACTS_JOB, BACKFILL_SALES_DAY_FACTS_JOB };

export async function handleBackfillOrderFacts(
  job: ClaimedJob,
): Promise<{ incomplete: true } | void> {
  const shop = await prisma.shop.findUnique({
    where: { id: job.shopId },
    select: { domain: true },
  });
  if (!shop) {
    throw new NonRetryableJobError(`Shop ${job.shopId} no longer exists`);
  }

  const { admin } = await unauthenticated.admin(shop.domain);
  const result = await runOrderFactsBackfill(admin, job.shopId, {
    enqueueRetry: false,
  });
  try {
    await recomputeDeskMetricSnapshot(job.shopId);
  } catch (error) {
    console.error(
      `[queue] desk metrics snapshot failed shopId=${job.shopId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (
    orderFactsWindowShouldResume(result) &&
    job.attempts < job.maxAttempts
  ) {
    return { incomplete: true };
  }
}

export async function handleBackfillSalesDayFacts(
  job: ClaimedJob,
): Promise<{ incomplete: true } | void> {
  const shop = await prisma.shop.findUnique({
    where: { id: job.shopId },
    select: { domain: true },
  });
  if (!shop) {
    throw new NonRetryableJobError(`Shop ${job.shopId} no longer exists`);
  }

  const { admin } = await unauthenticated.admin(shop.domain);
  const result = await runSalesFactsBackfill(admin, job.shopId);
  if (
    salesDayFactsWindowShouldResume(result) &&
    job.attempts < job.maxAttempts
  ) {
    return { incomplete: true };
  }
}
