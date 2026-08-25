/**
 * Legacy Practice strip — superseded by global DataModeBar on every app page.
 * Kept as a no-op so older route imports do not double-banner.
 * Prefer DataModeBar (app layout) for Practice | Your store.
 */
export function SampleDeskBanner(_props: { note?: string }) {
  return null;
}
