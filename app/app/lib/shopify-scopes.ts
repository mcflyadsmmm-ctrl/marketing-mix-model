/** Shopify Admin `read_all_orders` — unlocks history beyond the ~60-day window. */
export const READ_ALL_ORDERS_SCOPE = "read_all_orders";

/**
 * Split a Shopify scope string (comma, space, or mixed) into trimmed tokens.
 * Session rows, TOML, and `SCOPES` env all use slightly different separators.
 */
export function parseShopifyScopes(
  scopes: string | string[] | null | undefined,
): string[] {
  if (scopes == null) return [];
  const raw = Array.isArray(scopes) ? scopes : scopes.split(/[\s,]+/);
  return raw.map((s) => s.trim()).filter(Boolean);
}

export function scopesIncludeReadAllOrders(
  scopes: string | string[] | null | undefined,
): boolean {
  return parseShopifyScopes(scopes).includes(READ_ALL_ORDERS_SCOPE);
}

/**
 * Deep Jan-1 × 4yr ingest is allowed when the merchant-granted token includes
 * `read_all_orders`. When granted scopes are unknown, fall back to `SCOPES` env
 * (Partner/Fly config). Fail-closed: neither source has the scope → 60-day window.
 *
 * Token grant wins when provided — Fly `SCOPES` may already list the scope before
 * the shop has re-approved it. Using env alone would walk a 4yr oldest-first
 * window and stall on ACCESS_DENIED days.
 */
export function allowsDeepOrderHistory(options?: {
  envScopes?: string | null;
  grantedScopes?: string | string[] | null;
}): boolean {
  const env = options?.envScopes ?? process.env.SCOPES ?? null;
  if (options && "grantedScopes" in options && options.grantedScopes != null) {
    return scopesIncludeReadAllOrders(options.grantedScopes);
  }
  return scopesIncludeReadAllOrders(env);
}

/**
 * Choose the ingest window: 60-day `read_orders` default, or the Jan-1 × N-year
 * SalesDayFact horizon once `read_all_orders` is granted.
 *
 * When `scopesAllowDeep` is true, ignore a persisted `historyLimited` flag so a
 * past ACCESS_DENIED cannot permanently pin the shop to 60 days after approval.
 */
export function resolveOrderHistoryWindowDays(args: {
  now: Date;
  scopesAllowDeep: boolean;
  persistedHistoryLimited: boolean;
  deepWindowDays: number;
  shallowWindowDays: number;
}): { windowDays: number; historyLimited: boolean; reprobed: boolean } {
  const reprobed = args.scopesAllowDeep && args.persistedHistoryLimited;
  const historyLimited = args.scopesAllowDeep
    ? false
    : args.persistedHistoryLimited;
  const windowDays = historyLimited
    ? args.shallowWindowDays
    : Math.max(args.shallowWindowDays, args.deepWindowDays);
  return { windowDays, historyLimited, reprobed };
}
