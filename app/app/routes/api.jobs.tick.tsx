import { timingSafeEqual } from "node:crypto";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { runQueueTick } from "../lib/job-runner.server";

/**
 * Ops entrypoint that drains the job queue one tick.
 *
 * The queue worker runs inside the app process rather than as a separate service so
 * it inherits Prisma and the Shopify offline-session clients with no duplicated
 * config. An external scheduler (or `node app/scripts/queue-worker.mjs`) POSTs here
 * on an interval.
 *
 * Auth is a shared ops secret, not an `ApiToken` — a tick spans all shops, and
 * `ApiToken` is deliberately per-shop. Returns 404 while `MCFLY_JOBS_TICK_SECRET`
 * is unset so the endpoint does not exist by default.
 *
 * @see docs/ops/JOB_QUEUE.md
 */

const MAX_JOBS_CEILING = 100;

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authorize(request: Request): Response | null {
  const expected = process.env.MCFLY_JOBS_TICK_SECRET?.trim();
  if (!expected) return notFound();

  const header = request.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  if (!provided || !secretMatches(provided, expected)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function parseMaxJobs(request: Request): number | undefined {
  const raw = new URL(request.url).searchParams.get("maxJobs");
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.min(parsed, MAX_JOBS_CEILING);
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const denied = authorize(request);
  if (denied) return denied;

  try {
    const result = await runQueueTick({ maxJobs: parseMaxJobs(request) });
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "queue_tick_failed";
    console.error(`[queue] tick failed: ${message}`);
    return Response.json(
      { ok: false, error: message.slice(0, 200) },
      { status: 500 },
    );
  }
};

/** GET is not a tick — avoid a crawler or preview draining the queue. */
export const loader = async (_args: LoaderFunctionArgs) => notFound();
