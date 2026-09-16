/** True when SAMPLE sales + spend exist — enough to paint Overview dollars. */
export function sampleBookIsPaintable(stats: {
  dayCount: number;
  spendCount: number;
}): boolean {
  return stats.dayCount > 0 && stats.spendCount > 0;
}