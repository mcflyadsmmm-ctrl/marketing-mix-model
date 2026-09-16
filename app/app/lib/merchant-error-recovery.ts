/**
 * Calm merchant copy for route failures.
 * Shopify's default ErrorBoundary paints "Handling response" / Gone HTML.
 */

export type MerchantErrorKind = "session" | "generic";

export type MerchantErrorCopy = {
  kind: MerchantErrorKind;
  title: string;
  body: string;
  retryLabel: string;
  supportHref: "/support";
};

const SESSION_COPY: MerchantErrorCopy = {
  kind: "session",
  title: "Open Mcfly Analytics from Shopify Admin",
  body: "This page needs a Shopify Admin session. Refresh, or reopen the app from Shopify Admin. Nothing was saved as $0.",
  retryLabel: "Refresh",
  supportHref: "/support",
};

const GENERIC_COPY: MerchantErrorCopy = {
  kind: "generic",
  title: "This page didn’t load",
  body: "Nothing was saved. Refresh to try again, or email support if it keeps happening.",
  retryLabel: "Refresh",
  supportHref: "/support",
};

function headerMap(error: unknown): Headers | null {
  if (!error || typeof error !== "object") return null;
  if ("headers" in error && error.headers instanceof Headers) {
    return error.headers;
  }
  return null;
}

export function routeErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  if ("status" in error) {
    const status = Number((error as { status: unknown }).status);
    return Number.isFinite(status) ? status : null;
  }
  return null;
}

/** 401 / reauth headers still need Shopify's iframe-exit path. */
export function shouldDelegateShopifyBoundary(error: unknown): boolean {
  const status = routeErrorStatus(error);
  if (status === 401) return true;
  const headers = headerMap(error);
  if (!headers) return false;
  return Boolean(
    headers.get("X-Shopify-Retry-Invalid-Session-Request") ||
      headers.get("X-Shopify-API-Request-Failure-Reauthorize") ||
      headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url"),
  );
}

export function merchantRouteErrorCopy(error: unknown): MerchantErrorCopy {
  const status = routeErrorStatus(error);
  if (status === 410 || status === 403) return SESSION_COPY;
  return GENERIC_COPY;
}

export const SALES_LOAD_ERROR_HEADING = "Sales didn’t load";
