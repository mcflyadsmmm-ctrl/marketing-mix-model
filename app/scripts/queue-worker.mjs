#!/usr/bin/env node
/**
 * Mcfly queue worker runner.
 *
 * Polls `POST /api/jobs/tick` on the running app, which drains the Postgres job
 * queue (per-shop concurrency 1). The tick lives in the app process so it reuses
 * Prisma and the Shopify offline-session clients instead of re-deriving auth here.
 *
 *   MCFLY_JOBS_TICK_SECRET=... node app/scripts/queue-worker.mjs
 *
 * Env:
 *   MCFLY_JOBS_TICK_SECRET  required — must match the app's value
 *   MCFLY_APP_URL           app base URL (falls back to SHOPIFY_APP_URL, then localhost)
 *   MCFLY_QUEUE_INTERVAL_MS poll interval (default 15000)
 *   MCFLY_QUEUE_ONCE=1      run a single tick and exit (CI / manual drain)
 *
 * @see docs/ops/JOB_QUEUE.md
 */

const secret = process.env.MCFLY_JOBS_TICK_SECRET?.trim();
if (!secret) {
  console.error(
    "MCFLY_JOBS_TICK_SECRET is required (and must match the app's value).",
  );
  process.exit(1);
}

const baseUrl = (
  process.env.MCFLY_APP_URL ||
  process.env.SHOPIFY_APP_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const intervalMs = Number.parseInt(
  process.env.MCFLY_QUEUE_INTERVAL_MS || "15000",
  10,
);
const once = process.env.MCFLY_QUEUE_ONCE === "1";

let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`Received ${signal} — finishing current tick then exiting.`);
    stopping = true;
  });
}

async function tick() {
  const response = await fetch(`${baseUrl}/api/jobs/tick`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });

  if (response.status === 404) {
    throw new Error(
      "Tick endpoint returned 404 — MCFLY_JOBS_TICK_SECRET is not set on the app.",
    );
  }
  if (!response.ok) {
    throw new Error(`Tick failed: HTTP ${response.status} ${await response.text()}`);
  }
  return response.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let consecutiveErrors = 0;
do {
  try {
    const result = await tick();
    consecutiveErrors = 0;
    if (result.claimed > 0 || result.reclaimed > 0) {
      console.log(
        `tick claimed=${result.claimed} succeeded=${result.succeeded} failed=${result.failed} superseded=${result.superseded} reclaimed=${result.reclaimed} pending=${result.depth?.pending ?? "?"} dead=${result.depth?.dead ?? "?"}`,
      );
    }
  } catch (error) {
    consecutiveErrors += 1;
    console.error(`tick error (${consecutiveErrors}): ${error.message}`);
    // Don't hammer a down app; back off, but keep trying — the queue is durable.
    if (consecutiveErrors >= 10) {
      console.error("10 consecutive tick errors — exiting for the supervisor to restart.");
      process.exit(1);
    }
    await sleep(Math.min(60_000, intervalMs * consecutiveErrors));
    continue;
  }

  if (once || stopping) break;
  await sleep(intervalMs);
} while (!stopping);

console.log("Queue worker stopped.");
