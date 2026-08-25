export const FLY_PUBLIC_ORIGIN = "https://mcfly-analytics.fly.dev";

export const FLY_SUPPORT_URL = `${FLY_PUBLIC_ORIGIN}/support`;
export const FLY_PRIVACY_URL = `${FLY_PUBLIC_ORIGIN}/privacy`;
export const FLY_TERMS_URL = `${FLY_PUBLIC_ORIGIN}/terms`;
export const FLY_PRICING_URL = `${FLY_PUBLIC_ORIGIN}/pricing`;

export const PUBLIC_ORIGIN_PATHS = [
  "/",
  "/support",
  "/privacy",
  "/terms",
  "/pricing",
] as const;

export function isPublicOriginPath(pathname: string): boolean {
  return (PUBLIC_ORIGIN_PATHS as readonly string[]).includes(pathname);
}
