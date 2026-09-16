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
import { NonRetryableJobError, type ClaimedJob } from "./job-worker";

export { BACKFILL_ORDER_FACTS_JOB };

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

  if (result.truncated && job.attempts < job.maxAttempts) {
    return { incomplete: true };
  }
}
