/**
 * TEMPORARY founder/listing preview — SAMPLE desk feature gate.
 *
 * Flip `SAMPLE_DESK_FEATURE_ENABLED` to `false` to disable SAMPLE everywhere
 * without hunting call sites. Full file rip-out: `docs/SAMPLE_DESK_RIP_OUT.md`.
 *
 * Do not grow SAMPLE logic outside `sample-desk.server.ts`,
 * `demo-sample-desk.server.ts`, and the seed helpers in `order-facts.server.ts`
 * that are clearly marked `source: "sample"`.
 */

/** Master switch. `false` = SAMPLE is dead code-path (safe to delete later). */
export const SAMPLE_DESK_FEATURE_ENABLED = true;

export function sampleDeskFeatureEnabled(): boolean {
  return SAMPLE_DESK_FEATURE_ENABLED === true;
}
