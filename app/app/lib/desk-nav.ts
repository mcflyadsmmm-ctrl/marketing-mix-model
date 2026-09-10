/**
 * Desk tab links keep the scoreboard clock (`period`) and listing-shot
 * flag (`shot`). Shopify App Bridge already owns `shop` / `host`.
 */

export type DeskNavOpts = {
  period?: string | null;
  shot?: boolean;
  hash?: string;
  extra?: Record<string, string | null | undefined>;
};

/**
 * Primary Admin nav — sales-first. Marketing is one optional tab.
 * Advanced + Spend Allocation stay as routes, linked from Marketing.
 */
export const DESK_PRIMARY_NAV = [
  { path: "/app", label: "Overview" },
  { path: "/app/orders", label: "Orders" },
  { path: "/app/buyers", label: "Buyers" },
  { path: "/app/timing", label: "Timing" },
  { path: "/app/goals", label: "Goals" },
  { path: "/app/spend", label: "Marketing" },
  { path: "/app/settings", label: "Settings" },
] as const;

export function deskNavHref(path: string, opts: DeskNavOpts = {}): string {
  const next = new URLSearchParams();
  const period = opts.period?.trim();
  if (period) next.set("period", period);
  if (opts.shot) next.set("shot", "1");
  if (opts.extra) {
    for (const [key, value] of Object.entries(opts.extra)) {
      const trimmed = value?.trim();
      if (trimmed) next.set(key, trimmed);
    }
  }
  const query = next.toString();
  const hashRaw = opts.hash?.replace(/^#/, "") ?? "";
  const hash = hashRaw ? `#${hashRaw}` : "";
  return `${path}${query ? `?${query}` : ""}${hash}`;
}

export function deskNavHrefFromSearch(
  path: string,
  search: URLSearchParams,
  hash?: string,
): string {
  return deskNavHref(path, {
    period: search.get("period"),
    shot: search.get("shot") === "1",
    hash,
  });
}
