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
  adminLabel: string;
  supportHref: "/support";
};

const SESSION_COPY: MerchantErrorCopy = {
  kind: "session",
  title: "Open Mcfly Analytics from Shopify Admin",
  body: "This page needs a Shopify Admin session. Retry, or open Shopify Admin. Nothing was saved as $0.",
  retryLabel: "Retry",
  adminLabel: "Open Shopify Admin",
  supportHref: "/support",
};

const GENERIC_COPY: MerchantErrorCopy = {
  kind: "generic",
  title: "This page didn’t load",
  body: "Nothing was saved. Retry, or open Shopify Admin if the session dropped.",
  retryLabel: "Retry",
  adminLabel: "Open Shopify Admin",
  supportHref: "/support",
};

/** Body used when a data-request 410 is rewritten so turbo-stream can decode it. */
export const SESSION_RECOVERY_DATA = SESSION_COPY.body;

const SHOPIFY_ADMIN_HOME = "https://admin.shopify.com";

/** Client-safe Admin top-frame URL. Generic home when the shop is unknown. */
export function shopifyAdminHref(shop?: string | null): string {
  const handle = (shop ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.myshopify\.com$/i, "")
    .replace(/\/$/, "");
  if (handle && /^[a-z0-9][a-z0-9-]*$/.test(handle)) {
    return `${SHOPIFY_ADMIN_HOME}/store/${handle}`;
  }
  return SHOPIFY_ADMIN_HOME;
}

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

/** 401 / reauth headers still need Shopify's iframe-exit path. Never 410. */
export function shouldDelegateShopifyBoundary(error: unknown): boolean {
  const status = routeErrorStatus(error);
  if (status === 410 || status === 403) return false;
  if (status === 401) return true;
  const headers = headerMap(error);
  if (!headers) return false;
  return Boolean(
    headers.get("X-Shopify-Retry-Invalid-Session-Request") ||
      headers.get("X-Shopify-API-Request-Failure-Reauthorize") ||
      headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url"),
  );
}

function errorData(error: unknown): unknown {
  if (!error || typeof error !== "object" || !("data" in error)) return null;
  return (error as { data: unknown }).data;
}

/**
 * Shopify paints `error.data || "Handling response"`. Empty ErrorResponses
 * (common on 401 reauth) must not leak that fallback onto book pages.
 */
export function shopifyErrorResponseLooksEmpty(error: unknown): boolean {
  const data = errorData(error);
  if (data == null) return true;
  if (typeof data === "string") {
    const text = data.trim();
    return text === "" || /^handling response$/i.test(text) || /^gone$/i.test(text);
  }
  if (typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const message = rec.message ?? rec.error ?? rec.statusText;
    if (typeof message === "string" && message.trim()) {
      return /^handling response$/i.test(message.trim()) || /^gone$/i.test(message.trim());
    }
    return Object.keys(rec).length === 0;
  }
  return true;
}

/** Keep Shopify's visual boundary; replace empty / Handling response data. */
export function decorateShopifyBoundaryError(error: unknown): unknown {
  if (!shopifyErrorResponseLooksEmpty(error)) return error;
  if (error && typeof error === "object") {
    try {
      Object.defineProperty(error, "data", {
        value: SESSION_COPY.body,
        writable: true,
        configurable: true,
      });
      return error;
    } catch {
      return {
        status: routeErrorStatus(error) ?? 401,
        data: SESSION_COPY.body,
      };
    }
  }
  return { status: 401, data: SESSION_COPY.body };
}

export function merchantRouteErrorCopy(error: unknown): MerchantErrorCopy {
  const status = routeErrorStatus(error);
  if (status === 410 || status === 403) return SESSION_COPY;
  return GENERIC_COPY;
}

export const SALES_LOAD_ERROR_HEADING = "Sales didn’t load";
