import { redirect } from "react-router";

/**
 * Bare Fly origin trust paths 301 to the matching mcflyads.com pages.
 * App URL stays Fly; marketing / legal live on the site.
 */
export const FLY_ORIGIN_SITE_REDIRECTS = {
  privacy: "https://mcflyads.com/privacy",
  support: "https://mcflyads.com/support",
  pricing: "https://mcflyads.com/pricing",
  terms: "https://mcflyads.com/terms",
  faq: "https://mcflyads.com/faq",
} as const;

export type FlyOriginTrustPath = keyof typeof FLY_ORIGIN_SITE_REDIRECTS;

export function flyOriginSiteRedirect(path: FlyOriginTrustPath) {
  return redirect(FLY_ORIGIN_SITE_REDIRECTS[path], 301);
}
