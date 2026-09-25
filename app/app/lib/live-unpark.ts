/**
 * Progressive Live unpark + commercial ingest policy.
 *
 * SAMPLE freeze (`MCFLY_SAMPLE_ONLY=true|1`) parks Live. That flag is the
 * kill switch. Snowdevil SAMPLE stays forever — this module never deletes
 * the book and never paints SAMPLE as this shop.
 *
 * Stages (`MCFLY_LIVE_STAGE`) after freeze is off:
 *   parked | overview_orders | customers | ltv
 * Freeze off + unset stage → the whole desk ({@link LIVE_DEFAULT_STAGE}).
 * Parking a rung is an explicit ops act, not what a deploy falls back to:
 * `DESK_FEATURE_BULLETS` sells LTV and payback at $39, so a paid desk that
 * answers "Customers · locked" is the app breaking its own price promise.
 *
 * Commercial ingest is data depth, not a tab feature gate:
 *   trial and paid → the same 24-month order book (Customers and LTV included).
 *   Billing does not withhold history until the first charge. Flat $39.
 *
 * `resolveLiveIngestWindowDays` and `scheduleFirstSessionShopifyWindow`
 * do not pass a shorter unpaid window. One-shot + webhook context:
 * {@link LIVE_SYNC_LAW_PR_REF}.
 */

/** Sibling sync PR — one-shot window + webhook OrderFact. Not merged. */
export const LIVE_SYNC_LAW_PR_REF = "cursor/sync-law-oneshot-webhook-6eb3";

export const LIVE_UNPARK_STAGES = [
  "parked",
  "overview_orders",
  "customers",
  "ltv",
] as const;

export type LiveUnparkStage = (typeof LIVE_UNPARK_STAGES)[number];

/** Live with nothing pinned is the whole desk. Rungs are for staging a rollout. */
export const LIVE_DEFAULT_STAGE: LiveUnparkStage = "ltv";

export type LiveUnparkTab =
  | "overview"
  | "orders"
  | "customers"
  | "growth"
  | "ltv";

export function sampleOnlyFreezeOn(
  raw: string | undefined = process.env.MCFLY_SAMPLE_ONLY,
): boolean {
  return raw === "true" || raw === "1";
}

/** Strict read. Null when the value names no rung — aliases still resolve. */
export function readLiveUnparkStage(
  raw: string | undefined,
): LiveUnparkStage | null {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  switch (value) {
    case "parked":
    case "overview_orders":
    case "customers":
    case "ltv":
      return value;
    case "overview":
    case "orders":
      return "overview_orders";
    default:
      return null;
  }
}

export function parseLiveUnparkStage(
  raw: string | undefined,
): LiveUnparkStage {
  return readLiveUnparkStage(raw) ?? "parked";
}

/** Warn once per process. The value is a Fly secret — log the names, not it. */
let unknownStageWarned = false;

function warnUnknownLiveStage(): void {
  if (unknownStageWarned) return;
  unknownStageWarned = true;
  console.warn(
    `[live] MCFLY_LIVE_STAGE is set to a value that names no rung (expected one of ${LIVE_UNPARK_STAGES.join(
      " | ",
    )}). Serving the whole desk (${LIVE_DEFAULT_STAGE}).`,
  );
}

/**
 * Freeze wins, then an explicit rung, then the whole desk.
 *
 * A stage string nobody can parse used to fall through to `parked`, which
 * turned one operator typo into a dark desk for every paying shop. Parking
 * now requires spelling a rung correctly.
 */
export function resolveLiveUnparkStage(
  env: NodeJS.ProcessEnv = process.env,
): LiveUnparkStage {
  if (sampleOnlyFreezeOn(env.MCFLY_SAMPLE_ONLY)) return "parked";
  const raw = String(env.MCFLY_LIVE_STAGE ?? "").trim();
  if (!raw) return LIVE_DEFAULT_STAGE;
  const stage = readLiveUnparkStage(raw);
  if (stage) return stage;
  warnUnknownLiveStage();
  return LIVE_DEFAULT_STAGE;
}

/**
 * Admin nav and Customers / Growth / LTV loaders honor this
 * (`live-desk-surface.ts`). SAMPLE freeze does not close the Snowdevil book.
 */
export function liveDeskTabAllowed(
  tab: LiveUnparkTab,
  stage: LiveUnparkStage,
): boolean {
  switch (stage) {
    case "parked":
      return false;
    case "overview_orders":
      return tab === "overview" || tab === "orders";
    case "customers":
      return (
        tab === "overview" ||
        tab === "orders" ||
        tab === "customers" ||
        tab === "growth"
      );
    case "ltv":
      return true;
    default: {
      const _never: never = stage;
      return _never;
    }
  }
}

export type LiveIngestPolicy =
  | { kind: "none"; reason: "sample_freeze" | "stage_parked" }
  | { kind: "paid_full" };

export function liveIngestPolicy(input: {
  sampleOnlyFreeze: boolean;
  stage: LiveUnparkStage;
  paid: boolean;
}): LiveIngestPolicy {
  if (input.sampleOnlyFreeze) {
    return { kind: "none", reason: "sample_freeze" };
  }
  if (input.stage === "parked") {
    return { kind: "none", reason: "stage_parked" };
  }
  // `paid` does not change the window. Trial and paid share 24 months.
  void input.paid;
  return { kind: "paid_full" };
}

export type LiveShopifyWindowSchedule =
  | { schedule: false }
  | { schedule: true; closedDays: number | null };

/**
 * Kick vs skip. A scheduled crawl has no shorter day cap — trial and paid
 * keep the Shopify-visible window, and order rows still stop at 24 months.
 */
export function liveShopifyWindowSchedule(
  policy: LiveIngestPolicy,
): LiveShopifyWindowSchedule {
  switch (policy.kind) {
    case "none":
      return { schedule: false };
    case "paid_full":
      return { schedule: true, closedDays: null };
    default: {
      const _never: never = policy;
      return _never;
    }
  }
}

/** True when OAuth / first-session may enqueue Shopify window jobs. */
export function liveShopifyWindowShouldSchedule(
  policy: LiveIngestPolicy,
): boolean {
  return liveShopifyWindowSchedule(policy).schedule;
}

/**
 * Freeze and parked still skip ingest. Trial and paid both schedule the
 * full commercial window. `paid` does not shrink it.
 */
export function liveUnparkIngestPolicyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  options?: { paid?: boolean },
): LiveIngestPolicy {
  return liveIngestPolicy({
    sampleOnlyFreeze: sampleOnlyFreezeOn(env.MCFLY_SAMPLE_ONLY),
    stage: resolveLiveUnparkStage(env),
    paid: Boolean(options?.paid),
  });
}
