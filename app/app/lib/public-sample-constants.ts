/** Client-safe SAMPLE Snowdevil constants. Keep `.server` files off the public demo layout. */
export const PUBLIC_SAMPLE_SHOP_LABEL = "Sample shop";
export const PUBLIC_SAMPLE_CURRENCY = "USD";
export const PUBLIC_SAMPLE_TZ = "UTC";

/** Public `/demo` paints the Snowdevil lock window (1–16 Sep 2026). */
export const PUBLIC_SAMPLE_LOCK_NOW = new Date("2026-09-16T18:00:00.000Z");

/** Sealed with site/demo-desk.js + listing still — do not invent new revenue. */
export const PUBLIC_SAMPLE_OVERVIEW_LOCK = {
  sales: 68_457,
  priorSales: 69_891,
  typicalOrder: 631,
  returningSales: 45_409,
  weekendShare: 0.23,
} as const;
