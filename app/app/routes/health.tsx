import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

/** Hosting health check — no auth. Requires DB reachable for ok: true. */
export const loader = async (_args: LoaderFunctionArgs) => {
  const ts = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      {
        ok: true,
        service: "mcfly-analytics",
        db: "up",
        ts,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "db_unreachable";
    return Response.json(
      {
        ok: false,
        service: "mcfly-analytics",
        db: "down",
        error: message.slice(0, 200),
        ts,
      },
      { status: 503 },
    );
  }
};
