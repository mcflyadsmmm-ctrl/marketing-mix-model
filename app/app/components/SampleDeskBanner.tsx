/**
 * Legacy sample strip — superseded by global DataModeBar on every app page.
 * Kept as a no-op so older route imports do not double-banner.
 * Prefer DataModeBar (app layout) for Sample data | Live data.
 */
export function SampleDeskBanner(_props: { note?: string }) {
  return null;
}
