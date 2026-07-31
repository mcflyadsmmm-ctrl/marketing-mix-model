/**
 * Feature flag for Phase 2 Meta/Google connected spend scaffold.
 * Prefer env for local/App Review scaffolding — Settings toggle optional later.
 *
 * Enable scaffold UI: MCFLY_SPEND_OAUTH=1
 * Optional mock sync without real OAuth: MCFLY_SPEND_OAUTH_MOCK=1
 * Shop allowlist for env-credential LIVE/MOCK writes (comma domains):
 *   MCFLY_SPEND_OAUTH_SHOPS=partner.myshopify.com,other.myshopify.com
 * Overnight live (when creds present): MCFLY_LIVE_META=1 / MCFLY_LIVE_GOOGLE=1
 *
 * Does not claim Meta/Google App Review is complete — humans must clear that gate.
 */

export function isSpendOauthEnabled(): boolean {
  return process.env.MCFLY_SPEND_OAUTH === "1";
}

export function isSpendOauthMockAllowed(): boolean {
  return process.env.MCFLY_SPEND_OAUTH_MOCK === "1";
}

/** Normalize myshopify domain for allowlist compare (lowercase, no protocol/path). */
export function normalizeSpendOauthShopDomain(shop: string): string {
  return shop
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

/**
 * Comma-separated shop domains allowed to receive LIVE env-credential or MOCK
 * connector writes. Empty/unset → nobody (fail-closed). Prevents one Meta/Google
 * ad account in process.env from contaminating every shop that clicks Connect.
 */
export function parseSpendOauthShopAllowlist(
  raw: string | undefined = process.env.MCFLY_SPEND_OAUTH_SHOPS,
): Set<string> {
  const set = new Set<string>();
  if (!raw?.trim()) return set;
  for (const part of raw.split(",")) {
    const domain = normalizeSpendOauthShopDomain(part);
    if (domain) set.add(domain);
  }
  return set;
}

export function isSpendOauthShopAllowlisted(shopDomain: string): boolean {
  const normalized = normalizeSpendOauthShopDomain(shopDomain);
  if (!normalized) return false;
  return parseSpendOauthShopAllowlist().has(normalized);
}

export const SPEND_OAUTH_SHOP_NOT_ALLOWLISTED =
  "This shop is not allowlisted for env-credential Meta/Google sync (MCFLY_SPEND_OAUTH_SHOPS). Per-shop OAuth / App Review is required — CSV on Spend remains the Free path.";

export function hasMetaOauthCredentials(): boolean {
  return Boolean(
    process.env.META_ACCESS_TOKEN?.trim() &&
      process.env.META_AD_ACCOUNT_ID?.trim(),
  );
}

export function hasGoogleOauthCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim() &&
      process.env.GOOGLE_ADS_CUSTOMER_ID?.trim() &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim() &&
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

/** Inclusive YYYY-MM-DD range for the last N UTC calendar days (including today). */
export function recentUtcDayRange(days: number): { from: string; to: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Math.max(0, days - 1));
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}
