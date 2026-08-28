/**
 * Desk tab links keep the scoreboard clock (`period`) and listing-shot
 * flag (`shot`). Shopify App Bridge already owns `shop` / `host`.
 */

export type DeskNavOpts = {
  period?: string | null;
  shot?: boolean;
  hash?: string;
};

export function deskNavHref(path: string, opts: DeskNavOpts = {}): string {
  const next = new URLSearchParams();
  const period = opts.period?.trim();
  if (period) next.set("period", period);
  if (opts.shot) next.set("shot", "1");
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
