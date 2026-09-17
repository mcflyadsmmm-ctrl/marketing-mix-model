/**
 * Progressive Live unpark + commercial ingest policy.
 *
 * SAMPLE freeze (`MCFLY_SAMPLE_ONLY=true|1`) parks Live. That flag is the
 * kill switch. Snowdevil SAMPLE stays forever — this module never deletes
 * the book and never paints SAMPLE as this shop.
 *
 * Stages (`MCFLY_LIVE_STAGE`) after freeze is off:
 *   parked | overview_orders | customers | ltv
 * Freeze off + unset stage → first slice (Overview / Orders), not wide LTV.
 *
 * Commercial ingest is data depth, not a tab feature gate:
 *   unpaid / Shopify trial → {@link LIVE_UNPAID_INGEST_DAYS} closed days
 *   paid $39 → full desk history (Jan-1 × DESK_HISTORY_YEARS_BACK when
 *   `read_all_orders`). Flat $39 is the whole paid LTV book.
 *
 * Sync HARD-law clamp (one-shot + webhook) is not on tip yet — see
 * {@link LIVE_SYNC_LAW_PR_REF}. This file is the stub that PR must honor.
 */

export const LIVE_UNPAID_INGEST_DAYS = 90;

/** Sibling sync PR — one-shot window + webhook OrderFact. Not merged. */
export const LIVE_SYNC_LAW_PR_REF = "cursor/sync-law-oneshot-webhook-6eb3";

export const LIVE_UNPARK_STAGES = [
  "parked",
  "overview_orders",
  "customers",
  "ltv",
] as const;

export type LiveUnparkStage = (typeof LIVE_UNPARK_STAGES)[number];

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

export function parseLiveUnparkStage(
  raw: string | undefined,
): LiveUnparkStage {
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
      return "parked";
  }
}

export function resolveLiveUnparkStage(
  env: NodeJS.ProcessEnv = process.env,
): LiveUnparkStage {
  if (sampleOnlyFreezeOn(env.MCFLY_SAMPLE_ONLY)) return "parked";
  const raw = env.MCFLY_LIVE_STAGE;
  if (!String(raw ?? "").trim()) return "overview_orders";
  return parseLiveUnparkStage(raw);
}

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
  | { kind: "unpaid_slice"; closedDays: typeof LIVE_UNPAID_INGEST_DAYS }
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
  if (input.paid) return { kind: "paid_full" };
  return { kind: "unpaid_slice", closedDays: LIVE_UNPAID_INGEST_DAYS };
}

/** True when OAuth / first-session may enqueue Shopify window jobs. */
export function liveShopifyWindowShouldSchedule(
  policy: LiveIngestPolicy,
): boolean {
  switch (policy.kind) {
    case "none":
      return false;
    case "unpaid_slice":
    case "paid_full":
      return true;
    default: {
      const _never: never = policy;
      return _never;
    }
  }
}

/**
 * Conservative stub: unknown / unpaid shops are not treated as paid-full.
 * The sync PR applies the closed-day clamp; this only decides kick vs skip.
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
