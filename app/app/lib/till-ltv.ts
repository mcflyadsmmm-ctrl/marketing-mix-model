/**
 * Till LTV copy helpers — Prisma-free so the Customers LTV chip can paint
 * the truncated-lifetime line without pulling the order-facts server.
 */

export function truncatedLifetimeLine(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  const count = Math.trunc(n);
  const who = count === 1 ? "identified buyer has" : "identified buyers have";
  return `${count.toLocaleString()} ${who} a longer Shopify life than this desk stored. LTV is orders on this desk only — not a finished lifetime.`;
}
