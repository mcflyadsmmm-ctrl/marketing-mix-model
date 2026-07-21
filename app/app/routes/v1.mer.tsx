import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { MerQuerySchema } from "@mcfly/api-contract";
import { authenticateApiRequest, jsonError } from "../lib/api-auth.server";
import { buildMerResponse } from "../lib/mcfly-api.server";
import { fetchShopifySalesForShop } from "../lib/shopify-sales-api.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const url = new URL(request.url);
  const parsed = MerQuerySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    includeAllocation: url.searchParams.get("includeAllocation") ?? true,
  });

  if (!parsed.success) {
    return jsonError(parsed.error.message, 400, "invalid_query");
  }

  const { from, to, includeAllocation } = parsed.data;
  const range = {
    start: new Date(`${from}T00:00:00`),
    end: new Date(`${to}T23:59:59.999`),
    label: `${from} → ${to}`,
  };

  let sales = 0;
  let salesWarning: string | undefined;
  try {
    const result = await fetchShopifySalesForShop(auth.shopDomain, range);
    sales = result.totalSales;
    if (result.warning) salesWarning = result.warning;
  } catch (err) {
    salesWarning =
      err instanceof Error ? err.message : "Shopify sales unavailable";
  }

  const body = await buildMerResponse(
    auth.shopId,
    { from, to },
    sales,
    { includeAllocation },
  );

  const headers: Record<string, string> = {};
  if (salesWarning) {
    headers["X-Mcfly-Warning"] = salesWarning;
  }

  return Response.json(body, { status: 200, headers });
};

export const action = async (_args: ActionFunctionArgs) => {
  return jsonError("Method not allowed", 405);
};
