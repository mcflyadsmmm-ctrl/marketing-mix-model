import { PrismaClient } from "@prisma/client";
import { withPrismaPoolParams } from "./lib/prisma-pool";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL?.trim();
  return new PrismaClient(
    raw ? { datasources: { db: { url: withPrismaPoolParams(raw) } } } : undefined,
  );
}

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
