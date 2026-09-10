/**
 * Prisma URL pool knobs. Fly's 2-CPU app defaults to connection_limit=5,
 * which a 3-year SAMPLE seed + nested /app loaders + job tick can exhaust.
 * Append only — never log the URL (passwords).
 */

export const PRISMA_POOL_CONNECTION_LIMIT = 10;
export const PRISMA_POOL_TIMEOUT_SECONDS = 20;

export function withPrismaPoolParams(raw: string): string {
  const url = String(raw ?? "").trim();
  if (!url) return url;
  let next = url;
  if (!/[?&]connection_limit=/.test(next)) {
    next += `${next.includes("?") ? "&" : "?"}connection_limit=${PRISMA_POOL_CONNECTION_LIMIT}`;
  }
  if (!/[?&]pool_timeout=/.test(next)) {
    next += `${next.includes("?") ? "&" : "?"}pool_timeout=${PRISMA_POOL_TIMEOUT_SECONDS}`;
  }
  return next;
}
