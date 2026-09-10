import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRISMA_POOL_CONNECTION_LIMIT,
  PRISMA_POOL_TIMEOUT_SECONDS,
  withPrismaPoolParams,
} from "./prisma-pool";

describe("withPrismaPoolParams", () => {
  it("appends pool knobs on a bare postgres URL", () => {
    const next = withPrismaPoolParams("postgres://u:p@host:5432/mcfly");
    expect(next).toContain(`connection_limit=${PRISMA_POOL_CONNECTION_LIMIT}`);
    expect(next).toContain(`pool_timeout=${PRISMA_POOL_TIMEOUT_SECONDS}`);
    expect(next.startsWith("postgres://u:p@host:5432/mcfly?")).toBe(true);
  });

  it("appends with & when the URL already has query params", () => {
    const next = withPrismaPoolParams(
      "postgres://u:p@host:5432/mcfly?sslmode=require",
    );
    expect(next).toContain("sslmode=require");
    expect(next).toContain(`connection_limit=${PRISMA_POOL_CONNECTION_LIMIT}`);
    expect(next).toContain(`pool_timeout=${PRISMA_POOL_TIMEOUT_SECONDS}`);
  });

  it("does not duplicate knobs that are already set", () => {
    const next = withPrismaPoolParams(
      "postgres://u:p@host:5432/mcfly?connection_limit=8&pool_timeout=30",
    );
    expect(next.match(/connection_limit=/g)).toHaveLength(1);
    expect(next.match(/pool_timeout=/g)).toHaveLength(1);
    expect(next).toContain("connection_limit=8");
    expect(next).toContain("pool_timeout=30");
  });
});

describe("db.server pool wiring", () => {
  it("creates Prisma with withPrismaPoolParams", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "../db.server.ts"), "utf8");
    expect(src).toContain("withPrismaPoolParams");
    expect(src).toContain("datasources");
  });
});
