/**
 * Backfill order for Live ingest.
 * Finish the recent closed-day slice before older history.
 * Within a phase, newest days go first so this month lands before last year.
 * Callers still report the full window gap so the job keeps going after the slice.
 */

export const INGEST_RECENT_CLOSED_DAYS = 90;

/**
 * Missing days to crawl next.
 * `oldestFirstWindow` is the commercial window, oldest day first (closed days only).
 * Returns only the current phase: unfinished days inside the recent slice, or,
 * once that slice is sealed, the older missing days. Newest first.
 */
export function orderMissingIngestDays(
  oldestFirstWindow: readonly string[],
  existing: ReadonlySet<string>,
  recentDays: number = INGEST_RECENT_CLOSED_DAYS,
): string[] {
  const newestFirst = [...oldestFirstWindow].reverse();
  const cap = Math.max(0, Math.floor(recentDays));
  const recentMissing = newestFirst
    .slice(0, cap)
    .filter((day) => !existing.has(day));
  if (recentMissing.length > 0) return recentMissing;
  return newestFirst.slice(cap).filter((day) => !existing.has(day));
}
