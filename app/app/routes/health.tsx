import type { LoaderFunctionArgs } from "react-router";

/** Hosting health check — no auth. */
export const loader = async (_args: LoaderFunctionArgs) => {
  return Response.json(
    {
      ok: true,
      service: "mcfly-analytics",
      ts: new Date().toISOString(),
    },
    { status: 200 },
  );
};
