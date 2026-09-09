/**
 * Client-safe Shopify order SoT helpers — no Prisma, no Admin client.
 * Search-syntax $0 is not a trusted quiet period; cancelled drops in-app.
 */

export type ShopifySalesFetchMode = "search" | "recent_scan";

export function includeOrderInSalesSoT(node: {
  cancelledAt?: string | null;
}): boolean {
  const cancelled = node.cancelledAt;
  return cancelled == null || cancelled === "";
}

export function orderCreatedInRange(
  createdAtIso: string | null | undefined,
  range: { start: Date; end: Date },
): boolean {
  if (!createdAtIso) return false;
  const t = Date.parse(createdAtIso);
  if (Number.isNaN(t)) return false;
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export type ShopifySearchExtensions = {
  search?: Array<{
    path?: unknown;
    warnings?: Array<{ message?: string; field?: string } | null> | null;
  } | null> | null;
};

export function shopifySearchHasWarnings(
  extensions: ShopifySearchExtensions | null | undefined,
): boolean {
  const blocks = extensions?.search;
  if (!blocks?.length) return false;
  return blocks.some((block) => (block?.warnings?.length ?? 0) > 0);
}

export function assertShopifySalesFetchMode(
  mode: ShopifySalesFetchMode,
): ShopifySalesFetchMode {
  switch (mode) {
    case "search":
    case "recent_scan":
      return mode;
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unknown sales fetch mode: ${_exhaustive}`);
    }
  }
}
